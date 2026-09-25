const STORAGE_KEY = 'caniclone-anonymous-user-id';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

let memoryId: string | null = null;

function createUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  const bytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function isAnonymousUserId(value: unknown): value is string {
  return typeof value === 'string' && UUID_RE.test(value);
}

/**
 * Return the stable anonymous owner id used by the existing Ideas API.
 * This is intentionally browser-only: the server never needs to invent an owner.
 */
export function getAnonymousUserId(): string {
  if (memoryId) return memoryId;
  if (typeof window === 'undefined') {
    throw new Error('Anonymous user ids are only available in the browser');
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isAnonymousUserId(stored)) {
      memoryId = stored;
      return stored;
    }
  } catch {
    // Private browsing or blocked storage still gets an in-memory id.
  }

  const id = createUuid();
  memoryId = id;
  try {
    window.localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // Keep using the in-memory id for this session.
  }
  return id;
}

export function createClientRequestId(): string {
  return createUuid();
}
