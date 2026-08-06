package com.portfolio.manager.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 30)
    private String action;

    /** HOLDING, TRANSACTION, SCENARIO */
    @Column(name = "entity_type", nullable = false, length = 40)
    private String entityType;

    /** Display key used for filtering (ticker, scenario name, etc.) */
    @Column(nullable = false, length = 150)
    private String entity;

    @Column(nullable = false, length = 500)
    private String summary;

    @Column(name = "user_name", nullable = false, length = 100)
    @JsonProperty("user")
    private String user;

    @Column(name = "ip_address", length = 64)
    private String ipAddress;

    @Column(name = "before_snapshot", columnDefinition = "TEXT")
    private String before;

    @Column(name = "after_snapshot", columnDefinition = "TEXT")
    private String after;

    @Column(name = "created_at", nullable = false)
    @JsonProperty("date")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime date;

    @PrePersist
    protected void onCreate() {
        if (date == null) {
            date = LocalDateTime.now();
        }
        if (user == null || user.isBlank()) {
            user = "portfolio-user";
        }
        if (ipAddress == null || ipAddress.isBlank()) {
            ipAddress = "local";
        }
    }

    public AuditLog() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getEntityType() {
        return entityType;
    }

    public void setEntityType(String entityType) {
        this.entityType = entityType;
    }

    public String getEntity() {
        return entity;
    }

    public void setEntity(String entity) {
        this.entity = entity;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public String getUser() {
        return user;
    }

    public void setUser(String user) {
        this.user = user;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public String getBefore() {
        return before;
    }

    public void setBefore(String before) {
        this.before = before;
    }

    public String getAfter() {
        return after;
    }

    public void setAfter(String after) {
        this.after = after;
    }

    public LocalDateTime getDate() {
        return date;
    }

    public void setDate(LocalDateTime date) {
        this.date = date;
    }
}
