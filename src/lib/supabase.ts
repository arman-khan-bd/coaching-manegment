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
  BookItem,
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

// ==========================================
// RESILIENT MULTI-TENANT SUPABASE ENGINE
// ==========================================

export async function safeUpsert(
  table: string,
  payload: any | any[],
  fallbackTable?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    let targetTable = table;
    let { error } = await supabase.from(targetTable).upsert(payload);

    // If primary table doesn't exist (PGRST205) and fallback table is provided
    if (error && (error.code === 'PGRST205' || error.message?.includes('not find the table')) && fallbackTable) {
      targetTable = fallbackTable;
      const res = await supabase.from(targetTable).upsert(payload);
      error = res.error;
    }

    // If column doesn't exist (e.g. coaching_id or custom fields before SQL migration is executed in Supabase)
    if (error && (error.code === 'PGRST204' || error.message?.includes('schema cache') || error.message?.includes('column'))) {
      console.warn(`[Supabase Safe Upsert] Column missing on ${targetTable}, retrying with standard schema:`, error.message);

      const cleanRow = (row: any) => {
        const copy = { ...row };
        delete copy.coaching_id;
        return copy;
      };

      const fallbackPayload = Array.isArray(payload) ? payload.map(cleanRow) : cleanRow(payload);
      const retryRes = await supabase.from(targetTable).upsert(fallbackPayload);
      if (!retryRes.error) {
        return { success: true };
      }
      error = retryRes.error;
    }

    if (error) {
      console.error(`[Supabase safeUpsert Error] on ${targetTable}:`, error.message, error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.error(`[Supabase safeUpsert Exception] on ${table}:`, err);
    return { success: false, error: err?.message || String(err) };
  }
}

export async function safeSelect(
  table: string,
  coachingId: string,
  fallbackTable?: string
): Promise<any[]> {
  try {
    let targetTable = table;
    let res = await supabase.from(targetTable).select('*').eq('coaching_id', coachingId);

    // If table doesn't exist (PGRST205) and fallback provided
    if (res.error && (res.error.code === 'PGRST205' || res.error.message?.includes('not find the table')) && fallbackTable) {
      targetTable = fallbackTable;
      res = await supabase.from(targetTable).select('*').eq('coaching_id', coachingId);
    }

    // If coaching_id column does not exist on table (PGRST204), query without filter so records are still returned
    if (res.error && (res.error.code === 'PGRST204' || res.error.message?.includes('coaching_id') || res.error.message?.includes('schema cache'))) {
      const target = (res.error.code === 'PGRST205' && fallbackTable) ? fallbackTable : targetTable;
      const fallbackRes = await supabase.from(target).select('*');
      if (!fallbackRes.error && fallbackRes.data) {
        return fallbackRes.data;
      }
    }

    if (res.error) {
      console.warn(`[Supabase safeSelect Notice] ${targetTable}:`, res.error.message);
      return [];
    }

    return res.data || [];
  } catch (err) {
    console.warn(`[Supabase safeSelect Exception] on ${table}:`, err);
    return [];
  }
}

// ----------------------------------------------------
// 1. STUDENTS
// ----------------------------------------------------
export async function syncStudentToDb(student: Student) {
  const payload = {
    id: student.id,
    coaching_id: student.coachingId || 'aac-dhaka-01',
    roll_no: student.rollNo,
    name: student.name,
    email: student.email || null,
    phone: student.phone || null,
    guardian_name: student.guardianName || null,
    guardian_phone: student.guardianPhone || null,
    blood_group: student.bloodGroup || null,
    status: student.status || 'active',
    fees_due: student.feesDue || 0,
    address: student.address || null,
    gender: student.gender || 'male',
    dob: student.dob || null,
    enrollment_date: student.enrollmentDate || null,
    photo: student.photo || null,
    batch_ids: student.batchIds || [],
    course_ids: student.courseIds || [],
    studying_institute: student.studyingInstitute || null,
    mother_name: student.motherName || null,
    mother_phone: student.motherPhone || null,
    father_name: student.fatherName || null,
    village: student.village || null,
    mess_or_hostel_name: student.messOrHostelName || null,
    friend_student_ids: student.friendStudentIds || [],
    sms_recipient_target: student.smsRecipientTarget || 'student',
    additional_guardian_name: student.additionalGuardianName || null,
    additional_guardian_phone: student.additionalGuardianPhone || null,
    additional_guardian_relation: student.additionalGuardianRelation || null,
    previous_gpa: student.previousGpa || null,
    notes: student.notes || null,
    updated_at: new Date().toISOString(),
  };
  return await safeUpsert('students', payload);
}

export async function fetchStudentsFromDb(coachingId: string): Promise<Student[]> {
  const data = await safeSelect('students', coachingId);
  return data.map((d: any) => ({
    id: d.id,
    coachingId: d.coaching_id || coachingId,
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
    studyingInstitute: d.studying_institute || '',
    motherName: d.mother_name || '',
    motherPhone: d.mother_phone || '',
    fatherName: d.father_name || '',
    village: d.village || '',
    messOrHostelName: d.mess_or_hostel_name || '',
    friendStudentIds: Array.isArray(d.friend_student_ids) ? d.friend_student_ids : [],
    smsRecipientTarget: d.sms_recipient_target || 'student',
    additionalGuardianName: d.additional_guardian_name || '',
    additionalGuardianPhone: d.additional_guardian_phone || '',
    additionalGuardianRelation: d.additional_guardian_relation || '',
    previousGpa: d.previous_gpa || '',
    notes: d.notes || '',
  }));
}

export async function deleteStudentFromDb(id: string) {
  try {
    const { error } = await supabase.from('students').delete().eq('id', id);
    if (error) console.warn('Supabase deleteStudent error:', error.message);
  } catch (e) {
    console.warn('deleteStudentFromDb catch:', e);
  }
}

// ----------------------------------------------------
// 2. TEACHERS
// ----------------------------------------------------
export async function syncTeacherToDb(teacher: Teacher) {
  const payload = {
    id: teacher.id,
    coaching_id: teacher.coachingId || 'aac-dhaka-01',
    name: teacher.name,
    email: teacher.email || null,
    phone: teacher.phone || null,
    designation: teacher.designation || null,
    photo: teacher.photo || null,
    subject_specialization: teacher.subjectSpecialization || null,
    assigned_batch_ids: teacher.assignedBatchIds || [],
    salary_type: teacher.salaryType || 'monthly',
    salary_amount: teacher.salaryAmount || 0,
    joining_date: teacher.joiningDate || null,
    status: teacher.status || 'active',
    education: teacher.education || null,
    signature_url: teacher.signatureUrl || null,
    has_login_account: Boolean(teacher.hasLoginAccount),
    is_head_teacher: Boolean(teacher.isHeadTeacher),
    permissions: teacher.permissions || [],
    updated_at: new Date().toISOString(),
  };
  return await safeUpsert('teachers', payload);
}

export async function fetchTeachersFromDb(coachingId: string): Promise<Teacher[]> {
  const data = await safeSelect('teachers', coachingId);
  return data.map((d: any) => ({
    id: d.id,
    coachingId: d.coaching_id || coachingId,
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
}

export async function deleteTeacherFromDb(id: string) {
  try {
    const { error } = await supabase.from('teachers').delete().eq('id', id);
    if (error) console.warn('Supabase deleteTeacher error:', error.message);
  } catch (e) {
    console.warn('deleteTeacherFromDb catch:', e);
  }
}

// ----------------------------------------------------
// 3. BATCHES
// ----------------------------------------------------
export async function syncBatchToDb(batch: Batch) {
  const payload = {
    id: batch.id,
    coaching_id: batch.coachingId || 'aac-dhaka-01',
    code: batch.code,
    name: batch.name,
    course_id: batch.courseId || null,
    teacher_id: batch.teacherId || null,
    room_number: batch.roomNumber || null,
    schedule_days: batch.scheduleDays || [],
    start_time: batch.startTime || null,
    end_time: batch.endTime || null,
    max_capacity: batch.maxCapacity || 30,
    enrolled_count: batch.enrolledCount || 0,
    status: batch.status || 'running',
    start_date: batch.startDate || null,
    updated_at: new Date().toISOString(),
  };
  return await safeUpsert('batches', payload);
}

export async function fetchBatchesFromDb(coachingId: string): Promise<Batch[]> {
  const data = await safeSelect('batches', coachingId);
  return data.map((d: any) => ({
    id: d.id,
    coachingId: d.coaching_id || coachingId,
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
}

export async function deleteBatchFromDb(id: string) {
  try {
    const { error } = await supabase.from('batches').delete().eq('id', id);
    if (error) console.warn('Supabase deleteBatch error:', error.message);
  } catch (e) {
    console.warn('deleteBatchFromDb catch:', e);
  }
}

// ----------------------------------------------------
// 4. COURSES
// ----------------------------------------------------
export async function syncCourseToDb(course: Course) {
  const payload = {
    id: course.id,
    coaching_id: course.coachingId || 'aac-dhaka-01',
    code: course.code,
    title: course.title,
    category: course.category || null,
    description: course.description || null,
    duration_weeks: course.durationWeeks || 12,
    fee_amount: course.feeAmount || 0,
    units_count: course.unitsCount || 0,
    thumbnail: course.thumbnail || null,
    status: course.status || 'published',
    updated_at: new Date().toISOString(),
  };
  return await safeUpsert('courses', payload);
}

export async function fetchCoursesFromDb(coachingId: string): Promise<Course[]> {
  const data = await safeSelect('courses', coachingId);
  return data.map((d: any) => ({
    id: d.id,
    coachingId: d.coaching_id || coachingId,
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
}

export async function deleteCourseFromDb(id: string) {
  try {
    const { error } = await supabase.from('courses').delete().eq('id', id);
    if (error) console.warn('Supabase deleteCourse error:', error.message);
  } catch (e) {
    console.warn('deleteCourseFromDb catch:', e);
  }
}

// ----------------------------------------------------
// 5. ATTENDANCE
// ----------------------------------------------------
export async function syncAttendanceToDb(record: AttendanceRecord) {
  const payload = {
    id: record.id,
    coaching_id: record.coachingId || 'aac-dhaka-01',
    batch_id: record.batchId,
    student_id: record.studentId,
    date: record.date,
    status: record.status,
    remarks: record.remarks || null,
    updated_at: new Date().toISOString(),
  };
  return await safeUpsert('attendance', payload);
}

export async function fetchAttendanceFromDb(coachingId: string): Promise<AttendanceRecord[]> {
  const data = await safeSelect('attendance', coachingId);
  return data.map((d: any) => ({
    id: d.id,
    coachingId: d.coaching_id || coachingId,
    batchId: d.batch_id || '',
    date: d.date || '',
    studentId: d.student_id || '',
    status: d.status || 'present',
    remarks: d.remarks || '',
  }));
}

// ----------------------------------------------------
// 6. INVOICES
// ----------------------------------------------------
export async function syncInvoiceToDb(invoice: FeeInvoice) {
  const payload = {
    id: invoice.id,
    coaching_id: invoice.coachingId || 'aac-dhaka-01',
    invoice_no: invoice.invoiceNo,
    student_id: invoice.studentId,
    student_name: invoice.studentName || null,
    batch_id: invoice.batchId || null,
    batch_name: invoice.batchName || null,
    course_name: invoice.courseName || null,
    amount: invoice.amount || 0,
    paid_amount: invoice.paidAmount || 0,
    due_amount: invoice.dueAmount || 0,
    status: invoice.status || 'unpaid',
    issue_date: invoice.issueDate || null,
    due_date: invoice.dueDate || null,
    payment_method: invoice.paymentMethod || 'Cash',
    updated_at: new Date().toISOString(),
  };
  return await safeUpsert('invoices', payload);
}

export async function fetchInvoicesFromDb(coachingId: string): Promise<FeeInvoice[]> {
  const data = await safeSelect('invoices', coachingId);
  return data.map((d: any) => ({
    id: d.id,
    coachingId: d.coaching_id || coachingId,
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
    paymentMethod: d.payment_method || 'Cash',
  }));
}

export async function deleteInvoiceFromDb(id: string) {
  try {
    const { error } = await supabase.from('invoices').delete().eq('id', id);
    if (error) console.warn('Supabase deleteInvoice error:', error.message);
  } catch (e) {
    console.warn('deleteInvoiceFromDb catch:', e);
  }
}

// ----------------------------------------------------
// 7. EXAMS
// ----------------------------------------------------
export async function syncExamToDb(exam: Exam) {
  const payload = {
    id: exam.id,
    coaching_id: exam.coachingId || 'aac-dhaka-01',
    title: exam.title,
    course_id: exam.courseId || null,
    batch_id: exam.batchId || null,
    exam_date: exam.examDate || null,
    total_marks: exam.totalMarks || 100,
    pass_marks: exam.passMarks || 40,
    exam_type: exam.examType || 'Monthly Test',
    updated_at: new Date().toISOString(),
  };
  return await safeUpsert('exams', payload);
}

export async function fetchExamsFromDb(coachingId: string): Promise<Exam[]> {
  const data = await safeSelect('exams', coachingId);
  return data.map((d: any) => ({
    id: d.id,
    coachingId: d.coaching_id || coachingId,
    title: d.title || '',
    courseId: d.course_id || '',
    batchId: d.batch_id || '',
    examDate: d.exam_date || '',
    totalMarks: Number(d.total_marks) || 100,
    passMarks: Number(d.pass_marks) || 40,
    examType: d.exam_type || 'Monthly Test',
  }));
}

export async function deleteExamFromDb(id: string) {
  try {
    const { error } = await supabase.from('exams').delete().eq('id', id);
    if (error) console.warn('Supabase deleteExam error:', error.message);
  } catch (e) {
    console.warn('deleteExamFromDb catch:', e);
  }
}

// ----------------------------------------------------
// 8. EXAM MARKS
// ----------------------------------------------------
export async function syncExamMarksToDb(marks: ExamMark[], coachingId?: string) {
  const cid = coachingId || 'aac-dhaka-01';
  const rows = marks.map((m) => ({
    id: m.id,
    coaching_id: cid,
    exam_id: m.examId,
    student_id: m.studentId,
    student_name: m.studentName || null,
    roll_no: m.rollNo || null,
    marks_obtained: m.marksObtained || 0,
    grade: m.grade || null,
    remarks: m.remarks || null,
    updated_at: new Date().toISOString(),
  }));
  return await safeUpsert('exam_marks', rows);
}

export async function fetchExamMarksFromDb(coachingId: string): Promise<ExamMark[]> {
  const data = await safeSelect('exam_marks', coachingId);
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
}

export async function deleteExamMarkFromDb(id: string) {
  try {
    const { error } = await supabase.from('exam_marks').delete().eq('id', id);
    if (error) console.warn('Supabase deleteExamMark error:', error.message);
  } catch (e) {
    console.warn('deleteExamMarkFromDb catch:', e);
  }
}

// ----------------------------------------------------
// 9. SMS LOGS
// ----------------------------------------------------
export async function syncSmsLogToDb(log: SmsLog) {
  const payload = {
    id: log.id,
    coaching_id: log.coachingId || 'aac-dhaka-01',
    recipient_name: log.recipientName || null,
    recipient_phone: log.recipientPhone,
    message: log.message,
    gateway: log.gateway || 'android_sim1',
    status: log.status || 'delivered',
    cost: log.cost || 0,
    timestamp: log.timestamp || '',
    created_at: new Date().toISOString(),
  };
  return await safeUpsert('sms_logs', payload);
}

export async function fetchSmsLogsFromDb(coachingId: string): Promise<SmsLog[]> {
  const data = await safeSelect('sms_logs', coachingId);
  return data.map((d: any) => ({
    id: d.id,
    coachingId: d.coaching_id || coachingId,
    recipientName: d.recipient_name || '',
    recipientPhone: d.recipient_phone || '',
    message: d.message || '',
    gateway: d.gateway || 'android_sim1',
    status: d.status || 'delivered',
    timestamp: d.timestamp || '',
    cost: Number(d.cost) || 0,
  }));
}

export async function deleteSmsLogFromDb(id: string) {
  try {
    const { error } = await supabase.from('sms_logs').delete().eq('id', id);
    if (error) console.warn('Supabase deleteSmsLog error:', error.message);
  } catch (e) {
    console.warn('deleteSmsLogFromDb catch:', e);
  }
}

// ----------------------------------------------------
// 10. SMS TEMPLATES
// ----------------------------------------------------
export async function syncSmsTemplateToDb(template: SmsTemplate, coachingId?: string) {
  const cid = coachingId || (template as any).coachingId || 'aac-dhaka-01';
  const payload = {
    id: template.id,
    coaching_id: cid,
    title: template.title,
    category: template.category || 'general',
    event_type: template.eventType || '',
    content_bangla: template.contentBangla || '',
    content_english: template.contentEnglish || '',
    variables: template.variables || [],
    active_language: template.activeLanguage || 'bangla',
    content: template.content || template.contentBangla || '',
    updated_at: new Date().toISOString(),
  };
  return await safeUpsert('sms_templates', payload);
}

export async function fetchSmsTemplatesFromDb(coachingId: string): Promise<SmsTemplate[]> {
  const data = await safeSelect('sms_templates', coachingId);
  if (!data || data.length === 0) return [];
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
}

export async function deleteSmsTemplateFromDb(id: string) {
  try {
    const { error } = await supabase.from('sms_templates').delete().eq('id', id);
    if (error) console.warn('Supabase deleteSmsTemplate error:', error.message);
  } catch (e) {
    console.warn('deleteSmsTemplateFromDb catch:', e);
  }
}

// ----------------------------------------------------
// 11. SYLLABUS
// ----------------------------------------------------
export async function syncSyllabusToDb(item: SyllabusItem, coachingId?: string) {
  const cid = item.coachingId || coachingId || 'aac-dhaka-01';
  const payload = {
    id: item.id,
    coaching_id: cid,
    course_id: item.courseId || null,
    course_name: item.courseName || null,
    subject: item.subject || null,
    chapter_no: item.chapterNo || 1,
    chapter_title: item.chapterTitle,
    topics: item.topics || [],
    lecture_hours: item.lectureHours || 0,
    exam_marks: item.examMarks || 0,
    target_completion_date: item.targetCompletionDate || null,
    status: item.status || 'in_progress',
    assigned_teacher_name: item.assignedTeacherName || null,
    textbook_reference: item.textbookReference || null,
    remarks: item.remarks || null,
    updated_at: new Date().toISOString(),
  };
  return await safeUpsert('syllabus_items', payload, 'syllabus');
}

export async function fetchSyllabusFromDb(coachingId: string): Promise<SyllabusItem[]> {
  const data = await safeSelect('syllabus_items', coachingId, 'syllabus');
  return data.map((d: any) => ({
    id: d.id,
    coachingId: d.coaching_id || coachingId,
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
}

export async function deleteSyllabusFromDb(id: string) {
  try {
    let { error } = await supabase.from('syllabus_items').delete().eq('id', id);
    if (error && error.code === 'PGRST205') {
      await supabase.from('syllabus').delete().eq('id', id);
    }
  } catch (e) {
    console.warn('deleteSyllabusFromDb catch:', e);
  }
}

// ----------------------------------------------------
// 12. ROUTINE
// ----------------------------------------------------
export async function syncRoutineToDb(slot: RoutineSlot, coachingId?: string) {
  const cid = slot.coachingId || coachingId || 'aac-dhaka-01';
  const payload = {
    id: slot.id,
    coaching_id: cid,
    batch_id: slot.batchId || null,
    batch_name: slot.batchName || null,
    day: slot.day || 'Saturday',
    start_time: slot.startTime || null,
    end_time: slot.endTime || null,
    subject: slot.subject || null,
    teacher_id: slot.teacherId || null,
    teacher_name: slot.teacherName || null,
    room_number: slot.roomNumber || null,
    class_type: slot.classType || 'theory',
    updated_at: new Date().toISOString(),
  };
  return await safeUpsert('routine_slots', payload, 'routine');
}

export async function fetchRoutineFromDb(coachingId: string): Promise<RoutineSlot[]> {
  const data = await safeSelect('routine_slots', coachingId, 'routine');
  return data.map((d: any) => ({
    id: d.id,
    coachingId: d.coaching_id || coachingId,
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
}

export async function deleteRoutineFromDb(id: string) {
  try {
    let { error } = await supabase.from('routine_slots').delete().eq('id', id);
    if (error && error.code === 'PGRST205') {
      await supabase.from('routine').delete().eq('id', id);
    }
  } catch (e) {
    console.warn('deleteRoutineFromDb catch:', e);
  }
}

// ----------------------------------------------------
// 12.5. BOOKS / BOOK LIST
// ----------------------------------------------------
export async function syncBookToDb(book: BookItem, coachingId?: string) {
  const cid = book.coachingId || coachingId || 'aac-dhaka-01';
  const payload = {
    id: book.id,
    coaching_id: cid,
    title: book.title,
    subject: book.subject || '',
    author: book.author || '',
    publisher: book.publisher || null,
    course_id: book.courseId || null,
    course_name: book.courseName || '',
    class_level: book.classLevel || '',
    edition: book.edition || '',
    price: Number(book.price) || 0,
    is_required: book.isRequired || 'mandatory',
    notes: book.notes || null,
    updated_at: new Date().toISOString(),
  };
  return await safeUpsert('books', payload);
}

export async function fetchBooksFromDb(coachingId: string): Promise<BookItem[]> {
  const data = await safeSelect('books', coachingId);
  return data.map((d: any) => ({
    id: d.id,
    coachingId: d.coaching_id || coachingId,
    title: d.title || '',
    subject: d.subject || '',
    author: d.author || '',
    publisher: d.publisher || '',
    courseId: d.course_id || '',
    courseName: d.course_name || '',
    classLevel: d.class_level || '',
    edition: d.edition || '',
    price: Number(d.price) || 0,
    isRequired: d.is_required || 'mandatory',
    notes: d.notes || '',
    createdAt: d.created_at || '',
    updatedAt: d.updated_at || '',
  }));
}

export async function deleteBookFromDb(id: string) {
  try {
    await supabase.from('books').delete().eq('id', id);
  } catch (e) {
    console.warn('deleteBookFromDb catch:', e);
  }
}

// ----------------------------------------------------
// 13. INSTITUTE SETTINGS & BRANDING
// ----------------------------------------------------
export async function syncInstituteSettingsToDb(settings: InstituteSettings) {
  try {
    const brandPayload = {
      id: 'primary_branch',
      coaching_center_id: settings.coachingCenterId || 'aac-dhaka-01',
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
    };

    await safeUpsert('coaching_branding', brandPayload);
    await safeUpsert('institute_settings', {
      id: 'main',
      coaching_center_id: settings.coachingCenterId || 'aac-dhaka-01',
      settings,
      updated_at: new Date().toISOString(),
    });
    return { success: true };
  } catch (e: any) {
    console.warn('Institute settings sync caught:', e);
    return { success: false, error: e?.message };
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

// ----------------------------------------------------
// 14. TENANT DATA HYDRATOR ORCHESTRATOR
// ----------------------------------------------------
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
    onBooks?: (data: BookItem[]) => void;
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
      booksRes,
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
      fetchBooksFromDb(coachingId),
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
    if (booksRes.status === 'fulfilled' && booksRes.value && callbacks?.onBooks) {
      callbacks.onBooks(booksRes.value);
    }
  } catch (e) {
    console.warn('loadTenantDataFromSupabase error:', e);
  }
}

// ----------------------------------------------------
// 15. SYNC ALL LOCAL DATA DIRECT TO SUPABASE
// ----------------------------------------------------
export async function syncAllLocalDataToSupabase(coachingId: string, data: {
  students?: Student[];
  teachers?: Teacher[];
  batches?: Batch[];
  courses?: Course[];
  attendance?: AttendanceRecord[];
  invoices?: FeeInvoice[];
  exams?: Exam[];
  examMarks?: ExamMark[];
  smsTemplates?: SmsTemplate[];
  syllabus?: SyllabusItem[];
  routine?: RoutineSlot[];
  books?: BookItem[];
  settings?: InstituteSettings;
}): Promise<{ success: boolean; synced: Record<string, number>; errors: string[] }> {
  const cid = coachingId || 'aac-dhaka-01';
  const synced: Record<string, number> = {};
  const errors: string[] = [];

  for (const s of data.students || []) {
    const res = await syncStudentToDb({ ...s, coachingId: cid });
    if (res.success) synced.students = (synced.students || 0) + 1;
    else if (res.error) errors.push(`Student (${s.name}): ${res.error}`);
  }

  for (const t of data.teachers || []) {
    const res = await syncTeacherToDb({ ...t, coachingId: cid });
    if (res.success) synced.teachers = (synced.teachers || 0) + 1;
    else if (res.error) errors.push(`Teacher (${t.name}): ${res.error}`);
  }

  for (const b of data.batches || []) {
    const res = await syncBatchToDb({ ...b, coachingId: cid });
    if (res.success) synced.batches = (synced.batches || 0) + 1;
    else if (res.error) errors.push(`Batch (${b.name}): ${res.error}`);
  }

  for (const c of data.courses || []) {
    const res = await syncCourseToDb({ ...c, coachingId: cid });
    if (res.success) synced.courses = (synced.courses || 0) + 1;
    else if (res.error) errors.push(`Course (${c.title}): ${res.error}`);
  }

  for (const a of data.attendance || []) {
    const res = await syncAttendanceToDb({ ...a, coachingId: cid });
    if (res.success) synced.attendance = (synced.attendance || 0) + 1;
  }

  for (const inv of data.invoices || []) {
    const res = await syncInvoiceToDb({ ...inv, coachingId: cid });
    if (res.success) synced.invoices = (synced.invoices || 0) + 1;
  }

  for (const ex of data.exams || []) {
    const res = await syncExamToDb({ ...ex, coachingId: cid });
    if (res.success) synced.exams = (synced.exams || 0) + 1;
  }

  if (data.examMarks && data.examMarks.length > 0) {
    const res = await syncExamMarksToDb(data.examMarks, cid);
    if (res.success) synced.examMarks = data.examMarks.length;
  }

  for (const tpl of data.smsTemplates || []) {
    const res = await syncSmsTemplateToDb(tpl, cid);
    if (res.success) synced.smsTemplates = (synced.smsTemplates || 0) + 1;
  }

  for (const syl of data.syllabus || []) {
    const res = await syncSyllabusToDb({ ...syl, coachingId: cid }, cid);
    if (res.success) synced.syllabus = (synced.syllabus || 0) + 1;
  }

  for (const rt of data.routine || []) {
    const res = await syncRoutineToDb({ ...rt, coachingId: cid }, cid);
    if (res.success) synced.routine = (synced.routine || 0) + 1;
  }

  for (const bk of data.books || []) {
    const res = await syncBookToDb({ ...bk, coachingId: cid }, cid);
    if (res.success) synced.books = (synced.books || 0) + 1;
  }

  if (data.settings) {
    await syncInstituteSettingsToDb({ ...data.settings, coachingCenterId: cid });
    synced.settings = 1;
  }

  return { success: errors.length === 0, synced, errors };
}
