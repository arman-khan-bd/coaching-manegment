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
  BookItem,
  CoachingInstitute,
  PlatformSubscription,
  PlatformUser,
  PlatformSettings,
  PlatformTransaction,
  SmsQueueItem,
  PlatformReview,
  PlatformFaq,
} from './types';
import {
  syncStudentToDb,
  deleteStudentFromDb,
  syncBatchToDb,
  deleteBatchFromDb,
  syncTeacherToDb,
  deleteTeacherFromDb,
  syncCourseToDb,
  deleteCourseFromDb,
  syncAttendanceToDb,
  syncInvoiceToDb,
  deleteInvoiceFromDb,
  syncExamToDb,
  deleteExamFromDb,
  syncExamMarksToDb,
  deleteExamMarkFromDb,
  syncSmsLogToDb,
  deleteSmsLogFromDb,
  syncSmsTemplateToDb,
  deleteSmsTemplateFromDb,
  syncSyllabusToDb,
  deleteSyllabusFromDb,
  syncRoutineToDb,
  deleteRoutineFromDb,
  syncBookToDb,
  deleteBookFromDb,
  syncInstituteSettingsToDb,
  loadInstituteSettingsFromDb,
  loadTenantDataFromSupabase,
  syncAllLocalDataToSupabase,
  supabaseSignOut,
  currentAuthUser,
} from './supabase';
import {
  enqueueSmsToQueue,
  cancelSmsInQueue,
  cancelAllPendingSmsInQueue,
  loadSmsQueueFromSupabase,
  normalizePhoneNumber,
} from './smsQueueApi';
import {
  loadSaasAdminDataFromSupabase,
  defaultPlansSeed,
  defaultPlatformSettingsSeed,
  savePlatformSettingsToDb,
  savePlansToDb,
  saveSubscriptionsToDb,
  saveTransactionsToDb,
  saveReviewsToDb,
  saveFaqsToDb,
  updateCoachingInDb,
  deleteCoachingInDb,
  savePlatformUserToDb,
  deletePlatformUserFromDb,
} from './saasAdminApi';

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

  // Hydrate live data from Supabase for this coaching ID
  if (coachingId) {
    loadTenantDataFromSupabase(coachingId, {
      onStudents: (data) => { if (data.length > 0) students.set(data); },
      onTeachers: (data) => { if (data.length > 0) teachers.set(data); },
      onBatches: (data) => { if (data.length > 0) batches.set(data); },
      onCourses: (data) => { if (data.length > 0) courses.set(data); },
      onAttendance: (data) => { if (data.length > 0) attendanceRecords.set(data); },
      onInvoices: (data) => { if (data.length > 0) feeInvoices.set(data); },
      onExams: (data) => { if (data.length > 0) exams.set(data); },
      onExamMarks: (data) => { if (data.length > 0) examMarks.set(data); },
      onSmsLogs: (data) => { if (data.length > 0) smsLogs.set(data); },
      onSmsTemplates: (data) => { if (data.length > 0) smsTemplates.set(data); },
      onSyllabus: (data) => { if (data.length > 0) syllabusItems.set(data); },
      onRoutine: (data) => { if (data.length > 0) routineSlots.set(data); },
      onBooks: (data) => { if (data.length > 0) books.set(data); },
    }).catch((e) => console.warn('Supabase tenant hydration catch:', e));
  }
}

export function refreshCurrentTenantDataFromDb() {
  const cid = getActiveCoachingId();
  if (cid) {
    loadTenantDataFromSupabase(cid, {
      onStudents: (data) => { if (data.length > 0) students.set(data); },
      onTeachers: (data) => { if (data.length > 0) teachers.set(data); },
      onBatches: (data) => { if (data.length > 0) batches.set(data); },
      onCourses: (data) => { if (data.length > 0) courses.set(data); },
      onAttendance: (data) => { if (data.length > 0) attendanceRecords.set(data); },
      onInvoices: (data) => { if (data.length > 0) feeInvoices.set(data); },
      onExams: (data) => { if (data.length > 0) exams.set(data); },
      onExamMarks: (data) => { if (data.length > 0) examMarks.set(data); },
      onSmsLogs: (data) => { if (data.length > 0) smsLogs.set(data); },
      onSmsTemplates: (data) => { if (data.length > 0) smsTemplates.set(data); },
      onSyllabus: (data) => { if (data.length > 0) syllabusItems.set(data); },
      onRoutine: (data) => { if (data.length > 0) routineSlots.set(data); },
      onBooks: (data) => { if (data.length > 0) books.set(data); },
    }).catch((e) => console.warn('Supabase tenant initial hydration catch:', e));
  }
}

/**
 * Direct sync of all current store data into Supabase Cloud Database.
 * Runs safe fallback upserts on all 13 core tables.
 */
export async function syncCurrentDataDirectToSupabase(): Promise<{ success: boolean; syncedCounts: Record<string, number>; errors: string[] }> {
  const cid = getActiveCoachingId();
  const currentData = {
    students: get(students),
    teachers: get(teachers),
    batches: get(batches),
    courses: get(courses),
    attendance: get(attendanceRecords),
    invoices: get(feeInvoices),
    exams: get(exams),
    examMarks: get(examMarks),
    smsLogs: get(smsLogs),
    smsTemplates: get(smsTemplates),
    syllabus: get(syllabusItems),
    routine: get(routineSlots),
    books: get(books),
    settings: get(instituteSettings),
  };

  showToast('info', 'ক্লাউড সিঙ্ক শুরু হয়েছে', 'সুপাবেজ ডাটাবেজে সমস্ত তথ্য সরাসরি সেভ করা হচ্ছে...');
  try {
    const res = await syncAllLocalDataToSupabase(cid, currentData);
    if (res.errors.length === 0) {
      showToast('success', 'ডাটাবেজে সংরক্ষিত হয়েছে', 'আপনার সমস্ত তথ্য সফলভাবে সরাসরি Supabase ডাটাবেজে সংরক্ষিত হয়েছে!');
    } else {
      showToast('warning', 'আংশিক সিঙ্ক সম্পন্ন', `কিছু তথ্য সংরক্ষণে সমস্যা: ${res.errors[0]}`);
    }
    return res;
  } catch (err: any) {
    showToast('error', 'সিঙ্ক ব্যর্থ হয়েছে', err?.message || 'Supabase ক্লাউড ডাটাবেজে সংযোগ করতে সমস্যা হয়েছে।');
    return { success: false, syncedCounts: {}, errors: [err?.message || 'Unknown error'] };
  }
}



// ==========================================
// NAVIGATION & AUTH STORES
// ==========================================
export const currentView = writable<'landing' | 'login' | 'register' | 'checkout' | 'dashboard'>('landing');
export const activeTab = writable<string>('overview');
export const currentRole = writable<UserRole>('institute_admin');
export const currentTeacherPermissions = writable<string[]>([]);
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
export const initialPlans: SubscriptionPlan[] = defaultPlansSeed;

export const subscriptionPlans = writable<SubscriptionPlan[]>(defaultPlansSeed);

// Plan CRUD Actions
export function addPlan(planData: Omit<SubscriptionPlan, 'id'>) {
  const newPlan: SubscriptionPlan = {
    ...planData,
    id: `plan-${Date.now().toString(36)}`,
  };
  subscriptionPlans.update((all) => {
    const next = [...all, newPlan];
    savePlansToDb(next);
    return next;
  });
  showToast('success', 'নতুন প্ল্যান তৈরি', `"${newPlan.name}" সফলভাবে যোগ করা হয়েছে।`);
}

export function updatePlan(id: string, updates: Partial<SubscriptionPlan>) {
  subscriptionPlans.update((all) => {
    const next = all.map((p) => (p.id === id ? { ...p, ...updates } : p));
    savePlansToDb(next);
    return next;
  });
  showToast('info', 'প্ল্যান আপডেট', 'সাবস্ক্রিপশন প্ল্যানের তথ্য আপডেট করা হয়েছে।');
}

export function deletePlan(id: string) {
  subscriptionPlans.update((all) => {
    const next = all.filter((p) => p.id !== id);
    savePlansToDb(next);
    return next;
  });
  showToast('warning', 'প্ল্যান অপসারিত', 'প্ল্যানটি সিস্টেম থেকে সরানো হয়েছে।');
}

export function togglePlanStatus(id: string) {
  subscriptionPlans.update((all) => {
    const next = all.map((p) => {
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
    });
    savePlansToDb(next);
    return next;
  });
}

// ==========================================
// SAAS COACHINGS / TENANTS STORE
// ==========================================
export const coachingInstitutes = writable<CoachingInstitute[]>([]);

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
  updateCoachingInDb(newInst.id, newInst);
  showToast('success', 'কোচিং নিবন্ধিত', `"${newInst.name}" সফলভাবে যুক্ত করা হয়েছে। ID: ${autoCoachingCenterId}`);
}

export function updateCoaching(id: string, updates: Partial<CoachingInstitute>) {
  coachingInstitutes.update((all) => all.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  updateCoachingInDb(id, updates);
  showToast('info', 'তথ্য হালনাগাদ', 'কোচিং সেন্টারের প্রোফাইল আপডেট হয়েছে।');
}

export function toggleCoachingStatus(id: string) {
  coachingInstitutes.update((all) =>
    all.map((c) => {
      if (c.id === id) {
        const nextStatus = c.status === 'active' ? 'suspended' : 'active';
        updateCoachingInDb(id, { status: nextStatus });
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
  deleteCoachingInDb(id);
  showToast('warning', 'কোচিং অপসারিত', 'কোচিং রেকর্ড মুছে ফেলা হয়েছে।');
}

// ==========================================
// SAAS TENANT SUBSCRIPTIONS STORE
// ==========================================
export const platformSubscriptions = writable<PlatformSubscription[]>([]);

export function addPlatformSubscription(subData: Omit<PlatformSubscription, 'id'>) {
  const newSub: PlatformSubscription = {
    ...subData,
    id: `sub-${Date.now()}`,
    invoiceId: `INV-SAAS-${Date.now().toString().slice(-4)}`,
  };
  platformSubscriptions.update((all) => {
    const next = [newSub, ...all];
    saveSubscriptionsToDb(next);
    return next;
  });
  showToast('success', 'সাবস্ক্রিপশন যুক্ত', `"${newSub.coachingName}"-এর সাবস্ক্রিপশন রেকর্ড যোগ করা হয়েছে।`);
}

export function updatePlatformSubscription(id: string, updates: Partial<PlatformSubscription>) {
  platformSubscriptions.update((all) => {
    const next = all.map((s) => (s.id === id ? { ...s, ...updates } : s));
    saveSubscriptionsToDb(next);
    return next;
  });
  showToast('info', 'সাবস্ক্রিপশন আপডেট', 'সাবস্ক্রিপশনের তথ্য সংরক্ষিত হয়েছে।');
}

export function approveSubscription(id: string) {
  platformSubscriptions.update((all) => {
    const next = all.map((s) => {
      if (s.id === id) {
        // Also update tenant status if institute exists
        coachingInstitutes.update((insts) =>
          insts.map((i) => (i.id === s.coachingId ? { ...i, status: 'active', planId: s.planId, planName: s.planName } : i))
        );
        showToast('success', 'সাবস্ক্রিপশন অনুমোদিত (Approved)', `"${s.coachingName}"-এর সাবস্ক্রিপশন গ্রহণ ও সক্রিয় করা হয়েছে।`);
        return { ...s, status: 'active' as const, autoRenew: true };
      }
      return s;
    });
    saveSubscriptionsToDb(next);
    return next;
  });
}

export function rejectSubscription(id: string, reason: string = 'পেমেন্ট ভেরিফিকেশন ব্যর্থ') {
  platformSubscriptions.update((all) => {
    const next = all.map((s) => {
      if (s.id === id) {
        showToast('error', 'সাবস্ক্রিপশন প্রত্যাখ্যান (Rejected)', `"${s.coachingName}"-এর অনুরোধ বাতিল করা হয়েছে।`);
        return { ...s, status: 'rejected' as const, rejectionReason: reason, autoRenew: false };
      }
      return s;
    });
    saveSubscriptionsToDb(next);
    return next;
  });
}

export function suspendSubscription(id: string) {
  platformSubscriptions.update((all) => {
    const next = all.map((s) => {
      if (s.id === id) {
        showToast('warning', 'সাবস্ক্রিপশন স্থগিত (Suspended)', `"${s.coachingName}"-এর অ্যাক্সেস স্থগিত করা হয়েছে।`);
        return { ...s, status: 'suspended' as const, autoRenew: false };
      }
      return s;
    });
    saveSubscriptionsToDb(next);
    return next;
  });
}

export function activateSubscription(id: string) {
  platformSubscriptions.update((all) => {
    const next = all.map((s) => {
      if (s.id === id) {
        showToast('success', 'সাবস্ক্রিপশন সক্রিয়', `"${s.coachingName}" পুনরায় চালু করা হয়েছে।`);
        return { ...s, status: 'active' as const };
      }
      return s;
    });
    saveSubscriptionsToDb(next);
    return next;
  });
}

export function extendSubscription(id: string, days: number = 30) {
  platformSubscriptions.update((all) => {
    const next = all.map((s) => {
      if (s.id === id) {
        const current = new Date(s.nextRenewalDate || new Date());
        current.setDate(current.getDate() + days);
        const nextDate = current.toISOString().split('T')[0];
        showToast('info', 'মেয়াদ বৃদ্ধি', `মেয়াদ +${days} দিন বৃদ্ধি করে ${nextDate} করা হয়েছে।`);
        return { ...s, nextRenewalDate: nextDate, status: 'active' as const };
      }
      return s;
    });
    saveSubscriptionsToDb(next);
    return next;
  });
}

export function cancelPlatformSubscription(id: string) {
  platformSubscriptions.update((all) => {
    const next = all.map((s) => (s.id === id ? { ...s, status: 'cancelled' as const, autoRenew: false } : s));
    saveSubscriptionsToDb(next);
    return next;
  });
  showToast('warning', 'সাবস্ক্রিপশন বাতিল', 'সাবস্ক্রিপশনটি বাতিল চিহ্নিত করা হয়েছে।');
}

export function deletePlatformSubscription(id: string) {
  platformSubscriptions.update((all) => {
    const next = all.filter((s) => s.id !== id);
    saveSubscriptionsToDb(next);
    return next;
  });
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

const defaultPlatformUsers: PlatformUser[] = [];

function getSavedPlatformUsers(): PlatformUser[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('coachflow_platform_users');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Purge dummy admin@coachflow.app and other legacy dummy users from local storage
        const sanitized = parsed.filter(
          (u) =>
            u.email &&
            u.email.trim().toLowerCase() !== 'admin@coachflow.app' &&
            u.email.trim().toLowerCase() !== 'support@coachflow.app' &&
            !u.id?.startsWith('usr-')
        );
        return sanitized;
      }
    }
  } catch (_) {}
  return [];
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
      const parsed = JSON.parse(raw);
      // Revoke any legacy dummy admin session
      if (parsed?.email && parsed.email.trim().toLowerCase() === 'admin@coachflow.app') {
        localStorage.removeItem('coachflow_saas_admin_auth');
        return null;
      }
      return parsed;
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

/**
 * Sign out the currently logged in coaching user / institute admin / teacher from Supabase,
 * clear all session state and auth tokens from localStorage, and navigate to /login.
 */
export async function logoutDashboardUser(): Promise<void> {
  try {
    await supabaseSignOut();
  } catch (err) {
    console.error('Logout error during supabaseSignOut:', err);
  }

  // Clear in-memory auth and permissions
  currentAuthUser.set(null);
  currentRole.set('institute_admin');
  currentTeacherPermissions.set([]);
  saasAdminAuth.set(null);

  // Clear all Supabase session tokens and custom CoachFlow auth keys from localStorage
  if (typeof window !== 'undefined') {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (
          key &&
          (key.includes('-auth-token') ||
            key.startsWith('sb-') ||
            key.startsWith('coachflow_auth') ||
            key.startsWith('coachflow_saas_admin_auth'))
        ) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch (e) {
      console.warn('Failed to clear auth keys from localStorage:', e);
    }
  }

  showToast('info', 'লগআউট সফল (Logged Out)', 'আপনি সফলভাবে অ্যাকাউন্ট থেকে লগআউট করেছেন।');

  // Navigate to login page
  if (typeof window !== 'undefined') {
    try {
      const { navigate } = await import('./router');
      navigate('/login');
    } catch {
      window.location.href = '/login';
    }
  }
}

export function createSaasAdminAccount(
  name: string,
  email: string,
  password: string,
  phone: string = '+880 1700-000000',
  role: 'super_admin' | 'platform_support' = 'super_admin',
  autoLogin: boolean = true
): { success: boolean; error?: string; user?: PlatformUser } {
  const cleanEmail = email.trim().toLowerCase();
  let existingUser: PlatformUser | undefined;
  platformUsers.subscribe((list) => {
    existingUser = list.find((u) => u.email.trim().toLowerCase() === cleanEmail);
  })();

  if (existingUser) {
    return { success: false, error: 'এই ইমেইলটি দিয়ে ইতিমধ্যে একটি প্ল্যাটফর্ম একাউন্ট রয়েছে।' };
  }

  const newAdmin: PlatformUser = {
    id: `saas-admin-${Date.now()}`,
    name: name.trim(),
    email: cleanEmail,
    phone: phone.trim() || '+880 1700-000000',
    role,
    status: 'active',
    password: password.trim(),
    lastLogin: 'এইমাত্র তৈরি (সক্রিয়)',
    createdAt: new Date().toISOString().split('T')[0],
  };

  platformUsers.update((all) => [newAdmin, ...all]);
  if (autoLogin) {
    loginSaasAdmin(newAdmin);
  }
  showToast('success', 'সুপার এডমিন অ্যাকাউন্ট তৈরি হয়েছে', `স্বাগতম ${newAdmin.name}! আপনার সুপার এডমিন অ্যাকাউন্ট তৈরি সম্পন্ন হয়েছে।`);
  return { success: true, user: newAdmin };
}

export function deleteSaasAdminAccount(id: string) {
  platformUsers.update((all) => all.filter((u) => u.id !== id));
  showToast('warning', 'সুপার এডমিন অপসারিত', 'এডমিন একাউন্টটি তালিকা থেকে মুছে ফেলা হয়েছে।');
}

export function updateSaasAdminPassword(id: string, newPass: string) {
  platformUsers.update((all) =>
    all.map((u) => (u.id === id ? { ...u, password: newPass.trim() } : u))
  );
  showToast('success', 'পাসওয়ার্ড পরিবর্তিত', 'সুপার এডমিন পাসওয়ার্ড সফলভাবে আপডেট করা হয়েছে।');
}

export function addPlatformUser(userData: Omit<PlatformUser, 'id' | 'createdAt' | 'lastLogin'>) {
  const newUser: PlatformUser = {
    ...userData,
    id: `usr-${Date.now()}`,
    createdAt: new Date().toISOString().split('T')[0],
    lastLogin: 'কখনো লগইন করেননি',
  };
  platformUsers.update((all) => [newUser, ...all]);
  savePlatformUserToDb(newUser);
  showToast('success', 'ব্যবহারকারী যুক্ত', `"${newUser.name}"-কে প্ল্যাটফর্মে যোগ করা হয়েছে।`);
}

export function updatePlatformUser(id: string, updates: Partial<PlatformUser>) {
  platformUsers.update((all) =>
    all.map((u) => {
      if (u.id === id) {
        const merged = { ...u, ...updates };
        savePlatformUserToDb(merged);
        return merged;
      }
      return u;
    })
  );
  showToast('info', 'ইউজার আপডেট', 'ব্যবহারকারীর তথ্য সংরক্ষিত হয়েছে।');
}

export function togglePlatformUserStatus(id: string) {
  platformUsers.update((all) =>
    all.map((u) => {
      if (u.id === id) {
        const next = u.status === 'active' ? 'suspended' : 'active';
        savePlatformUserToDb({ ...u, status: next });
        showToast('warning', 'স্ট্যাটাস আপডেট', `ইউজার অ্যাকাউন্ট ${next} করা হয়েছে।`);
        return { ...u, status: next };
      }
      return u;
    })
  );
}

export function deletePlatformUser(id: string) {
  platformUsers.update((all) => all.filter((u) => u.id !== id));
  deletePlatformUserFromDb(id);
  showToast('warning', 'ইউজার অপসারিত', 'ইউজারটি প্ল্যাটফর্ম থেকে সরানো হয়েছে।');
}

// ==========================================
// SAAS PLATFORM GLOBAL SETTINGS STORE
// ==========================================
export const platformSettings = writable<PlatformSettings>(defaultPlatformSettingsSeed);

export function updatePlatformSettings(updates: Partial<PlatformSettings>) {
  platformSettings.update((curr) => {
    const next = { ...curr, ...updates };
    savePlatformSettingsToDb(next);
    return next;
  });
  showToast('success', 'প্ল্যাটফর্ম সেটিংস সংরক্ষিত', 'গ্লোবাল প্ল্যাটফর্ম কনফিগারেশন Supabase-এ সংরক্ষণ হয়েছে।');
}

// ==========================================
// SAAS PLATFORM TRANSACTIONS STORE
// ==========================================
export const platformTransactions = writable<PlatformTransaction[]>([]);

export function verifyPlatformTransaction(id: string) {
  platformTransactions.update((all) => {
    const next = all.map((t) => {
      if (t.id === id) {
        showToast('success', 'পেমেন্ট অনুমোদিত (Verified)', `ট্রানজেকশন ${t.trxId} যাচাই ও সম্পন্ন করা হয়েছে।`);
        return { ...t, status: 'completed' as const };
      }
      return t;
    });
    saveTransactionsToDb(next);
    return next;
  });
}

// ==========================================
// INSTITUTE SETTINGS STORE (BANGLADESH CONFIGURED)
// ==========================================
export const defaultInstituteSettings: InstituteSettings = {
  // 1. General & Brand
  name: 'এপেক্স অ্যাকাডেমিক কেয়ার (ফার্মগেট শাখা)',
  nameEnglish: 'Apex Academic Care (Farmgate Branch)',
  brandingTitle: 'এপেক্স অ্যাকাডেমিক কেয়ার (ফার্মগেট শাখা)',
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
  directorSignatureUrl: '',
  headTeacherSignatureUrl: '',
  academicCoordinator: 'ড. তানভীর আহমেদ (অ্যাকাডেমিক কো-অর্ডিনেটর)',
  officialSealText: 'APEX ACADEMIC CARE • SEAL OF EXCELLENCE • DHAKA-1215',
  officialSealUrl: '',

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
export const initialCourses: Course[] = [];
export const courses = createTenantStore<Course>('courses', initialCourses);

export const units = writable<Unit[]>([]);

// ==========================================
// TEACHERS STORE (BANGLADESHI FACULTY)
// ==========================================
export const initialTeachers: Teacher[] = [];
export const teachers = createTenantStore<Teacher>('teachers', initialTeachers);

// ==========================================
// BATCHES STORE (LOCAL COACHING BATCHES)
// ==========================================
export const initialBatches: Batch[] = [];
export const batches = createTenantStore<Batch>('batches', initialBatches);

// ==========================================
// STUDENTS STORE (BANGLADESHI STUDENTS)
// ==========================================
export const initialStudents: Student[] = [];
export const students = createTenantStore<Student>('students', initialStudents);

// ==========================================
// ATTENDANCE STORE
// ==========================================
export const initialAttendance: AttendanceRecord[] = [];
export const attendanceRecords = createTenantStore<AttendanceRecord>('attendance', initialAttendance);

// ==========================================
// FEE INVOICES STORE (IN BDT ৳ WITH BKASH/NAGAD)
// ==========================================
export const initialFeeInvoices: FeeInvoice[] = [];
export const feeInvoices = createTenantStore<FeeInvoice>('feeinvoices', initialFeeInvoices);

// ==========================================
// EXAMS & MARKS STORE (GPA 5.0 SYSTEM)
// ==========================================
export const initialExams: Exam[] = [];
export const exams = createTenantStore<Exam>('exams', initialExams);

export const initialExamMarks: ExamMark[] = [];
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

export const initialSmsLogs: SmsLog[] = [];
export const smsLogs = createTenantStore<SmsLog>('smslogs', initialSmsLogs, false);

// 10-Second Polling Outbox Queue store
export const smsQueue = writable<SmsQueueItem[]>([]);

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
  let updatedStudent: Student | undefined;
  students.update((all) =>
    all.map((s) => {
      if (s.id === id) {
        updatedStudent = { ...s, ...updates };
        return updatedStudent;
      }
      return s;
    })
  );
  if (updatedStudent) {
    syncStudentToDb(updatedStudent);
  }
  showToast('info', 'তথ্য হালনাগাদ', 'শিক্ষার্থীর প্রোফাইল আপডেট করা হয়েছে।');
}

// Delete Student
export function deleteStudent(id: string) {
  students.update((all) => all.filter((s) => s.id !== id));
  deleteStudentFromDb(id);
  showToast('warning', 'শিক্ষার্থী অপসারিত', 'শিক্ষার্থীর রেকর্ড ডাটাবেজ থেকে মুছে ফেলা হয়েছে।');
}

// Add Batch
export function addBatch(batchData: Omit<Batch, 'id' | 'enrolledCount'>): Batch {
  const newBatch: Batch = {
    ...batchData,
    coachingId: batchData.coachingId || getActiveCoachingId(),
    id: `b-${Date.now()}`,
    enrolledCount: 0,
  };
  batches.update((all) => [newBatch, ...all]);
  syncBatchToDb(newBatch);
  showToast('success', 'নতুন ব্যাচ চালু হয়েছে', 'অ্যাকাডেমিক ব্যাচ সফলভাবে খোলা হয়েছে।');
  return newBatch;
}

// Update Batch
export function updateBatch(id: string, updates: Partial<Batch>) {
  let updatedBatch: Batch | undefined;
  batches.update((all) =>
    all.map((b) => {
      if (b.id === id) {
        updatedBatch = { ...b, ...updates };
        return updatedBatch;
      }
      return b;
    })
  );
  if (updatedBatch) {
    syncBatchToDb(updatedBatch);
  }
  showToast('info', 'ব্যাচ হালনাগাদ', 'ব্যাচের তথ্য সফলভাবে আপডেট হয়েছে।');
}

// Delete Batch
export function deleteBatch(id: string) {
  batches.update((all) => all.filter((b) => b.id !== id));
  deleteBatchFromDb(id);
  showToast('warning', 'ব্যাচ অপসারিত', 'ব্যাচটি ডাটাবেজ থেকে সরানো হয়েছে।');
}

// Add Teacher
export function addTeacher(teacherData: Omit<Teacher, 'id'>): Teacher {
  const newTeacher: Teacher = {
    ...teacherData,
    coachingId: teacherData.coachingId || getActiveCoachingId(),
    id: `t-${Date.now()}`,
    hasLoginAccount: teacherData.hasLoginAccount || false,
    signatureUrl: teacherData.signatureUrl || '',
    isHeadTeacher: teacherData.isHeadTeacher || false,
    permissions: teacherData.permissions || [],
  };
  teachers.update((all) => [newTeacher, ...all]);
  syncTeacherToDb(newTeacher);
  showToast('success', 'শিক্ষক যুক্ত হয়েছেন', 'নতুন শিক্ষকের প্রোফাইল ও বেতন স্কেল সংরক্ষিত হয়েছে।');
  return newTeacher;
}

// Update Teacher
export function updateTeacher(id: string, updates: Partial<Teacher>) {
  let updatedTeacher: Teacher | undefined;
  teachers.update((all) =>
    all.map((t) => {
      if (t.id === id) {
        updatedTeacher = { ...t, ...updates };
        return updatedTeacher;
      }
      return t;
    })
  );
  if (updatedTeacher) {
    syncTeacherToDb(updatedTeacher);
  }
  showToast('info', 'শিক্ষকের তথ্য হালনাগাদ', 'শিক্ষকের প্রোফাইল সফলভাবে আপডেট হয়েছে।');
}

// Delete Teacher
export function deleteTeacher(id: string) {
  teachers.update((all) => all.filter((t) => t.id !== id));
  deleteTeacherFromDb(id);
  showToast('warning', 'শিক্ষক অপসারিত', 'শিক্ষকের রেকর্ড ডাটাবেজ থেকে সরানো হয়েছে।');
}

// Course Actions
export function addCourse(courseData: Omit<Course, 'id'>) {
  const newCourse: Course = {
    ...courseData,
    coachingId: courseData.coachingId || getActiveCoachingId(),
    id: `c-${Date.now()}`,
  };
  courses.update((all) => [newCourse, ...all]);
  syncCourseToDb(newCourse);
  showToast('success', 'নতুন কোর্স যুক্ত হয়েছে', `"${newCourse.title}" সফলভাবে তৈরি হয়েছে।`);
  return newCourse;
}

export function updateCourse(id: string, updates: Partial<Course>) {
  let updatedCourse: Course | undefined;
  courses.update((all) =>
    all.map((c) => {
      if (c.id === id) {
        updatedCourse = { ...c, ...updates };
        return updatedCourse;
      }
      return c;
    })
  );
  if (updatedCourse) {
    syncCourseToDb(updatedCourse);
  }
  showToast('info', 'কোর্স হালনাগাদ', 'কোর্সের তথ্য সফলভাবে আপডেট হয়েছে।');
}

export function deleteCourse(id: string) {
  courses.update((all) => all.filter((c) => c.id !== id));
  deleteCourseFromDb(id);
  showToast('warning', 'কোর্স অপসারিত', 'কোর্সটি সিস্টেম ও ডাটাবেজ থেকে সরানো হয়েছে।');
}

// Fee Invoice Actions
export function addInvoice(invoiceData: Omit<FeeInvoice, 'id'>) {
  const newInv: FeeInvoice = {
    ...invoiceData,
    coachingId: invoiceData.coachingId || getActiveCoachingId(),
    id: `inv-${Date.now()}`,
  };
  feeInvoices.update((all) => [newInv, ...all]);
  syncInvoiceToDb(newInv);
  showToast('success', 'ইনভয়েস তৈরি হয়েছে', `ইনভয়েস #${newInv.invoiceNo} সফলভাবে যুক্ত হয়েছে।`);
  return newInv;
}

export function updateInvoice(id: string, updates: Partial<FeeInvoice>) {
  let updatedInv: FeeInvoice | undefined;
  feeInvoices.update((all) =>
    all.map((inv) => {
      if (inv.id === id) {
        updatedInv = { ...inv, ...updates };
        return updatedInv;
      }
      return inv;
    })
  );
  if (updatedInv) {
    syncInvoiceToDb(updatedInv);
  }
  showToast('info', 'ইনভয়েস আপডেট', 'ইনভয়েসের তথ্য সফলভাবে হালনাগাদ হয়েছে।');
}

export function deleteInvoice(id: string) {
  feeInvoices.update((all) => all.filter((inv) => inv.id !== id));
  deleteInvoiceFromDb(id);
  showToast('warning', 'ইনভয়েস অপসারিত', 'ইনভয়েসটি ডাটাবেজ থেকে মুছে ফেলা হয়েছে।');
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
  syncExamToDb(newExam);

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
      syncExamMarksToDb(initialMarks, getActiveCoachingId());
    }
  }

  showToast('success', 'নতুন পরীক্ষা তৈরি হয়েছে', `"${newExam.title}" সফলভাবে তৈরি ও সংরক্ষিত হয়েছে।`);
  return newId;
}

// Update Exam
export function updateExam(id: string, updates: Partial<Exam>) {
  let updatedExam: Exam | undefined;
  exams.update((all) =>
    all.map((ex) => {
      if (ex.id === id) {
        const updated = { ...ex, ...updates };
        updatedExam = updated;
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
  if (updatedExam) {
    syncExamToDb(updatedExam);
  }
  showToast('info', 'পরীক্ষার তথ্য হালনাগাদ', 'পরীক্ষার সময়সূচি ও তথ্য সফলভাবে আপডেট হয়েছে।');
}

// Delete Exam
export function deleteExam(id: string) {
  exams.update((all) => all.filter((e) => e.id !== id));
  examMarks.update((all) => all.filter((m) => m.examId !== id));
  deleteExamFromDb(id);
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

    syncExamMarksToDb(updatedForExam, getActiveCoachingId());
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

  let targetMark: ExamMark | undefined;

  examMarks.update((existing) => {
    if (data.id) {
      return existing.map((m) => {
        if (m.id === data.id) {
          targetMark = {
            ...m,
            marksObtained: data.marksObtained,
            grade: gradeInfo.grade,
            remarks: data.remarks,
          };
          return targetMark;
        }
        return m;
      });
    } else {
      const foundIndex = existing.findIndex((m) => m.examId === examId && m.studentId === data.studentId);
      if (foundIndex >= 0) {
        const copy = [...existing];
        targetMark = {
          ...copy[foundIndex],
          marksObtained: data.marksObtained,
          grade: gradeInfo.grade,
          remarks: data.remarks,
        };
        copy[foundIndex] = targetMark;
        return copy;
      }
      targetMark = {
        id: `em-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        examId,
        studentId: data.studentId,
        studentName: data.studentName,
        rollNo: data.rollNo,
        marksObtained: data.marksObtained,
        grade: gradeInfo.grade,
        remarks: data.remarks || '',
      };
      return [...existing, targetMark];
    }
  });

  if (targetMark) {
    syncExamMarksToDb([targetMark], getActiveCoachingId());
  }

  showToast('success', 'ফলাফল হালনাগাদ', `${data.studentName}-এর নম্বর সফলভাবে সংরক্ষিত হয়েছে।`);
}

// Delete Single Exam Mark
export function deleteExamMark(id: string) {
  examMarks.update((all) => all.filter((m) => m.id !== id));
  deleteExamMarkFromDb(id);
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
  syncSmsTemplateToDb(newTpl, getActiveCoachingId());
  showToast('success', 'নতুন SMS টেমপ্লেট সংরক্ষিত', `'${newTpl.title}' সফলভাবে যুক্ত হয়েছে।`);
  return newTpl;
}

export function updateSmsTemplate(id: string, updates: Partial<SmsTemplate>) {
  let updatedTpl: SmsTemplate | undefined;
  smsTemplates.update((all) =>
    all.map((t) => {
      if (t.id === id) {
        const merged = { ...t, ...updates };
        merged.content = merged.activeLanguage === 'english' ? merged.contentEnglish : merged.contentBangla;
        updatedTpl = merged;
        return merged;
      }
      return t;
    })
  );
  if (updatedTpl) {
    syncSmsTemplateToDb(updatedTpl, getActiveCoachingId());
  }
  showToast('success', 'টেমপ্লেট আপডেট হয়েছে', 'SMS টেমপ্লেটের তথ্য সফলভাবে হালনাগাদ করা হয়েছে।');
}

export function deleteSmsTemplate(id: string) {
  smsTemplates.update((all) => all.filter((t) => t.id !== id));
  deleteSmsTemplateFromDb(id);
  showToast('info', 'টেমপ্লেট মুছে ফেলা হয়েছে', 'SMS টেমপ্লেটটি সরানো হয়েছে।');
}

export function toggleTemplateLanguage(id: string) {
  let updatedTpl: SmsTemplate | undefined;
  smsTemplates.update((all) =>
    all.map((t) => {
      if (t.id === id) {
        const nextLang = t.activeLanguage === 'english' ? 'bangla' : 'english';
        updatedTpl = {
          ...t,
          activeLanguage: nextLang,
          content: nextLang === 'english' ? t.contentEnglish : t.contentBangla,
        };
        return updatedTpl;
      }
      return t;
    })
  );
  if (updatedTpl) {
    syncSmsTemplateToDb(updatedTpl, getActiveCoachingId());
  }
}

// ==========================================
// SYLLABUS STORE (CURRICULUM & LECTURE BREAKDOWNS)
// ==========================================
export const initialSyllabus: SyllabusItem[] = [];
export const syllabusItems = createTenantStore<SyllabusItem>('syllabus', initialSyllabus, false);

// ==========================================
// CLASS ROUTINE / TIMETABLE STORE (WEEKLY SCHEDULE)
// ==========================================
export const initialRoutine: RoutineSlot[] = [];
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
  syncSyllabusToDb(newItem);
  showToast('success', 'নতুন সিলেবাস অধ্যায় সংরক্ষিত', `'${newItem.chapterTitle}' সিলেবাসে যুক্ত হয়েছে।`);
}

export function updateSyllabusItem(id: string, updates: Partial<SyllabusItem>) {
  let updatedItem: SyllabusItem | undefined;
  syllabusItems.update((all) =>
    all.map((item) => {
      if (item.id === id) {
        updatedItem = { ...item, ...updates };
        return updatedItem;
      }
      return item;
    })
  );
  if (updatedItem) {
    syncSyllabusToDb(updatedItem);
  }
  showToast('success', 'সিলেবাস হালনাগাদ হয়েছে', 'অধ্যায়ের অগ্রগতি ও তথ্য সফলভাবে আপডেট হয়েছে।');
}

export function deleteSyllabusItem(id: string) {
  syllabusItems.update((all) => all.filter((item) => item.id !== id));
  deleteSyllabusFromDb(id);
  showToast('info', 'অধ্যায় অপসারিত', 'সিলেবাস থেকে অধ্যায়টি সরানো হয়েছে।');
}

export function addRoutineSlot(data: Omit<RoutineSlot, 'id'>) {
  const newSlot: RoutineSlot = {
    ...data,
    coachingId: (data as any).coachingId || getActiveCoachingId(),
    id: `rt-${Date.now()}`,
  };
  routineSlots.update((all) => [...all, newSlot]);
  syncRoutineToDb(newSlot);
  showToast('success', 'রুটিন স্লট যুক্ত হয়েছে', `${newSlot.day} ${newSlot.startTime}-এ নতুন ক্লাস যোগ করা হয়েছে।`);
}

export function updateRoutineSlot(id: string, updates: Partial<RoutineSlot>) {
  let updatedSlot: RoutineSlot | undefined;
  routineSlots.update((all) =>
    all.map((slot) => {
      if (slot.id === id) {
        updatedSlot = { ...slot, ...updates };
        return updatedSlot;
      }
      return slot;
    })
  );
  if (updatedSlot) {
    syncRoutineToDb(updatedSlot);
  }
  showToast('success', 'রুটিন আপডেট হয়েছে', 'ক্লাস সময়সূচি সফলভাবে পরিবর্তন করা হয়েছে।');
}

export function deleteRoutineSlot(id: string) {
  routineSlots.update((all) => all.filter((slot) => slot.id !== id));
  deleteRoutineFromDb(id);
  showToast('info', 'ক্লাস স্লট অপসারিত', 'রুটিন থেকে ক্লাসটি সরানো হয়েছে।');
}

// ==========================================
// ACADEMIC BOOK LIST STORE (TEXTBOOKS & MATERIALS)
// ==========================================
export const initialBooks: BookItem[] = [
  {
    id: 'book-1',
    coachingId: 'aac-dhaka-01',
    title: 'উচ্চতর গণিত ১ম পত্র (একাদশ-দ্বাদশ)',
    subject: 'উচ্চতর গণিত',
    author: 'প্রফেসর অসীম কুমার সাহা',
    publisher: 'অক্ষরপত্র প্রকাশনী',
    courseId: 'c1',
    courseName: 'HSC পূর্ণাঙ্গ বিজ্ঞান ব্যাচ (২০২৬)',
    classLevel: 'HSC ১ম বর্ষ',
    edition: '২০২৫-২৬ সংস্করণ',
    price: 420,
    isRequired: 'mandatory',
    notes: 'অধ্যায় ১-৭ প্রথম সাময়িক পরীক্ষার সিলেবাসভুক্ত। ক্লাসে সাথে আনা বাধ্যতামূলক।',
    createdAt: '2026-01-10T10:00:00Z',
  },
  {
    id: 'book-2',
    coachingId: 'aac-dhaka-01',
    title: 'রসায়ন ১ম পত্র (তত্ত্বীয় ও ব্যবহারিক)',
    subject: 'রসায়ন',
    author: 'ড. গাজী মোঃ আহসানুল কবীর ও ড. রবিউল ইসলাম',
    publisher: 'হাসান বুক হাউস',
    courseId: 'c1',
    courseName: 'HSC পূর্ণাঙ্গ বিজ্ঞান ব্যাচ (২০২৬)',
    classLevel: 'HSC ১ম বর্ষ',
    edition: '২০২৫ সংস্করণ',
    price: 395,
    isRequired: 'mandatory',
    notes: 'গুণগত রসায়ন ও পর্যায়বৃত্ত ধর্মের সমস্যাবলি অনুশীলনের জন্য মূল পাঠ্যবই।',
    createdAt: '2026-01-10T10:00:00Z',
  },
  {
    id: 'book-3',
    coachingId: 'aac-dhaka-01',
    title: 'পদার্থবিজ্ঞান ১ম পত্র',
    subject: 'পদার্থবিজ্ঞান',
    author: 'ড. শাহজাহান তপন ও ড. রানা চৌধুরী',
    publisher: 'কাজল ব্রাদার্স লি.',
    courseId: 'c1',
    courseName: 'HSC পূর্ণাঙ্গ বিজ্ঞান ব্যাচ (২০২৬)',
    classLevel: 'HSC ১ম বর্ষ',
    edition: '২০২৬ সংস্করণ',
    price: 450,
    isRequired: 'mandatory',
    notes: 'ভেক্টর, গতিবিদ্যা ও নিউটনিয়ান বলবিদ্যার সকল গাণিতিক সমস্যার স্ট্যান্ডার্ড গাইড।',
    createdAt: '2026-01-12T10:00:00Z',
  },
  {
    id: 'book-4',
    coachingId: 'aac-dhaka-01',
    title: 'কোচফ্লো ইঞ্জিনিয়ারিং কোয়ান্টাম প্রশ্নব্যাংক (বুয়েট ও রুয়েট)',
    subject: 'ইঞ্জিনিয়ারিং স্পেশাল',
    author: 'কোচফ্লো একাডেমি রিসার্চ উইং',
    publisher: 'কোচফ্লো পাবলিকেশন্স',
    courseId: 'c2',
    courseName: 'ইঞ্জিনিয়ারিং ও প্রযুক্তি বিশ্ববিদ্যালয় ভর্তি প্রস্তুতি',
    classLevel: 'এডমিশন ২০২৬',
    edition: '১০ম সংশোধিত সংস্করণ ২০২৬',
    price: 650,
    isRequired: 'mandatory',
    notes: 'বিগত ২৫ বছরের বুয়েট, কুয়েট, রুয়েট ও চুয়েট ভর্তি পরীক্ষার সমাধানকৃত প্রশ্নব্যাংক।',
    createdAt: '2026-01-15T10:00:00Z',
  },
  {
    id: 'book-5',
    coachingId: 'aac-dhaka-01',
    title: 'মেডিকেল ডেন্টাল বায়োলজি মাস্টার প্রশ্নব্যাংক',
    subject: 'জীববিজ্ঞান',
    author: 'ডা. মেসবাহ উদ্দিন ও কোচফ্লো ডক্টরস ফোরাম',
    publisher: 'জয়কলি পাবলিকেশন্স',
    courseId: 'c3',
    courseName: 'মেডিকেল ও ডেন্টাল এক্সক্লুসিভ এডমিশন ব্যাচ',
    classLevel: 'এডমিশন ২০২৬',
    edition: '২০২৬ এডিশন',
    price: 580,
    isRequired: 'mandatory',
    notes: 'মেডিকেল ভর্তি পরীক্ষার নির্ভুল ব্যাখ্যা সহ চ্যাপ্টারওয়াইজ এমসিকিউ সংকলন।',
    createdAt: '2026-01-18T10:00:00Z',
  },
  {
    id: 'book-6',
    coachingId: 'aac-dhaka-01',
    title: 'Advanced English Grammar & Model Questions',
    subject: 'ইংরেজি',
    author: 'Chowdhury & Hossain',
    publisher: 'Advanced Publications',
    courseId: 'c1',
    courseName: 'HSC পূর্ণাঙ্গ বিজ্ঞান ব্যাচ (২০২৬)',
    classLevel: 'HSC ১ম ও ২য় বর্ষ',
    edition: 'লেটেস্ট এডিশন',
    price: 360,
    isRequired: 'optional',
    notes: 'সহায়ক ব্যাকরণ ও বোর্ড প্রশ্ন সমাধানের জন্য রেফারেন্স বই।',
    createdAt: '2026-01-20T10:00:00Z',
  },
  {
    id: 'book-7',
    coachingId: 'aac-dhaka-01',
    title: 'এসএসসি সাধারণ গণিত ও উচ্চতর গণিত মডেল সমাধান',
    subject: 'সাধারণ ও উচ্চতর গণিত',
    author: 'এম. এ. জব্বার',
    publisher: 'পাঞ্জেরী পাবলিকেশন্স',
    courseId: 'c4',
    courseName: 'এসএসসি বোর্ড স্পেশাল প্রিপারেশন ২০২৬',
    classLevel: '১০ম শ্রেণি (SSC)',
    edition: '২০২৬ সংস্করণ',
    price: 280,
    isRequired: 'optional',
    notes: 'বোর্ড স্ট্যান্ডার্ড সৃজনশীল প্রশ্ন ও সমাধান।',
    createdAt: '2026-02-01T10:00:00Z',
  },
];

export const books = createTenantStore<BookItem>('books', initialBooks, true);
export const bookList = books;

export function addBook(data: Omit<BookItem, 'id' | 'createdAt' | 'updatedAt'>) {
  const newBook: BookItem = {
    ...data,
    coachingId: (data as any).coachingId || getActiveCoachingId(),
    id: `bk-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  books.update((all) => [newBook, ...all]);
  syncBookToDb(newBook);
  showToast('success', 'নতুন বই তালিকায় যোগ হয়েছে', `'${newBook.title}' সফলভাবে বই তালিকায় যুক্ত হয়েছে।`);
  return newBook;
}

export function updateBook(id: string, updates: Partial<BookItem>) {
  let updatedBook: BookItem | undefined;
  books.update((all) =>
    all.map((b) => {
      if (b.id === id) {
        updatedBook = { ...b, ...updates, updatedAt: new Date().toISOString() };
        return updatedBook;
      }
      return b;
    })
  );
  if (updatedBook) {
    syncBookToDb(updatedBook);
  }
  showToast('success', 'বইয়ের তথ্য আপডেট হয়েছে', 'বইয়ের তথ্য সফলভাবে পরিবর্তন করা হয়েছে।');
}

export function deleteBook(id: string) {
  books.update((all) => all.filter((b) => b.id !== id));
  deleteBookFromDb(id);
  showToast('info', 'বই সরানো হয়েছে', 'বইটি তালিকা থেকে মুছে ফেলা হয়েছে।');
}

// ==========================================
// SAAS PLATFORM REVIEWS / TESTIMONIALS STORE
// ==========================================
export const initialPlatformReviews: PlatformReview[] = [];

function getSavedPlatformReviews(): PlatformReview[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('coachflow_platform_reviews');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.filter((r) => !r.id?.startsWith('rev-1') && !r.id?.startsWith('rev-2') && !r.id?.startsWith('rev-3'));
      }
    }
  } catch (_) {}
  return [];
}

export const platformReviews = writable<PlatformReview[]>(getSavedPlatformReviews());

if (typeof window !== 'undefined') {
  platformReviews.subscribe((list) => {
    try {
      localStorage.setItem('coachflow_platform_reviews', JSON.stringify(list));
    } catch (_) {}
  });
}

export function addPlatformReview(data: Omit<PlatformReview, 'id' | 'createdAt'>) {
  const newRev: PlatformReview = {
    ...data,
    id: `rev-${Date.now()}`,
    createdAt: new Date().toISOString().split('T')[0],
  };
  platformReviews.update((all) => {
    const next = [newRev, ...all];
    saveReviewsToDb(next);
    return next;
  });
  showToast('success', 'রিভিউ প্রকাশিত', `"${newRev.name}"-এর রিভিউ সফলভাবে যোগ হয়েছে।`);
}

export function updatePlatformReview(id: string, updates: Partial<PlatformReview>) {
  platformReviews.update((all) => {
    const next = all.map((r) => (r.id === id ? { ...r, ...updates } : r));
    saveReviewsToDb(next);
    return next;
  });
  showToast('info', 'রিভিউ হালনাগাদ', 'ক্লায়েন্ট রিভিউ সফলভাবে আপডেট করা হয়েছে।');
}

export function toggleReviewStatus(id: string) {
  platformReviews.update((all) => {
    const next = all.map((r) => {
      if (r.id === id) {
        const nextStatus = r.status === 'published' ? 'hidden' : 'published';
        showToast(nextStatus === 'published' ? 'success' : 'info', 'স্ট্যাটাস পরিবর্তন', `রিভিউ স্ট্যাটাস ${nextStatus === 'published' ? 'Published' : 'Hidden'} করা হয়েছে।`);
        return { ...r, status: nextStatus };
      }
      return r;
    });
    saveReviewsToDb(next);
    return next;
  });
}

export function deletePlatformReview(id: string) {
  platformReviews.update((all) => {
    const next = all.filter((r) => r.id !== id);
    saveReviewsToDb(next);
    return next;
  });
  showToast('warning', 'রিভিউ অপসারিত', 'রিভিউটি সফলভাবে মুছে ফেলা হয়েছে।');
}

// ==========================================
// SAAS PLATFORM FAQS STORE
// ==========================================
export const initialPlatformFaqs: PlatformFaq[] = [];

function getSavedPlatformFaqs(): PlatformFaq[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('coachflow_platform_faqs');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.filter((f) => !f.id?.startsWith('faq-1') && !f.id?.startsWith('faq-2') && !f.id?.startsWith('faq-3'));
      }
    }
  } catch (_) {}
  return [];
}

export const platformFaqs = writable<PlatformFaq[]>(getSavedPlatformFaqs());

if (typeof window !== 'undefined') {
  platformFaqs.subscribe((list) => {
    try {
      localStorage.setItem('coachflow_platform_faqs', JSON.stringify(list));
    } catch (_) {}
  });
}

export function addPlatformFaq(data: Omit<PlatformFaq, 'id'>) {
  const newFaq: PlatformFaq = {
    ...data,
    id: `faq-${Date.now()}`,
  };
  platformFaqs.update((all) => {
    const next = [...all, newFaq];
    saveFaqsToDb(next);
    return next;
  });
  showToast('success', 'FAQ তৈরি হয়েছে', `নতুন প্রশ্নটি ওয়েবসাইটে সফলভাবে যোগ হয়েছে।`);
}

export function updatePlatformFaq(id: string, updates: Partial<PlatformFaq>) {
  platformFaqs.update((all) => {
    const next = all.map((f) => (f.id === id ? { ...f, ...updates } : f));
    saveFaqsToDb(next);
    return next;
  });
  showToast('info', 'FAQ হালনাগাদ', 'প্রশ্ন ও উত্তরের তথ্য আপডেট করা হয়েছে।');
}

export function toggleFaqStatus(id: string) {
  platformFaqs.update((all) => {
    const next = all.map((f) => {
      if (f.id === id) {
        const nextStatus = f.status === 'published' ? 'hidden' : 'published';
        showToast(nextStatus === 'published' ? 'success' : 'info', 'স্ট্যাটাস পরিবর্তন', `FAQ স্ট্যাটাস ${nextStatus === 'published' ? 'Published' : 'Hidden'} করা হয়েছে।`);
        return { ...f, status: nextStatus };
      }
      return f;
    });
    saveFaqsToDb(next);
    return next;
  });
}

export function deletePlatformFaq(id: string) {
  platformFaqs.update((all) => {
    const next = all.filter((f) => f.id !== id);
    saveFaqsToDb(next);
    return next;
  });
  showToast('warning', 'FAQ অপসারিত', 'প্রশ্নটি সফলভাবে মুছে ফেলা হয়েছে।');
}

// ==========================================
// SAAS ADMIN LIVE SYNC & REFRESH ACTION
// ==========================================
export const isSaasDataLoading = writable<boolean>(false);

export async function refreshSaasAdminDataFromDb(): Promise<void> {
  isSaasDataLoading.set(true);
  try {
    const data = await loadSaasAdminDataFromSupabase();
    if (data.users && data.users.length > 0) {
      platformUsers.set(data.users);
    }
    if (data.coachings && data.coachings.length > 0) {
      coachingInstitutes.set(data.coachings);
    }
    if (data.plans && data.plans.length > 0) {
      subscriptionPlans.set(data.plans);
    }
    if (data.subscriptions && data.subscriptions.length > 0) {
      platformSubscriptions.set(data.subscriptions);
    }
    if (data.transactions && data.transactions.length > 0) {
      platformTransactions.set(data.transactions);
    }
    if (data.settings) {
      platformSettings.set(data.settings);
    }
    if (data.reviews && data.reviews.length > 0) {
      platformReviews.set(data.reviews);
    }
    if (data.faqs && data.faqs.length > 0) {
      platformFaqs.set(data.faqs);
    }
  } catch (err) {
    console.error('Failed to load SaaS admin live data from Supabase:', err);
  } finally {
    isSaasDataLoading.set(false);
  }
}


