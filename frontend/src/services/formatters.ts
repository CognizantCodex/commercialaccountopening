import type { DashboardRoute, Severity } from '@/types/platform';

export function formatTimestamp(timestamp: string) {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(timestamp));
}

export function formatRouteLabel(route: DashboardRoute) {
  return {
    executive: 'Executive Command Center',
    agents: 'AI Agent Operations Center',
    cases: 'KYC Case Explorer',
    monitoring: 'Continuous Monitoring Map',
    governance: 'AI Governance Console',
  }[route];
}

export function getSeverityTone(severity: Severity) {
  return {
    info: 'text-[var(--accent-secondary)] bg-[var(--surface-info)]',
    success: 'text-[var(--success)] bg-[var(--surface-success)]',
    warning: 'text-[var(--warning)] bg-[var(--surface-warning)]',
    critical: 'text-[var(--danger)] bg-[var(--surface-danger)]',
  }[severity];
}
