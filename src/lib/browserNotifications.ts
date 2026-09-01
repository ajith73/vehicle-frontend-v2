type BrowserNotificationInput = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

const APP_ICON = '/android-icon.png';
const APP_BADGE = '/favicon-32.png';

export const isBrowserNotificationSupported = () =>
  typeof window !== 'undefined' &&
  'Notification' in window &&
  'serviceWorker' in navigator;

export const registerRoadresqServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) {
    return null;
  }

  try {
    return await navigator.serviceWorker.register('/sw.js');
  } catch {
    return null;
  }
};

export const requestBrowserNotificationPermission = async (promptKey: string) => {
  if (!isBrowserNotificationSupported()) {
    return 'unsupported' as const;
  }

  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    return Notification.permission;
  }

  const storageKey = `roadresq:notification-prompted:${promptKey}`;
  if (window.localStorage.getItem(storageKey)) {
    return Notification.permission;
  }

  window.localStorage.setItem(storageKey, '1');
  return Notification.requestPermission();
};

export const showBrowserNotification = async (input: BrowserNotificationInput) => {
  if (!isBrowserNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  if (document.visibilityState === 'visible' && document.hasFocus()) {
    return false;
  }

  const payload = {
    title: input.title,
    options: {
      body: input.body,
      icon: APP_ICON,
      badge: APP_BADGE,
      tag: input.tag || input.title,
      data: {
        url: input.url || '/'
      }
    }
  };

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration?.active) {
      registration.active.postMessage({ type: 'SHOW_NOTIFICATION', payload });
      return true;
    }

    if (registration?.showNotification) {
      await registration.showNotification(payload.title, payload.options);
      return true;
    }

    new Notification(input.title, payload.options);
    return true;
  } catch {
    return false;
  }
};
