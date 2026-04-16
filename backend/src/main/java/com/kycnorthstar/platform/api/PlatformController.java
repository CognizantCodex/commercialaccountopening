package com.kycnorthstar.platform.api;

import com.kycnorthstar.platform.api.PlatformModels.CaseRecord;
import com.kycnorthstar.platform.api.PlatformModels.ExplainabilityResponse;
import com.kycnorthstar.platform.api.PlatformModels.MonitoringAlert;
import com.kycnorthstar.platform.api.PlatformModels.PlatformSnapshotResponse;
import com.kycnorthstar.platform.api.PlatformRequests.CreateCaseRequest;
import com.kycnorthstar.platform.api.PlatformRequests.CreateDocumentRequest;
import com.kycnorthstar.platform.api.PlatformRequests.CreateGovernanceDecisionRequest;
import com.kycnorthstar.platform.api.PlatformRequests.EvaluateQcRequest;
import com.kycnorthstar.platform.api.PlatformRequests.ResolveTaskRequest;
import com.kycnorthstar.platform.api.PlatformRequests.StartMonitoringRequest;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import java.net.URI;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping({"/api/v1", "/api"})
public class PlatformController {

  private final PlatformService platformService;

  public PlatformController(PlatformService platformService) {
    this.platformService = platformService;
  }

  @GetMapping("/platform/snapshot")
  public PlatformSnapshotResponse getSnapshot() {
    return platformService.getPlatformSnapshot();
  }

  @GetMapping("/cases")
  public List<CaseRecord> listCases() {
    return platformService.listCases();
  }

  @PostMapping("/cases")
  public ResponseEntity<CaseRecord> createCase(@Valid @RequestBody CreateCaseRequest request) {
    CaseRecord response = platformService.createCase(request);
    return ResponseEntity.created(URI.create("/api/v1/cases/" + response.id())).body(response);
  }

  @GetMapping("/cases/{caseId}")
  public CaseRecord getCase(@PathVariable String caseId) {
    return platformService.getCase(caseId);
  }

  @PostMapping("/cases/{caseId}/documents")
  public ResponseEntity<CaseRecord> addDocument(@PathVariable String caseId, @Valid @RequestBody CreateDocumentRequest request) {
    return ResponseEntity.created(URI.create("/api/v1/cases/" + caseId)).body(platformService.addDocument(caseId, request));
  }

  @PostMapping("/cases/{caseId}/evaluations/qc")
  public CaseRecord evaluateQc(@PathVariable String caseId, @Valid @RequestBody EvaluateQcRequest request) {
    return platformService.evaluateQc(caseId, request);
  }

  @PostMapping("/cases/{caseId}/tasks/{taskId}/resolve")
  public CaseRecord resolveTask(@PathVariable String caseId, @PathVariable String taskId, @Valid @RequestBody ResolveTaskRequest request) {
    return platformService.resolveTask(caseId, taskId, request);
  }

  @PostMapping("/cases/{caseId}/actions/start-monitoring")
  public MonitoringAlert startMonitoring(@PathVariable String caseId, @Valid @RequestBody StartMonitoringRequest request) {
    return platformService.startMonitoring(caseId, request);
  }

  @PostMapping("/governance/decisions")
  public ResponseEntity<PlatformModels.DecisionLog> createDecision(@Valid @RequestBody CreateGovernanceDecisionRequest request) {
    PlatformModels.DecisionLog response = platformService.createGovernanceDecision(request);
    return ResponseEntity.created(URI.create("/api/v1/cases/" + request.caseId() + "/explainability")).body(response);
  }

  @PostMapping("/cases/{caseId}/resolve")
  public CaseRecord resolveTaskAlias(@PathVariable String caseId, @RequestBody(required = false) Map<String, Object> ignoredBody) {
    return platformService.resolveTask(
        caseId,
        "advisor-resolution",
        new ResolveTaskRequest("Platform API", "Advisor supplied a notarized address certificate and the exception was cleared.")
    );
  }

  @PostMapping("/cases/{caseId}/monitoring")
  public MonitoringAlert startMonitoringAlias(@PathVariable String caseId, @RequestBody(required = false) Map<String, Object> ignoredBody) {
    return platformService.startMonitoring(
        caseId,
        new StartMonitoringRequest(
            "Live monitoring alert",
            com.kycnorthstar.platform.shared.Severity.critical,
            "Continuous KYC surfaced a material signal after onboarding completion.",
            18
        )
    );
  }

  @PostMapping("/governance/cases/{caseId}/decision")
  public ResponseEntity<PlatformModels.DecisionLog> createDecisionAlias(@PathVariable String caseId, @RequestBody(required = false) Map<String, Object> ignoredBody) {
    PlatformModels.DecisionLog response = platformService.createGovernanceDecision(
        new CreateGovernanceDecisionRequest(
            caseId,
            "Governance review opened from live console",
            "Governance Officer",
            com.kycnorthstar.platform.modules.governance.GovernanceDecision.flagged,
            86,
            "Live console escalation requested from the case workspace.",
            List.of(
                "Monitoring signal crossed the governance review threshold.",
                "The case workspace requested an explainability pack for human review.",
                "A final decision remains with governance."
            )
        )
    );
    return ResponseEntity.created(URI.create("/api/v1/cases/" + caseId + "/explainability")).body(response);
  }

  @GetMapping("/cases/{caseId}/explainability")
  public ExplainabilityResponse getExplainability(@PathVariable String caseId) {
    return platformService.getExplainability(caseId);
  }

  @GetMapping(path = "/activity/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
  public SseEmitter streamActivity() {
    return platformService.streamActivity();
  }
}
