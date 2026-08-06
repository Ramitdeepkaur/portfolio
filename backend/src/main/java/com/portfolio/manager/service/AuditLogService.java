package com.portfolio.manager.service;

import com.portfolio.manager.entity.AuditLog;
import com.portfolio.manager.repository.AuditLogRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional(readOnly = true)
    public List<AuditLog> getAll(String entity, String action, String entityType) {
        if (entity != null && !entity.isBlank() && !"all".equalsIgnoreCase(entity)) {
            return auditLogRepository.findByEntityIgnoreCaseOrderByDateDesc(entity.trim());
        }
        if (action != null && !action.isBlank() && !"all".equalsIgnoreCase(action)) {
            return auditLogRepository.findByActionIgnoreCaseOrderByDateDesc(action.trim());
        }
        if (entityType != null && !entityType.isBlank() && !"all".equalsIgnoreCase(entityType)) {
            return auditLogRepository.findByEntityTypeIgnoreCaseOrderByDateDesc(entityType.trim());
        }
        return auditLogRepository.findAllByOrderByDateDesc();
    }

    @Transactional(readOnly = true)
    public List<AuditLog> getByEntity(String entity) {
        return auditLogRepository.findByEntityIgnoreCaseOrderByDateDesc(entity);
    }

    @Transactional
    public AuditLog record(
            String action,
            String entityType,
            String entity,
            String summary,
            String before,
            String after) {
        AuditLog log = new AuditLog();
        log.setAction(action == null ? "UPDATE" : action.toUpperCase(Locale.ROOT));
        log.setEntityType(entityType == null ? "UNKNOWN" : entityType.toUpperCase(Locale.ROOT));
        log.setEntity(entity == null ? "UNKNOWN" : entity);
        log.setSummary(summary == null ? "" : summary);
        log.setBefore(before == null || before.isBlank() ? "—" : before);
        log.setAfter(after == null || after.isBlank() ? "—" : after);
        log.setUser("portfolio-user");
        log.setIpAddress("local");
        return auditLogRepository.save(log);
    }
}
