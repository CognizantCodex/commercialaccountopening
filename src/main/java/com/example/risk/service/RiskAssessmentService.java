package com.example.risk.service;

import com.example.risk.model.CommercialCustomerRequest;
import com.example.risk.model.RiskAssessmentResult;
import com.example.risk.repository.AssessmentStore;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class RiskAssessmentService {

    private final RiskScoringEngine riskScoringEngine;
    private final AssessmentStore assessmentStore;

    public RiskAssessmentService(RiskScoringEngine riskScoringEngine, AssessmentStore assessmentStore) {
        this.riskScoringEngine = riskScoringEngine;
        this.assessmentStore = assessmentStore;
    }

    public RiskAssessmentResult assess(CommercialCustomerRequest request) {
        RiskAssessmentResult result = riskScoringEngine.assess(request);
        return assessmentStore.save(result);
    }

    public RiskAssessmentResult getById(UUID assessmentId) {
        return assessmentStore.findById(assessmentId)
                .orElseThrow(() -> new IllegalArgumentException("Assessment not found: " + assessmentId));
    }

    public List<RiskAssessmentResult> getAll() {
        return assessmentStore.findAll();
    }
}
