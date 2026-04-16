import { useMemo, useState } from "react";
import "./App.css";

const scenarioCatalog = {
  GOOD: {
    label: "Good User",
    tone: "approved",
    headline: "Clean commercial onboarding package",
    description:
      "Complete registration support, clear ownership, and positive business-risk language support an efficient review path.",
    path: ["DOCUMENT_REVIEW approved", "KYC approved", "CREDIT approved", "RISK approved"],
  },
  BAD: {
    label: "Bad User",
    tone: "rejected",
    headline: "Explicit adverse risk signals",
    description:
      "Use this path for clearly negative signals such as collections, default, fraud, or sanctions-related evidence.",
    path: ["CREDIT rejected", "or KYC rejected", "RISK rejected"],
  },
  MANUAL_REVIEW: {
    label: "Manual Review User",
    tone: "manual_review",
    headline: "Incomplete or inconsistent evidence",
    description:
      "Use this path when OCR is partial, ownership is unclear, or prior-stage outcomes remain unresolved.",
    path: ["DOCUMENT_REVIEW manual review", "KYC manual review", "RISK manual review"],
  },
};

const presets = {
  GOOD: {
    DOCUMENT_REVIEW: {
      stage: "DOCUMENT_REVIEW",
      applicationId: "APP-10010",
      companyName: "Redacted Commercial Applicant",
      demoScenario: "GOOD",
      aggregatedOcrSummary:
        "Certificate of formation and business registration support are present with active status and matching business identity details.",
      document: {
        filename: "formation_doc_redacted.pdf",
        ocrText:
          "Certificate of formation issued by secretary of state. Active status confirmed. Business license and registration details are consistent.",
      },
      notes: "Document supports business identity without contradiction.",
    },
    KYC: {
      stage: "KYC",
      applicationId: "APP-10011",
      companyName: "Redacted Commercial Applicant",
      demoScenario: "GOOD",
      aggregatedOcrSummary:
        "Business registration reflects active status with certificate of formation on file. Managing member and beneficial owner are identified consistently across supplied materials.",
      document: {
        filename: "kyc_packet_redacted.pdf",
        ocrText:
          "Certificate of formation issued by secretary of state. Managing member and beneficial owner listed consistently in redacted form.",
      },
      notes: "Consistent registration and ownership details were provided in the supplied onboarding package.",
    },
    CREDIT: {
      stage: "CREDIT",
      applicationId: "APP-10012",
      companyName: "Redacted Commercial Applicant",
      demoScenario: "GOOD",
      aggregatedOcrSummary:
        "Business profile indicates strong credit quality, positive payment history, stable cash flow, and good standing.",
      notes: "Strong credit and stable operating profile were explicitly supplied.",
    },
    RISK: {
      stage: "RISK",
      applicationId: "APP-10013",
      companyName: "Redacted Commercial Applicant",
      demoScenario: "GOOD",
      priorStageDecisions: [
        { stage: "DOCUMENT_REVIEW", decision: "APPROVED" },
        { stage: "KYC", decision: "APPROVED" },
        { stage: "CREDIT", decision: "APPROVED" },
      ],
      notes: "All upstream stages were approved with no unresolved uncertainty.",
    },
  },
  BAD: {
    DOCUMENT_REVIEW: {
      stage: "DOCUMENT_REVIEW",
      applicationId: "APP-20010",
      companyName: "Redacted Commercial Applicant",
      demoScenario: "BAD",
      aggregatedOcrSummary:
        "Document packet contains mismatch language and identity details do not match supplied context.",
      document: {
        filename: "identity_conflict_redacted.pdf",
        ocrText:
          "Business registration page appears inconsistent and does not match the supplied business identity summary.",
      },
      notes: "Contradiction and mismatch indicators are present.",
    },
    KYC: {
      stage: "KYC",
      applicationId: "APP-20011",
      companyName: "Redacted Commercial Applicant",
      demoScenario: "BAD",
      aggregatedOcrSummary:
        "Supplied onboarding context references watchlist screening concern and possible fraudulent business identity evidence.",
      document: {
        filename: "kyc_alert_redacted.pdf",
        ocrText:
          "Fraud and watchlist review terms are referenced in the provided redacted material.",
      },
      notes: "Explicit severe KYC adverse indicators are present.",
    },
    CREDIT: {
      stage: "CREDIT",
      applicationId: "APP-20012",
      companyName: "Redacted Commercial Applicant",
      demoScenario: "BAD",
      aggregatedOcrSummary:
        "Credit summary notes delinquent obligations, collections activity, and prior default in the supplied business risk context.",
      notes: "Explicit negative credit indicators were included in the review package.",
    },
    RISK: {
      stage: "RISK",
      applicationId: "APP-20013",
      companyName: "Redacted Commercial Applicant",
      demoScenario: "BAD",
      priorStageDecisions: [
        { stage: "DOCUMENT_REVIEW", decision: "APPROVED" },
        { stage: "KYC", decision: "REJECTED" },
        { stage: "CREDIT", decision: "REJECTED" },
      ],
      notes: "Upstream rejection already exists in the supplied context.",
    },
  },
  MANUAL_REVIEW: {
    DOCUMENT_REVIEW: {
      stage: "DOCUMENT_REVIEW",
      applicationId: "APP-30010",
      companyName: "Redacted Commercial Applicant",
      demoScenario: "MANUAL_REVIEW",
      aggregatedOcrSummary:
        "The registration packet appears partial and one page is marked unreadable. Some fields cannot be verified from the provided OCR output.",
      document: {
        filename: "license_scan_redacted.pdf",
        ocrText:
          "Business license appears partial and blurred. Missing page reference noted in the OCR extraction.",
      },
      notes: "Document quality is unclear and verification is incomplete.",
    },
    KYC: {
      stage: "KYC",
      applicationId: "APP-30011",
      companyName: "Redacted Commercial Applicant",
      demoScenario: "MANUAL_REVIEW",
      aggregatedOcrSummary:
        "Business registration is referenced, but ownership information is incomplete and cannot be fully verified.",
      document: {
        filename: "ownership_gap_redacted.pdf",
        ocrText:
          "Registration support appears present, but beneficial owner information is partial and unclear.",
      },
      notes: "Ownership clarity is incomplete in the provided context.",
    },
    CREDIT: {
      stage: "CREDIT",
      applicationId: "APP-30012",
      companyName: "Redacted Commercial Applicant",
      demoScenario: "MANUAL_REVIEW",
      aggregatedOcrSummary:
        "Business risk context indicates limited history and uncertain performance with insufficient data for clear approval.",
      notes: "Thin file and mixed credit indicators require manual review.",
    },
    RISK: {
      stage: "RISK",
      applicationId: "APP-30013",
      companyName: "Redacted Commercial Applicant",
      demoScenario: "MANUAL_REVIEW",
      priorStageDecisions: [
        { stage: "DOCUMENT_REVIEW", decision: "APPROVED" },
        { stage: "KYC", decision: "MANUAL_REVIEW" },
        { stage: "CREDIT", decision: "APPROVED" },
      ],
      notes: "An upstream uncertainty remains unresolved.",
    },
  },
};

const agentCards = [
  {
    stage: "KYC",
    title: "KYC Agent",
    ownership: "Business registration, ownership clarity, and consistency checks",
    file: "agents/kyc-agent.md",
  },
  {
    stage: "CREDIT",
    title: "Credit Agent",
    ownership: "Account-opening credit posture using only supplied business-risk context",
    file: "agents/credit-agent.md",
  },
  {
    stage: "RISK",
    title: "Risk Agent",
    ownership: "Final conservative risk decision from prior-stage outcomes",
    file: "agents/risk-agent.md",
  },
];

const stageOptions = ["DOCUMENT_REVIEW", "KYC", "CREDIT", "RISK"];

const emptyResponse = {
  stage: "-",
  decision: "-",
  confidence: "-",
  rationale: "Submit a payload to see the regulator-friendly reasoning.",
  keyFactors: ["No decision has been generated yet."],
};

function App() {
  const [scenario, setScenario] = useState("GOOD");
  const [stage, setStage] = useState("KYC");
  const [requestBody, setRequestBody] = useState(JSON.stringify(presets.GOOD.KYC, null, 2));
  const [result, setResult] = useState(emptyResponse);
  const [status, setStatus] = useState({ label: "Loaded Good User", tone: "idle" });

  const currentScenario = scenarioCatalog[scenario];
  const activeAgent = useMemo(
    () => agentCards.find((agent) => agent.stage === stage) || null,
    [stage],
  );
  const statusClassName = useMemo(() => `status-badge ${status.tone}`, [status.tone]);

  const loadPreset = (nextScenario, nextStage = stage) => {
    const preset = presets[nextScenario][nextStage];
    setScenario(nextScenario);
    setStage(nextStage);
    setRequestBody(JSON.stringify(preset, null, 2));
    setStatus({ label: `Loaded ${scenarioCatalog[nextScenario].label}`, tone: "idle" });
  };

  const syncStageIntoPayload = (nextStage, rawText) => {
    const parsed = JSON.parse(rawText);
    parsed.stage = nextStage;
    return JSON.stringify(parsed, null, 2);
  };

  const formatJson = () => {
    try {
      setRequestBody(syncStageIntoPayload(stage, requestBody));
      setStatus({ label: "JSON formatted", tone: "idle" });
    } catch (error) {
      setResult({ error: "Invalid JSON input", details: error.message });
      setStatus({ label: "Invalid JSON", tone: "rejected" });
    }
  };

  const evaluate = async () => {
    let payload;
    try {
      payload = JSON.parse(requestBody);
      payload.stage = stage;
      setRequestBody(JSON.stringify(payload, null, 2));
    } catch (error) {
      setResult({ error: "Invalid JSON input", details: error.message });
      setStatus({ label: "Invalid JSON", tone: "rejected" });
      return;
    }

    setStatus({ label: "Evaluating", tone: "idle" });

    try {
      const response = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Evaluation failed");
      }
      setResult(data);
      setStatus({ label: data.decision, tone: data.decision.toLowerCase() });
    } catch (error) {
      setResult({ error: "Request failed", details: error.message });
      setStatus({ label: "Request failed", tone: "rejected" });
    }
  };

  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
      setStatus({ label: "JSON copied", tone: "idle" });
    } catch {
      setStatus({ label: "Copy unavailable", tone: "manual_review" });
    }
  };

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Commercial Account Opening</p>
          <h1>Multi-agent advisory review for good users, bad users, and edge cases.</h1>
          <p className="intro">
            The workspace now reflects an LLM-agent model: <span>KYC</span>, <span>CREDIT</span>, and <span>RISK</span> each own a distinct rulebook, while the UI makes the good-user and bad-user paths immediately visible.
          </p>
        </div>
        <aside className="hero-card">
          <p className="hero-card-label">Project Docs</p>
          <ul>
            <li><strong>AGENT.md</strong> defines the project operating model</li>
            <li><strong>agents/kyc-agent.md</strong> owns KYC rules</li>
            <li><strong>agents/credit-agent.md</strong> owns credit rules</li>
            <li><strong>agents/risk-agent.md</strong> owns final risk rules</li>
          </ul>
        </aside>
      </header>

      <main className="workspace">
        <section className="panel panel-wide">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">User Journeys</p>
              <h2>Scenario Launcher</h2>
            </div>
            <div className={statusClassName}>{status.label}</div>
          </div>

          <div className="scenario-grid">
            {Object.entries(scenarioCatalog).map(([key, item]) => (
              <button
                key={key}
                type="button"
                className={`scenario-card ${scenario === key ? "active" : ""} ${item.tone}`}
                onClick={() => loadPreset(key, stage)}
              >
                <span className="scenario-label">{item.label}</span>
                <strong>{item.headline}</strong>
                <span>{item.description}</span>
                <div className="path-tags">
                  {item.path.map((step) => (
                    <span key={step}>{step}</span>
                  ))}
                </div>
              </button>
            ))}
          </div>

          <div className="agent-stage-row">
            <div>
              <p className="section-kicker">Stage</p>
              <div className="stage-pills">
                {stageOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`stage-pill ${stage === option ? "active" : ""}`}
                    onClick={() => loadPreset(scenario, option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
            {activeAgent ? (
              <article className="agent-focus-card">
                <p className="section-kicker">Active Agent</p>
                <h3>{activeAgent.title}</h3>
                <p>{activeAgent.ownership}</p>
                <code>{activeAgent.file}</code>
              </article>
            ) : (
              <article className="agent-focus-card">
                <p className="section-kicker">Active Agent</p>
                <h3>Document Review Logic</h3>
                <p>Supports business identity checks before specialist KYC, credit, and risk review.</p>
                <code>prompt1_updaed.txt</code>
              </article>
            )}
          </div>

          <div className="agent-grid">
            {agentCards.map((agent) => (
              <article key={agent.stage} className={`agent-card ${stage === agent.stage ? "selected" : ""}`}>
                <p className="section-kicker">{agent.stage}</p>
                <h3>{agent.title}</h3>
                <p>{agent.ownership}</p>
                <code>{agent.file}</code>
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Input</p>
              <h2>Structured Payload</h2>
            </div>
          </div>

          <label className="editor-label" htmlFor="request-json">JSON Request Body</label>
          <textarea
            id="request-json"
            spellCheck="false"
            value={requestBody}
            onChange={(event) => setRequestBody(event.target.value)}
          />

          <div className="action-row">
            <button className="primary-button" type="button" onClick={evaluate}>Evaluate</button>
            <button className="secondary-button" type="button" onClick={formatJson}>Format JSON</button>
          </div>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Output</p>
              <h2>Decision Result</h2>
            </div>
          </div>

          <div className="summary-grid">
            <article className="summary-card">
              <p className="summary-label">Decision</p>
              <p className="summary-value">{result.decision || "-"}</p>
            </article>
            <article className="summary-card">
              <p className="summary-label">Confidence</p>
              <p className="summary-value">{typeof result.confidence === "number" ? `${result.confidence}/100` : "-"}</p>
            </article>
            <article className="summary-card">
              <p className="summary-label">Stage</p>
              <p className="summary-value">{result.stage || "-"}</p>
            </article>
          </div>

          <article className="detail-card">
            <p className="summary-label">Rationale</p>
            <p className="detail-copy">{result.rationale || result.error || "No rationale returned."}</p>
            {result.details ? <p className="detail-copy detail-error">{result.details}</p> : null}
          </article>

          <article className="detail-card">
            <div className="json-header">
              <p className="summary-label">Key Factors</p>
              <button className="ghost-button" type="button" onClick={copyJson}>Copy JSON</button>
            </div>
            <ul className="factor-list">
              {(Array.isArray(result.keyFactors) ? result.keyFactors : []).map((factor) => (
                <li key={factor}>{factor}</li>
              ))}
            </ul>
          </article>

          <article className="detail-card">
            <p className="summary-label">Raw JSON Response</p>
            <pre>{JSON.stringify(result, null, 2)}</pre>
          </article>
        </section>
      </main>
    </div>
  );
}

export default App;
