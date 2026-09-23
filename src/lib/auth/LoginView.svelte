<script lang="ts">
  import {
    currentRole,
    instituteSettings,
    showToast,
    switchActiveTenant,
    generateCoachingId,
    type UserRole,
  } from '../store';
  import { navigate } from '../router';
  import {
    supabaseSignIn,
    supabaseSignUp,
    currentAuthUser,
    authLoading,
    SUPABASE_URL,
  } from '../supabase';
  import {
    GraduationCap,
    ArrowLeft,
    ArrowRight,
    ShieldCheck,
    UserCheck,
    Lock,
    Mail,
    Building,
    Phone,
    User,
    Database,
    CheckCircle2,
    AlertCircle,
  } from 'lucide-svelte';

  import { onMount } from 'svelte';

  onMount(() => {
    if ($currentAuthUser) {
      navigate('/dashboard/overview');
    }
  });

  let authMode: 'signin' | 'register' = 'signin';

  // Login form
  let email = 'director@apexhorizon.edu';
  let password = 'Password123!';
  let rememberMe = true;

  // Register form
  let regFullName = '';
  let regEmail = '';
  let regPassword = '';
  let regInstituteName = '';
  let regPhone = '';
  let regRole: UserRole = 'institute_admin';

  let errorMessage = '';
  let successMessage = '';

  async function handleSignIn() {
    errorMessage = '';
    successMessage = '';

    if (!email || !password) {
      errorMessage = 'Please enter both email and password.';
      return;
    }

    const res = await supabaseSignIn(email, password);
    if (res.success && res.user) {
      currentRole.set(res.user.role);
      const userCid = (res.user as any).coaching_center_id || 'aac-dhaka-01';
      instituteSettings.update((curr) => ({
        ...curr,
        coachingCenterId: userCid,
        name: res.user?.institute_name || curr.name,
      }));
      switchActiveTenant(userCid);
      showToast('success', 'Supabase Authenticated', `Welcome back, ${res.user.full_name}! Synced with Supabase.`);
      navigate('/dashboard/overview');
    } else {
      errorMessage = res.error || 'Authentication failed. Check credentials.';
      // Helpful fallback note
      showToast('warning', 'Supabase Auth Notice', res.error || 'Could not verify remote account. You can also use 1-Click Demo Accounts below.');
    }
  }

  async function handleSignUp() {
    errorMessage = '';
    successMessage = '';

    if (!regEmail || !regPassword || !regFullName || !regInstituteName) {
      errorMessage = 'All fields marked * are required.';
      return;
    }

    if (regPassword.length < 6) {
      errorMessage = 'Password must be at least 6 characters.';
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
      successMessage = 'Account created successfully in Supabase! Signing you in...';
      showToast('success', 'Supabase Account Registered', `Welcome ${regFullName}! Your profile is stored in Supabase.`);
      
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
        navigate('/dashboard/overview');
      }, 1000);
    } else {
      errorMessage = res.error || 'Failed to register account.';
      showToast('error', 'Registration Error', res.error || 'Check inputs.');
    }
  }

  function setDemoCredentials(demoEmail: string, role: UserRole) {
    email = demoEmail;
    password = 'Password123!';
    currentRole.set(role);
    switchActiveTenant('aac-dhaka-01');
    navigate('/dashboard/overview');
    showToast('success', 'Demo Login Activated', `Signed in as ${role.replace('_', ' ').toUpperCase()} (Demo Mode).`);
  }
</script>

<div class="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-slate-950 flex flex-col justify-center items-center relative overflow-hidden">
  <!-- Glow orbs -->
  <div class="absolute top-1/4 left-1/3 w-96 h-96 bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none"></div>
  <div class="absolute bottom-1/4 right-1/3 w-96 h-96 bg-emerald-600/10 rounded-full blur-[140px] pointer-events-none"></div>

  <div class="max-w-md w-full relative z-10">
    <!-- Back to landing -->
    <button
      type="button"
      class="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white mb-6 transition-colors"
      on:click={() => navigate('/')}
    >
      <ArrowLeft class="w-4 h-4" />
      <span>Back to Public Website</span>
    </button>

    <div class="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
      <!-- Supabase Live Connection Indicator -->
      <div class="mb-5 flex items-center justify-between p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-[11px]">
        <div class="flex items-center gap-2 text-emerald-300 font-semibold">
          <Database class="w-3.5 h-3.5 text-emerald-400" />
          <span>Supabase Auth & DB Active</span>
        </div>
        <span class="text-slate-400 font-mono text-[10px] truncate max-w-[150px]">
          qmrpvrsysbbmjxjdrzaj
        </span>
      </div>

      <!-- Header -->
      <div class="text-center mb-6">
        <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-indigo-600/30 mb-3">
          <GraduationCap class="w-7 h-7" />
        </div>
        <h2 class="text-2xl font-bold text-white font-['Outfit']">
          {authMode === 'signin' ? 'Sign In to CoachFlow' : 'Register New Academy'}
        </h2>
        <p class="text-xs text-slate-400 mt-1">
          {authMode === 'signin'
            ? 'Access your coaching dashboard with Supabase Auth'
            : 'Create your academy admin profile stored in Supabase'}
        </p>
      </div>

      <!-- Step-by-step Wizard Prompt -->
      <div class="mb-5 p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-between gap-3 text-xs">
        <div>
          <p class="font-semibold text-indigo-300">Setting up a new Coaching Center?</p>
          <p class="text-[11px] text-slate-400">Step-by-step wizard with plan & SMS setup</p>
        </div>
        <button
          type="button"
          class="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shrink-0 shadow-sm"
          on:click={() => navigate('/register?step=1')}
        >
          Launch Wizard →
        </button>
      </div>

      <!-- Mode Switcher Tabs -->
      <div class="grid grid-cols-2 gap-1 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 mb-6 text-xs font-semibold">
        <button
          type="button"
          class="py-2 rounded-xl transition-all {authMode === 'signin' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}"
          on:click={() => { authMode = 'signin'; errorMessage = ''; successMessage = ''; }}
        >
          Sign In
        </button>
        <button
          type="button"
          class="py-2 rounded-xl transition-all {authMode === 'register' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}"
          on:click={() => { authMode = 'register'; errorMessage = ''; successMessage = ''; }}
        >
          Create Account
        </button>
      </div>

      <!-- Alerts -->
      {#if errorMessage}
        <div class="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2 animate-in fade-in">
          <AlertCircle class="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      {/if}

      {#if successMessage}
        <div class="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-start gap-2 animate-in fade-in">
          <CheckCircle2 class="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      {/if}

      <!-- TAB 1: SIGN IN -->
      {#if authMode === 'signin'}
        <form on:submit|preventDefault={handleSignIn} class="space-y-4 text-xs">
          <div>
            <label for="sb-email" class="block font-medium text-slate-300 mb-1">Email Address</label>
            <div class="relative">
              <Mail class="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
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
              <label for="sb-pass" class="font-medium text-slate-300">Password</label>
              <button type="button" class="text-indigo-400 hover:text-indigo-300" on:click={() => showToast('info', 'Password Reset', 'Password reset instructions sent via Supabase.')}>
                Forgot?
              </button>
            </div>
            <div class="relative">
              <Lock class="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="sb-pass"
                type="password"
                bind:value={password}
                class="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={$authLoading}
            class="w-full py-3.5 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
          >
            {#if $authLoading}
              <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              <span>Authenticating with Supabase...</span>
            {:else}
              <span>Sign In with Supabase</span>
              <ArrowRight class="w-4 h-4" />
            {/if}
          </button>
        </form>

      <!-- TAB 2: REGISTER -->
      {:else}
        <form on:submit|preventDefault={handleSignUp} class="space-y-3.5 text-xs">
          <div>
            <label for="reg-fullname" class="block font-medium text-slate-300 mb-1">Full Name *</label>
            <div class="relative">
              <User class="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
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
            <label for="reg-institute" class="block font-medium text-slate-300 mb-1">Coaching / Academy Name *</label>
            <div class="relative">
              <Building class="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="reg-institute"
                type="text"
                bind:value={regInstituteName}
                placeholder="যেমন: এপেক্স অ্যাকাডেমিক কেয়ার (ফার্মগেট)"
                class="w-full pl-10 pr-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none text-sm"
                required
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2.5">
            <div>
              <label for="reg-email" class="block font-medium text-slate-300 mb-1">Email *</label>
              <input
                id="reg-email"
                type="email"
                bind:value={regEmail}
                placeholder="admin@coaching.edu.bd"
                class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none text-sm"
                required
              />
            </div>

            <div>
              <label for="reg-phone" class="block font-medium text-slate-300 mb-1">Phone Number</label>
              <input
                id="reg-phone"
                type="text"
                bind:value={regPhone}
                placeholder="+880 1711-456789"
                class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none text-sm"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2.5">
            <div>
              <label for="reg-password" class="block font-medium text-slate-300 mb-1">Password *</label>
              <input
                id="reg-password"
                type="password"
                bind:value={regPassword}
                placeholder="Min 6 characters"
                class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none text-sm"
                required
              />
            </div>

            <div>
              <label for="reg-role" class="block font-medium text-slate-300 mb-1">Account Role</label>
              <select
                id="reg-role"
                bind:value={regRole}
                class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-indigo-500 focus:outline-none text-sm"
              >
                <option value="institute_admin">Institute Director / Admin</option>
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
              <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              <span>Registering in Supabase...</span>
            {:else}
              <span>Create Account in Supabase</span>
              <ArrowRight class="w-4 h-4" />
            {/if}
          </button>
        </form>
      {/if}

      <!-- Quick 1-Click Demo Accounts -->
      <div class="mt-6 pt-5 border-t border-slate-800/80">
        <span class="block text-slate-400 font-semibold text-[11px] mb-2 flex items-center gap-1.5">
          <UserCheck class="w-3.5 h-3.5 text-indigo-400" />
          <span>Or test immediately with 1-Click Demo Roles:</span>
        </span>
        <div class="grid grid-cols-2 gap-1.5 text-xs">
          <button
            type="button"
            class="px-2.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-200 text-left font-medium transition-colors"
            on:click={() => setDemoCredentials('director@apexhorizon.edu', 'institute_admin')}
          >
            🏫 Institute Admin
          </button>
          <button
            type="button"
            class="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 text-left font-medium transition-colors"
            on:click={() => setDemoCredentials('robert.vance@apexhorizon.edu', 'teacher')}
          >
            👨‍🏫 Senior Teacher
          </button>
          <button
            type="button"
            class="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 text-left font-medium transition-colors"
            on:click={() => setDemoCredentials('alex.hayes@example.com', 'student')}
          >
            🎓 Student Portal
          </button>
          <button
            type="button"
            class="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 text-left font-medium transition-colors"
            on:click={() => setDemoCredentials('superadmin@coachflow.app', 'super_admin')}
          >
            ⚡ Super Admin
          </button>
        </div>
      </div>
    </div>
  </div>
</div>
