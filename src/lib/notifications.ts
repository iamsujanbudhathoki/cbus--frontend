import { toast } from 'sonner';

/**
 * Browser Notification Service
 * Handles native HTML5 desktop and mobile browser notifications with Service Worker support,
 * audio chimes, click-to-focus window behavior, and in-app toast synchronization.
 */

export type NotificationPermissionState = NotificationPermission | 'unsupported';

export interface BrowserNotificationOptions {
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  url?: string;
  data?: any;
  silent?: boolean;
}

/**
 * Checks if Notification API is supported in current browser environment.
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Retrieves current permission state ('granted' | 'denied' | 'default' | 'unsupported').
 */
export function getNotificationPermission(): NotificationPermissionState {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

/**
 * Automatically registers Service Worker for PWA / Android notification capabilities.
 */
export function registerNotificationServiceWorker(): void {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        // SW registered
      })
      .catch((err) => {
        // Service worker failed or running in unsupported context
        console.debug('[ServiceWorker] Optional registration note:', err?.message || err);
      });
  }
}

/**
 * Plays a pleasant, subtle dual-tone chime using Web Audio API.
 * Does not require external audio files and works instantaneously.
 */
export function playNotificationSound(): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Tone 1
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    gain1.gain.setValueAtTime(0.12, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.15);

    // Tone 2
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5
    gain2.gain.setValueAtTime(0.15, ctx.currentTime + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.12);
    osc2.stop(ctx.currentTime + 0.35);
  } catch {
    // AudioContext autoplay restriction or not allowed yet, safe to ignore
  }
}

/**
 * Requests notification permission from user via browser prompt.
 */
export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (!isNotificationSupported()) return 'unsupported';
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.warn('[Notification] Error requesting browser notification permission:', err);
    return Notification.permission;
  }
}

/**
 * Dispatches a native browser notification if permission is granted.
 * Supports both Desktop Notification constructor and Android/Mobile Service Worker.
 */
export function sendBrowserNotification(
  title: string,
  options?: BrowserNotificationOptions
): Notification | null {
  if (!isNotificationSupported()) return null;

  if (Notification.permission !== 'granted') {
    return null;
  }

  // Play audio alert unless explicitly silent
  if (!options?.silent) {
    playNotificationSound();
  }

  const notificationOptions = {
    body: options?.body,
    icon: options?.icon || '/busapp-logo.jpg',
    badge: options?.badge || '/favicon.ico',
    tag: options?.tag || 'busapp-alert',
    data: {
      url: options?.url || (typeof window !== 'undefined' ? window.location.pathname : '/'),
      ...(options?.data || {}),
    },
  };

  // Try standard Notification constructor (Desktop Chrome, Firefox, Safari, Edge)
  try {
    const notification = new Notification(title, notificationOptions);

    notification.onclick = (event) => {
      event.preventDefault();
      window.focus();
      if (options?.url && typeof window !== 'undefined') {
        window.location.href = options.url;
      }
      notification.close();
    };

    return notification;
  } catch {
    // Fallback for Mobile Chrome/Android where constructor throws:
    // "Illegal constructor. Use ServiceWorkerRegistration.showNotification() instead."
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then((registration) => {
          registration.showNotification(title, notificationOptions);
        })
        .catch(() => {});
    }
    return null;
  }
}

export interface NotifyOptions extends BrowserNotificationOptions {
  type?: 'info' | 'success' | 'warning' | 'error';
  sound?: boolean;
}

/**
 * Unified notification helper:
 * 1. Shows an in-app toast (with an "Enable Alerts" action button if browser notifications are off).
 * 2. Directly opens the native system/browser notification popup if permission is granted.
 */
export function notify(title: string, options?: NotifyOptions): void {
  const type = options?.type || 'info';

  const currentPermission = getNotificationPermission();

  // If browser notifications are not granted, add an action button to the in-app toast
  const toastAction =
    currentPermission === 'default'
      ? {
          label: '🔔 Turn On Alerts',
          onClick: async () => {
            const res = await requestNotificationPermission();
            if (res === 'granted') {
              toast.success('Browser alerts enabled!');
              sendBrowserNotification('🎉 Live Alerts Activated', {
                body: 'You will now receive instant bus tracking alerts on this device.',
              });
            }
          },
        }
      : undefined;

  // Show in-app toast
  if (type === 'success') {
    toast.success(title, { description: options?.body, action: toastAction });
  } else if (type === 'warning') {
    toast.warning(title, { description: options?.body, action: toastAction });
  } else if (type === 'error') {
    toast.error(title, { description: options?.body, action: toastAction });
  } else {
    toast.info(title, { description: options?.body, action: toastAction });
  }

  // Open native browser notification
  if (currentPermission === 'granted') {
    sendBrowserNotification(title, options);
  }
}
