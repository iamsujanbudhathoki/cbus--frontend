'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { DriverPortalData, DriverShift, BusStatus } from '@/lib/types';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Bus,
  Clock,
  Play,
  Square,
  LogOut,
  MapPin,
  FileText,
  History,
  Shield,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Calendar,
  Save,
  Navigation,
  User,
} from 'lucide-react';
import { toast } from 'sonner';

import { pushLocationToFirebase } from '@/lib/firebase';

export default function DriverDashboardPage() {
  const { user, logout } = useAuth();
  const [portalData, setPortalData] = useState<DriverPortalData | null>(null);
  const [history, setHistory] = useState<DriverShift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<'today' | 'week' | 'month' | 'all'>('all');

  // Form states
  const [initialNotes, setInitialNotes] = useState('');
  const [shiftNotes, setShiftNotes] = useState('');
  const [isUpdatingNotes, setIsUpdatingNotes] = useState(false);

  // End shift confirmation state
  const [isEndConfirmOpen, setIsEndConfirmOpen] = useState(false);

  // Live timer state for active shift
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const fetchPortalData = async () => {
    setIsLoading(true);
    try {
      const pData = await api.getDriverPortal();
      setPortalData(pData);
      if (pData.activeShift) {
        setShiftNotes(pData.activeShift.notes || '');
      }
      const hData = await api.getDriverShiftHistory();
      setHistory(hData);
    } catch (e: any) {
      toast.error(e.message || 'Failed to load driver portal data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPortalData();
  }, []);

  // Geolocation & Firebase Realtime Location Streaming during Active Shift
  useEffect(() => {
    const busId = portalData?.activeShift?.busId || portalData?.bus?.id;
    if (!portalData?.activeShift || !busId) return;

    let watchId: number | null = null;

    const pushCoords = async (lat: number, lng: number, speed: number = 25) => {
      try {
        // Push to REST backend API
        await api.updateLocation({
          busId,
          latitude: lat,
          longitude: lng,
          speed,
          status: BusStatus.MOVING,
        });
        // Push directly to Firebase Realtime Database
        await pushLocationToFirebase(busId, {
          latitude: lat,
          longitude: lng,
          speed,
          status: BusStatus.MOVING,
        });
      } catch (err) {
        console.error('Error streaming location update:', err);
      }
    };

    if ('geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, speed } = pos.coords;
          pushCoords(latitude, longitude, speed ? Math.round(speed * 3.6) : 25);
        },
        (err) => {
          console.warn('Geolocation watch error:', err.message);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 3000 }
      );
    }

    // Interval fallback to keep tracking active even if geolocation is idle
    let stepCount = 0;
    const intervalId = setInterval(() => {
      stepCount++;
      const baseLat = 27.7172;
      const baseLng = 85.324;
      const offsetLat = (stepCount % 20) * 0.0005;
      const offsetLng = (stepCount % 20) * 0.0007;
      pushCoords(baseLat + offsetLat, baseLng + offsetLng, 32);
    }, 4000);

    return () => {
      if (watchId !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchId);
      }
      clearInterval(intervalId);
    };
  }, [portalData?.activeShift, portalData?.bus]);

  // Live timer tick for active shift
  useEffect(() => {
    if (!portalData?.activeShift?.startedAt) {
      setElapsedSeconds(0);
      return;
    }

    const startMs = new Date(portalData.activeShift.startedAt).getTime();
    const updateTimer = () => {
      const nowMs = Date.now();
      const diffSec = Math.max(0, Math.floor((nowMs - startMs) / 1000));
      setElapsedSeconds(diffSec);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [portalData?.activeShift]);

  const handleStartShift = async () => {
    setIsSubmitting(true);
    try {
      const newShift = await api.startDriverShift(initialNotes);
      toast.success('Work shift started successfully!');
      setInitialNotes('');
      if (newShift.busId) {
        await pushLocationToFirebase(newShift.busId, {
          latitude: 27.7172,
          longitude: 85.324,
          speed: 30,
          status: BusStatus.MOVING,
        });
      }
      await fetchPortalData();
    } catch (e: any) {
      toast.error(e.message || 'Failed to start shift');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateNotes = async () => {
    if (!portalData?.activeShift) return;
    setIsUpdatingNotes(true);
    try {
      await api.updateShiftNotes(portalData.activeShift.id, shiftNotes);
      toast.success('Shift notes updated');
    } catch (e: any) {
      toast.error(e.message || 'Failed to update notes');
    } finally {
      setIsUpdatingNotes(false);
    }
  };

  const handleEndShiftConfirm = async () => {
    if (!portalData?.activeShift) return;
    setIsSubmitting(true);
    const busId = portalData.activeShift.busId;
    try {
      await api.endDriverShift(portalData.activeShift.id);
      if (busId) {
        await pushLocationToFirebase(busId, {
          latitude: 27.7172,
          longitude: 85.324,
          speed: 0,
          status: BusStatus.OFFLINE,
        });
      }
      toast.success('Shift ended and completed successfully!');
      setIsEndConfirmOpen(false);
      await fetchPortalData();
    } catch (e: any) {
      toast.error(e.message || 'Failed to end shift');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredHistory = useMemo(() => {
    if (historyFilter === 'all') return history;
    const now = new Date();
    return history.filter((s) => {
      const sDate = new Date(s.startedAt);
      if (historyFilter === 'today') {
        return sDate.toDateString() === now.toDateString();
      }
      if (historyFilter === 'week') {
        const diffDays = (now.getTime() - sDate.getTime()) / (1000 * 3600 * 24);
        return diffDays <= 7;
      }
      if (historyFilter === 'month') {
        const diffDays = (now.getTime() - sDate.getTime()) / (1000 * 3600 * 24);
        return diffDays <= 30;
      }
      return true;
    });
  }, [history, historyFilter]);

  const formatDuration = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m ${secs}s`;
    }
    return `${mins}m ${secs}s`;
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Mobile-first Header */}
      <header className="sticky top-0 z-40 bg-slate-900 text-white shadow-md border-b border-slate-800">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-bold shadow-md shadow-blue-600/30">
              <Bus className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight">Driver Portal</h1>
              <p className="text-[11px] text-slate-400">Daily Bus Operation & Shifts</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-xs font-bold text-slate-200">{user?.name || portalData?.driver?.name}</p>
              <p className="text-[10px] text-blue-400 font-medium">DRIVER</p>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-all cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden xs:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 space-y-5">
        {isLoading ? (
          <div className="py-16 space-y-4">
            <div className="h-28 w-full bg-slate-200/70 rounded-2xl animate-pulse" />
            <div className="h-48 w-full bg-slate-200/70 rounded-2xl animate-pulse" />
            <div className="h-40 w-full bg-slate-200/70 rounded-2xl animate-pulse" />
          </div>
        ) : (
          <>
            {/* Driver & Assignment Overview Header Card */}
            <div className="rounded-2xl bg-white p-5 shadow-xs border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 border border-blue-100 text-blue-600">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">{portalData?.driver.name}</h2>
                    <p className="text-xs text-slate-500">
                      Phone: {portalData?.driver.phone} • License: {portalData?.driver.licenseNumber || 'N/A'}
                    </p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200/70 px-2.5 py-1 text-xs font-bold text-blue-800">
                  <Shield className="h-3.5 w-3.5 text-blue-600" />
                  Active Driver
                </span>
              </div>
            </div>

            {/* Shift Work Control Section */}
            {portalData?.activeShift ? (
              /* ACTIVE SHIFT RUNNING CARD */
              <div className="rounded-2xl bg-white p-5 shadow-md border-2 border-emerald-500 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                    </span>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700">
                      Shift in Progress
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">
                    Started at {formatTime(portalData.activeShift.startedAt)}
                  </span>
                </div>

                {/* Live Elapsed Duration Counter */}
                <div className="rounded-xl bg-emerald-50/80 border border-emerald-200/80 p-4 text-center">
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                    Running Duration
                  </p>
                  <div className="text-3xl font-black font-mono text-emerald-900 mt-1 tracking-tight">
                    {formatDuration(elapsedSeconds)}
                  </div>
                </div>

                {/* Assigned Bus & Route Snapshot */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Operating Bus
                    </span>
                    <p className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                      <Bus className="h-4 w-4 text-blue-600" />
                      {portalData.activeShift.busNumberSnap || portalData.bus?.busNumber}
                    </p>
                    <p className="text-xs font-mono text-blue-600 font-semibold">
                      Plate: {portalData.activeShift.vehicleNumberSnap || portalData.bus?.vehicleNumber}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Assigned Route
                    </span>
                    <p className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                      <Navigation className="h-4 w-4 text-blue-600" />
                      {portalData.activeShift.routeNameSnap || portalData.route?.name || 'Unassigned'}
                    </p>
                    {portalData.route?.stops && portalData.route.stops.length > 0 && (
                      <p className="text-xs text-slate-500">
                        {portalData.route.stops.length} stop waypoints configured
                      </p>
                    )}
                  </div>
                </div>

                {/* Live Shift Notes Editor */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-blue-600" />
                    Shift Notes & Incident Log
                  </label>
                  <textarea
                    rows={2}
                    value={shiftNotes}
                    onChange={(e) => setShiftNotes(e.target.value)}
                    placeholder="Log traffic conditions, delays, or minor issues during shift..."
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={isUpdatingNotes}
                      onClick={handleUpdateNotes}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 shadow-xs cursor-pointer active:scale-95 transition-all disabled:opacity-50"
                    >
                      {isUpdatingNotes ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Save className="h-3.5 w-3.5" />
                      )}
                      Save Notes
                    </button>
                  </div>
                </div>

                {/* End Shift Button */}
                <button
                  type="button"
                  onClick={() => setIsEndConfirmOpen(true)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-600 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-red-600/20 hover:bg-red-700 cursor-pointer active:scale-98 transition-all"
                >
                  <Square className="h-4 w-4 fill-white" />
                  End Active Shift
                </button>
              </div>
            ) : (
              /* START SHIFT CARD (NO SHIFT RUNNING) */
              <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    Daily Work Shift
                  </h3>
                  <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
                    IDLE
                  </span>
                </div>

                {!portalData?.bus ? (
                  /* WARNING: NO BUS ASSIGNED */
                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-amber-900">No Bus Currently Assigned</h4>
                      <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                        You do not have an assigned fleet bus for today's work. Please contact your college administrator to assign a bus before starting your shift.
                      </p>
                    </div>
                  </div>
                ) : (
                  /* READY TO START SHIFT */
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-1">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                          Assigned Bus
                        </span>
                        <p className="text-base font-black text-slate-900 flex items-center gap-1.5">
                          <Bus className="h-4 w-4 text-blue-600" />
                          {portalData.bus.busNumber}
                        </p>
                        <p className="text-xs font-mono text-blue-600 font-semibold">
                          Plate: {portalData.bus.vehicleNumber} • {portalData.bus.capacity} Seats
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-1">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                          Assigned Route
                        </span>
                        <p className="text-base font-black text-slate-900 flex items-center gap-1.5 truncate">
                          <Navigation className="h-4 w-4 text-blue-600 shrink-0" />
                          {portalData.route?.name || 'Unassigned Route'}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {portalData.route?.description || 'No route details'}
                        </p>
                      </div>
                    </div>

                    {/* Initial Optional Note */}
                    <div>
                      <label className="text-xs font-semibold text-slate-700 mb-1 block">
                        Shift Notes (Optional)
                      </label>
                      <input
                        type="text"
                        value={initialNotes}
                        onChange={(e) => setInitialNotes(e.target.value)}
                        placeholder="e.g. Morning pickup trip starting..."
                        className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                      />
                    </div>

                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleStartShift}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-base font-extrabold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 cursor-pointer active:scale-98 transition-all disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Starting Shift...
                        </>
                      ) : (
                        <>
                          <Play className="h-5 w-5 fill-white" />
                          Start Shift
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Completed Shift History Section */}
            <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <History className="h-5 w-5 text-blue-600" />
                  <h3 className="text-base font-bold text-slate-900">Shift Work History</h3>
                </div>

                {/* History Filter Buttons */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
                  {(['all', 'today', 'week', 'month'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setHistoryFilter(tab)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg capitalize cursor-pointer transition-all ${
                        historyFilter === tab
                          ? 'bg-white text-blue-600 shadow-xs'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {filteredHistory.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 space-y-1">
                  <Calendar className="h-8 w-8 text-slate-300 mx-auto" />
                  <p>No completed shift records found for this period.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredHistory.map((shift) => {
                    const durSec = shift.durationSeconds || 0;
                    return (
                      <div
                        key={shift.id}
                        className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 space-y-2 hover:border-slate-300 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                              <CheckCircle2 className="h-3 w-3" />
                              {shift.status}
                            </span>
                            <span className="text-xs font-bold text-slate-800">
                              {formatDate(shift.startedAt)}
                            </span>
                          </div>

                          <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                            {formatDuration(durSec)}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                          <div>
                            <span className="text-slate-400 text-[11px] block">Bus & Plate:</span>
                            <span className="font-bold text-slate-900">
                              {shift.busNumberSnap || 'N/A'}
                            </span>{' '}
                            <span className="font-mono text-[11px] text-blue-600">
                              ({shift.vehicleNumberSnap || 'N/A'})
                            </span>
                          </div>

                          <div>
                            <span className="text-slate-400 text-[11px] block">Time Window:</span>
                            <span className="font-semibold text-slate-800">
                              {formatTime(shift.startedAt)} - {formatTime(shift.endedAt)}
                            </span>
                          </div>
                        </div>

                        <div className="text-xs text-slate-600">
                          <span className="text-slate-400 text-[11px] block">Route:</span>
                          <span className="font-semibold text-slate-800">
                            {shift.routeNameSnap || 'Unassigned'}
                          </span>
                        </div>

                        {shift.notes && (
                          <div className="rounded-lg bg-white border border-slate-200 p-2 text-[11px] text-slate-700 font-medium">
                            <span className="font-bold text-slate-500">Note: </span>
                            {shift.notes}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* End Shift Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isEndConfirmOpen}
        onClose={() => setIsEndConfirmOpen(false)}
        onConfirm={handleEndShiftConfirm}
        title="End Work Shift"
        description="Are you sure you want to end today's work session? Your current shift duration and notes will be finalized and added to history."
        confirmLabel="End Shift"
        cancelLabel="Cancel"
        variant="destructive"
        isLoading={isSubmitting}
      />
    </div>
  );
}
