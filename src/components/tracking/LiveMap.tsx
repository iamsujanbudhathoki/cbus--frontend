'use client';

import React, { useEffect, useRef } from 'react';
import { Bus, BusStatus, RouteStop, TrackingStatus } from '@/lib/types';
import 'leaflet/dist/leaflet.css';

interface LiveMapProps {
  buses: Bus[];
  routeStops?: RouteStop[];
  selectedBusId?: string;
  onSelectBus?: (busId: string) => void;
  height?: string;
}

export default function LiveMap({
  buses,
  routeStops = [],
  selectedBusId,
  onSelectBus,
  height = '500px',
}: LiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletInstance = useRef<any>(null);
  const markersRef = useRef<{ [key: string]: any }>({});
  const polylineRef = useRef<any>(null);
  const hasInitialFit = useRef<boolean>(false);
  const routeMarkersRef = useRef<{ [key: string]: any }>({});

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return;

    const L = require('leaflet');

    // Fix default marker icon paths in Leaflet
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    if (!leafletInstance.current) {
      // Priority 1: Selected bus live GPS
      let initialCenter: [number, number] | null = null;
      if (selectedBusId) {
        const sel = buses.find((b) => b.id === selectedBusId);
        if (typeof sel?.tracking?.latitude === 'number' && typeof sel?.tracking?.longitude === 'number') {
          initialCenter = [sel.tracking.latitude, sel.tracking.longitude];
        }
      }
      // Priority 2: Any bus in fleet with active live GPS
      if (!initialCenter) {
        const liveBus = buses.find((b) => typeof b.tracking?.latitude === 'number' && typeof b.tracking?.longitude === 'number');
        if (liveBus?.tracking) {
          initialCenter = [liveBus.tracking.latitude, liveBus.tracking.longitude];
        }
      }
      // Priority 3: First route stop if route configured
      if (!initialCenter && routeStops && routeStops.length > 0 && typeof routeStops[0].latitude === 'number') {
        initialCenter = [routeStops[0].latitude, routeStops[0].longitude];
      }
      // Priority 4: Neutral global view when no coordinates exist
      let initialZoom = 13;
      if (!initialCenter) {
        initialCenter = [20.0, 0.0];
        initialZoom = 2;
      }

      const map = L.map(mapRef.current).setView(initialCenter, initialZoom);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      leafletInstance.current = map;
    }

    const map = leafletInstance.current;

    // 1. Render Route Stops & Polyline
    Object.values(routeMarkersRef.current).forEach((m: any) => map.removeLayer(m));
    routeMarkersRef.current = {};
    if (polylineRef.current) {
      map.removeLayer(polylineRef.current);
      polylineRef.current = null;
    }

    if (routeStops && routeStops.length > 0) {
      const sortedStops = [...routeStops].sort((a, b) => a.sequence - b.sequence);
      const latLngs = sortedStops.map((stop) => [stop.latitude, stop.longitude]);

      polylineRef.current = L.polyline(latLngs, {
        color: '#2563eb', // Blue polyline
        weight: 4,
        opacity: 0.8,
        dashArray: '8, 8',
      }).addTo(map);

      sortedStops.forEach((stop, idx) => {
        const stopIcon = L.divIcon({
          className: 'custom-stop-icon',
          html: `<div style="background-color: #3b82f6; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 11px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${idx + 1}</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const stopMarker = L.marker([stop.latitude, stop.longitude], { icon: stopIcon }).addTo(map);
        stopMarker.bindPopup(`
          <div style="font-family: sans-serif; padding: 4px;">
            <span style="color: #2563eb; font-weight: bold; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px;">Route Stop ${stop.sequence}</span>
            <h4 style="margin: 2px 0 4px 0; font-weight: 700; font-size: 13px;">${stop.name}</h4>
            <p style="margin: 0; font-size: 11px; color: #6b7280;">Scheduled Waypoint &bull; Est. ${stop.estimatedTime || 'N/A'}</p>
          </div>
        `);
        routeMarkersRef.current[`stop_${stop.id}`] = stopMarker;
      });
    }

    // 2. Render & Update Bus Markers (Reuse existing markers for smooth movement without flicker)
    const currentBusIds = new Set(buses.map((b) => b.id));

    // Remove markers for buses that are no longer in active list
    Object.keys(markersRef.current).forEach((busId) => {
      if (!currentBusIds.has(busId)) {
        map.removeLayer(markersRef.current[busId]);
        delete markersRef.current[busId];
      }
    });

    const bounds: any[] = [];

    buses.forEach((bus) => {
      const lat = bus.tracking?.latitude;
      const lng = bus.tracking?.longitude;

      // Do NOT place markers for buses that have no verified real GPS location!
      if (typeof lat !== 'number' || typeof lng !== 'number') {
        if (markersRef.current[bus.id]) {
          map.removeLayer(markersRef.current[bus.id]);
          delete markersRef.current[bus.id];
        }
        return;
      }

      bounds.push([lat, lng]);

      const isMovingBus = bus.status === BusStatus.MOVING || bus.tracking?.status === BusStatus.MOVING;
      const trackingStatus =
        bus.tracking?.trackingStatus || (isMovingBus ? TrackingStatus.LIVE : TrackingStatus.OFFLINE);
      let statusColor = '#6b7280'; // Gray offline
      if (trackingStatus === TrackingStatus.LIVE || isMovingBus) statusColor = '#22c55e'; // Green live
      else if (trackingStatus === TrackingStatus.STALE) statusColor = '#eab308'; // Yellow stale

      const isSelected = selectedBusId === bus.id;

      const busIcon = L.divIcon({
        className: 'custom-bus-icon',
        html: `
          <div style="
            background-color: ${statusColor};
            color: white;
            padding: 6px 10px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            display: flex;
            align-items: center;
            gap: 6px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            border: ${isSelected ? '3px solid #1e40af' : '2px solid white'};
            transform: scale(${isSelected ? 1.15 : 1});
            transition: all 0.2s ease;
          ">
            <span>🚌</span>
            <span>${bus.busNumber}</span>
          </div>
        `,
        iconSize: [100, 36],
        iconAnchor: [50, 18],
      });

      const driverName = bus.driver?.name || 'Unassigned';
      const routeName = bus.assignedRoute?.name || 'Unassigned Route';
      const speed = bus.tracking?.speed || 0;
      const updatedAgo = bus.tracking?.lastUpdated
        ? `${Math.round((Date.now() - bus.tracking.lastUpdated) / 1000)}s ago`
        : 'Never';

      const popupContent = `
        <div style="font-family: sans-serif; min-width: 180px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <strong style="font-size: 14px;">${bus.busNumber}</strong>
            <span style="background-color: ${statusColor}; color: white; padding: 2px 6px; border-radius: 10px; font-size: 10px; font-weight: bold;">${trackingStatus}</span>
          </div>
          <p style="margin: 2px 0; font-size: 12px;"><strong>Vehicle:</strong> ${bus.vehicleNumber}</p>
          <p style="margin: 2px 0; font-size: 12px;"><strong>Driver:</strong> ${driverName}</p>
          <p style="margin: 2px 0; font-size: 12px;"><strong>Route:</strong> ${routeName}</p>
          <p style="margin: 2px 0; font-size: 12px;"><strong>Speed:</strong> ${speed} km/h</p>
          <p style="margin: 2px 0; font-size: 12px; color: #6b7280;"><strong>Last Updated:</strong> ${updatedAgo}</p>
        </div>
      `;

      if (markersRef.current[bus.id]) {
        // Smoothly update existing marker position, icon, and popup
        const existingMarker = markersRef.current[bus.id];
        existingMarker.setLatLng([lat, lng]);
        existingMarker.setIcon(busIcon);
        if (existingMarker.getPopup()) {
          existingMarker.getPopup().setContent(popupContent);
        }
      } else {
        // Create new marker
        const busMarker = L.marker([lat, lng], { icon: busIcon }).addTo(map);
        busMarker.bindPopup(popupContent);
        busMarker.on('click', () => {
          if (onSelectBus) onSelectBus(bus.id);
        });
        markersRef.current[bus.id] = busMarker;
      }
    });

    // 3. Camera bounds logic: Follow live bus GPS coordinates, NEVER fall back to route stops as bus position
    if (selectedBusId) {
      const selectedBus = buses.find((b) => b.id === selectedBusId);
      if (
        selectedBus &&
        typeof selectedBus.tracking?.latitude === 'number' &&
        typeof selectedBus.tracking?.longitude === 'number'
      ) {
        // Actively follow live driver coordinates
        map.panTo([selectedBus.tracking.latitude, selectedBus.tracking.longitude], { animate: true, duration: 0.5 });
      } else if (!hasInitialFit.current && routeStops && routeStops.length > 0) {
        // View entire route on first load while awaiting vehicle GPS
        const stopBounds = routeStops.map((s) => [s.latitude, s.longitude]);
        map.fitBounds(stopBounds, { padding: [50, 50], maxZoom: 14 });
        hasInitialFit.current = true;
      }
    } else if (!hasInitialFit.current && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      hasInitialFit.current = true;
    } else if (!hasInitialFit.current && routeStops.length > 0) {
      const stopBounds = routeStops.map((s) => [s.latitude, s.longitude]);
      map.fitBounds(stopBounds, { padding: [50, 50], maxZoom: 14 });
      hasInitialFit.current = true;
    }
  }, [buses, routeStops, selectedBusId]);

  const hasAnyCoordinates =
    buses.some((b) => typeof b.tracking?.latitude === 'number' && typeof b.tracking?.longitude === 'number') ||
    (routeStops && routeStops.length > 0 && typeof routeStops[0].latitude === 'number');

  return (
    <div className="relative w-full" style={{ height }}>
      <div
        ref={mapRef}
        className="relative z-0 isolate h-full w-full"
        style={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
      />
      {!hasAnyCoordinates && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-slate-900/85 backdrop-blur-md text-white px-4 py-2 rounded-full text-xs font-semibold shadow-lg flex items-center gap-2 border border-slate-700 pointer-events-none">
          <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
          <span>Awaiting live vehicle GPS telemetry or configured route stops</span>
        </div>
      )}
    </div>
  );
}
