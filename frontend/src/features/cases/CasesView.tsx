import { useDeferredValue, useMemo, useState } from 'react';
import { ArrowRight, Filter, ShieldAlert, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { NarrativeTimeline } from '@/components/charts/NarrativeTimeline';
import { OwnershipForceGraph } from '@/components/charts/OwnershipForceGraph';
import { RadialCompletenessChart } from '@/components/charts/RadialCompletenessChart';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { usePlatformStore } from '@/store';
import { getSelectedCase, getCaseTimeline } from '@/services/selectors';

const statusFilters = ['all', 'in-flight', 'exception', 'resolved', 'monitored'] as const;

export function CasesView() {
  const navigate = useNavigate();
  const cases = usePlatformStore((state) => state.cases);
  const timeline = usePlatformStore((state) => state.timeline);
  const currentStep = usePlatformStore((state) => state.currentStep);
  const selectedCaseId = usePlatformStore((state) => state.selectedCaseId);
  const selectCase = usePlatformStore((state) => state.selectCase);
  const dataSource = usePlatformStore((state) => state.dataSource);
  const activeMutation = usePlatformStore((state) => state.activeMutation);
  const runCaseWorkflowAction = usePlatformStore((state) => state.runCaseWorkflowAction);
  const selectedCase = usePlatformStore(getSelectedCase);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<(typeof statusFilters)[number]>('all');
  const deferredSearch = useDeferredValue(search);

  const filteredCases = useMemo(() => {
    const normalized = deferredSearch.toLowerCase();
    return cases.filter((record) => {
      const matchesFilter = statusFilter === 'all' || record.status === statusFilter;
      const matchesSearch =
        !normalized ||
        record.caseName.toLowerCase().includes(normalized) ||
        record.jurisdiction.toLowerCase().includes(normalized);
      return matchesFilter && matchesSearch;
    });
  }, [cases, deferredSearch, statusFilter]);

  const visibleTimeline = selectedCase
    ? getCaseTimeline(selectedCase, timeline.slice(0, currentStep))
    : [];

  const resolutionEvent = timeline.find((event) => event.type === 'advisor_resolved');
  const monitoringEvent = timeline.find((event) => event.type === 'monitoring_alert');
  const governanceEvent = timeline.find((event) => event.type === 'governance_logged');
  const pendingAction = activeMutation?.caseId === selectedCase?.id ? activeMutation.action : null;

  if (!selectedCase) {
    return null;
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[330px_minmax(0,1fr)]">
      <Card className="h-full">
        <div className="flex items-center justify-between">
          <div>
            <Badge variant="default">Case rail</Badge>
            <h3 className="mt-3 text-xl font-semibold text-[var(--foreground)]">
              Active KYC cases
            </h3>
          </div>
          <Filter className="h-4 w-4 text-[var(--muted-foreground)]" />
        </div>
        <input
          className="mt-4 w-full rounded-[1.2rem] border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)]"
          placeholder="Search cases or jurisdictions"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {statusFilters.map((filter) => (
            <button
              key={filter}
              type="button"
              className={`rounded-full border px-3 py-1.5 text-xs uppercase tracking-[0.16em] ${statusFilter === filter ? 'border-[color:rgba(0,201,177,0.45)] bg-[var(--surface-accent)] text-[var(--foreground)]' : 'border-[var(--border)] text-[var(--muted-foreground)]'}`}
              onClick={() => setStatusFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
        <div className="mt-4 space-y-3">
          {filteredCases.map((record) => (
            <button
              key={record.id}
              type="button"
              className={`w-full rounded-[1.35rem] border p-4 text-left transition-colors ${selectedCaseId === record.id ? 'border-[color:rgba(0,201,177,0.45)] bg-[linear-gradient(135deg,rgba(0,201,177,0.14),rgba(31,111,235,0.08))]' : 'border-[var(--border)] bg-[var(--surface-muted)] hover:bg-[var(--surface-hover)]'}`}
              onClick={() => selectCase(record.id)}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="font-medium text-[var(--foreground)]">{record.caseName}</div>
                <Badge variant={record.status === 'exception' ? 'danger' : 'default'}>
                  {record.status}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">{record.jurisdiction}</p>
            </button>
          ))}
        </div>
      </Card>

      <div className="grid gap-6">
        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <Card>
            <Badge variant="info">Selected case</Badge>
            <h3 className="mt-3 text-xl font-semibold text-[var(--foreground)]">
              {selectedCase.caseName}
            </h3>
            <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
              {selectedCase.narrative}
            </p>
            <div className="mt-4">
              <RadialCompletenessChart value={selectedCase.completeness} />
            </div>
          </Card>

          <Card>
            <Badge variant="warning">QC checklist</Badge>
            <h3 className="mt-3 text-xl font-semibold text-[var(--foreground)]">
              Policy controls and next best action
            </h3>
            <div className="mt-4 space-y-3">
              {selectedCase.qcRules.map((rule) => (
                <div
                  key={rule.id}
                  className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface-muted)] p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium text-[var(--foreground)]">{rule.label}</div>
                    <Badge
                      variant={
                        rule.status === 'passed'
                          ? 'success'
                          : rule.status === 'failed'
                            ? 'danger'
                            : 'warning'
                      }
                    >
                      {rule.status}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                    {rule.rationale}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface-accent-soft)] p-4">
              <div className="inline-flex items-center gap-2 text-sm font-medium text-[var(--foreground)]">
                <Sparkles className="h-4 w-4 text-[var(--accent)]" />
                Recommended next action
              </div>
              <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                {selectedCase.nextBestAction}
              </p>
            </div>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <NarrativeTimeline entries={visibleTimeline} title="Document and event timeline" />
          <OwnershipForceGraph graph={selectedCase.ownershipGraph} />
        </section>

        <section>
          <Card>
            <Badge variant="default">Exception handling</Badge>
            <h3 className="mt-3 text-xl font-semibold text-[var(--foreground)]">
              Resolve or escalate from the same workspace
            </h3>
            <div className="mt-4 grid gap-4 xl:grid-cols-3">
              <div className="rounded-[1.35rem] border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                <div className="inline-flex items-center gap-2 font-medium text-[var(--foreground)]">
                  <ShieldAlert className="h-4 w-4 text-[var(--warning)]" />
                  Clear current exception
                </div>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                  Apply the advisor resolution event to demonstrate human-in-the-loop remediation.
                </p>
                <Button
                  className="mt-4"
                  variant="secondary"
                  disabled={pendingAction === 'resolve'}
                  onClick={() => {
                    if (dataSource === 'demo' && !resolutionEvent) {
                      return;
                    }

                    void runCaseWorkflowAction('resolve', selectedCase.id).catch(() => undefined);
                  }}
                >
                  {pendingAction === 'resolve' ? 'Applying…' : 'Apply resolution'}
                </Button>
              </div>
              <div className="rounded-[1.35rem] border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                <div className="inline-flex items-center gap-2 font-medium text-[var(--foreground)]">
                  <ArrowRight className="h-4 w-4 text-[var(--accent)]" />
                  Trigger monitoring
                </div>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                  Move the case from onboarding into always-on surveillance using the scripted alert.
                </p>
                <Button
                  className="mt-4"
                  variant="secondary"
                  disabled={pendingAction === 'start-monitoring'}
                  onClick={() => {
                    if (dataSource === 'demo' && !monitoringEvent) {
                      return;
                    }

                    void runCaseWorkflowAction('start-monitoring', selectedCase.id).catch(
                      () => undefined,
                    );
                  }}
                >
                  {pendingAction === 'start-monitoring' ? 'Starting…' : 'Start monitoring'}
                </Button>
              </div>
              <div className="rounded-[1.35rem] border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                <div className="inline-flex items-center gap-2 font-medium text-[var(--foreground)]">
                  <Sparkles className="h-4 w-4 text-[var(--accent-secondary)]" />
                  Open explainability pack
                </div>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                  Record the governance decision and jump directly into the audit console.
                </p>
                <Button
                  className="mt-4"
                  onClick={() => {
                    if (dataSource === 'demo' && !governanceEvent) {
                      return;
                    }

                    void runCaseWorkflowAction('open-governance', selectedCase.id)
                      .then(() => {
                        void navigate('/governance');
                      })
                      .catch(() => undefined);
                  }}
                  disabled={pendingAction === 'open-governance'}
                >
                  {pendingAction === 'open-governance' ? 'Opening…' : 'Open governance'}
                </Button>
              </div>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}
