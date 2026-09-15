'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Bus, RouteStop, TrackingStatus } from '@/lib/types';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import LiveMap from '@/components/tracking/LiveMap';
import LocationSimulatorModal from '@/components/tracking/LocationSimulatorModal';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Radio, RefreshCw, Navigation, Phone, User, Clock, Route } from 'lucide-react';
import { toast } from 'sonner';

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
      if (!selectedBusId && data.length > 0) {
        setSelectedBusId(data[0].id);
      }
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

  const selectedBus = buses.find((b) => b.id === selectedBusId) || buses[0];
  const routeStops = selectedBus?.assignedRoute?.stops || [];

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Radio className="h-5 w-5 text-red-500 animate-pulse shrink-0" />
                <h1 className="text-2xl font-extrabold text-slate-900">Live Fleet Tracking Dashboard</h1>
              </div>
              <p className="text-sm text-slate-500">Real-time bus location updates and operational status</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setIsLoading(true);
                  fetchFleetTracking();
                  toast.info('Refreshing live fleet positions...');
                }}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer active:scale-95 transition-all shadow-sm shrink-0"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh Now
              </button>

              <button
                onClick={() => setIsSimulatorOpen(true)}
                className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 cursor-pointer active:scale-95 transition-all shrink-0"
              >
                <span>📡</span>
                Open GPS Location Simulator
              </button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Map Area */}
            <div className="lg:col-span-2">
              <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200/80">
                <LiveMap
                  buses={buses}
                  routeStops={routeStops}
                  selectedBusId={selectedBusId}
                  onSelectBus={(busId) => setSelectedBusId(busId)}
                  height="550px"
                />
              </div>
            </div>

            {/* Selected Bus Info & Stop Sequence Drawer */}
            <div className="space-y-4">
              {/* Bus Selector */}
              <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80">
                <Label required className="mb-2 uppercase tracking-wider text-[11px] text-slate-500">
                  Select Bus to Inspect
                </Label>
                <Select value={selectedBusId} onValueChange={setSelectedBusId}>
                  <SelectTrigger className="font-bold text-slate-900">
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
                <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-lg font-black text-slate-900">{selectedBus.busNumber}</h3>
                      <p className="text-xs font-mono text-slate-500">{selectedBus.vehicleNumber}</p>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${
                        selectedBus.tracking?.trackingStatus === TrackingStatus.LIVE
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : selectedBus.tracking?.trackingStatus === TrackingStatus.STALE
                          ? 'bg-amber-50 border-amber-200 text-amber-700'
                          : 'bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                    >
                      <span className={`h-2 w-2 rounded-full ${
                        selectedBus.tracking?.trackingStatus === TrackingStatus.LIVE ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'
                      }`} />
                      {selectedBus.tracking?.trackingStatus || TrackingStatus.OFFLINE}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/60">
                      <p className="text-slate-500 font-medium">Speed</p>
                      <p className="text-base font-bold text-slate-900 mt-0.5">{selectedBus.tracking?.speed || 0} km/h</p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/60">
                      <p className="text-slate-500 font-medium">Last Location Sync</p>
                      <p className="text-xs font-bold text-slate-900 mt-1.5">
                        {selectedBus.tracking?.lastUpdated
                          ? `${Math.max(0, Math.round((Date.now() - selectedBus.tracking.lastUpdated) / 1000))}s ago`
                          : 'Never'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-slate-700">
                      <User className="h-4 w-4 text-slate-400 shrink-0" />
                      <span><strong>Driver:</strong> {selectedBus.driver?.name || 'Unassigned'}</span>
                    </div>

                    {selectedBus.driver?.phone && (
                      <div className="flex items-center gap-2 text-slate-700">
                        <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                        <span><strong>Phone:</strong> {selectedBus.driver.phone}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-slate-700">
                      <Route className="h-4 w-4 text-slate-400 shrink-0" />
                      <span><strong>Route:</strong> {selectedBus.assignedRoute?.name || 'Unassigned'}</span>
                    </div>
                  </div>

                  {/* Route Stops Sequence */}
                  {routeStops.length > 0 && (
                    <div className="pt-3 border-t border-slate-100">
                      <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Route Stop Sequence:</p>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {routeStops.map((s, idx) => (
                          <div key={s.id} className="flex items-center justify-between rounded-lg bg-slate-50 p-2.5 text-xs border border-slate-100">
                            <div className="flex items-center gap-2">
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 font-bold text-white text-[10px] shadow-sm">
                                {idx + 1}
                              </span>
                              <span className="font-semibold text-slate-800">{s.name}</span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono font-medium">{s.estimatedTime || '-'}</span>
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
