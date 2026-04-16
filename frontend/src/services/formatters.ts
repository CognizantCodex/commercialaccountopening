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
    info: 'text-[var(--accent-secondary)] bg-[color:rgba(31,111,235,0.14)]',
    success: 'text-[var(--success)] bg-[color:rgba(46,160,67,0.16)]',
    warning: 'text-[var(--warning)] bg-[color:rgba(242,204,96,0.14)]',
    critical: 'text-[var(--danger)] bg-[color:rgba(248,81,73,0.16)]',
  }[severity];
}
