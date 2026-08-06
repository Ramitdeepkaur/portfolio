package com.portfolio.manager.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.List;

/**
 * Thin wrapper around Gemini's Generative Language API using Spring RestClient.
 */
@Service
public class GeminiService {

    public record Content(List<Part> parts, String role) {}
    public record Part(String text) {}

    public record GeminiRequest(List<Content> contents) {}

    public record GeminiResponse(List<Candidate> candidates) {}

    public record Candidate(Content content) {}

    private static final Logger log = LoggerFactory.getLogger(GeminiService.class);
    private static final String MODEL_NAME = "gemini-2.0-flash";

    private final String apiKey;
    private final String model;
    private final long timeoutMs;
    private final RestClient restClient;

    public GeminiService(
            @Value("${gemini.api-key:}") String apiKey,
            @Value("${gemini.model:gemini-2.0-flash}") String model,
            @Value("${gemini.timeout-ms:60000}") long timeoutMs) {
        this.apiKey = apiKey;
        this.model = model;
        this.timeoutMs = timeoutMs;

        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout((int) timeoutMs);
        requestFactory.setReadTimeout((int) timeoutMs);

        this.restClient = RestClient.builder()
                .baseUrl("https://generativelanguage.googleapis.com/v1beta/models/" + MODEL_NAME + ":generateContent")
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .requestFactory(requestFactory)
                .build();
    }

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    public String getModel() {
        return MODEL_NAME;
    }

    /**
     * Sends a generative request to Gemini and returns the response text.
     *
     * @throws IllegalStateException if the API key is not configured
     */
    public String generateContent(List<OpenAiService.ChatMessage> messages) {
        if (!isConfigured()) {
            throw new IllegalStateException("Gemini API key is not configured");
        }

        List<GeminiService.Content> contents = new ArrayList<>();

        for (OpenAiService.ChatMessage msg : messages) {
            String role = "assistant".equals(msg.role()) ? "model" : "user";
            contents.add(new GeminiService.Content(List.of(new GeminiService.Part(msg.content())), role));
        }

        GeminiService.GeminiRequest request = new GeminiService.GeminiRequest(contents);

        try {
            GeminiService.GeminiResponse response = restClient.post()
                    .uri("?key=" + apiKey)
                    .body(request)
                    .retrieve()
                    .body(GeminiService.GeminiResponse.class);

            if (response == null || response.candidates() == null || response.candidates().isEmpty()
                    || response.candidates().get(0).content() == null
                    || response.candidates().get(0).content().parts() == null
                    || response.candidates().get(0).content().parts().isEmpty()) {
                throw new IllegalStateException("Gemini returned an empty response");
            }
            return response.candidates().get(0).content().parts().get(0).text();
        } catch (Exception e) {
            log.error("Gemini generative request failed", e);
            throw new IllegalStateException("Failed to reach Gemini: " + e.getMessage(), e);
        }
    }
}
