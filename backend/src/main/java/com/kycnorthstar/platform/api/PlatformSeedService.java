package com.kycnorthstar.platform.api;

import com.kycnorthstar.platform.modules.activity.ActivityItemEntity;
import com.kycnorthstar.platform.modules.activity.ActivityItemRepository;
import com.kycnorthstar.platform.modules.agents.AgentExecutionEntity;
import com.kycnorthstar.platform.modules.agents.AgentExecutionRepository;
import com.kycnorthstar.platform.modules.agents.AgentStatus;
import com.kycnorthstar.platform.modules.business.BusinessInformationEntity;
import com.kycnorthstar.platform.modules.business.BusinessInformationRepository;
import com.kycnorthstar.platform.modules.cases.CasePriority;
import com.kycnorthstar.platform.modules.cases.CaseStage;
import com.kycnorthstar.platform.modules.cases.CaseStatus;
import com.kycnorthstar.platform.modules.cases.ComplianceCaseEntity;
import com.kycnorthstar.platform.modules.cases.ComplianceCaseRepository;
import com.kycnorthstar.platform.modules.evidence.DocumentStatus;
import com.kycnorthstar.platform.modules.evidence.DocumentSubmissionEntity;
import com.kycnorthstar.platform.modules.evidence.DocumentSubmissionRepository;
import com.kycnorthstar.platform.modules.governance.DecisionEvidenceEntity;
import com.kycnorthstar.platform.modules.governance.DecisionEvidenceRepository;
import com.kycnorthstar.platform.modules.governance.DecisionReasoningStepEntity;
import com.kycnorthstar.platform.modules.governance.DecisionReasoningStepRepository;
import com.kycnorthstar.platform.modules.governance.DecisionRecordEntity;
import com.kycnorthstar.platform.modules.governance.DecisionRecordRepository;
import com.kycnorthstar.platform.modules.governance.GovernanceDecision;
import com.kycnorthstar.platform.modules.monitoring.MonitoringAlertEntity;
import com.kycnorthstar.platform.modules.monitoring.MonitoringAlertRepository;
import com.kycnorthstar.platform.modules.ownership.OwnershipGroup;
import com.kycnorthstar.platform.modules.ownership.OwnershipPartyEntity;
import com.kycnorthstar.platform.modules.ownership.OwnershipPartyRepository;
import com.kycnorthstar.platform.modules.ownership.OwnershipRelationshipEntity;
import com.kycnorthstar.platform.modules.ownership.OwnershipRelationshipRepository;
import com.kycnorthstar.platform.modules.parties.CustomerOrganizationEntity;
import com.kycnorthstar.platform.modules.parties.CustomerOrganizationRepository;
import com.kycnorthstar.platform.modules.policy.PolicyCheckResultEntity;
import com.kycnorthstar.platform.modules.policy.PolicyCheckResultRepository;
import com.kycnorthstar.platform.modules.policy.PolicyCheckStatus;
import com.kycnorthstar.platform.shared.DashboardRoute;
import com.kycnorthstar.platform.shared.Severity;
import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class PlatformSeedService implements CommandLineRunner {

  private final CustomerOrganizationRepository customerOrganizations;
  private final ComplianceCaseRepository complianceCases;
  private final DocumentSubmissionRepository documentSubmissions;
  private final PolicyCheckResultRepository policyChecks;
  private final OwnershipPartyRepository ownershipParties;
  private final OwnershipRelationshipRepository ownershipRelationships;
  private final MonitoringAlertRepository monitoringAlerts;
  private final DecisionRecordRepository decisions;
  private final DecisionReasoningStepRepository reasoningSteps;
  private final DecisionEvidenceRepository decisionEvidence;
  private final AgentExecutionRepository agents;
  private final ActivityItemRepository activityItems;
  private final BusinessInformationRepository businessInformation;

  public PlatformSeedService(
      CustomerOrganizationRepository customerOrganizations,
      ComplianceCaseRepository complianceCases,
      DocumentSubmissionRepository documentSubmissions,
      PolicyCheckResultRepository policyChecks,
      OwnershipPartyRepository ownershipParties,
      OwnershipRelationshipRepository ownershipRelationships,
      MonitoringAlertRepository monitoringAlerts,
      DecisionRecordRepository decisions,
      DecisionReasoningStepRepository reasoningSteps,
      DecisionEvidenceRepository decisionEvidence,
      AgentExecutionRepository agents,
      ActivityItemRepository activityItems,
      BusinessInformationRepository businessInformation
  ) {
    this.customerOrganizations = customerOrganizations;
    this.complianceCases = complianceCases;
    this.documentSubmissions = documentSubmissions;
    this.policyChecks = policyChecks;
    this.ownershipParties = ownershipParties;
    this.ownershipRelationships = ownershipRelationships;
    this.monitoringAlerts = monitoringAlerts;
    this.decisions = decisions;
    this.reasoningSteps = reasoningSteps;
    this.decisionEvidence = decisionEvidence;
    this.agents = agents;
    this.activityItems = activityItems;
    this.businessInformation = businessInformation;
  }

  @Override
  public void run(String... args) {
    if (complianceCases.count() > 0) {
      return;
    }

    customerOrganizations.saveAll(List.of(
        new CustomerOrganizationEntity("client-aurora", "Aurora Atlas Capital", "Private Bank", "London", "Europe", 51.5072, -0.1276, "Asset Management", 2_700_000_000L),
        new CustomerOrganizationEntity("client-orion", "Orion Meridian Holdings", "Corporate", "New York", "North America", 40.7128, -74.0060, "Holding Company", 5_100_000_000L),
        new CustomerOrganizationEntity("client-lattice", "Lattice Harbor Trust", "Wealth", "Geneva", "Europe", 46.2044, 6.1432, "Trust Services", 910_000_000L)
    ));

    businessInformation.saveAll(List.of(
        new BusinessInformationEntity(
            "biz-atlas",
            "Atlas Meridian Holdings, Inc.",
            "100 Market Street Suite 1200 San Francisco California 94105 United States",
            "12-3456789",
            "Active"
        ),
        new BusinessInformationEntity(
            "biz-harbor",
            "Harbor Logistics LLC",
            "500 Trade Center Drive Newark New Jersey 07102 United States",
            "98-7654321",
            "Inactive"
        )
    ));

    complianceCases.saveAll(List.of(
        new ComplianceCaseEntity(
            "case-aurora-001",
            "client-aurora",
            "Aurora Atlas Capital Prime Brokerage Expansion",
            CasePriority.high,
            CaseStage.ADVISOR_EXCEPTION,
            CaseStatus.exception,
            "UK",
            "Europe",
            64,
            false,
            false,
            31.5,
            "Ava Lewis",
            72,
            "Aurora is blocked on one registered-address discrepancy while the ownership chain is otherwise well understood.",
            "Request a replacement address document from the relationship team and rerun QC."
        ),
        new ComplianceCaseEntity(
            "case-orion-002",
            "client-orion",
            "Orion Meridian Holdings Treasury Onboarding",
            CasePriority.medium,
            CaseStage.STP_APPROVAL,
            CaseStatus.in_flight,
            "US",
            "North America",
            39,
            true,
            true,
            18.2,
            "Marcus Chen",
            96,
            "Orion is tracking toward straight-through approval with no unresolved control gaps.",
            "Prepare STP approval package and move the client into monitoring."
        ),
        new ComplianceCaseEntity(
            "case-lattice-004",
            "client-lattice",
            "Lattice Harbor Trust Periodic Governance Review",
            CasePriority.medium,
            CaseStage.GOVERNANCE_REVIEW,
            CaseStatus.resolved,
            "CH",
            "Europe",
            48,
            false,
            true,
            26.0,
            "Nina Patel",
            94,
            "Lattice is in governance review after a historical override was retained with supporting evidence.",
            "Share the explainability package with audit and close the review."
        )
    ));

    documentSubmissions.saveAll(List.of(
        new DocumentSubmissionEntity("doc-aurora-ubo", "case-aurora-001", "UBO Register", DocumentStatus.validated, 96, OffsetDateTime.parse("2026-04-16T08:00:00Z"), "controller-chain,shareholder-name,ownership"),
        new DocumentSubmissionEntity("doc-aurora-proof", "case-aurora-001", "Proof of Address", DocumentStatus.failed, 54, OffsetDateTime.parse("2026-04-16T08:12:00Z"), "registered-address,tax-id"),
        new DocumentSubmissionEntity("doc-orion-registry", "case-orion-002", "Registry Extract", DocumentStatus.validated, 100, OffsetDateTime.parse("2026-04-16T07:30:00Z"), "legal-name,lei,controllers"),
        new DocumentSubmissionEntity("doc-lattice-deed", "case-lattice-004", "Trust Deed", DocumentStatus.validated, 100, OffsetDateTime.parse("2026-04-16T07:45:00Z"), "beneficiary,trustee,rights")
    ));

    policyChecks.saveAll(List.of(
        new PolicyCheckResultEntity("rule-aurora-address", "case-aurora-001", "Registered address consistency", PolicyCheckStatus.failed, "AI comparison found inconsistent registered addresses across the proof of address and tax certificate."),
        new PolicyCheckResultEntity("rule-aurora-ubo", "case-aurora-001", "Ultimate beneficial owner verification", PolicyCheckStatus.passed, "Controller chain now aligns with the uploaded UBO register."),
        new PolicyCheckResultEntity("rule-orion-screening", "case-orion-002", "Screening and adverse media", PolicyCheckStatus.passed, "No sanctions, PEP, or adverse media exceptions detected."),
        new PolicyCheckResultEntity("rule-lattice-override", "case-lattice-004", "Legacy risk override review", PolicyCheckStatus.manual_review, "Governance retained a manual override because prior source data was stale.")
    ));

    ownershipParties.saveAll(List.of(
        new OwnershipPartyEntity("party-aurora-client", "case-aurora-001", "Aurora Atlas Capital", "Client", OwnershipGroup.client),
        new OwnershipPartyEntity("party-aurora-ubo", "case-aurora-001", "Helen Ward", "Beneficial Owner", OwnershipGroup.beneficial_owner),
        new OwnershipPartyEntity("party-aurora-advisor", "case-aurora-001", "Ava Lewis", "Advisor", OwnershipGroup.advisor),
        new OwnershipPartyEntity("party-aurora-jurisdiction", "case-aurora-001", "United Kingdom", "Jurisdiction", OwnershipGroup.jurisdiction)
    ));

    ownershipRelationships.saveAll(List.of(
        new OwnershipRelationshipEntity("link-aurora-1", "case-aurora-001", "party-aurora-client", "party-aurora-ubo", 78),
        new OwnershipRelationshipEntity("link-aurora-2", "case-aurora-001", "party-aurora-advisor", "party-aurora-client", 52),
        new OwnershipRelationshipEntity("link-aurora-3", "case-aurora-001", "party-aurora-jurisdiction", "party-aurora-client", 60)
    ));

    monitoringAlerts.saveAll(List.of(
        new MonitoringAlertEntity("alert-polaris-001", "case-orion-002", "client-orion", "Adverse media spike near Sao Paulo operations", Severity.warning, "Latin America", -23.5505, -46.6333, OffsetDateTime.parse("2026-04-16T08:40:00Z"), 22, "Continuous monitoring picked up a material news cluster tied to a supplier relationship.")
    ));

    decisions.saveAll(List.of(
        new DecisionRecordEntity("decision-lattice-001", "case-lattice-004", "Override approved after secondary review", "Governance Auditor", GovernanceDecision.overridden, 88, "Manual override preserved after advisor supplied notarized trust deed.", OffsetDateTime.parse("2026-04-16T08:20:00Z")),
        new DecisionRecordEntity("decision-orion-001", "case-orion-002", "Straight-through approval logged", "AI Governance Agent", GovernanceDecision.approved, 96, null, OffsetDateTime.parse("2026-04-16T08:05:00Z"))
    ));

    reasoningSteps.saveAll(List.of(
        new DecisionReasoningStepEntity("decision-lattice-001", 1, "Passport and trust deed matched the declared beneficiary."),
        new DecisionReasoningStepEntity("decision-lattice-001", 2, "Screening agents returned no sanctions, PEP, or adverse media escalation."),
        new DecisionReasoningStepEntity("decision-lattice-001", 3, "Override retained because legacy risk flag was attributable to stale source data."),
        new DecisionReasoningStepEntity("decision-orion-001", 1, "Entity structure fully matched registry sources on first pass."),
        new DecisionReasoningStepEntity("decision-orion-001", 2, "All mandatory KYC evidence satisfied the policy pack with no residual exceptions."),
        new DecisionReasoningStepEntity("decision-orion-001", 3, "No human override required due to sustained confidence above release threshold.")
    ));

    decisionEvidence.saveAll(List.of(
        new DecisionEvidenceEntity("source-lattice-1", "decision-lattice-001", "Trust deed", "document", 95, "Beneficiary rights and trustee attestation verified."),
        new DecisionEvidenceEntity("source-lattice-2", "decision-lattice-001", "Reviewer note", "advisor-note", 83, "Second-line governance review confirms exception closure."),
        new DecisionEvidenceEntity("source-orion-1", "decision-orion-001", "Registry extract", "registry", 97, "Companies House record and legal entity identifier aligned."),
        new DecisionEvidenceEntity("source-orion-2", "decision-orion-001", "Sanctions screening", "screening", 94, "No screening concerns across directors or controllers.")
    ));

    agents.saveAll(List.of(
        new AgentExecutionEntity("agent-doc-intel", "Document Intelligence Agent", "Document classification and extraction", AgentStatus.active, 320, 142, 84, 16, "Processing Aurora ownership evidence and quality-check deltas."),
        new AgentExecutionEntity("agent-qc", "Quality Check Agent", "Continuous policy validation", AgentStatus.exception, 410, 118, 72, 28, "Waiting on one address mismatch for Aurora before returning to STP evaluation."),
        new AgentExecutionEntity("agent-monitoring", "Continuous KYC Agent", "Monitoring and alert routing", AgentStatus.active, 260, 97, 81, 19, "Watching post-onboarding signals across Europe and Latin America.")
    ));

    activityItems.saveAll(List.of(
        new ActivityItemEntity("activity-1", "Platform initialized", "Aurora reference data loaded for executive, operations, monitoring, and governance views.", OffsetDateTime.parse("2026-04-16T08:00:00Z"), Severity.info, DashboardRoute.executive),
        new ActivityItemEntity("activity-2", "Ownership graph refreshed", "Document intelligence refreshed the Aurora controller chain after the latest UBO register upload.", OffsetDateTime.parse("2026-04-16T08:05:00Z"), Severity.success, DashboardRoute.cases),
        new ActivityItemEntity("activity-3", "QC exception raised", "The quality-check agent isolated one address mismatch and routed the case to advisor remediation.", OffsetDateTime.parse("2026-04-16T08:12:00Z"), Severity.warning, DashboardRoute.agents),
        new ActivityItemEntity("activity-4", "Monitoring pulse escalated", "A post-onboarding adverse media signal is ready for governance review if the relationship proves material.", OffsetDateTime.parse("2026-04-16T08:40:00Z"), Severity.critical, DashboardRoute.monitoring)
    ));
  }
}
