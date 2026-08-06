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

import java.util.List;

/**
 * Thin wrapper around OpenAI's Chat Completions API using Spring RestClient.
 */
@Service
public class OpenAiService {

    public record ChatMessage(String role, String content) {}

    public record ChatCompletionRequest(
            String model,
            List<ChatMessage> messages,
            double temperature,
            @JsonProperty("max_tokens") int maxTokens) {}

    public record ChatCompletionResponse(List<Choice> choices) {}

    public record Choice(ChoiceMessage message) {}

    public record ChoiceMessage(String content) {}

    private static final Logger log = LoggerFactory.getLogger(OpenAiService.class);
    private static final String OPENAI_URL = "https://api.openai.com/v1/chat/completions";

    private final String apiKey;
    private final String model;
    private final double temperature;
    private final int maxTokens;
    private final RestClient restClient;

    public OpenAiService(
            @Value("${openai.api-key:}") String apiKey,
            @Value("${openai.model:gpt-4o-mini}") String model,
            @Value("${openai.temperature:0.7}") double temperature,
            @Value("${openai.max-tokens:800}") int maxTokens,
            @Value("${openai.timeout-ms:30000}") long timeoutMs) {
        this.apiKey = apiKey;
        this.model = model;
        this.temperature = temperature;
        this.maxTokens = maxTokens;

        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout((int) timeoutMs);
        requestFactory.setReadTimeout((int) timeoutMs);

        this.restClient = RestClient.builder()
                .baseUrl(OPENAI_URL)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .requestFactory(requestFactory)
                .build();
    }

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    public String getModel() {
        return model;
    }

    /**
     * Sends a chat completion request and returns the assistant's reply text.
     *
     * @throws IllegalStateException if the API key is not configured
     */
    public String chat(List<ChatMessage> messages) {
        if (!isConfigured()) {
            throw new IllegalStateException("OpenAI API key is not configured");
        }

        ChatCompletionRequest request =
                new ChatCompletionRequest(model, messages, temperature, maxTokens);

        try {
            ChatCompletionResponse response = restClient.post()
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                    .body(request)
                    .retrieve()
                    .body(ChatCompletionResponse.class);

            if (response == null || response.choices() == null || response.choices().isEmpty()
                    || response.choices().get(0).message() == null) {
                throw new IllegalStateException("OpenAI returned an empty response");
            }
            return response.choices().get(0).message().content();
        } catch (Exception e) {
            log.error("OpenAI chat request failed", e);
            throw new IllegalStateException("Failed to reach OpenAI: " + e.getMessage(), e);
        }
    }
}
