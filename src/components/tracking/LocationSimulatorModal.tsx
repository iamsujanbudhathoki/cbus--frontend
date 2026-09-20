'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bus, BusStatus } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Play,
  Square,
  RefreshCw,
  Crosshair,
  Radio,
  Pause,
  Zap,
  Navigation,
  Sliders,
} from 'lucide-react';
import { emitDriverLocation } from '@/lib/socket';

// ─── Geo Math Helpers ─────────────────────────────────────────────────────────

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calculateBearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function interpolatePoints(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
  steps: number
): { lat: number; lng: number }[] {
  const pts: { lat: number; lng: number }[] = [];
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    pts.push({ lat: lat1 + (lat2 - lat1) * t, lng: lng1 + (lng2 - lng1) * t });
  }
  return pts;
}

interface DemoPoint {
  lat: number;
  lng: number;
  bearing: number;
  speed: number;
}

function generateDemoRoute(
  startLat: number,
  startLng: number,
  routeStops: { latitude: number; longitude: number }[],
  targetSpeedKmh: number
): DemoPoint[] {
  const TICK_INTERVAL_S = 1;

  const buildSegment = (
    fromLat: number,
    fromLng: number,
    toLat: number,
    toLng: number
  ): DemoPoint[] => {
    const distKm = calculateDistance(fromLat, fromLng, toLat, toLng);
    const bearing = calculateBearing(fromLat, fromLng, toLat, toLng);
    const travelTimeSec = distKm > 0 ? (distKm / targetSpeedKmh) * 3600 : 4;
    const steps = Math.max(3, Math.round(travelTimeSec / TICK_INTERVAL_S));
    const subPoints = interpolatePoints(fromLat, fromLng, toLat, toLng, steps);
    return subPoints
      .map(() => ({
        lat: 0,
        lng: 0,
        bearing,
        speed: targetSpeedKmh * (0.9 + Math.random() * 0.2),
      }))
      .map((p, i) => ({ ...p, lat: subPoints[i].lat, lng: subPoints[i].lng }));
  };

  let waypoints: { latitude: number; longitude: number }[] = [];

  if (routeStops.length >= 2) {
    waypoints = [{ latitude: startLat, longitude: startLng }, ...routeStops, routeStops[0]];
  } else if (routeStops.length === 1) {
    waypoints = [
      { latitude: startLat, longitude: startLng },
      routeStops[0],
      { latitude: startLat, longitude: startLng },
    ];
  } else {
    const radiusDeg = 0.005;
    for (let i = 0; i <= 12; i++) {
      const angle = (i / 12) * 2 * Math.PI;
      waypoints.push({
        latitude: startLat + radiusDeg * Math.sin(angle),
        longitude: startLng + radiusDeg * Math.cos(angle),
      });
    }
  }

  const route: DemoPoint[] = [];
  let prevLat = startLat;
  let prevLng = startLng;

  for (const wp of waypoints) {
    if (Math.abs(prevLat - wp.latitude) < 0.00001 && Math.abs(prevLng - wp.longitude) < 0.00001) {
      continue;
    }
    const seg = buildSegment(prevLat, prevLng, wp.latitude, wp.longitude);
    route.push(...seg);
    prevLat = wp.latitude;
    prevLng = wp.longitude;
  }

  if (route.length === 0) {
    route.push({ lat: startLat, lng: startLng, bearing: 0, speed: targetSpeedKmh });
  }

  return route;
}

// ─── Component ─────────────────────────────────────────────────────────────────

interface LocationSimulatorModalProps {
  buses: Bus[];
  isOpen: boolean;
  onClose: () => void;
  onLocationUpdated: () => void;
  initialBusId?: string;
}

type DemoState = 'idle' | 'running' | 'paused';
type ActiveTab = 'auto' | 'manual';

export default function LocationSimulatorModal({
  buses,
  isOpen,
  onClose,
  onLocationUpdated,
  initialBusId,
}: LocationSimulatorModalProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('auto');
  const [selectedBusId, setSelectedBusId] = useState<string>('');
  const [customSpeed, setCustomSpeed] = useState<string>('30');
  const [customLat, setCustomLat] = useState<string>('');
  const [customLng, setCustomLng] = useState<string>('');
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [isAutoLooping, setIsAutoLooping] = useState<boolean>(false);
  const [isAcquiringGps, setIsAcquiringGps] = useState<boolean>(false);
  const [logMessage, setLogMessage] = useState<string>('');

  // Demo Movement State
  const [demoState, setDemoState] = useState<DemoState>('idle');
  const [demoRoute, setDemoRoute] = useState<DemoPoint[]>([]);
  const [demoStepIndex, setDemoStepIndex] = useState<number>(0);
  const [demoCurrentPos, setDemoCurrentPos] = useState<{
    lat: number;
    lng: number;
    bearing: number;
    speed: number;
  } | null>(null);

  const demoIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoLoopIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const demoRouteRef = useRef<DemoPoint[]>([]);
  const demoStepRef = useRef<number>(0);
  const selectedBusIdRef = useRef<string>('');

  // Auto-select initial bus
  useEffect(() => {
    if (isOpen) {
      if (initialBusId && buses.some((b) => b.id === initialBusId)) {
        setSelectedBusId(initialBusId);
      } else if (!selectedBusId && buses.length > 0) {
        setSelectedBusId(buses[0].id);
      }
    }
  }, [isOpen, initialBusId, buses]);

  const currentBus = buses.find((b) => b.id === selectedBusId) || null;
  const configuredRouteStops = (currentBus?.assignedRoute?.stops || []).sort(
    (a, b) => a.sequence - b.sequence
  );

  // Pre-populate coordinates from bus tracking or first stop
  useEffect(() => {
    if (!currentBus) return;
    if (currentBus.tracking?.latitude && currentBus.tracking?.longitude) {
      setCustomLat(currentBus.tracking.latitude.toFixed(6));
      setCustomLng(currentBus.tracking.longitude.toFixed(6));
    } else if (configuredRouteStops.length > 0) {
      setCustomLat(configuredRouteStops[0].latitude.toFixed(6));
      setCustomLng(configuredRouteStops[0].longitude.toFixed(6));
    } else if (!customLat) {
      setCustomLat('27.691500');
      setCustomLng('85.342000');
    }
  }, [selectedBusId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (demoIntervalRef.current) clearInterval(demoIntervalRef.current);
      if (autoLoopIntervalRef.current) clearInterval(autoLoopIntervalRef.current);
    };
  }, []);

  // ── Auto Route Movement Handlers ─────────────────────────────────────────────

  const clearDemoInterval = () => {
    if (demoIntervalRef.current) {
      clearInterval(demoIntervalRef.current);
      demoIntervalRef.current = null;
    }
  };

  const startDemoTick = (bus: Bus, route: DemoPoint[], startStep: number) => {
    demoRouteRef.current = route;
    demoStepRef.current = startStep;
    selectedBusIdRef.current = bus.id;

    demoIntervalRef.current = setInterval(() => {
      const currentRoute = demoRouteRef.current;
      if (demoStepRef.current >= currentRoute.length) {
        demoStepRef.current = 0;
      }

      const point = currentRoute[demoStepRef.current];
      if (!point) return;

      emitDriverLocation({
        busId: selectedBusIdRef.current,
        collegeId: bus.collegeId,
        latitude: point.lat,
        longitude: point.lng,
        speed: Math.round(point.speed),
        heading: Math.round(point.bearing),
        status: BusStatus.MOVING,
      });

      const nextStep = demoStepRef.current + 1;
      demoStepRef.current = nextStep >= currentRoute.length ? 0 : nextStep;

      setDemoStepIndex(demoStepRef.current);
      setDemoCurrentPos({
        lat: point.lat,
        lng: point.lng,
        bearing: point.bearing,
        speed: point.speed,
      });

      setLogMessage(
        `[${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}] • ${Math.round(point.speed)} km/h • ${Math.round(point.bearing)}°`
      );
      onLocationUpdated();
    }, 1000);
  };

  const handleStartDemo = () => {
    if (!currentBus) {
      setLogMessage('Please select a vehicle first.');
      return;
    }
    const lat = parseFloat(customLat);
    const lng = parseFloat(customLng);
    if (isNaN(lat) || isNaN(lng)) {
      setLogMessage('Invalid start coordinates.');
      return;
    }

    const targetSpeed = parseFloat(customSpeed) || 30;
    const route = generateDemoRoute(lat, lng, configuredRouteStops, targetSpeed);
    setDemoRoute(route);
    setDemoStepIndex(0);

    clearDemoInterval();
    setDemoState('running');
    setLogMessage(`Simulation started: ${route.length} steps along route at ~${targetSpeed} km/h.`);
    startDemoTick(currentBus, route, 0);
  };

  const handlePauseDemo = () => {
    clearDemoInterval();
    setDemoState('paused');
    setLogMessage(`Simulation paused.`);
  };

  const handleResumeDemo = () => {
    if (!currentBus || demoRouteRef.current.length === 0) return;
    const resumeStep = demoStepRef.current;
    const resumeRoute = demoRouteRef.current;
    clearDemoInterval();
    setDemoState('running');
    setLogMessage(`Simulation resumed from step ${resumeStep}/${resumeRoute.length}.`);
    startDemoTick(currentBus, resumeRoute, resumeStep);
  };

  const handleStopDemo = () => {
    clearDemoInterval();

    if (currentBus && demoCurrentPos) {
      emitDriverLocation({
        busId: currentBus.id,
        collegeId: currentBus.collegeId,
        latitude: demoCurrentPos.lat,
        longitude: demoCurrentPos.lng,
        speed: 0,
        heading: demoCurrentPos.bearing,
        status: BusStatus.STOPPED,
      });
    }

    setDemoState('idle');
    setDemoStepIndex(0);
    setDemoRoute([]);
    setDemoCurrentPos(null);
    demoRouteRef.current = [];
    demoStepRef.current = 0;
    setLogMessage('Simulation stopped.');
    onLocationUpdated();
  };

  // ── Manual Coordinates Handlers ──────────────────────────────────────────────

  const handleUseDeviceGps = () => {
    if (!('geolocation' in navigator)) {
      setLogMessage('Geolocation is not supported by your browser.');
      return;
    }
    setIsAcquiringGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsAcquiringGps(false);
        const { latitude, longitude, speed } = pos.coords;
        setCustomLat(latitude.toFixed(6));
        setCustomLng(longitude.toFixed(6));
        setCustomSpeed(speed ? Math.round(speed * 3.6).toString() : '30');
        setLogMessage(`Acquired device GPS: [${latitude.toFixed(5)}, ${longitude.toFixed(5)}]`);
      },
      (err) => {
        setIsAcquiringGps(false);
        setLogMessage(`GPS error: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSendCustomPacket = async () => {
    if (!currentBus) return;
    const lat = parseFloat(customLat);
    const lng = parseFloat(customLng);
    const speed = parseFloat(customSpeed) || 0;

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setLogMessage('Enter valid numeric latitude & longitude.');
      return;
    }

    setIsUpdating(true);
    try {
      emitDriverLocation({
        busId: currentBus.id,
        collegeId: currentBus.collegeId,
        latitude: lat,
        longitude: lng,
        speed,
        heading: 0,
        status: BusStatus.MOVING,
      });
      setLogMessage(`Broadcasted packet for ${currentBus.busNumber}: [${lat.toFixed(5)}, ${lng.toFixed(5)}]`);
      onLocationUpdated();
    } catch (e: unknown) {
      setLogMessage(`Error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStepStop = async () => {
    if (!currentBus || configuredRouteStops.length === 0) return;
    setIsUpdating(true);
    const wp = configuredRouteStops[stepIndex % configuredRouteStops.length];
    try {
      emitDriverLocation({
        busId: currentBus.id,
        collegeId: currentBus.collegeId,
        latitude: wp.latitude,
        longitude: wp.longitude,
        speed: parseFloat(customSpeed) || 30,
        heading: 0,
        status: BusStatus.MOVING,
      });
      setLogMessage(`Moved to Stop #${wp.sequence} (${wp.name})`);
      setStepIndex((prev) => prev + 1);
      onLocationUpdated();
    } catch (e: unknown) {
      setLogMessage(`Error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const bearingLabel = (deg: number) => {
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW', 'N'];
    return dirs[Math.round(deg / 45) % 8];
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden border border-slate-200 bg-white shadow-2xl rounded-2xl">
        {/* Modal Header */}
        <DialogHeader className="p-5 pb-3.5 border-b border-slate-100 pr-12">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
              <Radio className="h-4 w-4 text-blue-600 animate-pulse" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900">
                Bus Movement Simulator
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-0.5">
                Simulate realistic live movement along bus routes
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {/* Target Vehicle Selector */}
          <div>
            <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Select Bus</Label>
            <Select value={selectedBusId} onValueChange={setSelectedBusId}>
              <SelectTrigger className="h-10 bg-white border-slate-300 text-xs">
                <SelectValue placeholder="Choose a bus..." />
              </SelectTrigger>
              <SelectContent>
                {buses.map((b) => (
                  <SelectItem key={b.id} value={b.id} className="text-xs">
                    <span className="font-bold text-slate-900">{b.busNumber}</span> ({b.vehicleNumber})
                    {b.assignedRoute ? ` • ${b.assignedRoute.name}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Clean Segmented Tab Switcher */}
          <div className="flex rounded-lg bg-slate-100 p-1 border border-slate-200/80">
            <button
              type="button"
              onClick={() => setActiveTab('auto')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'auto'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Zap className="h-3.5 w-3.5 text-blue-600" />
              <span>Route Simulation</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('manual')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'manual'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sliders className="h-3.5 w-3.5 text-slate-500" />
              <span>Manual Telemetry</span>
            </button>
          </div>

          {/* ── TAB 1: Route Movement Simulation (Clean & Focused) ── */}
          {activeTab === 'auto' && (
            <div className="space-y-3.5">
              {/* Route Summary */}
              <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-blue-700 tracking-wider block">
                    Assigned Path
                  </span>
                  <p className="font-semibold text-slate-800 text-xs mt-0.5 truncate max-w-[240px]">
                    {currentBus?.assignedRoute?.name || 'Circular Loop (No route assigned)'}
                  </p>
                </div>
                <Badge variant="outline" className="bg-white text-[11px] font-medium border-blue-200 text-blue-800">
                  {configuredRouteStops.length} stops
                </Badge>
              </div>

              {/* Speed Preset Selector */}
              <div>
                <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Simulation Speed</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: '30 km/h (City)', val: '30' },
                    { label: '50 km/h (Normal)', val: '50' },
                    { label: '80 km/h (Fast)', val: '80' },
                  ].map((s) => (
                    <button
                      key={s.val}
                      type="button"
                      disabled={demoState !== 'idle'}
                      onClick={() => setCustomSpeed(s.val)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        customSpeed === s.val
                          ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Telemetry Display when Running / Paused */}
              {demoCurrentPos && (
                <div className="rounded-xl bg-slate-950 p-3 text-emerald-400 font-mono text-[11px] space-y-2 shadow-inner">
                  <div className="grid grid-cols-2 gap-2 border-b border-slate-800 pb-2">
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block font-sans">
                        Position
                      </span>
                      <span className="font-semibold text-white">
                        {demoCurrentPos.lat.toFixed(5)}, {demoCurrentPos.lng.toFixed(5)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block font-sans">
                        Speed & Heading
                      </span>
                      <span className="text-yellow-300 font-semibold">{Math.round(demoCurrentPos.speed)} km/h</span>
                      <span className="text-cyan-400 ml-2">
                        {Math.round(demoCurrentPos.bearing)}° ({bearingLabel(demoCurrentPos.bearing)})
                      </span>
                    </div>
                  </div>

                  {demoRoute.length > 0 && (
                    <div className="space-y-1 pt-0.5">
                      <div className="flex justify-between text-[10px] text-slate-400 font-sans">
                        <span>Route Progress</span>
                        <span>{Math.round((demoStepIndex / demoRoute.length) * 100)}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-400 transition-all duration-300"
                          style={{
                            width: `${Math.round((demoStepIndex / demoRoute.length) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Primary Action Buttons */}
              <div className="pt-1">
                {demoState === 'idle' && (
                  <Button
                    onClick={handleStartDemo}
                    disabled={!currentBus}
                    className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20"
                  >
                    <Play className="h-4 w-4 fill-white mr-2" />
                    Start Live Simulation
                  </Button>
                )}

                {demoState === 'running' && (
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handlePauseDemo}
                      className="flex-1 h-10 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs"
                    >
                      <Pause className="h-3.5 w-3.5 mr-1.5" />
                      Pause
                    </Button>
                    <Button
                      onClick={handleStopDemo}
                      variant="destructive"
                      className="flex-1 h-10 text-xs font-semibold"
                    >
                      <Square className="h-3.5 w-3.5 mr-1.5" />
                      Stop & Reset
                    </Button>
                  </div>
                )}

                {demoState === 'paused' && (
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleResumeDemo}
                      className="flex-1 h-10 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs"
                    >
                      <Play className="h-3.5 w-3.5 fill-white mr-1.5" />
                      Resume
                    </Button>
                    <Button
                      onClick={handleStopDemo}
                      variant="destructive"
                      className="flex-1 h-10 text-xs font-semibold"
                    >
                      <Square className="h-3.5 w-3.5 mr-1.5" />
                      Stop & Reset
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── TAB 2: Manual Coordinates (Optional Advanced Tools) ── */}
          {activeTab === 'manual' && (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Custom Position</span>
                <button
                  type="button"
                  onClick={handleUseDeviceGps}
                  disabled={isAcquiringGps}
                  className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 disabled:opacity-50 cursor-pointer"
                >
                  <Crosshair className={`h-3 w-3 ${isAcquiringGps ? 'animate-spin' : ''}`} />
                  <span>{isAcquiringGps ? 'Acquiring GPS...' : 'Use My GPS'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 block mb-1">Latitude</label>
                  <Input
                    type="number"
                    step="any"
                    value={customLat}
                    onChange={(e) => setCustomLat(e.target.value)}
                    placeholder="27.6915"
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 block mb-1">Longitude</label>
                  <Input
                    type="number"
                    step="any"
                    value={customLng}
                    onChange={(e) => setCustomLng(e.target.value)}
                    placeholder="85.3420"
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>

              <Button
                onClick={handleSendCustomPacket}
                disabled={isUpdating || !currentBus || !customLat || !customLng}
                variant="outline"
                size="sm"
                className="w-full text-xs font-semibold text-slate-800 border-slate-300 hover:bg-slate-50"
              >
                <Radio className="h-3.5 w-3.5 mr-1.5 text-blue-600" />
                Broadcast Single GPS Packet
              </Button>

              {configuredRouteStops.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <Button
                    onClick={handleStepStop}
                    disabled={isUpdating || !currentBus}
                    variant="secondary"
                    size="sm"
                    className="w-full text-xs"
                  >
                    <RefreshCw className={`h-3 w-3 mr-1.5 ${isUpdating ? 'animate-spin' : ''}`} />
                    Jump to Next Route Stop (#{(stepIndex % configuredRouteStops.length) + 1})
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Status Message Footer */}
          {logMessage && (
            <div className="rounded-lg bg-slate-100 px-3 py-1.5 text-[11px] font-mono text-slate-700 border border-slate-200/80 truncate flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
              <span className="truncate">{logMessage}</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
