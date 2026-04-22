package com.kycnorthstar.platform.api;

import com.kycnorthstar.platform.modules.governance.GovernanceDecision;
import com.kycnorthstar.platform.shared.Severity;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public final class PlatformRequests {

  private PlatformRequests() {
  }

  public record CreateCaseRequest(
      @NotBlank String clientId,
      @NotBlank String caseName,
      @NotBlank String jurisdiction
  ) {
  }

  public record CreateDocumentRequest(
      @NotBlank String documentType,
      @NotEmpty List<String> extractedFields
  ) {
  }

  public record EvaluateQcRequest(@NotBlank String actor) {
  }

  public record ResolveTaskRequest(
      @NotBlank String actor,
      @NotBlank String note
  ) {
  }

  public record StartMonitoringRequest(
      @NotBlank String title,
      @NotNull Severity severity,
      @NotBlank String description,
      @Min(0) @Max(100) int falsePositiveRisk
  ) {
  }

  public record CreateGovernanceDecisionRequest(
      @NotBlank String caseId,
      @NotBlank String title,
      @NotBlank String actor,
      @NotNull GovernanceDecision decision,
      @Min(0) @Max(100) int confidence,
      String overrideReason,
      @NotEmpty List<String> reasoningChain
  ) {
  }

  public record CheckKycRequest(
      @NotBlank String brandName,
      @NotBlank String formTitle,
      @NotNull CompanyInfo companyInfo,
      @NotNull PrimaryContact primaryContact,
      @NotNull Addresses addresses,
      @NotNull BankingProfile bankingProfile,
      @NotEmpty List<BeneficialOwner> beneficialOwners,
      @NotNull Documents documents,
      @NotNull Declarations declarations,
      String additionalNotes
  ) {
  }

  public record CheckKybRequest(
      @NotBlank String entityName,
      @NotBlank String address,
      @NotBlank String taxId
  ) {
  }

  public record CompanyInfo(
      @NotBlank String legalName,
      String tradingName,
      @NotBlank String entityType,
      @NotBlank String registrationNumber,
      @NotBlank String taxId,
      @NotBlank String incorporationDate,
      @NotBlank String incorporationState,
      @NotBlank String incorporationCountry,
      @NotBlank String industry,
      @NotBlank String website,
      @NotBlank String annualRevenue,
      @NotBlank String employeeCount
  ) {
  }

  public record PrimaryContact(
      @NotBlank String fullName,
      @NotBlank String title,
      @NotBlank String email,
      @NotBlank String phone,
      String extension
  ) {
  }

  public record Addresses(
      @NotBlank String registeredLine1,
      String registeredLine2,
      @NotBlank String city,
      @NotBlank String state,
      @NotBlank String postalCode,
      @NotBlank String country,
      boolean operatingSameAsRegistered,
      String operatingLine1,
      String operatingLine2,
      String operatingCity,
      String operatingState,
      String operatingPostalCode,
      @NotBlank String operatingCountry
  ) {
  }

  public record BankingProfile(
      @NotBlank String accountPurpose,
      @NotEmpty List<String> requestedProducts,
      @NotBlank String expectedOpeningDeposit,
      @NotBlank String monthlyIncoming,
      @NotBlank String monthlyOutgoing,
      @NotBlank String onlineBankingUsers,
      boolean internationalActivity,
      String jurisdictionsInScope,
      boolean needsCommercialCards
  ) {
  }

  public record BeneficialOwner(
      @NotBlank String id,
      @NotBlank String fullName,
      @NotBlank String title,
      @NotBlank String ownershipPercentage,
      @NotBlank String email,
      @NotBlank String phone,
      boolean isAuthorizedSigner
  ) {
  }

  public record Documents(
      boolean certificateOfFormation,
      boolean taxIdLetter,
      boolean ownershipChart,
      boolean boardResolution,
      boolean signerIdentification,
      boolean addressProof
  ) {
  }

  public record Declarations(
      boolean certifyAuthority,
      boolean certifyBeneficialOwners,
      boolean confirmTaxCompliance,
      boolean confirmTerms
  ) {
  }
}
