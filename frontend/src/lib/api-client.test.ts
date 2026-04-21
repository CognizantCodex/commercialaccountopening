import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiClientError, createApiClient } from '@/lib/api-client';

describe('createApiClient', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('serializes JSON requests and parses JSON responses', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    const client = createApiClient('/base');
    const payload = await client.post('/resource', { hello: 'world' });

    expect(payload).toEqual({ ok: true });
    expect(fetchSpy).toHaveBeenCalledWith(
      '/base/resource',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ hello: 'world' }),
      }),
    );
  });

  it('returns null for empty 204 responses and keeps absolute URLs intact', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(null, {
        status: 204,
      }),
    );

    const client = createApiClient('/base');

    await expect(client.get('https://example.com/live')).resolves.toBeNull();
  });

  it('throws an ApiClientError with the payload message when the response fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ message: 'Backend exploded' }), {
        status: 500,
        headers: { 'content-type': 'application/json' },
      }),
    );

    const client = createApiClient();

    await expect(client.get('/broken')).rejects.toMatchObject<ApiClientError>({
      name: 'ApiClientError',
      status: 500,
      message: 'Backend exploded',
    });
  });

  it('falls back to a generic error message for non-JSON failures', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('temporarily unavailable', {
        status: 503,
        headers: { 'content-type': 'text/plain' },
      }),
    );

    const client = createApiClient();

    await expect(client.get('/maintenance')).rejects.toThrow('temporarily unavailable');
  });
});
