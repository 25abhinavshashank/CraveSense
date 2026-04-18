// Syncs session into extension storage from the web app tab. Refresh cookies are
// partitioned per top-level site; only requests from this origin can see the cookie
// set when you logged in on the dashboard. The extension popup cannot.

const BACKEND_URL = 'https://cravesense.onrender.com/api';
const ACCESS_TOKEN_STORAGE_KEY = 'cravesense_access_token';

async function syncAccessTokenFromWebSession() {
  try {
    const response = await fetch(`${BACKEND_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include'
    });

    if (!response.ok) {
      await chrome.storage.local.remove(ACCESS_TOKEN_STORAGE_KEY);
      return;
    }

    const data = await response.json();
    if (data.accessToken) {
      await chrome.storage.local.set({ [ACCESS_TOKEN_STORAGE_KEY]: data.accessToken });
    }
  } catch {
    /* non-fatal; popup may still have a cached token */
  }
}

syncAccessTokenFromWebSession();

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== 'cravesense-request-sync') {
    return false;
  }
  syncAccessTokenFromWebSession().then(() => sendResponse({ ok: true }));
  return true;
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    syncAccessTokenFromWebSession();
  }
});

// SPA navigations; keep token fresh while the dashboard tab is open
const SYNC_INTERVAL_MS = 8 * 60 * 1000;
setInterval(syncAccessTokenFromWebSession, SYNC_INTERVAL_MS);
