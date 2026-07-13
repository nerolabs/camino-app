/**
 * Native App Attest session (C2b — the non-spoofable native equivalent of the web's Turnstile).
 *
 * iOS: Apple App Attest via @expo/app-integrity — a hardware-backed Secure-Enclave key attests the
 * app is genuine, silently (zero UX). Server verifies (lib/appAttest.ts) and mints the same HMAC
 * session token web gets. Android (Play Integrity) is deferred with the Play Store track; on
 * Android `AppIntegrity.isSupported` is falsy so this no-ops until that path is added.
 *
 * Until the server flag NATIVE_ATTESTATION_ENABLED is set (after on-device validation in build 39),
 * the attest exchange returns 501 and this yields null — so native Lola stays gated. That's the
 * intended state until the attestation verification is device-validated.
 */
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AppIntegrity from '@expo/app-integrity';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? '';
const KEY_ID_STORAGE = 'camino.appattest.keyId';

let cached: { session: string; exp: number } | null = null;
let inFlight: Promise<string | null> | null = null;

async function post(body: unknown): Promise<Response> {
  return fetch(`${API_BASE}/api/session`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  });
}

async function attest(): Promise<string | null> {
  try {
    // iOS-only for now; on the simulator App Attest is unavailable (isSupported === false).
    if (Platform.OS !== 'ios' || !AppIntegrity.isSupported) return null;

    // 1. A persistent Secure-Enclave key — generated once, keyId stored (the key never leaves it).
    let keyId = await AsyncStorage.getItem(KEY_ID_STORAGE);
    if (!keyId) {
      keyId = await AppIntegrity.generateKeyAsync();
      await AsyncStorage.setItem(KEY_ID_STORAGE, keyId);
    }

    // 2. A one-time challenge from the server (signed nonce, prevents replay).
    const chRes = await post({ kind: 'challenge' });
    if (!chRes.ok) return null;
    const { challenge } = (await chRes.json()) as { challenge?: string };
    if (!challenge) return null;

    // 3. Attest the key against the challenge (hardware-backed, no user interaction).
    const attestation = await AppIntegrity.attestKeyAsync(keyId, challenge);

    // 4. Exchange the attestation for a session token (same token the web Turnstile path mints).
    const res = await post({ kind: 'attest', keyId, attestation, challenge });
    if (!res.ok) return null; // 501 while the server flag is off, or 403 on a bad attestation
    const { session } = (await res.json()) as { session?: string };
    if (!session) return null;
    const exp = Number(session.split('.')[0]) || (Date.now() + 25 * 60_000);
    cached = { session, exp };
    return session;
  } catch {
    return null; // fail soft — the server decides whether to require a session
  }
}

export async function getNativeSession(): Promise<string | null> {
  const now = Date.now();
  if (cached && cached.exp - 60_000 > now) return cached.session;
  if (inFlight) return inFlight;
  inFlight = attest().finally(() => { inFlight = null; });
  return inFlight;
}
