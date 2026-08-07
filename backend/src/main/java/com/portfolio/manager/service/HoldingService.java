package com.portfolio.manager.service;

import com.portfolio.manager.dto.FilterOptionsDTO;
import com.portfolio.manager.dto.HoldingResponseDTO;
import com.portfolio.manager.dto.HoldingSearchCriteria;
import com.portfolio.manager.dto.SellHoldingResponseDTO;
import com.portfolio.manager.entity.Holding;
import com.portfolio.manager.entity.MarketData;
import com.portfolio.manager.entity.Transaction;
import com.portfolio.manager.market.MarketDataException;
import com.portfolio.manager.repository.HoldingRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
public class HoldingService {

    private final HoldingRepository holdingRepository;
    private final MarketDataService marketDataService;
    private final TransactionService transactionService;
    private final AuditLogService auditLogService;

    public HoldingService(
            HoldingRepository holdingRepository,
            MarketDataService marketDataService,
            TransactionService transactionService,
            AuditLogService auditLogService) {
        this.holdingRepository = holdingRepository;
        this.marketDataService = marketDataService;
        this.transactionService = transactionService;
        this.auditLogService = auditLogService;
    }

    public List<HoldingResponseDTO> getAllHoldings() {
        return holdingRepository.findAll()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public HoldingResponseDTO getHoldingById(Long id) {
        Holding holding = holdingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Holding not found with id: " + id));
        return convertToDTO(holding);
    }

    public List<HoldingResponseDTO> searchHoldings(HoldingSearchCriteria criteria) {
        List<Holding> holdings = holdingRepository.findAll();
        List<HoldingResponseDTO> mapped = holdings.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());

        String query = criteria.getQuery() == null ? "" : criteria.getQuery().trim().toLowerCase(Locale.ROOT);
        List<String> assetTypes = criteria.getAssetTypes() == null ? List.of() : criteria.getAssetTypes().stream().filter(s -> s != null && !s.isBlank()).map(String::toUpperCase).collect(Collectors.toList());
        List<String> sectors = criteria.getSectors() == null ? List.of() : criteria.getSectors().stream().filter(s -> s != null && !s.isBlank()).map(String::toUpperCase).collect(Collectors.toList());

        return mapped.stream()
                .filter(dto -> {
                    if (!query.isEmpty()) {
                        String haystack = String.join(" ", dto.getAssetName(), dto.getTickerSymbol(), dto.getSector(), dto.getAssetType()).toLowerCase(Locale.ROOT);
                        if (!haystack.contains(query)) {
                            return false;
                        }
                    }
                    if (!assetTypes.isEmpty() && !assetTypes.contains(dto.getAssetType() == null ? "" : dto.getAssetType().toUpperCase(Locale.ROOT))) {
                        return false;
                    }
                    if (!sectors.isEmpty() && !sectors.contains(dto.getSector() == null ? "" : dto.getSector().toUpperCase(Locale.ROOT))) {
                        return false;
                    }
                    if (criteria.getMinValue() != null && (dto.getCurrentValue() == null || dto.getCurrentValue().compareTo(criteria.getMinValue()) < 0)) {
                        return false;
                    }
                    if (criteria.getMaxValue() != null && (dto.getCurrentValue() == null || dto.getCurrentValue().compareTo(criteria.getMaxValue()) > 0)) {
                        return false;
                    }
                    if (criteria.getMinGain() != null && (dto.getProfitPercentage() == null || dto.getProfitPercentage().compareTo(criteria.getMinGain()) < 0)) {
                        return false;
                    }
                    if (criteria.getMaxGain() != null && (dto.getProfitPercentage() == null || dto.getProfitPercentage().compareTo(criteria.getMaxGain()) > 0)) {
                        return false;
                    }
                    return true;
                })
                .sorted(buildComparator(criteria.getSortBy(), criteria.getOrder()))
                .skip((long) ((criteria.getPage() == null ? 0 : criteria.getPage()) * (criteria.getSize() == null ? 20 : criteria.getSize())))
                .limit(criteria.getSize() == null ? 20 : criteria.getSize())
                .collect(Collectors.toList());
    }

    public FilterOptionsDTO getFilterOptions() {
        List<Holding> holdings = holdingRepository.findAll();
        List<String> assetTypes = holdings.stream()
                .map(Holding::getAssetType)
                .filter(s -> s != null && !s.isBlank())
                .map(String::toUpperCase)
                .distinct()
                .sorted()
                .collect(Collectors.toList());
        List<String> sectors = holdings.stream()
                .map(Holding::getSector)
                .filter(s -> s != null && !s.isBlank())
                .map(String::toUpperCase)
                .distinct()
                .sorted()
                .collect(Collectors.toList());

        BigDecimal minPrice = holdings.stream()
                .map(Holding::getPurchasePrice)
                .filter(p -> p != null)
                .min(Comparator.naturalOrder())
                .orElse(BigDecimal.ZERO);
        BigDecimal maxPrice = holdings.stream()
                .map(Holding::getPurchasePrice)
                .filter(p -> p != null)
                .max(Comparator.naturalOrder())
                .orElse(BigDecimal.ZERO);

        FilterOptionsDTO dto = new FilterOptionsDTO();
        dto.setAssetTypes(assetTypes);
        dto.setSectors(sectors);
        dto.setMinPrice(minPrice);
        dto.setMaxPrice(maxPrice);
        return dto;
    }

    @Transactional
    public HoldingResponseDTO createHolding(Holding holding) {
        if (holding.getCurrency() == null || holding.getCurrency().isEmpty()) {
            holding.setCurrency("USD");
        }
        if (holding.getExchange() == null || holding.getExchange().isEmpty()) {
            holding.setExchange("NASDAQ");
        }
        if (holding.getSector() == null || holding.getSector().isEmpty()) {
            holding.setSector("General");
        }

        boolean isCash = CASH_ASSET_TYPE.equalsIgnoreCase(holding.getAssetType());
        if (!isCash && holding.getQuantity() != null && holding.getQuantity() > 0 && holding.getPurchasePrice() != null) {
            BigDecimal cost = BigDecimal.valueOf(holding.getQuantity())
                    .multiply(holding.getPurchasePrice())
                    .setScale(2, RoundingMode.HALF_UP);
            debitCashHolding(cost, holding.getTickerSymbol());
        }

        Holding saved = holdingRepository.save(holding);

        if (saved.getQuantity() != null && saved.getQuantity() > 0 && saved.getPurchasePrice() != null) {
            Transaction transaction = new Transaction();
            transaction.setHolding(saved.getTickerSymbol());
            transaction.setType("BUY");
            transaction.setQuantity(saved.getQuantity());
            transaction.setPrice(saved.getPurchasePrice());
            transaction.setAmount(saved.getPurchasePrice().multiply(BigDecimal.valueOf(saved.getQuantity()))
                    .setScale(2, RoundingMode.HALF_UP));
            transaction.setDate(saved.getPurchaseDate() != null ? saved.getPurchaseDate() : LocalDate.now());
            transaction.setNotes(isCash ? "Cash deposit" : "Initial purchase of new holding");
            transactionService.createTransaction(transaction);
        }

        auditLogService.record(
                "CREATE",
                "HOLDING",
                saved.getTickerSymbol(),
                "Added holding " + saved.getTickerSymbol() + " (" + saved.getQuantity() + " shares)",
                "—",
                describeHolding(saved));

        return convertToDTO(saved);
    }

    @Transactional
    public HoldingResponseDTO updateHolding(Long id, Holding details) {
        Holding holding = holdingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Holding not found with id: " + id));
        Double originalQuantity = holding.getQuantity();
        BigDecimal originalPrice = holding.getPurchasePrice();
        String before = describeHolding(holding);

        holding.setAssetName(details.getAssetName());
        holding.setTickerSymbol(details.getTickerSymbol());
        holding.setAssetType(details.getAssetType());
        holding.setQuantity(details.getQuantity());
        holding.setPurchasePrice(details.getPurchasePrice());
        holding.setPurchaseDate(details.getPurchaseDate());
        if (details.getSector() != null) holding.setSector(details.getSector());
        if (details.getExchange() != null) holding.setExchange(details.getExchange());
        if (details.getCurrency() != null) holding.setCurrency(details.getCurrency());

        Holding updated = holdingRepository.save(holding);

        if (originalQuantity != null && details.getQuantity() != null && !originalQuantity.equals(details.getQuantity())) {
            double delta = details.getQuantity() - originalQuantity;
            BigDecimal price = details.getPurchasePrice() != null ? details.getPurchasePrice() : originalPrice;
            BigDecimal amount = price.multiply(BigDecimal.valueOf(Math.abs(delta))).setScale(2, RoundingMode.HALF_UP);

            boolean isCash = CASH_ASSET_TYPE.equalsIgnoreCase(updated.getAssetType());
            if (!isCash) {
                if (delta > 0) {
                    debitCashHolding(amount, updated.getTickerSymbol());
                } else {
                    creditCashHolding(amount, updated.getTickerSymbol());
                }
            }

            Transaction transaction = new Transaction();
            transaction.setHolding(updated.getTickerSymbol());
            transaction.setType(delta > 0 ? "BUY" : "SELL");
            transaction.setQuantity(Math.abs(delta));
            transaction.setPrice(price);
            transaction.setAmount(amount);
            transaction.setDate(details.getPurchaseDate() != null ? details.getPurchaseDate() : LocalDate.now());
            transaction.setNotes(delta > 0 ? "Additional purchase on holding update" : "Partial sell on holding update");
            transactionService.createTransaction(transaction);
        }

        auditLogService.record(
                "UPDATE",
                "HOLDING",
                updated.getTickerSymbol(),
                "Updated holding " + updated.getTickerSymbol(),
                before,
                describeHolding(updated));

        return convertToDTO(updated);
    }

    @Transactional
    public void deleteHolding(Long id) {
        Holding holding = holdingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Holding not found with id: " + id));

        String before = describeHolding(holding);

        if (holding.getQuantity() != null && holding.getQuantity() > 0 && holding.getPurchasePrice() != null) {
            Transaction transaction = new Transaction();
            transaction.setHolding(holding.getTickerSymbol());
            transaction.setType("SELL");
            transaction.setQuantity(holding.getQuantity());
            transaction.setPrice(holding.getPurchasePrice());
            transaction.setAmount(holding.getPurchasePrice().multiply(BigDecimal.valueOf(holding.getQuantity())));
            transaction.setDate(LocalDate.now());
            transaction.setNotes("Position closed on holding delete");
            transactionService.createTransaction(transaction);
        }

        holdingRepository.deleteById(id);

        auditLogService.record(
                "DELETE",
                "HOLDING",
                holding.getTickerSymbol(),
                "Deleted holding " + holding.getTickerSymbol(),
                before,
                "—");
    }

    private static final double QUANTITY_EPSILON = 1e-6;
    private static final String CASH_ASSET_TYPE = "CASH";
    private static final String CASH_TICKER = "CASH";

    @Transactional
    public SellHoldingResponseDTO sellHolding(Long id, Double quantityToSell, String userNotes) {
        Holding holding = holdingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Holding not found with id: " + id));

        if (CASH_ASSET_TYPE.equalsIgnoreCase(holding.getAssetType())) {
            throw new IllegalArgumentException("Cash holdings cannot be sold");
        }
        if (quantityToSell == null || quantityToSell <= 0) {
            throw new IllegalArgumentException("Sell quantity must be greater than zero");
        }
        if (quantityToSell > holding.getQuantity() + QUANTITY_EPSILON) {
            throw new IllegalArgumentException(
                    "Cannot sell more than you currently hold (" + holding.getQuantity() + " available)");
        }

        String before = describeHolding(holding);
        MarketData marketData = resolveMarketData(holding.getTickerSymbol());
        BigDecimal sellPrice = marketData != null && marketData.getCurrentPrice() != null
                ? marketData.getCurrentPrice()
                : holding.getPurchasePrice();

        BigDecimal proceeds = BigDecimal.valueOf(quantityToSell)
                .multiply(sellPrice)
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal realizedGain = proceeds
                .subtract(BigDecimal.valueOf(quantityToSell).multiply(holding.getPurchasePrice()))
                .setScale(2, RoundingMode.HALF_UP);

        boolean closed = quantityToSell >= holding.getQuantity() - QUANTITY_EPSILON;
        double remainingQuantity;
        String ticker = holding.getTickerSymbol();
        if (closed) {
            holdingRepository.delete(holding);
            remainingQuantity = 0.0;
        } else {
            holding.setQuantity(holding.getQuantity() - quantityToSell);
            holdingRepository.save(holding);
            remainingQuantity = holding.getQuantity();
        }

        Transaction transaction = new Transaction();
        transaction.setHolding(ticker);
        transaction.setType("SELL");
        transaction.setQuantity(quantityToSell);
        transaction.setPrice(sellPrice);
        transaction.setAmount(proceeds);
        transaction.setDate(LocalDate.now());
        String profitLossWord = realizedGain.compareTo(BigDecimal.ZERO) >= 0 ? "profit" : "loss";
        String notesPrefix = String.format(
                "Sold %s: %s shares at %s (proceeds: %s). Sold at a %s of %s.",
                ticker,
                quantityToSell,
                sellPrice,
                proceeds,
                profitLossWord,
                realizedGain.abs());
        String transactionNotes = (userNotes != null && !userNotes.trim().isEmpty())
                ? notesPrefix + " " + userNotes.trim()
                : notesPrefix;
        transaction.setNotes(transactionNotes);
        transactionService.createTransaction(transaction);

        auditLogService.record(
                closed ? "DELETE" : "UPDATE",
                "HOLDING",
                ticker,
                "Sold " + quantityToSell + " of " + ticker + " for " + proceeds,
                before,
                closed ? "—" : describeHolding(holding));

        BigDecimal cashAvailable = creditCashHolding(proceeds, ticker);

        SellHoldingResponseDTO response = new SellHoldingResponseDTO();
        response.setTickerSymbol(ticker);
        response.setQuantitySold(quantityToSell);
        response.setPricePerShare(sellPrice);
        response.setProceeds(proceeds);
        response.setRealizedGain(realizedGain);
        response.setRemainingQuantity(remainingQuantity);
        response.setClosed(closed);
        response.setCashAvailable(cashAvailable);
        return response;
    }

    private BigDecimal debitCashHolding(BigDecimal cost, String buyTicker) {
        List<Holding> cashHoldings = holdingRepository.findByAssetTypeIgnoreCase(CASH_ASSET_TYPE)
                .stream()
                .sorted(Comparator.comparing(Holding::getId))
                .collect(Collectors.toList());

        BigDecimal totalCash = cashHoldings.stream()
                .map(c -> BigDecimal.valueOf(c.getQuantity() != null ? c.getQuantity() : 0d))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (totalCash.compareTo(cost) < 0) {
            throw new IllegalArgumentException(
                    "Insufficient cash balance to complete this purchase. Available cash: "
                            + totalCash.setScale(2, RoundingMode.HALF_UP)
                            + ". Please add cash to your portfolio before buying.");
        }

        BigDecimal remainingToDebit = cost;
        for (Holding cash : cashHoldings) {
            if (remainingToDebit.compareTo(BigDecimal.ZERO) <= 0) {
                break;
            }
            String cashBefore = describeHolding(cash);
            BigDecimal available = BigDecimal.valueOf(cash.getQuantity() != null ? cash.getQuantity() : 0d);
            BigDecimal deduction = available.min(remainingToDebit);
            cash.setQuantity(available.subtract(deduction).doubleValue());
            Holding saved = holdingRepository.save(cash);
            remainingToDebit = remainingToDebit.subtract(deduction);

            auditLogService.record(
                    "UPDATE",
                    "HOLDING",
                    CASH_TICKER,
                    "Cash decreased to fund purchase of " + buyTicker,
                    cashBefore,
                    describeHolding(saved));
        }

        BigDecimal total = BigDecimal.ZERO;
        for (Holding c : holdingRepository.findByAssetTypeIgnoreCase(CASH_ASSET_TYPE)) {
            total = total.add(BigDecimal.valueOf(c.getQuantity() != null ? c.getQuantity() : 0d));
        }
        return total.setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal creditCashHolding(BigDecimal proceeds, String soldTicker) {
        List<Holding> cashHoldings = holdingRepository.findByAssetTypeIgnoreCase(CASH_ASSET_TYPE);

        if (cashHoldings.isEmpty()) {
            Holding cash = new Holding();
            cash.setAssetName("Cash");
            cash.setTickerSymbol(CASH_TICKER);
            cash.setAssetType(CASH_ASSET_TYPE);
            cash.setQuantity(proceeds.doubleValue());
            cash.setPurchasePrice(BigDecimal.ONE.setScale(2, RoundingMode.HALF_UP));
            cash.setPurchaseDate(LocalDate.now());
            cash.setSector("Cash & Equivalent");
            cash.setExchange("BANK");
            cash.setCurrency("USD");
            Holding saved = holdingRepository.save(cash);

            auditLogService.record(
                    "CREATE",
                    "HOLDING",
                    CASH_TICKER,
                    "Created cash holding from sale proceeds of " + soldTicker,
                    "—",
                    describeHolding(saved));

            return BigDecimal.valueOf(saved.getQuantity()).setScale(2, RoundingMode.HALF_UP);
        }

        Holding cash = cashHoldings.stream()
                .min(Comparator.comparing(Holding::getId))
                .orElseThrow();
        String cashBefore = describeHolding(cash);
        cash.setQuantity(cash.getQuantity() + proceeds.doubleValue());
        Holding saved = holdingRepository.save(cash);

        auditLogService.record(
                "UPDATE",
                "HOLDING",
                CASH_TICKER,
                "Cash increased by proceeds from selling " + soldTicker,
                cashBefore,
                describeHolding(saved));

        BigDecimal total = BigDecimal.ZERO;
        for (Holding c : holdingRepository.findByAssetTypeIgnoreCase(CASH_ASSET_TYPE)) {
            total = total.add(BigDecimal.valueOf(c.getQuantity()));
        }
        return total.setScale(2, RoundingMode.HALF_UP);
    }

    private MarketData resolveMarketData(String tickerSymbol) {
        try {
            return marketDataService.getOrCreateMarketData(tickerSymbol);
        } catch (MarketDataException ex) {
            return null;
        }
    }

    private String describeHolding(Holding holding) {
        return String.format(
                Locale.US,
                "%s (%s) qty=%s price=%s type=%s",
                holding.getTickerSymbol(),
                holding.getAssetName(),
                holding.getQuantity(),
                holding.getPurchasePrice(),
                holding.getAssetType());
    }

    private Comparator<HoldingResponseDTO> buildComparator(String sortBy, String order) {
        Comparator<HoldingResponseDTO> comparator;
        switch (sortBy == null ? "currentValue" : sortBy.toLowerCase(Locale.ROOT)) {
            case "profitloss":
                comparator = Comparator.comparing(HoldingResponseDTO::getProfitLoss, Comparator.nullsLast(BigDecimal::compareTo));
                break;
            case "purchasedate":
                comparator = Comparator.comparing(HoldingResponseDTO::getPurchaseDate, Comparator.nullsLast(Comparator.naturalOrder()));
                break;
            case "quantity":
                comparator = Comparator.comparing(HoldingResponseDTO::getQuantity, Comparator.nullsLast(Double::compareTo));
                break;
            case "percentagegain":
            case "profitpercentage":
                comparator = Comparator.comparing(HoldingResponseDTO::getProfitPercentage, Comparator.nullsLast(BigDecimal::compareTo));
                break;
            case "currentvalue":
            default:
                comparator = Comparator.comparing(HoldingResponseDTO::getCurrentValue, Comparator.nullsLast(BigDecimal::compareTo));
                break;
        }

        if ("ASC".equalsIgnoreCase(order)) {
            return comparator;
        }
        return comparator.reversed();
    }

    public HoldingResponseDTO convertToDTO(Holding holding) {
        MarketData marketData = null;
        try {
            marketData = marketDataService.getOrCreateMarketData(holding.getTickerSymbol());
        } catch (MarketDataException ex) {
            // Yahoo unavailable and no cached quote — value at cost so the portfolio still loads
        }

        BigDecimal currentPrice = marketData != null && marketData.getCurrentPrice() != null
                ? marketData.getCurrentPrice()
                : holding.getPurchasePrice();

        BigDecimal qty = BigDecimal.valueOf(holding.getQuantity());
        BigDecimal investedValue = qty.multiply(holding.getPurchasePrice()).setScale(2, RoundingMode.HALF_UP);
        BigDecimal currentValue = qty.multiply(currentPrice).setScale(2, RoundingMode.HALF_UP);
        BigDecimal profitLoss = currentValue.subtract(investedValue).setScale(2, RoundingMode.HALF_UP);

        BigDecimal profitPercentage = BigDecimal.ZERO;
        if (investedValue.compareTo(BigDecimal.ZERO) > 0) {
            profitPercentage = profitLoss.multiply(new BigDecimal("100"))
                    .divide(investedValue, 2, RoundingMode.HALF_UP);
        }

        BigDecimal todayChangePercentage = BigDecimal.ZERO;
        if (marketData != null
                && marketData.getOpeningPrice() != null
                && marketData.getOpeningPrice().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal todayChange = currentPrice.subtract(marketData.getOpeningPrice());
            todayChangePercentage = todayChange.multiply(new BigDecimal("100"))
                    .divide(marketData.getOpeningPrice(), 2, RoundingMode.HALF_UP);
        }

        HoldingResponseDTO dto = new HoldingResponseDTO();
        dto.setId(holding.getId());
        dto.setAssetName(holding.getAssetName());
        dto.setTickerSymbol(holding.getTickerSymbol());
        dto.setAssetType(holding.getAssetType());
        dto.setQuantity(holding.getQuantity());
        dto.setPurchasePrice(holding.getPurchasePrice());
        dto.setPurchaseDate(holding.getPurchaseDate());
        dto.setSector(holding.getSector());
        dto.setExchange(holding.getExchange());
        dto.setCurrency(holding.getCurrency());

        dto.setCurrentPrice(currentPrice);
        dto.setCurrentValue(currentValue);
        dto.setInvestedValue(investedValue);
        dto.setProfitLoss(profitLoss);
        dto.setProfitPercentage(profitPercentage);
        dto.setTodayChangePercentage(todayChangePercentage);

        return dto;
    }
}
