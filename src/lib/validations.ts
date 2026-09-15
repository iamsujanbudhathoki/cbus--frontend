import { z } from 'zod';

export const collegeSchema = z.object({
  name: z.string().min(2, 'College name must be at least 2 characters'),
  code: z.string().min(2, 'Unique code must be at least 2 characters'),
  address: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email('Invalid contact email format').or(z.literal('')).optional(),
  adminName: z.string().min(2, 'Admin name must be at least 2 characters'),
  adminEmail: z.string().email('Invalid admin email address'),
  adminPassword: z.string().min(6, 'Admin password must be at least 6 characters'),
});

export type CollegeFormData = z.infer<typeof collegeSchema>;

export const studentSchema = z.object({
  name: z.string().min(2, 'Student name is required'),
  rollNumber: z.string().min(1, 'Roll number is required'),
  grade: z.string().optional(),
  phone: z.string().optional(),
  parentEmail: z.string().email('Invalid parent email address'),
  busId: z.string().min(1, 'Please select a assigned bus'),
});

export type StudentFormData = z.infer<typeof studentSchema>;

export const driverSchema = z.object({
  name: z.string().min(2, 'Driver name is required'),
  phone: z.string().min(5, 'Valid phone number is required'),
  licenseNumber: z.string().min(3, 'License number is required'),
  busId: z.string().optional(),
});

export type DriverFormData = z.infer<typeof driverSchema>;

export const parentSchema = z.object({
  name: z.string().min(2, 'Parent name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').or(z.literal('')).optional(),
  studentIds: z.array(z.string()),
});

export type ParentFormData = z.infer<typeof parentSchema>;

export const busSchema = z.object({
  busNumber: z.string().min(1, 'Bus number is required'),
  registrationNumber: z.string().min(1, 'Registration number is required'),
  capacity: z.number().min(1, 'Capacity must be at least 1'),
  model: z.string().optional(),
});

export type BusFormData = z.infer<typeof busSchema>;

export const routeStopSchema = z.object({
  name: z.string().min(1, 'Stop name is required'),
  latitude: z.number({ message: 'Valid latitude is required' }),
  longitude: z.number({ message: 'Valid longitude is required' }),
  estimatedTime: z.string().optional(),
});

export const routeSchema = z.object({
  name: z.string().min(2, 'Route name is required'),
  startLocation: z.string().min(2, 'Start location is required'),
  endLocation: z.string().min(2, 'End location is required'),
  stops: z.array(routeStopSchema),
});

export type RouteFormData = z.infer<typeof routeSchema>;
export type RouteStopFormData = z.infer<typeof routeStopSchema>;

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginFormData = z.infer<typeof loginSchema>;
