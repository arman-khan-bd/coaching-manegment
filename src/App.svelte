<script lang="ts">
  import { currentView, activeTab, currentRole, instituteSettings } from './lib/store';
  import ToastContainer from './lib/components/ToastContainer.svelte';

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
  import SaasAdminCreateView from './lib/saas/SaasAdminCreateView.svelte';

  import { onMount, onDestroy } from 'svelte';
  import { initSupabaseAuth } from './lib/supabase';
  import { initRouter, navigate } from './lib/router';
  import { subscribeToSmsQueueRealtime } from './lib/smsQueueApi';
  import { smsQueue } from './lib/store';
  import { LayoutDashboard, Users, CalendarClock, Smartphone, Grid } from 'lucide-svelte';

  let isMobileSidebarOpen = false;

  function toggleMobileSidebar() {
    isMobileSidebarOpen = !isMobileSidebarOpen;
  }

  function closeMobileSidebar() {
    isMobileSidebarOpen = false;
  }

  let unsubRealtime: any = null;

  onMount(() => {
    initRouter();
    initSupabaseAuth((user) => {
      if (user) {
        currentRole.set(user.role);
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

  <!-- 5b. SAAS ADMIN CREATE PAGE -->
  {:else if $currentView === 'saas_admin_create'}
    <SaasAdminCreateView />

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
          {#if $activeTab === 'overview'}
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
