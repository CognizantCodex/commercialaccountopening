package com.example.risk.model;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public class RiskAssessmentResult {

    private UUID assessmentId;
    private OffsetDateTime assessedAt;
    private String customerId;
    private String legalName;
    private int riskScore;
    private String riskRating;
    private String accountDecision;
    private String overrideReason;
    private String llmSummary;
    private List<String> drivers = new ArrayList<>();
    private List<String> requiredControls = new ArrayList<>();
    private List<String> missingDocuments = new ArrayList<>();
    private Map<String, Integer> categoryScores = new LinkedHashMap<>();

    public UUID getAssessmentId() {
        return assessmentId;
    }

    public void setAssessmentId(UUID assessmentId) {
        this.assessmentId = assessmentId;
    }

    public OffsetDateTime getAssessedAt() {
        return assessedAt;
    }

    public void setAssessedAt(OffsetDateTime assessedAt) {
        this.assessedAt = assessedAt;
    }

    public String getCustomerId() {
        return customerId;
    }

    public void setCustomerId(String customerId) {
        this.customerId = customerId;
    }

    public String getLegalName() {
        return legalName;
    }

    public void setLegalName(String legalName) {
        this.legalName = legalName;
    }

    public int getRiskScore() {
        return riskScore;
    }

    public void setRiskScore(int riskScore) {
        this.riskScore = riskScore;
    }

    public String getRiskRating() {
        return riskRating;
    }

    public void setRiskRating(String riskRating) {
        this.riskRating = riskRating;
    }

    public String getAccountDecision() {
        return accountDecision;
    }

    public void setAccountDecision(String accountDecision) {
        this.accountDecision = accountDecision;
    }

    public String getOverrideReason() {
        return overrideReason;
    }

    public void setOverrideReason(String overrideReason) {
        this.overrideReason = overrideReason;
    }

    public String getLlmSummary() {
        return llmSummary;
    }

    public void setLlmSummary(String llmSummary) {
        this.llmSummary = llmSummary;
    }

    public List<String> getDrivers() {
        return drivers;
    }

    public void setDrivers(List<String> drivers) {
        this.drivers = drivers;
    }

    public List<String> getRequiredControls() {
        return requiredControls;
    }

    public void setRequiredControls(List<String> requiredControls) {
        this.requiredControls = requiredControls;
    }

    public List<String> getMissingDocuments() {
        return missingDocuments;
    }

    public void setMissingDocuments(List<String> missingDocuments) {
        this.missingDocuments = missingDocuments;
    }

    public Map<String, Integer> getCategoryScores() {
        return categoryScores;
    }

    public void setCategoryScores(Map<String, Integer> categoryScores) {
        this.categoryScores = categoryScores;
    }
}
