package com.example.risk.controller;

import com.example.risk.model.CommercialCustomerRequest;
import com.example.risk.model.RiskAssessmentResult;
import com.example.risk.service.RiskAssessmentService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/risk-assessments")
public class RiskAssessmentController {

    private final RiskAssessmentService riskAssessmentService;

    public RiskAssessmentController(RiskAssessmentService riskAssessmentService) {
        this.riskAssessmentService = riskAssessmentService;
    }

    @PostMapping
    public RiskAssessmentResult assess(@Valid @RequestBody CommercialCustomerRequest request) {
        return riskAssessmentService.assess(request);
    }

    @GetMapping("/{assessmentId}")
    public RiskAssessmentResult getById(@PathVariable UUID assessmentId) {
        return riskAssessmentService.getById(assessmentId);
    }

    @GetMapping
    public List<RiskAssessmentResult> getAll() {
        return riskAssessmentService.getAll();
    }
}
