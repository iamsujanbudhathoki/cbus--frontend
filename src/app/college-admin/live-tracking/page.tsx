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

import { subscribeToAllBuses } from '@/lib/firebase';

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
      setBuses(data);
    } catch (e: any) {
      toast.error('Failed to fetch fleet tracking');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFleetTracking();
    const interval = setInterval(fetchFleetTracking, 5000); // 5s auto refresh
    return () => clearInterval(interval);
  }, [user]);

  // Realtime Firebase Subscription for instant location updates
  useEffect(() => {
    const unsub = subscribeToAllBuses((busesMap) => {
      if (!busesMap || Object.keys(busesMap).length === 0) return;
      setBuses((prevBuses) =>
        prevBuses.map((b) => {
          const liveLoc = busesMap[b.id];
          if (!liveLoc) return b;
          return {
            ...b,
            tracking: {
              busId: b.id,
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
        })
      );
    });
    return () => unsub();
  }, []);

  const selectedBus = buses.find((b) => b.id === selectedBusId) || null;
  const routeStops = selectedBus?.assignedRoute?.stops || [];

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 md:p-6 space-y-4">
          <PageHeader
            title="Live Fleet Tracking"
            description="Real-time bus location updates and operational status"
            action={
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsLoading(true);
                    fetchFleetTracking();
                    toast.info('Refreshing live fleet positions...');
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
                      selectedBus.tracking?.trackingStatus === TrackingStatus.LIVE
                        ? 'emerald'
                        : selectedBus.tracking?.trackingStatus === TrackingStatus.STALE
                        ? 'yellow'
                        : 'secondary'
                    }>
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        selectedBus.tracking?.trackingStatus === TrackingStatus.LIVE ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'
                      }`} />
                      {selectedBus.tracking?.trackingStatus || TrackingStatus.OFFLINE}
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
                  </div>

                  {/* Route Stops Sequence */}
                  {routeStops.length > 0 && (
                    <div className="pt-2.5 border-t border-slate-200 space-y-2">
                      <p className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Route Stop Sequence:</p>
                      <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                        {routeStops.map((s, idx) => (
                          <div key={s.id} className="flex items-center justify-between rounded-md bg-slate-50 p-2 border border-slate-200">
                            <div className="flex items-center gap-1.5">
                              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-900 font-bold text-white text-[9px]">
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
