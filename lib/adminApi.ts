// Dual-layer authenticated API client for CMS operations with multi-tab real-time sync

const ADMIN_TOKEN_KEY = 'ls_admin_token';
const CMS_SYNC_CHANNEL_NAME = 'lapiez_cms_sync';
const CMS_LAST_SYNC_KEY = 'ls_last_cms_sync';

export function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAdminToken(token: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
  } catch {}
}

export function removeAdminToken(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  } catch {}
}

/**
 * Universal authenticated fetch for all CMS and Admin endpoints.
 * Automatically attaches:
 * 1. credentials: 'include' (for httpOnly session cookie)
 * 2. Authorization: Bearer <token> (for token fallback)
 * 3. x-admin-token: <token> (for explicit admin header)
 * 4. Content-Type: application/json (when appropriate)
 */
export async function adminFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const token = getAdminToken();
  const headers = new Headers(init.headers || {});

  if (!headers.has('Content-Type') && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    if (!headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    if (!headers.has('x-admin-token')) {
      headers.set('x-admin-token', token);
    }
  }

  return fetch(input, {
    ...init,
    headers,
    credentials: 'include',
  });
}

let broadcastDebounceTimer: NodeJS.Timeout | null = null;

/**
 * Broadcasts a CMS mutation event across all browser tabs and windows.
 * Debounced to avoid hammering channels during rapid successive mutations.
 */
export function broadcastCmsUpdate(source: string = 'admin'): void {
  if (typeof window === 'undefined') return;

  if (broadcastDebounceTimer) {
    clearTimeout(broadcastDebounceTimer);
  }

  broadcastDebounceTimer = setTimeout(() => {
    const now = Date.now().toString();
    try {
      localStorage.setItem(CMS_LAST_SYNC_KEY, now);
    } catch {}

    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel(CMS_SYNC_CHANNEL_NAME);
        channel.postMessage({ type: 'CMS_MUTATION', timestamp: now, source });
        channel.close();
      }
    } catch {}
  }, 120);
}

/**
 * Subscribes to cross-tab CMS mutation broadcasts.
 * Debounced to guarantee only one authoritative database sync occurs even if many broadcasts arrive.
 */
export function subscribeToCmsUpdates(onUpdate: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  let channel: BroadcastChannel | null = null;
  let syncDebounceTimer: NodeJS.Timeout | null = null;

  const debouncedOnUpdate = () => {
    if (syncDebounceTimer) clearTimeout(syncDebounceTimer);
    syncDebounceTimer = setTimeout(() => {
      onUpdate();
    }, 300);
  };

  const handleStorage = (e: StorageEvent) => {
    if (e.key === CMS_LAST_SYNC_KEY && e.newValue) {
      debouncedOnUpdate();
    }
  };

  try {
    if (typeof BroadcastChannel !== 'undefined') {
      channel = new BroadcastChannel(CMS_SYNC_CHANNEL_NAME);
      channel.onmessage = (event) => {
        if (event.data?.type === 'CMS_MUTATION') {
          debouncedOnUpdate();
        }
      };
    }
  } catch {}

  window.addEventListener('storage', handleStorage);

  return () => {
    if (syncDebounceTimer) clearTimeout(syncDebounceTimer);
    window.removeEventListener('storage', handleStorage);
    if (channel) {
      try {
        channel.close();
      } catch {}
    }
  };
}
