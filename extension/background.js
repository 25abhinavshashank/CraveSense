const BADGE_STORAGE_KEY = 'pendingCount';
const DASHBOARD_URL = 'https://crave-sense-sable.vercel.app/dashboard';

function updateBadge(count) {
  chrome.action.setBadgeText({ text: count > 0 ? String(count) : '' });
  chrome.action.setBadgeBackgroundColor({ color: '#ff4757' });
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ [BADGE_STORAGE_KEY]: 0 });
  updateBadge(0);
});

chrome.runtime.onStartup.addListener(async () => {
  const stored = await chrome.storage.local.get(BADGE_STORAGE_KEY);
  updateBadge(Number(stored[BADGE_STORAGE_KEY] || 0));
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'pending-count') {
    const count = Number(message.count || 0);
    chrome.storage.local.set({ [BADGE_STORAGE_KEY]: count });
    updateBadge(count);
    sendResponse({ ok: true });
    return true;
  }

  if (message.type === 'open-dashboard') {
    chrome.tabs.create({ url: DASHBOARD_URL });
    sendResponse({ ok: true });
    return true;
  }

  return false;
});
