'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Bus, BusStatus, TrackingStatus } from '@/lib/types';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import LiveMap from '@/components/tracking/LiveMap';
import LocationSimulatorModal from '@/components/tracking/LocationSimulatorModal';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Radio, RefreshCw, Phone, User, Route } from 'lucide-react';
import { toast } from 'sonner';

import { subscribeToFleet } from '@/lib/socket';
import { sendBrowserNotification } from '@/lib/notifications';

export default function CollegeLiveTrackingPage() {
  const { user } = useAuth();
  const [buses, setBuses] = useState<Bus[]>([]);
  const [selectedBusId, setSelectedBusId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

  const fetchFleetTracking = async () => {
    if (!user?.collegeId) return;
    try {
      const data = await api.getBuses(user.collegeId);
      setBuses((prevBuses) => {
        const prevMap = new Map(prevBuses.map((b) => [b.id, b.tracking]));
        return data.map((b) => ({
          ...b,
          tracking: b.tracking || prevMap.get(b.id) || null,
        }));
      });
    } catch (e: any) {
      toast.error('Failed to fetch fleet tracking');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFleetTracking();
  }, [user?.collegeId]);

  // Realtime WebSocket Subscription for instant college fleet location updates
  useEffect(() => {
    if (!user?.collegeId) return;

    const unsub = subscribeToFleet(
      user.collegeId,
      (liveLoc) => {
        setBuses((prevBuses) =>
          prevBuses.map((b) => {
            if (b.id !== liveLoc.busId) return b;

            const isMoving = liveLoc.status === BusStatus.MOVING || liveLoc.status === 'MOVING';
            if (isMoving && b.status !== BusStatus.MOVING) {
              sendBrowserNotification(`🚌 Bus #${b.busNumber} Started Moving`, {
                body: `Bus #${b.busNumber} (${b.vehicleNumber}) is now active. Speed: ${liveLoc.speed || 0} km/h`,
                tag: `fleet-bus-${b.id}`,
              });
            }
            return {
              ...b,
              status: (liveLoc.status as BusStatus) || b.status,
              tracking: {
                busId: b.id,
                latitude: liveLoc.latitude,
                longitude: liveLoc.longitude,
                speed: liveLoc.speed || 0,
                heading: liveLoc.heading || 0,
                lastUpdated: liveLoc.lastUpdated || Date.now(),
                status: (liveLoc.status as BusStatus) || (isMoving ? BusStatus.MOVING : BusStatus.IDLE),
                trackingStatus:
                  isMoving || liveLoc.trackingStatus === TrackingStatus.LIVE || liveLoc.status === TrackingStatus.LIVE
                    ? TrackingStatus.LIVE
                    : liveLoc.status === TrackingStatus.STALE || liveLoc.trackingStatus === TrackingStatus.STALE
                    ? TrackingStatus.STALE
                    : TrackingStatus.OFFLINE,
              },
            };
          })
        );
      },
      (statusData) => {
        setBuses((prevBuses) =>
          prevBuses.map((b) => {
            if (b.id !== statusData.busId) return b;
            const newStatus = statusData.status as BusStatus;
            return {
              ...b,
              status: newStatus,
              tracking: b.tracking
                ? {
                    ...b.tracking,
                    status: newStatus,
                    trackingStatus: newStatus === BusStatus.MOVING ? TrackingStatus.LIVE : TrackingStatus.OFFLINE,
                    speed: newStatus === BusStatus.OFFLINE ? 0 : b.tracking.speed,
                  }
                : null,
            };
          })
        );
      }
    );

    return () => unsub();
  }, [user?.collegeId]);

  const selectedBus = buses.find((b) => b.id === selectedBusId) || null;
  const routeStops = selectedBus?.assignedRoute?.stops || [];

  const selectedTrackingStatus =
    selectedBus?.tracking?.trackingStatus ||
    (selectedBus?.status === BusStatus.MOVING ? TrackingStatus.LIVE : TrackingStatus.OFFLINE);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 md:p-6 space-y-4">
          <PageHeader
            title="Live Bus Tracking"
            description="Real-time bus location tracking and status"
            action={
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsLoading(true);
                    fetchFleetTracking();
                    toast.info('Refreshing live bus locations...');
                  }}
                >
                  <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>

                <Button
                  size="sm"
                  onClick={() => setIsSimulatorOpen(true)}
                >
                  <Radio className="h-3.5 w-3.5 mr-1 text-red-300 animate-pulse" />
                  GPS Simulator
                </Button>
              </div>
            }
          />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Map Area */}
            <div className="lg:col-span-2">
              <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-xs">
                <LiveMap
                  buses={buses}
                  routeStops={routeStops}
                  selectedBusId={selectedBusId}
                  onSelectBus={(busId) => setSelectedBusId(busId)}
                  height="540px"
                />
              </div>
            </div>

            {/* Selected Bus Inspector Drawer */}
            <div className="space-y-3">
              {/* Bus Selector */}
              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs space-y-2">
                <Label required>Select Bus to Inspect</Label>
                <Select value={selectedBusId} onValueChange={setSelectedBusId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select bus to inspect..." />
                  </SelectTrigger>
                  <SelectContent>
                    {buses.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.busNumber} ({b.vehicleNumber}) - {b.assignedRoute?.name || 'Unassigned'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Bus Status Card */}
              {selectedBus && (
                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{selectedBus.busNumber}</h3>
                      <p className="font-mono text-[11px] text-slate-800 font-medium">{selectedBus.vehicleNumber}</p>
                    </div>

                    <Badge variant={
                      selectedTrackingStatus === TrackingStatus.LIVE
                        ? 'emerald'
                        : selectedTrackingStatus === TrackingStatus.STALE
                        ? 'yellow'
                        : 'secondary'
                    }>
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        selectedTrackingStatus === TrackingStatus.LIVE ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'
                      }`} />
                      {selectedTrackingStatus}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-md bg-slate-50 p-2.5 border border-slate-200">
                      <p className="text-slate-700 font-semibold text-[11px]">Speed</p>
                      <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedBus.tracking?.speed || 0} km/h</p>
                    </div>

                    <div className="rounded-md bg-slate-50 p-2.5 border border-slate-200">
                      <p className="text-slate-700 font-semibold text-[11px]">Sync Time</p>
                      <p className="text-xs font-bold text-slate-900 mt-1">
                        {selectedBus.tracking?.lastUpdated
                          ? `${Math.max(0, Math.round((Date.now() - selectedBus.tracking.lastUpdated) / 1000))}s ago`
                          : 'Never'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-slate-900 font-medium">
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-slate-600 shrink-0" />
                      <span><strong>Driver:</strong> {selectedBus.driver?.name || <span className="text-slate-600 italic">Unassigned</span>}</span>
                    </div>

                    {selectedBus.driver?.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-slate-600 shrink-0" />
                        <span><strong>Phone:</strong> {selectedBus.driver.phone}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Route className="h-3.5 w-3.5 text-slate-600 shrink-0" />
                      <span><strong>Route:</strong> {selectedBus.assignedRoute?.name || <span className="text-slate-600 italic">Unassigned</span>}</span>
                    </div>

                    <div className="flex items-start gap-2">
                      <Radio className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Live GPS:</strong>{' '}
                        {selectedBus.tracking?.latitude && selectedBus.tracking?.longitude ? (
                          <span className="font-mono text-emerald-700 font-bold block xs:inline">
                            {selectedBus.tracking.latitude.toFixed(5)}, {selectedBus.tracking.longitude.toFixed(5)}
                          </span>
                        ) : selectedBus.status === BusStatus.MOVING ? (
                          <span className="text-amber-600 font-medium animate-pulse">Awaiting GPS telemetry packet...</span>
                        ) : (
                          <span className="text-slate-400 italic">No GPS signal (Vehicle Idle/Offline)</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Route Stops Sequence */}
                  {routeStops.length > 0 && (
                    <div className="pt-2.5 border-t border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                          Route Waypoint Sequence:
                        </p>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {routeStops.length} stops
                        </span>
                      </div>
                      <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                        {routeStops.map((s, idx) => (
                          <div key={s.id} className="flex items-center justify-between rounded-md bg-slate-50 p-2 border border-slate-200">
                            <div className="flex items-center gap-1.5">
                              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 font-bold text-white text-[9px]">
                                {idx + 1}
                              </span>
                              <span className="font-semibold text-slate-900">{s.name}</span>
                            </div>
                            <span className="text-[10px] text-slate-700 font-mono font-medium">{s.estimatedTime || '-'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Location Simulator Modal */}
          {buses.length > 0 && (
            <LocationSimulatorModal
              buses={buses}
              isOpen={isSimulatorOpen}
              onClose={() => setIsSimulatorOpen(false)}
              onLocationUpdated={fetchFleetTracking}
            />
          )}
        </main>
      </div>
    </div>
  );
}
