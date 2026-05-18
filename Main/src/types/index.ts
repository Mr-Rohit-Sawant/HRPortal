// ============================================================
// GLOBAL TYPE DEFINITIONS
// ============================================================

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Auth
export interface User {
  id: string;
  employeeId?: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  phone?: string;
  profilePhoto?: string;
  roleId: string;
  role: Role;
  department?: string;
  designation?: string;
  joiningDate?: string;
  salary?: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  isSuperAdmin: boolean;
  permissions?: string[];
  lastLoginAt?: string;
  createdAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

// Roles & Permissions
export interface Role {
  id: string;
  name: string;
  description?: string;
  isSystem: boolean;
  permissions?: RolePermission[];
}

export interface Permission {
  id: string;
  module: string;
  action: string;
  description?: string;
}

export interface RolePermission {
  id: string;
  roleId: string;
  permissionId: string;
  permission: Permission;
}

// Candidates
export type CandidateStatus = 'NEW' | 'SCREENING' | 'SHORTLISTED' | 'INTERVIEWING' | 'OFFERED' | 'HIRED' | 'REJECTED' | 'ON_HOLD';
export type Gender = 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';

export interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  alternatePhone?: string;
  gender?: Gender;
  dateOfBirth?: string;
  profilePhoto?: string;
  currentLocation?: string;
  preferredLocations?: string[];
  religion?: string;
  caste?: string;
  languages?: string[];
  nationality?: string;
  currentDesignation?: string;
  currentCompany?: string;
  totalExperience?: number;
  currentCTC?: number;
  expectedCTC?: number;
  noticePeriod?: number;
  currentlyEmployed?: boolean;
  highestQualification?: string;
  specialization?: string;
  university?: string;
  passingYear?: number;
  educationDetails?: EducationDetail[];
  experienceDetails?: Record<string, any>[];
  country?: string;
  state?: string;
  city?: string;
  skills?: string[];
  certifications?: string[];
  technologyStack?: string[];
  status: CandidateStatus;
  isPriority: boolean;
  source?: string;
  notes?: string;
  cvFile?: string;
  cvOriginalName?: string;
  customFields?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface EducationDetail {
  degree: string;
  institution: string;
  year: number;
  percentage?: string;
}

// Clients
export interface Client {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  gstNumber?: string;
  panNumber?: string;
  industry?: string;
  website?: string;
  contractStartDate?: string;
  contractEndDate?: string;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  _count?: { jobOpenings: number; invoices: number };
}

// Job Openings
export type JobStatus = 'ACTIVE' | 'CLOSED' | 'ON_HOLD' | 'DRAFT';
export type JobPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'FREELANCE' | 'INTERNSHIP';

export interface JobOpening {
  id: string;
  jobTitle: string;
  clientId: string;
  client?: { id: string; companyName: string };
  description?: string;
  requiredSkills?: string[];
  preferredSkills?: string[];
  experienceMin?: number;
  experienceMax?: number;
  salaryMin?: number;
  salaryMax?: number;
  jobType: EmploymentType;
  workLocation?: string;
  workMode?: string;
  numberOfOpenings: number;
  status: JobStatus;
  priority: JobPriority;
  closingDate?: string;
  tags?: string[];
  customFields?: Record<string, any>;
  assignees?: Partial<User>[];
  rounds?: InterviewRound[];
  _count?: { applications: number; rounds: number };
  createdAt: string;
}

export interface InterviewRound {
  id: string;
  jobId: string;
  roundNumber: number;
  roundName: string;
  description?: string;
  slots: InterviewSlot[];
}

export interface InterviewSlot {
  id: string;
  roundId: string;
  candidateId: string;
  candidate?: Partial<Candidate>;
  scheduledDate?: string;
  scheduledTime?: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED';
  result: 'PENDING' | 'SELECTED' | 'REJECTED' | 'ON_HOLD';
  feedback?: string;
}

// Invoices
export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  client?: { id: string; companyName: string; email: string };
  invoiceDate: string;
  dueDate?: string;
  serviceDescription?: string;
  lineItems: LineItem[];
  subtotal: number;
  gstType?: string;
  cgstRate?: number;
  sgstRate?: number;
  igstRate?: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  totalTax?: number;
  totalAmount: number;
  status: InvoiceStatus;
  paidAmount?: number;
  paidAt?: string;
  paymentMethod?: string;
  notes?: string;
  pdfPath?: string;
  createdAt: string;
}

export interface LineItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

// Dashboard
export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  totalClients: number;
  activeClients: number;
  totalJobs: number;
  activeJobs: number;
  closedJobs: number;
  totalCandidates: number;
  priorityCandidates: number;
  invoices: {
    draft: { count: number; amount: number };
    sent: { count: number; amount: number };
    paid: { count: number; amount: number };
    overdue: { count: number; amount: number };
  };
}

// Dynamic Columns
export type ColumnDataType = 'STATUS' | 'DROPDOWN' | 'TEXT' | 'DATE' | 'EMPLOYEE' | 'CANDIDATES' | 'LOCATION' | 'FILES' | 'PRIORITY' | 'LABEL' | 'NUMBER' | 'CHECKBOX' | 'URL' | 'EMAIL' | 'PHONE';

export interface ColumnDefinition {
  id: string;
  module: string;
  name: string;
  label: string;
  dataType: ColumnDataType;
  isVisible: boolean;
  isRequired: boolean;
  isSortable: boolean;
  isFilterable: boolean;
  isEditable: boolean;
  order: number;
  width?: number;
  config?: Record<string, any>;
}

// App Settings
export interface AppSettings {
  appName?: string;
  logo?: string;
  primaryColor?: string;
  accentColor?: string;
  sidebarColor?: string;
  fontFamily?: string;
}

// Audit Log
export interface AuditLog {
  id: string;
  userId?: string;
  user?: { firstName: string; lastName: string };
  userEmail?: string;
  action: string;
  module: string;
  recordId?: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  createdAt: string;
}

// Notification
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

// Pagination
export interface PaginationParams {
  page: number;
  limit: number;
}
