package com.portfolio.manager.service;

import com.portfolio.manager.dto.HoldingResponseDTO;
import com.portfolio.manager.entity.Holding;
import com.portfolio.manager.entity.MarketData;
import com.portfolio.manager.repository.HoldingRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class HoldingService {

    private final HoldingRepository holdingRepository;
    private final MarketDataService marketDataService;

    public HoldingService(HoldingRepository holdingRepository, MarketDataService marketDataService) {
        this.holdingRepository = holdingRepository;
        this.marketDataService = marketDataService;
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
        return convertToDTO(saved);
    }

    @Transactional
    public HoldingResponseDTO updateHolding(Long id, Holding details) {
        Holding holding = holdingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Holding not found with id: " + id));

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
        return convertToDTO(updated);
    }

    @Transactional
    public void deleteHolding(Long id) {
        if (!holdingRepository.existsById(id)) {
            throw new RuntimeException("Holding not found with id: " + id);
        }
        holdingRepository.deleteById(id);
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
