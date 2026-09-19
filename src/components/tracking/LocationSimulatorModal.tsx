'use client';

import React, { useState } from 'react';
import { Bus, BusStatus } from '@/lib/types';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Play, Square, RefreshCw, X, Crosshair, Radio } from 'lucide-react';
import { emitDriverLocation } from '@/lib/socket';

interface LocationSimulatorModalProps {
  buses: Bus[];
  isOpen: boolean;
  onClose: () => void;
  onLocationUpdated: () => void;
}

export default function LocationSimulatorModal({
  buses,
  isOpen,
  onClose,
  onLocationUpdated,
}: LocationSimulatorModalProps) {
  const [selectedBusId, setSelectedBusId] = useState<string>('');
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [isAutoSimulating, setIsAutoSimulating] = useState<boolean>(false);
  const [intervalId, setIntervalId] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [customLat, setCustomLat] = useState<string>('');
  const [customLng, setCustomLng] = useState<string>('');
  const [customSpeed, setCustomSpeed] = useState<string>('');
  const [logMessage, setLogMessage] = useState<string>('');
  const [isAcquiringGps, setIsAcquiringGps] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentBus = buses.find((b) => b.id === selectedBusId) || null;
  const configuredRouteStops = (currentBus?.assignedRoute?.stops || []).sort(
    (a, b) => a.sequence - b.sequence
  );

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
    } catch (e: any) {
      setLogMessage(`Failed: ${e.message}`);
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
    } catch (e: any) {
      setLogMessage(`Failed: ${e.message}`);
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
      } catch (err: any) {
        setLogMessage(`Auto simulation error: ${err.message}`);
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

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
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
                  className="w-full rounded border border-slate-300 px-2 py-1 text-xs font-mono"
                  placeholder="Latitude"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-medium">Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={customLng}
                  onChange={(e) => setCustomLng(e.target.value)}
                  className="w-full rounded border border-slate-300 px-2 py-1 text-xs font-mono"
                  placeholder="Longitude"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-medium">Speed (km/h)</label>
                <input
                  type="number"
                  value={customSpeed}
                  onChange={(e) => setCustomSpeed(e.target.value)}
                  className="w-full rounded border border-slate-300 px-2 py-1 text-xs font-mono"
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

          {logMessage && (
            <div className="rounded-lg bg-blue-50 p-2.5 text-xs text-blue-900 border border-blue-200 font-medium">
              {logMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
