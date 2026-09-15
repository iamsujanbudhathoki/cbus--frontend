export enum UserRole {
  ADMIN = 'ADMIN',
  COLLEGE = 'COLLEGE',
  DRIVER = 'DRIVER',
  PARENT = 'PARENT',
  STUDENT = 'STUDENT',
}

export { UserRole as Role };

export enum Status {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DEACTIVATED = 'DEACTIVATED',
}

export enum BusStatus {
  IDLE = 'IDLE',
  MOVING = 'MOVING',
  STOPPED = 'STOPPED',
  DELAYED = 'DELAYED',
  OFFLINE = 'OFFLINE',
}

export enum TrackingStatus {
  LIVE = 'LIVE',
  STALE = 'STALE',
  OFFLINE = 'OFFLINE',
}

export enum ShiftStatus {
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum TripType {
  MORNING = 'MORNING',
  EVENING = 'EVENING',
  BOTH = 'BOTH',
}

export enum AssignmentType {
  PICKUP = 'PICKUP',
  DROP = 'DROP',
  BOTH = 'BOTH',
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  collegeId?: string;
  collegeName?: string;
  phoneNumber?: string;
  college?: College;
}

export interface College {
  id: string;
  name: string;
  code: string;
  address?: string;
  contactPhone?: string;
  contactEmail?: string;
  status: Status;
  createdAt: string;
}

export interface Student {
  id: string;
  collegeId: string;
  name: string;
  rollNumber?: string;
  className?: string;
  section?: string;
  contact?: string;
  address?: string;
  status: Status;
  assignedBus?: Bus;
  assignedStop?: RouteStop;
  assignedRoute?: Route;
  parents?: Parent[];
}

export interface Parent {
  id: string;
  userId?: string;
  collegeId: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  status: Status;
  students?: Student[];
  children?: any[];
}

export interface Driver {
  id: string;
  userId?: string;
  collegeId: string;
  name: string;
  licenseNumber?: string;
  phone: string;
  status: Status;
}

export interface DriverShift {
  id: string;
  collegeId: string;
  driverId: string;
  driver?: Driver;
  busId: string;
  bus?: Bus;
  routeId?: string;
  route?: Route;
  busNumberSnap?: string;
  vehicleNumberSnap?: string;
  routeNameSnap?: string;
  startedAt: string;
  endedAt?: string;
  durationSeconds?: number;
  status: ShiftStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DriverPortalData {
  driver: Driver;
  bus: Bus | null;
  route: Route | null;
  activeShift: DriverShift | null;
}

export interface Bus {
  id: string;
  collegeId: string;
  busNumber: string;
  vehicleNumber: string;
  capacity: number;
  driverId?: string;
  driver?: Driver;
  status: BusStatus;
  isActive: boolean;
  assignedRoute?: Route;
  tracking?: TrackingData;
  college?: College;
}

export interface Route {
  id: string;
  collegeId: string;
  name: string;
  description?: string;
  status: Status;
  stops?: RouteStop[];
}

export interface RouteStop {
  id: string;
  routeId: string;
  name: string;
  latitude: number;
  longitude: number;
  sequence: number;
  estimatedTime?: string;
  status: Status;
}

export interface TrackingData {
  busId: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  status: BusStatus;
  lastUpdated: number;
  trackingStatus: TrackingStatus;
}
