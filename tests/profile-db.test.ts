/**
 * profileDb error-surfacing (2026-07-05 regression): a signed-in profile that fails to save is
 * silent DATA LOSS. A grant misconfig once made saveProfile fail (42501) for every signed-in
 * user for days, unnoticed, because the error was swallowed. These tests pin that any upsert
 * or read failure now reaches Sentry via captureError — the alarm that lets us catch it fast.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const captureError = vi.fn();
vi.mock('@/lib/monitoring', () => ({ captureError: (...a: unknown[]) => captureError(...a) }));

// Controllable supabase stub: upsert() and the select→eq→maybeSingle read chain.
let upsertResult: { error: unknown } = { error: null };
let readResult: { data: unknown; error: unknown } = { data: null, error: null };
const upsert = vi.fn(() => Promise.resolve(upsertResult));
const maybeSingle = vi.fn(() => Promise.resolve(readResult));
vi.mock('@/core/supabase', () => ({
  supabase: { from: () => ({ upsert, select: () => ({ eq: () => ({ maybeSingle }) }) }) },
}));

import { saveProfile, loadProfileRow } from '@/core/profileDb';

beforeEach(() => {
  vi.clearAllMocks();
  upsertResult = { error: null };
  readResult = { data: null, error: null };
});

describe('saveProfile', () => {
  it('success → no Sentry alert', async () => {
    await saveProfile('u1', { nationalities: ['US'] });
    expect(upsert).toHaveBeenCalledOnce();
    expect(captureError).not.toHaveBeenCalled();
  });

  it('upsert error → alerts Sentry with the code and op (the anti-silent-data-loss guard)', async () => {
    upsertResult = { error: { code: '42501', message: 'permission denied for table profiles' } };
    await saveProfile('u1', { nationalities: ['US'] });
    expect(captureError).toHaveBeenCalledOnce();
    const [err, ctx] = captureError.mock.calls[0] as [Error, Record<string, unknown>];
    expect(err.message).toContain('saveProfile failed');
    expect(err.message).toContain('42501');
    expect(ctx).toMatchObject({ op: 'saveProfile', code: '42501' });
  });
});

describe('loadProfileRow', () => {
  it('reads answers + is_staff when the primary select succeeds', async () => {
    readResult = { data: { answers: { nationalities: ['US'] }, is_staff: true }, error: null };
    const row = await loadProfileRow('u1');
    expect(row).toEqual({ answers: { nationalities: ['US'] }, isStaff: true });
    expect(captureError).not.toHaveBeenCalled();
  });

  it('is_staff column missing → falls back silently (benign migration gap, no alert)', async () => {
    // First call errors (no is_staff column), second (answers-only) succeeds.
    readResult = { data: null, error: { code: '42703', message: 'column is_staff does not exist' } };
    maybeSingle
      .mockImplementationOnce(() => Promise.resolve({ data: null, error: { code: '42703', message: 'no col' } }))
      .mockImplementationOnce(() => Promise.resolve({ data: { answers: { x: 1 } }, error: null }));
    const row = await loadProfileRow('u1');
    expect(row).toEqual({ answers: { x: 1 }, isStaff: false });
    expect(captureError).not.toHaveBeenCalled();
  });

  it('both reads fail → alerts Sentry (a real read failure, not the migration gap)', async () => {
    maybeSingle
      .mockImplementationOnce(() => Promise.resolve({ data: null, error: { code: '42501', message: 'denied' } }))
      .mockImplementationOnce(() => Promise.resolve({ data: null, error: { code: '42501', message: 'denied' } }));
    await loadProfileRow('u1');
    expect(captureError).toHaveBeenCalledOnce();
    expect((captureError.mock.calls[0][0] as Error).message).toContain('loadProfileRow failed');
  });
});
