<script lang="ts">
  import { currentView, activeTab, currentRole, instituteSettings, refreshCurrentTenantDataFromDb, switchActiveTenant, currentTeacherPermissions, teachers } from './lib/store';
  import ToastContainer from './lib/components/ToastContainer.svelte';
  import { isModulePermitted } from './lib/permissions';

  // Landing Components
  import Navbar from './lib/landing/Navbar.svelte';
  import Hero from './lib/landing/Hero.svelte';
  import Features from './lib/landing/Features.svelte';
  import Pricing from './lib/landing/Pricing.svelte';
  import Testimonials from './lib/landing/Testimonials.svelte';
  import Footer from './lib/landing/Footer.svelte';
  import CheckoutModal from './lib/landing/CheckoutModal.svelte';

  // Auth Components
  import LoginView from './lib/auth/LoginView.svelte';
  import StepByStepRegisterView from './lib/auth/StepByStepRegisterView.svelte';

  // Dashboard Components
  import Sidebar from './lib/dashboard/Sidebar.svelte';
  import TopNav from './lib/dashboard/TopNav.svelte';
  import DashboardOverview from './lib/dashboard/DashboardOverview.svelte';
  import StudentsView from './lib/dashboard/StudentsView.svelte';
  import TeachersView from './lib/dashboard/TeachersView.svelte';
  import AcademicsView from './lib/dashboard/AcademicsView.svelte';
  import AttendanceView from './lib/dashboard/AttendanceView.svelte';
  import SmsHubView from './lib/dashboard/SmsHubView.svelte';
  import FeesView from './lib/dashboard/FeesView.svelte';
  import ExamsView from './lib/dashboard/ExamsView.svelte';
  import SettingsView from './lib/dashboard/SettingsView.svelte';
  import BulkIdCardsView from './lib/dashboard/BulkIdCardsView.svelte';
  import SmsTemplateManagerView from './lib/dashboard/SmsTemplateManagerView.svelte';
  import SyllabusRoutineView from './lib/dashboard/SyllabusRoutineView.svelte';
  import SaasAdminGatekeeper from './lib/saas/SaasAdminGatekeeper.svelte';

  import { onMount, onDestroy } from 'svelte';
  import { initSupabaseAuth } from './lib/supabase';
  import { initRouter, navigate } from './lib/router';
  import { subscribeToSmsQueueRealtime } from './lib/smsQueueApi';
  import { smsQueue } from './lib/store';
  import { LayoutDashboard, Users, CalendarClock, Smartphone, Grid, ShieldAlert, ArrowRight } from 'lucide-svelte';

  let isMobileSidebarOpen = false;

  function toggleMobileSidebar() {
    isMobileSidebarOpen = !isMobileSidebarOpen;
  }

  function closeMobileSidebar() {
    isMobileSidebarOpen = false;
  }

  let unsubRealtime: any = null;

  // List of candidate tabs to direct teacher if current activeTab is not permitted
  const candidateTabs = [
    { id: 'overview', slug: 'overview' },
    { id: 'attendance', slug: 'attendance' },
    { id: 'exams', slug: 'exams' },
    { id: 'syllabus_routine', slug: 'syllabus-routine' },
    { id: 'students', slug: 'students' },
    { id: 'academics', slug: 'academics' },
    { id: 'sms', slug: 'sms' },
    { id: 'idcards', slug: 'idcards' },
  ];

  $: hasTabAccess = isModulePermitted($activeTab, $currentTeacherPermissions, $currentRole);

  $: firstAllowedTab = candidateTabs.find((t) =>
    isModulePermitted(t.id, $currentTeacherPermissions, $currentRole)
  );

  function goToAllowedTab() {
    if (firstAllowedTab) {
      navigate(`/dashboard/${firstAllowedTab.slug}`);
    }
  }

  onMount(() => {
    initRouter();
    refreshCurrentTenantDataFromDb();
    initSupabaseAuth((user) => {
      if (user) {
        currentRole.set(user.role);
        if (user.role === 'teacher') {
          let perms = user.permissions || [];
          if (perms.length === 0) {
            const match = $teachers.find((t) => t.email?.toLowerCase() === user.email?.toLowerCase());
            if (match?.permissions && match.permissions.length > 0) {
              perms = match.permissions;
            }
          }
          currentTeacherPermissions.set(perms);
        } else {
          currentTeacherPermissions.set([]);
        }
        if (user.coaching_center_id) {
          switchActiveTenant(user.coaching_center_id);
        } else {
          refreshCurrentTenantDataFromDb();
        }
        if (user.institute_name) {
          instituteSettings.update((curr) => ({ ...curr, name: user.institute_name || curr.name }));
        }
        // If logged in, open direct dashboard without showing login page
        if (typeof window !== 'undefined') {
          const path = window.location.pathname;
          if (path === '/login' || path === '/signin' || path === '/dashboard' || path === '/dashboard/') {
            navigate('/dashboard/overview');
          }
        }
      } else {
        currentRole.set('institute_admin');
        currentTeacherPermissions.set([]);
        if (typeof window !== 'undefined') {
          const path = window.location.pathname;
          if (path.startsWith('/dashboard')) {
            navigate('/login');
          }
        }
      }
    });

    // Persistent Supabase Realtime Listener for SMS queue
    const unsubInstitute = instituteSettings.subscribe((s) => {
      const cid = s?.coachingCenterId || 'aac-dhaka-01';
      if (unsubRealtime) unsubRealtime();
      unsubRealtime = subscribeToSmsQueueRealtime(cid, (item, eventType) => {
        if (eventType === 'INSERT') {
          smsQueue.update((q) => [item, ...q.filter((x) => x.id !== item.id)]);
        } else if (eventType === 'UPDATE') {
          smsQueue.update((q) => q.map((x) => (x.id === item.id ? item : x)));
        } else if (eventType === 'DELETE') {
          smsQueue.update((q) => q.filter((x) => x.id !== item.id));
        }
      });
    });

    return () => {
      unsubInstitute();
      if (unsubRealtime) unsubRealtime();
    };
  });
</script>

<div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
  <!-- Toast Notification Layer -->
  <ToastContainer />

  <!-- 1. PUBLIC SAAS LANDING VIEW -->
  {#if $currentView === 'landing'}
    <div class="flex-1 flex flex-col">
      <Navbar />
      <main class="flex-1">
        <Hero />
        <Features />
        <Pricing />
        <Testimonials />
      </main>
      <Footer />
    </div>

  <!-- 2. LOGIN VIEW -->
  {:else if $currentView === 'login'}
    <LoginView />

  <!-- 3. STEP-BY-STEP REGISTER VIEW -->
  {:else if $currentView === 'register'}
    <StepByStepRegisterView />

  <!-- 4. SUBSCRIPTION BUY & CHECKOUT VIEW -->
  {:else if $currentView === 'checkout'}
    <CheckoutModal />

  <!-- 5. SAAS SUPER ADMIN DASHBOARD (PROTECTED) -->
  {:else if $currentView === 'saas_admin'}
    <SaasAdminGatekeeper activeTab={$activeTab} />

  <!-- 6. COACHING MANAGEMENT DASHBOARD -->
  {:else if $currentView === 'dashboard'}
    <div class="flex min-h-screen">
      <!-- Sidebar -->
      <Sidebar isMobileOpen={isMobileSidebarOpen} closeMobile={closeMobileSidebar} />

      <!-- Mobile Backdrop -->
      {#if isMobileSidebarOpen}
        <div
          role="presentation"
          class="fixed inset-0 z-20 bg-slate-950/80 backdrop-blur-sm md:hidden"
          on:click={closeMobileSidebar}
          on:keydown={() => {}}
        ></div>
      {/if}

      <!-- Main Content Area -->
      <div class="flex-1 flex flex-col md:pl-64 min-w-0 transition-all duration-300">
        <TopNav toggleMobile={toggleMobileSidebar} />

        <main class="flex-1 p-3 sm:p-6 lg:p-8 pb-24 md:pb-8 max-w-7xl w-full mx-auto">
          {#if !hasTabAccess && $currentRole === 'teacher'}
            <!-- Access Restricted View for Teacher with Limited Roles -->
            <div class="max-w-xl mx-auto my-12 p-8 rounded-3xl bg-slate-900 border border-rose-500/30 text-center space-y-5 shadow-2xl relative overflow-hidden animate-in fade-in">
              <div class="absolute -top-12 -right-12 w-44 h-44 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>
              <div class="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 mx-auto flex items-center justify-center shadow-lg">
                <ShieldAlert class="w-8 h-8" />
              </div>
              <div class="space-y-1">
                <h3 class="text-xl font-bold text-white font-['Outfit']">অ্যাক্সেস সংরক্ষিত / Access Restricted</h3>
                <p class="text-xs text-rose-300 font-medium">আপনার শিক্ষক অ্যাকাউন্টে এই মডিউলটি ব্যবহারের অনুমতি নেই</p>
              </div>
              <p class="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
                প্রতিষ্ঠানের সুপার অ্যাডমিন কর্তৃক আপনার শিক্ষক আইডিতে শুধুমাত্র নির্ধারিত ফিচারসমূহের সীমিত অ্যাক্সেস (Limited Role Permissions) কার্যকর করা হয়েছে।
              </p>
              {#if firstAllowedTab}
                <div class="pt-2">
                  <button
                    type="button"
                    class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all inline-flex items-center gap-2 shadow-lg shadow-indigo-600/30"
                    on:click={goToAllowedTab}
                  >
                    <span>অনুমোদিত ড্যাশবোর্ডে প্রবেশ করুন</span>
                    <ArrowRight class="w-4 h-4" />
                  </button>
                </div>
              {/if}
            </div>
          {:else if $activeTab === 'overview'}
            <DashboardOverview />
          {:else if $activeTab === 'students'}
            <StudentsView />
          {:else if $activeTab === 'idcards'}
            <BulkIdCardsView />
          {:else if $activeTab === 'teachers'}
            <TeachersView />
          {:else if $activeTab === 'academics'}
            <AcademicsView />
          {:else if $activeTab === 'syllabus_routine'}
            <SyllabusRoutineView />
          {:else if $activeTab === 'attendance'}
            <AttendanceView />
          {:else if $activeTab === 'sms'}
            <SmsHubView />
          {:else if $activeTab === 'sms_templates'}
            <SmsTemplateManagerView />
          {:else if $activeTab === 'fees'}
            <FeesView />
          {:else if $activeTab === 'exams'}
            <ExamsView />
          {:else if $activeTab === 'settings'}
            <SettingsView />
          {/if}
        </main>

        <!-- Android App Style Bottom Navigation Bar (md:hidden) -->
        <nav class="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-slate-900/95 border-t border-slate-800 backdrop-blur-xl px-2 py-1.5 flex items-center justify-around shadow-2xl">
          {#if isModulePermitted('overview', $currentTeacherPermissions, $currentRole)}
            <button
              type="button"
              class="flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all {$activeTab === 'overview' ? 'text-indigo-400 font-bold scale-105' : 'text-slate-400 hover:text-white'}"
              on:click={() => navigate('/dashboard/overview')}
            >
              <div class="relative">
                <LayoutDashboard class="w-5 h-5" />
                {#if $activeTab === 'overview'}
                  <span class="w-1 h-1 rounded-full bg-indigo-400 absolute -bottom-1 left-1/2 -translate-x-1/2"></span>
                {/if}
              </div>
              <span class="text-[10px]">হোম</span>
            </button>
          {/if}

          {#if isModulePermitted('students', $currentTeacherPermissions, $currentRole)}
            <button
              type="button"
              class="flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all {$activeTab === 'students' ? 'text-indigo-400 font-bold scale-105' : 'text-slate-400 hover:text-white'}"
              on:click={() => navigate('/dashboard/students')}
            >
              <div class="relative">
                <Users class="w-5 h-5" />
                {#if $activeTab === 'students'}
                  <span class="w-1 h-1 rounded-full bg-indigo-400 absolute -bottom-1 left-1/2 -translate-x-1/2"></span>
                {/if}
              </div>
              <span class="text-[10px]">শিক্ষার্থী</span>
            </button>
          {/if}

          {#if isModulePermitted('syllabus_routine', $currentTeacherPermissions, $currentRole)}
            <button
              type="button"
              class="flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all {$activeTab === 'syllabus_routine' ? 'text-indigo-400 font-bold scale-105' : 'text-slate-400 hover:text-white'}"
              on:click={() => navigate('/dashboard/syllabus-routine')}
            >
              <div class="relative">
                <CalendarClock class="w-5 h-5" />
                {#if $activeTab === 'syllabus_routine'}
                  <span class="w-1 h-1 rounded-full bg-indigo-400 absolute -bottom-1 left-1/2 -translate-x-1/2"></span>
                {/if}
              </div>
              <span class="text-[10px]">রুটিন</span>
            </button>
          {/if}

          {#if isModulePermitted('attendance', $currentTeacherPermissions, $currentRole) && !isModulePermitted('sms', $currentTeacherPermissions, $currentRole)}
            <button
              type="button"
              class="flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all {$activeTab === 'attendance' ? 'text-emerald-400 font-bold scale-105' : 'text-slate-400 hover:text-white'}"
              on:click={() => navigate('/dashboard/attendance')}
            >
              <div class="relative">
                <CalendarClock class="w-5 h-5" />
                {#if $activeTab === 'attendance'}
                  <span class="w-1 h-1 rounded-full bg-emerald-400 absolute -bottom-1 left-1/2 -translate-x-1/2"></span>
                {/if}
              </div>
              <span class="text-[10px]">হাজিরা</span>
            </button>
          {:else if isModulePermitted('sms', $currentTeacherPermissions, $currentRole)}
            <button
              type="button"
              class="flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all {$activeTab === 'sms' ? 'text-emerald-400 font-bold scale-105' : 'text-slate-400 hover:text-white'}"
              on:click={() => navigate('/dashboard/sms')}
            >
              <div class="relative">
                <Smartphone class="w-5 h-5" />
                {#if $activeTab === 'sms'}
                  <span class="w-1 h-1 rounded-full bg-emerald-400 absolute -bottom-1 left-1/2 -translate-x-1/2"></span>
                {/if}
              </div>
              <span class="text-[10px]">SMS হাব</span>
            </button>
          {/if}

          <button
            type="button"
            class="flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all text-slate-400 hover:text-white"
            on:click={toggleMobileSidebar}
          >
            <div class="relative">
              <Grid class="w-5 h-5" />
            </div>
            <span class="text-[10px]">মেনু কার্ড</span>
          </button>
        </nav>
      </div>
    </div>
  {/if}
</div>
