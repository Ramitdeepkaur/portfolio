package com.portfolio.manager.controller;

import com.portfolio.manager.dto.ChatRequestDTO;
import com.portfolio.manager.dto.ChatResponseDTO;
import com.portfolio.manager.service.AdvisorService;
import com.portfolio.manager.service.GeminiService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chat")
@Tag(name = "AI Advisor Chat", description = "AI-powered portfolio advice via the chat assistant")
public class AdvisorController {

    private final AdvisorService advisorService;
    private final GeminiService geminiService;

    public AdvisorController(AdvisorService advisorService, GeminiService geminiService) {
        this.advisorService = advisorService;
        this.geminiService = geminiService;
    }

    @PostMapping
    @Operation(summary = "Send a chat message to the AI advisor with portfolio context")
    public ResponseEntity<ChatResponseDTO> chat(@RequestBody ChatRequestDTO request) {
        String reply;

        if (geminiService.isConfigured()) {
            reply = geminiService.generateContent(advisorService.convertToChatMessages(request));
        } else {
            reply = advisorService.buildFallbackReply(request.getMessages() != null && !request.getMessages().isEmpty()
                    ? request.getMessages().get(request.getMessages().size() - 1).getContent()
                    : "No AI service is configured. Please set the GEMINI_API_KEY environment variable.");
        }

        return ResponseEntity.ok(new ChatResponseDTO(reply));
    }
}
