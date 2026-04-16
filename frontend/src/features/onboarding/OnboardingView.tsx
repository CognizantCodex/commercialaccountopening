import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Copy, FileWarning, ShieldCheck, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

type Stage = 'DOCUMENT_REVIEW' | 'KYC' | 'CREDIT' | 'RISK';
type ScenarioKey = 'GOOD' | 'BAD' | 'MANUAL_REVIEW';
type Decision = 'APPROVED' | 'MANUAL_REVIEW' | 'REJECTED';

interface EvaluationResponse {
  stage: Stage;
  decision: Decision;
  confidence: number;
  rationale: string;
  keyFactors: string[];
  error?: string;
  details?: string;
}

const scenarioCatalog: Record<
  ScenarioKey,
  {
    label: string;
    tone: 'success' | 'danger' | 'warning';
    headline: string;
    description: string;
    path: string[];
  }
> = {
  GOOD: {
    label: 'Good User',
    tone: 'success',
    headline: 'Clean commercial onboarding package',
    description:
      'Use this path for complete registration support, clear ownership, and positive credit quality.',
    path: ['DOCUMENT_REVIEW approved', 'KYC approved', 'CREDIT approved', 'RISK approved'],
  },
  BAD: {
    label: 'Bad User',
    tone: 'danger',
    headline: 'Explicit adverse risk signals',
    description:
      'Use this path for clear negative signals such as watchlist, fraud, delinquency, collections, or default.',
    path: ['KYC rejected', 'or CREDIT rejected', 'RISK rejected'],
  },
  MANUAL_REVIEW: {
    label: 'Manual Review User',
    tone: 'warning',
    headline: 'Incomplete or inconsistent evidence',
    description:
      'Use this path for blurred documents, missing ownership details, or unresolved upstream uncertainty.',
    path: ['DOCUMENT_REVIEW manual review', 'KYC manual review', 'RISK manual review'],
  },
};

const presets: Record<ScenarioKey, Record<Stage, Record<string, unknown>>> = {
  GOOD: {
    DOCUMENT_REVIEW: {
      stage: 'DOCUMENT_REVIEW',
      applicationId: 'APP-10010',
      companyName: 'Redacted Commercial Applicant',
      demoScenario: 'GOOD',
      aggregatedOcrSummary:
        'Certificate of formation and business registration support are present with active status and matching business identity details.',
      document: {
        filename: 'formation_doc_redacted.pdf',
        ocrText:
          'Certificate of formation issued by secretary of state. Active status confirmed. Business license and registration details are consistent.',
      },
      notes: 'Document supports business identity without contradiction.',
    },
    KYC: {
      stage: 'KYC',
      applicationId: 'APP-10011',
      companyName: 'Redacted Commercial Applicant',
      demoScenario: 'GOOD',
      aggregatedOcrSummary:
        'Business registration reflects active status with certificate of formation on file. Managing member and beneficial owner are identified consistently across supplied materials.',
      document: {
        filename: 'kyc_packet_redacted.pdf',
        ocrText:
          'Certificate of formation issued by secretary of state. Managing member and beneficial owner listed consistently in redacted form.',
      },
      notes:
        'Consistent registration and ownership details were provided in the supplied onboarding package.',
    },
    CREDIT: {
      stage: 'CREDIT',
      applicationId: 'APP-10012',
      companyName: 'Redacted Commercial Applicant',
      demoScenario: 'GOOD',
      aggregatedOcrSummary:
        'Business profile indicates strong credit quality, positive payment history, stable cash flow, and good standing.',
      notes: 'Strong credit and stable operating profile were explicitly supplied.',
    },
    RISK: {
      stage: 'RISK',
      applicationId: 'APP-10013',
      companyName: 'Redacted Commercial Applicant',
      demoScenario: 'GOOD',
      priorStageDecisions: [
        { stage: 'DOCUMENT_REVIEW', decision: 'APPROVED' },
        { stage: 'KYC', decision: 'APPROVED' },
        { stage: 'CREDIT', decision: 'APPROVED' },
      ],
      notes: 'All upstream stages were approved with no unresolved uncertainty.',
    },
  },
  BAD: {
    DOCUMENT_REVIEW: {
      stage: 'DOCUMENT_REVIEW',
      applicationId: 'APP-20010',
      companyName: 'Redacted Commercial Applicant',
      demoScenario: 'BAD',
      aggregatedOcrSummary:
        'Document packet contains mismatch language and identity details do not match supplied context.',
      document: {
        filename: 'identity_conflict_redacted.pdf',
        ocrText:
          'Business registration page appears inconsistent and does not match the supplied business identity summary.',
      },
      notes: 'Contradiction and mismatch indicators are present.',
    },
    KYC: {
      stage: 'KYC',
      applicationId: 'APP-20011',
      companyName: 'Redacted Commercial Applicant',
      demoScenario: 'BAD',
      aggregatedOcrSummary:
        'Supplied onboarding context references watchlist screening concern and possible fraudulent business identity evidence.',
      document: {
        filename: 'kyc_alert_redacted.pdf',
        ocrText: 'Fraud and watchlist review terms are referenced in the provided redacted material.',
      },
      notes: 'Explicit severe KYC adverse indicators are present.',
    },
    CREDIT: {
      stage: 'CREDIT',
      applicationId: 'APP-20012',
      companyName: 'Redacted Commercial Applicant',
      demoScenario: 'BAD',
      aggregatedOcrSummary:
        'Credit summary notes delinquent obligations, collections activity, and prior default in the supplied business risk context.',
      notes: 'Explicit negative credit indicators were included in the review package.',
    },
    RISK: {
      stage: 'RISK',
      applicationId: 'APP-20013',
      companyName: 'Redacted Commercial Applicant',
      demoScenario: 'BAD',
      priorStageDecisions: [
        { stage: 'DOCUMENT_REVIEW', decision: 'APPROVED' },
        { stage: 'KYC', decision: 'REJECTED' },
        { stage: 'CREDIT', decision: 'REJECTED' },
      ],
      notes: 'Upstream rejection already exists in the supplied context.',
    },
  },
  MANUAL_REVIEW: {
    DOCUMENT_REVIEW: {
      stage: 'DOCUMENT_REVIEW',
      applicationId: 'APP-30010',
      companyName: 'Redacted Commercial Applicant',
      demoScenario: 'MANUAL_REVIEW',
      aggregatedOcrSummary:
        'The registration packet appears partial and one page is marked unreadable. Some fields cannot be verified from the provided OCR output.',
      document: {
        filename: 'license_scan_redacted.pdf',
        ocrText:
          'Business license appears partial and blurred. Missing page reference noted in the OCR extraction.',
      },
      notes: 'Document quality is unclear and verification is incomplete.',
    },
    KYC: {
      stage: 'KYC',
      applicationId: 'APP-30011',
      companyName: 'Redacted Commercial Applicant',
      demoScenario: 'MANUAL_REVIEW',
      aggregatedOcrSummary:
        'Business registration is referenced, but ownership information is incomplete and cannot be fully verified.',
      document: {
        filename: 'ownership_gap_redacted.pdf',
        ocrText:
          'Registration support appears present, but beneficial owner information is partial and unclear.',
      },
      notes: 'Ownership clarity is incomplete in the provided context.',
    },
    CREDIT: {
      stage: 'CREDIT',
      applicationId: 'APP-30012',
      companyName: 'Redacted Commercial Applicant',
      demoScenario: 'MANUAL_REVIEW',
      aggregatedOcrSummary:
        'Business risk context indicates limited history and uncertain performance with insufficient data for clear approval.',
      notes: 'Thin file and mixed credit indicators require manual review.',
    },
    RISK: {
      stage: 'RISK',
      applicationId: 'APP-30013',
      companyName: 'Redacted Commercial Applicant',
      demoScenario: 'MANUAL_REVIEW',
      priorStageDecisions: [
        { stage: 'DOCUMENT_REVIEW', decision: 'APPROVED' },
        { stage: 'KYC', decision: 'MANUAL_REVIEW' },
        { stage: 'CREDIT', decision: 'APPROVED' },
      ],
      notes: 'An upstream uncertainty remains unresolved.',
    },
  },
};

const stageOptions: Stage[] = ['DOCUMENT_REVIEW', 'KYC', 'CREDIT', 'RISK'];

const agentCards = [
  {
    stage: 'KYC',
    title: 'KYC Agent',
    ownership: 'Business registration, ownership clarity, and consistency checks',
    file: 'agents/kyc-agent.md',
  },
  {
    stage: 'CREDIT',
    title: 'Credit Agent',
    ownership: 'Account-opening credit posture using only supplied business-risk context',
    file: 'agents/credit-agent.md',
  },
  {
    stage: 'RISK',
    title: 'Risk Agent',
    ownership: 'Final conservative risk decision from prior-stage outcomes',
    file: 'agents/risk-agent.md',
  },
];

const emptyResponse: EvaluationResponse = {
  stage: 'KYC',
  decision: 'MANUAL_REVIEW',
  confidence: 0,
  rationale: 'Submit a payload to see the regulator-friendly reasoning.',
  keyFactors: ['No decision has been generated yet.'],
};

function toneClasses(decision: string) {
  if (decision === 'APPROVED') {
    return 'border-[color:rgba(46,160,67,0.35)] bg-[color:rgba(46,160,67,0.12)] text-[var(--success)]';
  }
  if (decision === 'REJECTED') {
    return 'border-[color:rgba(248,81,73,0.35)] bg-[color:rgba(248,81,73,0.12)] text-[var(--danger)]';
  }
  return 'border-[var(--border)] bg-[color:rgba(242,204,96,0.12)] text-[var(--warning)]';
}

export function OnboardingView() {
  const [scenario, setScenario] = useState<ScenarioKey>('GOOD');
  const [stage, setStage] = useState<Stage>('KYC');
  const [requestBody, setRequestBody] = useState(
    JSON.stringify(presets.GOOD.KYC, null, 2),
  );
  const [result, setResult] = useState<EvaluationResponse>(emptyResponse);
  const [status, setStatus] = useState('Loaded Good User');

  const activeScenario = scenarioCatalog[scenario];
  const activeAgent = useMemo(
    () => agentCards.find((agent) => agent.stage === stage) ?? null,
    [stage],
  );

  function loadPreset(nextScenario: ScenarioKey, nextStage: Stage = stage) {
    setScenario(nextScenario);
    setStage(nextStage);
    setRequestBody(JSON.stringify(presets[nextScenario][nextStage], null, 2));
    setStatus(`Loaded ${scenarioCatalog[nextScenario].label}`);
  }

  function syncStageIntoPayload(nextStage: Stage, rawText: string) {
    const parsed = JSON.parse(rawText) as Record<string, unknown>;
    parsed.stage = nextStage;
    return JSON.stringify(parsed, null, 2);
  }

  async function evaluate() {
    let payload: Record<string, unknown>;

    try {
      payload = JSON.parse(requestBody) as Record<string, unknown>;
      payload.stage = stage;
      setRequestBody(JSON.stringify(payload, null, 2));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown parse error';
      setStatus('Invalid JSON');
      setResult({
        ...emptyResponse,
        rationale: 'The JSON payload is invalid and could not be evaluated.',
        keyFactors: [message],
        error: 'Invalid JSON input',
        details: message,
      });
      return;
    }

    setStatus('Evaluating');

    try {
      const response = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as EvaluationResponse & { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? 'Evaluation failed');
      }
      setResult(data);
      setStatus(data.decision);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown request error';
      setStatus('Request failed');
      setResult({
        ...emptyResponse,
        rationale: 'The decision service could not complete the request.',
        keyFactors: [message],
        error: 'Request failed',
        details: message,
      });
    }
  }

  async function copyJson() {
    await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setStatus('JSON copied');
  }

  function formatJson() {
    try {
      setRequestBody(syncStageIntoPayload(stage, requestBody));
      setStatus('JSON formatted');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown parse error';
      setStatus('Invalid JSON');
      setResult({
        ...emptyResponse,
        rationale: 'The JSON payload is invalid and could not be formatted.',
        keyFactors: [message],
        error: 'Invalid JSON input',
        details: message,
      });
    }
  }

  return (
    <div className="grid gap-6">
      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
        <Card className="overflow-hidden">
          <Badge variant="success" className="mb-3">
            <Sparkles className="h-3.5 w-3.5" />
            Commercial account opening
          </Badge>
          <h2 className="text-3xl font-semibold tracking-[-0.03em] text-[var(--foreground)]">
            Good-user and bad-user onboarding journeys, now inside the KYC fabric platform.
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--muted-foreground)]">
            This workbench keeps the kyc-fabric dashboard as the primary frontend while
            porting in the advisory-only commercial onboarding flow, the specialist agent
            rulebooks, and the Node.js decision service behind <code>/api/evaluate</code>.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Badge variant="info">Node backend on port 8080</Badge>
            <Badge variant="warning">Advisory only</Badge>
            <Badge variant="default">JSON in, auditable decision out</Badge>
          </div>
        </Card>

        <Card>
          <Badge variant="info">Active scenario</Badge>
          <h3 className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
            {activeScenario.label}
          </h3>
          <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
            {activeScenario.description}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {activeScenario.path.map((step) => (
              <span
                key={step}
                className="rounded-full border border-[var(--border)] bg-[color:rgba(255,255,255,0.05)] px-3 py-1 text-xs text-[var(--muted-foreground)]"
              >
                {step}
              </span>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        {(Object.entries(scenarioCatalog) as [ScenarioKey, (typeof scenarioCatalog)[ScenarioKey]][]).map(
          ([key, item]) => (
            <button
              key={key}
              type="button"
              onClick={() => loadPreset(key, stage)}
              className={`rounded-[1.75rem] border p-5 text-left transition-all duration-200 hover:-translate-y-0.5 ${scenario === key ? 'border-[color:rgba(0,201,177,0.45)] bg-[linear-gradient(135deg,rgba(0,201,177,0.12),rgba(31,111,235,0.08))]' : 'border-[var(--border)] bg-[color:rgba(255,255,255,0.03)]'} `}
            >
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs uppercase tracking-[0.26em] text-[var(--muted-foreground)]">
                  {item.label}
                </span>
                {key === 'GOOD' ? (
                  <CheckCircle2 className="h-4 w-4 text-[var(--success)]" />
                ) : key === 'BAD' ? (
                  <AlertTriangle className="h-4 w-4 text-[var(--danger)]" />
                ) : (
                  <FileWarning className="h-4 w-4 text-[var(--warning)]" />
                )}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-[var(--foreground)]">{item.headline}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                {item.description}
              </p>
            </button>
          ),
        )}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <Badge variant="info">Stage and agent</Badge>
              <h3 className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
                Specialist ownership
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {stageOptions.map((option) => (
                <Button
                  key={option}
                  type="button"
                  variant={stage === option ? 'primary' : 'secondary'}
                  onClick={() => loadPreset(scenario, option)}
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            <Card className="border-[color:rgba(0,201,177,0.22)] bg-[color:rgba(255,255,255,0.03)]">
              <Badge variant="warning">Document review</Badge>
              <h4 className="mt-3 text-lg font-semibold text-[var(--foreground)]">
                Identity evidence gate
              </h4>
              <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                Validates business identity support before specialist KYC, credit, and final risk review.
              </p>
              <code className="mt-4 inline-block rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--muted-foreground)]">
                prompt1_updaed.txt
              </code>
            </Card>
            {agentCards.map((agent) => (
              <Card
                key={agent.stage}
                className={
                  stage === agent.stage
                    ? 'border-[color:rgba(0,201,177,0.35)] bg-[linear-gradient(135deg,rgba(0,201,177,0.12),rgba(31,111,235,0.06))]'
                    : 'bg-[color:rgba(255,255,255,0.03)]'
                }
              >
                <Badge variant={stage === agent.stage ? 'success' : 'default'}>{agent.stage}</Badge>
                <h4 className="mt-3 text-lg font-semibold text-[var(--foreground)]">
                  {agent.title}
                </h4>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                  {agent.ownership}
                </p>
                <code className="mt-4 inline-block rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--muted-foreground)]">
                  {agent.file}
                </code>
              </Card>
            ))}
          </div>
          {activeAgent ? (
            <div className="mt-5 rounded-[1.5rem] border border-[var(--border)] bg-[color:rgba(255,255,255,0.03)] p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
                Active agent
              </p>
              <div className="mt-3 flex items-center gap-2 text-lg font-semibold text-[var(--foreground)]">
                <ShieldCheck className="h-5 w-5 text-[var(--accent)]" />
                {activeAgent.title}
              </div>
              <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                {activeAgent.ownership}
              </p>
            </div>
          ) : null}
        </Card>

        <Card>
          <Badge variant="default">Decision output</Badge>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.25rem] border border-[var(--border)] bg-[color:rgba(255,255,255,0.03)] p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
                Decision
              </p>
              <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">{result.decision}</p>
            </div>
            <div className="rounded-[1.25rem] border border-[var(--border)] bg-[color:rgba(255,255,255,0.03)] p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
                Confidence
              </p>
              <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
                {typeof result.confidence === 'number' ? `${result.confidence}/100` : '-'}
              </p>
            </div>
            <div className="rounded-[1.25rem] border border-[var(--border)] bg-[color:rgba(255,255,255,0.03)] p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
                Stage
              </p>
              <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">{result.stage}</p>
            </div>
          </div>
          <div className={`mt-4 rounded-full border px-4 py-2 text-sm font-medium ${toneClasses(result.decision)}`}>
            {status}
          </div>
          <div className="mt-5 rounded-[1.5rem] border border-[var(--border)] bg-[color:rgba(255,255,255,0.03)] p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
              Rationale
            </p>
            <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">
              {result.rationale}
            </p>
            {result.details ? (
              <p className="mt-2 text-sm text-[var(--danger)]">{result.details}</p>
            ) : null}
          </div>
          <div className="mt-5 rounded-[1.5rem] border border-[var(--border)] bg-[color:rgba(255,255,255,0.03)] p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
              Key factors
            </p>
            <ul className="mt-3 grid gap-3 text-sm leading-6 text-[var(--muted-foreground)]">
              {result.keyFactors.map((factor) => (
                <li key={factor} className="rounded-[1rem] border border-[var(--border)] px-3 py-2">
                  {factor}
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Badge variant="info">Request payload</Badge>
              <h3 className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
                Structured JSON input
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="primary" onClick={() => void evaluate()}>
                Evaluate
              </Button>
              <Button type="button" variant="secondary" onClick={formatJson}>
                Format JSON
              </Button>
            </div>
          </div>
          <textarea
            className="mt-5 min-h-[34rem] w-full rounded-[1.5rem] border border-[var(--border)] bg-[color:rgba(8,11,17,0.72)] p-4 font-mono text-sm leading-7 text-[var(--foreground)] outline-none"
            spellCheck={false}
            value={requestBody}
            onChange={(event) => setRequestBody(event.target.value)}
          />
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-3">
            <div>
              <Badge variant="warning">Raw response</Badge>
              <h3 className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
                API contract view
              </h3>
            </div>
            <Button type="button" variant="ghost" onClick={() => void copyJson()}>
              <Copy className="h-4 w-4" />
              Copy JSON
            </Button>
          </div>
          <pre className="mt-5 overflow-auto rounded-[1.5rem] border border-[var(--border)] bg-[color:rgba(8,11,17,0.72)] p-4 text-sm leading-7 text-[var(--foreground)]">
            {JSON.stringify(result, null, 2)}
          </pre>
          <div className="mt-5 rounded-[1.5rem] border border-[var(--border)] bg-[color:rgba(255,255,255,0.03)] p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
              Integration notes
            </p>
            <ul className="mt-3 grid gap-3 text-sm leading-6 text-[var(--muted-foreground)]">
              <li>The frontend now uses the kyc-fabric TypeScript shell as the primary UI.</li>
              <li>The onboarding workbench talks to the Node backend through the Vite proxy.</li>
              <li>Specialist agent rulebooks remain in <code>AGENT.md</code> and <code>agents/</code>.</li>
            </ul>
          </div>
        </Card>
      </section>
    </div>
  );
}
