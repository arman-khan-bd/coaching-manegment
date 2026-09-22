export type UserRole = 'super_admin' | 'institute_admin' | 'teacher' | 'student';

export interface SubscriptionPlan {
  id: string;
  name: string;
  tag: string;
  priceMonthly: number;
  priceYearly: number;
  description: string;
  features: string[];
  studentLimit: number;
  branchLimit: number;
  smsCreditsIncluded: number;
  androidGatewayIncluded: boolean;
  popular?: boolean;
}

export interface Student {
  id: string;
  rollNo: string;
  name: string;
  email: string;
  phone: string;
  guardianName: string;
  guardianPhone: string;
  photo: string;
  batchIds: string[];
  courseIds: string[];
  bloodGroup: string;
  status: 'active' | 'inactive' | 'graduated';
  enrollmentDate: string;
  feesDue: number;
  address: string;
  gender: 'male' | 'female' | 'other';
  dob: string;
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  phone: string;
  designation: string;
  photo: string;
  subjectSpecialization: string;
  assignedBatchIds: string[];
  salaryType: 'monthly' | 'hourly' | 'commission';
  salaryAmount: number;
  joiningDate: string;
  status: 'active' | 'on_leave';
  education: string;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  category: string;
  description: string;
  durationWeeks: number;
  feeAmount: number;
  unitsCount: number;
  thumbnail: string;
  status: 'published' | 'draft';
}

export interface Unit {
  id: string;
  courseId: string;
  unitNumber: number;
  title: string;
  description: string;
  topics: string[];
  estimatedHours: number;
  materialsCount: number;
}

export interface Batch {
  id: string;
  code: string;
  name: string;
  courseId: string;
  teacherId: string;
  roomNumber: string;
  scheduleDays: string[];
  startTime: string;
  endTime: string;
  maxCapacity: number;
  enrolledCount: number;
  status: 'upcoming' | 'running' | 'completed';
  startDate: string;
}

export interface AttendanceRecord {
  id: string;
  batchId: string;
  date: string;
  studentId: string;
  status: 'present' | 'absent' | 'late';
  remarks?: string;
}

export interface FeeInvoice {
  id: string;
  invoiceNo: string;
  studentId: string;
  studentName: string;
  batchId: string;
  batchName: string;
  courseName: string;
  amount: number;
  paidAmount: number;
  dueAmount: number;
  status: 'paid' | 'partial' | 'unpaid';
  issueDate: string;
  dueDate: string;
  paymentMethod?: 'Cash' | 'bKash' | 'Stripe' | 'Bank Transfer' | 'Card';
}

export interface Exam {
  id: string;
  title: string;
  courseId: string;
  batchId: string;
  examDate: string;
  totalMarks: number;
  passMarks: number;
  examType: 'MCQ' | 'Written' | 'Monthly Test' | 'Final Assessment';
}

export interface ExamMark {
  id: string;
  examId: string;
  studentId: string;
  studentName: string;
  rollNo: string;
  marksObtained: number;
  grade: string;
  remarks: string;
}

export interface AndroidGatewayConfig {
  connected: boolean;
  deviceName: string;
  batteryLevel: number;
  sim1Carrier: string;
  sim2Carrier: string;
  sim1DailySent: number;
  sim1DailyLimit: number;
  lastSyncTime: string;
  apiKey: string;
  webhookUrl: string;
  signalStrength: number; // 0-100%
}

export interface SmsAccount {
  cloudBalance: number;
  androidGateway: AndroidGatewayConfig;
}

export interface SmsLog {
  id: string;
  recipientName: string;
  recipientPhone: string;
  message: string;
  gateway: 'cloud' | 'android_sim1' | 'android_sim2';
  status: 'delivered' | 'sent' | 'failed';
  timestamp: string;
  cost: number;
}

export interface SmsTemplate {
  id: string;
  title: string;
  category: 'attendance' | 'fees' | 'exams' | 'batches' | 'teachers' | 'general';
  eventType: string;
  contentBangla: string;
  contentEnglish: string;
  variables: string[];
  activeLanguage?: 'bangla' | 'english';
  content?: string; // backwards compatibility
}

export interface InstituteSettings {
  // 1. General & Brand
  name: string;
  nameEnglish?: string;
  tagline: string;
  establishedYear?: string;
  regNumber?: string;
  branchName?: string;
  branchCode?: string;
  logo: string;
  icon?: string; // Coaching Icon / Favicon / App Icon

  // 2. Contact, Hotlines & Campus
  email: string;
  phone: string;
  hotline?: string; // 24/7 Hotline Number
  whatsapp?: string; // Official WhatsApp Number or Link
  alternatePhone?: string;
  website?: string;
  address: string;
  division?: string;
  district?: string;
  thana?: string;
  googleMapsUrl?: string;

  // Social Media Links
  socialMedia?: {
    facebook?: string;
    youtube?: string;
    instagram?: string;
    linkedin?: string;
    telegram?: string;
    website?: string;
  };

  // 3. Authorization, Seal & Signatures
  directorName?: string;
  directorDesignation?: string;
  directorSignature?: string;
  academicCoordinator?: string;
  officialSealText?: string;

  // 4. Financial & Payment Accounts
  bkashMerchant?: string;
  nagadMerchant?: string;
  rocketNumber?: string;
  bankAccountName?: string;
  bankName?: string;
  bankBranch?: string;
  bankAccountNumber?: string;
  bankRouting?: string;
  receiptHeaderNote?: string;
  receiptFooterNote?: string;

  // 5. Academic & Operations
  currency: string;
  currencySymbol: string;
  academicYear: string;
  timezone: string;
  weeklyHolidays?: string;
  classDurationMinutes?: number;
  admissionFeeDefault?: number;

  // 6. SMS & Automation
  defaultSmsGateway: 'cloud' | 'android';
  smsSenderId?: string;
  autoSmsOnAdmission?: boolean;
  autoSmsOnAttendance?: boolean;
  autoSmsOnFeePayment?: boolean;
  autoSmsOnExamResult?: boolean;
  preferredSmsLanguage?: 'bangla' | 'english';

  // 7. ID Card & Prefixes
  idCardPrefix?: string;
  idCardValidity?: string;
  showBloodGroupOnId?: boolean;
  showGuardianPhoneOnId?: boolean;
  showBarcodeOnId?: boolean;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
}

export interface SyllabusItem {
  id: string;
  courseId: string;
  courseName: string;
  subject: string;
  chapterNo: number;
  chapterTitle: string;
  topics: string[];
  lectureHours: number;
  examMarks: number;
  targetCompletionDate: string;
  status: 'completed' | 'in_progress' | 'upcoming';
  assignedTeacherName: string;
  textbookReference?: string;
  remarks?: string;
}

export interface RoutineSlot {
  id: string;
  batchId: string;
  batchName: string;
  day: 'Saturday' | 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
  startTime: string;
  endTime: string;
  subject: string;
  teacherId: string;
  teacherName: string;
  roomNumber: string;
  classType: 'theory' | 'model_test' | 'practical' | 'doubt_solve';
}

// ==========================================
// SAAS PLATFORM SUPER ADMIN INTERFACES
// ==========================================

export interface CoachingInstitute {
  id: string;
  name: string;
  slug: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  city: string;
  address: string;
  planId: string;
  planName: string;
  billingCycle: 'monthly' | 'yearly';
  status: 'active' | 'trial' | 'past_due' | 'suspended';
  studentCount: number;
  teacherCount: number;
  branchCount: number;
  totalRevenuePaid: number;
  renewalDate: string;
  createdAt: string;
  customDomain?: string;
  logoUrl?: string;
}

export interface PlatformSubscription {
  id: string;
  coachingId: string;
  coachingName: string;
  planId: string;
  planName: string;
  amount: number;
  billingCycle: 'monthly' | 'yearly';
  status: 'active' | 'trial' | 'past_due' | 'cancelled';
  paymentMethod: 'bKash' | 'Nagad' | 'Stripe' | 'Bank Transfer' | 'Cash';
  startDate: string;
  nextRenewalDate: string;
  autoRenew: boolean;
  invoiceId?: string;
}

export interface PlatformUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'super_admin' | 'platform_support' | 'institute_admin' | 'teacher';
  instituteId?: string;
  instituteName?: string;
  status: 'active' | 'suspended' | 'invited';
  lastLogin: string;
  createdAt: string;
}

export interface PlatformSettings {
  platformName: string;
  tagline: string;
  supportEmail: string;
  supportPhone: string;
  websiteUrl: string;
  trialDays: number;
  defaultSmsRate: number;
  maintenanceMode: boolean;
  globalAnnouncement: string;
  bkashConfig: {
    merchantNumber: string;
    appKey: string;
    active: boolean;
  };
  nagadConfig: {
    merchantNumber: string;
    active: boolean;
  };
  stripeConfig: {
    publishableKey: string;
    active: boolean;
  };
}

export interface PlatformTransaction {
  id: string;
  coachingId: string;
  coachingName: string;
  type: 'subscription' | 'sms_pack' | 'addon';
  itemTitle: string;
  amount: number;
  paymentMethod: 'bKash' | 'Nagad' | 'Stripe' | 'Bank Transfer';
  trxId: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  date: string;
}

