const credKey = (id) => `testbuddy_guest_${id}`;
const resultKey = (id) => `testbuddy_guest_result_${id}`;

export function readCredential(id) {
  try { return sessionStorage.getItem(credKey(id)); } catch { return null; }
}

export function readResult(id) {
  try {
    const raw = sessionStorage.getItem(resultKey(id));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function storeResult(id, result) {
  try { sessionStorage.setItem(resultKey(id), JSON.stringify(result)); } catch {}
}

export function secondsRemaining(expiresAtMs, offsetMs) {
  return Math.max(0, Math.ceil((expiresAtMs - (Date.now() + offsetMs)) / 1000));
}

