package com.portfolio.manager.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.portfolio.manager.dto.AnalyticsDTO;
import com.portfolio.manager.dto.ChatMessageDTO;
import com.portfolio.manager.dto.ChatRequestDTO;
import com.portfolio.manager.dto.HoldingResponseDTO;
import com.portfolio.manager.dto.PortfolioSummaryDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Builds the AI advisor's system context from live portfolio data and
 * forwards the conversation to OpenAI.
 */
@Service
public class AdvisorService {

    private static final Logger log = LoggerFactory.getLogger(AdvisorService.class);

    private static final String SYSTEM_PROMPT = """
            You are an AI portfolio advisor for this personal investment tracking application.
            You are given a snapshot of the user's portfolio (in JSON) and the conversation history.
            Provide concise, practical, and educational advice related to the user's question.

            Rules:
            - Be honest and clear that this is informational/educational and NOT financial advice.
            - Base your recommendations on the provided portfolio data.
            - If the user asks about buying/selling, give a balanced view with risks and
              mention diversification and position sizing.
            - Keep each reply under 200 words.
            - Use short paragraphs or bullet points, with clear headings when helpful.
            - Do NOT invent holdings, prices, or numbers that are not present in the provided data.
            - You may reference typical market/sector reasoning, but flag uncertainty.
            """;

    private final PortfolioService portfolioService;
    private final HoldingService holdingService;
    private final AnalyticsService analyticsService;
    private final OpenAiService openAiService;
    private final GeminiService geminiService;
    private final ObjectMapper objectMapper;

    public AdvisorService(
            PortfolioService portfolioService,
            HoldingService holdingService,
            AnalyticsService analyticsService,
            OpenAiService openAiService,
            GeminiService geminiService,
            ObjectMapper objectMapper) {
        this.portfolioService = portfolioService;
        this.holdingService = holdingService;
        this.analyticsService = analyticsService;
        this.openAiService = openAiService;
        this.geminiService = geminiService;
        this.objectMapper = objectMapper;
    }

    public String advise(ChatRequestDTO request) {
        List<ChatMessageDTO> history = request.getMessages() == null
                ? List.of()
                : request.getMessages();

        if (history.isEmpty()) {
            throw new IllegalArgumentException("Message history must not be empty");
        }

        if (!openAiService.isConfigured() && !geminiService.isConfigured()) {
            return buildFallbackReply(history.get(history.size() - 1).getContent());
        }

        List<OpenAiService.ChatMessage> messages = new ArrayList<>();
        messages.add(new OpenAiService.ChatMessage("system", buildSystemPrompt()));

        for (ChatMessageDTO msg : history) {
            String role = "assistant".equals(msg.getRole()) ? "assistant" : "user";
            if (msg.getContent() != null && !msg.getContent().isBlank()) {
                messages.add(new OpenAiService.ChatMessage(role, msg.getContent()));
            }
        }

        log.info("Sending {} messages to AI (model={})", messages.size(),
                openAiService.isConfigured() ? openAiService.getModel() : geminiService.getModel());

        if (openAiService.isConfigured()) {
            return openAiService.chat(messages);
        } else {
            return geminiService.generateContent(messages);
        }
    }

    public List<OpenAiService.ChatMessage> convertToChatMessages(ChatRequestDTO request) {
        List<OpenAiService.ChatMessage> messages = new ArrayList<>();
        messages.add(new OpenAiService.ChatMessage("system", buildSystemPrompt()));

        if (request.getMessages() != null) {
            for (ChatMessageDTO msg : request.getMessages()) {
                String role = "assistant".equals(msg.getRole()) ? "assistant" : "user";
                if (msg.getContent() != null && !msg.getContent().isBlank()) {
                    messages.add(new OpenAiService.ChatMessage(role, msg.getContent()));
                }
            }
        }

        return messages;
    }

    private String buildSystemPrompt() {
        StringBuilder system = new StringBuilder(SYSTEM_PROMPT);

        try {
            PortfolioSummaryDTO summary = portfolioService.getSummary();
            List<HoldingResponseDTO> holdings = holdingService.getAllHoldings();
            AnalyticsDTO analytics = analyticsService.getAnalytics();

            system.append("\n\n=== USER PORTFOLIO SNAPSHOT ===\n");
            system.append("Summary: ").append(objectMapper.writeValueAsString(summary)).append("\n");
            system.append("\nHoldings:\n").append(objectMapper.writeValueAsString(holdings)).append("\n");
            system.append("\nAnalytics:\n").append(objectMapper.writeValueAsString(analytics)).append("\n");
        } catch (Exception e) {
            log.warn("Failed to build portfolio context for advisor prompt", e);
            system.append("\n(Portfolio data could not be loaded)");
        }

        return system.toString();
    }

    /**
     * Simple heuristic reply used when no AI key is configured so the
     * chat widget still works without external dependencies.
     */
    public String buildFallbackReply(String question) {
        try {
            PortfolioSummaryDTO summary = portfolioService.getSummary();
            List<HoldingResponseDTO> holdings = holdingService.getAllHoldings();

            StringBuilder sb = new StringBuilder();
            sb.append("I'm running in local mode (no OpenAI or Gemini API key configured), so I can only give "
                    + "heuristic observations based on your portfolio data. ");

            if (summary != null) {
                StringBuilder sb2 = new StringBuilder();
                sb2.append("Your portfolio is worth $").append(nf(summary.getTotalPortfolioValue()))
                        .append(" with an overall P&L of ");
                if (summary.getTotalProfitLoss() != null) {
                    sb2.append(summary.getTotalProfitLoss().signum() >= 0 ? "+$" : "-$")
                            .append(summary.getTotalProfitLoss().abs());
                } else {
                    sb2.append("n/a");
                }
                sb2.append(" (")
                   .append(pct(summary.getProfitLossPercentage()))
                   .append("). ");
                sb.append(sb2);
            }

            long losers = holdings.stream()
                    .filter(h -> h.getProfitPercentage() != null
                            && h.getProfitPercentage().signum() < 0)
                    .count();
            long winners = holdings.size() - losers;

            sb.append("You have " + holdings.size() + " holdings, of which " + winners
                    + " are in profit and " + losers + " are at a loss. ");
            sb.append("For informed buy/sell suggestions, please set the OPENAI_API_KEY or GEMINI_API_KEY environment "
                    + "variable and restart the backend.");

            if (question != null && !question.isBlank()) {
                sb.append("\n\n(You asked: \"").append(shorten(question)).append("\")");
            }
            return sb.toString();
        } catch (Exception e) {
            return "I'm in local mode with no AI API key configured. Set OPENAI_API_KEY or GEMINI_API_KEY and restart to get AI-powered portfolio advice.";
        }
    }

    private String shorten(String q) {
        return q.length() > 120 ? q.substring(0, 120) + "…" : q;
    }

    private String nf(java.math.BigDecimal v) {
        if (v == null) return "n/a";
        return String.format("%,.2f", v);
    }

    private String pct(java.math.BigDecimal v) {
        if (v == null) return "n/a";
        return String.format("%.2f%%", v);
    }
}
