package com.portfolio.manager.repository;

import com.portfolio.manager.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    List<AuditLog> findAllByOrderByDateDesc();

    List<AuditLog> findByEntityIgnoreCaseOrderByDateDesc(String entity);

    List<AuditLog> findByEntityTypeIgnoreCaseOrderByDateDesc(String entityType);

    List<AuditLog> findByActionIgnoreCaseOrderByDateDesc(String action);
}
