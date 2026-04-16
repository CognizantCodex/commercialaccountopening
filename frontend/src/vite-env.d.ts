/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_PLATFORM_DATA_SOURCE?: 'demo' | 'live';
  readonly VITE_PLATFORM_SNAPSHOT_PATH?: string;
  readonly VITE_PLATFORM_CASE_RESOLVE_PATH?: string;
  readonly VITE_PLATFORM_CASE_MONITORING_PATH?: string;
  readonly VITE_PLATFORM_CASE_GOVERNANCE_PATH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
