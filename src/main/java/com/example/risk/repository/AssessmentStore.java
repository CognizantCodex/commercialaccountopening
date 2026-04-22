package com.example.risk.repository;

import com.example.risk.model.RiskAssessmentResult;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Repository;

@Repository
public class AssessmentStore {

    private final ConcurrentHashMap<UUID, RiskAssessmentResult> store = new ConcurrentHashMap<>();

    public RiskAssessmentResult save(RiskAssessmentResult result) {
        store.put(result.getAssessmentId(), result);
        return result;
    }

    public Optional<RiskAssessmentResult> findById(UUID id) {
        return Optional.ofNullable(store.get(id));
    }

    public List<RiskAssessmentResult> findAll() {
        return new ArrayList<>(store.values());
    }
}
