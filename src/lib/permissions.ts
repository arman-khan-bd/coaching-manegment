export interface TeacherSubPermission {
  id: string;
  label: string;
  description: string;
}

export interface TeacherPermissionModule {
  id: string;
  label: string;
  tabSlug: string;
  description: string;
  iconName: string;
  subPermissions: TeacherSubPermission[];
}

export const TEACHER_PERMISSION_MODULES: TeacherPermissionModule[] = [
  {
    id: 'routine',
    label: 'রুটিন ও সময়সূচি (Routines & Schedule)',
    tabSlug: 'syllabus_routine',
    description: 'ক্লাসের সময়সূচি ও রুটিন দেখার ও পরিচালনা করার অনুমতি',
    iconName: 'CalendarClock',
    subPermissions: [
      {
        id: 'routine_view',
        label: 'রুটিন দেখুন (View Routine)',
        description: 'সকল ব্যাচের ক্লাসের সময়সূচি ও রুম নম্বর দেখতে পারবেন',
      },
      {
        id: 'routine_manage',
        label: 'রুটিন পরিবর্তন (Manage Routine)',
        description: 'নতুন রুটিন স্লট যোগ বা পরিবর্তন করতে পারবেন',
      },
    ],
  },
  {
    id: 'attendance',
    label: 'হাজিরা খাতা ও উপস্থিতি (Batch Attendance)',
    tabSlug: 'attendance',
    description: 'শিক্ষার্থীদের দৈনিক হাজিরা দেখা ও গ্রহণের অনুমতি',
    iconName: 'CalendarCheck',
    subPermissions: [
      {
        id: 'attendance_view',
        label: 'উপস্থিতি দেখুন (View Attendance)',
        description: 'শিক্ষার্থীদের উপস্থিতি রিপোর্ট ও সামারি দেখতে পারবেন',
      },
      {
        id: 'attendance_mark',
        label: 'শিক্ষার্থী হাজিরা নিন (Take Attendance)',
        description: 'দৈনিক ক্লাসে শিক্ষার্থীদের Present/Absent চিহ্নিত করতে পারবেন',
      },
    ],
  },
  {
    id: 'students',
    label: 'শিক্ষার্থী তালিকা (Students Management)',
    tabSlug: 'students',
    description: 'শিক্ষার্থীদের নাম, অভিভাবকের নম্বর ও তথ্য দেখা',
    iconName: 'Users',
    subPermissions: [
      {
        id: 'students_view',
        label: 'শিক্ষার্থী দেখুন (View Students)',
        description: 'শিক্ষার্থী প্রোফাইল, রক্তের গ্রুপ ও অভিভাবকের ফোন নম্বর দেখতে পারবেন',
      },
      {
        id: 'students_manage',
        label: 'শিক্ষার্থী তথ্য আপডেট (Edit Students)',
        description: 'শিক্ষার্থীর তথ্য পরিবর্তন ও নতুন শিক্ষার্থী যোগ করতে পারবেন',
      },
    ],
  },
  {
    id: 'academics',
    label: 'কোর্স ও ব্যাচ (Courses & Batches)',
    tabSlug: 'academics',
    description: 'অ্যাকাডেমিক কোর্স ও ব্যাচের তথ্য দেখার অনুমতি',
    iconName: 'BookOpen',
    subPermissions: [
      {
        id: 'academics_view',
        label: 'কোর্স ও ব্যাচ দেখুন (View Batches)',
        description: 'নির্ধারিত কোর্স, ব্যাচের শিডিউল ও ধারণক্ষমতা দেখতে পারবেন',
      },
      {
        id: 'academics_manage',
        label: 'ব্যাচ পরিচালনা (Manage Batches)',
        description: 'ব্যাচের বিবরণ ও স্টাডি উপাদান পরিবর্তন করতে পারবেন',
      },
    ],
  },
  {
    id: 'syllabus',
    label: 'সিলেবাস ও লেকচার ট্র্যাকার (Syllabus Tracker)',
    tabSlug: 'syllabus_routine',
    description: 'পাঠপরিকল্পনা ও অধ্যায়ভিত্তিক সিলেবাসের অগ্রগতি',
    iconName: 'FileText',
    subPermissions: [
      {
        id: 'syllabus_view',
        label: 'সিলেবাস দেখুন (View Syllabus)',
        description: 'কোর্সের অধ্যায় ও লেকচার ট্র্যাকার দেখতে পারবেন',
      },
      {
        id: 'syllabus_manage',
        label: 'অধ্যায় সম্পন্ন মার্ক করুন (Update Syllabus)',
        description: 'অধ্যায় বা লেকচার সম্পন্ন হয়েছে বলে আপডেট করতে পারবেন',
      },
    ],
  },
  {
    id: 'exams',
    label: 'পরীক্ষা ও রেজাল্ট (Exams & Marks Grading)',
    tabSlug: 'exams',
    description: 'মডেল টেস্ট গ্রহণ, নম্বর এন্ট্রি ও ফলাফল প্রস্তুত',
    iconName: 'Award',
    subPermissions: [
      {
        id: 'exams_view',
        label: 'পরীক্ষা ও রেজাল্ট দেখুন (View Exams)',
        description: 'পরীক্ষার সময়সূচি ও গ্রেডশিট দেখতে পারবেন',
      },
      {
        id: 'exams_create',
        label: 'পরীক্ষা তৈরি করুন (Create Exams)',
        description: 'নতুন মডেল টেস্ট বা মূল্যায়ন পরীক্ষা তৈরি করতে পারবেন',
      },
      {
        id: 'marks_submit',
        label: 'নম্বর প্রদান ও গ্রেডিং (Submit Marks)',
        description: 'শিক্ষার্থীদের প্রাপ্ত নম্বর এন্ট্রি ও ফলাফল অনুমোদন করতে পারবেন',
      },
    ],
  },
  {
    id: 'sms',
    label: 'এসএমএস ও নোটিশ (SMS Communication)',
    tabSlug: 'sms',
    description: 'ক্লাসের জরুরি নোটিশ ও উপস্থিতি বার্তা পাঠানো',
    iconName: 'Smartphone',
    subPermissions: [
      {
        id: 'sms_send',
        label: 'ব্যাচ SMS পাঠান (Send Batch SMS)',
        description: 'শিক্ষার্থী ও অভিভাবকদের নোটিশ SMS পাঠাতে পারবেন',
      },
    ],
  },
  {
    id: 'idcards',
    label: 'আইডি কার্ড স্টুডিও (ID Cards Studio)',
    tabSlug: 'idcards',
    description: 'শিক্ষার্থী আইডি কার্ড দেখা ও প্রিন্ট করা',
    iconName: 'QrCode',
    subPermissions: [
      {
        id: 'idcards_view',
        label: 'আইডি কার্ড প্রিন্ট (View & Print ID)',
        description: 'শিক্ষার্থীদের ডিজিটাল আইডি কার্ড দেখতে ও প্রিন্ট করতে পারবেন',
      },
    ],
  },
  {
    id: 'overview',
    label: 'ড্যাশবোর্ড ওভারভিউ (Dashboard Overview)',
    tabSlug: 'overview',
    description: 'ড্যাশবোর্ডের প্রধান হোম স্ক্রিন ও দ্রুত পরিসংখ্যান',
    iconName: 'LayoutDashboard',
    subPermissions: [
      {
        id: 'overview_view',
        label: 'ওভারভিউ দেখুন (View Overview)',
        description: 'ড্যাশবোর্ড হোম ও অ্যাকাডেমিক চার্ট দেখতে পারবেন',
      },
    ],
  },
];

export const TEACHER_PERMISSION_PRESETS: {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}[] = [
  {
    id: 'all',
    name: 'সব অ্যাক্সেস (Full Teacher Access)',
    description: 'সবগুলো অ্যাকাডেমিক মডিউল ও সাব-অ্যাক্সেস সক্রিয় থাকবে',
    permissions: getAllTeacherPermissionIds(),
  },
  {
    id: 'standard',
    name: 'স্ট্যান্ডার্ড শিক্ষক (Standard Faculty)',
    description: 'রুটিন, উপস্থিতি, শিক্ষার্থী ও সিলেবাস দেখা ও পরীক্ষার নম্বর প্রদান',
    permissions: [
      'overview_view',
      'routine_view',
      'attendance_view',
      'attendance_mark',
      'students_view',
      'academics_view',
      'syllabus_view',
      'syllabus_manage',
      'exams_view',
      'marks_submit',
    ],
  },
  {
    id: 'attendance_marks',
    name: 'শুধুমাত্র উপস্থিতি ও রেজাল্ট (Attendance & Marks Only)',
    description: 'দৈনিক ক্লাসের হাজিরা গ্রহণ ও পরীক্ষার খাতা মূল্যায়ন',
    permissions: [
      'overview_view',
      'routine_view',
      'attendance_view',
      'attendance_mark',
      'exams_view',
      'marks_submit',
    ],
  },
  {
    id: 'view_only',
    name: 'শুধুমাত্র তথ্য দর্শন (View Only Academic)',
    description: 'রুটিন, সিলেবাস ও কোর্স কেবল দেখতে পারবেন, পরিবর্তন করতে পারবেন না',
    permissions: [
      'overview_view',
      'routine_view',
      'syllabus_view',
      'academics_view',
      'students_view',
      'exams_view',
    ],
  },
];

export function getAllTeacherPermissionIds(): string[] {
  return TEACHER_PERMISSION_MODULES.flatMap((m) => m.subPermissions.map((s) => s.id));
}

/**
 * Checks if a specific tab/module is permitted for the given role and permissions.
 */
export function isModulePermitted(
  tabSlug: string,
  userPermissions: string[] | undefined | null,
  userRole: string | undefined | null
): boolean {
  // If user is institute admin or super admin, grant unconditional access
  if (userRole !== 'teacher') return true;

  // Settings & Faculty/Teachers view are strictly admin-only
  if (tabSlug === 'settings' || tabSlug === 'teachers' || tabSlug === 'fees') {
    // If fees_view is specifically granted, allow fees tab
    if (tabSlug === 'fees' && Array.isArray(userPermissions) && userPermissions.includes('fees_view')) {
      return true;
    }
    return false;
  }

  const perms = Array.isArray(userPermissions) ? userPermissions : [];

  // If no permissions specified at all, default to basic view
  if (perms.length === 0) {
    return tabSlug === 'overview' || tabSlug === 'syllabus_routine';
  }

  // Overview
  if (tabSlug === 'overview') {
    return perms.includes('overview_view') || perms.length > 0;
  }

  // Find modules matching this tabSlug
  const matchingModules = TEACHER_PERMISSION_MODULES.filter((m) => m.tabSlug === tabSlug);
  if (matchingModules.length === 0) return false;

  return matchingModules.some((m) =>
    m.subPermissions.some((s) => perms.includes(s.id))
  );
}

/**
 * Checks if a specific sub-permission is granted.
 */
export function hasSubPermission(
  permissionId: string,
  userPermissions: string[] | undefined | null,
  userRole: string | undefined | null
): boolean {
  if (userRole !== 'teacher') return true;
  const perms = Array.isArray(userPermissions) ? userPermissions : [];
  return perms.includes(permissionId);
}
