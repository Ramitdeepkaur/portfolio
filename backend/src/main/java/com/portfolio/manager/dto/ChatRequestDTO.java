package com.portfolio.manager.dto;

import java.util.List;

public class ChatRequestDTO {
    private List<ChatMessageDTO> messages;

    public ChatRequestDTO() {}

    public ChatRequestDTO(List<ChatMessageDTO> messages) {
        this.messages = messages;
    }

    public List<ChatMessageDTO> getMessages() { return messages; }
    public void setMessages(List<ChatMessageDTO> messages) { this.messages = messages; }
}
