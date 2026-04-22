package com.example.risk.service;

import com.example.risk.config.RiskPolicyProperties;
import com.example.risk.model.CommercialCustomerRequest;
import com.example.risk.model.RiskAssessmentResult;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.Period;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class RiskScoringEngine {

    private final RiskPolicyProperties properties;
    private final NarrativeService narrativeService;

    public RiskScoringEngine(RiskPolicyProperties properties, NarrativeService narrativeService) {
        this.properties = properties;
        this.narrativeService = narrativeService;
    }

    public RiskAssessmentResult assess(CommercialCustomerRequest request) {
        Map<String, Integer> categoryScores = new LinkedHashMap<>();
        Set<String> drivers = new LinkedHashSet<>();
        Set<String> requiredControls = new LinkedHashSet<>();
        Set<String> missingDocuments = new LinkedHashSet<>();
        Set<String> missingOpeningDocuments = new LinkedHashSet<>();

        categoryScores.put("customer_inherent_risk", scoreCustomerInherentRisk(request, drivers));
        categoryScores.put("industry_business_model_risk", scoreIndustryAndBusinessModelRisk(request, drivers));
        categoryScores.put("geographic_risk", scoreGeographicRisk(request, drivers));
        categoryScores.put("product_account_usage_risk", scoreProductAndUsageRisk(request, drivers));
        categoryScores.put("beneficial_ownership_risk", scoreBeneficialOwnershipRisk(request, drivers, requiredControls));
        categoryScores.put("document_completeness_risk", scoreDocumentCompletenessRisk(
                request,
                drivers,
                missingDocuments,
                missingOpeningDocuments));
        categoryScores.put("transaction_behavior_risk", scoreTransactionBehaviorRisk(request, drivers, missingOpeningDocuments));

        int totalScore = categoryScores.values().stream().mapToInt(Integer::intValue).sum();
        String riskRating = mapRiskRating(totalScore);
        String decision = mapDecision(riskRating);

        OverrideResult overrideResult = applyOverrides(request, missingOpeningDocuments, requiredControls);
        if (overrideResult != null) {
            decision = overrideResult.decision();
            if (overrideResult.forcedRiskRating() != null) {
                riskRating = overrideResult.forcedRiskRating();
            }
            drivers.add(overrideResult.reason());
        }

        requiredControls.addAll(buildControls(riskRating, decision, request, missingDocuments));

        RiskAssessmentResult result = new RiskAssessmentResult();
        result.setAssessmentId(UUID.randomUUID());
        result.setAssessedAt(OffsetDateTime.now());
        result.setCustomerId(request.getCompanyInfo().getRegistrationNumber());
        result.setLegalName(request.getCompanyInfo().getLegalName());
        result.setRiskScore(totalScore);
        result.setRiskRating(riskRating);
        result.setAccountDecision(decision);
        result.setOverrideReason(overrideResult == null ? null : overrideResult.reason());
        result.setDrivers(new ArrayList<>(drivers));
        result.setRequiredControls(new ArrayList<>(requiredControls));
        result.setMissingDocuments(new ArrayList<>(missingDocuments));
        result.setCategoryScores(categoryScores);
        result.setLlmSummary(narrativeService.buildSummary(request, result));
        return result;
    }

    private int scoreCustomerInherentRisk(CommercialCustomerRequest request, Set<String> drivers) {
        int score = 0;
        String entityType = normalize(request.getCompanyInfo().getEntityType());

        if (matches(entityType, "TRUST", "SPV", "NON-PROFIT", "NON PROFIT")) {
            score += 10;
            drivers.add("Higher-risk entity type");
        } else if (matches(entityType, "CORPORATION")) {
            score += 5;
            drivers.add("Corporation entity type");
        }

        int ageInMonths = monthsSince(request.getCompanyInfo().getIncorporationDate());
        if (ageInMonths < properties.getThresholds().getNewEntityMonths()) {
            score += 10;
            drivers.add("Entity incorporated within the last 12 months");
        } else if (ageInMonths < properties.getThresholds().getYoungEntityMonths()) {
            score += 5;
            drivers.add("Entity incorporated within the last 24 months");
        }

        return score;
    }

    private int scoreIndustryAndBusinessModelRisk(CommercialCustomerRequest request, Set<String> drivers) {
        int score = 0;
        String industry = request.getCompanyInfo().getIndustry();
        if (contains(properties.getIndustryBands().getHighRisk(), industry)) {
            score += 25;
            drivers.add("High-risk industry");
        } else if (contains(properties.getIndustryBands().getMediumRisk(), industry)) {
            score += 10;
            drivers.add("Medium-risk industry");
        }

        if (isScaleDisproportionate(request)) {
            score += 10;
            drivers.add("Monthly incoming activity disproportionate to business scale");
        }

        return score;
    }

    private int scoreGeographicRisk(CommercialCustomerRequest request, Set<String> drivers) {
        int score = 0;
        CommercialCustomerRequest.Addresses addresses = request.getAddresses();
        String incorporationCountry = request.getCompanyInfo().getIncorporationCountry();
        String operatingCountry = effectiveOperatingCountry(addresses);

        if (Boolean.FALSE.equals(addresses.getOperatingSameAsRegistered())) {
            score += 5;
            drivers.add("Operating address differs from registered address");
        }

        if (!sameValue(operatingCountry, incorporationCountry)) {
            score += 10;
            drivers.add("Operating country differs from incorporation country");
        }

        if (Boolean.TRUE.equals(request.getBankingProfile().getInternationalActivity())) {
            score += 15;
            drivers.add("International activity requested");
        }

        if (jurisdictionsContainHighRiskCountry(request.getBankingProfile().getJurisdictionsInScope())) {
            score += 20;
            drivers.add("High-risk jurisdiction in scope");
        }

        return score;
    }

    private int scoreProductAndUsageRisk(CommercialCustomerRequest request, Set<String> drivers) {
        int score = 0;
        List<String> products = request.getBankingProfile().getRequestedProducts();

        if (products.stream().anyMatch(product -> contains(properties.getProductMapping().getAchOriginationProducts(), product))) {
            score += 10;
            drivers.add("ACH origination requested");
        }
        if (products.stream().anyMatch(product -> contains(properties.getProductMapping().getWireTransferProducts(), product))) {
            score += 15;
            drivers.add("Wire transfers requested");
        }
        if (!accountPurposeAligns(request)) {
            score += 15;
            drivers.add("Account purpose does not align with stated industry");
        }

        return score;
    }

    private int scoreTransactionBehaviorRisk(
            CommercialCustomerRequest request,
            Set<String> drivers,
            Set<String> missingDocuments) {
        int score = 0;
        CommercialCustomerRequest.BankingProfile profile = request.getBankingProfile();

        if (isHighOpeningDepositWithLimitedSupport(request, missingDocuments)) {
            score += 10;
            drivers.add("High opening deposit with limited supporting evidence");
        }

        BigDecimal monthlyIncoming = safeAmount(profile.getMonthlyIncoming());
        BigDecimal monthlyOutgoing = safeAmount(profile.getMonthlyOutgoing());
        if (monthlyIncoming.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal ratio = monthlyOutgoing.divide(monthlyIncoming, 4, RoundingMode.HALF_UP);
            if (ratio.compareTo(properties.getThresholds().getPassThroughRatioThreshold()) >= 0) {
                score += 10;
                drivers.add("Pass-through transaction behavior");
            }
        }

        return score;
    }

    private int scoreBeneficialOwnershipRisk(
            CommercialCustomerRequest request,
            Set<String> drivers,
            Set<String> requiredControls) {
        int score = 0;
        BigDecimal threshold = properties.getThresholds().getBeneficialOwnershipThreshold();

        for (CommercialCustomerRequest.BeneficialOwner owner : request.getBeneficialOwners()) {
            if (owner.getOwnershipPercentage().compareTo(threshold) >= 0) {
                requiredControls.add("Perform UBO identification and screening");
                if (Boolean.TRUE.equals(owner.getIsAuthorizedSigner())) {
                    score += 10;
                    drivers.add("Beneficial owner with 25%+ ownership is also an authorized signer");
                }
            }
        }

        return score;
    }

    private int scoreDocumentCompletenessRisk(
            CommercialCustomerRequest request,
            Set<String> drivers,
            Set<String> missingDocuments,
            Set<String> missingOpeningDocuments) {
        int score = 0;

        for (String documentField : properties.getDocumentation().getNoAccountOpeningDocuments()) {
            if (!isDocumentPresent(request.getDocuments(), documentField)) {
                String documentName = documentDisplayName(documentField);
                missingDocuments.add(documentName);
                missingOpeningDocuments.add(documentName);
            }
        }

        for (String documentField : properties.getDocumentation().getRiskEscalationDocuments()) {
            if (!isDocumentPresent(request.getDocuments(), documentField)) {
                score += 5;
                missingDocuments.add(documentDisplayName(documentField));
                drivers.add("Address proof outstanding");
            }
        }

        return score;
    }

    private OverrideResult applyOverrides(
            CommercialCustomerRequest request,
            Set<String> missingDocuments,
            Set<String> requiredControls) {
        CommercialCustomerRequest.CompanyInfo companyInfo = request.getCompanyInfo();
        CommercialCustomerRequest.Declarations declarations = request.getDeclarations();

        if (isBlank(companyInfo.getLegalName()) || isBlank(companyInfo.getRegistrationNumber())) {
            requiredControls.add("Obtain complete legal entity identity details");
            return new OverrideResult("REJECT", "Override applied: entity identity incomplete.", "UNACCEPTABLE");
        }
        if (isBlank(companyInfo.getTaxId())) {
            requiredControls.add("Complete tax verification before onboarding");
            return new OverrideResult("HOLD", "Override applied: tax verification required.", null);
        }
        if (contains(properties.getCountryBands().getSanctioned(), companyInfo.getIncorporationCountry())) {
            requiredControls.add("Do not proceed with onboarding");
            return new OverrideResult("REJECT", "Override applied: sanctioned incorporation country detected.", "UNACCEPTABLE");
        }
        if (!allDeclarationsAccepted(declarations)) {
            requiredControls.add("Do not proceed with onboarding");
            return new OverrideResult("REJECT", "Override applied: mandatory declarations not accepted.", "UNACCEPTABLE");
        }
        if (!missingDocuments.isEmpty()) {
            requiredControls.add("Collect required opening documentation");
            return new OverrideResult("NO_ACCOUNT_OPENING", "Override applied: required documents missing.", null);
        }
        if (holdTransactionsRequired(request.getDocuments())) {
            requiredControls.add("Hold transactions until signer identification is received");
            return new OverrideResult("HOLD_TRANSACTIONS", "Override applied: signer identification outstanding.", null);
        }
        return null;
    }

    private List<String> buildControls(
            String riskRating,
            String decision,
            CommercialCustomerRequest request,
            Set<String> missingDocuments) {
        Set<String> controls = new LinkedHashSet<>();

        switch (riskRating) {
            case "LOW" -> controls.add("Standard monitoring");
            case "MEDIUM" -> controls.add("Increased monitoring");
            case "HIGH" -> {
                controls.add("Enhanced Due Diligence");
                controls.add("Manager approval");
            }
            case "UNACCEPTABLE" -> controls.add("Reject or refer to senior committee");
            default -> {
            }
        }

        if (!missingDocuments.isEmpty()) {
            controls.add("Collect missing documentation");
        }
        if (Boolean.TRUE.equals(request.getBankingProfile().getInternationalActivity())) {
            controls.add("Screen international jurisdictions before activation");
        }
        if ("HOLD".equals(decision) || "NO_ACCOUNT_OPENING".equals(decision)) {
            controls.add("Do not open the account until outstanding requirements are resolved");
        }
        if ("HOLD_TRANSACTIONS".equals(decision)) {
            controls.add("Restrict transaction activity until identification is completed");
        }
        if ("REJECT".equals(decision)) {
            controls.add("Do not proceed with onboarding");
        }

        return new ArrayList<>(controls);
    }

    private String mapRiskRating(int score) {
        if (score <= properties.getThresholds().getLowMax()) {
            return "LOW";
        }
        if (score <= properties.getThresholds().getMediumMax()) {
            return "MEDIUM";
        }
        if (score <= properties.getThresholds().getHighMax()) {
            return "HIGH";
        }
        return "UNACCEPTABLE";
    }

    private String mapDecision(String riskRating) {
        return switch (riskRating) {
            case "LOW" -> "AUTO_APPROVE";
            case "MEDIUM" -> "APPROVE_WITH_INCREASED_MONITORING";
            case "HIGH" -> "EDD_MANAGER_APPROVAL";
            default -> "SENIOR_COMMITTEE";
        };
    }

    private boolean allDeclarationsAccepted(CommercialCustomerRequest.Declarations declarations) {
        return Boolean.TRUE.equals(declarations.getCertifyAuthority())
                && Boolean.TRUE.equals(declarations.getCertifyBeneficialOwners())
                && Boolean.TRUE.equals(declarations.getConfirmTaxCompliance())
                && Boolean.TRUE.equals(declarations.getConfirmTerms());
    }

    private boolean holdTransactionsRequired(CommercialCustomerRequest.Documents documents) {
        return properties.getDocumentation().getHoldTransactionDocuments().stream()
                .anyMatch(documentField -> !isDocumentPresent(documents, documentField));
    }

    private boolean isScaleDisproportionate(CommercialCustomerRequest request) {
        BigDecimal monthlyIncoming = safeAmount(request.getBankingProfile().getMonthlyIncoming());
        BigDecimal annualRevenue = safeAmount(request.getCompanyInfo().getAnnualRevenue());
        Integer employeeCount = request.getCompanyInfo().getEmployeeCount();

        if (annualRevenue.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal annualizedIncoming = monthlyIncoming.multiply(BigDecimal.valueOf(12));
            BigDecimal allowed = annualRevenue.multiply(properties.getThresholds().getAnnualizedRevenueMultiplier());
            if (annualizedIncoming.compareTo(allowed) > 0) {
                return true;
            }
        }

        if (employeeCount != null && employeeCount > 0) {
            BigDecimal perEmployeeFlow = monthlyIncoming.divide(BigDecimal.valueOf(employeeCount), 2, RoundingMode.HALF_UP);
            return perEmployeeFlow.compareTo(properties.getThresholds().getMonthlyIncomingPerEmployeeLimit()) > 0;
        }

        return false;
    }

    private boolean accountPurposeAligns(CommercialCustomerRequest request) {
        String industry = normalize(request.getCompanyInfo().getIndustry());
        List<String> keywords = properties.getConsistency().getIndustryPurposeKeywords().entrySet().stream()
                .filter(entry -> normalize(entry.getKey()).equals(industry))
                .map(Map.Entry::getValue)
                .findFirst()
                .orElse(List.of());

        if (keywords.isEmpty()) {
            return true;
        }

        String purpose = normalize(request.getBankingProfile().getAccountPurpose());
        return keywords.stream().map(this::normalize).anyMatch(purpose::contains);
    }

    private boolean isHighOpeningDepositWithLimitedSupport(
            CommercialCustomerRequest request,
            Set<String> missingDocuments) {
        BigDecimal openingDeposit = safeAmount(request.getBankingProfile().getExpectedOpeningDeposit());
        if (openingDeposit.compareTo(properties.getThresholds().getHighOpeningDeposit()) < 0) {
            return false;
        }
        return !Boolean.TRUE.equals(request.getDocuments().getSignerIdentification())
                || !Boolean.TRUE.equals(request.getDocuments().getAddressProof())
                || !missingDocuments.isEmpty();
    }

    private boolean jurisdictionsContainHighRiskCountry(String jurisdictionsInScope) {
        if (isBlank(jurisdictionsInScope)) {
            return false;
        }
        for (String jurisdiction : jurisdictionsInScope.split(",")) {
            if (contains(properties.getCountryBands().getHighRisk(), jurisdiction)) {
                return true;
            }
        }
        return false;
    }

    private String effectiveOperatingCountry(CommercialCustomerRequest.Addresses addresses) {
        if (Boolean.TRUE.equals(addresses.getOperatingSameAsRegistered())) {
            return addresses.getCountry();
        }
        if (!isBlank(addresses.getOperatingCountry())) {
            return addresses.getOperatingCountry();
        }
        return addresses.getCountry();
    }

    private int monthsSince(LocalDate date) {
        Period period = Period.between(date, LocalDate.now());
        return period.getYears() * 12 + period.getMonths();
    }

    private boolean isDocumentPresent(CommercialCustomerRequest.Documents documents, String documentField) {
        return switch (documentField) {
            case "certificateOfFormation" -> Boolean.TRUE.equals(documents.getCertificateOfFormation());
            case "taxIdLetter" -> Boolean.TRUE.equals(documents.getTaxIdLetter());
            case "ownershipChart" -> Boolean.TRUE.equals(documents.getOwnershipChart());
            case "boardResolution" -> Boolean.TRUE.equals(documents.getBoardResolution());
            case "signerIdentification" -> Boolean.TRUE.equals(documents.getSignerIdentification());
            case "addressProof" -> Boolean.TRUE.equals(documents.getAddressProof());
            default -> true;
        };
    }

    private String documentDisplayName(String documentField) {
        return switch (documentField) {
            case "certificateOfFormation" -> "Certificate of Formation";
            case "taxIdLetter" -> "Tax ID Letter";
            case "ownershipChart" -> "Ownership Chart";
            case "boardResolution" -> "Board Resolution";
            case "signerIdentification" -> "Signer Identification";
            case "addressProof" -> "Address Proof";
            default -> documentField;
        };
    }

    private BigDecimal safeAmount(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private boolean contains(List<String> candidates, String value) {
        String normalized = normalize(value);
        return candidates.stream().map(this::normalize).anyMatch(normalized::equals);
    }

    private boolean sameValue(String left, String right) {
        return normalize(left).equals(normalize(right));
    }

    private boolean matches(String value, String... candidates) {
        String normalized = normalize(value);
        for (String candidate : candidates) {
            if (normalized.equals(normalize(candidate))) {
                return true;
            }
        }
        return false;
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
    }

    private record OverrideResult(String decision, String reason, String forcedRiskRating) {
    }
}
