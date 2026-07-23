package com.portfolio.manager.service;

import com.portfolio.manager.entity.Holding;
import com.portfolio.manager.repository.HoldingRepository;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVPrinter;
import org.apache.commons.csv.CSVRecord;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
public class CsvExportImportService {

    private final HoldingRepository holdingRepository;
    private final HoldingService holdingService;

    public CsvExportImportService(HoldingRepository holdingRepository, HoldingService holdingService) {
        this.holdingRepository = holdingRepository;
        this.holdingService = holdingService;
    }

    public String exportHoldingsToCsv() {
        List<Holding> holdings = holdingRepository.findAll();
        StringWriter writer = new StringWriter();
        String[] headers = {"AssetName", "TickerSymbol", "AssetType", "Quantity", "PurchasePrice", "PurchaseDate", "Sector", "Exchange", "Currency"};

        try (CSVPrinter csvPrinter = new CSVPrinter(writer, CSVFormat.DEFAULT.builder().setHeader(headers).build())) {
            for (Holding h : holdings) {
                csvPrinter.printRecord(
                        h.getAssetName(),
                        h.getTickerSymbol(),
                        h.getAssetType(),
                        h.getQuantity(),
                        h.getPurchasePrice(),
                        h.getPurchaseDate(),
                        h.getSector(),
                        h.getExchange(),
                        h.getCurrency()
                );
            }
            csvPrinter.flush();
            return writer.toString();
        } catch (IOException e) {
            throw new RuntimeException("Failed to export holdings to CSV", e);
        }
    }

    @Transactional
    public List<Holding> importHoldingsFromCsv(MultipartFile file) {
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8));
             CSVParser csvParser = new CSVParser(reader, CSVFormat.DEFAULT.builder().setHeader().setSkipHeaderRecord(true).setIgnoreHeaderCase(true).setTrim(true).build())) {

            List<Holding> holdingsToSave = new ArrayList<>();
            DateTimeFormatter formatter = DateTimeFormatter.ISO_LOCAL_DATE;

            for (CSVRecord record : csvParser) {
                Holding h = new Holding();
                h.setAssetName(record.get("AssetName"));
                h.setTickerSymbol(record.get("TickerSymbol"));
                h.setAssetType(record.get("AssetType"));
                h.setQuantity(Double.parseDouble(record.get("Quantity")));
                h.setPurchasePrice(new BigDecimal(record.get("PurchasePrice")));

                String pDateStr = record.get("PurchaseDate");
                h.setPurchaseDate(LocalDate.parse(pDateStr, formatter));

                if (record.isMapped("Sector")) h.setSector(record.get("Sector"));
                if (record.isMapped("Exchange")) h.setExchange(record.get("Exchange"));
                if (record.isMapped("Currency")) h.setCurrency(record.get("Currency"));

                holdingsToSave.add(h);
            }

            return holdingRepository.saveAll(holdingsToSave);
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse and import CSV file: " + e.getMessage(), e);
        }
    }
}
