'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  getNotificationPermission,
  requestNotificationPermission,
  sendBrowserNotification,
  isNotificationSupported,
  registerNotificationServiceWorker,
  NotificationPermissionState,
} from '@/lib/notifications';
import { Bell, BellOff, CheckCircle2, X, AlertTriangle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export default function NotificationManager() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermissionState>('default');
  const [isDismissed, setIsDismissed] = useState(false);
  const [showDeniedHelpModal, setShowDeniedHelpModal] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    if (!isNotificationSupported()) {
      setPermission('unsupported');
      return;
    }

    const current = getNotificationPermission();
    setPermission(current);

    // Register SW on load if supported
    registerNotificationServiceWorker();

    // Check if dismissed in this browser session
    const dismissed = sessionStorage.getItem('busapp_notif_banner_dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, []);

  // Listen for custom event if another component (e.g. Header bell) wants to open the denied help modal
  useEffect(() => {
    const handleOpenDeniedHelp = () => setShowDeniedHelpModal(true);
    window.addEventListener('busapp:open-notif-help', handleOpenDeniedHelp);
    return () => window.removeEventListener('busapp:open-notif-help', handleOpenDeniedHelp);
  }, []);

  if (!isMounted || !user || permission === 'unsupported' || permission === 'granted' || isDismissed) {
    return (
      <>
        {showDeniedHelpModal && (
          <DeniedHelpModal onClose={() => setShowDeniedHelpModal(false)} />
        )}
      </>
    );
  }

  const handleRequestPermission = async () => {
    const result = await requestNotificationPermission();
    setPermission(result);

    if (result === 'granted') {
      toast.success('Live browser notifications activated!');
      // Immediately open a native notification so the user sees it in action!
      sendBrowserNotification('🚌 Bus Tracking Alerts Active!', {
        body: 'You will now receive instant desktop & mobile alerts for bus departures, arrivals, and driver shifts.',
      });
    } else if (result === 'denied') {
      toast.error('Notifications blocked by browser settings');
      setShowDeniedHelpModal(true);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('busapp_notif_banner_dismissed', 'true');
  };

  return (
    <>
      <div className="relative isolate z-40 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white px-4 py-2.5 shadow-md border-b border-blue-600/50">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/20 text-white shadow-inner">
              <Bell className="h-4 w-4 animate-bounce" />
            </div>
            <div className="text-xs sm:text-sm">
              <span className="font-bold">Turn On Real-Time Bus Alerts: </span>
              <span className="text-blue-100 hidden sm:inline">
                Receive instant browser notifications when buses move, arrive at stops, or change shifts.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleRequestPermission}
              className="flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-1.5 text-xs font-bold text-blue-700 shadow-sm hover:bg-blue-50 active:scale-95 transition-all cursor-pointer"
            >
              <Bell className="h-3.5 w-3.5" />
              <span>Allow Notifications</span>
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="rounded-lg p-1.5 text-white/80 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
              title="Dismiss for this session"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {showDeniedHelpModal && (
        <DeniedHelpModal onClose={() => setShowDeniedHelpModal(false)} />
      )}
    </>
  );
}

function DeniedHelpModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-3">
          <h3 className="text-base font-bold text-slate-900">
            Browser Notifications are Blocked
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Your web browser is currently preventing notifications for this site. To receive live bus tracking alerts on your screen:
          </p>

          <ol className="mt-4 space-y-2.5 text-xs text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[11px] font-bold text-blue-700">
                1
              </span>
              <span>
                Click the <strong>Tune / Padlock 🔒</strong> icon in your browser address bar (next to the URL).
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[11px] font-bold text-blue-700">
                2
              </span>
              <span>
                Find <strong>Notifications</strong> and change it from <em>Block</em> to <strong>Allow</strong>.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[11px] font-bold text-blue-700">
                3
              </span>
              <span>
                <strong>Reload</strong> this web page.
              </span>
            </li>
          </ol>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition-colors cursor-pointer"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
