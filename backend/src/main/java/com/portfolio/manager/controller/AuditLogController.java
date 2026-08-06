package com.portfolio.manager.controller;

import com.portfolio.manager.entity.AuditLog;
import com.portfolio.manager.service.AuditLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/audit-logs")
@Tag(name = "Audit Logs", description = "Portfolio change history / audit trail")
public class AuditLogController {

    private final AuditLogService auditLogService;

    public AuditLogController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @GetMapping
    @Operation(summary = "List audit events, newest first")
    public ResponseEntity<List<AuditLog>> getAuditLogs(
            @RequestParam(required = false) String entity,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String entityType) {
        return ResponseEntity.ok(auditLogService.getAll(entity, action, entityType));
    }

    @GetMapping("/entity/{entity}")
    @Operation(summary = "List audit events for a ticker or entity key")
    public ResponseEntity<List<AuditLog>> getByEntity(@PathVariable String entity) {
        return ResponseEntity.ok(auditLogService.getByEntity(entity));
    }
}
