package com.portfolio.manager.service;

import com.portfolio.manager.dto.FilterOptionsDTO;
import com.portfolio.manager.dto.HoldingResponseDTO;
import com.portfolio.manager.dto.HoldingSearchCriteria;
import com.portfolio.manager.entity.Holding;
import com.portfolio.manager.entity.MarketData;
import com.portfolio.manager.entity.Transaction;
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

    public HoldingService(HoldingRepository holdingRepository, MarketDataService marketDataService, TransactionService transactionService) {
        this.holdingRepository = holdingRepository;
        this.marketDataService = marketDataService;
        this.transactionService = transactionService;
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
        Holding saved = holdingRepository.save(holding);

        if (saved.getQuantity() != null && saved.getQuantity() > 0 && saved.getPurchasePrice() != null) {
            Transaction transaction = new Transaction();
            transaction.setHolding(saved.getTickerSymbol());
            transaction.setType("BUY");
            transaction.setQuantity(saved.getQuantity());
            transaction.setPrice(saved.getPurchasePrice());
            transaction.setAmount(saved.getPurchasePrice().multiply(BigDecimal.valueOf(saved.getQuantity())));
            transaction.setDate(saved.getPurchaseDate() != null ? saved.getPurchaseDate() : LocalDate.now());
            transaction.setNotes("Initial purchase of new holding");
            transactionService.createTransaction(transaction);
        }

        return convertToDTO(saved);
    }

    @Transactional
    public HoldingResponseDTO updateHolding(Long id, Holding details) {
        Holding holding = holdingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Holding not found with id: " + id));
        Double originalQuantity = holding.getQuantity();
        BigDecimal originalPrice = holding.getPurchasePrice();

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
            Transaction transaction = new Transaction();
            transaction.setHolding(updated.getTickerSymbol());
            transaction.setType(delta > 0 ? "BUY" : "SELL");
            transaction.setQuantity(Math.abs(delta));
            transaction.setPrice(details.getPurchasePrice() != null ? details.getPurchasePrice() : originalPrice);
            transaction.setAmount(transaction.getPrice().multiply(BigDecimal.valueOf(Math.abs(delta))));
            transaction.setDate(details.getPurchaseDate() != null ? details.getPurchaseDate() : LocalDate.now());
            transaction.setNotes(delta > 0 ? "Additional purchase on holding update" : "Partial sell on holding update");
            transactionService.createTransaction(transaction);
        }

        return convertToDTO(updated);
    }

    @Transactional
    public void deleteHolding(Long id) {
        if (!holdingRepository.existsById(id)) {
            throw new RuntimeException("Holding not found with id: " + id);
        }
        holdingRepository.deleteById(id);
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
        MarketData marketData = marketDataService.getOrCreateMarketData(holding.getTickerSymbol());
        BigDecimal currentPrice = marketData.getCurrentPrice();

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
        if (marketData.getOpeningPrice() != null && marketData.getOpeningPrice().compareTo(BigDecimal.ZERO) > 0) {
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
