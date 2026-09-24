import { createClient } from '@supabase/supabase-js';
import { writable } from 'svelte/store';
import type {
  UserRole,
  Student,
  Batch,
  AttendanceRecord,
  FeeInvoice,
  SmsLog,
  InstituteSettings,
  Teacher,
  Course,
  Exam,
  ExamMark,
  SmsTemplate,
  SyllabusItem,
  RoutineSlot,
} from './types';

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
  coaching_center_id?: string;
  role: UserRole;
  phone?: string;
  created_at?: string;
  permissions?: string[];
}

export const currentAuthUser = writable<SupabaseUserProfile | null>(null);
export const authLoading = writable<boolean>(false);
export const isPasswordRecoveryMode = writable<boolean>(false);

// Initialize Auth listener
export async function initSupabaseAuth(
  onUserChange?: (user: SupabaseUserProfile | null) => void
) {
  try {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash || '';
      const search = window.location.search || '';
      if (hash.includes('type=recovery') || search.includes('type=recovery')) {
        isPasswordRecoveryMode.set(true);
      }
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const profile = buildProfileFromAuthUser(session.user);
      currentAuthUser.set(profile);
      if (onUserChange) onUserChange(profile);
    }
  } catch (err) {
    console.warn('Supabase getSession initial check error:', err);
  }

  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'PASSWORD_RECOVERY') {
      isPasswordRecoveryMode.set(true);
    }

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
    coaching_center_id: meta.coaching_center_id || meta.coaching_id || undefined,
    role: (meta.role as UserRole) || 'institute_admin',
    phone: meta.phone || '',
    created_at: user.created_at,
    permissions: Array.isArray(meta.permissions) ? meta.permissions : [],
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
    coachingCenterId?: string;
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
          coaching_center_id: meta.coachingCenterId,
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
        coaching_center_id: meta.coachingCenterId,
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

/**
 * Admin action to create a teacher account with email and password from Dashboard.
 * Uses an isolated, non-persisting client so the Institute Admin's current session
 * is NEVER overwritten or logged out.
 */
export async function supabaseAdminCreateTeacherAccount(params: {
  email: string;
  password: string;
  fullName: string;
  instituteName: string;
  phone: string;
  coachingCenterId: string;
  permissions?: string[];
}): Promise<{ success: boolean; user?: any; error?: string }> {
  try {
    const isolatedClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

    const teacherPerms = Array.isArray(params.permissions) ? params.permissions : [];

    const { data, error } = await isolatedClient.auth.signUp({
      email: params.email,
      password: params.password,
      options: {
        data: {
          full_name: params.fullName,
          institute_name: params.instituteName,
          coaching_center_id: params.coachingCenterId,
          role: 'teacher',
          phone: params.phone,
          permissions: teacherPerms,
        },
      },
    });

    if (error) throw error;

    if (data.user) {
      const profile: SupabaseUserProfile = {
        id: data.user.id,
        email: params.email,
        full_name: params.fullName,
        institute_name: params.instituteName,
        coaching_center_id: params.coachingCenterId,
        role: 'teacher',
        phone: params.phone,
        permissions: teacherPerms,
        created_at: new Date().toISOString(),
      };
      saveUserToDb(profile).catch((e) => console.log('Notice: Teacher profile sync notice:', e));
      return { success: true, user: data.user };
    }

    return { success: true, user: null };
  } catch (err: any) {
    console.error('Teacher Account Creation Error:', err);
    return { success: false, error: err.message || 'শিক্ষক অ্যাকাউন্ট তৈরি করতে ব্যর্থ হয়েছে।' };
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
  } catch (err) {
    console.error('Sign Out Error:', err);
  } finally {
    currentAuthUser.set(null);
  }
}

export async function supabaseResetPasswordForEmail(email: string, redirectTo?: string) {
  authLoading.set(true);
  try {
    const redirectUrl =
      redirectTo ||
      (typeof window !== 'undefined'
        ? `${window.location.origin}/login?type=recovery`
        : undefined);

    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
    if (error) throw error;
    return { success: true, data };
  } catch (err: any) {
    console.error('Supabase Reset Password Error:', err);
    return { success: false, error: err.message || 'পাসওয়ার্ড রিসেট ইমেইল পাঠাতে সমস্যা হয়েছে।' };
  } finally {
    authLoading.set(false);
  }
}

export async function supabaseUpdatePassword(newPassword: string) {
  authLoading.set(true);
  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
    isPasswordRecoveryMode.set(false);
    return { success: true, data };
  } catch (err: any) {
    console.error('Supabase Update Password Error:', err);
    return { success: false, error: err.message || 'পাসওয়ার্ড আপডেট করতে সমস্যা হয়েছে।' };
  } finally {
    authLoading.set(false);
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
      coaching_id: student.coachingId || 'aac-dhaka-01',
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
      coaching_id: batch.coachingId || 'aac-dhaka-01',
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
      coaching_id: record.coachingId || 'aac-dhaka-01',
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


export async function syncSmsLogToDb(log: SmsLog) {
  try {
    const { error } = await supabase.from('sms_logs').upsert({
      id: log.id,
      coaching_id: log.coachingId || 'aac-dhaka-01',
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

export async function syncInstituteSettingsToDb(settings: InstituteSettings) {
  try {
    // 1. Upsert into coaching_branding table
    const { error: brandErr } = await supabase.from('coaching_branding').upsert({
      id: 'primary_branch',
      coaching_center_id: settings.coachingCenterId,
      name: settings.name,
      name_english: settings.nameEnglish,
      tagline: settings.tagline,
      established_year: settings.establishedYear,
      reg_number: settings.regNumber,
      branch_name: settings.branchName,
      branch_code: settings.branchCode,
      logo_url: settings.logo,
      icon_url: settings.icon,
      phone: settings.phone,
      hotline: settings.hotline,
      whatsapp: settings.whatsapp,
      alternate_phone: settings.alternatePhone,
      email: settings.email,
      website: settings.website,
      address: settings.address,
      division: settings.division,
      district: settings.district,
      thana: settings.thana,
      google_maps_url: settings.googleMapsUrl,
      social_media: settings.socialMedia || {},
      director_name: settings.directorName,
      director_designation: settings.directorDesignation,
      director_signature: settings.directorSignature,
      director_signature_url: settings.directorSignatureUrl,
      head_teacher_signature_url: settings.headTeacherSignatureUrl,
      academic_coordinator: settings.academicCoordinator,
      official_seal_text: settings.officialSealText,
      official_seal_url: settings.officialSealUrl,
      bkash_merchant: settings.bkashMerchant,
      nagad_merchant: settings.nagadMerchant,
      rocket_number: settings.rocketNumber,
      bank_account_name: settings.bankAccountName,
      bank_name: settings.bankName,
      bank_branch: settings.bankBranch,
      bank_account_number: settings.bankAccountNumber,
      bank_routing: settings.bankRouting,
      settings_data: settings,
      updated_at: new Date().toISOString(),
    });

    if (brandErr) {
      console.warn('coaching_branding sync notice:', brandErr.message);
    }

    // 2. Also upsert into institute_settings for redundancy
    await supabase.from('institute_settings').upsert({
      id: 'main',
      coaching_center_id: settings.coachingCenterId,
      settings: settings,
      updated_at: new Date().toISOString(),
    });
  } catch (e) {
    console.warn('Institute settings sync caught:', e);
  }
}

export async function loadInstituteSettingsFromDb(): Promise<Partial<InstituteSettings> | null> {
  try {
    const { data, error } = await supabase
      .from('coaching_branding')
      .select('*')
      .eq('id', 'primary_branch')
      .maybeSingle();

    if (error || !data) {
      const { data: instData } = await supabase
        .from('institute_settings')
        .select('settings')
        .eq('id', 'main')
        .maybeSingle();
      if (instData?.settings) {
        return instData.settings;
      }
      return null;
    }

    return {
      name: data.name,
      nameEnglish: data.name_english,
      tagline: data.tagline,
      establishedYear: data.established_year,
      regNumber: data.reg_number,
      branchName: data.branch_name,
      branchCode: data.branch_code,
      logo: data.logo_url,
      icon: data.icon_url,
      phone: data.phone,
      hotline: data.hotline,
      whatsapp: data.whatsapp,
      alternatePhone: data.alternate_phone,
      email: data.email,
      website: data.website,
      address: data.address,
      division: data.division,
      district: data.district,
      thana: data.thana,
      googleMapsUrl: data.google_maps_url,
      socialMedia: data.social_media,
      directorName: data.director_name,
      directorDesignation: data.director_designation,
      directorSignature: data.director_signature,
      directorSignatureUrl: data.director_signature_url || data.settings_data?.directorSignatureUrl,
      headTeacherSignatureUrl: data.head_teacher_signature_url || data.settings_data?.headTeacherSignatureUrl,
      academicCoordinator: data.academic_coordinator,
      officialSealText: data.official_seal_text,
      officialSealUrl: data.official_seal_url || data.settings_data?.officialSealUrl,
      bkashMerchant: data.bkash_merchant,
      nagadMerchant: data.nagad_merchant,
      rocketNumber: data.rocket_number,
      bankAccountName: data.bank_account_name,
      bankName: data.bank_name,
      bankBranch: data.bank_branch,
      bankAccountNumber: data.bank_account_number,
      bankRouting: data.bank_routing,
      ...(data.settings_data || {}),
    };
  } catch (e) {
    console.warn('loadInstituteSettingsFromDb caught:', e);
    return null;
  }
}

// ==========================================
// SUPABASE DATABASE FETCHERS & DELETION HELPERS
// ==========================================

export async function fetchStudentsFromDb(coachingId: string): Promise<Student[]> {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('coaching_id', coachingId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((d: any) => ({
      id: d.id,
      coachingId: d.coaching_id,
      rollNo: d.roll_no || '',
      name: d.name || '',
      email: d.email || '',
      phone: d.phone || '',
      guardianName: d.guardian_name || '',
      guardianPhone: d.guardian_phone || '',
      photo: d.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
      batchIds: Array.isArray(d.batch_ids) ? d.batch_ids : [],
      courseIds: Array.isArray(d.course_ids) ? d.course_ids : [],
      bloodGroup: d.blood_group || '',
      status: d.status || 'active',
      enrollmentDate: d.enrollment_date || d.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
      feesDue: Number(d.fees_due) || 0,
      address: d.address || '',
      gender: d.gender || 'male',
      dob: d.dob || '',
    }));
  } catch (e) {
    console.warn('fetchStudentsFromDb catch:', e);
    return [];
  }
}

export async function deleteStudentFromDb(id: string) {
  try {
    const { error } = await supabase.from('students').delete().eq('id', id);
    if (error) console.warn('Supabase deleteStudent error:', error.message);
  } catch (e) {
    console.warn('deleteStudentFromDb catch:', e);
  }
}

export async function fetchTeachersFromDb(coachingId: string): Promise<Teacher[]> {
  try {
    const { data, error } = await supabase
      .from('teachers')
      .select('*')
      .eq('coaching_id', coachingId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((d: any) => ({
      id: d.id,
      coachingId: d.coaching_id,
      name: d.name || '',
      email: d.email || '',
      phone: d.phone || '',
      designation: d.designation || '',
      photo: d.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      subjectSpecialization: d.subject_specialization || '',
      assignedBatchIds: Array.isArray(d.assigned_batch_ids) ? d.assigned_batch_ids : [],
      salaryType: d.salary_type || 'monthly',
      salaryAmount: Number(d.salary_amount) || 0,
      joiningDate: d.joining_date || '',
      status: d.status || 'active',
      education: d.education || '',
      signatureUrl: d.signature_url || '',
      hasLoginAccount: Boolean(d.has_login_account),
      isHeadTeacher: Boolean(d.is_head_teacher),
      permissions: Array.isArray(d.permissions) ? d.permissions : [],
    }));
  } catch (e) {
    console.warn('fetchTeachersFromDb catch:', e);
    return [];
  }
}

export async function syncTeacherToDb(teacher: Teacher) {
  try {
    const { error } = await supabase.from('teachers').upsert({
      id: teacher.id,
      coaching_id: teacher.coachingId || 'aac-dhaka-01',
      name: teacher.name,
      email: teacher.email,
      phone: teacher.phone,
      designation: teacher.designation,
      photo: teacher.photo,
      subject_specialization: teacher.subjectSpecialization,
      assigned_batch_ids: teacher.assignedBatchIds,
      salary_type: teacher.salaryType,
      salary_amount: teacher.salaryAmount,
      joining_date: teacher.joiningDate,
      status: teacher.status,
      education: teacher.education,
      signature_url: teacher.signatureUrl,
      has_login_account: teacher.hasLoginAccount,
      is_head_teacher: teacher.isHeadTeacher,
      permissions: teacher.permissions || [],
      updated_at: new Date().toISOString(),
    });
    if (error) console.warn('Supabase syncTeacher error:', error.message);
  } catch (e) {
    console.warn('syncTeacherToDb catch:', e);
  }
}

export async function deleteTeacherFromDb(id: string) {
  try {
    const { error } = await supabase.from('teachers').delete().eq('id', id);
    if (error) console.warn('Supabase deleteTeacher error:', error.message);
  } catch (e) {
    console.warn('deleteTeacherFromDb catch:', e);
  }
}

export async function fetchBatchesFromDb(coachingId: string): Promise<Batch[]> {
  try {
    const { data, error } = await supabase
      .from('batches')
      .select('*')
      .eq('coaching_id', coachingId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((d: any) => ({
      id: d.id,
      coachingId: d.coaching_id,
      code: d.code || '',
      name: d.name || '',
      courseId: d.course_id || '',
      teacherId: d.teacher_id || '',
      roomNumber: d.room_number || '',
      scheduleDays: Array.isArray(d.schedule_days) ? d.schedule_days : [],
      startTime: d.start_time || '',
      endTime: d.end_time || '',
      maxCapacity: Number(d.max_capacity) || 30,
      enrolledCount: Number(d.enrolled_count) || 0,
      status: d.status || 'running',
      startDate: d.start_date || '',
    }));
  } catch (e) {
    console.warn('fetchBatchesFromDb catch:', e);
    return [];
  }
}

export async function deleteBatchFromDb(id: string) {
  try {
    const { error } = await supabase.from('batches').delete().eq('id', id);
    if (error) console.warn('Supabase deleteBatch error:', error.message);
  } catch (e) {
    console.warn('deleteBatchFromDb catch:', e);
  }
}

export async function fetchCoursesFromDb(coachingId: string): Promise<Course[]> {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('coaching_id', coachingId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((d: any) => ({
      id: d.id,
      coachingId: d.coaching_id,
      code: d.code || '',
      title: d.title || '',
      category: d.category || '',
      description: d.description || '',
      durationWeeks: Number(d.duration_weeks) || 12,
      feeAmount: Number(d.fee_amount) || 0,
      unitsCount: Number(d.units_count) || 0,
      thumbnail: d.thumbnail || '',
      status: d.status || 'published',
    }));
  } catch (e) {
    console.warn('fetchCoursesFromDb catch:', e);
    return [];
  }
}

export async function syncCourseToDb(course: Course) {
  try {
    const { error } = await supabase.from('courses').upsert({
      id: course.id,
      coaching_id: course.coachingId || 'aac-dhaka-01',
      code: course.code,
      title: course.title,
      category: course.category,
      description: course.description,
      duration_weeks: course.durationWeeks,
      fee_amount: course.feeAmount,
      units_count: course.unitsCount,
      thumbnail: course.thumbnail,
      status: course.status,
      updated_at: new Date().toISOString(),
    });
    if (error) console.warn('Supabase syncCourse error:', error.message);
  } catch (e) {
    console.warn('syncCourseToDb catch:', e);
  }
}

export async function deleteCourseFromDb(id: string) {
  try {
    const { error } = await supabase.from('courses').delete().eq('id', id);
    if (error) console.warn('Supabase deleteCourse error:', error.message);
  } catch (e) {
    console.warn('deleteCourseFromDb catch:', e);
  }
}

export async function fetchAttendanceFromDb(coachingId: string): Promise<AttendanceRecord[]> {
  try {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('coaching_id', coachingId)
      .order('date', { ascending: false });

    if (error || !data) return [];

    return data.map((d: any) => ({
      id: d.id,
      coachingId: d.coaching_id,
      batchId: d.batch_id || '',
      date: d.date || '',
      studentId: d.student_id || '',
      status: d.status || 'present',
      remarks: d.remarks || '',
    }));
  } catch (e) {
    console.warn('fetchAttendanceFromDb catch:', e);
    return [];
  }
}

export async function fetchInvoicesFromDb(coachingId: string): Promise<FeeInvoice[]> {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('coaching_id', coachingId)
      .order('issue_date', { ascending: false });

    if (error || !data) return [];

    return data.map((d: any) => ({
      id: d.id,
      coachingId: d.coaching_id,
      invoiceNo: d.invoice_no || '',
      studentId: d.student_id || '',
      studentName: d.student_name || '',
      batchId: d.batch_id || '',
      batchName: d.batch_name || '',
      courseName: d.course_name || '',
      amount: Number(d.amount) || 0,
      paidAmount: Number(d.paid_amount) || 0,
      dueAmount: Number(d.due_amount) || 0,
      status: d.status || 'unpaid',
      issueDate: d.issue_date || '',
      dueDate: d.due_date || '',
      paymentMethod: d.payment_method || 'bKash',
    }));
  } catch (e) {
    console.warn('fetchInvoicesFromDb catch:', e);
    return [];
  }
}

export async function deleteInvoiceFromDb(id: string) {
  try {
    const { error } = await supabase.from('invoices').delete().eq('id', id);
    if (error) console.warn('Supabase deleteInvoice error:', error.message);
  } catch (e) {
    console.warn('deleteInvoiceFromDb catch:', e);
  }
}

export async function syncInvoiceToDb(invoice: FeeInvoice) {
  try {
    const { error } = await supabase.from('invoices').upsert({
      id: invoice.id,
      coaching_id: invoice.coachingId || 'aac-dhaka-01',
      invoice_no: invoice.invoiceNo,
      student_id: invoice.studentId,
      student_name: invoice.studentName,
      batch_id: invoice.batchId,
      batch_name: invoice.batchName,
      course_name: invoice.courseName,
      amount: invoice.amount,
      paid_amount: invoice.paidAmount,
      due_amount: invoice.dueAmount,
      status: invoice.status,
      issue_date: invoice.issueDate,
      due_date: invoice.dueDate,
      payment_method: invoice.paymentMethod,
      updated_at: new Date().toISOString(),
    });
    if (error) console.warn('Supabase syncInvoice error:', error.message);
  } catch (e) {
    console.warn('syncInvoiceToDb catch:', e);
  }
}

export async function fetchExamsFromDb(coachingId: string): Promise<Exam[]> {
  try {
    const { data, error } = await supabase
      .from('exams')
      .select('*')
      .eq('coaching_id', coachingId)
      .order('exam_date', { ascending: false });

    if (error || !data) return [];

    return data.map((d: any) => ({
      id: d.id,
      coachingId: d.coaching_id,
      title: d.title || '',
      courseId: d.course_id || '',
      batchId: d.batch_id || '',
      examDate: d.exam_date || '',
      totalMarks: Number(d.total_marks) || 100,
      passMarks: Number(d.pass_marks) || 40,
      examType: d.exam_type || 'Monthly Test',
    }));
  } catch (e) {
    console.warn('fetchExamsFromDb catch:', e);
    return [];
  }
}

export async function syncExamToDb(exam: Exam) {
  try {
    const { error } = await supabase.from('exams').upsert({
      id: exam.id,
      coaching_id: exam.coachingId || 'aac-dhaka-01',
      title: exam.title,
      course_id: exam.courseId,
      batch_id: exam.batchId,
      exam_date: exam.examDate,
      total_marks: exam.totalMarks,
      pass_marks: exam.passMarks,
      exam_type: exam.examType,
      updated_at: new Date().toISOString(),
    });
    if (error) console.warn('Supabase syncExam error:', error.message);
  } catch (e) {
    console.warn('syncExamToDb catch:', e);
  }
}

export async function deleteExamFromDb(id: string) {
  try {
    const { error } = await supabase.from('exams').delete().eq('id', id);
    if (error) console.warn('Supabase deleteExam error:', error.message);
  } catch (e) {
    console.warn('deleteExamFromDb catch:', e);
  }
}

export async function fetchExamMarksFromDb(coachingId: string): Promise<ExamMark[]> {
  try {
    const { data, error } = await supabase
      .from('exam_marks')
      .select('*')
      .eq('coaching_id', coachingId);

    if (error || !data) return [];

    return data.map((d: any) => ({
      id: d.id,
      examId: d.exam_id || '',
      studentId: d.student_id || '',
      studentName: d.student_name || '',
      rollNo: d.roll_no || '',
      marksObtained: Number(d.marks_obtained) || 0,
      grade: d.grade || '',
      remarks: d.remarks || '',
    }));
  } catch (e) {
    console.warn('fetchExamMarksFromDb catch:', e);
    return [];
  }
}

export async function syncExamMarksToDb(marks: ExamMark[], coachingId: string) {
  try {
    const rows = marks.map((m) => ({
      id: m.id,
      coaching_id: coachingId,
      exam_id: m.examId,
      student_id: m.studentId,
      student_name: m.studentName,
      roll_no: m.rollNo,
      marks_obtained: m.marksObtained,
      grade: m.grade,
      remarks: m.remarks,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await supabase.from('exam_marks').upsert(rows);
    if (error) console.warn('Supabase syncExamMarks error:', error.message);
  } catch (e) {
    console.warn('syncExamMarksToDb catch:', e);
  }
}

export async function deleteExamMarkFromDb(id: string) {
  try {
    const { error } = await supabase.from('exam_marks').delete().eq('id', id);
    if (error) console.warn('Supabase deleteExamMark error:', error.message);
  } catch (e) {
    console.warn('deleteExamMarkFromDb catch:', e);
  }
}

export async function fetchSmsLogsFromDb(coachingId: string): Promise<SmsLog[]> {
  try {
    const { data, error } = await supabase
      .from('sms_logs')
      .select('*')
      .eq('coaching_id', coachingId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error || !data) return [];

    return data.map((d: any) => ({
      id: d.id,
      coachingId: d.coaching_id,
      recipientName: d.recipient_name || '',
      recipientPhone: d.recipient_phone || '',
      message: d.message || '',
      gateway: d.gateway || 'android_sim1',
      status: d.status || 'delivered',
      timestamp: d.timestamp || '',
      cost: Number(d.cost) || 0,
    }));
  } catch (e) {
    console.warn('fetchSmsLogsFromDb catch:', e);
    return [];
  }
}

export async function deleteSmsLogFromDb(id: string) {
  try {
    const { error } = await supabase.from('sms_logs').delete().eq('id', id);
    if (error) console.warn('Supabase deleteSmsLog error:', error.message);
  } catch (e) {
    console.warn('deleteSmsLogFromDb catch:', e);
  }
}

export async function fetchSmsTemplatesFromDb(coachingId: string): Promise<SmsTemplate[]> {
  try {
    const { data, error } = await supabase
      .from('sms_templates')
      .select('*')
      .eq('coaching_id', coachingId);

    if (error || !data || data.length === 0) return [];

    return data.map((d: any) => ({
      id: d.id,
      title: d.title || '',
      category: d.category || 'general',
      eventType: d.event_type || '',
      contentBangla: d.content_bangla || '',
      contentEnglish: d.content_english || '',
      variables: Array.isArray(d.variables) ? d.variables : [],
      activeLanguage: d.active_language || 'bangla',
      content: d.content || d.content_bangla || '',
    }));
  } catch (e) {
    console.warn('fetchSmsTemplatesFromDb catch:', e);
    return [];
  }
}

export async function syncSmsTemplateToDb(template: SmsTemplate, coachingId: string) {
  try {
    const { error } = await supabase.from('sms_templates').upsert({
      id: template.id,
      coaching_id: coachingId,
      title: template.title,
      category: template.category,
      event_type: template.eventType,
      content_bangla: template.contentBangla,
      content_english: template.contentEnglish,
      variables: template.variables,
      active_language: template.activeLanguage,
      content: template.content,
      updated_at: new Date().toISOString(),
    });
    if (error) console.warn('Supabase syncSmsTemplate error:', error.message);
  } catch (e) {
    console.warn('syncSmsTemplateToDb catch:', e);
  }
}

export async function deleteSmsTemplateFromDb(id: string) {
  try {
    const { error } = await supabase.from('sms_templates').delete().eq('id', id);
    if (error) console.warn('Supabase deleteSmsTemplate error:', error.message);
  } catch (e) {
    console.warn('deleteSmsTemplateFromDb catch:', e);
  }
}

export async function fetchSyllabusFromDb(coachingId: string): Promise<SyllabusItem[]> {
  try {
    const { data, error } = await supabase
      .from('syllabus')
      .select('*')
      .eq('coaching_id', coachingId)
      .order('chapter_no', { ascending: true });

    if (error || !data) return [];

    return data.map((d: any) => ({
      id: d.id,
      coachingId: d.coaching_id,
      courseId: d.course_id || '',
      courseName: d.course_name || '',
      subject: d.subject || '',
      chapterNo: Number(d.chapter_no) || 1,
      chapterTitle: d.chapter_title || '',
      topics: Array.isArray(d.topics) ? d.topics : [],
      lectureHours: Number(d.lecture_hours) || 0,
      examMarks: Number(d.exam_marks) || 0,
      targetCompletionDate: d.target_completion_date || '',
      status: d.status || 'in_progress',
      assignedTeacherName: d.assigned_teacher_name || '',
      textbookReference: d.textbook_reference || '',
      remarks: d.remarks || '',
    }));
  } catch (e) {
    console.warn('fetchSyllabusFromDb catch:', e);
    return [];
  }
}

export async function syncSyllabusToDb(item: SyllabusItem, coachingId?: string) {
  try {
    const { error } = await supabase.from('syllabus').upsert({
      id: item.id,
      coaching_id: item.coachingId || coachingId || 'aac-dhaka-01',
      course_id: item.courseId,
      course_name: item.courseName,
      subject: item.subject,
      chapter_no: item.chapterNo,
      chapter_title: item.chapterTitle,
      topics: item.topics,
      lecture_hours: item.lectureHours,
      exam_marks: item.examMarks,
      target_completion_date: item.targetCompletionDate,
      status: item.status,
      assigned_teacher_name: item.assignedTeacherName,
      textbook_reference: item.textbookReference,
      remarks: item.remarks,
      updated_at: new Date().toISOString(),
    });
    if (error) console.warn('Supabase syncSyllabus error:', error.message);
  } catch (e) {
    console.warn('syncSyllabusToDb catch:', e);
  }
}

export async function deleteSyllabusFromDb(id: string) {
  try {
    const { error } = await supabase.from('syllabus').delete().eq('id', id);
    if (error) console.warn('Supabase deleteSyllabus error:', error.message);
  } catch (e) {
    console.warn('deleteSyllabusFromDb catch:', e);
  }
}

export async function fetchRoutineFromDb(coachingId: string): Promise<RoutineSlot[]> {
  try {
    const { data, error } = await supabase
      .from('routine')
      .select('*')
      .eq('coaching_id', coachingId);

    if (error || !data) return [];

    return data.map((d: any) => ({
      id: d.id,
      coachingId: d.coaching_id,
      batchId: d.batch_id || '',
      batchName: d.batch_name || '',
      day: d.day || 'Saturday',
      startTime: d.start_time || '',
      endTime: d.end_time || '',
      subject: d.subject || '',
      teacherId: d.teacher_id || '',
      teacherName: d.teacher_name || '',
      roomNumber: d.room_number || '',
      classType: d.class_type || 'theory',
    }));
  } catch (e) {
    console.warn('fetchRoutineFromDb catch:', e);
    return [];
  }
}

export async function syncRoutineToDb(slot: RoutineSlot, coachingId?: string) {
  try {
    const { error } = await supabase.from('routine').upsert({
      id: slot.id,
      coaching_id: slot.coachingId || coachingId || 'aac-dhaka-01',
      batch_id: slot.batchId,
      batch_name: slot.batchName,
      day: slot.day,
      start_time: slot.startTime,
      end_time: slot.endTime,
      subject: slot.subject,
      teacher_id: slot.teacherId,
      teacher_name: slot.teacherName,
      room_number: slot.roomNumber,
      class_type: slot.classType,
      updated_at: new Date().toISOString(),
    });
    if (error) console.warn('Supabase syncRoutine error:', error.message);
  } catch (e) {
    console.warn('syncRoutineToDb catch:', e);
  }
}

export async function deleteRoutineFromDb(id: string) {
  try {
    const { error } = await supabase.from('routine').delete().eq('id', id);
    if (error) console.warn('Supabase deleteRoutine error:', error.message);
  } catch (e) {
    console.warn('deleteRoutineFromDb catch:', e);
  }
}

// ==========================================
// TENANT DATA HYDRATOR ORCHESTRATOR
// ==========================================

export async function loadTenantDataFromSupabase(
  coachingId: string,
  callbacks?: {
    onStudents?: (data: Student[]) => void;
    onTeachers?: (data: Teacher[]) => void;
    onBatches?: (data: Batch[]) => void;
    onCourses?: (data: Course[]) => void;
    onAttendance?: (data: AttendanceRecord[]) => void;
    onInvoices?: (data: FeeInvoice[]) => void;
    onExams?: (data: Exam[]) => void;
    onExamMarks?: (data: ExamMark[]) => void;
    onSmsLogs?: (data: SmsLog[]) => void;
    onSmsTemplates?: (data: SmsTemplate[]) => void;
    onSyllabus?: (data: SyllabusItem[]) => void;
    onRoutine?: (data: RoutineSlot[]) => void;
  }
) {
  if (!coachingId) return;

  try {
    const [
      studentsRes,
      teachersRes,
      batchesRes,
      coursesRes,
      attendanceRes,
      invoicesRes,
      examsRes,
      examMarksRes,
      smsLogsRes,
      templatesRes,
      syllabusRes,
      routineRes,
    ] = await Promise.allSettled([
      fetchStudentsFromDb(coachingId),
      fetchTeachersFromDb(coachingId),
      fetchBatchesFromDb(coachingId),
      fetchCoursesFromDb(coachingId),
      fetchAttendanceFromDb(coachingId),
      fetchInvoicesFromDb(coachingId),
      fetchExamsFromDb(coachingId),
      fetchExamMarksFromDb(coachingId),
      fetchSmsLogsFromDb(coachingId),
      fetchSmsTemplatesFromDb(coachingId),
      fetchSyllabusFromDb(coachingId),
      fetchRoutineFromDb(coachingId),
    ]);

    if (studentsRes.status === 'fulfilled' && studentsRes.value && callbacks?.onStudents) {
      callbacks.onStudents(studentsRes.value);
    }
    if (teachersRes.status === 'fulfilled' && teachersRes.value && callbacks?.onTeachers) {
      callbacks.onTeachers(teachersRes.value);
    }
    if (batchesRes.status === 'fulfilled' && batchesRes.value && callbacks?.onBatches) {
      callbacks.onBatches(batchesRes.value);
    }
    if (coursesRes.status === 'fulfilled' && coursesRes.value && callbacks?.onCourses) {
      callbacks.onCourses(coursesRes.value);
    }
    if (attendanceRes.status === 'fulfilled' && attendanceRes.value && callbacks?.onAttendance) {
      callbacks.onAttendance(attendanceRes.value);
    }
    if (invoicesRes.status === 'fulfilled' && invoicesRes.value && callbacks?.onInvoices) {
      callbacks.onInvoices(invoicesRes.value);
    }
    if (examsRes.status === 'fulfilled' && examsRes.value && callbacks?.onExams) {
      callbacks.onExams(examsRes.value);
    }
    if (examMarksRes.status === 'fulfilled' && examMarksRes.value && callbacks?.onExamMarks) {
      callbacks.onExamMarks(examMarksRes.value);
    }
    if (smsLogsRes.status === 'fulfilled' && smsLogsRes.value && callbacks?.onSmsLogs) {
      callbacks.onSmsLogs(smsLogsRes.value);
    }
    if (templatesRes.status === 'fulfilled' && templatesRes.value.length > 0 && callbacks?.onSmsTemplates) {
      callbacks.onSmsTemplates(templatesRes.value);
    }
    if (syllabusRes.status === 'fulfilled' && syllabusRes.value && callbacks?.onSyllabus) {
      callbacks.onSyllabus(syllabusRes.value);
    }
    if (routineRes.status === 'fulfilled' && routineRes.value && callbacks?.onRoutine) {
      callbacks.onRoutine(routineRes.value);
    }
  } catch (e) {
    console.warn('loadTenantDataFromSupabase error:', e);
  }
}
