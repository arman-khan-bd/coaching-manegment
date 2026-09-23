<script lang="ts">
  import {
    currentRole,
    currentTeacherPermissions,
    instituteSettings,
    showToast,
    switchActiveTenant,
    generateCoachingId,
    type UserRole,
  } from "../store";
  import { navigate } from "../router";
  import {
    supabaseSignIn,
    supabaseSignUp,
    supabaseResetPasswordForEmail,
    supabaseUpdatePassword,
    currentAuthUser,
    authLoading,
    isPasswordRecoveryMode,
    SUPABASE_URL,
  } from "../supabase";
  import {
    GraduationCap,
    ArrowLeft,
    ArrowRight,
    ShieldCheck,
    Sparkles,
    Lock,
    Mail,
    Building,
    Phone,
    User,
    CheckCircle2,
    AlertCircle,
    KeyRound,
    Eye,
    EyeOff,
  } from "lucide-svelte";

  import { onMount } from "svelte";

  onMount(() => {
    const isRecovery =
      $isPasswordRecoveryMode ||
      (typeof window !== "undefined" &&
        (window.location.hash.includes("type=recovery") ||
          window.location.search.includes("type=recovery")));
    if ($currentAuthUser && !isRecovery) {
      navigate("/dashboard/overview");
    }
  });

  let authMode: "signin" | "register" | "forgot" | "update_password" = "signin";

  $: if ($isPasswordRecoveryMode) {
    authMode = "update_password";
  }

  // Login form
  let email = "";
  let password = "";
  let rememberMe = true;
  let showPassword = false;

  // Forgot password form
  let forgotEmail = "";
  let isForgotSubmitted = false;

  // Update password (recovery) form
  let newPassword = "";
  let confirmNewPassword = "";
  let showNewPassword = false;

  // Register form
  let regFullName = "";
  let regEmail = "";
  let regPassword = "";
  let regInstituteName = "";
  let regPhone = "";
  let regRole: UserRole = "institute_admin";

  let errorMessage = "";
  let successMessage = "";

  async function handleSignIn() {
    errorMessage = "";
    successMessage = "";

    if (!email || !password) {
      errorMessage = "Please enter both email and password.";
      return;
    }

    const res = await supabaseSignIn(email, password);
    if (res.success && res.user) {
      currentRole.set(res.user.role);
      if (res.user.role === 'teacher') {
        currentTeacherPermissions.set(res.user.permissions || []);
      } else {
        currentTeacherPermissions.set([]);
      }
      const userCid = (res.user as any).coaching_center_id || "aac-dhaka-01";
      instituteSettings.update((curr) => ({
        ...curr,
        coachingCenterId: userCid,
        name: res.user?.institute_name || curr.name,
      }));
      switchActiveTenant(userCid);
      showToast(
        "success",
        "Supabase Authenticated",
        `Welcome back, ${res.user.full_name}! Synced with Supabase.`,
      );
      navigate("/dashboard/overview");
    } else {
      errorMessage = res.error || "Authentication failed. Check your email and password.";
      showToast(
        "error",
        "Sign In Failed",
        res.error || "Invalid credentials. Please verify your email and password.",
      );
    }
  }

  async function handleSignUp() {
    errorMessage = "";
    successMessage = "";

    if (!regEmail || !regPassword || !regFullName || !regInstituteName) {
      errorMessage = "All fields marked * are required.";
      return;
    }

    if (regPassword.length < 6) {
      errorMessage = "Password must be at least 6 characters.";
      return;
    }

    const newCoachingId = generateCoachingId(regInstituteName);

    const res = await supabaseSignUp(regEmail, regPassword, {
      fullName: regFullName,
      instituteName: regInstituteName,
      role: regRole,
      phone: regPhone,
      coachingCenterId: newCoachingId,
    });

    if (res.success) {
      successMessage =
        "Account created successfully in Supabase! Signing you in...";
      showToast(
        "success",
        "Supabase Account Registered",
        `Welcome ${regFullName}! Your profile is stored in Supabase.`,
      );

      // Auto login
      setTimeout(async () => {
        currentRole.set(regRole);
        instituteSettings.update((curr) => ({
          ...curr,
          coachingCenterId: newCoachingId,
          name: regInstituteName,
          email: regEmail,
          phone: regPhone || curr.phone,
        }));
        switchActiveTenant(newCoachingId);
        navigate("/dashboard/overview");
      }, 1000);
    } else {
      errorMessage = res.error || "Failed to register account.";
      showToast("error", "Registration Error", res.error || "Check inputs.");
    }
  }

  async function handleForgotPassword() {
    errorMessage = "";
    successMessage = "";

    if (!forgotEmail || !forgotEmail.includes("@")) {
      errorMessage = "অনুগ্রহ করে আপনার সঠিক ইমেইল অ্যাড্রেস লিখুন।";
      return;
    }

    const res = await supabaseResetPasswordForEmail(forgotEmail.trim());
    if (res.success) {
      isForgotSubmitted = true;
      successMessage = `পাসওয়ার্ড রিসেট লিঙ্ক "${forgotEmail}" ঠিকানায় পাঠানো হয়েছে! ইনবক্স অথবা স্প্যাম ফোল্ডার চেক করুন।`;
      showToast(
        "success",
        "রিসেট লিঙ্ক প্রেরিত",
        "আপনার ইমেইল ইনবক্সে পাসওয়ার্ড রিসেট করার লিঙ্ক পাঠানো হয়েছে।"
      );
    } else {
      errorMessage = res.error || "পাসওয়ার্ড রিসেট ইমেইল পাঠাতে ব্যর্থ হয়েছে।";
      showToast("error", "ত্রুটি", errorMessage);
    }
  }

  async function handleUpdateNewPassword() {
    errorMessage = "";
    successMessage = "";

    if (!newPassword || newPassword.length < 6) {
      errorMessage = "নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।";
      return;
    }

    if (newPassword !== confirmNewPassword) {
      errorMessage = "উভয় পাসওয়ার্ড একই হতে হবে।";
      return;
    }

    const res = await supabaseUpdatePassword(newPassword);
    if (res.success) {
      isPasswordRecoveryMode.set(false);
      successMessage = "আপনার পাসওয়ার্ড সফলভাবে হালনাগাদ হয়েছে! অনুগ্রহ করে লগইন করুন।";
      showToast("success", "পাসওয়ার্ড হালনাগাদ সম্পন্ন", "আপনার নতুন পাসওয়ার্ড কার্যকর হয়েছে।");
      setTimeout(() => {
        authMode = "signin";
        password = "";
        newPassword = "";
        confirmNewPassword = "";
        errorMessage = "";
      }, 1500);
    } else {
      errorMessage = res.error || "পাসওয়ার্ড পরিবর্তন করতে ব্যর্থ হয়েছে।";
      showToast("error", "ত্রুটি", errorMessage);
    }
  }
</script>

<div
  class="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-slate-950 flex flex-col justify-center items-center relative overflow-hidden"
>
  <!-- Glow orbs -->
  <div
    class="absolute top-1/4 left-1/3 w-96 h-96 bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none"
  ></div>
  <div
    class="absolute bottom-1/4 right-1/3 w-96 h-96 bg-emerald-600/10 rounded-full blur-[140px] pointer-events-none"
  ></div>

  <div class="max-w-md w-full relative z-10">
    <!-- Back to landing -->
    <button
      type="button"
      class="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white mb-6 transition-colors"
      on:click={() => navigate("/")}
    >
      <ArrowLeft class="w-4 h-4" />
      <span>Back to Public Website</span>
    </button>

    <div
      class="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl"
    >
      <!-- Supabase Live Connection Indicator -->

      <!-- Header -->
      <div class="text-center mb-6">
        <div
          class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-indigo-600/30 mb-3"
        >
          {#if authMode === "forgot"}
            <KeyRound class="w-6 h-6 text-amber-300" />
          {:else if authMode === "update_password"}
            <Lock class="w-6 h-6 text-emerald-300" />
          {:else}
            <GraduationCap class="w-7 h-7" />
          {/if}
        </div>
        <h2 class="text-2xl font-bold text-white font-['Outfit']">
          {#if authMode === "signin"}
            Sign In to CoachFlow
          {:else if authMode === "register"}
            Register New Academy
          {:else if authMode === "forgot"}
            পাসওয়ার্ড ভুলে গেছেন?
          {:else if authMode === "update_password"}
            নতুন পাসওয়ার্ড সেট করুন
          {/if}
        </h2>
        <p class="text-xs text-slate-400 mt-1">
          {#if authMode === "signin"}
            Access your coaching dashboard with Supabase Auth
          {:else if authMode === "register"}
            Create your academy admin profile stored in Supabase
          {:else if authMode === "forgot"}
            আপনার নিবন্ধিত ইমেইলে পাসওয়ার্ড রিসেট লিঙ্ক পাঠানো হবে
          {:else if authMode === "update_password"}
            আপনার অ্যাকাউন্টের জন্য নতুন একটি শক্তিশালী পাসওয়ার্ড দিন
          {/if}
        </p>
      </div>

      {#if authMode === "forgot" || authMode === "update_password"}
        <!-- Back to login link -->
        <button
          type="button"
          class="mb-6 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
          on:click={() => {
            authMode = "signin";
            errorMessage = "";
            successMessage = "";
          }}
        >
          <ArrowLeft class="w-3.5 h-3.5" />
          <span>লগইনে ফিরে যান (Back to Sign In)</span>
        </button>
      {:else}
        <!-- Get Started / Registration Wizard Card -->
        <div
          class="mb-6 p-3.5 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-indigo-950/40 border border-indigo-500/30 flex items-center justify-between gap-3 text-xs shadow-md"
        >
          <div>
            <p class="font-bold text-white flex items-center gap-1.5">
              <Sparkles class="w-3.5 h-3.5 text-amber-400" />
              <span>New Coaching Institute?</span>
            </p>
            <p class="text-[11px] text-slate-400 mt-0.5">
              Set up your brand, student portal & SMS
            </p>
          </div>
          <button
            type="button"
            class="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs transition-all shrink-0 shadow-md shadow-indigo-600/30 flex items-center gap-1.5 hover:scale-[1.02]"
            on:click={() => navigate("/register?step=1")}
          >
            <span>Get Started</span>
            <ArrowRight class="w-3.5 h-3.5" />
          </button>
        </div>

        <!-- Mode Switcher Tabs -->
        <div
          class="grid grid-cols-2 gap-1 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 mb-6 text-xs font-semibold"
        >
          <button
            type="button"
            class="py-2 rounded-xl transition-all {authMode === 'signin'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'}"
            on:click={() => {
              authMode = "signin";
              errorMessage = "";
              successMessage = "";
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            class="py-2 rounded-xl transition-all {authMode === 'register'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'}"
            on:click={() => {
              authMode = "register";
              errorMessage = "";
              successMessage = "";
            }}
          >
            Create Account
          </button>
        </div>
      {/if}

      <!-- Alerts -->
      {#if errorMessage}
        <div
          class="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2 animate-in fade-in"
        >
          <AlertCircle class="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      {/if}

      {#if successMessage}
        <div
          class="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-start gap-2 animate-in fade-in"
        >
          <CheckCircle2 class="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      {/if}

      <!-- TAB 1: SIGN IN -->
      {#if authMode === "signin"}
        <form on:submit|preventDefault={handleSignIn} class="space-y-4 text-xs">
          <div>
            <label for="sb-email" class="block font-medium text-slate-300 mb-1"
              >Email Address</label
            >
            <div class="relative">
              <Mail
                class="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2"
              />
              <input
                id="sb-email"
                type="email"
                bind:value={email}
                placeholder="name@example.com"
                class="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                required
              />
            </div>
          </div>

          <div>
            <div class="flex items-center justify-between mb-1">
              <label for="sb-pass" class="font-medium text-slate-300"
                >Password</label
              >
              <button
                type="button"
                class="text-indigo-400 hover:text-indigo-300 font-semibold"
                on:click={() => {
                  authMode = "forgot";
                  forgotEmail = email;
                  errorMessage = "";
                  successMessage = "";
                }}
              >
                Forgot Password?
              </button>
            </div>
            <div class="relative">
              <Lock
                class="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2"
              />
              <input
                id="sb-pass"
                type={showPassword ? "text" : "password"}
                bind:value={password}
                class="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                required
              />
              <button
                type="button"
                class="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
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

          <button
            type="submit"
            disabled={$authLoading}
            class="w-full py-3.5 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
          >
            {#if $authLoading}
              <span
                class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
              ></span>
              <span>Authenticating with Supabase...</span>
            {:else}
              <span>Sign In with Supabase</span>
              <ArrowRight class="w-4 h-4" />
            {/if}
          </button>
        </form>

      <!-- TAB 2: FORGOT PASSWORD (SUPABASE) -->
      {:else if authMode === "forgot"}
        <form on:submit|preventDefault={handleForgotPassword} class="space-y-4 text-xs">
          <div>
            <label for="sb-forgot-email" class="block font-medium text-slate-300 mb-1">
              নিবন্ধিত ইমেইল অ্যাড্রেস *
            </label>
            <div class="relative">
              <Mail
                class="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2"
              />
              <input
                id="sb-forgot-email"
                type="email"
                bind:value={forgotEmail}
                placeholder="name@example.com"
                class="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 text-sm"
                required
              />
            </div>
            <p class="text-[11px] text-slate-400 mt-1.5">
              এই ইমেইলে Supabase Auth থেকে একটি সিকিউর রিসেট লিঙ্ক পাঠানো হবে।
            </p>
          </div>

          <button
            type="submit"
            disabled={$authLoading || isForgotSubmitted}
            class="w-full py-3 px-4 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
          >
            {#if $authLoading}
              <span
                class="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin"
              ></span>
              <span>ইমেইল পাঠানো হচ্ছে...</span>
            {:else if isForgotSubmitted}
              <CheckCircle2 class="w-4 h-4 text-emerald-800" />
              <span>রিসেট লিঙ্ক পাঠানো হয়েছে</span>
            {:else}
              <KeyRound class="w-4 h-4 text-slate-950" />
              <span>পাসওয়ার্ড রিসেট লিঙ্ক পাঠান</span>
            {/if}
          </button>
        </form>

      <!-- TAB 3: UPDATE NEW PASSWORD (RECOVERY) -->
      {:else if authMode === "update_password"}
        <form on:submit|preventDefault={handleUpdateNewPassword} class="space-y-4 text-xs">
          <div>
            <label for="sb-new-pass" class="block font-medium text-slate-300 mb-1">
              নতুন পাসওয়ার্ড (New Password) *
            </label>
            <div class="relative">
              <Lock
                class="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2"
              />
              <input
                id="sb-new-pass"
                type={showNewPassword ? "text" : "password"}
                bind:value={newPassword}
                placeholder="কমপক্ষে ৬ অক্ষরের নতুন পাসওয়ার্ড"
                class="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
                required
              />
              <button
                type="button"
                class="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                on:click={() => (showNewPassword = !showNewPassword)}
              >
                {#if showNewPassword}
                  <EyeOff class="w-4 h-4" />
                {:else}
                  <Eye class="w-4 h-4" />
                {/if}
              </button>
            </div>
          </div>

          <div>
            <label for="sb-cnew-pass" class="block font-medium text-slate-300 mb-1">
              পাসওয়ার্ড নিশ্চিত করুন (Confirm Password) *
            </label>
            <div class="relative">
              <Lock
                class="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2"
              />
              <input
                id="sb-cnew-pass"
                type={showNewPassword ? "text" : "password"}
                bind:value={confirmNewPassword}
                placeholder="একই নতুন পাসওয়ার্ড পুনরায় লিখুন"
                class="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={$authLoading}
            class="w-full py-3.5 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
          >
            {#if $authLoading}
              <span
                class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
              ></span>
              <span>পাসওয়ার্ড আপডেট করা হচ্ছে...</span>
            {:else}
              <CheckCircle2 class="w-4 h-4" />
              <span>পাসওয়ার্ড পরিবর্তন সম্পন্ন করুন</span>
            {/if}
          </button>
        </form>

      <!-- TAB 4: REGISTER -->
      {:else}
        <form
          on:submit|preventDefault={handleSignUp}
          class="space-y-3.5 text-xs"
        >
          <div>
            <label
              for="reg-fullname"
              class="block font-medium text-slate-300 mb-1">Full Name *</label
            >
            <div class="relative">
              <User
                class="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2"
              />
              <input
                id="reg-fullname"
                type="text"
                bind:value={regFullName}
                placeholder="e.g. Dr. Robert Vance"
                class="w-full pl-10 pr-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label
              for="reg-institute"
              class="block font-medium text-slate-300 mb-1"
              >Coaching / Academy Name *</label
            >
            <div class="relative">
              <Building
                class="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2"
              />
              <input
                id="reg-institute"
                type="text"
                bind:value={regInstituteName}
                placeholder="কোচিং সেন্টারের নাম লিখুন"
                class="w-full pl-10 pr-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none text-sm"
                required
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2.5">
            <div>
              <label
                for="reg-email"
                class="block font-medium text-slate-300 mb-1">Email *</label
              >
              <input
                id="reg-email"
                type="email"
                bind:value={regEmail}
                placeholder="name@example.com"
                class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none text-sm"
                required
              />
            </div>

            <div>
              <label
                for="reg-phone"
                class="block font-medium text-slate-300 mb-1"
                >Phone Number</label
              >
              <input
                id="reg-phone"
                type="text"
                bind:value={regPhone}
                placeholder="০১XXXXXXXXX"
                class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none text-sm"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2.5">
            <div>
              <label
                for="reg-password"
                class="block font-medium text-slate-300 mb-1">Password *</label
              >
              <input
                id="reg-password"
                type="password"
                bind:value={regPassword}
                placeholder="কমপক্ষে ৬ অক্ষর"
                class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none text-sm"
                required
              />
            </div>

            <div>
              <label
                for="reg-role"
                class="block font-medium text-slate-300 mb-1"
                >Account Role</label
              >
              <select
                id="reg-role"
                bind:value={regRole}
                class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-indigo-500 focus:outline-none text-sm"
              >
                <option value="institute_admin"
                  >Institute Director / Admin</option
                >
                <option value="teacher">Faculty Teacher</option>
                <option value="student">Student / Guardian</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={$authLoading}
            class="w-full py-3 px-4 mt-2 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
          >
            {#if $authLoading}
              <span
                class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
              ></span>
              <span>Registering in Supabase...</span>
            {:else}
              <span>Create Account in Supabase</span>
              <ArrowRight class="w-4 h-4" />
            {/if}
          </button>
        </form>
      {/if}
    </div>
  </div>
</div>
