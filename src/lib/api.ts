import { Bus, College, Driver, DriverPortalData, DriverShift, Parent, Route, RouteStop, Student, User } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';


async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers,
  });

  const json = await response.json();

  if (!response.ok || json.success === false) {
    throw new Error(json.message || 'API request failed');
  }

  return json.data;
}

export const api = {
  // Auth
  login: (body: any) => fetchAPI<{ token: string; user: User }>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  logout: () => fetchAPI<any>('/auth/logout', { method: 'POST' }),
  register: (body: any) => fetchAPI<any>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  getMe: () => fetchAPI<User>('/auth/me'),

  // Colleges
  getColleges: () => fetchAPI<College[]>('/colleges'),
  getPlatformMetrics: () => fetchAPI<any>('/colleges/platform-metrics'),
  getCollegeById: (id: string) => fetchAPI<College>(`/colleges/${id}`),
  getCollegeMetrics: (id: string) => fetchAPI<any>(`/colleges/${id}/metrics`),
  createCollege: (body: any) => fetchAPI<any>('/colleges', { method: 'POST', body: JSON.stringify(body) }),
  updateCollege: (id: string, body: any) => fetchAPI<any>(`/colleges/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteCollege: (id: string) => fetchAPI<any>(`/colleges/${id}`, { method: 'DELETE' }),

  // Students
  getStudents: (collegeId?: string) => fetchAPI<Student[]>(`/students${collegeId ? `?collegeId=${collegeId}` : ''}`),
  getStudentById: (id: string) => fetchAPI<Student>(`/students/${id}`),
  createStudent: (body: any) => fetchAPI<Student>('/students', { method: 'POST', body: JSON.stringify(body) }),
  updateStudent: (id: string, body: any) => fetchAPI<Student>(`/students/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteStudent: (id: string) => fetchAPI<any>(`/students/${id}`, { method: 'DELETE' }),
  assignStudentBus: (body: any) => fetchAPI<any>('/students/assign-bus', { method: 'POST', body: JSON.stringify(body) }),
  assignStudentStop: (body: any) => fetchAPI<any>('/students/assign-stop', { method: 'POST', body: JSON.stringify(body) }),

  // Parents
  getParents: (collegeId?: string) => fetchAPI<Parent[]>(`/parents${collegeId ? `?collegeId=${collegeId}` : ''}`),
  getParentById: (id: string) => fetchAPI<Parent>(`/parents/${id}`),
  getParentByUserId: (userId: string) => fetchAPI<Parent>(`/parents/user/${userId}`),
  createParent: (body: any) => fetchAPI<Parent>('/parents', { method: 'POST', body: JSON.stringify(body) }),
  updateParent: (id: string, body: any) => fetchAPI<Parent>(`/parents/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteParent: (id: string) => fetchAPI<any>(`/parents/${id}`, { method: 'DELETE' }),
  linkParentStudent: (body: any) => fetchAPI<any>('/parents/link-student', { method: 'POST', body: JSON.stringify(body) }),

  // Drivers
  getDrivers: (collegeId?: string) => fetchAPI<Driver[]>(`/drivers${collegeId ? `?collegeId=${collegeId}` : ''}`),
  createDriver: (body: any) => fetchAPI<Driver>('/drivers', { method: 'POST', body: JSON.stringify(body) }),
  updateDriver: (id: string, body: any) => fetchAPI<Driver>(`/drivers/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteDriver: (id: string) => fetchAPI<any>(`/drivers/${id}`, { method: 'DELETE' }),

  // Buses
  getBuses: (collegeId?: string) => fetchAPI<Bus[]>(`/buses${collegeId ? `?collegeId=${collegeId}` : ''}`),
  getBusById: (id: string) => fetchAPI<Bus>(`/buses/${id}`),
  createBus: (body: any) => fetchAPI<Bus>('/buses', { method: 'POST', body: JSON.stringify(body) }),
  updateBus: (id: string, body: any) => fetchAPI<Bus>(`/buses/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteBus: (id: string) => fetchAPI<any>(`/buses/${id}`, { method: 'DELETE' }),
  assignBusRoute: (body: any) => fetchAPI<any>('/buses/assign-route', { method: 'POST', body: JSON.stringify(body) }),

  // Routes
  getRoutes: (collegeId?: string) => fetchAPI<Route[]>(`/routes${collegeId ? `?collegeId=${collegeId}` : ''}`),
  getRouteById: (id: string) => fetchAPI<Route>(`/routes/${id}`),
  createRoute: (body: any) => fetchAPI<Route>('/routes', { method: 'POST', body: JSON.stringify(body) }),
  updateRoute: (id: string, body: any) => fetchAPI<Route>(`/routes/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteRoute: (id: string) => fetchAPI<any>(`/routes/${id}`, { method: 'DELETE' }),
  addRouteStop: (body: any) => fetchAPI<RouteStop>('/routes/stops', { method: 'POST', body: JSON.stringify(body) }),
  deleteRouteStop: (stopId: string) => fetchAPI<any>(`/routes/stops/${stopId}`, { method: 'DELETE' }),

  // Live Tracking & Ingestion Simulator
  updateLocation: (body: any) => fetchAPI<any>('/tracking/update-location', { method: 'POST', body: JSON.stringify(body) }),
  getBusTracking: (busId: string) => fetchAPI<any>(`/tracking/bus/${busId}`),
  getFleetTracking: (collegeId?: string) => fetchAPI<Bus[]>(`/tracking/fleet${collegeId ? `?collegeId=${collegeId}` : ''}`),

  // Driver Shifts
  getDriverPortal: () => fetchAPI<DriverPortalData>('/driver-shifts/portal'),
  startDriverShift: (notes?: string) => fetchAPI<DriverShift>('/driver-shifts/start', { method: 'POST', body: JSON.stringify({ notes }) }),
  updateShiftNotes: (id: string, notes: string) => fetchAPI<DriverShift>(`/driver-shifts/${id}/notes`, { method: 'PUT', body: JSON.stringify({ notes }) }),
  endDriverShift: (id: string) => fetchAPI<DriverShift>(`/driver-shifts/${id}/end`, { method: 'POST' }),
  getDriverShiftHistory: (range?: string) => fetchAPI<DriverShift[]>(`/driver-shifts/history${range ? `?range=${range}` : ''}`),
  getAdminDriverShifts: (collegeId?: string, driverId?: string) => fetchAPI<DriverShift[]>(`/driver-shifts/admin?${collegeId ? `collegeId=${collegeId}` : ''}${driverId ? `&driverId=${driverId}` : ''}`),
};
