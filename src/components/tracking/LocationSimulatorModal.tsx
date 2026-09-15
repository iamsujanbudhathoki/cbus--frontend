'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { Bus, BusStatus } from '@/lib/types';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Play, Square, RefreshCw, X } from 'lucide-react';

interface LocationSimulatorModalProps {
  buses: Bus[];
  isOpen: boolean;
  onClose: () => void;
  onLocationUpdated: () => void;
}

// Sample route coordinate waypoints in Kathmandu
const sampleWaypoints = [
  { latitude: 27.6915, longitude: 85.342, name: 'Naya Baneshwor Chowk' },
  { latitude: 27.693, longitude: 85.331, name: 'Maitighar Flyover' },
  { latitude: 27.6942, longitude: 85.3206, name: 'Maitighar Mandala' },
  { latitude: 27.6925, longitude: 85.305, name: 'Tripureshwor Chowk' },
  { latitude: 27.6938, longitude: 85.2817, name: 'Kalanki Temple Stop' },
  { latitude: 27.6791, longitude: 85.2798, name: 'Tribhuvan College Campus Gate' },
];

export default function LocationSimulatorModal({
  buses,
  isOpen,
  onClose,
  onLocationUpdated,
}: LocationSimulatorModalProps) {
  const [selectedBusId, setSelectedBusId] = useState<string>(buses[0]?.id || '');
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [isAutoSimulating, setIsAutoSimulating] = useState<boolean>(false);
  const [intervalId, setIntervalId] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [logMessage, setLogMessage] = useState<string>('');

  if (!isOpen) return null;

  const currentBus = buses.find((b) => b.id === selectedBusId) || buses[0];

  const handleStepSimulate = async () => {
    if (!currentBus) return;
    setIsUpdating(true);

    const waypoint = sampleWaypoints[stepIndex % sampleWaypoints.length];
    const speed = Math.floor(Math.random() * 25) + 20; // 20 - 45 km/h

    try {
      await api.updateLocation({
        busId: currentBus.id,
        latitude: waypoint.latitude,
        longitude: waypoint.longitude,
        speed,
        heading: 90,
        status: BusStatus.MOVING,
      });

      setLogMessage(`Updated ${currentBus.busNumber} location to ${waypoint.name} (${speed} km/h)`);
      setStepIndex((prev) => prev + 1);
      onLocationUpdated();
    } catch (e: any) {
      setLogMessage(`Failed: ${e.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const startAutoSimulation = () => {
    if (isAutoSimulating) return;
    setIsAutoSimulating(true);

    let idx = stepIndex;
    const id = setInterval(async () => {
      if (!currentBus) return;
      const wp = sampleWaypoints[idx % sampleWaypoints.length];
      const spd = Math.floor(Math.random() * 20) + 25;

      try {
        await api.updateLocation({
          busId: currentBus.id,
          latitude: wp.latitude,
          longitude: wp.longitude,
          speed: spd,
          heading: 90,
          status: BusStatus.MOVING,
        });
        setLogMessage(`[Auto] Updated ${currentBus.busNumber} to ${wp.name}`);
        idx++;
        setStepIndex(idx);
        onLocationUpdated();
      } catch (err: any) {
        setLogMessage(`Auto update failed: ${err.message}`);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">📡</span>
            <h3 className="text-lg font-bold text-slate-900">GPS Location Simulator</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <Label required className="mb-1.5">Select Target Bus</Label>
            <Select value={selectedBusId} onValueChange={setSelectedBusId}>
              <SelectTrigger>
                <SelectValue placeholder="Select target bus..." />
              </SelectTrigger>
              <SelectContent>
                {buses.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.busNumber} ({b.vehicleNumber}) - {b.assignedRoute?.name || 'No Route'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 text-xs">
            <p className="font-semibold text-slate-700">Current Simulation Waypoint:</p>
            <p className="text-blue-600 font-bold mt-1">
              Stop { (stepIndex % sampleWaypoints.length) + 1 }: {sampleWaypoints[stepIndex % sampleWaypoints.length].name}
            </p>
            <p className="text-slate-500 mt-0.5">
              Lat: {sampleWaypoints[stepIndex % sampleWaypoints.length].latitude}, Lng:{' '}
              {sampleWaypoints[stepIndex % sampleWaypoints.length].longitude}
            </p>
          </div>

          {logMessage && (
            <div className="rounded-lg bg-blue-50 p-2.5 text-xs text-blue-800 border border-blue-200 font-medium">
              {logMessage}
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleStepSimulate}
              disabled={isUpdating || isAutoSimulating}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 cursor-pointer disabled:opacity-50 active:scale-95 transition-all"
            >
              <RefreshCw className={`h-4 w-4 ${isUpdating ? 'animate-spin' : ''}`} />
              Simulate 1 Step
            </button>

            {isAutoSimulating ? (
              <button
                onClick={stopAutoSimulation}
                className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 cursor-pointer active:scale-95 transition-all"
              >
                <Square className="h-4 w-4" />
                Stop Loop
              </button>
            ) : (
              <button
                onClick={startAutoSimulation}
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 cursor-pointer active:scale-95 transition-all"
              >
                <Play className="h-4 w-4" />
                Auto Loop
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
