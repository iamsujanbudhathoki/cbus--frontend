import { io, Socket } from 'socket.io-client';
import { envConfig } from '../config/env.config';

export interface BusLocation {
  busId: string;
  collegeId?: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  status: string;
  lastUpdated: number;
  trackingStatus?: string;
}

let socketInstance: Socket | null = null;
const roomRefCounts = new Map<string, number>();

function joinRoom(socket: Socket, event: string, roomKey: string, payload: any) {
  const current = roomRefCounts.get(roomKey) || 0;
  roomRefCounts.set(roomKey, current + 1);
  if (current === 0) {
    socket.emit(event, payload);
  }
}

function leaveRoom(socket: Socket, event: string, roomKey: string, payload: any) {
  const current = roomRefCounts.get(roomKey) || 0;
  if (current <= 1) {
    roomRefCounts.delete(roomKey);
    socket.emit(event, payload);
  } else {
    roomRefCounts.set(roomKey, current - 1);
  }
}

export function getSocket(): Socket {
  if (!socketInstance) {
    const wsUrl = envConfig.NEXT_PUBLIC_WS_URL;
    socketInstance = io(wsUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      console.log('[Socket] Connected to realtime gateway with ID:', socketInstance?.id);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected from realtime gateway:', reason);
    });

    socketInstance.on('connect_error', (error) => {
      console.warn('[Socket] Connection error:', error.message);
    });
  }

  if (!socketInstance.connected) {
    socketInstance.connect();
  }

  return socketInstance;
}

/**
 * Subscribe to realtime location updates for a specific bus (used by parents/students).
 * Includes reference-counting to prevent premature unsubscriptions during page transitions.
 */
export function subscribeToBusLocation(
  busId: string,
  onLocation: (location: BusLocation) => void,
  onStatus?: (statusData: { busId: string; status: string }) => void
): () => void {
  if (!busId) return () => {};

  const socket = getSocket();
  const roomKey = `bus:${busId}`;

  joinRoom(socket, 'join:bus', roomKey, { busId });

  const handleLocation = (data: BusLocation) => {
    if (data && data.busId === busId && typeof data.latitude === 'number' && typeof data.longitude === 'number') {
      onLocation(data);
    }
  };

  const handleStatus = (data: { busId: string; status: string }) => {
    if (data && data.busId === busId) {
      if (onStatus) {
        onStatus(data);
      }
    }
  };

  socket.on('bus:location', handleLocation);
  socket.on('bus:status', handleStatus);

  return () => {
    socket.off('bus:location', handleLocation);
    socket.off('bus:status', handleStatus);
    leaveRoom(socket, 'leave:bus', roomKey, { busId });
  };
}

/**
 * Subscribe to realtime location updates for an entire college fleet (used by college admins).
 * Reference-counted to ensure smooth transitions between dashboard and map views.
 */
export function subscribeToFleet(
  collegeId: string,
  onLocation: (location: BusLocation) => void,
  onStatus?: (statusData: { busId: string; status: string }) => void
): () => void {
  if (!collegeId) return () => {};

  const socket = getSocket();
  const roomKey = `college:${collegeId}`;

  joinRoom(socket, 'join:college', roomKey, { collegeId });

  const handleLocation = (data: BusLocation) => {
    if (data && typeof data.latitude === 'number' && typeof data.longitude === 'number') {
      onLocation(data);
    }
  };

  const handleStatus = (data: { busId: string; status: string }) => {
    if (data && onStatus) {
      onStatus(data);
    }
  };

  const handleSnapshot = (fleetList: BusLocation[]) => {
    if (Array.isArray(fleetList)) {
      fleetList.forEach((loc) => {
        if (loc && typeof loc.latitude === 'number' && typeof loc.longitude === 'number') {
          onLocation(loc);
        }
      });
    }
  };

  socket.on('fleet:location', handleLocation);
  socket.on('fleet:status', handleStatus);
  socket.on('fleet:snapshot', handleSnapshot);

  return () => {
    socket.off('fleet:location', handleLocation);
    socket.off('fleet:status', handleStatus);
    socket.off('fleet:snapshot', handleSnapshot);
    leaveRoom(socket, 'leave:college', roomKey, { collegeId });
  };
}

/**
 * Emit real-time GPS coordinate packet from driver device over WebSocket.
 */
export function emitDriverLocation(data: {
  busId: string;
  collegeId?: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  status?: string;
}): void {
  if (!data?.busId) return;
  const socket = getSocket();
  socket.emit('bus:location_update', data);
}
