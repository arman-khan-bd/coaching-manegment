import { createClient } from '@supabase/supabase-js';
import { writable } from 'svelte/store';
import type { UserRole, Student, Batch, AttendanceRecord, FeeInvoice, SmsLog } from './types';

export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://qmrpvrsysbbmjxjdrzaj.supabase.co';

export const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_ibH84sYVdp6hleVaGN_i4g_6PQX3ajJ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export interface SupabaseUserProfile {
  id: string;
  email: string;
  full_name?: string;
  institute_name?: string;
  role: UserRole;
  phone?: string;
  created_at?: string;
}

export const currentAuthUser = writable<SupabaseUserProfile | null>(null);
export const authLoading = writable<boolean>(false);

// Initialize Auth listener
export async function initSupabaseAuth(
  onUserChange?: (user: SupabaseUserProfile | null) => void
) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const profile = buildProfileFromAuthUser(session.user);
      currentAuthUser.set(profile);
      if (onUserChange) onUserChange(profile);
    }
  } catch (err) {
    console.warn('Supabase getSession initial check error:', err);
  }

  supabase.auth.onAuthStateChange(async (_event, session) => {
    if (session?.user) {
      const profile = buildProfileFromAuthUser(session.user);
      currentAuthUser.set(profile);
      if (onUserChange) onUserChange(profile);
    } else {
      currentAuthUser.set(null);
      if (onUserChange) onUserChange(null);
    }
  });
}

function buildProfileFromAuthUser(user: any): SupabaseUserProfile {
  const meta = user.user_metadata || {};
  return {
    id: user.id,
    email: user.email || '',
    full_name: meta.full_name || meta.name || user.email?.split('@')[0] || 'User',
    institute_name: meta.institute_name || 'Apex Horizon Academy',
    role: (meta.role as UserRole) || 'institute_admin',
    phone: meta.phone || '',
    created_at: user.created_at,
  };
}

// ==========================================
// AUTH ACTIONS: REGISTER, LOGIN, LOGOUT
// ==========================================

export async function supabaseSignUp(
  email: string,
  pass: string,
  meta: {
    fullName: string;
    instituteName: string;
    role: UserRole;
    phone?: string;
  }
) {
  authLoading.set(true);
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: {
          full_name: meta.fullName,
          institute_name: meta.instituteName,
          role: meta.role,
          phone: meta.phone,
        },
      },
    });

    if (error) throw error;

    if (data.user) {
      const profile: SupabaseUserProfile = {
        id: data.user.id,
        email,
        full_name: meta.fullName,
        institute_name: meta.instituteName,
        role: meta.role,
        phone: meta.phone,
        created_at: new Date().toISOString(),
      };
      currentAuthUser.set(profile);

      // Attempt to save to `profiles` or `users` table in database
      saveUserToDb(profile).catch((e) => console.log('Notice: DB profile sync info:', e));

      return { success: true, user: profile, session: data.session };
    }
    return { success: true, user: null, session: null };
  } catch (err: any) {
    console.error('Supabase Sign Up Error:', err);
    return { success: false, error: err.message || 'Registration failed' };
  } finally {
    authLoading.set(false);
  }
}

export async function supabaseSignIn(email: string, pass: string) {
  authLoading.set(true);
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });

    if (error) throw error;

    if (data.user) {
      const profile = buildProfileFromAuthUser(data.user);
      currentAuthUser.set(profile);
      return { success: true, user: profile, session: data.session };
    }
    return { success: false, error: 'User not found' };
  } catch (err: any) {
    console.error('Supabase Sign In Error:', err);
    return { success: false, error: err.message || 'Invalid credentials' };
  } finally {
    authLoading.set(false);
  }
}

export async function supabaseSignOut() {
  try {
    await supabase.auth.signOut();
    currentAuthUser.set(null);
  } catch (err) {
    console.error('Sign Out Error:', err);
  }
}

// ==========================================
// DATABASE PERSISTENCE HELPERS
// (Stores user email & coaching data in Supabase tables)
// ==========================================

export async function saveUserToDb(profile: SupabaseUserProfile) {
  try {
    const { error } = await supabase.from('profiles').upsert({
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      institute_name: profile.institute_name,
      role: profile.role,
      phone: profile.phone,
      updated_at: new Date().toISOString(),
    });
    if (error) {
      console.warn('Database profiles table notice:', error.message);
    }
  } catch (e) {
    console.warn('Supabase DB table profile insert caught:', e);
  }
}

export async function syncStudentToDb(student: Student) {
  try {
    const { error } = await supabase.from('students').upsert({
      id: student.id,
      roll_no: student.rollNo,
      name: student.name,
      email: student.email,
      phone: student.phone,
      guardian_name: student.guardianName,
      guardian_phone: student.guardianPhone,
      blood_group: student.bloodGroup,
      status: student.status,
      fees_due: student.feesDue,
      address: student.address,
      gender: student.gender,
      updated_at: new Date().toISOString(),
    });
    if (error) console.warn('Supabase student sync notice:', error.message);
  } catch (e) {
    console.warn('Student sync catch:', e);
  }
}

export async function syncBatchToDb(batch: Batch) {
  try {
    const { error } = await supabase.from('batches').upsert({
      id: batch.id,
      code: batch.code,
      name: batch.name,
      course_id: batch.courseId,
      teacher_id: batch.teacherId,
      room_number: batch.roomNumber,
      schedule_days: batch.scheduleDays,
      start_time: batch.startTime,
      end_time: batch.endTime,
      max_capacity: batch.maxCapacity,
      status: batch.status,
      updated_at: new Date().toISOString(),
    });
    if (error) console.warn('Supabase batch sync notice:', error.message);
  } catch (e) {
    console.warn('Batch sync catch:', e);
  }
}

export async function syncAttendanceToDb(record: AttendanceRecord) {
  try {
    const { error } = await supabase.from('attendance').upsert({
      id: record.id,
      batch_id: record.batchId,
      student_id: record.studentId,
      date: record.date,
      status: record.status,
      remarks: record.remarks,
      updated_at: new Date().toISOString(),
    });
    if (error) console.warn('Supabase attendance sync notice:', error.message);
  } catch (e) {
    console.warn('Attendance sync catch:', e);
  }
}

export async function syncInvoiceToDb(inv: FeeInvoice) {
  try {
    const { error } = await supabase.from('invoices').upsert({
      id: inv.id,
      invoice_no: inv.invoiceNo,
      student_id: inv.studentId,
      student_name: inv.studentName,
      batch_name: inv.batchName,
      amount: inv.amount,
      paid_amount: inv.paidAmount,
      due_amount: inv.dueAmount,
      status: inv.status,
      issue_date: inv.issueDate,
      due_date: inv.dueDate,
      payment_method: inv.paymentMethod,
      updated_at: new Date().toISOString(),
    });
    if (error) console.warn('Supabase invoice sync notice:', error.message);
  } catch (e) {
    console.warn('Invoice sync catch:', e);
  }
}

export async function syncSmsLogToDb(log: SmsLog) {
  try {
    const { error } = await supabase.from('sms_logs').upsert({
      id: log.id,
      recipient_name: log.recipientName,
      recipient_phone: log.recipientPhone,
      message: log.message,
      gateway: log.gateway,
      status: log.status,
      cost: log.cost,
      timestamp: log.timestamp,
    });
    if (error) console.warn('Supabase SMS log sync notice:', error.message);
  } catch (e) {
    console.warn('SMS log sync catch:', e);
  }
}
