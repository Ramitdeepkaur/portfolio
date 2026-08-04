package com.portfolio.manager.repository;

import com.portfolio.manager.entity.Scenario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ScenarioRepository extends JpaRepository<Scenario, Long> {

    List<Scenario> findByScenarioTypeOrderByCreatedAtDesc(String scenarioType);

    List<Scenario> findAllByOrderByCreatedAtDesc();

    @Query("SELECT s FROM Scenario s WHERE LOWER(s.name) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "OR LOWER(s.description) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<Scenario> search(@Param("keyword") String keyword);
}