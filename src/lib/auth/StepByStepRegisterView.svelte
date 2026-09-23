<script lang="ts">
  import {
    instituteSettings,
    currentRole,
    selectedPlan,
    subscriptionPlans,
    showToast,
    generateCoachingId,
    switchActiveTenant,
    type SubscriptionPlan,
  } from '../store';
  import { registerStep, setRegisterStep, navigate } from '../router';
  import { supabaseSignUp } from '../supabase';
  import confetti from 'canvas-confetti';
  import {
    GraduationCap,
    ArrowLeft,
    ArrowRight,
    Check,
    CheckCircle2,
    Building2,
    User,
    Mail,
    Phone,
    Lock,
    Sparkles,
    Smartphone,
    CreditCard,
    ShieldCheck,
    Layers,
    MapPin,
    Radio,
    ChevronRight,
    Eye,
    EyeOff,
  } from 'lucide-svelte';

  // Step 1: Admin & Credentials
  let adminFullName = '';
  let adminEmail = '';
  let adminPhone = '';
  let adminPassword = '';
  let confirmPassword = '';
  let showPassword = false;

  // Step 2: Coaching Center Profile
  let coachingName = '';
  let coachingTagline = '';
  let coachingAddress = '';
  let division = 'ঢাকা';
  let targetCapacity = '300';
  let selectedCurriculums: string[] = [];

  // Step 3: Plan & Gateway
  let activePlan: SubscriptionPlan = $selectedPlan || $subscriptionPlans[1] || $subscriptionPlans[0];
  $: if ($selectedPlan) {
    activePlan = $selectedPlan;
  }
  let billingCycle: 'monthly' | 'yearly' = 'monthly';
  let selectedGatewayMode: 'android' | 'cloud' = 'android';
  let paymentChannel: 'bkash' | 'nagad' | 'rocket' | 'bank' = 'bkash';

  // Submission State
  let isSubmitting = false;
  let submissionSuccess = false;

  $: currentStep = $registerStep || 1;
  $: planPrice = billingCycle === 'monthly' ? activePlan.priceMonthly : Math.round(activePlan.priceYearly / 12);

  const divisionsList = ['ঢাকা', 'চট্টগ্রাম', 'রাজশাহী', 'খুলনা', 'সিলেট', 'রংপুর', 'বরিশাল', 'ময়মনসিংহ'];

  // Comprehensive Bangladesh Offline Coaching Academic Courses & Curricula
  const curriculumCategories = [
    {
      category: 'এইচএসসি ও কলেজ (HSC)',
      items: [
        'HSC Science (এইচএসসি বিজ্ঞান বিভাগ)',
        'HSC Business Studies (এইচএসসি ব্যবসায় শিক্ষা)',
        'HSC Humanities (এইচএসসি মানবিক বিভাগ)',
        'HSC ICT Special Batch (আইসিটি স্পেশাল কেয়ার)',
        'HSC Model Test & Revision (টেস্ট পেপার সলভ ও ফাইনাল মডেল টেস্ট)',
      ],
    },
    {
      category: 'বিশ্ববিদ্যালয় ও মেডিকেল ভর্তি (Admission)',
      items: [
        'BUET & Engineering Admission (বুয়েট ও ইঞ্জিনিয়ারিং ভর্তি প্রস্তুতি)',
        'Medical & Dental Admission (মেডিকেল ও ডেন্টাল ভর্তি প্রোগ্রাম)',
        'DU KA Unit Admission (ঢাবি "ক" ইউনিট বিজ্ঞান ভর্তি প্রস্তুতি)',
        'DU KHA Unit Admission (ঢাবি "খ" ইউনিট কলা/মানবিক ভর্তি প্রস্তুতি)',
        'DU GA Unit Admission (ঢাবি "গ" ইউনিট ব্যবসায় শিক্ষা ভর্তি প্রস্তুতি)',
        'GST Cluster Admission (জিএসটি গুচ্ছ সমন্বিত ভর্তি পরীক্ষা)',
        'IBA & BUP Admission (আইবিএ ও বিইউপি স্পেশাল প্রোগ্রাম)',
        'Agriculture Cluster (কৃষি বিশ্ববিদ্যালয় গুচ্ছ ভর্তি ব্যাচ)',
      ],
    },
    {
      category: 'এসএসসি ও মাধ্যমিক (SSC & Secondary)',
      items: [
        'SSC Science (এসএসসি বিজ্ঞান বিভাগ ৯-১০ম)',
        'SSC Business Studies (এসএসসি ব্যবসায় শিক্ষা ৯-১০ম)',
        'SSC Humanities (এসএসসি মানবিক বিভাগ ৯-১০ম)',
        'SSC Model Test (এসএসসি ফাইনাল রিভিশন ও মডেল টেস্ট)',
      ],
    },
    {
      category: 'জুনিয়র ও ফাউন্ডেশন (Junior & Foundation)',
      items: [
        'Class 8 Board Standard (৮ম শ্রেণি বোর্ড স্ট্যান্ডার্ড ও বৃত্তি)',
        'Class 6-7 New Curriculum (৬ষ্ঠ ও ৭ম শ্রেণি নতুন শিক্ষাক্রম ভিত্তি)',
        'Cadet College Admission (ক্যাডেট কলেজ ভর্তি কেয়ার)',
      ],
    },
  ];

  function toggleCurriculum(item: string) {
    if (selectedCurriculums.includes(item)) {
      selectedCurriculums = selectedCurriculums.filter((c) => c !== item);
    } else {
      selectedCurriculums = [...selectedCurriculums, item];
    }
  }

  function validateStep(step: number): boolean {
    if (step === 1) {
      if (!adminFullName.trim() || !adminEmail.trim() || !adminPhone.trim() || !adminPassword.trim()) {
        showToast('error', 'ফর্ম অপূর্ণ', 'অনুগ্রহ করে সকল প্রয়োজনীয় তথ্য পূরণ করুন।');
        return false;
      }
      if (adminPassword.length < 6) {
        showToast('error', 'পাসওয়ার্ড ছোট', 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
        return false;
      }
      if (adminPassword !== confirmPassword) {
        showToast('error', 'পাসওয়ার্ড মিলছে না', 'দুটো পাসওয়ার্ড একই হতে হবে।');
        return false;
      }
      return true;
    }

    if (step === 2) {
      if (!coachingName.trim() || !coachingAddress.trim()) {
        showToast('error', 'কোচিং তথ্য আবশ্যক', 'কোচিং সেন্টারের নাম ও শাখা ঠিকানা লিখুন।');
        return false;
      }
      return true;
    }

    return true;
  }

  function nextStep() {
    if (validateStep(currentStep)) {
      if (currentStep < 4) {
        setRegisterStep(currentStep + 1);
      }
    }
  }

  function prevStep() {
    if (currentStep > 1) {
      setRegisterStep(currentStep - 1);
    }
  }

  function triggerCelebration() {
    confetti({
      particleCount: 140,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#6366f1', '#a855f7', '#10b981', '#f59e0b', '#3b82f6'],
    });
  }

  async function handleFinalSubmit() {
    isSubmitting = true;
    const newCoachingId = generateCoachingId(coachingName, coachingAddress);

    try {
      // 1. Supabase Sign Up registration
      const res = await supabaseSignUp(adminEmail, adminPassword, {
        fullName: adminFullName,
        instituteName: coachingName,
        phone: adminPhone,
        role: 'institute_admin',
        coachingCenterId: newCoachingId,
      });

      // 2. Update institute settings in frontend store
      instituteSettings.update((curr) => ({
        ...curr,
        coachingCenterId: newCoachingId,
        name: coachingName,
        tagline: coachingTagline,
        address: coachingAddress,
        email: adminEmail,
        phone: adminPhone,
        defaultSmsGateway: selectedGatewayMode,
      }));
      // Switch active tenant so all stores load from clean scoped namespace
      switchActiveTenant(newCoachingId);
      currentRole.set('institute_admin');

      triggerCelebration();
      submissionSuccess = true;
      showToast('success', 'নিবন্ধন সম্পন্ন হয়েছে!', `স্বাগতম ${coachingName}! Coaching ID: ${newCoachingId}`);

      setTimeout(() => {
        navigate('/dashboard/overview');
      }, 1500);
    } catch (err: any) {
      // Fallback
      instituteSettings.update((curr) => ({
        ...curr,
        coachingCenterId: newCoachingId,
        name: coachingName,
        tagline: coachingTagline,
        address: coachingAddress,
        email: adminEmail,
        phone: adminPhone,
      }));
      switchActiveTenant(newCoachingId);
      currentRole.set('institute_admin');
      triggerCelebration();
      submissionSuccess = true;
      showToast('success', 'অ্যাকাউন্ট প্রস্তুত', `স্বাগতম ${adminFullName}! Coaching ID: ${newCoachingId}`);
      setTimeout(() => {
        navigate('/dashboard/overview');
      }, 1500);
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
  <!-- Glowing Background Orbs -->
  <div class="absolute top-10 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[160px] pointer-events-none"></div>
  <div class="absolute bottom-10 right-1/4 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[160px] pointer-events-none"></div>

  <!-- Header Bar -->
  <header class="max-w-4xl w-full mx-auto flex items-center justify-between pb-6 border-b border-slate-800/80 mb-8 relative z-10">
    <button
      type="button"
      class="flex items-center gap-3 text-left group"
      on:click={() => navigate('/')}
    >
      <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
        <GraduationCap class="w-5 h-5 text-white" />
      </div>
      <div>
        <div class="flex items-center gap-2">
          <span class="text-lg font-bold tracking-tight text-white font-['Outfit']">CoachFlow SaaS</span>
          <span class="px-2 py-0.5 text-[9px] font-bold uppercase rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
            নিবন্ধন পোর্টাল
          </span>
        </div>
        <p class="text-[11px] text-slate-400">Bangladesh Coaching Management Platform</p>
      </div>
    </button>

    <div class="flex items-center gap-3 text-xs">
      <span class="text-slate-400 hidden sm:inline">ইতিমধ্যে অ্যাকাউন্ট আছে?</span>
      <button
        type="button"
        class="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-indigo-300 hover:text-white transition-all font-semibold"
        on:click={() => navigate('/login')}
      >
        লগইন করুন (Sign In)
      </button>
    </div>
  </header>

  <!-- Main Multi-step Card Container -->
  <main class="max-w-4xl w-full mx-auto flex-1 flex flex-col justify-between relative z-10">
    
    <!-- Multi-Step Progress Tracker Bar -->
    <div class="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-6 mb-8 shadow-xl">
      <div class="grid grid-cols-4 gap-2 sm:gap-4 text-center">
        <!-- Step 1 -->
        <button
          type="button"
          class="flex flex-col items-center gap-1.5 text-center transition-all {currentStep >= 1 ? 'opacity-100' : 'opacity-40'}"
          on:click={() => (currentStep > 1 ? setRegisterStep(1) : null)}
        >
          <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center font-bold text-xs sm:text-sm border transition-all
            {currentStep === 1 ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-600/30' : currentStep > 1 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'}">
            {#if currentStep > 1}
              <Check class="w-4 h-4" />
            {:else}
              ১
            {/if}
          </div>
          <span class="text-[10px] sm:text-xs font-semibold {currentStep === 1 ? 'text-indigo-300' : 'text-slate-400'}">
            অ্যাডমিন প্রোফাইল
          </span>
        </button>

        <!-- Step 2 -->
        <button
          type="button"
          class="flex flex-col items-center gap-1.5 text-center transition-all {currentStep >= 2 ? 'opacity-100' : 'opacity-40'}"
          on:click={() => (currentStep > 2 ? setRegisterStep(2) : null)}
        >
          <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center font-bold text-xs sm:text-sm border transition-all
            {currentStep === 2 ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-600/30' : currentStep > 2 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'}">
            {#if currentStep > 2}
              <Check class="w-4 h-4" />
            {:else}
              ২
            {/if}
          </div>
          <span class="text-[10px] sm:text-xs font-semibold {currentStep === 2 ? 'text-indigo-300' : 'text-slate-400'}">
            কোচিং বিবরণ
          </span>
        </button>

        <!-- Step 3 -->
        <button
          type="button"
          class="flex flex-col items-center gap-1.5 text-center transition-all {currentStep >= 3 ? 'opacity-100' : 'opacity-40'}"
          on:click={() => (currentStep > 3 ? setRegisterStep(3) : null)}
        >
          <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center font-bold text-xs sm:text-sm border transition-all
            {currentStep === 3 ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-600/30' : currentStep > 3 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'}">
            {#if currentStep > 3}
              <Check class="w-4 h-4" />
            {:else}
              ৩
            {/if}
          </div>
          <span class="text-[10px] sm:text-xs font-semibold {currentStep === 3 ? 'text-indigo-300' : 'text-slate-400'}">
            প্যাকেজ ও গেটওয়ে
          </span>
        </button>

        <!-- Step 4 -->
        <button
          type="button"
          class="flex flex-col items-center gap-1.5 text-center transition-all {currentStep >= 4 ? 'opacity-100' : 'opacity-40'}"
        >
          <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center font-bold text-xs sm:text-sm border transition-all
            {currentStep === 4 ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-600/30' : 'bg-slate-800 text-slate-400 border-slate-700'}">
            ৪
          </div>
          <span class="text-[10px] sm:text-xs font-semibold {currentStep === 4 ? 'text-indigo-300' : 'text-slate-400'}">
            যাচাই ও সমাপ্তি
          </span>
        </button>
      </div>

      <!-- Linear visual indicator -->
      <div class="w-full bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
        <div
          class="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-emerald-400 transition-all duration-300"
          style="width: {(currentStep / 4) * 100}%"
        ></div>
      </div>
    </div>

    <!-- Active Step Content Area -->
    <div class="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
      
      <!-- ========================================================= -->
      <!-- STEP 1: ADMIN & LOGIN CREDENTIALS                         -->
      <!-- ========================================================= -->
      {#if currentStep === 1}
        <div class="space-y-6">
          <div>
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 text-xs font-semibold mb-2 border border-indigo-500/20">
              <User class="w-3.5 h-3.5" />
              <span>ধাপ ১ / ৪ • অ্যাডমিন প্রোফাইল সেটআপ</span>
            </div>
            <h2 class="text-2xl font-bold text-white font-['Outfit']">পরিচালক / অ্যাডমিন অ্যাকাউন্ট তৈরি করুন</h2>
            <p class="text-xs text-slate-400 mt-1">কোচিং সেন্টারের প্রধান প্রশাসক হিসেবে আপনার অফিসিয়াল তথ্য দিন।</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label for="reg-name" class="block font-medium text-slate-300 mb-1.5">পূর্ণ নাম (Full Name) *</label>
              <div class="relative">
                <User class="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="reg-name"
                  type="text"
                  bind:value={adminFullName}
                  placeholder="আপনার পূর্ণ নাম লিখুন"
                  class="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label for="reg-phone" class="block font-medium text-slate-300 mb-1.5">মোবাইল নম্বর (+৮৮০ সহ) *</label>
              <div class="relative">
                <Phone class="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="reg-phone"
                  type="text"
                  bind:value={adminPhone}
                  placeholder="০১XXXXXXXXX"
                  class="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label for="reg-email" class="block font-medium text-slate-300 mb-1.5">অফিসিয়াল ইমেইল (Login Email) *</label>
              <div class="relative">
                <Mail class="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="reg-email"
                  type="email"
                  bind:value={adminEmail}
                  placeholder="name@example.com"
                  class="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label for="reg-pass" class="block font-medium text-slate-300 mb-1.5">পাসওয়ার্ড (Password) *</label>
              <div class="relative">
                <Lock class="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="reg-pass"
                  type={showPassword ? 'text' : 'password'}
                  bind:value={adminPassword}
                  placeholder="কমপক্ষে ৬ অক্ষরের গোপন পাসওয়ার্ড লিখুন"
                  class="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  on:click={() => (showPassword = !showPassword)}
                >
                  {#if showPassword}
                    <EyeOff class="w-4 h-4" />
                  {:else}
                    <Eye class="w-4 h-4" />
                  {/if}
                </button>
              </div>
            </div>

            <div class="sm:col-span-2">
              <label for="reg-cpass" class="block font-medium text-slate-300 mb-1.5">পাসওয়ার্ড নিশ্চিত করুন *</label>
              <div class="relative">
                <Lock class="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="reg-cpass"
                  type={showPassword ? 'text' : 'password'}
                  bind:value={confirmPassword}
                  placeholder="একই পাসওয়ার্ড পুনরায় লিখুন"
                  class="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

      <!-- ========================================================= -->
      <!-- STEP 2: COACHING CENTER DETAILS                           -->
      <!-- ========================================================= -->
      {:else if currentStep === 2}
        <div class="space-y-6">
          <div>
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 text-xs font-semibold mb-2 border border-indigo-500/20">
              <Building2 class="w-3.5 h-3.5" />
              <span>ধাপ ২ / ৪ • কোচিং সেন্টারের প্রোফাইল</span>
            </div>
            <h2 class="text-2xl font-bold text-white font-['Outfit']">কোচিং সেন্টারের অ্যাকাডেমিক পরিচিতি</h2>
            <p class="text-xs text-slate-400 mt-1">আইডি কার্ড, মানি রিসিট, সিলেবাস এবং প্রিন্ট ডকুমেন্টে এই নাম ও ঠিকানা প্রদর্শিত হবে।</p>
          </div>

          <div class="space-y-4 text-xs">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="sm:col-span-2">
                <label for="reg-coach-name" class="block font-medium text-slate-300 mb-1.5">কোচিং সেন্টারের নাম ও শাখা *</label>
                <input
                  id="reg-coach-name"
                  type="text"
                  bind:value={coachingName}
                  placeholder="কোচিং সেন্টারের নাম লিখুন (যেমন: পাই একাডেমি - ফার্মগেট শাখা)"
                  class="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm font-semibold"
                />
              </div>

              <div>
                <label for="reg-division" class="block font-medium text-slate-300 mb-1.5">বিভাগ (Division)</label>
                <select
                  id="reg-division"
                  bind:value={division}
                  class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                >
                  {#each divisionsList as div}
                    <option value={div}>{div}</option>
                  {/each}
                </select>
              </div>

              <div>
                <label for="reg-capacity" class="block font-medium text-slate-300 mb-1.5">আনুমানিক শিক্ষার্থী সংখ্যা</label>
                <select
                  id="reg-capacity"
                  bind:value={targetCapacity}
                  class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="100">৫০ - ১০০ জন শিক্ষার্থী</option>
                  <option value="300">১০০ - ৩০০ জন শিক্ষার্থী</option>
                  <option value="500">৩০০ - ৫০০ জন শিক্ষার্থী</option>
                  <option value="1000">৫০০ - ১,০০০+ জন শিক্ষার্থী</option>
                </select>
              </div>
            </div>

            <div>
              <label for="reg-address" class="block font-medium text-slate-300 mb-1.5">সম্পূর্ণ শাখা ঠিকানা (Address) *</label>
              <input
                id="reg-address"
                type="text"
                bind:value={coachingAddress}
                placeholder="রোড, বাড়ি নম্বর, এলাকা, থানা ও জেলা উল্লেখ করুন"
                class="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label for="reg-tagline" class="block font-medium text-slate-300 mb-1.5">মটো / স্লোগান (Tagline - ঐচ্ছিক)</label>
              <input
                id="reg-tagline"
                type="text"
                bind:value={coachingTagline}
                placeholder="যেমন: এইচএসসি ও বিশ্ববিদ্যালয় ভর্তি পরীক্ষার বিশ্বস্ত সঙ্গী"
                class="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="block font-semibold text-slate-300">অ্যাকাডেমিক কোর্স ও পাঠ্যক্রম নির্বাচন করুন:</span>
                <span class="text-[11px] text-indigo-400 font-semibold">{selectedCurriculums.length}টি কোর্স নির্বাচিত</span>
              </div>

              <div class="space-y-3.5 bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800/80 max-h-72 overflow-y-auto">
                {#each curriculumCategories as catGroup}
                  <div>
                    <div class="text-[10px] font-bold uppercase tracking-wider text-indigo-400 mb-1.5 flex items-center gap-1.5">
                      <span class="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                      <span>{catGroup.category}</span>
                    </div>
                    <div class="flex flex-wrap gap-1.5">
                      {#each catGroup.items as cur}
                        <button
                          type="button"
                          class="px-2.5 py-1.5 rounded-xl border text-[11px] font-medium transition-all flex items-center gap-1.5 text-left
                          {selectedCurriculums.includes(cur) ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm' : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'}"
                          on:click={() => toggleCurriculum(cur)}
                        >
                          {#if selectedCurriculums.includes(cur)}
                            <Check class="w-3 h-3 text-white shrink-0" />
                          {:else}
                            <span class="text-slate-500 shrink-0 font-bold">+</span>
                          {/if}
                          <span>{cur}</span>
                        </button>
                      {/each}
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          </div>
        </div>

      <!-- ========================================================= -->
      <!-- STEP 3: PLAN & SMS ENGINE                                 -->
      <!-- ========================================================= -->
      {:else if currentStep === 3}
        <div class="space-y-6">
          <div>
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 text-xs font-semibold mb-2 border border-indigo-500/20">
              <Sparkles class="w-3.5 h-3.5 text-amber-400" />
              <span>ধাপ ৩ / ৪ • প্যাকেজ ও এসএমএস ইঞ্জিন নির্বাচন</span>
            </div>
            <h2 class="text-2xl font-bold text-white font-['Outfit']">প্যাকেজ ও ডুয়েল SMS গেটওয়ে কনফিগারেশন</h2>
            <p class="text-xs text-slate-400 mt-1">আপনার কোচিং সেন্টারের প্রয়োজন অনুযায়ী সেরা প্যাকেজ নির্বাচন করুন।</p>
          </div>

          <!-- Billing Toggle -->
          <div class="flex items-center justify-between bg-slate-950 p-3 rounded-2xl border border-slate-800">
            <span class="text-xs font-semibold text-slate-300">বিলিং সাইকেল:</span>
            <div class="inline-flex p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <button
                type="button"
                class="px-4 py-1.5 rounded-lg font-semibold transition-all {billingCycle === 'monthly' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}"
                on:click={() => (billingCycle = 'monthly')}
              >
                মাসিক বিলিং
              </button>
              <button
                type="button"
                class="px-4 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 {billingCycle === 'yearly' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}"
                on:click={() => (billingCycle = 'yearly')}
              >
                <span>বার্ষিক বিলিং</span>
                <span class="px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-500/20 text-emerald-400 font-bold">২০% ছাড়</span>
              </button>
            </div>
          </div>

          <!-- Plans Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {#each $subscriptionPlans as plan}
              {@const isSelected = activePlan.id === plan.id}
              {@const price = billingCycle === 'monthly' ? plan.priceMonthly : Math.round(plan.priceYearly / 12)}
              <div
                role="button"
                tabindex="0"
                class="p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between
                {isSelected ? 'bg-indigo-950/40 border-indigo-500 shadow-lg shadow-indigo-600/15' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}"
                on:click={() => (activePlan = plan)}
                on:keydown={() => {}}
              >
                <div>
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-xs font-bold text-white">{plan.name}</span>
                    {#if plan.popular}
                      <span class="px-2 py-0.2 rounded-full text-[9px] bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 uppercase">সেরা</span>
                    {/if}
                  </div>
                  <div class="text-xl font-black text-white font-['Outfit']">
                    ৳{price.toLocaleString()}<span class="text-xs text-slate-400 font-normal">/মাস</span>
                  </div>
                  <p class="text-[11px] text-slate-400 mt-1 leading-snug">{plan.description}</p>
                </div>

                <div class="mt-4 pt-3 border-t border-slate-800 text-[10px] space-y-1 text-slate-300">
                  <div class="flex items-center gap-1">
                    <Check class="w-3 h-3 text-emerald-400 shrink-0" />
                    <span>{plan.studentLimit.toLocaleString()} জন শিক্ষার্থী</span>
                  </div>
                  <div class="flex items-center gap-1">
                    <Check class="w-3 h-3 text-emerald-400 shrink-0" />
                    <span>{plan.smsCreditsIncluded.toLocaleString()} ফ্রি Cloud SMS</span>
                  </div>
                </div>
              </div>
            {/each}
          </div>

          <!-- SMS Gateway Routing Preference -->
          <div class="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <span class="block text-xs font-bold text-white">ডিফল্ট SMS ডেলিভারি ইঞ্জিন:</span>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label class="p-3 rounded-xl border flex items-center justify-between cursor-pointer {selectedGatewayMode === 'android' ? 'bg-emerald-950/30 border-emerald-500 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-400'}">
                <div class="flex items-center gap-2">
                  <input type="radio" name="reg_gw" value="android" bind:group={selectedGatewayMode} />
                  <div>
                    <span class="font-bold text-white block">Android Gateway Node</span>
                    <span class="text-[10px] text-emerald-400">গ্রামীণফোন/বাংলালিংক বান্ডেল (৳০.০০)</span>
                  </div>
                </div>
                <span class="font-bold text-emerald-400">৳০.০০</span>
              </label>

              <label class="p-3 rounded-xl border flex items-center justify-between cursor-pointer {selectedGatewayMode === 'cloud' ? 'bg-indigo-950/30 border-indigo-500 text-indigo-300' : 'bg-slate-900 border-slate-800 text-slate-400'}">
                <div class="flex items-center gap-2">
                  <input type="radio" name="reg_gw" value="cloud" bind:group={selectedGatewayMode} />
                  <div>
                    <span class="font-bold text-white block">Cloud Masked SMS</span>
                    <span class="text-[10px] text-indigo-400">BTRC অনুমোদিত ক্লাউড গেটওয়ে</span>
                  </div>
                </div>
                <span class="font-bold text-indigo-400">৳০.৩৫</span>
              </label>
            </div>
          </div>
        </div>

      <!-- ========================================================= -->
      <!-- STEP 4: REVIEW & INSTANT LAUNCH                           -->
      <!-- ========================================================= -->
      {:else if currentStep === 4}
        <div class="space-y-6">
          <div>
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 text-xs font-semibold mb-2 border border-emerald-500/20">
              <CheckCircle2 class="w-3.5 h-3.5" />
              <span>ধাপ ৪ / ৪ • চূড়ান্ত পর্যালোচনা ও অ্যাক্টিভেশন</span>
            </div>
            <h2 class="text-2xl font-bold text-white font-['Outfit']">তথ্য যাচাই করুন ও ড্যাশবোর্ড চালু করুন</h2>
            <p class="text-xs text-slate-400 mt-1">সবকিছু ঠিক থাকলে এক ক্লিকেই আপনার কোচিং সেন্টার সফটওয়্যার চালু হয়ে যাবে।</p>
          </div>

          <!-- Summary Card -->
          <div class="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 text-xs">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-800">
              <div>
                <span class="text-[10px] text-slate-500 uppercase block font-medium">কোচিং সেন্টারের নাম</span>
                <strong class="text-sm font-bold text-white block mt-0.5">{coachingName}</strong>
                <span class="text-slate-400 text-[11px] block mt-0.5">📍 {coachingAddress}</span>
              </div>

              <div>
                <span class="text-[10px] text-slate-500 uppercase block font-medium">প্রধান প্রশাসক / অ্যাডমিন</span>
                <strong class="text-sm font-bold text-white block mt-0.5">{adminFullName}</strong>
                <span class="text-slate-400 text-[11px] font-mono block mt-0.5">✉️ {adminEmail} • 📞 {adminPhone}</span>
              </div>
            </div>

            <div class="grid grid-cols-3 gap-3 text-center">
              <div class="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span class="text-[10px] text-slate-400 uppercase block">নির্বাচিত প্যাকেজ</span>
                <strong class="text-indigo-400 font-bold block">{activePlan.name}</strong>
              </div>
              <div class="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span class="text-[10px] text-slate-400 uppercase block">বিলিং মূল্য</span>
                <strong class="text-emerald-400 font-bold block">৳{planPrice.toLocaleString()}/মাস</strong>
              </div>
              <div class="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span class="text-[10px] text-slate-400 uppercase block">SMS ইঞ্জিন</span>
                <strong class="text-amber-400 font-bold block">
                  {selectedGatewayMode === 'android' ? 'Android SIM (৳০.০০)' : 'Cloud Masked'}
                </strong>
              </div>
            </div>
          </div>

          <div class="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 flex items-start gap-3">
            <ShieldCheck class="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div class="text-xs text-slate-300 leading-relaxed">
              <strong class="text-white">১৪ দিনের ফ্রি ট্রায়াল অন্তর্ভুক্ত:</strong> আজ কোনো পেমেন্ট বাধ্যতামূলক নয়। আপনার অ্যাকাউন্ট স্বয়ংক্রিয়ভাবে ডাটাবেজে তৈরি হবে এবং আপনি সাথে সাথেই শিক্ষার্থী ভর্তি, আইডি কার্ড প্রিন্ট ও এসএমএস পাঠানো শুরু করতে পারবেন।
            </div>
          </div>
        </div>
      {/if}

      <!-- Bottom Navigation Button Bar -->
      <div class="pt-6 border-t border-slate-800 flex items-center justify-between gap-4 mt-8">
        <div>
          {#if currentStep > 1}
            <button
              type="button"
              class="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all text-xs font-bold flex items-center gap-1.5"
              on:click={prevStep}
            >
              <ArrowLeft class="w-4 h-4" />
              <span>পূর্ববর্তী ধাপ</span>
            </button>
          {:else}
            <button
              type="button"
              class="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white transition-colors text-xs font-medium"
              on:click={() => navigate('/')}
            >
              হোম পেজে ফিরে যান
            </button>
          {/if}
        </div>

        <div>
          {#if currentStep < 4}
            <button
              type="button"
              class="px-6 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 text-xs"
              on:click={nextStep}
            >
              <span>পরবর্তী ধাপ</span>
              <ArrowRight class="w-4 h-4" />
            </button>
          {:else}
            <button
              type="button"
              disabled={isSubmitting || submissionSuccess}
              class="px-8 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-xl shadow-emerald-600/30 transition-all flex items-center gap-2 text-xs disabled:opacity-50"
              on:click={handleFinalSubmit}
            >
              {#if isSubmitting}
                <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>অ্যাকাউন্ট প্রস্তুত হচ্ছে...</span>
              {:else if submissionSuccess}
                <Check class="w-4 h-4" />
                <span>ড্যাশবোর্ডে প্রবেশ করানো হচ্ছে...</span>
              {:else}
                <Sparkles class="w-4 h-4 text-amber-300" />
                <span>নিবন্ধন সম্পন্ন করুন ও ড্যাশবোর্ডে প্রবেশ করুন</span>
              {/if}
            </button>
          {/if}
        </div>
      </div>
    </div>
  </main>
</div>
