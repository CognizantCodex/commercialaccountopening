import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getMock, postMock, adaptMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  postMock: vi.fn(),
  adaptMock: vi.fn((payload) => ({ adapted: payload })),
}));

vi.mock('@/lib/api-client', () => ({
  createApiClient: vi.fn(() => ({
    get: getMock,
    post: postMock,
  })),
}));

vi.mock('@/services/platform-adapter', () => ({
  adaptPlatformSnapshot: adaptMock,
}));

import {
  createPlatformApi,
  persistDataSource,
  resolveInitialDataSource,
} from '@/services/platform-api';

describe('platform-api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    delete document.documentElement.dataset.platformSource;
  });

  it('resolves the initial data source from document state before local storage', () => {
    document.documentElement.dataset.platformSource = 'live';
    window.localStorage.setItem('kyc-data-source', 'demo');

    expect(resolveInitialDataSource()).toBe('live');
  });

  it('persists the chosen data source to both the DOM and local storage', () => {
    persistDataSource('demo');

    expect(document.documentElement.dataset.platformSource).toBe('demo');
    expect(window.localStorage.getItem('kyc-data-source')).toBe('demo');
  });

  it('fetches snapshots, adapts them, and posts workflow/checkKyc requests to the right endpoints', async () => {
    const api = createPlatformApi();
    const snapshot = { data: { cases: [] } };
    const request = { brandName: 'Harbor Commercial' };

    getMock.mockResolvedValue(snapshot);
    postMock.mockResolvedValue({ status: 'pass' });

    await expect(api.fetchSnapshot()).resolves.toEqual({ adapted: snapshot });
    expect(getMock).toHaveBeenCalledWith('/api/platform/snapshot');
    expect(adaptMock).toHaveBeenCalledWith(snapshot);

    await api.runCaseWorkflowAction('open-governance', 'case/with spaces');
    expect(postMock).toHaveBeenCalledWith(
      '/api/governance/cases/case%2Fwith%20spaces/decision',
      {
        action: 'open-governance',
        caseId: 'case/with spaces',
      },
    );

    await api.checkKyc(request as never);
    expect(postMock).toHaveBeenLastCalledWith('/api/checkKYC', request);
  });
});
