import { writable, derived, get } from 'svelte/store';
import type {
  UserRole,
  SubscriptionPlan,
  Student,
  Teacher,
  Course,
  Unit,
  Batch,
  AttendanceRecord,
  FeeInvoice,
  Exam,
  ExamMark,
  SmsAccount,
  SmsLog,
  SmsTemplate,
  InstituteSettings,
  ToastMessage,
  SyllabusItem,
  RoutineSlot,
  CoachingInstitute,
  PlatformSubscription,
  PlatformUser,
  PlatformSettings,
  PlatformTransaction,
  SmsQueueItem,
} from './types';
import {
  syncStudentToDb,
  syncBatchToDb,
  syncAttendanceToDb,
  syncInvoiceToDb,
  syncSmsLogToDb,
  syncInstituteSettingsToDb,
  loadInstituteSettingsFromDb,
} from './supabase';
import {
  enqueueSmsToQueue,
  cancelSmsInQueue,
  cancelAllPendingSmsInQueue,
  loadSmsQueueFromSupabase,
  normalizePhoneNumber,
} from './smsQueueApi';

// ==========================================
// COACHING ID GENERATOR — tenant isolation
// ==========================================

/**
 * Generate a unique coaching center ID.
 * Format: <initials>-<city-slug>-<timestamp-b36><random>
 * Example: "aac-dhaka-014i7u09834"
 */
export function generateCoachingId(coachingName: string, city: string = 'bd'): string {
  // Get initials from coaching name (up to 3 words)
  const words = coachingName.trim().split(/\s+/).filter(Boolean);
  const initials = words
    .slice(0, 3)
    .map((w) => w[0]?.toLowerCase() || '')
    .join('')
    .replace(/[^a-z]/g, '') || 'cf';

  // City slug — keep letters only, lowercase, max 8 chars
  const citySlug = city
    .toLowerCase()
    .replace(/[^a-z]/g, '')
    .slice(0, 8) || 'bd';

  // Timestamp base36 + random suffix
  const ts = Date.now().toString(36); // e.g. "lm5b0xh"
  const rand = Math.random().toString(36).slice(2, 7); // e.g. "4k9qz"

  return `${initials}-${citySlug}-${ts}${rand}`;
}

// ==========================================
// TENANT-SCOPED STORE FACTORY
// ==========================================

/**
 * Creates a Svelte writable store whose data is persisted in localStorage under a
 * coaching-specific namespace key: `coachflow_<key>_<coachingId>`.
 *
 * - For the legacy demo coaching ("aac-dhaka-01"), pre-populates with `demoData`.
 * - For any other coaching, starts with an empty array (clean dashboard).
 * - When `coachingId` changes (switching tenants), the store reloads from the new namespace.
 */
const tenantReloaders: Array<(cid: string) => void> = [];

export function getActiveCoachingId(): string {
  if (typeof window === 'undefined') return 'aac-dhaka-01';
  try {
    const id = localStorage.getItem('coachflow_active_coaching_id');
    if (id) return id;
    const saved = localStorage.getItem('coachflow_institute_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed?.coachingCenterId) return parsed.coachingCenterId;
    }
  } catch (_) {}
  return 'aac-dhaka-01';
}

/**
 * Creates a Svelte writable store whose data is persisted in localStorage under a
 * coaching-specific namespace key: `coachflow_<key>_<coachingId>`.
 *
 * - For the legacy demo coaching ("aac-dhaka-01"), pre-populates with `demoData`.
 * - For any other coaching, starts with an empty array (clean dashboard).
 * - When `coachingId` changes (switching tenants), the store reloads from the new namespace.
 */
function createTenantStore<T>(
  key: string,
  demoData: T[],
  populateForNewTenants: boolean = false,
  demoCoachingId: string = 'aac-dhaka-01'
) {
  function storageKey(coachingId: string) {
    return `coachflow_${key}_${coachingId}`;
  }

  function loadFor(coachingId: string): T[] {
    if (typeof window === 'undefined') {
      return (populateForNewTenants || coachingId === demoCoachingId) ? demoData : [];
    }
    try {
      const raw = localStorage.getItem(storageKey(coachingId));
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (_) {}
    // First load for this coaching — demo gets demo data, others get empty (or starter data if populateForNewTenants)
    return (populateForNewTenants || coachingId === demoCoachingId) ? demoData : [];
  }

  const activeId = getActiveCoachingId();
  const store = writable<T[]>(loadFor(activeId));

  // Persist on every change
  if (typeof window !== 'undefined') {
    store.subscribe((val) => {
      const cid = getActiveCoachingId();
      try {
        localStorage.setItem(storageKey(cid), JSON.stringify(val));
      } catch (_) {}
    });
  }

  tenantReloaders.push((coachingId: string) => {
    store.set(loadFor(coachingId));
  });

  return store;
}

/**
 * Switch the active coaching tenant for all tenant stores.
 * Call this on login and on registration.
 */
export function switchActiveTenant(coachingId: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('coachflow_active_coaching_id', coachingId);
  }
  for (const reloader of tenantReloaders) {
    try {
      reloader(coachingId);
    } catch (e) {
      console.error('Failed to reload tenant store for', coachingId, e);
    }
  }
}



// ==========================================
// NAVIGATION & AUTH STORES
// ==========================================
export const currentView = writable<'landing' | 'login' | 'register' | 'checkout' | 'dashboard'>('landing');
export const activeTab = writable<string>('overview');
export const currentRole = writable<UserRole>('institute_admin');
export const selectedPlan = writable<SubscriptionPlan | null>(null);

// ==========================================
// TOAST NOTIFICATIONS
// ==========================================
export const toasts = writable<ToastMessage[]>([]);

export function showToast(type: ToastMessage['type'], title: string, message: string) {
  const id = Math.random().toString(36).substring(2, 9);
  toasts.update((all) => [...all, { id, type, title, message }]);
  setTimeout(() => {
    toasts.update((all) => all.filter((t) => t.id !== id));
  }, 4000);
}

// ==========================================
// SAAS SUBSCRIPTION PLANS (IN BANGLADESHI TAKA ৳)
// ==========================================
export const initialPlans: SubscriptionPlan[] = [
  {
    id: 'starter',
    name: 'স্টার্টার কোচিং (Starter)',
    tag: 'ব্যক্তিগত টিউটর ও ছোট কোচিং সেন্টার',
    priceMonthly: 1490,
    priceYearly: 14900,
    description: 'হোম টিউটর, প্রাইভেট ব্যাচ ও স্থানীয় অ্যাকাডেমিক সেন্টারের জন্য প্রযোজ্য।',
    features: [
      'সর্বোচ্চ ১০০ জন সক্রিয় শিক্ষার্থী',
      '৫টি অ্যাকাডেমিক ব্যাচ পরিচালনা',
      '৩ জন শিক্ষক ও স্টাফ অ্যাকাউন্ট',
      'ডিজিটাল হাজিরা ও বকেয়া ফি ট্র্যাকিং',
      'প্রিন্টেবল আইডি কার্ড ও ফি রসিদ',
      '৫০০ ফ্রি ক্লাউড SMS ব্যালেন্স',
      'অ্যান্ড্রয়েড SMS গেটওয়ে (নিজস্ব GP/BL সিম)',
    ],
    studentLimit: 100,
    branchLimit: 1,
    smsCreditsIncluded: 500,
    androidGatewayIncluded: true,
  },
  {
    id: 'pro',
    name: 'প্রো অ্যাকাডেমি (Pro Academy)',
    tag: 'জনপ্রিয় ও মাঝারি কোচিং সেন্টারের জন্য',
    priceMonthly: 3490,
    priceYearly: 34900,
    popular: true,
    description: 'এইচএসসি, এসএসসি ও ভর্তি কোচিংয়ের স্বয়ংক্রিয় অভিভাবক এসএমএস অ্যালার্ট ও ফি ম্যানেজমেন্ট।',
    features: [
      'সর্বোচ্চ ৫০০ জন শিক্ষার্থী',
      'আনলিমিটেড ব্যাচ ও কোর্স শিডিউল',
      '১৫ জন শিক্ষক ও অ্যাডমিন অ্যাক্সেস',
      'ডুয়েল SMS (ক্লাউড + নিজস্ব সিমে ফ্রি এসএমএস)',
      'অনুপস্থিতির সাথে সাথে অভিভাবককে বাংলা SMS',
      'মডেল টেস্ট মার্কশিট ও রেজাল্ট কার্ড জেনারেটর',
      'বকেয়া ফি রিমাইন্ডার ও বিকাশ রসিদ প্রিন্টার',
      'মাল্টিপল আইডি কার্ড ডিজাইন ও বাল্ক ডাউনলোড',
    ],
    studentLimit: 500,
    branchLimit: 2,
    smsCreditsIncluded: 2500,
    androidGatewayIncluded: true,
  },
  {
    id: 'enterprise',
    name: 'মাল্টি-ব্রাঞ্চ এলিট (Enterprise)',
    tag: 'উদ্বাস-রেটিনা ধাঁচের বড় প্রতিষ্ঠান ও চেইন',
    priceMonthly: 7990,
    priceYearly: 79900,
    description: 'ফার্মগেট, ধানমন্ডি, চট্টগ্রামসহ একাধিক শাখা বিশিষ্ট বড় কোচিং নেটওয়ার্কের জন্য।',
    features: [
      'আনলিমিটেড শিক্ষার্থী ও ব্রাঞ্চ',
      'মাল্টি-ব্রাঞ্চ কেন্দ্রীভূত ড্যাশবোর্ড',
      'আনলিমিটেড শিক্ষক ও পে-রোল হিসাব',
      'মাল্টি-ডিভাইস অ্যান্ড্রয়েড গেটওয়ে হাব (ডুয়েল সিম)',
      'কাস্টম ডোমেইন ও নিজস্ব ব্র্যান্ডিং',
      '২৪/৭ ডেডিকেটেড হোয়াটসঅ্যাপ ও ফোন সাপোর্ট',
      'স্বয়ংক্রিয় ডাটাবেজ ব্যাকআপ ও এক্সপোর্ট',
      'CodeCanyon স্ট্যান্ডার্ড API সিঙ্ক',
    ],
    studentLimit: 99999,
    branchLimit: 99,
    smsCreditsIncluded: 10000,
    androidGatewayIncluded: true,
  },
];

export const subscriptionPlans = writable<SubscriptionPlan[]>(initialPlans);

// Plan CRUD Actions
export function addPlan(planData: Omit<SubscriptionPlan, 'id'>) {
  const newPlan: SubscriptionPlan = {
    ...planData,
    id: `plan-${Date.now().toString(36)}`,
  };
  subscriptionPlans.update((all) => [...all, newPlan]);
  showToast('success', 'নতুন প্ল্যান তৈরি', `"${newPlan.name}" সফলভাবে যোগ করা হয়েছে।`);
}

export function updatePlan(id: string, updates: Partial<SubscriptionPlan>) {
  subscriptionPlans.update((all) => all.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  showToast('info', 'প্ল্যান আপডেট', 'সাবস্ক্রিপশন প্ল্যানের তথ্য আপডেট করা হয়েছে।');
}

export function deletePlan(id: string) {
  subscriptionPlans.update((all) => all.filter((p) => p.id !== id));
  showToast('warning', 'প্ল্যান অপসারিত', 'প্ল্যানটি সিস্টেম থেকে সরানো হয়েছে।');
}

export function togglePlanStatus(id: string) {
  subscriptionPlans.update((all) =>
    all.map((p) => {
      if (p.id === id) {
        const nextStatus = p.status === 'paused' ? 'active' : 'paused';
        showToast(
          nextStatus === 'active' ? 'success' : 'warning',
          nextStatus === 'active' ? 'প্যাকেজ সক্রিয়' : 'প্যাকেজ সাময়িক স্থগিত (Paused)',
          `"${p.name}" প্যাকেজ ${nextStatus === 'active' ? 'সক্রিয়' : 'পজ'} করা হয়েছে।`
        );
        return { ...p, status: nextStatus };
      }
      return p;
    })
  );
}

// ==========================================
// SAAS COACHINGS / TENANTS STORE
// ==========================================
export const coachingInstitutes = writable<CoachingInstitute[]>([
  {
    id: 'inst-1',
    name: 'এপেক্স অ্যাকাডেমিক কেয়ার (ফার্মগেট)',
    slug: 'apex-academic-care',
    ownerName: 'ইঞ্জিনিয়ার মোস্তাফিজুর রহমান',
    ownerEmail: 'mostafiz@apexcare.edu.bd',
    ownerPhone: '+880 1711-456789',
    city: 'ঢাকা (ফার্মগেট)',
    address: '২৮/এ তেজকুনিপাড়া, ফার্মগেট, ঢাকা-১২১৫',
    planId: 'pro',
    planName: 'প্রো অ্যাকাডেমি (Pro)',
    billingCycle: 'yearly',
    status: 'active',
    studentCount: 284,
    teacherCount: 14,
    branchCount: 2,
    totalRevenuePaid: 34900,
    renewalDate: '2027-02-15',
    createdAt: '2025-02-15',
  },
  {
    id: 'inst-2',
    name: 'ঢাকা সায়েন্স একাডেমি (উত্তরা প্রধান শাখা)',
    slug: 'dhaka-science-academy',
    ownerName: 'প্রফেসর ড. রফিকুল ইসলাম',
    ownerEmail: 'rafiqul@dhakascience.com',
    ownerPhone: '+880 1819-234567',
    city: 'ঢাকা (উত্তরা)',
    address: 'সেক্টর ৪, রোড ৭, উত্তরা মডেল টাউন, ঢাকা',
    planId: 'enterprise',
    planName: 'মাল্টি-ব্রাঞ্চ এলিট (Enterprise)',
    billingCycle: 'yearly',
    status: 'active',
    studentCount: 620,
    teacherCount: 28,
    branchCount: 3,
    totalRevenuePaid: 79900,
    renewalDate: '2027-01-10',
    createdAt: '2025-01-10',
  },
  {
    id: 'inst-3',
    name: 'প্রাইম মেডিকেল ও ভার্সিটি কোচিং',
    slug: 'prime-medical-varsity',
    ownerName: 'ডাঃ কামরুল হাসান',
    ownerEmail: 'kamrul@primemedical.edu.bd',
    ownerPhone: '+880 1912-345678',
    city: 'ময়মনসিংহ',
    address: 'মেডিকেল কলেজ রোড, ময়মনসিংহ সদর',
    planId: 'pro',
    planName: 'প্রো অ্যাকাডেমি (Pro)',
    billingCycle: 'monthly',
    status: 'active',
    studentCount: 145,
    teacherCount: 8,
    branchCount: 1,
    totalRevenuePaid: 10470,
    renewalDate: '2026-10-18',
    createdAt: '2026-06-18',
  },
  {
    id: 'inst-4',
    name: 'রেটিনা এক্সিলেন্স কোচিং (ধানমন্ডি)',
    slug: 'retina-dhanmondi',
    ownerName: 'মাহবুব আলম তৌহিদ',
    ownerEmail: 'touhid@retinadhk.com',
    ownerPhone: '+880 1715-987654',
    city: 'ঢাকা (ধানমন্ডি)',
    address: 'রোড ২/এ, ধানমন্ডি আ/এ, ঢাকা',
    planId: 'pro',
    planName: 'প্রো অ্যাকাডেমি (Pro)',
    billingCycle: 'monthly',
    status: 'trial',
    studentCount: 65,
    teacherCount: 5,
    branchCount: 1,
    totalRevenuePaid: 0,
    renewalDate: '2026-10-02',
    createdAt: '2026-09-18',
  },
  {
    id: 'inst-5',
    name: 'ফিউচার স্কলার্স অ্যাকাডেমি (বগুড়া)',
    slug: 'future-scholars-bogra',
    ownerName: 'মাওলানা আব্দুল হাকিম',
    ownerEmail: 'hakim@futurescholars.com',
    ownerPhone: '+880 1733-112233',
    city: 'বগুড়া',
    address: 'জলেশ্বরীতলা, বগুড়া সদর',
    planId: 'starter',
    planName: 'স্টার্টার কোচিং (Starter)',
    billingCycle: 'monthly',
    status: 'past_due',
    studentCount: 42,
    teacherCount: 3,
    branchCount: 1,
    totalRevenuePaid: 1490,
    renewalDate: '2026-09-12',
    createdAt: '2026-08-12',
  },
  {
    id: 'inst-6',
    name: 'সানরাইজ ক্যাডেট কেয়ার (সিলেট)',
    slug: 'sunrise-cadet-sylhet',
    ownerName: 'ক্যাপ্টেন (অব.) জসিম উদ্দিন',
    ownerEmail: 'jasim@sunrisecadet.edu.bd',
    ownerPhone: '+880 1622-445566',
    city: 'সিলেট',
    address: 'কুমারপাড়া পয়েন্ট, সিলেট সদর',
    planId: 'starter',
    planName: 'স্টার্টার কোচিং (Starter)',
    billingCycle: 'monthly',
    status: 'suspended',
    studentCount: 18,
    teacherCount: 2,
    branchCount: 1,
    totalRevenuePaid: 0,
    renewalDate: '2026-08-01',
    createdAt: '2026-07-01',
  },
]);

// Coaching Actions
export function addCoaching(data: Omit<CoachingInstitute, 'id' | 'createdAt' | 'totalRevenuePaid'>) {
  const autoCoachingCenterId = data.coachingCenterId || generateCoachingId(data.name, data.city);
  const newInst: CoachingInstitute = {
    ...data,
    id: `inst-${Date.now()}`,
    coachingCenterId: autoCoachingCenterId,
    createdAt: new Date().toISOString().split('T')[0],
    totalRevenuePaid: 0,
  };
  coachingInstitutes.update((all) => [newInst, ...all]);
  showToast('success', 'কোচিং নিবন্ধিত', `"${newInst.name}" সফলভাবে যুক্ত করা হয়েছে। ID: ${autoCoachingCenterId}`);
}

export function updateCoaching(id: string, updates: Partial<CoachingInstitute>) {
  coachingInstitutes.update((all) => all.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  showToast('info', 'তথ্য হালনাগাদ', 'কোচিং সেন্টারের প্রোফাইল আপডেট হয়েছে।');
}

export function toggleCoachingStatus(id: string) {
  coachingInstitutes.update((all) =>
    all.map((c) => {
      if (c.id === id) {
        const nextStatus = c.status === 'active' ? 'suspended' : 'active';
        showToast(
          nextStatus === 'active' ? 'success' : 'warning',
          'স্ট্যাটাস পরিবর্তন',
          `কোচিং স্ট্যাটাস ${nextStatus === 'active' ? 'Active' : 'Suspended'} করা হয়েছে।`
        );
        return { ...c, status: nextStatus };
      }
      return c;
    })
  );
}

export function deleteCoaching(id: string) {
  coachingInstitutes.update((all) => all.filter((c) => c.id !== id));
  showToast('warning', 'কোচিং অপসারিত', 'কোচিং রেকর্ড মুছে ফেলা হয়েছে।');
}

// ==========================================
// SAAS TENANT SUBSCRIPTIONS STORE
// ==========================================
export const platformSubscriptions = writable<PlatformSubscription[]>([
  {
    id: 'sub-101',
    coachingId: 'inst-1',
    coachingName: 'এপেক্স অ্যাকাডেমিক কেয়ার (ফার্মগেট)',
    planId: 'pro',
    planName: 'প্রো অ্যাকাডেমি (Pro)',
    amount: 34900,
    billingCycle: 'yearly',
    status: 'active',
    paymentMethod: 'bKash',
    startDate: '2026-02-15',
    nextRenewalDate: '2027-02-15',
    autoRenew: true,
    invoiceId: 'INV-SAAS-2026-001',
  },
  {
    id: 'sub-102',
    coachingId: 'inst-2',
    coachingName: 'ঢাকা সায়েন্স একাডেমি (উত্তরা)',
    planId: 'enterprise',
    planName: 'মাল্টি-ব্রাঞ্চ এলিট (Enterprise)',
    amount: 79900,
    billingCycle: 'yearly',
    status: 'active',
    paymentMethod: 'Bank Transfer',
    startDate: '2026-01-10',
    nextRenewalDate: '2027-01-10',
    autoRenew: true,
    invoiceId: 'INV-SAAS-2026-002',
  },
  {
    id: 'sub-103',
    coachingId: 'inst-3',
    coachingName: 'প্রাইম মেডিকেল ও ভার্সিটি কোচিং',
    planId: 'pro',
    planName: 'প্রো অ্যাকাডেমি (Pro)',
    amount: 3490,
    billingCycle: 'monthly',
    status: 'active',
    paymentMethod: 'bKash',
    startDate: '2026-09-18',
    nextRenewalDate: '2026-10-18',
    autoRenew: true,
    invoiceId: 'INV-SAAS-2026-089',
  },
  {
    id: 'sub-104',
    coachingId: 'inst-4',
    coachingName: 'রেটিনা এক্সিলেন্স কোচিং (ধানমন্ডি)',
    planId: 'pro',
    planName: 'প্রো অ্যাকাডেমি (Pro)',
    amount: 0,
    billingCycle: 'monthly',
    status: 'trial',
    paymentMethod: 'Cash',
    startDate: '2026-09-18',
    nextRenewalDate: '2026-10-02',
    autoRenew: false,
  },
  {
    id: 'sub-105',
    coachingId: 'inst-5',
    coachingName: 'ফিউচার স্কলার্স অ্যাকাডেমি (বগুড়া)',
    planId: 'starter',
    planName: 'স্টার্টার কোচিং (Starter)',
    amount: 1490,
    billingCycle: 'monthly',
    status: 'past_due',
    paymentMethod: 'Nagad',
    startDate: '2026-08-12',
    nextRenewalDate: '2026-09-12',
    autoRenew: true,
    invoiceId: 'INV-SAAS-2026-074',
  },
  {
    id: 'sub-106',
    coachingId: 'inst-6',
    coachingName: 'সানরাইজ ক্যাডেট কেয়ার (সিলেট)',
    planId: 'pro',
    planName: 'প্রো অ্যাকাডেমি (Pro)',
    amount: 3490,
    billingCycle: 'monthly',
    status: 'pending_approval',
    paymentMethod: 'bKash',
    startDate: '2026-09-22',
    nextRenewalDate: '2026-10-22',
    autoRenew: true,
    senderPhone: '01712-889900',
    trxId: 'BKH8X99201A',
    invoiceId: 'INV-SAAS-2026-112',
  },
  {
    id: 'sub-107',
    coachingId: 'inst-7',
    coachingName: 'নলেজ ভ্যালি সায়েন্স একাডেমি (কুমিল্লা)',
    planId: 'enterprise',
    planName: 'মাল্টি-ব্রাঞ্চ এলিট (Enterprise)',
    amount: 79900,
    billingCycle: 'yearly',
    status: 'pending_approval',
    paymentMethod: 'Nagad',
    startDate: '2026-09-22',
    nextRenewalDate: '2027-09-22',
    autoRenew: true,
    senderPhone: '01811-334455',
    trxId: 'NGD7P441199',
    invoiceId: 'INV-SAAS-2026-113',
  },
]);

export function addPlatformSubscription(subData: Omit<PlatformSubscription, 'id'>) {
  const newSub: PlatformSubscription = {
    ...subData,
    id: `sub-${Date.now()}`,
    invoiceId: `INV-SAAS-${Date.now().toString().slice(-4)}`,
  };
  platformSubscriptions.update((all) => [newSub, ...all]);
  showToast('success', 'সাবস্ক্রিপশন যুক্ত', `"${newSub.coachingName}"-এর সাবস্ক্রিপশন রেকর্ড যোগ করা হয়েছে।`);
}

export function updatePlatformSubscription(id: string, updates: Partial<PlatformSubscription>) {
  platformSubscriptions.update((all) => all.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  showToast('info', 'সাবস্ক্রিপশন আপডেট', 'সাবস্ক্রিপশনের তথ্য সংরক্ষিত হয়েছে।');
}

export function approveSubscription(id: string) {
  platformSubscriptions.update((all) =>
    all.map((s) => {
      if (s.id === id) {
        // Also update tenant status if institute exists
        coachingInstitutes.update((insts) =>
          insts.map((i) => (i.id === s.coachingId ? { ...i, status: 'active', planId: s.planId, planName: s.planName } : i))
        );
        showToast('success', 'সাবস্ক্রিপশন অনুমোদিত (Approved)', `"${s.coachingName}"-এর সাবস্ক্রিপশন গ্রহণ ও সক্রিয় করা হয়েছে।`);
        return { ...s, status: 'active', autoRenew: true };
      }
      return s;
    })
  );
}

export function rejectSubscription(id: string, reason: string = 'পেমেন্ট ভেরিফিকেশন ব্যর্থ') {
  platformSubscriptions.update((all) =>
    all.map((s) => {
      if (s.id === id) {
        showToast('error', 'সাবস্ক্রিপশন প্রত্যাখ্যান (Rejected)', `"${s.coachingName}"-এর অনুরোধ বাতিল করা হয়েছে।`);
        return { ...s, status: 'rejected', rejectionReason: reason, autoRenew: false };
      }
      return s;
    })
  );
}

export function suspendSubscription(id: string) {
  platformSubscriptions.update((all) =>
    all.map((s) => {
      if (s.id === id) {
        showToast('warning', 'সাবস্ক্রিপশন স্থগিত (Suspended)', `"${s.coachingName}"-এর অ্যাক্সেস স্থগিত করা হয়েছে।`);
        return { ...s, status: 'suspended', autoRenew: false };
      }
      return s;
    })
  );
}

export function activateSubscription(id: string) {
  platformSubscriptions.update((all) =>
    all.map((s) => {
      if (s.id === id) {
        showToast('success', 'সাবস্ক্রিপশন সক্রিয়', `"${s.coachingName}" পুনরায় চালু করা হয়েছে।`);
        return { ...s, status: 'active' };
      }
      return s;
    })
  );
}

export function extendSubscription(id: string, days: number = 30) {
  platformSubscriptions.update((all) =>
    all.map((s) => {
      if (s.id === id) {
        const current = new Date(s.nextRenewalDate || new Date());
        current.setDate(current.getDate() + days);
        const nextDate = current.toISOString().split('T')[0];
        showToast('info', 'মেয়াদ বৃদ্ধি', `মেয়াদ +${days} দিন বৃদ্ধি করে ${nextDate} করা হয়েছে।`);
        return { ...s, nextRenewalDate: nextDate, status: 'active' };
      }
      return s;
    })
  );
}

export function cancelPlatformSubscription(id: string) {
  platformSubscriptions.update((all) =>
    all.map((s) => (s.id === id ? { ...s, status: 'cancelled', autoRenew: false } : s))
  );
  showToast('warning', 'সাবস্ক্রিপশন বাতিল', 'সাবস্ক্রিপশনটি বাতিল চিহ্নিত করা হয়েছে।');
}

export function deletePlatformSubscription(id: string) {
  platformSubscriptions.update((all) => all.filter((s) => s.id !== id));
  showToast('warning', 'সাবস্ক্রিপশন অপসারিত', 'সাবস্ক্রিপশন রেকর্ড ডিলিট করা হয়েছে।');
}

// ==========================================
// SAAS PLATFORM USERS & ADMIN AUTH STORE
// ==========================================
export interface SaasAdminSession {
  id: string;
  name: string;
  email: string;
  role: 'super_admin';
  token: string;
  loginTime: string;
}

const defaultPlatformUsers: PlatformUser[] = [
  {
    id: 'usr-1',
    name: 'মোঃ আরমান খান (Super Admin)',
    email: 'admin@coachflow.app',
    phone: '+880 1700-000000',
    role: 'super_admin',
    status: 'active',
    password: 'Password123!',
    lastLogin: 'এইমাত্র (সক্রিয়)',
    createdAt: '2025-01-01',
  },
  {
    id: 'usr-2',
    name: 'সাব্বির আহমেদ (Tech Support Lead)',
    email: 'support@coachflow.app',
    phone: '+880 1711-223344',
    role: 'platform_support',
    status: 'active',
    password: 'Password123!',
    lastLogin: '১০ মিনিট আগে',
    createdAt: '2025-02-10',
  },
  {
    id: 'usr-3',
    name: 'ইঞ্জিনিয়ার মোস্তাফিজুর রহমান',
    email: 'mostafiz@apexcare.edu.bd',
    phone: '+880 1711-456789',
    role: 'institute_admin',
    instituteId: 'inst-1',
    instituteName: 'এপেক্স অ্যাকাডেমিক কেয়ার',
    status: 'active',
    password: 'Password123!',
    lastLogin: 'আজ দুপুর ২:১৫',
    createdAt: '2025-02-15',
  },
  {
    id: 'usr-4',
    name: 'প্রফেসর ড. রফিকুল ইসলাম',
    email: 'rafiqul@dhakascience.com',
    phone: '+880 1819-234567',
    role: 'institute_admin',
    instituteId: 'inst-2',
    instituteName: 'ঢাকা সায়েন্স একাডেমি',
    status: 'active',
    password: 'Password123!',
    lastLogin: 'গতকাল রাত ৯:৪০',
    createdAt: '2025-01-10',
  },
  {
    id: 'usr-5',
    name: 'ডাঃ কামরুল হাসান',
    email: 'kamrul@primemedical.edu.bd',
    phone: '+880 1912-345678',
    role: 'institute_admin',
    instituteId: 'inst-3',
    instituteName: 'প্রাইম মেডিকেল কোচিং',
    status: 'active',
    password: 'Password123!',
    lastLogin: '৩ দিন আগে',
    createdAt: '2026-06-18',
  },
];

function getSavedPlatformUsers(): PlatformUser[] {
  if (typeof window === 'undefined') return defaultPlatformUsers;
  try {
    const raw = localStorage.getItem('coachflow_platform_users');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (_) {}
  return defaultPlatformUsers;
}

export const platformUsers = writable<PlatformUser[]>(getSavedPlatformUsers());

if (typeof window !== 'undefined') {
  platformUsers.subscribe((users) => {
    try {
      localStorage.setItem('coachflow_platform_users', JSON.stringify(users));
    } catch (_) {}
  });
}

function getSavedSaasAdminSession(): SaasAdminSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('coachflow_saas_admin_auth');
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (_) {}
  return null;
}

export const saasAdminAuth = writable<SaasAdminSession | null>(getSavedSaasAdminSession());

export function loginSaasAdmin(user: { id: string; name: string; email: string }) {
  const session: SaasAdminSession = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: 'super_admin',
    token: `saas-token-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    loginTime: new Date().toISOString(),
  };
  saasAdminAuth.set(session);
  currentRole.set('super_admin');
  if (typeof window !== 'undefined') {
    localStorage.setItem('coachflow_saas_admin_auth', JSON.stringify(session));
  }
}

export function logoutSaasAdmin() {
  saasAdminAuth.set(null);
  currentRole.set('institute_admin');
  if (typeof window !== 'undefined') {
    localStorage.removeItem('coachflow_saas_admin_auth');
  }
  showToast('info', 'Logged Out', 'SaaS Super Admin session terminated.');
}

export function createSaasAdminAccount(name: string, email: string, password: string): { success: boolean; error?: string } {
  let existingUser: PlatformUser | undefined;
  platformUsers.subscribe((list) => {
    existingUser = list.find((u) => u.email.toLowerCase() === email.toLowerCase());
  })();

  if (existingUser) {
    return { success: false, error: 'An admin account with this email already exists.' };
  }

  const newAdmin: PlatformUser = {
    id: `saas-admin-${Date.now()}`,
    name,
    email,
    phone: '+880 1700-000000',
    role: 'super_admin',
    status: 'active',
    password,
    lastLogin: 'এইমাত্র (সক্রিয়)',
    createdAt: new Date().toISOString().split('T')[0],
  };

  platformUsers.update((all) => [newAdmin, ...all]);
  loginSaasAdmin(newAdmin);
  return { success: true };
}

export function addPlatformUser(userData: Omit<PlatformUser, 'id' | 'createdAt' | 'lastLogin'>) {
  const newUser: PlatformUser = {
    ...userData,
    id: `usr-${Date.now()}`,
    createdAt: new Date().toISOString().split('T')[0],
    lastLogin: 'কখনো লগইন করেননি',
  };
  platformUsers.update((all) => [newUser, ...all]);
  showToast('success', 'ব্যবহারকারী যুক্ত', `"${newUser.name}"-কে প্ল্যাটফর্মে যোগ করা হয়েছে।`);
}

export function updatePlatformUser(id: string, updates: Partial<PlatformUser>) {
  platformUsers.update((all) => all.map((u) => (u.id === id ? { ...u, ...updates } : u)));
  showToast('info', 'ইউজার আপডেট', 'ব্যবহারকারীর তথ্য সংরক্ষিত হয়েছে।');
}

export function togglePlatformUserStatus(id: string) {
  platformUsers.update((all) =>
    all.map((u) => {
      if (u.id === id) {
        const next = u.status === 'active' ? 'suspended' : 'active';
        showToast('warning', 'স্ট্যাটাস আপডেট', `ইউজার অ্যাকাউন্ট ${next} করা হয়েছে।`);
        return { ...u, status: next };
      }
      return u;
    })
  );
}

export function deletePlatformUser(id: string) {
  platformUsers.update((all) => all.filter((u) => u.id !== id));
  showToast('warning', 'ইউজার অপসারিত', 'ইউজারটি প্ল্যাটফর্ম থেকে সরানো হয়েছে।');
}

// ==========================================
// SAAS PLATFORM GLOBAL SETTINGS STORE
// ==========================================
export const platformSettings = writable<PlatformSettings>({
  // 1. General Settings
  platformName: 'CoachFlow SaaS',
  tagline: 'Premier Multi-Tenant Coaching & Academy Management Cloud OS',
  supportEmail: 'support@coachflow.app',
  supportPhone: '+880 1900-112233',
  websiteUrl: 'https://coaching-bd.netlify.app',
  trialDays: 14,
  defaultSmsRate: 0.35,
  maintenanceMode: false,
  globalAnnouncement: '🎉 CoachFlow v3.4 প্রকাশিত হয়েছে! নতুন ডুয়েল-সিম অ্যান্ড্রয়েড গেটওয়ে ও রেজাল্ট সিস্টেম লাইভ।',
  currency: 'BDT',
  currencySymbol: '৳',

  // 2. Branding & Cloudinary
  logoUrl: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=200&auto=format&fit=crop&q=80',
  faviconUrl: '/favicon.svg',
  darkLogoUrl: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=200&auto=format&fit=crop&q=80',
  cloudinaryCloudName: 'coachflow-media',
  cloudinaryUploadPreset: 'coachflow_saas_assets',
  cloudinaryApiKey: '9182371948214',

  // 3. SEO & Social Meta
  metaTitle: 'CoachFlow SaaS - Premier Coaching & Academy Management System',
  metaDescription: 'Complete multi-tenant Coaching and Tuition Management SaaS Platform in Bangladesh with batch scheduling, student & teacher portals, dual-engine SMS gateway, and fee automation.',
  metaKeywords: 'coaching management bangladesh, coaching software, academy erp, sms gateway, student attendance, tuition fees billing',
  ogImageUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200&auto=format&fit=crop&q=80',
  canonicalUrl: 'https://coaching-bd.netlify.app',
  googleSiteVerification: 'google-site-verification=coachflow_live_89127cba',
  robotsIndexing: true,

  // 4. Tracking & Pixel Setup
  facebookPixelId: '109823471829381',
  fbAccessToken: 'EAAQ98z1K...FACEBOOK_CONVERSIONS_API_TOKEN',
  conversionsApiEnabled: true,
  googleAnalyticsId: 'G-CF9823019',
  customHeadScripts: '<!-- Global site tag (gtag.js) - Google Analytics -->\n<script async src="https://www.googletagmanager.com/gtag/js?id=G-CF9823019"></script>',
  customBodyScripts: '<!-- Facebook Pixel Base Code -->\n<noscript><img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=109823471829381&ev=PageView&noscript=1"/></noscript>',

  // 5. Payment Gateways
  bkashConfig: {
    merchantNumber: '01711-456789 (মার্চেন্ট অ্যাকাউন্ট)',
    appKey: 'bkash_live_app_8921df0c',
    appSecret: 'bkash_secret_998271dfba2',
    username: 'coachflow_merchant',
    password: '••••••••••••••••',
    sandbox: false,
    active: true,
  },
  nagadConfig: {
    merchantNumber: '01822-987654 (মার্চেন্ট)',
    merchantId: 'NGD_MERCHANT_8819',
    publicKey: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...',
    privateKey: '••••••••••••••••••••••••',
    active: true,
  },
  stripeConfig: {
    publishableKey: 'pk_live_51Pq98124bCoachFlowGlobal',
    secretKey: 'sk_live_51Pq98124b••••••••••••••••••••••••',
    webhookSecret: 'whsec_9918274ba1283c',
    active: true,
  },
  bankConfig: {
    bankName: 'Dutch-Bangla Bank PLC',
    accountName: 'CoachFlow Technologies Ltd.',
    accountNumber: '126.120.0098214',
    branch: 'Farmgate Corporate Branch, Dhaka',
    routingNumber: '090271829',
    instructions: 'অনুগ্রহ করে ব্যাংকে ডিপোজিট বা ফান্ড ট্রান্সফার করার পর ট্রানজেকশন স্লিপের ছবি ও রেফারেন্স নম্বর আমাদের হটলাইনে পাঠান।',
    active: true,
  },
});

export function updatePlatformSettings(updates: Partial<PlatformSettings>) {
  platformSettings.update((curr) => ({ ...curr, ...updates }));
  showToast('success', 'প্ল্যাটফর্ম সেটিংস সংরক্ষিত', 'গ্লোবাল প্ল্যাটফর্ম কনফিগারেশন আপডেট হয়েছে।');
}

// ==========================================
// SAAS PLATFORM TRANSACTIONS STORE
// ==========================================
export const platformTransactions = writable<PlatformTransaction[]>([
  {
    id: 'trx-1001',
    coachingId: 'inst-1',
    coachingName: 'এপেক্স অ্যাকাডেমিক কেয়ার',
    type: 'subscription',
    itemTitle: 'প্রো অ্যাকাডেমি বার্ষিক লাইসেন্স (১ বছর)',
    amount: 34900,
    subtotal: 34900,
    vatAmount: 0,
    paymentMethod: 'bKash',
    trxId: 'BKH9A82J912',
    senderPhone: '01711-456789',
    receiptNumber: 'RCP-CF-2026-001',
    status: 'completed',
    date: '2026-02-15 11:30',
    notes: 'অটো রিনিউয়াল কনফার্মেশন সম্পন্ন।',
  },
  {
    id: 'trx-1002',
    coachingId: 'inst-2',
    coachingName: 'ঢাকা সায়েন্স একাডেমি',
    type: 'subscription',
    itemTitle: 'মাল্টি-ব্রাঞ্চ এলিট বার্ষিক সাবস্ক্রিপশন',
    amount: 79900,
    subtotal: 79900,
    vatAmount: 0,
    paymentMethod: 'Bank Transfer',
    trxId: 'EBL-TRX-098212',
    senderPhone: '01819-234567',
    receiptNumber: 'RCP-CF-2026-002',
    status: 'completed',
    date: '2026-01-10 16:45',
    notes: 'DBBL EFTN ব্যাংক ট্রান্সফার ভেরিফায়েড।',
  },
  {
    id: 'trx-1003',
    coachingId: 'inst-1',
    coachingName: 'এপেক্স অ্যাকাডেমিক কেয়ার',
    type: 'sms_pack',
    itemTitle: 'Mega Cloud SMS Pack (৫,০০০ SMS)',
    amount: 1500,
    subtotal: 1500,
    vatAmount: 0,
    paymentMethod: 'bKash',
    trxId: 'BKH4K881249',
    senderPhone: '01711-456789',
    receiptNumber: 'RCP-CF-2026-003',
    status: 'completed',
    date: '2026-08-20 14:10',
    notes: 'ক্লাউড SMS ক্রেডিট যোগ করা হয়েছে।',
  },
  {
    id: 'trx-1004',
    coachingId: 'inst-3',
    coachingName: 'প্রাইম মেডিকেল কোচিং',
    type: 'subscription',
    itemTitle: 'প্রো অ্যাকাডেমি মাসিক ফি (সেপ্টেম্বর ২০২৬)',
    amount: 3490,
    subtotal: 3490,
    vatAmount: 0,
    paymentMethod: 'bKash',
    trxId: 'BKH7L912384',
    senderPhone: '01912-345678',
    receiptNumber: 'RCP-CF-2026-004',
    status: 'completed',
    date: '2026-09-18 10:15',
    notes: 'bKash অনলাইন পেমেন্ট গেটওয়ে।',
  },
  {
    id: 'trx-1005',
    coachingId: 'inst-5',
    coachingName: 'ফিউচার স্কলার্স বগুড়া',
    type: 'subscription',
    itemTitle: 'স্টার্টার কোচিং মাসিক সাবস্ক্রিপশন',
    amount: 1490,
    subtotal: 1490,
    vatAmount: 0,
    paymentMethod: 'Nagad',
    trxId: 'NGD39821034',
    senderPhone: '01733-112233',
    receiptNumber: 'RCP-CF-2026-005',
    status: 'completed',
    date: '2026-08-12 18:22',
    notes: 'নগদ ডিরেক্ট মার্চেন্ট পেমেন্ট।',
  },
  {
    id: 'trx-1006',
    coachingId: 'inst-6',
    coachingName: 'সানরাইজ ক্যাডেট কেয়ার (সিলেট)',
    type: 'subscription',
    itemTitle: 'প্রো অ্যাকাডেমি মাসিক সাবস্ক্রিপশন (অনুরোধ)',
    amount: 3490,
    subtotal: 3490,
    vatAmount: 0,
    paymentMethod: 'bKash',
    trxId: 'BKH8X99201A',
    senderPhone: '01712-889900',
    receiptNumber: 'RCP-CF-2026-006',
    status: 'pending',
    date: '2026-09-22 17:40',
    notes: 'ম্যানুয়াল বিকাশ পেমেন্ট জমা দেওয়া হয়েছে। ভেরিফিকেশন অপেক্ষারত।',
  },
]);

export function verifyPlatformTransaction(id: string) {
  platformTransactions.update((all) =>
    all.map((t) => {
      if (t.id === id) {
        showToast('success', 'পেমেন্ট অনুমোদিত (Verified)', `ট্রানজেকশন ${t.trxId} যাচাই ও সম্পন্ন করা হয়েছে।`);
        return { ...t, status: 'completed' };
      }
      return t;
    })
  );
}

// ==========================================
// INSTITUTE SETTINGS STORE (BANGLADESH CONFIGURED)
// ==========================================
export const defaultInstituteSettings: InstituteSettings = {
  // 1. General & Brand
  name: 'এপেক্স অ্যাকাডেমিক কেয়ার (ফার্মগেট শাখা)',
  nameEnglish: 'Apex Academic Care (Farmgate Branch)',
  tagline: 'HSC বিজ্ঞান, বুয়েট ইঞ্জিনিয়ারিং ও মেডিকেল ভর্তি পরীক্ষার সেরা প্ল্যাটফর্ম',
  establishedYear: '২০১৮',
  regNumber: 'TRAD/DSCC/019283/2021',
  branchName: 'ফার্মগেট প্রধান ক্যাম্পাস',
  branchCode: 'FGT-01',
  logo: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=150&auto=format&fit=crop&q=80',
  icon: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=80&auto=format&fit=crop&q=80',

  // 2. Contact, Hotlines & Campus
  email: 'director@apexacademicbd.com',
  phone: '+880 1711-456789',
  hotline: '+880 9612-456789',
  whatsapp: '+880 1711-456789',
  alternatePhone: '+880 1819-123456',
  website: 'https://apexacademicbd.com',
  address: 'গ্রিন সুপার মার্কেট, ৩য় তলা, ফার্মগেট, ঢাকা-১২১৫',
  division: 'ঢাকা',
  district: 'ঢাকা',
  thana: 'তেজগাঁও',
  googleMapsUrl: 'https://maps.google.com/?q=Farmgate+Dhaka',

  // Social Media Links
  socialMedia: {
    facebook: 'https://facebook.com/apexacademiccare',
    youtube: 'https://youtube.com/@apexacademiccare',
    instagram: 'https://instagram.com/apexacademiccare',
    linkedin: 'https://linkedin.com/company/apexacademiccare',
    telegram: 'https://t.me/apexacademiccare',
    website: 'https://apexacademicbd.com',
  },

  // 3. Authorization, Seal & Signatures
  directorName: 'ইঞ্জি. মোঃ সাইফুল ইসলাম',
  directorDesignation: 'নির্বাহী পরিচালক ও প্রতিষ্ঠাতা',
  directorSignature: 'Md. Saiful Islam',
  academicCoordinator: 'ড. তানভীর আহমেদ (অ্যাকাডেমিক কো-অর্ডিনেটর)',
  officialSealText: 'APEX ACADEMIC CARE • SEAL OF EXCELLENCE • DHAKA-1215',

  // 4. Financial & Payment Accounts
  bkashMerchant: '01711-456789',
  nagadMerchant: '01819-123456',
  rocketNumber: '01711-456789-7',
  bankAccountName: 'Apex Academic Care BD Ltd.',
  bankName: 'Dutch-Bangla Bank PLC',
  bankBranch: 'Farmgate Branch, Dhaka',
  bankAccountNumber: '126.120.0049281',
  bankRouting: '090271829',
  receiptHeaderNote: 'সকল পেমেন্টের মানি রিসিট সংরক্ষণ করুন। কোচিং কর্তৃপক্ষের অনুমতি ব্যতীত ফি অফেরতযোগ্য।',
  receiptFooterNote: 'ধন্যবাদান্তে: এপেক্স অ্যাকাডেমিক কেয়ার হিসাব শাখা। জরুরি হেল্পলাইন: +880 1711-456789।',

  // 5. Academic & Operations
  currency: 'BDT',
  currencySymbol: '৳',
  academicYear: '২০২৬-২০২৭',
  timezone: 'Asia/Dhaka (GMT+6)',
  weeklyHolidays: 'শুক্রবার (Friday)',
  classDurationMinutes: 90,
  admissionFeeDefault: 2000,

  // 6. SMS & Automation
  defaultSmsGateway: 'android',
  smsSenderId: 'APEXCARE',
  coachingCenterId: 'aac-dhaka-01',
  autoSmsOnAdmission: true,
  autoSmsOnAttendance: true,
  autoSmsOnFeePayment: true,
  autoSmsOnExamResult: true,
  preferredSmsLanguage: 'bangla',

  // 7. ID Card & Prefixes
  idCardPrefix: 'AAC-',
  idCardValidity: 'ডিসেম্বর ২০২৬ পর্যন্ত',
  showBloodGroupOnId: true,
  showGuardianPhoneOnId: true,
  showBarcodeOnId: true,
};

function loadStoredSettings(): InstituteSettings {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('coachflow_institute_settings');
    if (saved) {
      try {
        return { ...defaultInstituteSettings, ...JSON.parse(saved) };
      } catch (e) {
        console.error('Failed to parse institute settings from localStorage', e);
      }
    }
  }
  return defaultInstituteSettings;
}

export const instituteSettings = writable<InstituteSettings>(loadStoredSettings());

let settingsSyncTimeout: any = null;
if (typeof window !== 'undefined') {
  instituteSettings.subscribe((val) => {
    try {
      localStorage.setItem('coachflow_institute_settings', JSON.stringify(val));
    } catch (e) {
      // ignore
    }

    // Debounce database sync
    clearTimeout(settingsSyncTimeout);
    settingsSyncTimeout = setTimeout(() => {
      syncInstituteSettingsToDb(val);
    }, 1500);
  });

  // Hydrate from Supabase if available
  loadInstituteSettingsFromDb().then((remoteSettings) => {
    if (remoteSettings && remoteSettings.name) {
      instituteSettings.update((curr) => ({ ...curr, ...remoteSettings }));
    }
  }).catch((e) => console.warn('Supabase settings initial load catch:', e));
}

export function updateInstituteSettings(partial: Partial<InstituteSettings>) {
  instituteSettings.update((curr) => {
    const updated = { ...curr, ...partial };
    syncInstituteSettingsToDb(updated);
    return updated;
  });
}

// ==========================================
// COURSES & UNITS STORE (NCTB & ADMISSION CURRICULUMS)
// ==========================================
export const initialCourses: Course[] = [
  {
    id: 'c-1',
    code: 'HSC-PHY-01',
    title: 'HSC উচ্চতর পদার্থবিজ্ঞান ১ম ও ২য় পত্র (NCTB)',
    category: 'এইচএসসি বিজ্ঞান (HSC Science)',
    description: 'বোর্ড পরীক্ষা ও ইঞ্জিনিয়ারিং ফাউন্ডেশনের পূর্ণাঙ্গ সিলেবাস, থিওরি ও গাণিতিক সমস্যা সমাধান।',
    durationWeeks: 24,
    feeAmount: 4500,
    unitsCount: 4,
    thumbnail: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=400&auto=format&fit=crop&q=80',
    status: 'published',
  },
  {
    id: 'c-2',
    code: 'HSC-MTH-02',
    title: 'HSC উচ্চতর গণিত ও ক্যালকুলাস স্পেশাল',
    category: 'উচ্চতর গণিত (Higher Math)',
    description: 'সরলরেখা, বৃত্ত, ত্রিকোণমিতি, অন্তরীকরণ ও যোগজীকরণের শর্টকাট টেকনিক ও বোর্ড প্রশ্ন বিশ্লেষণ।',
    durationWeeks: 20,
    feeAmount: 4800,
    unitsCount: 5,
    thumbnail: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400&auto=format&fit=crop&q=80',
    status: 'published',
  },
  {
    id: 'c-3',
    code: 'ENG-BUET-03',
    title: 'বুয়েট ও ইঞ্জিনিয়ারিং ভর্তি প্রস্তুতি ২০২৬',
    category: 'ইঞ্জিনিয়ারিং ভর্তি (BUET/CKRUET)',
    description: 'বুয়েট, রুয়েট, কুয়েট, চুয়েটের বিগত ২০ বছরের প্রশ্নব্যাংক সল্ভ ও কনসেপচুয়াল প্র্যাকটিস।',
    durationWeeks: 16,
    feeAmount: 8500,
    unitsCount: 4,
    thumbnail: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&auto=format&fit=crop&q=80',
    status: 'published',
  },
  {
    id: 'c-4',
    code: 'MED-BIO-04',
    title: 'মেডিকেল ভর্তি বায়োলজি ও রসায়ন এক্সক্লুসিভ কেয়ার',
    category: 'মেডিকেল ভর্তি (MBBS Preparation)',
    description: 'হাসান স্যার ও আজিবুর স্যারের বইয়ের লাইন-টু-লাইন দাগানো নোট, জলজি ও বোটানি মেমোরাইজিং ট্রিকস।',
    durationWeeks: 18,
    feeAmount: 7500,
    unitsCount: 4,
    thumbnail: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=400&auto=format&fit=crop&q=80',
    status: 'published',
  },
];
export const courses = createTenantStore<Course>('courses', initialCourses);

export const units = writable<Unit[]>([
  {
    id: 'u-1',
    courseId: 'c-1',
    unitNumber: 1,
    title: 'অধ্যায় ২ ও ৩: ভেক্টর এবং গতিবিদ্যা (Vectors & Kinematics)',
    description: 'ভেক্টর ডট ও ক্রস গুণন, নদী-নৌকা সমস্যা, প্রাস (Projectile motion) ও আপেক্ষিক বেগ।',
    topics: ['নদী ও স্রোতের বেগ', 'প্রাসের সর্বোচ্চ উচ্চতা ও পাল্লা', 'ত্রিমাত্রিক ভেক্টর বিশ্লেষণ', 'ঘূর্ণন গতি'],
    estimatedHours: 18,
    materialsCount: 6,
  },
  {
    id: 'u-2',
    courseId: 'c-1',
    unitNumber: 2,
    title: 'অধ্যায় ৪ ও ৫: নিউটনীয় বলবিদ্যা ও কাজ শক্তি ক্ষমতা',
    description: 'ভরবেগের সংরক্ষণ সূত্র, ঘর্ষণ বল, ব্যাংকিং কোণ, স্থিতিস্থাপক সংঘর্ষ ও ক্ষমতা রূপান্তর।',
    topics: ['রাস্তার ব্যাংকিং কোণ', 'জড়তার ভ্রামক ও চক্রগতির ব্যাসার্ধ', 'কাজের মাত্রা ও স্প্রিং বল', 'সংরক্ষণশীল বল'],
    estimatedHours: 22,
    materialsCount: 8,
  },
  {
    id: 'u-3',
    courseId: 'c-2',
    unitNumber: 1,
    title: 'অধ্যায় ৩ ও ৪: সরলরেখা ও বৃত্ত (Straight Lines & Circle)',
    description: 'ঢাল, দুই সরলরেখার মধ্যবর্তী কোণ, লম্ব দূরত্ব, স্পর্শকের সমীকরণ ও প্রতিসম বিন্দু।',
    topics: ['কার্তেসীয় ও পোলার স্থানাঙ্ক', 'ত্রিভুজের ক্ষেত্রফল ও অন্তর্বৃত্ত', 'ছেদবিন্দুগামী রেখা', 'বৃত্তের স্পর্শক সমীকরণ'],
    estimatedHours: 20,
    materialsCount: 7,
  },
  {
    id: 'u-4',
    courseId: 'c-2',
    unitNumber: 2,
    title: 'অধ্যায় ৯ ও ১০: অন্তরীকরণ ও যোগজীকরণ (Calculus)',
    description: 'লিমিট, এল-হসপিটাল নিয়ম, চেইন রুল, স্পর্শক ও অভিলম্ব, নির্দিষ্ট যোগজ ও ক্ষেত্রফল।',
    topics: ['ফাংশনের লিমিট ও অবিচ্ছিন্নতা', 'চেইন রুল ও অব্যক্ত ফাংশন', 'ইউ-ভি ইন্টিগ্রেশন', 'বক্ররেখা দ্বারা আবদ্ধ ক্ষেত্রফল'],
    estimatedHours: 26,
    materialsCount: 10,
  },
]);

// ==========================================
// TEACHERS STORE (BANGLADESHI FACULTY)
// ==========================================
export const initialTeachers: Teacher[] = [
  {
    id: 't-1',
    name: 'ইঞ্জি. মোঃ সাইফুল ইসলাম',
    email: 'saiful.buet@apexacademicbd.com',
    phone: '+880 1712-345678',
    designation: 'বিভাগীয় প্রধান, পদার্থবিজ্ঞান (বুয়েট CSE-১৪)',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    subjectSpecialization: 'উচ্চতর পদার্থবিজ্ঞান ও মেকানিক্স',
    assignedBatchIds: ['b-1', 'b-3'],
    salaryType: 'monthly',
    salaryAmount: 48000,
    joiningDate: '2023-01-15',
    status: 'active',
    education: 'বি.এস.সি ইঞ্জিনিয়ারিং (বুয়েট), এম.এস.সি (আইআইটি ফেলো)',
  },
  {
    id: 't-2',
    name: 'ডা. নুসরাত জাহান',
    email: 'dr.nusrat@apexacademicbd.com',
    phone: '+880 1819-456789',
    designation: 'সিনিয়র মেডিকেল ফ্যাকাল্টি (ডিএমসি K-৭২)',
    photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
    subjectSpecialization: 'মেডিকেল বায়োলজি ও হিউম্যান ফিজিওলজি',
    assignedBatchIds: ['b-2'],
    salaryType: 'monthly',
    salaryAmount: 45000,
    joiningDate: '2023-06-01',
    status: 'active',
    education: 'এমবিবিএস (ঢাকা মেডিকেল কলেজ), এফসিপিএস (পার্ট-১)',
  },
  {
    id: 't-3',
    name: 'প্রভাষক তানভীর আহমেদ',
    email: 'tanvir.du@apexacademicbd.com',
    phone: '+880 1913-567890',
    designation: 'সিনিয়র গণিত শিক্ষক (ঢাকা বিশ্ববিদ্যালয়)',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    subjectSpecialization: 'উচ্চতর গণিত ও কো-অর্ডিনেট জিওমেট্রি',
    assignedBatchIds: ['b-4'],
    salaryType: 'monthly',
    salaryAmount: 40000,
    joiningDate: '2024-02-10',
    status: 'active',
    education: 'বি.এস.সি ও এম.এস.সি (ফলিত গণিত, ঢাবি)',
  },
];
export const teachers = createTenantStore<Teacher>('teachers', initialTeachers);

// ==========================================
// BATCHES STORE (LOCAL COACHING BATCHES)
// ==========================================
export const initialBatches: Batch[] = [
  {
    id: 'b-1',
    code: 'B-HSC-AM',
    name: 'HSC \'26 ফিজিক্স আলফা (সকালের ব্যাচ - ফার্মগেট)',
    courseId: 'c-1',
    teacherId: 't-1',
    roomNumber: 'রুম ২০১ (২য় তলা)',
    scheduleDays: ['শনি', 'সোম', 'বুধ'],
    startTime: '০৮:০০ AM',
    endTime: '১০:০০ AM',
    maxCapacity: 40,
    enrolledCount: 36,
    status: 'running',
    startDate: '2026-02-01',
  },
  {
    id: 'b-2',
    code: 'B-MED-CARE',
    name: 'মেডিকেল প্রি-মেড এক্সক্লুসিভ ব্যাচ (ধানমন্ডি)',
    courseId: 'c-4',
    teacherId: 't-2',
    roomNumber: 'বায়োলজি ল্যাব ১০২',
    scheduleDays: ['রবি', 'মঙ্গল', 'বৃহঃ'],
    startTime: '১০:৩০ AM',
    endTime: '১২:৩০ PM',
    maxCapacity: 35,
    enrolledCount: 31,
    status: 'running',
    startDate: '2026-02-15',
  },
  {
    id: 'b-3',
    code: 'B-BUET-TG',
    name: 'BUET Target \'26 ইঞ্জিনিয়ারিং স্পেশাল',
    courseId: 'c-3',
    teacherId: 't-1',
    roomNumber: 'সেমিনার হল ৩০১',
    scheduleDays: ['শনি', 'রবি', 'বুধ'],
    startTime: '০৩:০০ PM',
    endTime: '০৫:০০ PM',
    maxCapacity: 30,
    enrolledCount: 28,
    status: 'running',
    startDate: '2026-03-01',
  },
  {
    id: 'b-4',
    code: 'B-MTH-EV',
    name: 'উচ্চতর গণিত চ্যাম্পিয়ন ব্যাচ (মিরপুর-১০)',
    courseId: 'c-2',
    teacherId: 't-3',
    roomNumber: 'হল ১০৪',
    scheduleDays: ['রবি', 'মঙ্গল', 'বৃহঃ'],
    startTime: '০৫:০০ PM',
    endTime: '০৭:০০ PM',
    maxCapacity: 45,
    enrolledCount: 38,
    status: 'running',
    startDate: '2026-02-10',
  },
];
export const batches = createTenantStore<Batch>('batches', initialBatches);

// ==========================================
// STUDENTS STORE (BANGLADESHI STUDENTS)
// ==========================================
export const initialStudents: Student[] = [
  {
    id: 's-1',
    rollNo: 'AAC-2026-001',
    name: 'ফারহান শাকিল (Farhan Shakil)',
    email: 'farhan.shakil@gmail.com',
    phone: '+880 1711-223344',
    guardianName: 'মোঃ শাকিল হোসেন',
    guardianPhone: '+880 1711-223345',
    photo: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
    batchIds: ['b-1', 'b-3'],
    courseIds: ['c-1', 'c-3'],
    bloodGroup: 'O+',
    status: 'active',
    enrollmentDate: '2026-01-20',
    feesDue: 0,
    address: 'বাসা ৩৪, রোড ৭/এ, ধানমন্ডি, ঢাকা',
    gender: 'male',
    dob: '2008-04-12',
  },
  {
    id: 's-2',
    rollNo: 'AAC-2026-002',
    name: 'নাফিসা আনজুম (Nafisa Anjum)',
    email: 'nafisa.anjum@gmail.com',
    phone: '+880 1819-334455',
    guardianName: 'মেজর (অবঃ) আনিসুর রহমান',
    guardianPhone: '+880 1819-334456',
    photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
    batchIds: ['b-1', 'b-2'],
    courseIds: ['c-1', 'c-4'],
    bloodGroup: 'A+',
    status: 'active',
    enrollmentDate: '2026-01-22',
    feesDue: 1500,
    address: '১২/বি ইন্দিরা রোড, ফার্মগেট, ঢাকা',
    gender: 'female',
    dob: '2008-09-28',
  },
  {
    id: 's-3',
    rollNo: 'AAC-2026-003',
    name: 'রিফাত আল-মাহমুদ (Rifat Al-Mahmud)',
    email: 'rifat.mahmud@gmail.com',
    phone: '+880 1912-445566',
    guardianName: 'মাহমুদুল হক বাবুল',
    guardianPhone: '+880 1912-445567',
    photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
    batchIds: ['b-4'],
    courseIds: ['c-2'],
    bloodGroup: 'B+',
    status: 'active',
    enrollmentDate: '2026-02-01',
    feesDue: 0,
    address: 'ব্লক-সি, রোড ৪, মিরপুর-১০, ঢাকা',
    gender: 'male',
    dob: '2007-11-15',
  },
  {
    id: 's-4',
    rollNo: 'AAC-2026-004',
    name: 'তাসনিম তাবাসসুম (Tasnim Tabassum)',
    email: 'tasnim.t@gmail.com',
    phone: '+880 1611-556677',
    guardianName: 'কবীর আহমেদ',
    guardianPhone: '+880 1611-556678',
    photo: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&auto=format&fit=crop&q=80',
    batchIds: ['b-2'],
    courseIds: ['c-4'],
    bloodGroup: 'AB+',
    status: 'active',
    enrollmentDate: '2026-02-05',
    feesDue: 2500,
    address: 'সেক্টর ৭, রোড ১১, উত্তরা, ঢাকা',
    gender: 'female',
    dob: '2008-01-09',
  },
  {
    id: 's-5',
    rollNo: 'AAC-2026-005',
    name: 'সিয়াম চৌধুরী (Siam Chowdhury)',
    email: 'siam.ctg@gmail.com',
    phone: '+880 1722-667788',
    guardianName: 'মিজানুর রহমান চৌধুরী',
    guardianPhone: '+880 1722-667789',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    batchIds: ['b-3'],
    courseIds: ['c-3'],
    bloodGroup: 'O-',
    status: 'active',
    enrollmentDate: '2026-02-12',
    feesDue: 0,
    address: 'চকবাজার সিরাজুদ্দৌলা রোড, চট্টগ্রাম',
    gender: 'male',
    dob: '2008-06-30',
  },
];
export const students = createTenantStore<Student>('students', initialStudents);

// ==========================================
// ATTENDANCE STORE
// ==========================================
export const initialAttendance: AttendanceRecord[] = [
  { id: 'att-1', batchId: 'b-1', date: '2026-09-22', studentId: 's-1', status: 'present' },
  { id: 'att-2', batchId: 'b-1', date: '2026-09-22', studentId: 's-2', status: 'absent', remarks: 'অভিভাবককে এসএমএস পাঠানো হয়েছে' },
  { id: 'att-3', batchId: 'b-1', date: '2026-09-22', studentId: 's-4', status: 'present' },
  { id: 'att-4', batchId: 'b-3', date: '2026-09-22', studentId: 's-1', status: 'present' },
  { id: 'att-5', batchId: 'b-4', date: '2026-09-22', studentId: 's-3', status: 'late', remarks: '১০ মিনিট ট্রাফিক জ্যামে দেরি' },
];
export const attendanceRecords = createTenantStore<AttendanceRecord>('attendance', initialAttendance);

// ==========================================
// FEE INVOICES STORE (IN BDT ৳ WITH BKASH/NAGAD)
// ==========================================
export const initialFeeInvoices: FeeInvoice[] = [
  {
    id: 'inv-101',
    invoiceNo: 'AAC-INV-2026-01',
    studentId: 's-1',
    studentName: 'ফারহান শাকিল',
    batchId: 'b-1',
    batchName: 'HSC \'26 ফিজিক্স আলফা',
    courseName: 'HSC উচ্চতর পদার্থবিজ্ঞান',
    amount: 4500,
    paidAmount: 4500,
    dueAmount: 0,
    status: 'paid',
    issueDate: '2026-09-01',
    dueDate: '2026-09-10',
    paymentMethod: 'bKash',
  },
  {
    id: 'inv-102',
    invoiceNo: 'AAC-INV-2026-02',
    studentId: 's-2',
    studentName: 'নাফিসা আনজুম',
    batchId: 'b-1',
    batchName: 'HSC \'26 ফিজিক্স আলফা',
    courseName: 'HSC উচ্চতর পদার্থবিজ্ঞান',
    amount: 4500,
    paidAmount: 3000,
    dueAmount: 1500,
    status: 'partial',
    issueDate: '2026-09-01',
    dueDate: '2026-09-10',
    paymentMethod: 'Nagad',
  },
  {
    id: 'inv-103',
    invoiceNo: 'AAC-INV-2026-03',
    studentId: 's-4',
    studentName: 'তাসনিম তাবাসসুম',
    batchId: 'b-2',
    batchName: 'মেডিকেল প্রি-মেড এক্সক্লুসিভ',
    courseName: 'মেডিকেল ভর্তি বায়োলজি',
    amount: 7500,
    paidAmount: 5000,
    dueAmount: 2500,
    status: 'partial',
    issueDate: '2026-09-05',
    dueDate: '2026-09-15',
    paymentMethod: 'Cash',
  },
  {
    id: 'inv-104',
    invoiceNo: 'AAC-INV-2026-04',
    studentId: 's-3',
    studentName: 'রিফাত আল-মাহমুদ',
    batchId: 'b-4',
    batchName: 'উচ্চতর গণিত চ্যাম্পিয়ন ব্যাচ',
    courseName: 'উচ্চতর গণিত স্পেশাল',
    amount: 4800,
    paidAmount: 4800,
    dueAmount: 0,
    status: 'paid',
    issueDate: '2026-09-02',
    dueDate: '2026-09-12',
    paymentMethod: 'bKash',
  },
];
export const feeInvoices = createTenantStore<FeeInvoice>('feeinvoices', initialFeeInvoices);

// ==========================================
// EXAMS & MARKS STORE (GPA 5.0 SYSTEM)
// ==========================================
export const initialExams: Exam[] = [
  {
    id: 'ex-1',
    title: 'ভেক্টর ও গতিবিদ্যা উইকলি মডেল টেস্ট ১',
    courseId: 'c-1',
    batchId: 'b-1',
    examDate: '2026-09-15',
    totalMarks: 100,
    passMarks: 40,
    examType: 'Monthly Test',
  },
  {
    id: 'ex-2',
    title: 'ক্যালকুলাস ও বৃত্ত মূল্যায়ন পরীক্ষা',
    courseId: 'c-2',
    batchId: 'b-4',
    examDate: '2026-09-18',
    totalMarks: 50,
    passMarks: 20,
    examType: 'Written',
  },
];
export const exams = createTenantStore<Exam>('exams', initialExams);

export const initialExamMarks: ExamMark[] = [
  {
    id: 'em-1',
    examId: 'ex-1',
    studentId: 's-1',
    studentName: 'ফারহান শাকিল',
    rollNo: 'AAC-2026-001',
    marksObtained: 94,
    grade: 'A+ (GPA 5.0)',
    remarks: 'চমৎকার পারফরম্যান্স, ম্যাথ স্টেপ নিখুঁত',
  },
  {
    id: 'em-2',
    examId: 'ex-1',
    studentId: 's-2',
    studentName: 'নাফিসা আনজুম',
    rollNo: 'AAC-2026-002',
    marksObtained: 82,
    grade: 'A+ (GPA 5.0)',
    remarks: 'ভালো দক্ষতা, প্রাসের সূত্র আরও প্র্যাকটিস করতে হবে',
  },
  {
    id: 'em-3',
    examId: 'ex-1',
    studentId: 's-4',
    studentName: 'তাসনিম তাবাসসুম',
    rollNo: 'AAC-2026-004',
    marksObtained: 76,
    grade: 'A (GPA 4.0)',
    remarks: 'ভালো হয়েছে, রিভিশন বাড়াতে হবে',
  },
];
export const examMarks = createTenantStore<ExamMark>('exammarks', initialExamMarks);

// ==========================================
// DUAL-ENGINE SMS STORE (BANGLADESH TELECOM CARRIERS)
// ==========================================
export const smsAccount = writable<SmsAccount>({
  cloudBalance: 3250,
  androidGateway: {
    connected: true,
    deviceName: 'Xiaomi Redmi Note 13 Pro (ফার্মগেট গেটওয়ে নোড #১)',
    batteryLevel: 94,
    sim1Carrier: 'Grameenphone (GP 5,000 SMS প্যাক - ৳0.00)',
    sim2Carrier: 'Banglalink (BL আনলিমিটেড SMS বান্ডেল)',
    sim1DailySent: 284,
    sim1DailyLimit: 1500,
    lastSyncTime: 'এইমাত্র (৪ সেকেন্ড আগে সিঙ্ক)',
    apiKey: 'gw_apk_live_gp_9f82d02c81e9bca23',
    webhookUrl: 'https://api.coachflow.app/v1/sms/webhook/bangladesh_node1',
    signalStrength: 98,
  },
});

export const initialSmsTemplates: SmsTemplate[] = [
  {
    id: 'tpl-1',
    title: 'দৈনিক ক্লাসে অনুপস্থিতি সতর্কতা',
    category: 'attendance',
    eventType: 'attendance_absent',
    contentBangla: 'সম্মানিত অভিভাবক, আপনার সন্তান {student_name} আজ {batch_name} ক্লাসে অনুপস্থিত ছিল। বিস্তারিত জানতে যোগাযোগ করুন: {institute_phone}। - {institute_name}',
    contentEnglish: 'Dear Guardian, your ward {student_name} was marked ABSENT today in {batch_name}. Please contact academy desk at {institute_phone}. - {institute_name}',
    variables: ['{guardian_name}', '{student_name}', '{batch_name}', '{institute_name}', '{institute_phone}'],
    activeLanguage: 'bangla',
    content: 'সম্মানিত অভিভাবক, আপনার সন্তান {student_name} আজ {batch_name} ক্লাসে অনুপস্থিত ছিল। - {institute_name}',
  },
  {
    id: 'tpl-2',
    title: 'টিউশন ফি বকেয়া তাগাদা ও পেমেন্ট রিমাইন্ডার',
    category: 'fees',
    eventType: 'fee_due_reminder',
    contentBangla: 'সম্মানিত অভিভাবক, {student_name}-এর {course_name} কোর্সের মাসিক বকেয়া ফি ৳{due_amount} পরিশোধের শেষ সময় {due_date}। বিকাশ/নগদ মার্চেন্ট: 01711456789। - {institute_name}',
    contentEnglish: 'Dear Guardian, tuition fee of BDT {due_amount} for {student_name} ({course_name}) is due by {due_date}. Pay via bKash/Nagad merchant: 01711456789. - {institute_name}',
    variables: ['{guardian_name}', '{student_name}', '{due_amount}', '{course_name}', '{due_date}', '{institute_name}'],
    activeLanguage: 'bangla',
    content: 'সম্মানিত অভিভাবক, {student_name}-এর মাসিক বকেয়া ফি ৳{due_amount} পরিশোধের শেষ সময় {due_date}। - {institute_name}',
  },
  {
    id: 'tpl-3',
    title: 'ফি প্রাপ্তি ও ডিজিটাল মানি রিসিট',
    category: 'fees',
    eventType: 'fee_received',
    contentBangla: 'ফি প্রাপ্তি: {student_name}-এর ৳{paid_amount} ফি সফলভাবে গৃহীত হয়েছে ({payment_method})। রসিদ #{receipt_no}। বর্তমান বকেয়া: ৳{due_amount}। ধন্যবাদ - {institute_name}',
    contentEnglish: 'Payment Received: BDT {paid_amount} received for {student_name} via {payment_method}. Receipt #{receipt_no}. Remaining due: BDT {due_amount}. Thank you - {institute_name}',
    variables: ['{paid_amount}', '{student_name}', '{payment_method}', '{receipt_no}', '{due_amount}', '{institute_name}'],
    activeLanguage: 'bangla',
    content: 'ফি প্রাপ্তি: {student_name}-এর ৳{paid_amount} ফি গৃহীত হয়েছে। রসিদ #{receipt_no}। - {institute_name}',
  },
  {
    id: 'tpl-4',
    title: 'মডেল টেস্ট মূল্যায়ন ফলাফল ও গ্রেডশিট',
    category: 'exams',
    eventType: 'exam_result',
    contentBangla: 'সম্মানিত অভিভাবক, {student_name} {exam_title} পরীক্ষায় {total_marks}-এর মধ্যে {marks_obtained} নম্বর (গ্রেড: {grade}) অর্জন করেছে। বিস্তারিত ড্যাশবোর্ডে দেখুন। - {institute_name}',
    contentEnglish: 'Dear Guardian, {student_name} scored {marks_obtained}/{total_marks} (Grade: {grade}) in {exam_title}. Detailed scorecard available on portal. - {institute_name}',
    variables: ['{student_name}', '{marks_obtained}', '{total_marks}', '{grade}', '{exam_title}', '{institute_name}'],
    activeLanguage: 'bangla',
    content: '{student_name} {exam_title} পরীক্ষায় {total_marks}-এ {marks_obtained} নম্বর (গ্রেড: {grade}) পেয়েছে। - {institute_name}',
  },
  {
    id: 'tpl-5',
    title: 'আসন্ন পরীক্ষার সূচি ও সিলেবাস নোটিশ',
    category: 'exams',
    eventType: 'exam_schedule',
    contentBangla: 'জরুরি বিজ্ঞপ্তি: আগামী {exam_date} তারিখে {batch_name}-এর \'{exam_title}\' অনুষ্ঠিত হবে (পূর্ণমান: {total_marks})। সকল শিক্ষার্থীর উপস্থিতি বাধ্যতামূলক। - {institute_name}',
    contentEnglish: 'Academic Notice: \'{exam_title}\' for {batch_name} is scheduled on {exam_date} (Total Marks: {total_marks}). Student attendance is mandatory. - {institute_name}',
    variables: ['{batch_name}', '{exam_title}', '{exam_date}', '{total_marks}', '{institute_name}'],
    activeLanguage: 'bangla',
    content: 'বিজ্ঞপ্তি: আগামী {exam_date} তারিখে \'{exam_title}\' অনুষ্ঠিত হবে। - {institute_name}',
  },
  {
    id: 'tpl-6',
    title: 'ক্লাস সময়সূচি ও রুম পরিবর্তন বিজ্ঞপ্তি',
    category: 'batches',
    eventType: 'batch_notice',
    contentBangla: 'বিজ্ঞপ্তি: সম্মানিত অভিভাবক, {batch_name}-এর আগামী ক্লাসের সময় সকাল {start_time}-এ রুম #{room_no}-এ অনুষ্ঠিত হবে। সময়মতো ক্লাসে উপস্থিত থাকার অনুরোধ করা হলো। - {institute_name}',
    contentEnglish: 'Notice: Upcoming session for {batch_name} will be held at {start_time} in Room #{room_no}. Please ensure timely attendance. - {institute_name}',
    variables: ['{batch_name}', '{start_time}', '{room_no}', '{institute_name}'],
    activeLanguage: 'bangla',
    content: 'বিজ্ঞপ্তি: {batch_name}-এর ক্লাস সময় সকাল {start_time}-এ রুম #{room_no}-এ অনুষ্ঠিত হবে। - {institute_name}',
  },
  {
    id: 'tpl-7',
    title: 'শিক্ষক সমন্বয় সভা ও নোটিশ',
    category: 'teachers',
    eventType: 'teacher_notice',
    contentBangla: 'সম্মানিত শিক্ষক {teacher_name}, আগামী {meeting_date} তারিখে একাডেমি মিলনায়তনে শিক্ষক সমন্বয় সভা অনুষ্ঠিত হবে। আপনার উপস্থিতি বিশেষভাবে কাম্য। - {institute_name}',
    contentEnglish: 'Dear Faculty Member {teacher_name}, academic coordination meeting is scheduled on {meeting_date} in the faculty hall. Your presence is requested. - {institute_name}',
    variables: ['{teacher_name}', '{meeting_date}', '{institute_name}'],
    activeLanguage: 'bangla',
    content: 'সম্মানিত শিক্ষক {teacher_name}, আগামী {meeting_date} তারিখে শিক্ষক সমন্বয় সভা অনুষ্ঠিত হবে। - {institute_name}',
  },
  {
    id: 'tpl-8',
    title: 'সরকারি ছুটি ও অ্যাকাডেমিক বন্ধের ঘোষণা',
    category: 'general',
    eventType: 'general_notice',
    contentBangla: 'জরুরি নোটিশ: {holiday_occasion} উপলক্ষে আগামী {holiday_date} তারিখে একাডেমির সকল ব্যাচের কার্যক্রম বন্ধ থাকবে। পরবর্তী ক্লাসের সূচি অনলাইনে দেখুন। - {institute_name}',
    contentEnglish: 'Holiday Notice: On the occasion of {holiday_occasion}, all academic classes will remain suspended on {holiday_date}. Regular schedule resumes thereafter. - {institute_name}',
    variables: ['{holiday_occasion}', '{holiday_date}', '{institute_name}'],
    activeLanguage: 'bangla',
    content: 'বিজ্ঞপ্তি: {holiday_occasion} উপলক্ষে আগামী {holiday_date} তারিখে সকল ক্লাস বন্ধ থাকবে। - {institute_name}',
  },
];

export const smsTemplates = createTenantStore<SmsTemplate>('smstemplates', initialSmsTemplates, true);

export const initialSmsLogs: SmsLog[] = [
  {
    id: 'log-1',
    recipientName: 'মেজর (অবঃ) আনিসুর রহমান (নাফিসার অভিভাবক)',
    recipientPhone: '+880 1819-334456',
    message: 'সম্মানিত অভিভাবক, আপনার সন্তান নাফিসা আনজুম আজ HSC \'26 ফিজিক্স আলফা ক্লাসে অনুপস্থিত ছিল। যোগাযোগ: +880 1711-456789।',
    gateway: 'android_sim1',
    status: 'delivered',
    timestamp: 'আজ সকাল ০৮:১৫ AM',
    cost: 0.0, // Android GP SIM pack = ৳0.00 extra cost!
  },
  {
    id: 'log-2',
    recipientName: 'কবীর আহমেদ',
    recipientPhone: '+880 1611-556678',
    message: 'সম্মানিত অভিভাবক, তাসনিম তাবাসসুম-এর মাসিক বকেয়া ফি ৳2,500 পরিশোধের অনুরোধ করা হচ্ছে। বিকাশ করুন: 01711-456789।',
    gateway: 'android_sim1',
    status: 'delivered',
    timestamp: 'গতকাল বিকাল ০৪:৩০ PM',
    cost: 0.0,
  },
  {
    id: 'log-3',
    recipientName: 'মোঃ শাকিল হোসেন',
    recipientPhone: '+880 1711-223345',
    message: 'ফারহান শাকিল-এর ৳4,500 ফি সফলভাবে গৃহীত হয়েছে (বিকাশ TrxID: 9X82B71Q)। রসিদ নং #AAC-INV-2026-01। ধন্যবাদ - এপেক্স অ্যাকাডেমিক কেয়ার।',
    gateway: 'cloud',
    status: 'delivered',
    timestamp: '২০ সেপ্টেম্বর সকাল ১১:০৫ AM',
    cost: 0.35,
  },
];
export const smsLogs = createTenantStore<SmsLog>('smslogs', initialSmsLogs, false);

// 10-Second Polling Outbox Queue store
export const smsQueue = writable<SmsQueueItem[]>([
  {
    id: 'sms-demo-1',
    coachingCenterId: 'aac-dhaka-01',
    recipientPhone: '+8801711456789',
    recipientName: 'ফারহান শাকিল',
    message: 'সম্মানিত অভিভাবক, ফারহান শাকিল আজ ফিজিক্স ক্লাসে উপস্থিত হয়েছে। - এপেক্স কেয়ার',
    status: 'sent',
    simSlot: 1,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    sentAt: new Date(Date.now() - 3590000).toISOString(),
  },
]);

// ==========================================
// STORE ACTIONS & HELPER METHODS
// ==========================================

// Add Student
export function addStudent(studentData: Omit<Student, 'id' | 'rollNo'>) {
  let createdStudent: Student | undefined;
  students.update((all) => {
    const nextNum = all.length + 1;
    const rollNo = `AAC-2026-${String(nextNum).padStart(3, '0')}`;
    const newStudent: Student = {
      ...studentData,
      coachingId: studentData.coachingId || getActiveCoachingId(),
      id: `s-${Date.now()}`,
      rollNo,
    };
    createdStudent = newStudent;
    return [newStudent, ...all];
  });
  if (createdStudent) {
    syncStudentToDb(createdStudent);
  }
  showToast('success', 'শিক্ষার্থী ভর্তি সম্পন্ন', 'শিক্ষার্থীর তথ্য সফলভাবে সংরক্ষিত ও ডাটাবেজে যুক্ত হয়েছে।');
}

// Update Student
export function updateStudent(id: string, updates: Partial<Student>) {
  students.update((all) => all.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  showToast('info', 'তথ্য হালনাগাদ', 'শিক্ষার্থীর প্রোফাইল আপডেট করা হয়েছে।');
}

// Delete Student
export function deleteStudent(id: string) {
  students.update((all) => all.filter((s) => s.id !== id));
  showToast('warning', 'শিক্ষার্থী অপসারিত', 'শিক্ষার্থীর রেকর্ড আর্কাইভ করা হয়েছে।');
}

// Add Batch
export function addBatch(batchData: Omit<Batch, 'id' | 'enrolledCount'>) {
  const newBatch: Batch = {
    ...batchData,
    coachingId: batchData.coachingId || getActiveCoachingId(),
    id: `b-${Date.now()}`,
    enrolledCount: 0,
  };
  batches.update((all) => [newBatch, ...all]);
  syncBatchToDb(newBatch);
  showToast('success', 'নতুন ব্যাচ চালু হয়েছে', 'অ্যাকাডেমিক ব্যাচ সফলভাবে খোলা হয়েছে।');
}

// Add Teacher
export function addTeacher(teacherData: Omit<Teacher, 'id'>) {
  teachers.update((all) => [
    {
      ...teacherData,
      coachingId: teacherData.coachingId || getActiveCoachingId(),
      id: `t-${Date.now()}`,
    },
    ...all,
  ]);
  showToast('success', 'শিক্ষক যুক্ত হয়েছেন', 'নতুন শিক্ষকের প্রোফাইল ও বেতন স্কেল সংরক্ষিত হয়েছে।');
}

// Update Teacher
export function updateTeacher(id: string, updates: Partial<Teacher>) {
  teachers.update((all) => all.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  showToast('info', 'শিক্ষকের তথ্য হালনাগাদ', 'শিক্ষকের প্রোফাইল সফলভাবে আপডেট হয়েছে।');
}

// Delete Teacher
export function deleteTeacher(id: string) {
  teachers.update((all) => all.filter((t) => t.id !== id));
  showToast('warning', 'শিক্ষক অপসারিত', 'শিক্ষকের রেকর্ড সিস্টেম থেকে সরানো হয়েছে।');
}

// Update Batch
export function updateBatch(id: string, updates: Partial<Batch>) {
  batches.update((all) => all.map((b) => (b.id === id ? { ...b, ...updates } : b)));
  showToast('info', 'ব্যাচ হালনাগাদ', 'ব্যাচের তথ্য সফলভাবে আপডেট হয়েছে।');
}

// Delete Batch
export function deleteBatch(id: string) {
  batches.update((all) => all.filter((b) => b.id !== id));
  showToast('warning', 'ব্যাচ অপসারিত', 'ব্যাচটি সিস্টেম থেকে সরানো হয়েছে।');
}

// Calculate Bangla academic grade (GPA 5.0 scale)
export function calculateBanglaGrade(marksObtained: number, totalMarks: number, passMarks: number = 33): {
  grade: string;
  gpa: number;
  percentage: number;
  isPassed: boolean;
} {
  if (totalMarks <= 0) {
    return { grade: 'F (GPA 0.0)', gpa: 0.0, percentage: 0, isPassed: false };
  }
  const pct = Math.round((marksObtained / totalMarks) * 100);
  const isPassed = marksObtained >= passMarks;

  if (!isPassed || pct < 33) {
    return { grade: 'F (GPA 0.0)', gpa: 0.0, percentage: pct, isPassed: false };
  } else if (pct >= 80) {
    return { grade: 'A+ (GPA 5.0)', gpa: 5.0, percentage: pct, isPassed: true };
  } else if (pct >= 70) {
    return { grade: 'A (GPA 4.0)', gpa: 4.0, percentage: pct, isPassed: true };
  } else if (pct >= 60) {
    return { grade: 'A- (GPA 3.5)', gpa: 3.5, percentage: pct, isPassed: true };
  } else if (pct >= 50) {
    return { grade: 'B (GPA 3.0)', gpa: 3.0, percentage: pct, isPassed: true };
  } else if (pct >= 40) {
    return { grade: 'C (GPA 2.0)', gpa: 2.0, percentage: pct, isPassed: true };
  } else {
    return { grade: 'D (GPA 1.0)', gpa: 1.0, percentage: pct, isPassed: true };
  }
}

// Add Exam
export function addExam(examData: Omit<Exam, 'id'>, autoPopulateStudents: boolean = true): string {
  const newId = `ex-${Date.now()}`;
  const newExam: Exam = {
    ...examData,
    coachingId: examData.coachingId || getActiveCoachingId(),
    id: newId,
  };

  exams.update((all) => [newExam, ...all]);

  if (autoPopulateStudents && examData.batchId) {
    let studentList: Student[] = [];
    students.subscribe((list) => {
      studentList = list.filter((s) => s.batchIds && s.batchIds.includes(examData.batchId));
    })();

    if (studentList.length > 0) {
      const initialMarks: ExamMark[] = studentList.map((stu) => {
        const gradeInfo = calculateBanglaGrade(0, newExam.totalMarks, newExam.passMarks);
        return {
          id: `em-${Date.now()}-${stu.id}`,
          examId: newId,
          studentId: stu.id,
          studentName: stu.name,
          rollNo: stu.rollNo,
          marksObtained: 0,
          grade: gradeInfo.grade,
          remarks: 'উপস্থিত',
        };
      });
      examMarks.update((all) => [...all, ...initialMarks]);
    }
  }

  showToast('success', 'নতুন পরীক্ষা তৈরি হয়েছে', `"${newExam.title}" সফলভাবে তৈরি ও সংরক্ষিত হয়েছে।`);
  return newId;
}

// Update Exam
export function updateExam(id: string, updates: Partial<Exam>) {
  exams.update((all) =>
    all.map((ex) => {
      if (ex.id === id) {
        const updated = { ...ex, ...updates };
        if (updates.totalMarks !== undefined || updates.passMarks !== undefined) {
          examMarks.update((marks) =>
            marks.map((m) => {
              if (m.examId === id) {
                const gradeInfo = calculateBanglaGrade(m.marksObtained, updated.totalMarks, updated.passMarks);
                return { ...m, grade: gradeInfo.grade };
              }
              return m;
            })
          );
        }
        return updated;
      }
      return ex;
    })
  );
  showToast('info', 'পরীক্ষার তথ্য হালনাগাদ', 'পরীক্ষার সময়সূচি ও তথ্য সফলভাবে আপডেট হয়েছে।');
}

// Delete Exam
export function deleteExam(id: string) {
  exams.update((all) => all.filter((e) => e.id !== id));
  examMarks.update((all) => all.filter((m) => m.examId !== id));
  showToast('warning', 'পরীক্ষা অপসারিত', 'পরীক্ষা ও এর সকল ফলাফল রেকর্ড মুছে ফেলা হয়েছে।');
}

// Bulk Save Exam Marks
export function saveBulkExamMarks(
  examId: string,
  records: Array<{ studentId: string; studentName: string; rollNo: string; marksObtained: number; remarks: string }>
) {
  let examObj: Exam | undefined;
  exams.subscribe((list) => {
    examObj = list.find((e) => e.id === examId);
  })();

  const totalMarks = examObj?.totalMarks || 100;
  const passMarks = examObj?.passMarks || 40;

  examMarks.update((existing) => {
    const others = existing.filter((m) => m.examId !== examId);
    const updatedForExam: ExamMark[] = records.map((rec) => {
      const prev = existing.find((m) => m.examId === examId && m.studentId === rec.studentId);
      const gradeInfo = calculateBanglaGrade(rec.marksObtained, totalMarks, passMarks);
      return {
        id: prev?.id || `em-${Date.now()}-${rec.studentId}`,
        examId,
        studentId: rec.studentId,
        studentName: rec.studentName,
        rollNo: rec.rollNo,
        marksObtained: rec.marksObtained,
        grade: gradeInfo.grade,
        remarks: rec.remarks || 'মূল্যায়ন সম্পন্ন',
      };
    });

    return [...others, ...updatedForExam];
  });

  showToast('success', 'ফলাফল সংরক্ষিত', `${records.length} জন শিক্ষার্থীর পরীক্ষার ফলাফল সফলভাবে সংরক্ষণ করা হয়েছে।`);
}

// Add or Update Single Exam Mark
export function addOrUpdateExamMark(
  examId: string,
  data: { id?: string; studentId: string; studentName: string; rollNo: string; marksObtained: number; remarks: string }
) {
  let examObj: Exam | undefined;
  exams.subscribe((list) => {
    examObj = list.find((e) => e.id === examId);
  })();

  const totalMarks = examObj?.totalMarks || 100;
  const passMarks = examObj?.passMarks || 40;
  const gradeInfo = calculateBanglaGrade(data.marksObtained, totalMarks, passMarks);

  examMarks.update((existing) => {
    if (data.id) {
      return existing.map((m) =>
        m.id === data.id
          ? {
              ...m,
              marksObtained: data.marksObtained,
              grade: gradeInfo.grade,
              remarks: data.remarks,
            }
          : m
      );
    } else {
      const foundIndex = existing.findIndex((m) => m.examId === examId && m.studentId === data.studentId);
      if (foundIndex >= 0) {
        const copy = [...existing];
        copy[foundIndex] = {
          ...copy[foundIndex],
          marksObtained: data.marksObtained,
          grade: gradeInfo.grade,
          remarks: data.remarks,
        };
        return copy;
      }
      return [
        ...existing,
        {
          id: `em-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          examId,
          studentId: data.studentId,
          studentName: data.studentName,
          rollNo: data.rollNo,
          marksObtained: data.marksObtained,
          grade: gradeInfo.grade,
          remarks: data.remarks || '',
        },
      ];
    }
  });

  showToast('success', 'ফলাফল হালনাগাদ', `${data.studentName}-এর নম্বর সফলভাবে সংরক্ষিত হয়েছে।`);
}

// Delete Single Exam Mark
export function deleteExamMark(id: string) {
  examMarks.update((all) => all.filter((m) => m.id !== id));
  showToast('warning', 'মার্ক অপসারিত', 'শিক্ষার্থীর ফলাফল রেকর্ড তালিকা থেকে সরানো হয়েছে।');
}

// Mark Attendance & auto-alert option
export function markBatchAttendance(
  batchId: string,
  records: { studentId: string; status: 'present' | 'absent' | 'late' }[],
  sendAbsentSms: boolean = false
) {
  const today = new Date().toISOString().split('T')[0];
  attendanceRecords.update((existing) => {
    const filtered = existing.filter((r) => !(r.batchId === batchId && r.date === today));
    const newRecs: AttendanceRecord[] = records.map((r) => ({
      id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      coachingId: getActiveCoachingId(),
      batchId,
      date: today,
      studentId: r.studentId,
      status: r.status,
    }));
    newRecs.forEach((rec) => syncAttendanceToDb(rec));
    return [...filtered, ...newRecs];
  });

  if (sendAbsentSms) {
    const absents = records.filter((r) => r.status === 'absent');
    if (absents.length > 0) {
      absents.forEach((item) => {
        let studentObj: Student | undefined;
        students.subscribe((list) => {
          studentObj = list.find((s) => s.id === item.studentId);
        })();
        if (studentObj) {
          sendSms(
            studentObj.guardianName,
            studentObj.guardianPhone,
            `সম্মানিত অভিভাবক, আপনার সন্তান ${studentObj.name} আজ ক্লাসে অনুপস্থিত ছিল। এপেক্স অ্যাকাডেমিক কেয়ার: +880 1711-456789।`,
            'android_sim1'
          );
        }
      });
      showToast('info', 'অনুপস্থিত SMS প্রেরিত', `${absents.length} জন অভিভাবককে গ্রামীণফোন সিম গেটওয়ে দিয়ে সতর্কবার্তা পাঠানো হয়েছে।`);
    }
  }

  showToast('success', 'হাজিরা সংরক্ষিত', 'আজকের ক্লাসের ডিজিটাল হাজিরা ডাটাবেজে সংরক্ষণ করা হয়েছে।');
}

// Collect Payment & Update Invoices
export function collectPayment(
  invoiceId: string,
  amount: number,
  method: FeeInvoice['paymentMethod']
) {
  let updatedInv: FeeInvoice | undefined;
  feeInvoices.update((all) =>
    all.map((inv) => {
      if (inv.id === invoiceId) {
        const newPaid = inv.paidAmount + amount;
        const newDue = Math.max(0, inv.amount - newPaid);
        const status = newDue === 0 ? 'paid' : 'partial';
        updatedInv = { ...inv, paidAmount: newPaid, dueAmount: newDue, status, paymentMethod: method };
        return updatedInv;
      }
      return inv;
    })
  );

  if (updatedInv) {
    syncInvoiceToDb(updatedInv);

    students.update((all) =>
      all.map((s) => {
        if (s.id === updatedInv?.studentId) {
          const newFeeDue = Math.max(0, s.feesDue - amount);
          return { ...s, feesDue: newFeeDue };
        }
        return s;
      })
    );

    sendSms(
      updatedInv.studentName,
      '+880 1711-223345',
      `ফি প্রাপ্তি: ${updatedInv.studentName}-এর ৳${amount} ফি গৃহীত হয়েছে (${method})। রসিদ #${updatedInv.invoiceNo}। বকেয়া: ৳${updatedInv.dueAmount}। ধন্যবাদ - এপেক্স কেয়ার।`,
      'android_sim1'
    );

    showToast('success', 'ফি আদায় সম্পন্ন', `৳${amount} ফি সফলভাবে ${method}-এ গৃহীত ও রসিদ তৈরি হয়েছে।`);
  }
}

// Send Single SMS
export function sendSms(
  recipientName: string,
  recipientPhone: string,
  message: string,
  gateway: SmsLog['gateway'] = 'android_sim1'
) {
  const normalizedPhone = normalizePhoneNumber(recipientPhone) || recipientPhone.trim();

  const newLog: SmsLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    coachingId: getActiveCoachingId(),
    recipientName,
    recipientPhone: normalizedPhone,
    message,
    gateway,
    status: 'delivered',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' আজ',
    cost: gateway === 'cloud' ? 0.35 : 0.0, // 35 poisha cloud or 0.0 tk on own GP sim!
  };

  smsLogs.update((logs) => [newLog, ...logs]);
  syncSmsLogToDb(newLog);

  // 10-Second Outbox Queue for Android Gateway Polling
  if (gateway === 'android_sim1') {
    let coachingId = 'aac-dhaka-01';
    const unsub = instituteSettings.subscribe((s) => {
      if (s?.coachingCenterId) coachingId = s.coachingCenterId;
    });
    unsub();

    enqueueSmsToQueue(coachingId, normalizedPhone, recipientName, message).then((res) => {
      if (res && res.item) {
        smsQueue.update((q) => [res.item, ...q.filter((x) => x.id !== res.item.id)]);
      }
    });
  }


  if (gateway === 'cloud') {
    smsAccount.update((acc) => ({ ...acc, cloudBalance: Math.max(0, acc.cloudBalance - 1) }));
  } else {
    smsAccount.update((acc) => ({
      ...acc,
      androidGateway: {
        ...acc.androidGateway,
        sim1DailySent: acc.androidGateway.sim1DailySent + 1,
        lastSyncTime: 'এইমাত্র',
      },
    }));
  }
}

// Cancel a pending SMS from Outbox Queue
export async function cancelSms(smsId: string) {
  let coachingId = 'aac-dhaka-01';
  const unsub = instituteSettings.subscribe((s) => {
    if (s?.coachingCenterId) coachingId = s.coachingCenterId;
  });
  unsub();

  smsQueue.update((q) =>
    q.map((item) =>
      item.id === smsId
        ? { ...item, status: 'cancelled' as const, errorMessage: 'ব্যবহারকারী কর্তৃক বাতিলকৃত' }
        : item
    )
  );

  await cancelSmsInQueue(smsId, coachingId);
  showToast('info', 'SMS বাতিল সম্পন্ন', 'পেন্ডিং SMS-টি সফলভাবে বাতিল করা হয়েছে।');
}

// Cancel All pending SMS from Outbox Queue
export async function cancelAllPendingSms() {
  let coachingId = 'aac-dhaka-01';
  const unsub = instituteSettings.subscribe((s) => {
    if (s?.coachingCenterId) coachingId = s.coachingCenterId;
  });
  unsub();

  smsQueue.update((q) =>
    q.map((item) =>
      item.coachingCenterId === coachingId && item.status === 'pending'
        ? { ...item, status: 'cancelled' as const, errorMessage: 'একযোগে বাতিলকৃত' }
        : item
    )
  );

  await cancelAllPendingSmsInQueue(coachingId);
  showToast('info', 'সকল পেন্ডিং SMS বাতিল', 'এই কোচিং সেন্টারের সব পেন্ডিং মেসেজ সফলভাবে বাতিল করা হলো।');
}

// Reload live SMS queue from Supabase
export async function refreshSmsQueue() {
  let coachingId = 'aac-dhaka-01';
  const unsub = instituteSettings.subscribe((s) => {
    if (s?.coachingCenterId) coachingId = s.coachingCenterId;
  });
  unsub();

  const items = await loadSmsQueueFromSupabase(coachingId);
  if (items && items.length > 0) {
    smsQueue.set(items);
  }
}

// Purchase Cloud SMS Pack
export function buySmsPack(credits: number, cost: number) {
  smsAccount.update((acc) => ({ ...acc, cloudBalance: acc.cloudBalance + credits }));
  showToast('success', 'এসএমএস প্যাক সক্রিয়', `আপনার অ্যাকাউন্টে ${credits.toLocaleString()} টি SMS ক্রেডিট যোগ হয়েছে (মূল্য: ৳${cost})।`);
}

// Toggle Android Gateway Simulation
export function toggleAndroidGateway() {
  smsAccount.update((acc) => {
    const isConn = !acc.androidGateway.connected;
    return {
      ...acc,
      androidGateway: {
        ...acc.androidGateway,
        connected: isConn,
        lastSyncTime: isConn ? 'এইমাত্র সংযুক্ত হয়েছে' : 'সংযোগ বিচ্ছিন্ন',
      },
    };
  });
}

// ==========================================
// SMS TEMPLATE CRUD ACTIONS
// ==========================================
export function addSmsTemplate(data: Omit<SmsTemplate, 'id'>): SmsTemplate {
  const rawBn = data.contentBangla?.trim() || '';
  const rawEn = data.contentEnglish?.trim() || '';
  const bn = rawBn || rawEn || 'সম্মানিত অভিভাবক, একাডেমি থেকে জরুরি নোটিশ।';
  const en = rawEn || rawBn || 'Dear Guardian, urgent notice from the academy.';
  const activeLang = data.activeLanguage || (rawBn ? 'bangla' : 'english');

  let vars = data.variables;
  if (!vars || vars.length === 0) {
    const combined = `${bn} ${en}`;
    const matches = combined.match(/\{[a-zA-Z0-9_]+\}/g) || [];
    vars = Array.from(new Set(matches));
    if (vars.length === 0) {
      vars = ['{student_name}', '{institute_name}', '{institute_phone}'];
    }
  }

  const newTpl: SmsTemplate = {
    id: `tpl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    title: data.title?.trim() || 'নতুন SMS টেমপ্লেট',
    category: data.category || 'general',
    eventType: data.eventType?.trim() || `${data.category || 'general'}_${Date.now().toString(36)}`,
    contentBangla: bn,
    contentEnglish: en,
    variables: vars,
    activeLanguage: activeLang,
    content: activeLang === 'english' ? en : bn,
  };

  smsTemplates.update((all) => [newTpl, ...all]);
  showToast('success', 'নতুন SMS টেমপ্লেট সংরক্ষিত', `'${newTpl.title}' সফলভাবে যুক্ত হয়েছে।`);
  return newTpl;
}

export function updateSmsTemplate(id: string, updates: Partial<SmsTemplate>) {
  smsTemplates.update((all) =>
    all.map((t) => {
      if (t.id === id) {
        const merged = { ...t, ...updates };
        merged.content = merged.activeLanguage === 'english' ? merged.contentEnglish : merged.contentBangla;
        return merged;
      }
      return t;
    })
  );
  showToast('success', 'টেমপ্লেট আপডেট হয়েছে', 'SMS টেমপ্লেটের তথ্য সফলভাবে হালনাগাদ করা হয়েছে।');
}

export function deleteSmsTemplate(id: string) {
  smsTemplates.update((all) => all.filter((t) => t.id !== id));
  showToast('info', 'টেমপ্লেট মুছে ফেলা হয়েছে', 'SMS টেমপ্লেটটি সরানো হয়েছে।');
}

export function toggleTemplateLanguage(id: string) {
  smsTemplates.update((all) =>
    all.map((t) => {
      if (t.id === id) {
        const nextLang = t.activeLanguage === 'english' ? 'bangla' : 'english';
        return {
          ...t,
          activeLanguage: nextLang,
          content: nextLang === 'english' ? t.contentEnglish : t.contentBangla,
        };
      }
      return t;
    })
  );
}

// ==========================================
// SYLLABUS STORE (CURRICULUM & LECTURE BREAKDOWNS)
// ==========================================
export const initialSyllabus: SyllabusItem[] = [
  {
    id: 'syl-1',
    courseId: 'c-1',
    courseName: 'HSC উচ্চতর পদার্থবিজ্ঞান ১ম ও ২য় পত্র (NCTB)',
    subject: 'পদার্থবিজ্ঞান ১ম পত্র',
    chapterNo: 1,
    chapterTitle: 'ভৌত জগত ও পরিমাপ (Physical World & Measurement)',
    topics: ['ভৌত রাশির মাত্রা ও একক', 'ভার্নিয়ার স্কেল ও স্ক্রু গজ ত্রুটি', 'পরিমাপের যথার্থতা ও সূক্ষ্মতা', 'ল্যাবরেটরি নিরাপত্তা বিধি'],
    lectureHours: 6,
    examMarks: 15,
    targetCompletionDate: '২০২৬-০৮-২০',
    status: 'completed',
    assignedTeacherName: 'ইঞ্জি. মোঃ সাইফুল ইসলাম',
    textbookReference: 'প্রফেসর ড. শাহজাহান তপন স্যার',
    remarks: 'বোর্ড এমসিকিউ ও অনুধাবনমূলক প্রশ্ন সমাধান সম্পন্ন',
  },
  {
    id: 'syl-2',
    courseId: 'c-1',
    courseName: 'HSC উচ্চতর পদার্থবিজ্ঞান ১ম ও ২য় পত্র (NCTB)',
    subject: 'পদার্থবিজ্ঞান ১ম পত্র',
    chapterNo: 2,
    chapterTitle: 'ভেক্টর বিশ্লেষণ ও দ্বিমাত্রিক গতি (Vectors & Kinematics)',
    topics: ['ভেক্টর যোগের সামান্তরিক সূত্র', 'নদী-নৌকার আপেক্ষিক বেগ', 'ডট ও ক্রস গুণন', 'প্রাসের সঞ্চারপথ ও পাল্লা'],
    lectureHours: 14,
    examMarks: 25,
    targetCompletionDate: '২০২৬-০৯-১৫',
    status: 'completed',
    assignedTeacherName: 'ইঞ্জি. মোঃ সাইফুল ইসলাম',
    textbookReference: 'প্রফেসর ড. শাহজাহান তপন স্যার',
    remarks: 'গাণিতিক মডেল টেস্ট ১ অনুষ্ঠিত হয়েছে',
  },
  {
    id: 'syl-3',
    courseId: 'c-1',
    courseName: 'HSC উচ্চতর পদার্থবিজ্ঞান ১ম ও ২য় পত্র (NCTB)',
    subject: 'পদার্থবিজ্ঞান ১ম পত্র',
    chapterNo: 4,
    chapterTitle: 'নিউটনিয়ান বলবিদ্যা (Newtonian Mechanics)',
    topics: ['রৈখিক ভরবেগের সংরক্ষণ সূত্র', 'ঘর্ষণ বল ও লিফটের প্রতিক্রিয়া', 'রাস্তার ব্যাংকিং কোণ', 'জড়তার ভ্রামক ও চক্রগতির ব্যাসার্ধ'],
    lectureHours: 18,
    examMarks: 30,
    targetCompletionDate: '২০২৬-১০-১৫',
    status: 'in_progress',
    assignedTeacherName: 'ইঞ্জি. মোঃ সাইফুল ইসলাম',
    textbookReference: 'ইসহাক স্যার ও তপন স্যার',
    remarks: 'ব্যাংকিং কোণের জটিল ইঞ্জিনিয়ারিং ম্যাথ চলছে',
  },
  {
    id: 'syl-4',
    courseId: 'c-1',
    courseName: 'HSC উচ্চতর পদার্থবিজ্ঞান ১ম ও ২য় পত্র (NCTB)',
    subject: 'পদার্থবিজ্ঞান ১ম পত্র',
    chapterNo: 5,
    chapterTitle: 'কাজ, শক্তি ও ক্ষমতা (Work, Energy & Power)',
    topics: ['পরিবর্তনশীল বল দ্বারা কাজ', 'স্প্রিং-এর বিভব শক্তি', 'কর্মদক্ষতা ও মোটরের ক্ষমতা', 'সংরক্ষণশীল বল ও শক্তির নিত্যতা'],
    lectureHours: 12,
    examMarks: 20,
    targetCompletionDate: '২০২৬-১১-১০',
    status: 'upcoming',
    assignedTeacherName: 'ইঞ্জি. মোঃ সাইফুল ইসলাম',
    textbookReference: 'প্রফেসর ড. শাহজাহান তপন স্যার',
    remarks: 'অক্টোবরের শেষ সপ্তাহে লেকচার শুরু হবে',
  },
  {
    id: 'syl-5',
    courseId: 'c-2',
    courseName: 'HSC উচ্চতর গণিত ও ক্যালকুলাস স্পেশাল',
    subject: 'উচ্চতর গণিত ১ম পত্র',
    chapterNo: 1,
    chapterTitle: 'ম্যাট্রিক্স ও নির্ণায়ক (Matrices & Determinants)',
    topics: ['ম্যাট্রিক্সের প্রকারভেদ ও গুণন', 'নির্ণায়কের ধর্মাবলি', 'বিপরীত ম্যাট্রিক্স ও ক্র্যামারের নিয়ম', 'বোর্ড সিকিউ অ্যানালাইসিস'],
    lectureHours: 10,
    examMarks: 20,
    targetCompletionDate: '২০২৬-০৮-৩০',
    status: 'completed',
    assignedTeacherName: 'প্রভাষক তানভীর আহমেদ',
    textbookReference: 'এসইউ আহাম্মদ ও অসীম কুমার সাহা',
    remarks: 'ক্লাস টেস্ট সম্পন্ন (গড় নম্বর ৮৪%)',
  },
  {
    id: 'syl-6',
    courseId: 'c-2',
    courseName: 'HSC উচ্চতর গণিত ও ক্যালকুলাস স্পেশাল',
    subject: 'উচ্চতর গণিত ১ম পত্র',
    chapterNo: 9,
    chapterTitle: 'অন্তরীকরণ ও ক্যালকুলাস (Differentiation)',
    topics: ['সীমা ও অবিচ্ছিন্নতা (Limits)', 'মূল নিয়মে অন্তরজ নির্ণয়', 'পর্যায়ক্রমিক অন্তরীকরণ', 'স্পর্শক, অভিলম্ব ও গুরুমান-লঘুমান'],
    lectureHours: 20,
    examMarks: 35,
    targetCompletionDate: '২০২৬-১০-৩০',
    status: 'in_progress',
    assignedTeacherName: 'প্রভাষক তানভীর আহমেদ',
    textbookReference: 'কেতাব উদ্দিন স্যার',
    remarks: 'গুরুমান ও লঘুমানের বোর্ড প্রশ্ন অনুশীলন চলছে',
  },
  {
    id: 'syl-7',
    courseId: 'c-3',
    courseName: 'বুয়েট ও ইঞ্জিনিয়ারিং ভর্তি প্রস্তুতি ২০২৬',
    subject: 'ইঞ্জিনিয়ারিং পদার্থবিজ্ঞান',
    chapterNo: 1,
    chapterTitle: 'বুয়েট প্রশ্নব্যাংক মেকানিক্স ও রোটেশনাল ডায়নামিক্স',
    topics: ['ঘূর্ণন গতি ও কৌণিক ভরবেগ সংরক্ষণ', 'কঠিন বস্তুর ভারসাম্য ও টর্ক', 'স্থির তরলের চাপ ও সান্দ্রতা', 'বুয়েট বিগত ২০ বছরের কনসেপ্ট'],
    lectureHours: 22,
    examMarks: 60,
    targetCompletionDate: '২০২৬-১০-২০',
    status: 'in_progress',
    assignedTeacherName: 'ইঞ্জি. মোঃ সাইফুল ইসলাম',
    textbookReference: 'বুয়েট রিটেন প্রশ্নব্যাংক ও আইআইটি কনসেপ্ট',
    remarks: 'উইকেন্ডে ৪ ঘণ্টার এক্সক্লুসিভ সেশন',
  },
  {
    id: 'syl-8',
    courseId: 'c-4',
    courseName: 'মেডিকেল ভর্তি বায়োলজি ও রসায়ন এক্সক্লুসিভ কেয়ার',
    subject: 'উদ্ভিদবিজ্ঞান ও প্রাণিবিজ্ঞান',
    chapterNo: 1,
    chapterTitle: 'কোষ ও কোষের গঠন (Cell & Cell Structure)',
    topics: ['কোষ প্রাচীর ও প্লাজমা মেমব্রেন', 'মাইটোকন্ড্রিয়া, ক্লোরোপ্লাস্ট ও ডিএনএ', 'প্রোটিন সংশ্লেষণ ও ট্রান্সলেশন', 'মেডিকেল বিগত ১৫ বছরের প্রশ্ন'],
    lectureHours: 16,
    examMarks: 30,
    targetCompletionDate: '২০২৬-০৯-২৫',
    status: 'completed',
    assignedTeacherName: 'ডা. নুসরাত জাহান',
    textbookReference: 'হাসান স্যার (বোটানি) ও গাজী আজমল স্যার (জুলজি)',
    remarks: '১০০ নম্বরের ওএমআর ভিত্তিক টেস্ট সম্পন্ন',
  },
];
export const syllabusItems = createTenantStore<SyllabusItem>('syllabus', initialSyllabus, false);

// ==========================================
// CLASS ROUTINE / TIMETABLE STORE (WEEKLY SCHEDULE)
// ==========================================
export const initialRoutine: RoutineSlot[] = [
  {
    id: 'rt-1',
    batchId: 'b-1',
    batchName: 'HSC \'26 ফিজিক্স আলফা (সকালের ব্যাচ - ফার্মগেট)',
    day: 'Saturday',
    startTime: '08:00 AM',
    endTime: '09:30 AM',
    subject: 'উচ্চতর পদার্থবিজ্ঞান - নিউটনিয়ান বলবিদ্যা',
    teacherId: 't-1',
    teacherName: 'ইঞ্জি. মোঃ সাইফুল ইসলাম',
    roomNumber: 'রুম ২০৪ (লেকচার হল ১)',
    classType: 'theory',
  },
  {
    id: 'rt-2',
    batchId: 'b-1',
    batchName: 'HSC \'26 ফিজিক্স আলফা (সকালের ব্যাচ - ফার্মগেট)',
    day: 'Monday',
    startTime: '08:00 AM',
    endTime: '09:30 AM',
    subject: 'পদার্থবিজ্ঞান গাণিতিক সমস্যা ও প্রবলেম সলভিং',
    teacherId: 't-1',
    teacherName: 'ইঞ্জি. মোঃ সাইফুল ইসলাম',
    roomNumber: 'রুম ২০৪ (লেকচার হল ১)',
    classType: 'doubt_solve',
  },
  {
    id: 'rt-3',
    batchId: 'b-1',
    batchName: 'HSC \'26 ফিজিক্স আলফা (সকালের ব্যাচ - ফার্মগেট)',
    day: 'Wednesday',
    startTime: '08:00 AM',
    endTime: '09:30 AM',
    subject: 'পদার্থবিজ্ঞান উইকলি মডেল টেস্ট ও ওএমআর এক্সাম',
    teacherId: 't-1',
    teacherName: 'ইঞ্জি. মোঃ সাইফুল ইসলাম',
    roomNumber: 'রুম ২০৪ (পরীক্ষা হল)',
    classType: 'model_test',
  },
  {
    id: 'rt-4',
    batchId: 'b-2',
    batchName: 'HSC \'26 বায়োলজি স্পেশাল (বিকালের ব্যাচ)',
    day: 'Sunday',
    startTime: '03:30 PM',
    endTime: '05:00 PM',
    subject: 'মেডিকেল বায়োলজি - মানব শারীরতত্ত্ব ও রক্ত সংবহন',
    teacherId: 't-2',
    teacherName: 'ডা. নুসরাত জাহান',
    roomNumber: 'রুম ৩০১ (বায়ো ল্যাব)',
    classType: 'theory',
  },
  {
    id: 'rt-5',
    batchId: 'b-2',
    batchName: 'HSC \'26 বায়োলজি স্পেশাল (বিকালের ব্যাচ)',
    day: 'Tuesday',
    startTime: '03:30 PM',
    endTime: '05:00 PM',
    subject: 'বায়োলজি ডায়াগ্রাম ও মাইক্রোস্কোপিক প্র্যাকটিক্যাল',
    teacherId: 't-2',
    teacherName: 'ডা. নুসরাত জাহান',
    roomNumber: 'রুম ৩০১ (বায়ো ল্যাব)',
    classType: 'practical',
  },
  {
    id: 'rt-6',
    batchId: 'b-2',
    batchName: 'HSC \'26 বায়োলজি স্পেশাল (বিকালের ব্যাচ)',
    day: 'Thursday',
    startTime: '03:30 PM',
    endTime: '05:00 PM',
    subject: 'মেডিকেল ৫০ মার্কস লাইভ ওএমআর টেস্ট',
    teacherId: 't-2',
    teacherName: 'ডা. নুসরাত জাহান',
    roomNumber: 'রুম ৩০১ (বায়ো ল্যাব)',
    classType: 'model_test',
  },
  {
    id: 'rt-7',
    batchId: 'b-3',
    batchName: 'বুয়েট ড্রিমার্স আলফা (উইকেন্ড ক্র্যাশ)',
    day: 'Friday',
    startTime: '09:00 AM',
    endTime: '11:30 AM',
    subject: 'বুয়েট রিটেন ম্যাথ ও অ্যাডভান্সড ক্যালকুলাস',
    teacherId: 't-3',
    teacherName: 'প্রভাষক তানভীর আহমেদ',
    roomNumber: 'রুম ৪০২ (অডিটোরিয়াম)',
    classType: 'theory',
  },
  {
    id: 'rt-8',
    batchId: 'b-3',
    batchName: 'বুয়েট ড্রিমার্স আলফা (উইকেন্ড ক্র্যাশ)',
    day: 'Saturday',
    startTime: '03:00 PM',
    endTime: '06:00 PM',
    subject: 'বুয়েট ফিজিক্স কনসেপ্ট ও বিগত প্রশ্ন সলভিং',
    teacherId: 't-1',
    teacherName: 'ইঞ্জি. মোঃ সাইফুল ইসলাম',
    roomNumber: 'রুম ৪০২ (অডিটোরিয়াম)',
    classType: 'theory',
  },
  {
    id: 'rt-9',
    batchId: 'b-4',
    batchName: 'এইচএসসি ম্যাথ চ্যাম্পিয়ন ব্যাচ',
    day: 'Sunday',
    startTime: '10:00 AM',
    endTime: '11:30 AM',
    subject: 'উচ্চতর গণিত - অন্তরীকরণ ও স্পর্শক',
    teacherId: 't-3',
    teacherName: 'প্রভাষক তানভীর আহমেদ',
    roomNumber: 'রুম ১০২',
    classType: 'theory',
  },
  {
    id: 'rt-10',
    batchId: 'b-4',
    batchName: 'এইচএসসি ম্যাথ চ্যাম্পিয়ন ব্যাচ',
    day: 'Tuesday',
    startTime: '10:00 AM',
    endTime: '11:30 AM',
    subject: 'উচ্চতর গণিত বোর্ড প্রশ্ন বিশ্লেষণ ও সমাধান',
    teacherId: 't-3',
    teacherName: 'প্রভাষক তানভীর আহমেদ',
    roomNumber: 'রুম ১০২',
    classType: 'doubt_solve',
  },
];
export const routineSlots = createTenantStore<RoutineSlot>('routine', initialRoutine, false);

// ==========================================
// SYLLABUS & ROUTINE CRUD METHODS
// ==========================================
export function addSyllabusItem(data: Omit<SyllabusItem, 'id'>) {
  const newItem: SyllabusItem = {
    ...data,
    coachingId: (data as any).coachingId || getActiveCoachingId(),
    id: `syl-${Date.now()}`,
  };
  syllabusItems.update((all) => [newItem, ...all]);
  showToast('success', 'নতুন সিলেবাস অধ্যায় সংরক্ষিত', `'${newItem.chapterTitle}' সিলেবাসে যুক্ত হয়েছে।`);
}

export function updateSyllabusItem(id: string, updates: Partial<SyllabusItem>) {
  syllabusItems.update((all) => all.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  showToast('success', 'সিলেবাস হালনাগাদ হয়েছে', 'অধ্যায়ের অগ্রগতি ও তথ্য সফলভাবে আপডেট হয়েছে।');
}

export function deleteSyllabusItem(id: string) {
  syllabusItems.update((all) => all.filter((item) => item.id !== id));
  showToast('info', 'অধ্যায় অপসারিত', 'সিলেবাস থেকে অধ্যায়টি সরানো হয়েছে।');
}

export function addRoutineSlot(data: Omit<RoutineSlot, 'id'>) {
  const newSlot: RoutineSlot = {
    ...data,
    coachingId: (data as any).coachingId || getActiveCoachingId(),
    id: `rt-${Date.now()}`,
  };
  routineSlots.update((all) => [...all, newSlot]);
  showToast('success', 'রুটিন স্লট যুক্ত হয়েছে', `${newSlot.day} ${newSlot.startTime}-এ নতুন ক্লাস যোগ করা হয়েছে।`);
}

export function updateRoutineSlot(id: string, updates: Partial<RoutineSlot>) {
  routineSlots.update((all) => all.map((slot) => (slot.id === id ? { ...slot, ...updates } : slot)));
  showToast('success', 'রুটিন আপডেট হয়েছে', 'ক্লাস সময়সূচি সফলভাবে পরিবর্তন করা হয়েছে।');
}

export function deleteRoutineSlot(id: string) {
  routineSlots.update((all) => all.filter((slot) => slot.id !== id));
  showToast('info', 'ক্লাস স্লট অপসারিত', 'রুটিন থেকে ক্লাসটি সরানো হয়েছে।');
}

