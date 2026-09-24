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
  status?: 'active' | 'paused';
}

export interface Student {
  id: string;
  coachingId?: string; // Tenant isolation — which coaching this student belongs to
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

  // Additional optional details (requested by user)
  studyingInstitute?: string; // বর্তমান স্কুল / কলেজ / বিশ্ববিদ্যালয় (Studying Institute)
  motherName?: string; // মাতার নাম (Mother's Name)
  motherPhone?: string; // মাতার মোবাইল নম্বর (Mother's Phone)
  fatherName?: string; // পিতার নাম (Father's Name)
  village?: string; // গ্রাম / স্থায়ী এলাকা (Village / Permanent Address)
  messOrHostelName?: string; // মেস / হোস্টেল / ম্যাচ নাম (Mess / Hostel / Match Name)
  friendStudentIds?: string[]; // কোচিংয়ে অধ্যয়নরত বন্ধু / সহপাঠীদের আইডি (Friends in coaching)
  smsRecipientTarget?: 'father' | 'mother' | 'both' | 'student'; // SMS প্রেরণের মূল প্রাপক (SMS Recipient)
  additionalGuardianName?: string; // বিকল্প / স্থানীয় অভিভাবকের নাম (Local Guardian)
  additionalGuardianPhone?: string; // বিকল্প অভিভাবকের মোবাইল (Local Guardian Phone)
  additionalGuardianRelation?: string; // সম্পর্ক (যেমন: চাচা, মামা, খালা, ভাই) (Relation)
  previousGpa?: string; // পূর্ববর্তী ক্লাসের জিপিএ / পরীক্ষার ফলাফল (Previous GPA)
  notes?: string; // বিশেষ নোট / মন্তব্য (Special Notes)
}

export interface Teacher {
  id: string;
  coachingId?: string; // Tenant isolation
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
  signatureUrl?: string; // Teacher's uploaded signature image
  hasLoginAccount?: boolean; // Whether login credentials were created
  isHeadTeacher?: boolean; // Main teacher / Head of faculty designation
  permissions?: string[]; // Granular teacher role permissions (e.g. routine_view, attendance_mark, etc.)
}

export interface Course {
  id: string;
  coachingId?: string; // Tenant isolation
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
  coachingId?: string; // Tenant isolation
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
  coachingId?: string; // Tenant isolation
  batchId: string;
  date: string;
  studentId: string;
  status: 'present' | 'absent' | 'late';
  remarks?: string;
}

export interface FeeInvoice {
  id: string;
  coachingId?: string; // Tenant isolation
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
  coachingId?: string; // Tenant isolation
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
  coachingId?: string; // Tenant isolation
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

export interface BookItem {
  id: string;
  coachingId?: string;
  title: string;
  subject: string;
  author: string;
  publisher?: string;
  courseId?: string;
  courseName: string;
  classLevel: string;
  edition: string;
  price?: number;
  isRequired: 'mandatory' | 'optional';
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
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
  directorSignatureUrl?: string; // Main teacher / Director signature image URL
  headTeacherSignatureUrl?: string; // Head Teacher signature image URL
  officialSealText?: string;
  officialSealUrl?: string; // Official Stamp/Seal circular image URL
  academicCoordinator?: string;

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
  coachingCenterId?: string; // Unique coaching center ID for 10-second Android polling queue
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

export interface SmsQueueItem {
  id: string;
  coachingCenterId: string;
  recipientPhone: string;
  recipientName?: string;
  message: string;
  status: 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled';
  simSlot?: number;
  errorMessage?: string;
  createdAt: string;
  sentAt?: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
}

export interface SyllabusItem {
  id: string;
  coachingId?: string; // Tenant isolation
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
  coachingId?: string; // Tenant isolation
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
  coachingCenterId?: string; // Unique auto-generated ID (e.g. aac-dhaka-014i7u09834)
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
  status: 'active' | 'pending_approval' | 'rejected' | 'trial' | 'past_due' | 'cancelled' | 'suspended';
  paymentMethod: 'bKash' | 'Nagad' | 'Stripe' | 'Bank Transfer' | 'Cash';
  startDate: string;
  nextRenewalDate: string;
  autoRenew: boolean;
  invoiceId?: string;
  senderPhone?: string;
  trxId?: string;
  rejectionReason?: string;
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
  password?: string;
  lastLogin: string;
  createdAt: string;
}

export interface PlatformSettings {
  // 1. General Settings
  platformName: string;
  tagline: string;
  supportEmail: string;
  supportPhone: string;
  websiteUrl: string;
  trialDays: number;
  defaultSmsRate: number;
  maintenanceMode: boolean;
  globalAnnouncement: string;
  currency: string;
  currencySymbol: string;

  // 2. Branding & Cloudinary
  logoUrl: string;
  faviconUrl: string;
  darkLogoUrl?: string;
  cloudinaryCloudName?: string;
  cloudinaryUploadPreset?: string;
  cloudinaryApiKey?: string;

  // 3. SEO & Social Meta
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  ogImageUrl: string;
  canonicalUrl?: string;
  googleSiteVerification?: string;
  robotsIndexing: boolean;

  // 4. Tracking & Pixel Setup
  facebookPixelId: string;
  fbAccessToken?: string;
  conversionsApiEnabled: boolean;
  googleAnalyticsId: string;
  customHeadScripts?: string;
  customBodyScripts?: string;

  // 5. Payment Gateways
  bkashConfig: {
    merchantNumber: string;
    appKey: string;
    appSecret: string;
    username?: string;
    password?: string;
    sandbox: boolean;
    active: boolean;
  };
  nagadConfig: {
    merchantNumber: string;
    merchantId?: string;
    publicKey?: string;
    privateKey?: string;
    active: boolean;
  };
  stripeConfig: {
    publishableKey: string;
    secretKey?: string;
    webhookSecret?: string;
    active: boolean;
  };
  bankConfig?: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    branch: string;
    routingNumber: string;
    instructions: string;
    active: boolean;
  };

  // 6. Bangladesh Bulk SMS Gateway Provider Config (to sell & send)
  bulkSmsConfig?: {
    provider: 'greenweb' | 'elitbuzz' | 'reve' | 'boomcast' | 'metronet' | 'custom';
    apiKey: string;
    clientId?: string;
    senderId: string; // Approved Masking e.g. "CoachFlow"
    apiUrl: string;
    ratePerSmsCost: number; // e.g. ৳0.25 (Provider purchase cost)
    ratePerSmsSelling: number; // e.g. ৳0.35 (Selling price to coaching centers)
    accountBalanceCredits: number; // Live balance
    active: boolean;
  };

  // 7. Android SMS Gateway App Download & QR Code Manager
  androidAppConfig?: {
    versionName: string;
    versionCode: number;
    downloadUrl: string;
    releaseDate: string;
    releaseNotes: string;
    fileSizeMb: string;
  };
}

export interface PlatformTransaction {
  id: string;
  coachingId: string;
  coachingName: string;
  type: 'subscription' | 'sms_pack' | 'addon';
  itemTitle: string;
  amount: number;
  paymentMethod: 'bKash' | 'Nagad' | 'Stripe' | 'Bank Transfer' | 'Cash';
  trxId: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  date: string;
  senderPhone?: string;
  receiptNumber?: string;
  subtotal?: number;
  vatAmount?: number;
  notes?: string;
}

export interface PlatformReview {
  id: string;
  name: string;
  role: string;
  students: string;
  avatar: string;
  comment: string;
  rating: number;
  status: 'published' | 'hidden';
  createdAt: string;
}

export interface PlatformFaq {
  id: string;
  category: 'general' | 'sms' | 'academic' | 'billing' | 'security';
  question: string;
  answer: string;
  order: number;
  status: 'published' | 'hidden';
}

