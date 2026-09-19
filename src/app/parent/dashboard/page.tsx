'use client';

import React, { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Bus, BusStatus, Parent, Student, TrackingStatus } from '@/lib/types';
import Header from '@/components/layout/Header';
import LiveMap from '@/components/tracking/LiveMap';
import EmptyState from '@/components/shared/empty-state';
import { Navigation, Phone, User, MapPin, Clock, ShieldCheck, RefreshCw, Radio } from 'lucide-react';
import { toast } from 'sonner';
import { subscribeToBusLocation } from '@/lib/socket';
import { sendBrowserNotification } from '@/lib/notifications';

export default function ParentDashboard() {
  const { user } = useAuth();
  const [parentData, setParentData] = useState<Parent | null>(null);
  const [selectedChild, setSelectedChild] = useState<any>(null);
  const [busDetails, setBusDetails] = useState<Bus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const prevStatusRef = useRef<string | null>(null);

  const fetchParentInfo = async () => {
    if (!user?.id) return;
    try {
      const data = await api.getParentByUserId(user.id);
      setParentData(data);
      if (data && data.children && data.children.length > 0) {
        if (!selectedChild) {
          setSelectedChild(data.children[0]);
        }
        const currentChild = selectedChild || (data.children && data.children.length > 0 ? data.children[0] : null);
        if (currentChild?.assignedBus?.id) {
          const b = await api.getBusById(currentChild.assignedBus.id);
          setBusDetails(b);
        }
      }
    } catch (e: any) {
      toast.error('Failed to update live bus tracking info');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchParentInfo();
    const interval = setInterval(fetchParentInfo, 5000);
    return () => clearInterval(interval);
  }, [user, selectedChild?.id]);

  // Realtime WebSocket subscription for the child's bus
  useEffect(() => {
    const busId = busDetails?.id || selectedChild?.assignedBus?.id;
    if (!busId) return;

    const unsub = subscribeToBusLocation(
      busId,
      (liveLoc) => {
        if (!liveLoc) return;

        // Notify parent when bus transitions to MOVING
        const isNowMoving = liveLoc.status === BusStatus.MOVING || (liveLoc.speed && liveLoc.speed > 5);
        const wasMoving = prevStatusRef.current === BusStatus.MOVING;
        if (isNowMoving && !wasMoving) {
          sendBrowserNotification(`🚌 Bus #${busDetails?.busNumber || ''} is on the move!`, {
            body: `Live tracking is active. Current speed: ${liveLoc.speed || 0} km/h.`,
            tag: `bus-${busId}-moving`,
          });
        }
        prevStatusRef.current = liveLoc.status;

        setBusDetails((prevBus) => {
          if (!prevBus) return prevBus;
          return {
            ...prevBus,
            status: (liveLoc.status as BusStatus) || prevBus.status,
            tracking: {
              busId,
              latitude: liveLoc.latitude,
              longitude: liveLoc.longitude,
              speed: liveLoc.speed || 0,
              heading: liveLoc.heading || 0,
              lastUpdated: liveLoc.lastUpdated || Date.now(),
              status: (liveLoc.status as BusStatus) || BusStatus.MOVING,
              trackingStatus:
                liveLoc.status === BusStatus.MOVING || liveLoc.status === TrackingStatus.LIVE
                  ? TrackingStatus.LIVE
                  : liveLoc.status === TrackingStatus.STALE
                  ? TrackingStatus.STALE
                  : TrackingStatus.OFFLINE,
            },
          };
        });
      },
      (statusData) => {
        setBusDetails((prevBus) => {
          if (!prevBus) return prevBus;
          const newStatus = statusData.status as BusStatus;
          return {
            ...prevBus,
            status: newStatus,
            tracking: prevBus.tracking
              ? {
                  ...prevBus.tracking,
                  status: newStatus,
                  trackingStatus: newStatus === BusStatus.MOVING ? TrackingStatus.LIVE : TrackingStatus.OFFLINE,
                  speed: newStatus === BusStatus.OFFLINE ? 0 : prevBus.tracking.speed,
                }
              : null,
          };
        });
      }
    );

    return () => unsub();
  }, [busDetails?.id, selectedChild?.assignedBus?.id]);

  const handleSelectChild = async (child: any) => {
    setSelectedChild(child);
    if (child.assignedBus) {
      try {
        const b = await api.getBusById(child.assignedBus.id);
        setBusDetails(b);
      } catch (e) {
        console.error(e);
      }
    } else {
      setBusDetails(null);
    }
  };

  const isMovingBus = busDetails?.status === BusStatus.MOVING || busDetails?.tracking?.status === BusStatus.MOVING;
  const trackingStatus = busDetails?.tracking?.trackingStatus || (isMovingBus ? TrackingStatus.LIVE : TrackingStatus.OFFLINE);
  let statusBadgeColor = 'bg-slate-100 border-slate-200 text-slate-700';
  if (trackingStatus === TrackingStatus.LIVE || isMovingBus) statusBadgeColor = 'bg-emerald-50 border-emerald-200 text-emerald-700 font-bold';
  else if (trackingStatus === TrackingStatus.STALE) statusBadgeColor = 'bg-amber-50 border-amber-200 text-amber-700 font-bold';

  const updatedAgo = busDetails?.tracking?.lastUpdated
    ? `${Math.max(0, Math.round((Date.now() - busDetails.tracking.lastUpdated) / 1000))}s ago`
    : 'Never';

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header />

      <main className="mx-auto w-full max-w-6xl flex-1 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Radio className="h-5 w-5 text-red-500 animate-pulse shrink-0" />
              <h1 className="text-2xl font-extrabold text-slate-900">Child's Live Bus Tracker</h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Real-time transportation location & status</p>
          </div>

          <button
            onClick={() => {
              setIsLoading(true);
              fetchParentInfo();
              toast.info('Refreshing live bus location...');
            }}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-100 cursor-pointer active:scale-95 transition-all shrink-0"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Map
          </button>
        </div>

        {/* Children Tabs */}
        {parentData?.children && parentData.children.length > 1 && (
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {parentData.children.map((child: any) => (
              <button
                key={child.id}
                onClick={() => handleSelectChild(child)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                  selectedChild?.id === child.id
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>👦</span>
                <span>{child.name}</span>
              </button>
            ))}
          </div>
        )}

        {isLoading && !selectedChild ? (
          <div className="mt-8 rounded-2xl bg-white p-12 shadow-sm border border-slate-200/80 space-y-4">
            <div className="h-6 w-1/3 bg-slate-100 rounded animate-pulse" />
            <div className="h-[400px] w-full bg-slate-100 rounded-2xl animate-pulse" />
          </div>
        ) : !selectedChild ? (
          <div className="mt-8 rounded-2xl bg-white p-12 shadow-sm border border-slate-200/80">
            <EmptyState
              title="No Children Linked"
              description="Contact your college administrator to link student accounts to your parent profile."
            />
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Live Map View */}
            <div className="lg:col-span-2 space-y-4">
              <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200/80">
                {busDetails ? (
                  <LiveMap
                    buses={[busDetails]}
                    routeStops={busDetails.assignedRoute?.stops || []}
                    selectedBusId={busDetails.id}
                    height="500px"
                  />
                ) : (
                  <div className="flex h-[450px] flex-col items-center justify-center rounded-xl bg-slate-50 border border-dashed border-slate-200 text-slate-400 p-6 text-center">
                    <span className="text-5xl mb-3">🚌</span>
                    <h3 className="text-base font-bold text-slate-800">No Bus Assigned Yet</h3>
                    <p className="text-xs text-slate-500 max-w-sm mt-1">
                      No transportation bus has been assigned to {selectedChild.name} by the college admin.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Child & Transportation Details Card */}
            <div className="space-y-4">
              {/* Child Info */}
              <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-2xl shrink-0">
                    👦
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">{selectedChild.name}</h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Roll: {selectedChild.rollNumber || 'N/A'} | Class: {selectedChild.className || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl bg-slate-50 p-3.5 text-xs space-y-2 border border-slate-200/60">
                  <div className="flex items-center justify-between text-slate-700">
                    <span>Pickup Stop:</span>
                    <span className="font-bold text-blue-700">
                      📍 {selectedChild.assignedStop?.name || 'Unassigned'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-700">
                    <span>Est. Pickup Time:</span>
                    <span className="font-bold text-slate-900">
                      ⏱️ {selectedChild.assignedStop?.estimatedTime || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Live Bus Tracking Info */}
              {busDetails && (
                <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="text-base font-black text-slate-900">{busDetails.busNumber}</h4>
                      <p className="text-xs font-mono text-slate-500">{busDetails.vehicleNumber}</p>
                    </div>

                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${statusBadgeColor}`}>
                      <span className={`h-2 w-2 rounded-full ${
                        trackingStatus === TrackingStatus.LIVE ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'
                      }`} />
                      {trackingStatus}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/60">
                      <p className="text-slate-500 font-medium">Current Speed</p>
                      <p className="text-lg font-black text-slate-900 mt-0.5">{busDetails.tracking?.speed || 0} km/h</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/60">
                      <p className="text-slate-500 font-medium">Last Location Ping</p>
                      <p className="text-xs font-bold text-slate-900 mt-1.5">{updatedAgo}</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-2 text-slate-700">
                      <User className="h-4 w-4 text-slate-400 shrink-0" />
                      <span><strong>Driver:</strong> {busDetails.driver?.name || 'Unassigned'}</span>
                    </div>

                    {busDetails.driver?.phone && (
                      <div className="flex items-center gap-2 text-slate-700">
                        <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                        <span><strong>Contact Phone:</strong> {busDetails.driver.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
