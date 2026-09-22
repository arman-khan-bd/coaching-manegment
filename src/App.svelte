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

  import { onMount } from 'svelte';
  import { initSupabaseAuth } from './lib/supabase';
  import { initRouter } from './lib/router';

  let isMobileSidebarOpen = false;

  function toggleMobileSidebar() {
    isMobileSidebarOpen = !isMobileSidebarOpen;
  }

  function closeMobileSidebar() {
    isMobileSidebarOpen = false;
  }

  onMount(() => {
    initRouter();
    initSupabaseAuth((user) => {
      if (user) {
        currentRole.set(user.role);
        if (user.institute_name) {
          instituteSettings.update((curr) => ({ ...curr, name: user.institute_name || curr.name }));
        }
      }
    });
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

  <!-- 4. COACHING MANAGEMENT DASHBOARD -->
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

        <main class="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
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
      </div>
    </div>
  {/if}
</div>
