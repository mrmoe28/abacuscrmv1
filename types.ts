
// Database types
export type UserRole = 'ADMIN' | 'SALES' | 'INSTALLER' | 'MANAGER';
export type ContactType = 'LEAD' | 'CUSTOMER' | 'VENDOR';
export type ContactSource = 'WEBSITE' | 'REFERRAL' | 'COLD_CALL' | 'MARKETING' | 'SOCIAL_MEDIA' | 'TRADE_SHOW' | 'OTHER';
export type DealStage = 'LEAD' | 'QUALIFIED' | 'SITE_SURVEY_SCHEDULED' | 'SITE_SURVEY_COMPLETED' | 'PROPOSAL_SENT' | 'NEGOTIATION' | 'CONTRACT_SIGNED' | 'PERMITS_PENDING' | 'PERMITS_APPROVED' | 'INSTALLATION_SCHEDULED' | 'INSTALLATION_IN_PROGRESS' | 'INSTALLATION_COMPLETED' | 'INSPECTION_PENDING' | 'INSPECTION_PASSED' | 'CLOSED_WON' | 'CLOSED_LOST';
export type ProjectType = 'RESIDENTIAL' | 'COMMERCIAL' | 'INDUSTRIAL';
export type SystemType = 'GRID_TIED' | 'OFF_GRID' | 'HYBRID';
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TaskType = 'CALL' | 'EMAIL' | 'MEETING' | 'SITE_VISIT' | 'FOLLOW_UP' | 'PROPOSAL' | 'PERMIT_APPLICATION' | 'OTHER';
export type AppointmentType = 'SITE_SURVEY' | 'CONSULTATION' | 'PROPOSAL_PRESENTATION' | 'CONTRACT_SIGNING' | 'INSTALLATION' | 'INSPECTION' | 'MAINTENANCE' | 'OTHER';
export type AppointmentStatus = 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
export type ProposalStatus = 'DRAFT' | 'SENT' | 'VIEWED' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
export type InstallationStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED';
export type EquipmentType = 'SOLAR_PANEL' | 'INVERTER' | 'MOUNTING_SYSTEM' | 'BATTERY' | 'MONITORING_SYSTEM' | 'ELECTRICAL_COMPONENT' | 'OTHER';
export type DocumentType = 'CONTRACT' | 'PERMIT' | 'PROPOSAL' | 'INVOICE' | 'RECEIPT' | 'INSPECTION_REPORT' | 'WARRANTY' | 'PHOTO' | 'OTHER';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
export type PaymentMethod = 'CASH' | 'CHECK' | 'CREDIT_CARD' | 'BANK_TRANSFER' | 'FINANCING';

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Dashboard types
export interface DashboardStats {
  totalLeads: number;
  totalCustomers: number;
  pipelineValue: number;
  dealsWon: number;
  tasksToday: number;
  appointmentsToday: number;
  newLeadsThisMonth: number;
  conversionRate: number;
}

// Navigation types
export interface NavItem {
  title: string;
  href: string;
  icon: string;
  roles?: UserRole[];
  children?: NavItem[];
}

// Form types
export interface ContactFormData {
  type: ContactType;
  source?: ContactSource;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  notes?: string;
  tags?: string[];
}

export interface DealFormData {
  title: string;
  value?: number;
  stage: DealStage;
  projectType: ProjectType;
  systemType: SystemType;
  systemSize?: number;
  estimatedProduction?: number;
  roofType?: string;
  shadingConcerns?: string;
  electricalUpgrade: boolean;
  monthlyElectricBill?: number;
  expectedCloseDate?: Date;
  probability?: number;
  notes?: string;
  contactId: string;
  assigneeId?: string;
}

export interface TaskFormData {
  title: string;
  description?: string;
  type: TaskType;
  priority: TaskPriority;
  dueDate?: Date;
  notes?: string;
  assigneeId?: string;
  contactId?: string;
  dealId?: string;
}

export interface AppointmentFormData {
  title: string;
  description?: string;
  type: AppointmentType;
  startTime: Date;
  endTime: Date;
  location?: string;
  notes?: string;
  contactId?: string;
  dealId?: string;
}

// Chart data types
export interface ChartData {
  name: string;
  value: number;
  color?: string;
}

export interface TimeSeriesData {
  date: string;
  value: number;
  category?: string;
}

// Filter types
export interface ContactFilters {
  type?: ContactType;
  source?: ContactSource;
  ownerId?: string;
  search?: string;
  tags?: string[];
}

export interface DealFilters {
  stage?: DealStage;
  projectType?: ProjectType;
  ownerId?: string;
  assigneeId?: string;
  search?: string;
  minValue?: number;
  maxValue?: number;
}

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  type?: TaskType;
  assigneeId?: string;
  ownerId?: string;
  search?: string;
  dueDateFrom?: Date;
  dueDateTo?: Date;
}

// Pagination types
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Integration types
export interface EmailTemplate {
  subject: string;
  body: string;
  variables: Record<string, string>;
}

export interface CalendarEvent {
  id?: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  location?: string;
  attendees?: string[];
}

export interface PaymentIntent {
  amount: number;
  currency: string;
  description?: string;
  metadata?: Record<string, string>;
}

export interface SMSMessage {
  to: string;
  body: string;
  from?: string;
}

// File upload types
export interface UploadedFile {
  name: string;
  size: number;
  type: string;
  url: string;
}

// Solar calculation types
export interface SolarCalculation {
  systemSize: number; // kW
  estimatedProduction: number; // kWh/year
  estimatedCost: number;
  estimatedSavings: number; // per year
  paybackPeriod: number; // months
  co2Offset: number; // tons per year
}

export interface SolarCalculationInput {
  monthlyElectricBill: number;
  roofSize: number; // sq ft
  roofDirection: 'north' | 'south' | 'east' | 'west';
  shadingFactor: number; // 0-1
  location: {
    lat: number;
    lng: number;
    state: string;
  };
}
