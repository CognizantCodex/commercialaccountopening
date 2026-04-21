import { createApiClient } from '@/lib/api-client';
import { adaptPlatformSnapshot, type PlatformSnapshotDto } from '@/services/platform-adapter';
import type { ScenarioState } from '@/mock-data/adapters';
import type { CaseWorkflowAction } from '@/store/types';
import type { CheckKycRequest, CheckKycResponse, DataSourceMode } from '@/types/platform';

const dataSourceStorageKey = 'kyc-data-source';

interface PlatformEndpointConfig {
  snapshotPath: string;
  resolveCasePath: string;
  monitoringPath: string;
  governancePath: string;
  checkKycPath: string;
}

function isDataSourceMode(value: string | null): value is DataSourceMode {
  return value === 'demo' || value === 'live';
}

function buildEndpointConfig(): PlatformEndpointConfig {
  return {
    snapshotPath: import.meta.env.VITE_PLATFORM_SNAPSHOT_PATH ?? '/api/platform/snapshot',
    resolveCasePath: import.meta.env.VITE_PLATFORM_CASE_RESOLVE_PATH ?? '/api/cases/{caseId}/resolve',
    monitoringPath:
      import.meta.env.VITE_PLATFORM_CASE_MONITORING_PATH ?? '/api/cases/{caseId}/monitoring',
    governancePath:
      import.meta.env.VITE_PLATFORM_CASE_GOVERNANCE_PATH ??
      '/api/governance/cases/{caseId}/decision',
    checkKycPath: import.meta.env.VITE_PLATFORM_CHECK_KYC_PATH ?? '/api/checkKYC',
  };
}

function resolvePath(action: CaseWorkflowAction, caseId: string, config: PlatformEndpointConfig) {
  const template =
    action === 'resolve'
      ? config.resolveCasePath
      : action === 'start-monitoring'
        ? config.monitoringPath
        : config.governancePath;

  return template.replace('{caseId}', encodeURIComponent(caseId));
}

export function resolveInitialDataSource(): DataSourceMode {
  if (typeof document !== 'undefined') {
    const datasetSource = document.documentElement.dataset.platformSource ?? null;
    if (isDataSourceMode(datasetSource)) {
      return datasetSource;
    }
  }

  if (typeof window !== 'undefined') {
    const storedSource = window.localStorage.getItem(dataSourceStorageKey);
    if (isDataSourceMode(storedSource)) {
      return storedSource;
    }
  }

  return import.meta.env.VITE_PLATFORM_DATA_SOURCE === 'demo' ? 'demo' : 'live';
}

export function persistDataSource(mode: DataSourceMode) {
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.platformSource = mode;
  }

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(dataSourceStorageKey, mode);
  }
}

export function createPlatformApi() {
  const config = buildEndpointConfig();
  const client = createApiClient(import.meta.env.VITE_API_BASE_URL ?? '');

  return {
    async fetchSnapshot(): Promise<ScenarioState> {
      const payload = await client.get<PlatformSnapshotDto>(config.snapshotPath);
      return adaptPlatformSnapshot(payload);
    },
    async fetchAccountOpeningSnapshot(): Promise<PlatformSnapshotDto> {
      return client.get<PlatformSnapshotDto>('/api/account-opening/platform-snapshot');
    },
    async runCaseWorkflowAction(action: CaseWorkflowAction, caseId: string) {
      const path = resolvePath(action, caseId, config);
      await client.post(path, {
        action,
        caseId,
      });
    },
    async checkKyc(request: CheckKycRequest): Promise<CheckKycResponse> {
      return client.post<CheckKycResponse>(config.checkKycPath, request);
    },
  };
}

export const platformApi = createPlatformApi();
