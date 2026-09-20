'use client';

import React, { useState, useRef } from 'react';
import { Bus, BusStatus } from '@/lib/types';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Play, Square, RefreshCw, X, Crosshair, Radio, Pause, Navigation, Zap } from 'lucide-react';
import { emitDriverLocation } from '@/lib/socket';

// ─── Geo math helpers ──────────────────────────────────────────────────────────

/** Haversine distance between two coordinates, returns km */
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

/** Initial compass bearing from point A to point B, in degrees 0–360 */
function calculateBearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/** Linearly interpolate N sub-steps between two geo points (exclusive of p1, inclusive of p2) */
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
  bearing: number; // heading to next point
  speed: number;   // km/h for this segment
}

/**
 * Build a smooth demo route.
 * - If route stops are provided, interpolate between each consecutive pair.
 * - Otherwise generate a synthetic 12-point circular loop around the origin.
 */
function generateDemoRoute(
  startLat: number,
  startLng: number,
  routeStops: { latitude: number; longitude: number }[],
  targetSpeedKmh: number
): DemoPoint[] {
  const TICK_INTERVAL_S = 1; // 1 second per tick

  const buildSegment = (
    fromLat: number,
    fromLng: number,
    toLat: number,
    toLng: number
  ): DemoPoint[] => {
    const distKm = calculateDistance(fromLat, fromLng, toLat, toLng);
    const bearing = calculateBearing(fromLat, fromLng, toLat, toLng);
    // Number of ticks to cover this segment at the target speed
    const travelTimeSec = distKm > 0 ? (distKm / targetSpeedKmh) * 3600 : 4;
    const steps = Math.max(4, Math.round(travelTimeSec / TICK_INTERVAL_S));
    const subPoints = interpolatePoints(fromLat, fromLng, toLat, toLng, steps);
    // Realistic speed: slight variation ±15%
    return subPoints.map(() => ({
      lat: 0, // will be filled below
      lng: 0,
      bearing,
      speed: targetSpeedKmh * (0.85 + Math.random() * 0.3),
    })).map((p, i) => ({ ...p, lat: subPoints[i].lat, lng: subPoints[i].lng }));
  };

  let waypoints: { latitude: number; longitude: number }[] = [];

  if (routeStops.length >= 2) {
    // Use assigned route stops as the skeleton
    waypoints = [...routeStops];
    // Loop back to start
    waypoints.push(routeStops[0]);
  } else if (routeStops.length === 1) {
    // Single stop: go there and come back
    waypoints = [{ latitude: startLat, longitude: startLng }, routeStops[0], { latitude: startLat, longitude: startLng }];
  } else {
    // Synthetic circular loop — 12 evenly-spaced points ~0.5 km radius
    const radiusDeg = 0.005; // ~0.55 km
    for (let i = 0; i <= 12; i++) {
      const angle = (i / 12) * 2 * Math.PI;
      waypoints.push({
        latitude: startLat + radiusDeg * Math.sin(angle),
        longitude: startLng + radiusDeg * Math.cos(angle),
      });
    }
  }

  const route: DemoPoint[] = [];
  // Always start from the user-supplied custom position
  let prevLat = startLat;
  let prevLng = startLng;

  for (const wp of waypoints) {
    const seg = buildSegment(prevLat, prevLng, wp.latitude, wp.longitude);
    route.push(...seg);
    prevLat = wp.latitude;
    prevLng = wp.longitude;
  }

  return route;
}

// ─── Component ─────────────────────────────────────────────────────────────────

interface LocationSimulatorModalProps {
  buses: Bus[];
  isOpen: boolean;
  onClose: () => void;
  onLocationUpdated: () => void;
}

type DemoState = 'idle' | 'running' | 'paused';

export default function LocationSimulatorModal({
  buses,
  isOpen,
  onClose,
  onLocationUpdated,
}: LocationSimulatorModalProps) {
  // ── Existing state ──────────────────────────────────────────────────────────
  const [selectedBusId, setSelectedBusId] = useState<string>('');
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [isAutoSimulating, setIsAutoSimulating] = useState<boolean>(false);
  const [intervalId, setIntervalId] = useState<ReturnType<typeof setInterval> | null>(null);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [customLat, setCustomLat] = useState<string>('');
  const [customLng, setCustomLng] = useState<string>('');
  const [customSpeed, setCustomSpeed] = useState<string>('');
  const [logMessage, setLogMessage] = useState<string>('');
  const [isAcquiringGps, setIsAcquiringGps] = useState<boolean>(false);

  // ── Demo simulation state ───────────────────────────────────────────────────
  const [demoState, setDemoState] = useState<DemoState>('idle');
  const [demoRoute, setDemoRoute] = useState<DemoPoint[]>([]);
  const [demoStepIndex, setDemoStepIndex] = useState<number>(0);
  const [demoCurrentPos, setDemoCurrentPos] = useState<{ lat: number; lng: number; bearing: number; speed: number } | null>(null);

  // Use refs for values the interval closure needs to read without stale captures
  const demoIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const demoRouteRef = useRef<DemoPoint[]>([]);
  const demoStepRef = useRef<number>(0);
  const selectedBusIdRef = useRef<string>('');

  if (!isOpen) return null;

  const currentBus = buses.find((b) => b.id === selectedBusId) || null;
  const configuredRouteStops = (currentBus?.assignedRoute?.stops || []).sort(
    (a, b) => a.sequence - b.sequence
  );

  // ── Existing handlers ───────────────────────────────────────────────────────

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
        setCustomSpeed(speed ? Math.round(speed * 3.6).toString() : '25');
        setLogMessage(`Acquired device GPS: [${latitude.toFixed(5)}, ${longitude.toFixed(5)}]`);
      },
      (err) => {
        setIsAcquiringGps(false);
        setLogMessage(`Failed to acquire device GPS: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSendCustom = async () => {
    if (!currentBus) return;
    const lat = parseFloat(customLat);
    const lng = parseFloat(customLng);
    const speed = parseFloat(customSpeed) || 0;

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setLogMessage('Please enter valid numeric latitude (-90 to 90) and longitude (-180 to 180)');
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
      setLogMessage(`Emitted live GPS packet for ${currentBus.busNumber}: [${lat.toFixed(5)}, ${lng.toFixed(5)}] @ ${speed} km/h`);
      onLocationUpdated();
    } catch (e: unknown) {
      setLogMessage(`Failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStepSimulate = async () => {
    if (!currentBus || configuredRouteStops.length === 0) return;
    setIsUpdating(true);
    const waypoint = configuredRouteStops[stepIndex % configuredRouteStops.length];
    const speed = parseFloat(customSpeed) || 30;
    try {
      emitDriverLocation({
        busId: currentBus.id,
        collegeId: currentBus.collegeId,
        latitude: waypoint.latitude,
        longitude: waypoint.longitude,
        speed,
        heading: 0,
        status: BusStatus.MOVING,
      });
      setLogMessage(`Emitted stop location for ${currentBus.busNumber}: Stop #${waypoint.sequence} (${waypoint.name})`);
      setStepIndex((prev) => prev + 1);
      onLocationUpdated();
    } catch (e: unknown) {
      setLogMessage(`Failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const startAutoSimulation = () => {
    if (isAutoSimulating || configuredRouteStops.length === 0) return;
    setIsAutoSimulating(true);
    let idx = stepIndex;
    const id = setInterval(async () => {
      if (!currentBus) return;
      const wp = configuredRouteStops[idx % configuredRouteStops.length];
      const spd = parseFloat(customSpeed) || 30;
      try {
        emitDriverLocation({
          busId: currentBus.id,
          collegeId: currentBus.collegeId,
          latitude: wp.latitude,
          longitude: wp.longitude,
          speed: spd,
          heading: 0,
          status: BusStatus.MOVING,
        });
        setLogMessage(`[Auto] Moved ${currentBus.busNumber} to Stop #${wp.sequence} (${wp.name})`);
        idx++;
        setStepIndex(idx);
        onLocationUpdated();
      } catch (err: unknown) {
        setLogMessage(`Auto simulation error: ${err instanceof Error ? err.message : String(err)}`);
      }
    }, 4000);
    setIntervalId(id);
  };

  const stopAutoSimulation = () => {
    if (intervalId) clearInterval(intervalId);
    setIntervalId(null);
    setIsAutoSimulating(false);
    setLogMessage('Auto simulation stopped');
  };

  // ── Demo simulation handlers ────────────────────────────────────────────────

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
      const step = demoStepRef.current;

      if (step >= currentRoute.length) {
        // Loop the route
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
        `🚌 Demo tick ${demoStepRef.current}/${currentRoute.length} · [${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}] · ${Math.round(point.speed)} km/h · ${Math.round(point.bearing)}°`
      );
      onLocationUpdated();
    }, 1000);
  };

  const handleStartDemo = () => {
    if (!currentBus) {
      setLogMessage('Please select a bus first.');
      return;
    }
    const lat = parseFloat(customLat);
    const lng = parseFloat(customLng);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setLogMessage('Please enter a valid starting latitude and longitude.');
      return;
    }

    const targetSpeed = parseFloat(customSpeed) || 30;
    const route = generateDemoRoute(lat, lng, configuredRouteStops, targetSpeed);
    setDemoRoute(route);
    setDemoStepIndex(0);

    clearDemoInterval();
    setDemoState('running');
    setLogMessage(`🟢 Demo started: ${route.length} steps generated. Starting from [${lat.toFixed(5)}, ${lng.toFixed(5)}]`);
    startDemoTick(currentBus, route, 0);
  };

  const handleResumeDemo = () => {
    if (!currentBus || demoRouteRef.current.length === 0) return;
    // Use ref values — they are always in sync with the interval, unlike React state which can be 1 tick behind
    const resumeStep = demoStepRef.current;
    const resumeRoute = demoRouteRef.current;
    clearDemoInterval();
    setDemoState('running');
    setLogMessage(`▶ Demo resumed from step ${resumeStep}/${resumeRoute.length}`);
    startDemoTick(currentBus, resumeRoute, resumeStep);
  };

  const handlePauseDemo = () => {
    clearDemoInterval();
    setDemoState('paused');
    setLogMessage(`⏸ Demo paused at step ${demoStepIndex}/${demoRoute.length} · ${demoCurrentPos ? `[${demoCurrentPos.lat.toFixed(5)}, ${demoCurrentPos.lng.toFixed(5)}]` : ''}`);
  };

  const handleStopDemo = () => {
    clearDemoInterval();

    // Emit a final IDLE packet so backend reflects the stopped state
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
    setLogMessage('⏹ Demo stopped. Final STOPPED packet sent.');
    onLocationUpdated();
  };

  // ── Compass bearing label ───────────────────────────────────────────────────
  const bearingLabel = (deg: number) => {
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW', 'N'];
    return dirs[Math.round(deg / 45)];
  };

  // ────────────────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-blue-600 animate-pulse" />
            <h3 className="text-lg font-bold text-slate-900">Live GPS Simulator</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {/* Bus selector */}
          <div>
            <Label required className="mb-1.5">Select Vehicle</Label>
            <Select value={selectedBusId} onValueChange={setSelectedBusId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a bus..." />
              </SelectTrigger>
              <SelectContent>
                {buses.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.busNumber} ({b.vehicleNumber}) - {b.assignedRoute?.name || 'No Route Assigned'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Real-Time GPS Coordinates */}
          <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200 text-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="font-bold text-slate-800">Dynamic GPS Coordinates:</p>
              <button
                type="button"
                onClick={handleUseDeviceGps}
                disabled={isAcquiringGps}
                className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 disabled:opacity-50 cursor-pointer"
              >
                <Crosshair className={`h-3.5 w-3.5 ${isAcquiringGps ? 'animate-spin' : ''}`} />
                <span>{isAcquiringGps ? 'Acquiring...' : 'Use My Device GPS'}</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-slate-500 font-medium">Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={customLat}
                  onChange={(e) => setCustomLat(e.target.value)}
                  className="w-full rounded border border-slate-300 bg-white text-slate-900 px-2 py-1 text-xs font-mono placeholder:text-slate-400 placeholder:opacity-100 hover:border-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 [color-scheme:light]"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-medium">Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={customLng}
                  onChange={(e) => setCustomLng(e.target.value)}
                  className="w-full rounded border border-slate-300 bg-white text-slate-900 px-2 py-1 text-xs font-mono placeholder:text-slate-400 placeholder:opacity-100 hover:border-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 [color-scheme:light]"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-medium">Speed (km/h)</label>
                <input
                  type="number"
                  value={customSpeed}
                  onChange={(e) => setCustomSpeed(e.target.value)}
                  className="w-full rounded border border-slate-300 bg-white text-slate-900 px-2 py-1 text-xs font-mono placeholder:text-slate-400 placeholder:opacity-100 hover:border-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 [color-scheme:light]"
                  placeholder="Speed"
                />
              </div>
            </div>

            <button
              onClick={handleSendCustom}
              disabled={isUpdating || !currentBus || !customLat || !customLng}
              className="w-full rounded-lg bg-emerald-600 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 cursor-pointer transition-all shadow-xs"
            >
              Broadcast GPS Packet over WebSocket
            </button>
          </div>

          {/* ── Demo / Simulate Movement ───────────────────────────────────── */}
          <div className="rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-3.5 text-xs space-y-3">
            {/* Header */}
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-600 text-white shadow">
                <Zap className="h-3.5 w-3.5" />
              </div>
              <div>
                <p className="font-bold text-blue-900 text-[13px] leading-tight">Demo Route Simulation</p>
                <p className="text-blue-600 text-[10px]">Uber-style live movement · Emits real WebSocket events</p>
              </div>
            </div>

            {/* Route info banner */}
            <div className="rounded-lg bg-white/70 border border-blue-100 p-2 text-[11px] text-blue-800">
              {configuredRouteStops.length >= 2 ? (
                <span>
                  🗺️ Will interpolate between <strong>{configuredRouteStops.length} route stops</strong> assigned to this bus.
                </span>
              ) : configuredRouteStops.length === 1 ? (
                <span>🗺️ Will travel to the single assigned stop and return.</span>
              ) : (
                <span>🔄 No route stops — will simulate a <strong>synthetic circular loop</strong> around your starting coordinates.</span>
              )}
            </div>

            {/* Live telemetry readout (when running or paused) */}
            {demoCurrentPos && (
              <div className="rounded-lg bg-slate-900 text-green-400 font-mono text-[10px] px-3 py-2.5 space-y-1 shadow-inner">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">LAT / LNG</span>
                  <span>{demoCurrentPos.lat.toFixed(6)}, {demoCurrentPos.lng.toFixed(6)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">SPEED</span>
                  <span className="text-yellow-400">{Math.round(demoCurrentPos.speed)} km/h</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">HEADING</span>
                  <span className="text-cyan-400">
                    {Math.round(demoCurrentPos.bearing)}° {bearingLabel(demoCurrentPos.bearing)}
                  </span>
                </div>
                {demoRoute.length > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">PROGRESS</span>
                    <span className="text-purple-400">
                      {demoStepIndex}/{demoRoute.length} steps
                    </span>
                  </div>
                )}
                {/* Progress bar */}
                {demoRoute.length > 0 && (
                  <div className="mt-1 h-1 rounded-full bg-slate-700 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-green-400 transition-all duration-500"
                      style={{ width: `${Math.round((demoStepIndex / demoRoute.length) * 100)}%` }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center gap-2 pt-0.5">
              {/* Start / Resume */}
              {demoState === 'idle' && (
                <button
                  onClick={handleStartDemo}
                  disabled={!currentBus || !customLat || !customLng || isAutoSimulating}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-600 py-2.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50 cursor-pointer transition-all shadow"
                >
                  <Play className="h-3.5 w-3.5 fill-white" />
                  Start Demo
                </button>
              )}

              {demoState === 'paused' && (
                <button
                  onClick={handleResumeDemo}
                  disabled={!currentBus}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-600 py-2.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50 cursor-pointer transition-all shadow"
                >
                  <Play className="h-3.5 w-3.5 fill-white" />
                  Resume
                </button>
              )}

              {/* Pause (shown when running) */}
              {demoState === 'running' && (
                <button
                  onClick={handlePauseDemo}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-amber-500 py-2.5 text-xs font-bold text-white hover:bg-amber-600 cursor-pointer transition-all shadow"
                >
                  <Pause className="h-3.5 w-3.5" />
                  Pause
                </button>
              )}

              {/* Stop (shown when running or paused) */}
              {(demoState === 'running' || demoState === 'paused') && (
                <button
                  onClick={handleStopDemo}
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-red-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-red-700 cursor-pointer transition-all shadow"
                >
                  <Square className="h-3.5 w-3.5" />
                  Stop
                </button>
              )}
            </div>

            {/* State badge */}
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                demoState === 'running'
                  ? 'bg-green-100 text-green-800'
                  : demoState === 'paused'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${
                  demoState === 'running' ? 'bg-green-500 animate-pulse' : demoState === 'paused' ? 'bg-amber-500' : 'bg-slate-400'
                }`} />
                {demoState === 'running' ? 'Simulating' : demoState === 'paused' ? 'Paused' : 'Ready'}
              </span>
              {demoState !== 'idle' && demoRoute.length > 0 && (
                <span className="text-[10px] text-blue-700 font-medium">
                  <Navigation className="inline h-3 w-3 mr-0.5 mb-0.5" />
                  {demoRoute.length} total steps · ~{Math.round(demoRoute.length / 60)}m loop
                </span>
              )}
            </div>
          </div>

          {/* Dynamic Route Waypoints Section */}
          <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200 text-xs space-y-2">
            <p className="font-bold text-slate-800">Tenant Route Waypoints Simulation:</p>
            {configuredRouteStops.length > 0 ? (
              <>
                <p className="text-blue-700 font-medium">
                  Next Stop #{configuredRouteStops[stepIndex % configuredRouteStops.length].sequence}:{' '}
                  <span className="font-bold">{configuredRouteStops[stepIndex % configuredRouteStops.length].name}</span>
                </p>
                <p className="font-mono text-[11px] text-slate-500">
                  Coord: {configuredRouteStops[stepIndex % configuredRouteStops.length].latitude.toFixed(5)},{' '}
                  {configuredRouteStops[stepIndex % configuredRouteStops.length].longitude.toFixed(5)}
                </p>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleStepSimulate}
                    disabled={isUpdating || isAutoSimulating || !currentBus}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-600 py-2 text-xs font-semibold text-white hover:bg-blue-700 cursor-pointer disabled:opacity-50 transition-all"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isUpdating ? 'animate-spin' : ''}`} />
                    Next Route Waypoint
                  </button>

                  {isAutoSimulating ? (
                    <button
                      onClick={stopAutoSimulation}
                      className="flex items-center justify-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 cursor-pointer transition-all"
                    >
                      <Square className="h-3.5 w-3.5" />
                      Stop
                    </button>
                  ) : (
                    <button
                      onClick={startAutoSimulation}
                      disabled={!currentBus}
                      className="flex items-center justify-center gap-1.5 rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-900 cursor-pointer disabled:opacity-50 transition-all"
                    >
                      <Play className="h-3.5 w-3.5" />
                      Auto Loop
                    </button>
                  )}
                </div>
              </>
            ) : (
              <p className="text-slate-500 italic">
                {currentBus
                  ? 'This bus has no assigned route stops configured. Use custom coordinates above.'
                  : 'Select a bus to view assigned route stops.'}
              </p>
            )}
          </div>

          {/* Log output */}
          {logMessage && (
            <div className="rounded-lg bg-blue-50 p-2.5 text-xs text-blue-900 border border-blue-200 font-medium font-mono break-all">
              {logMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
