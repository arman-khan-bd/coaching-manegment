<script lang="ts">
  import {
    subscriptionPlans,
    coachingInstitutes,
    platformSubscriptions,
    platformUsers,
    platformSettings,
    platformTransactions,
    addPlan,
    updatePlan,
    deletePlan,
    togglePlanStatus,
    addCoaching,
    updateCoaching,
    toggleCoachingStatus,
    deleteCoaching,
    addPlatformSubscription,
    updatePlatformSubscription,
    approveSubscription,
    rejectSubscription,
    suspendSubscription,
    activateSubscription,
    extendSubscription,
    deletePlatformSubscription,
    addPlatformUser,
    updatePlatformUser,
    togglePlatformUserStatus,
    deletePlatformUser,
    updatePlatformSettings,
    verifyPlatformTransaction,
    instituteSettings,
    showToast,
    type SubscriptionPlan,
    type CoachingInstitute,
    type PlatformSubscription,
    type PlatformUser,
    type PlatformSettings,
    type PlatformTransaction,
  } from '../store';
  import { navigate } from '../router';
  import Modal from '../components/Modal.svelte';
  import Badge from '../components/Badge.svelte';
  import {
    ShieldAlert,
    LayoutDashboard,
    Building2,
    CreditCard,
    Layers,
    Users,
    Settings,
    Receipt,
    TrendingUp,
    Plus,
    Pencil,
    Trash2,
    Search,
    Filter,
    CheckCircle2,
    AlertTriangle,
    Eye,
    ExternalLink,
    DollarSign,
    Sparkles,
    Smartphone,
    RefreshCw,
    X,
    Check,
    LogOut,
    ArrowUpRight,
    Lock,
    Globe,
    Bell,
    FileText,
    Printer,
    Pause,
    Play,
    UploadCloud,
    Share2,
    ShieldCheck,
    Image as ImageIcon,
    Sliders,
    Code2,
    AlertCircle,
    Clock,
    CheckCircle,
    XCircle,
    MapPin,
  } from 'lucide-svelte';

  export let activeTab: string = 'overview';

  // Sub-tabs list
  const navTabs = [
    { id: 'overview', label: 'ওভারভিউ (Overview)', icon: LayoutDashboard },
    { id: 'coachings', label: 'কোচিং ডিরেক্টরি (Coachings)', icon: Building2 },
    { id: 'plans', label: 'প্ল্যান প্যাকেজ (Plans)', icon: Layers },
    { id: 'subscriptions', label: 'সাবস্ক্রিপশন (Subscriptions)', icon: CreditCard },
    { id: 'users', label: 'ইউজার ও রোলস (Users)', icon: Users },
    { id: 'transactions', label: 'পেমেন্ট ও রসিদ (Billing)', icon: Receipt },
    { id: 'settings', label: 'প্ল্যাটফর্ম সেটিংস (Settings)', icon: Settings },
  ];

  // -------------------------------------------------------------
  // Executive Financial Metrics
  // -------------------------------------------------------------
  $: activeSubs = $platformSubscriptions.filter((s) => s.status === 'active');
  $: pendingSubs = $platformSubscriptions.filter((s) => s.status === 'pending_approval');
  $: mrr = activeSubs.reduce((sum, s) => {
    return sum + (s.billingCycle === 'monthly' ? s.amount : Math.round(s.amount / 12));
  }, 0);
  $: arr = mrr * 12;
  $: totalStudentsHosted = $coachingInstitutes.reduce((sum, c) => sum + (c.studentCount || 0), 0);
  $: totalPaidRevenue = $platformTransactions
    .filter((t) => t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  // -------------------------------------------------------------
  // Coachings Tab State
  // -------------------------------------------------------------
  let coachingSearchQuery = '';
  let coachingStatusFilter = 'all';

  $: filteredCoachings = $coachingInstitutes.filter((c) => {
    const q = coachingSearchQuery.toLowerCase();
    const matchQ =
      c.name.toLowerCase().includes(q) ||
      c.ownerName.toLowerCase().includes(q) ||
      c.ownerPhone.includes(q) ||
      c.city.toLowerCase().includes(q);
    const matchStatus = coachingStatusFilter === 'all' || c.status === coachingStatusFilter;
    return matchQ && matchStatus;
  });

  // Add Coaching Modal State
  let isAddCoachingModalOpen = false;
  let newCoachName = '';
  let newCoachOwner = '';
  let newCoachPhone = '';
  let newCoachEmail = '';
  let newCoachCity = 'ঢাকা';
  let newCoachAddress = '';
  let newCoachPlanId = 'pro';
  let newCoachCycle: 'monthly' | 'yearly' = 'yearly';

  function handleCreateCoaching() {
    if (!newCoachName.trim() || !newCoachOwner.trim() || !newCoachPhone.trim()) {
      showToast('error', 'প্রয়োজনীয় তথ্য দিন', 'প্রতিষ্ঠান, পরিচালক এবং মোবাইল নম্বর আবশ্যক।');
      return;
    }
    const selectedPlan = $subscriptionPlans.find((p) => p.id === newCoachPlanId);
    addCoaching({
      name: newCoachName.trim(),
      slug: newCoachName.trim().toLowerCase().replace(/\s+/g, '-'),
      ownerName: newCoachOwner.trim(),
      ownerEmail: newCoachEmail.trim() || `${newCoachPhone.replace(/[^0-9]/g, '')}@coachflow.local`,
      ownerPhone: newCoachPhone.trim(),
      city: newCoachCity.trim(),
      address: newCoachAddress.trim() || `${newCoachCity}, বাংলাদেশ`,
      planId: newCoachPlanId,
      planName: selectedPlan ? selectedPlan.name : 'প্রো প্ল্যান',
      billingCycle: newCoachCycle,
      status: 'active',
      studentCount: 0,
      teacherCount: 1,
      branchCount: 1,
      renewalDate: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
    });

    isAddCoachingModalOpen = false;
    newCoachName = '';
    newCoachOwner = '';
    newCoachPhone = '';
    newCoachEmail = '';
  }

  // Edit Coaching Modal
  let isEditCoachingModalOpen = false;
  let editingCoaching: CoachingInstitute | null = null;
  let editCoachName = '';
  let editCoachOwner = '';
  let editCoachPhone = '';
  let editCoachEmail = '';
  let editCoachCity = '';
  let editCoachPlanId = '';
  let editCoachStatus: CoachingInstitute['status'] = 'active';

  function openEditCoaching(c: CoachingInstitute) {
    editingCoaching = c;
    editCoachName = c.name;
    editCoachOwner = c.ownerName;
    editCoachPhone = c.ownerPhone;
    editCoachEmail = c.ownerEmail;
    editCoachCity = c.city;
    editCoachPlanId = c.planId;
    editCoachStatus = c.status;
    isEditCoachingModalOpen = true;
  }

  function handleUpdateCoaching() {
    if (!editingCoaching) return;
    const plan = $subscriptionPlans.find((p) => p.id === editCoachPlanId);
    updateCoaching(editingCoaching.id, {
      name: editCoachName,
      ownerName: editCoachOwner,
      ownerPhone: editCoachPhone,
      ownerEmail: editCoachEmail,
      city: editCoachCity,
      planId: editCoachPlanId,
      planName: plan ? plan.name : editingCoaching.planName,
      status: editCoachStatus,
    });
    isEditCoachingModalOpen = false;
  }

  function handleImpersonateCoaching(c: CoachingInstitute) {
    instituteSettings.update((curr) => ({
      ...curr,
      name: c.name,
      establishedYear: '২০১৮',
    }));
    showToast('info', 'অ্যাকাডেমি ভিউ', `"${c.name}"-এর ড্যাশবোর্ডে প্রবেশ করা হচ্ছে...`);
    navigate('/dashboard/overview');
  }

  // -------------------------------------------------------------
  // Plans / Packages Tab State
  // -------------------------------------------------------------
  let isAddPlanModalOpen = false;
  let newPlanName = '';
  let newPlanTag = '';
  let newPlanMonthlyPrice = 1990;
  let newPlanYearlyPrice = 19900;
  let newPlanStudentLimit = 250;
  let newPlanBranchLimit = 1;
  let newPlanSmsCredits = 1000;
  let newPlanAndroidGateway = true;
  let newPlanPopular = false;
  let newPlanStatus: 'active' | 'paused' = 'active';
  let newPlanDesc = '';
  let newPlanFeaturesText = 'সর্বোচ্চ ২৫০ জন শিক্ষার্থী\nডিজিটাল হাজিরা ও ফি রসিদ\nঅ্যান্ড্রয়েড SMS গেটওয়ে\nপ্রিন্টেবল আইডি কার্ড';

  function handleCreatePlan() {
    if (!newPlanName.trim()) {
      showToast('error', 'প্ল্যানের নাম প্রয়োজন', 'অনুগ্রহ করে প্ল্যানের নাম দিন।');
      return;
    }
    const features = newPlanFeaturesText
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean);

    addPlan({
      name: newPlanName.trim(),
      tag: newPlanTag.trim(),
      priceMonthly: Number(newPlanMonthlyPrice),
      priceYearly: Number(newPlanYearlyPrice),
      studentLimit: Number(newPlanStudentLimit),
      branchLimit: Number(newPlanBranchLimit),
      smsCreditsIncluded: Number(newPlanSmsCredits),
      androidGatewayIncluded: newPlanAndroidGateway,
      popular: newPlanPopular,
      status: newPlanStatus,
      description: newPlanDesc.trim(),
      features,
    });
    isAddPlanModalOpen = false;
  }

  // Edit Plan
  let isEditPlanModalOpen = false;
  let editingPlan: SubscriptionPlan | null = null;
  let editPlanName = '';
  let editPlanTag = '';
  let editPlanMonthlyPrice = 0;
  let editPlanYearlyPrice = 0;
  let editPlanStudentLimit = 0;
  let editPlanBranchLimit = 1;
  let editPlanSmsCredits = 0;
  let editPlanAndroidGateway = true;
  let editPlanPopular = false;
  let editPlanStatus: 'active' | 'paused' = 'active';
  let editPlanDesc = '';
  let editPlanFeaturesText = '';

  function openEditPlan(p: SubscriptionPlan) {
    editingPlan = p;
    editPlanName = p.name;
    editPlanTag = p.tag;
    editPlanMonthlyPrice = p.priceMonthly;
    editPlanYearlyPrice = p.priceYearly;
    editPlanStudentLimit = p.studentLimit;
    editPlanBranchLimit = p.branchLimit;
    editPlanSmsCredits = p.smsCreditsIncluded;
    editPlanAndroidGateway = p.androidGatewayIncluded;
    editPlanPopular = !!p.popular;
    editPlanStatus = p.status || 'active';
    editPlanDesc = p.description;
    editPlanFeaturesText = p.features.join('\n');
    isEditPlanModalOpen = true;
  }

  function handleUpdatePlan() {
    if (!editingPlan) return;
    const features = editPlanFeaturesText
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean);

    updatePlan(editingPlan.id, {
      name: editPlanName,
      tag: editPlanTag,
      priceMonthly: Number(editPlanMonthlyPrice),
      priceYearly: Number(editPlanYearlyPrice),
      studentLimit: Number(editPlanStudentLimit),
      branchLimit: Number(editPlanBranchLimit),
      smsCreditsIncluded: Number(editPlanSmsCredits),
      androidGatewayIncluded: editPlanAndroidGateway,
      popular: editPlanPopular,
      status: editPlanStatus,
      description: editPlanDesc,
      features,
    });
    isEditPlanModalOpen = false;
  }

  // Delete Plan Confirmation Modal
  let isDeletePlanModalOpen = false;
  let planToDelete: SubscriptionPlan | null = null;

  function promptDeletePlan(p: SubscriptionPlan) {
    planToDelete = p;
    isDeletePlanModalOpen = true;
  }

  function confirmDeletePlan() {
    if (planToDelete) {
      deletePlan(planToDelete.id);
      isDeletePlanModalOpen = false;
      planToDelete = null;
    }
  }

  // -------------------------------------------------------------
  // Subscriptions Tab State (Accept, Reject, Suspend, Extend)
  // -------------------------------------------------------------
  let subStatusFilter: 'all' | 'pending_approval' | 'active' | 'trial' | 'past_due' | 'suspended' | 'rejected' = 'all';
  let subSearchQuery = '';

  $: filteredSubscriptions = $platformSubscriptions.filter((s) => {
    const q = subSearchQuery.toLowerCase();
    const matchQ =
      s.coachingName.toLowerCase().includes(q) ||
      (s.invoiceId && s.invoiceId.toLowerCase().includes(q)) ||
      (s.trxId && s.trxId.toLowerCase().includes(q)) ||
      (s.senderPhone && s.senderPhone.includes(q));
    const matchStatus = subStatusFilter === 'all' || s.status === subStatusFilter;
    return matchQ && matchStatus;
  });

  // Reject Subscription Modal
  let isRejectSubModalOpen = false;
  let rejectingSub: PlatformSubscription | null = null;
  let rejectionReasonInput = 'পেমেন্ট ভেরিফিকেশন ব্যর্থ হয়েছে (TrxID নট ম্যাচ)';

  function openRejectModal(s: PlatformSubscription) {
    rejectingSub = s;
    rejectionReasonInput = 'বিকাশ / নগদ পেমেন্ট ট্রানজেকশন আইডি সঠিক নয়';
    isRejectSubModalOpen = true;
  }

  function handleConfirmReject() {
    if (rejectingSub) {
      rejectSubscription(rejectingSub.id, rejectionReasonInput);
      isRejectSubModalOpen = false;
      rejectingSub = null;
    }
  }

  // Grant / Add Subscription Modal
  let isAddSubModalOpen = false;
  let newSubCoachingId = '';
  let newSubPlanId = 'pro';
  let newSubCycle: 'monthly' | 'yearly' = 'yearly';
  let newSubPayment: PlatformSubscription['paymentMethod'] = 'bKash';
  let newSubSenderPhone = '';
  let newSubTrxId = '';

  function handleGrantSubscription() {
    const coach = $coachingInstitutes.find((c) => c.id === newSubCoachingId);
    const plan = $subscriptionPlans.find((p) => p.id === newSubPlanId);
    if (!coach || !plan) {
      showToast('error', 'নির্বাচন করুন', 'কোচিং ও প্ল্যান নির্বাচন করা আবশ্যক।');
      return;
    }
    const amount = newSubCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly;
    addPlatformSubscription({
      coachingId: coach.id,
      coachingName: coach.name,
      planId: plan.id,
      planName: plan.name,
      amount,
      billingCycle: newSubCycle,
      status: 'active',
      paymentMethod: newSubPayment,
      senderPhone: newSubSenderPhone.trim(),
      trxId: newSubTrxId.trim() || `TRX-${Date.now().toString().slice(-6)}`,
      startDate: new Date().toISOString().split('T')[0],
      nextRenewalDate: new Date(Date.now() + (newSubCycle === 'yearly' ? 365 : 30) * 86400000)
        .toISOString()
        .split('T')[0],
      autoRenew: true,
    });
    isAddSubModalOpen = false;
  }

  // -------------------------------------------------------------
  // Users Tab State (Edit, Suspend, Delete)
  // -------------------------------------------------------------
  let userRoleFilter = 'all';
  let userSearchQuery = '';

  $: filteredUsers = $platformUsers.filter((u) => {
    const q = userSearchQuery.toLowerCase();
    const matchQ = u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.phone.includes(q);
    const matchRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    return matchQ && matchRole;
  });

  let isAddUserModalOpen = false;
  let newUserName = '';
  let newUserEmail = '';
  let newUserPhone = '';
  let newUserRole: PlatformUser['role'] = 'platform_support';
  let newUserInstituteId = '';

  function handleCreateUser() {
    if (!newUserName.trim() || !newUserEmail.trim()) {
      showToast('error', 'প্রয়োজনীয় তথ্য', 'নাম ও ইমেইল অবশ্যই দিন।');
      return;
    }
    const inst = $coachingInstitutes.find((c) => c.id === newUserInstituteId);
    addPlatformUser({
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      phone: newUserPhone.trim(),
      role: newUserRole,
      instituteId: inst?.id,
      instituteName: inst?.name,
      status: 'active',
    });
    isAddUserModalOpen = false;
    newUserName = '';
    newUserEmail = '';
    newUserPhone = '';
  }

  // Edit User Modal
  let isEditUserModalOpen = false;
  let editingUser: PlatformUser | null = null;
  let editUserName = '';
  let editUserEmail = '';
  let editUserPhone = '';
  let editUserRole: PlatformUser['role'] = 'institute_admin';
  let editUserStatus: PlatformUser['status'] = 'active';
  let editUserInstituteId = '';

  function openEditUser(u: PlatformUser) {
    editingUser = u;
    editUserName = u.name;
    editUserEmail = u.email;
    editUserPhone = u.phone;
    editUserRole = u.role;
    editUserStatus = u.status;
    editUserInstituteId = u.instituteId || '';
    isEditUserModalOpen = true;
  }

  function handleUpdateUser() {
    if (!editingUser) return;
    const inst = $coachingInstitutes.find((c) => c.id === editUserInstituteId);
    updatePlatformUser(editingUser.id, {
      name: editUserName,
      email: editUserEmail,
      phone: editUserPhone,
      role: editUserRole,
      status: editUserStatus,
      instituteId: inst?.id,
      instituteName: inst?.name,
    });
    isEditUserModalOpen = false;
  }

  // -------------------------------------------------------------
  // Payment Details & Receipt State
  // -------------------------------------------------------------
  let isPaymentDetailsModalOpen = false;
  let selectedPayment: PlatformTransaction | null = null;

  function openPaymentDetails(t: PlatformTransaction) {
    selectedPayment = t;
    isPaymentDetailsModalOpen = true;
  }

  function handleVerifyPayment(t: PlatformTransaction) {
    verifyPlatformTransaction(t.id);
    if (selectedPayment && selectedPayment.id === t.id) {
      selectedPayment = { ...selectedPayment, status: 'completed' };
    }
  }

  // -------------------------------------------------------------
  // Platform Settings State (General, Branding, SEO, Pixel, Gateways)
  // -------------------------------------------------------------
  let settingsSubTab: 'general' | 'branding' | 'seo' | 'pixel' | 'gateways' = 'general';

  // 1. General
  let settingsName = $platformSettings.platformName;
  let settingsTagline = $platformSettings.tagline;
  let settingsEmail = $platformSettings.supportEmail;
  let settingsPhone = $platformSettings.supportPhone;
  let settingsWebsite = $platformSettings.websiteUrl;
  let settingsTrialDays = $platformSettings.trialDays;
  let settingsSmsRate = $platformSettings.defaultSmsRate;
  let settingsCurrency = $platformSettings.currency || 'BDT';
  let settingsCurrencySymbol = $platformSettings.currencySymbol || '৳';
  let settingsMaintenance = $platformSettings.maintenanceMode;
  let settingsAnnouncement = $platformSettings.globalAnnouncement;

  // 2. Branding & Cloudinary
  let settingsLogoUrl = $platformSettings.logoUrl || '';
  let settingsFaviconUrl = $platformSettings.faviconUrl || '';
  let settingsDarkLogoUrl = $platformSettings.darkLogoUrl || '';
  let settingsCloudinaryName = $platformSettings.cloudinaryCloudName || 'coachflow-media';
  let settingsCloudinaryPreset = $platformSettings.cloudinaryUploadPreset || 'coachflow_saas_assets';
  let settingsCloudinaryKey = $platformSettings.cloudinaryApiKey || '';
  let isUploadingCloudinary = false;
  let cloudinaryTarget: 'logo' | 'favicon' | 'ogImage' = 'logo';

  // 3. SEO
  let settingsMetaTitle = $platformSettings.metaTitle;
  let settingsMetaDescription = $platformSettings.metaDescription;
  let settingsMetaKeywords = $platformSettings.metaKeywords;
  let settingsOgImageUrl = $platformSettings.ogImageUrl;
  let settingsCanonicalUrl = $platformSettings.canonicalUrl || 'https://coaching-bd.netlify.app';
  let settingsGoogleVerification = $platformSettings.googleSiteVerification || '';
  let settingsRobots = $platformSettings.robotsIndexing ?? true;

  // 4. Pixel & Tracking
  let settingsFbPixelId = $platformSettings.facebookPixelId;
  let settingsFbToken = $platformSettings.fbAccessToken || '';
  let settingsFbConversions = $platformSettings.conversionsApiEnabled ?? true;
  let settingsGA4Id = $platformSettings.googleAnalyticsId;
  let settingsHeadScripts = $platformSettings.customHeadScripts || '';
  let settingsBodyScripts = $platformSettings.customBodyScripts || '';

  // 5. Gateways
  let settingsBkashNumber = $platformSettings.bkashConfig.merchantNumber;
  let settingsBkashAppKey = $platformSettings.bkashConfig.appKey;
  let settingsBkashSecret = $platformSettings.bkashConfig.appSecret || '';
  let settingsBkashUser = $platformSettings.bkashConfig.username || 'coachflow_merchant';
  let settingsBkashPass = $platformSettings.bkashConfig.password || '';
  let settingsBkashSandbox = $platformSettings.bkashConfig.sandbox ?? false;
  let settingsBkashActive = $platformSettings.bkashConfig.active ?? true;

  let settingsNagadNumber = $platformSettings.nagadConfig.merchantNumber;
  let settingsNagadId = $platformSettings.nagadConfig.merchantId || '';
  let settingsNagadPublicKey = $platformSettings.nagadConfig.publicKey || '';
  let settingsNagadActive = $platformSettings.nagadConfig.active ?? true;

  let settingsStripePublishable = $platformSettings.stripeConfig.publishableKey;
  let settingsStripeSecret = $platformSettings.stripeConfig.secretKey || '';
  let settingsStripeWebhook = $platformSettings.stripeConfig.webhookSecret || '';
  let settingsStripeActive = $platformSettings.stripeConfig.active ?? true;

  let settingsBankName = $platformSettings.bankConfig?.bankName || 'Dutch-Bangla Bank PLC';
  let settingsBankAccountName = $platformSettings.bankConfig?.accountName || 'CoachFlow Technologies Ltd.';
  let settingsBankAccountNumber = $platformSettings.bankConfig?.accountNumber || '126.120.0098214';
  let settingsBankBranch = $platformSettings.bankConfig?.branch || 'Farmgate Corporate Branch, Dhaka';
  let settingsBankRouting = $platformSettings.bankConfig?.routingNumber || '090271829';
  let settingsBankInstructions = $platformSettings.bankConfig?.instructions || 'অনুগ্রহ করে মানি রিসিট বা EFTN রেফারেন্স পাঠান।';
  let settingsBankActive = $platformSettings.bankConfig?.active ?? true;

  // Cloudinary Direct Upload Handler
  async function handleCloudinaryUpload(event: Event, target: 'logo' | 'favicon' | 'ogImage') {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];

    isUploadingCloudinary = true;
    cloudinaryTarget = target;

    try {
      if (settingsCloudinaryName.trim() && settingsCloudinaryPreset.trim()) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', settingsCloudinaryPreset.trim());

        const res = await fetch(`https://api.cloudinary.com/v1_1/${settingsCloudinaryName.trim()}/image/upload`, {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          if (data.secure_url) {
            if (target === 'logo') settingsLogoUrl = data.secure_url;
            else if (target === 'favicon') settingsFaviconUrl = data.secure_url;
            else if (target === 'ogImage') settingsOgImageUrl = data.secure_url;
            showToast('success', 'Cloudinary আপলোড সম্পন্ন', 'ক্লাউড সিডিএন-এ ফাইল সফলভাবে আপলোড হয়েছে!');
            isUploadingCloudinary = false;
            return;
          }
        }
      }

      // Fallback: Read file as high-res Data URL preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (target === 'logo') settingsLogoUrl = result;
        else if (target === 'favicon') settingsFaviconUrl = result;
        else if (target === 'ogImage') settingsOgImageUrl = result;
        showToast('info', 'লোকাল প্রিভিউ সংরক্ষিত', 'ফাইল প্রিভিউ যুক্ত হয়েছে (ক্লাউড সেটিংসে সেভ করুন)।');
        isUploadingCloudinary = false;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      showToast('error', 'আপলোড ত্রুটি', 'ফাইল আপলোডে সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।');
      isUploadingCloudinary = false;
    }
  }

  function handleSaveAllSettings() {
    updatePlatformSettings({
      platformName: settingsName,
      tagline: settingsTagline,
      supportEmail: settingsEmail,
      supportPhone: settingsPhone,
      websiteUrl: settingsWebsite,
      trialDays: Number(settingsTrialDays),
      defaultSmsRate: Number(settingsSmsRate),
      currency: settingsCurrency,
      currencySymbol: settingsCurrencySymbol,
      maintenanceMode: settingsMaintenance,
      globalAnnouncement: settingsAnnouncement,

      logoUrl: settingsLogoUrl,
      faviconUrl: settingsFaviconUrl,
      darkLogoUrl: settingsDarkLogoUrl,
      cloudinaryCloudName: settingsCloudinaryName,
      cloudinaryUploadPreset: settingsCloudinaryPreset,
      cloudinaryApiKey: settingsCloudinaryKey,

      metaTitle: settingsMetaTitle,
      metaDescription: settingsMetaDescription,
      metaKeywords: settingsMetaKeywords,
      ogImageUrl: settingsOgImageUrl,
      canonicalUrl: settingsCanonicalUrl,
      googleSiteVerification: settingsGoogleVerification,
      robotsIndexing: settingsRobots,

      facebookPixelId: settingsFbPixelId,
      fbAccessToken: settingsFbToken,
      conversionsApiEnabled: settingsFbConversions,
      googleAnalyticsId: settingsGA4Id,
      customHeadScripts: settingsHeadScripts,
      customBodyScripts: settingsBodyScripts,

      bkashConfig: {
        merchantNumber: settingsBkashNumber,
        appKey: settingsBkashAppKey,
        appSecret: settingsBkashSecret,
        username: settingsBkashUser,
        password: settingsBkashPass,
        sandbox: settingsBkashSandbox,
        active: settingsBkashActive,
      },
      nagadConfig: {
        merchantNumber: settingsNagadNumber,
        merchantId: settingsNagadId,
        publicKey: settingsNagadPublicKey,
        active: settingsNagadActive,
      },
      stripeConfig: {
        publishableKey: settingsStripePublishable,
        secretKey: settingsStripeSecret,
        webhookSecret: settingsStripeWebhook,
        active: settingsStripeActive,
      },
      bankConfig: {
        bankName: settingsBankName,
        accountName: settingsBankAccountName,
        accountNumber: settingsBankAccountNumber,
        branch: settingsBankBranch,
        routingNumber: settingsBankRouting,
        instructions: settingsBankInstructions,
        active: settingsBankActive,
      },
    });
  }
</script>

<div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
  <!-- SAAS ADMIN LEFT SIDEBAR -->
  <aside class="w-full md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
    <!-- Brand Header -->
    <div class="p-5 border-b border-slate-800 flex items-center justify-between">
      <div class="flex items-center gap-2.5">
        <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
          <ShieldAlert class="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 class="text-base font-bold text-white font-['Outfit'] tracking-tight">CoachFlow</h1>
          <span class="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/80 px-1.5 py-0.2 rounded border border-amber-500/30">
            Super Admin
          </span>
        </div>
      </div>
    </div>

    <!-- Navigation Menu -->
    <nav class="p-3 space-y-1 flex-1 overflow-y-auto">
      {#each navTabs as tab}
        <button
          type="button"
          class="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all {activeTab === tab.id ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'}"
          on:click={() => navigate(`/admin/${tab.id}`)}
        >
          <div class="flex items-center gap-3">
            <svelte:component this={tab.icon} class="w-4 h-4 shrink-0" />
            <span>{tab.label}</span>
          </div>
          {#if tab.id === 'subscriptions' && pendingSubs.length > 0}
            <span class="px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px]">
              {pendingSubs.length}
            </span>
          {/if}
        </button>
      {/each}
    </nav>

    <!-- Bottom Actions -->
    <div class="p-4 border-t border-slate-800 space-y-2">
      <button
        type="button"
        class="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-950 hover:bg-slate-800 border border-slate-800 transition-colors"
        on:click={() => navigate('/dashboard/overview')}
      >
        <div class="flex items-center gap-2">
          <ExternalLink class="w-3.5 h-3.5 text-indigo-400" />
          <span>কোচিং ভিউতে যান</span>
        </div>
        <ArrowUpRight class="w-3.5 h-3.5 text-slate-500" />
      </button>

      <button
        type="button"
        class="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-950/30 transition-colors"
        on:click={() => {
          navigate('/login');
          showToast('info', 'প্রস্থান', 'সুপার অ্যাডমিন সেশন শেষ হয়েছে।');
        }}
      >
        <LogOut class="w-3.5 h-3.5" />
        <span>লগআউট করুন</span>
      </button>
    </div>
  </aside>

  <!-- MAIN CONTENT AREA -->
  <main class="flex-1 flex flex-col min-w-0 overflow-y-auto">
    <!-- Top Bar -->
    <header class="h-16 bg-slate-900/80 border-b border-slate-800 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between sticky top-0 z-20">
      <div class="flex items-center gap-3">
        <h2 class="text-sm sm:text-base font-bold text-white capitalize font-['Outfit']">
          {navTabs.find((t) => t.id === activeTab)?.label || 'সুপার অ্যাডমিন ড্যাশবোর্ড'}
        </h2>
        {#if $platformSettings.maintenanceMode}
          <span class="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold animate-pulse">
            ⚠️ Maintenance Mode Active
          </span>
        {/if}
      </div>

      <div class="flex items-center gap-3">
        <!-- Quick MRR Widget -->
        <div class="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
          <span class="text-slate-400">Live MRR:</span>
          <span class="font-mono font-bold text-emerald-400">৳{mrr.toLocaleString()}</span>
        </div>

        <button
          type="button"
          class="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-950 hover:bg-slate-800 border border-slate-800 transition-colors"
          on:click={() => showToast('info', 'সিস্টেম স্ট্যাটাস', 'ক্লাউড ও পেমেন্ট গেটওয়ে স্বাভাবিকভাবে সচল রয়েছে।')}
          title="নোটিফিকেশন"
        >
          <Bell class="w-4 h-4" />
        </button>
      </div>
    </header>

    <!-- Tab View Router Content -->
    <div class="p-4 sm:p-8 max-w-7xl w-full mx-auto space-y-6">

      <!-- ========================================================= -->
      <!-- TAB 1: EXECUTIVE OVERVIEW                                  -->
      <!-- ========================================================= -->
      {#if activeTab === 'overview'}
        <div class="space-y-6">
          <!-- Pending Subscriptions Alert Banner (If Any) -->
          {#if pendingSubs.length > 0}
            <div class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <AlertCircle class="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h4 class="text-sm font-bold text-white">{pendingSubs.length}টি সাবস্ক্রিপশন অনুরোধ অনুমোদনের অপেক্ষায়!</h4>
                  <p class="text-xs text-amber-200/80">বিকাশ ও নগদ পেমেন্ট যাচাই করে অনুমোদন (Accept) বা বাতিল (Reject) করুন।</p>
                </div>
              </div>
              <button
                type="button"
                class="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-all shadow-md shrink-0"
                on:click={() => {
                  activeTab = 'subscriptions';
                  subStatusFilter = 'pending_approval';
                }}
              >
                অনুরোধ পর্যালোচনা করুন →
              </button>
            </div>
          {/if}

          <!-- KPI Metric Ribbon -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 relative overflow-hidden">
              <div class="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>মাসিক রিকারিং রেভিনিউ (MRR)</span>
                <DollarSign class="w-4 h-4 text-emerald-400" />
              </div>
              <div class="text-2xl font-black text-emerald-400 font-mono">৳{mrr.toLocaleString()}</div>
              <div class="text-[10px] text-slate-500 mt-1">বার্ষিক রানরেট (ARR): ৳{arr.toLocaleString()}</div>
            </div>

            <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 relative overflow-hidden">
              <div class="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>মোট কোচিং সেন্টার</span>
                <Building2 class="w-4 h-4 text-indigo-400" />
              </div>
              <div class="text-2xl font-black text-white font-mono">{$coachingInstitutes.length}</div>
              <div class="text-[10px] text-emerald-400 mt-1">{activeSubs.length}টি পেইড অ্যাকাউন্ট</div>
            </div>

            <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 relative overflow-hidden">
              <div class="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>মোট শিক্ষার্থী ক্যাপাসিটি</span>
                <Users class="w-4 h-4 text-violet-400" />
              </div>
              <div class="text-2xl font-black text-white font-mono">{totalStudentsHosted.toLocaleString()}</div>
              <div class="text-[10px] text-slate-500 mt-1">সকল নিবন্ধিত সেন্টারে হোস্ট করা</div>
            </div>

            <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 relative overflow-hidden">
              <div class="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>সংগৃহীত মোট রেভিনিউ</span>
                <Receipt class="w-4 h-4 text-amber-400" />
              </div>
              <div class="text-2xl font-black text-amber-400 font-mono">৳{totalPaidRevenue.toLocaleString()}</div>
              <div class="text-[10px] text-slate-500 mt-1">গেটওয়ে ও ব্যাংক ট্রান্সফার মিলিয়ে</div>
            </div>
          </div>

          <!-- Quick Action Buttons Row -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              type="button"
              class="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 transition-all text-left flex items-center gap-3 shadow-md"
              on:click={() => (isAddPlanModalOpen = true)}
            >
              <div class="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Plus class="w-4 h-4" />
              </div>
              <div>
                <div class="text-xs font-bold text-white">+ নতুন প্যাকেজ</div>
                <div class="text-[10px] text-slate-400">প্ল্যান রেট নির্ধারণ</div>
              </div>
            </button>

            <button
              type="button"
              class="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 transition-all text-left flex items-center gap-3 shadow-md"
              on:click={() => (isAddCoachingModalOpen = true)}
            >
              <div class="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Building2 class="w-4 h-4" />
              </div>
              <div>
                <div class="text-xs font-bold text-white">+ কোচিং নিবন্ধন</div>
                <div class="text-[10px] text-slate-400">নতুন টেন্যান্ট যোগ</div>
              </div>
            </button>

            <button
              type="button"
              class="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 transition-all text-left flex items-center gap-3 shadow-md"
              on:click={() => {
                activeTab = 'settings';
                settingsSubTab = 'branding';
              }}
            >
              <div class="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <UploadCloud class="w-4 h-4" />
              </div>
              <div>
                <div class="text-xs font-bold text-white">Cloudinary আপলোড</div>
                <div class="text-[10px] text-slate-400">লোগো ও ফ্যাভিকন</div>
              </div>
            </button>

            <button
              type="button"
              class="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-violet-500/50 transition-all text-left flex items-center gap-3 shadow-md"
              on:click={() => {
                activeTab = 'settings';
                settingsSubTab = 'pixel';
              }}
            >
              <div class="w-9 h-9 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center">
                <Code2 class="w-4 h-4" />
              </div>
              <div>
                <div class="text-xs font-bold text-white">Facebook Pixel</div>
                <div class="text-[10px] text-slate-400">ট্র্যাকিং কনফিগ</div>
              </div>
            </button>
          </div>

          <!-- Recent Subscriptions Table Preview -->
          <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-bold text-white flex items-center gap-2">
                <CreditCard class="w-4 h-4 text-indigo-400" />
                <span>সাম্প্রতিক সাবস্ক্রিপশন অ্যাক্টিভিটি</span>
              </h3>
              <button
                type="button"
                class="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                on:click={() => (activeTab = 'subscriptions')}
              >
                সবগুলো দেখুন →
              </button>
            </div>

            <!-- Overview Recent Subscriptions List View (with Border) -->
            <div class="space-y-2.5">
              {#each $platformSubscriptions.slice(0, 5) as sub}
                <div class="p-3.5 sm:p-4 rounded-xl bg-slate-950/60 border border-slate-800/90 hover:border-indigo-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-xl bg-indigo-950/60 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold shrink-0">
                      <Building2 class="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                      <div class="font-bold text-white text-xs sm:text-sm">{sub.coachingName}</div>
                      <div class="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span class="text-indigo-300 font-semibold">{sub.planName}</span>
                        <span>•</span>
                        <span class="text-slate-400">{sub.paymentMethod}</span>
                      </div>
                    </div>
                  </div>

                  <div class="flex items-center justify-between sm:justify-end gap-3.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
                    <div class="text-left sm:text-right">
                      <div class="font-mono font-bold text-emerald-400 text-xs sm:text-sm">৳{sub.amount.toLocaleString()}</div>
                      <div class="text-[10px] text-slate-500">পরিমাণ</div>
                    </div>

                    <div>
                      <Badge
                        variant={sub.status === 'active' ? 'success' : sub.status === 'pending_approval' ? 'warning' : sub.status === 'trial' ? 'info' : 'danger'}
                        size="sm"
                      >
                        {sub.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>

                    <div>
                      {#if sub.status === 'pending_approval'}
                        <button
                          type="button"
                          class="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-500 text-xs shadow-sm transition-all"
                          on:click={() => approveSubscription(sub.id)}
                        >
                          Accept
                        </button>
                      {:else}
                        <button
                          type="button"
                          class="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 text-xs font-semibold transition-all"
                          on:click={() => (activeTab = 'subscriptions')}
                        >
                          ব্যবস্থাপনা
                        </button>
                      {/if}
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </div>

      <!-- ========================================================= -->
      <!-- TAB 2: COACHINGS DIRECTORY                                -->
      <!-- ========================================================= -->
      {:else if activeTab === 'coachings'}
        <div class="space-y-4">
          <!-- Filters Bar -->
          <div class="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="flex items-center gap-3 flex-1 flex-wrap">
              <div class="relative w-full sm:w-72">
                <Search class="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="কোচিং নাম, পরিচালক বা ফোন খুঁজুন..."
                  bind:value={coachingSearchQuery}
                  class="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div class="flex items-center gap-1.5">
                <span class="text-xs text-slate-400">স্ট্যাটাস:</span>
                <select
                  bind:value={coachingStatusFilter}
                  class="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">সকল কোচিং ({$coachingInstitutes.length})</option>
                  <option value="active">Active (সক্রিয়)</option>
                  <option value="trial">Trial (ট্রায়াল)</option>
                  <option value="past_due">Past Due (বকেয়া)</option>
                  <option value="suspended">Suspended (স্থগিত)</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              class="px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md flex items-center gap-1.5"
              on:click={() => (isAddCoachingModalOpen = true)}
            >
              <Plus class="w-4 h-4" />
              <span>+ নতুন কোচিং সেন্টার নিবন্ধন</span>
            </button>
          </div>

          <!-- Coachings List View (with Border) -->
          <div class="space-y-3">
            {#if filteredCoachings.length === 0}
              <div class="p-8 text-center text-slate-500 rounded-2xl bg-slate-900/60 border border-slate-800">
                কোনো কোচিং প্রতিষ্ঠান পাওয়া যায়নি।
              </div>
            {:else}
              {#each filteredCoachings as c}
                <div class="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 transition-all shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <!-- Academy & Owner Info -->
                  <div class="flex items-start gap-3.5">
                    <div class="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-900/50 to-indigo-950 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold shrink-0 mt-0.5">
                      <Building2 class="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <div class="flex items-center gap-2 flex-wrap">
                        <span class="font-bold text-white text-sm sm:text-base">{c.name}</span>
                        <span class="px-2 py-0.5 rounded-md bg-slate-800 text-indigo-300 font-mono text-[10px] font-semibold border border-slate-700">
                          {c.id}
                        </span>
                        <Badge
                          variant={c.status === 'active' ? 'success' : c.status === 'trial' ? 'info' : c.status === 'past_due' ? 'warning' : 'danger'}
                          size="sm"
                        >
                          {c.status.toUpperCase()}
                        </Badge>
                      </div>

                      <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 mt-1">
                        <span class="text-slate-300 font-medium">মালিক: {c.ownerName}</span>
                        <span class="text-slate-600">•</span>
                        <span class="font-mono text-emerald-400">{c.ownerPhone}</span>
                        <span class="text-slate-600">•</span>
                        <span class="text-slate-400">{c.ownerEmail}</span>
                      </div>

                      <div class="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
                        <MapPin class="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{c.address}, {c.city}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Metadata & Actions -->
                  <div class="flex flex-wrap items-center justify-between lg:justify-end gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-800/80">
                    <!-- Plan & Renewal -->
                    <div class="text-left lg:text-right px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                      <div class="text-xs font-bold text-indigo-300">{c.planName}</div>
                      <div class="text-[10px] text-slate-400">রিনিউ: {c.renewalDate}</div>
                    </div>

                    <!-- Students Count -->
                    <div class="text-center px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                      <div class="text-xs font-bold text-white font-mono">{c.studentCount}</div>
                      <div class="text-[10px] text-slate-400">শিক্ষার্থী</div>
                    </div>

                    <!-- Action Buttons -->
                    <div class="flex items-center gap-1.5">
                      <button
                        type="button"
                        class="p-2 rounded-xl bg-indigo-600/15 hover:bg-indigo-600 text-indigo-400 hover:text-white transition-all border border-indigo-500/20"
                        title="অ্যাকাডেমিতে প্রবেশ করুন"
                        on:click={() => handleImpersonateCoaching(c)}
                      >
                        <Eye class="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700"
                        title="কোচিং তথ্য সম্পাদনা"
                        on:click={() => openEditCoaching(c)}
                      >
                        <Pencil class="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        class="p-2 rounded-xl {c.status === 'active' ? 'bg-amber-600/15 hover:bg-amber-600 text-amber-400 border border-amber-500/30' : 'bg-emerald-600/15 hover:bg-emerald-600 text-emerald-400 border border-emerald-500/30'} hover:text-white transition-all"
                        title={c.status === 'active' ? 'কোচিং স্থগিত করুন' : 'কোচিং সক্রিয় করুন'}
                        on:click={() => toggleCoachingStatus(c.id)}
                      >
                        <AlertTriangle class="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        class="p-2 rounded-xl bg-rose-600/15 hover:bg-rose-600 text-rose-400 hover:text-white transition-all border border-rose-500/30"
                        title="কোচিং মুছে ফেলুন"
                        on:click={() => {
                          if (confirm(`"${c.name}" প্রতিষ্ঠানটি মুছে ফেলতে চান?`)) deleteCoaching(c.id);
                        }}
                      >
                        <Trash2 class="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              {/each}
            {/if}
          </div>
        </div>

      <!-- ========================================================= -->
      <!-- TAB 3: PLANS & PACKAGES MANAGEMENT (Create/Edit/Pause/Delete)-->
      <!-- ========================================================= -->
      {:else if activeTab === 'plans'}
        <div class="space-y-6">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-bold text-white font-['Outfit']">SaaS সাবস্ক্রিপশন প্যাকেজ প্ল্যানসমূহ</h3>
              <p class="text-xs text-slate-400 mt-0.5">
                প্যাকেজ তৈরি, সম্পাদনা, সাময়িক স্থগিত (Pause) ও ডিলিট করুন। সক্রিয় প্ল্যানগুলো সরাসরি ওয়েবসাইটে দৃশ্যমান থাকে।
              </p>
            </div>
            <button
              type="button"
              class="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md flex items-center gap-1.5"
              on:click={() => (isAddPlanModalOpen = true)}
            >
              <Plus class="w-4 h-4" />
              <span>+ নতুন প্ল্যান তৈরি করুন</span>
            </button>
          </div>

          <!-- Plans Cards Grid -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            {#each $subscriptionPlans as plan}
              <div class="p-6 rounded-3xl bg-slate-900 border {plan.status === 'paused' ? 'border-amber-500/40 opacity-80' : plan.popular ? 'border-indigo-500 shadow-xl shadow-indigo-600/15' : 'border-slate-800'} flex flex-col justify-between relative transition-all">
                <!-- Badges -->
                <div class="absolute -top-3 left-6 flex items-center gap-2">
                  {#if plan.status === 'paused'}
                    <span class="px-3 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider shadow-sm flex items-center gap-1">
                      <Pause class="w-3 h-3" />
                      স্থগিত (PAUSED)
                    </span>
                  {/if}
                  {#if plan.popular}
                    <span class="px-3 py-0.5 rounded-full bg-indigo-600 text-white font-bold text-[10px] uppercase tracking-wider">
                      জনপ্রিয় (Popular)
                    </span>
                  {/if}
                </div>

                <div>
                  <div class="flex items-center justify-between mt-1">
                    <h4 class="text-base font-bold text-white">{plan.name}</h4>
                    <span class="text-xs font-mono font-bold text-indigo-400">৳{plan.priceMonthly}/মাস</span>
                  </div>
                  <p class="text-xs text-slate-400 mt-1">{plan.tag}</p>

                  <div class="mt-4 p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
                    <div class="flex justify-between">
                      <span class="text-slate-400">বার্ষিক মূল্য:</span>
                      <strong class="text-white">৳{plan.priceYearly}/বছর</strong>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-slate-400">শিক্ষার্থী লিমিট:</span>
                      <strong class="text-white">{plan.studentLimit.toLocaleString()} জন</strong>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-slate-400">ব্রাঞ্চ লিমিট:</span>
                      <strong class="text-white">{plan.branchLimit} টি</strong>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-slate-400">অন্তর্ভুক্ত SMS:</span>
                      <strong class="text-emerald-400">{plan.smsCreditsIncluded} টি</strong>
                    </div>
                    <div class="flex justify-between pt-1 border-t border-slate-800/80">
                      <span class="text-slate-400">স্ট্যাটাস:</span>
                      <span class="font-bold {plan.status === 'paused' ? 'text-amber-400' : 'text-emerald-400'}">
                        {plan.status === 'paused' ? 'সাময়িক স্থগিত (Paused)' : 'সক্রিয় (Active)'}
                      </span>
                    </div>
                  </div>

                  <!-- Features List -->
                  <div class="mt-4 space-y-1.5">
                    <span class="text-[10px] text-slate-500 uppercase font-semibold block">ফিচারসমূহ:</span>
                    {#each plan.features.slice(0, 5) as f}
                      <div class="flex items-center gap-2 text-xs text-slate-300">
                        <Check class="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{f}</span>
                      </div>
                    {/each}
                  </div>
                </div>

                <!-- Plan Actions: Pause, Edit, Delete -->
                <div class="flex items-center justify-between pt-6 mt-6 border-t border-slate-800">
                  <!-- Pause/Activate Toggle -->
                  <button
                    type="button"
                    class="px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 {plan.status === 'paused' ? 'bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600 hover:text-white' : 'bg-amber-600/20 text-amber-300 hover:bg-amber-600 hover:text-white'}"
                    on:click={() => togglePlanStatus(plan.id)}
                    title={plan.status === 'paused' ? 'প্যাকেজ পুনরায় চালু করুন' : 'প্যাকেজ সাময়িক স্থগিত করুন'}
                  >
                    {#if plan.status === 'paused'}
                      <Play class="w-3.5 h-3.5" />
                      <span>সক্রিয় করুন</span>
                    {:else}
                      <Pause class="w-3.5 h-3.5" />
                      <span>পজ (Pause)</span>
                    {/if}
                  </button>

                  <div class="flex items-center gap-1.5">
                    <button
                      type="button"
                      class="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors flex items-center gap-1.5"
                      on:click={() => openEditPlan(plan)}
                    >
                      <Pencil class="w-3.5 h-3.5 text-indigo-400" />
                      <span>সম্পাদনা</span>
                    </button>

                    <button
                      type="button"
                      class="p-2 rounded-xl text-rose-400 hover:text-white bg-rose-950/40 hover:bg-rose-900 transition-colors"
                      title="প্যাকেজ মুছে ফেলুন"
                      on:click={() => promptDeletePlan(plan)}
                    >
                      <Trash2 class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>

      <!-- ========================================================= -->
      <!-- TAB 4: SUBSCRIPTIONS (Accept, Reject, Suspend, Extend)     -->
      <!-- ========================================================= -->
      {:else if activeTab === 'subscriptions'}
        <div class="space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 class="text-lg font-bold text-white font-['Outfit']">কোচিং টেন্যান্ট সাবস্ক্রিপশন ট্র্যাকার</h3>
              <p class="text-xs text-slate-400 mt-0.5">পেন্ডিং অনুরোধ অনুমোদন (Accept), বাতিল (Reject), স্থগিত ও মেয়াদ বৃদ্ধি করুন।</p>
            </div>
            <button
              type="button"
              class="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md flex items-center gap-1.5 self-start sm:self-auto"
              on:click={() => (isAddSubModalOpen = true)}
            >
              <Plus class="w-4 h-4" />
              <span>+ ম্যানুয়াল সাবস্ক্রিপশন বরাদ্দ</span>
            </button>
          </div>

          <!-- Filter Pills & Search -->
          <div class="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <!-- Status Filter Tabs -->
            <div class="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              <button
                type="button"
                class="px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all {subStatusFilter === 'all' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-950 text-slate-400 hover:text-white'}"
                on:click={() => (subStatusFilter = 'all')}
              >
                সকল ({$platformSubscriptions.length})
              </button>
              <button
                type="button"
                class="px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 {subStatusFilter === 'pending_approval' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-950 text-amber-400 hover:text-amber-300'}"
                on:click={() => (subStatusFilter = 'pending_approval')}
              >
                <span>অপেক্ষারত (Pending)</span>
                {#if pendingSubs.length > 0}
                  <span class="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">{pendingSubs.length}</span>
                {/if}
              </button>
              <button
                type="button"
                class="px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all {subStatusFilter === 'active' ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-white'}"
                on:click={() => (subStatusFilter = 'active')}
              >
                সক্রিয় (Active)
              </button>
              <button
                type="button"
                class="px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all {subStatusFilter === 'suspended' ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-white'}"
                on:click={() => (subStatusFilter = 'suspended')}
              >
                স্থগিত (Suspended)
              </button>
              <button
                type="button"
                class="px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all {subStatusFilter === 'rejected' ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-white'}"
                on:click={() => (subStatusFilter = 'rejected')}
              >
                প্রত্যাখ্যাত (Rejected)
              </button>
            </div>

            <!-- Search input -->
            <div class="relative w-full md:w-64">
              <Search class="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="কোচিং, TrxID বা মোবাইল..."
                bind:value={subSearchQuery}
                class="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <!-- Subscriptions List View (with Border) -->
          <div class="space-y-3">
            {#if filteredSubscriptions.length === 0}
              <div class="p-8 text-center text-slate-500 rounded-2xl bg-slate-900/60 border border-slate-800">
                কোনো সাবস্ক্রিপশন রেকর্ড পাওয়া যায়নি।
              </div>
            {:else}
              {#each filteredSubscriptions as sub}
                <div class="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border {sub.status === 'pending_approval' ? 'border-amber-500/50 bg-amber-950/10' : 'border-slate-800'} hover:border-indigo-500/50 transition-all shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <!-- Coaching & Invoicing Info -->
                  <div class="flex items-start gap-3.5">
                    <div class="w-11 h-11 rounded-2xl {sub.status === 'pending_approval' ? 'bg-amber-950/60 border border-amber-500/40 text-amber-400' : 'bg-indigo-950/60 border border-indigo-500/30 text-indigo-400'} flex items-center justify-center font-bold shrink-0 mt-0.5">
                      <CreditCard class="w-5 h-5" />
                    </div>
                    <div>
                      <div class="flex items-center gap-2 flex-wrap">
                        <span class="font-bold text-white text-sm sm:text-base">{sub.coachingName}</span>
                        <span class="px-2 py-0.5 rounded-md bg-slate-800 text-indigo-300 font-mono text-[10px] font-semibold border border-slate-700">
                          {sub.invoiceId || sub.id}
                        </span>
                        <Badge
                          variant={sub.status === 'active' ? 'success' : sub.status === 'pending_approval' ? 'warning' : sub.status === 'trial' ? 'info' : 'danger'}
                          size="sm"
                        >
                          {sub.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>

                      <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 mt-1">
                        {#if sub.senderPhone}
                          <span class="font-mono text-emerald-400 font-semibold">মোবাইল: {sub.senderPhone}</span>
                          <span class="text-slate-600">•</span>
                        {/if}
                        {#if sub.trxId}
                          <span class="font-mono text-slate-300">TrxID: <strong class="text-amber-300">{sub.trxId}</strong></span>
                          <span class="text-slate-600">•</span>
                        {/if}
                        <span class="text-slate-300">গেটওয়ে: {sub.paymentMethod}</span>
                      </div>

                      <div class="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                        <span>প্ল্যান: <strong class="text-slate-300">{sub.planName}</strong> ({sub.billingCycle})</span>
                        <span>•</span>
                        <span>রিনিউ: <strong class="text-slate-400 font-mono">{sub.nextRenewalDate}</strong></span>
                      </div>

                      {#if sub.rejectionReason}
                        <div class="mt-1.5 text-xs text-rose-400 bg-rose-950/30 border border-rose-500/20 px-2.5 py-1 rounded-lg">
                          প্রত্যাখ্যানের কারণ: {sub.rejectionReason}
                        </div>
                      {/if}
                    </div>
                  </div>

                  <!-- Amount & Actions -->
                  <div class="flex flex-wrap items-center justify-between lg:justify-end gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-800/80">
                    <div class="text-left lg:text-right px-3.5 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                      <div class="text-base font-bold font-mono text-emerald-400">৳{sub.amount.toLocaleString()}</div>
                      <div class="text-[10px] text-slate-400">বিলিং পরিমাণ</div>
                    </div>

                    <div class="flex items-center gap-1.5 flex-wrap">
                      {#if sub.status === 'pending_approval'}
                        <button
                          type="button"
                          class="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                          on:click={() => approveSubscription(sub.id)}
                          title="সাবস্ক্রিপশন গ্রহণ ও সক্রিয় করুন"
                        >
                          <CheckCircle class="w-4 h-4" />
                          <span>Accept</span>
                        </button>

                        <button
                          type="button"
                          class="px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white font-semibold transition-all text-xs flex items-center gap-1.5 border border-rose-500/40"
                          on:click={() => openRejectModal(sub)}
                          title="সাবস্ক্রিপশন প্রত্যাখ্যান করুন"
                        >
                          <XCircle class="w-4 h-4" />
                          <span>Reject</span>
                        </button>
                      {:else if sub.status === 'active'}
                        <button
                          type="button"
                          class="px-3 py-1.5 rounded-xl bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600 hover:text-white transition-colors text-xs font-semibold border border-indigo-500/30"
                          on:click={() => extendSubscription(sub.id, 30)}
                          title="মেয়াদ ৩০ দিন বৃদ্ধি করুন"
                        >
                          +৩০ দিন
                        </button>

                        <button
                          type="button"
                          class="px-3 py-1.5 rounded-xl bg-amber-600/20 text-amber-300 hover:bg-amber-600 hover:text-white transition-colors text-xs font-semibold border border-amber-500/30"
                          on:click={() => suspendSubscription(sub.id)}
                          title="স্থগিত করুন"
                        >
                          স্থগিত
                        </button>
                      {:else if sub.status === 'suspended'}
                        <button
                          type="button"
                          class="px-3 py-1.5 rounded-xl bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600 hover:text-white transition-colors text-xs font-semibold border border-emerald-500/30 flex items-center gap-1"
                          on:click={() => activateSubscription(sub.id)}
                          title="সক্রিয় করুন"
                        >
                          <Play class="w-3.5 h-3.5" />
                          <span>সক্রিয়</span>
                        </button>
                      {/if}

                      <button
                        type="button"
                        class="p-2 rounded-xl bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-white transition-colors border border-rose-500/20"
                        title="সাবস্ক্রিপশন মুছুন"
                        on:click={() => {
                          if (confirm(`"${sub.coachingName}"-এর এই সাবস্ক্রিপশন রেকর্ড মুছে ফেলতে চান?`)) {
                            deletePlatformSubscription(sub.id);
                          }
                        }}
                      >
                        <Trash2 class="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              {/each}
            {/if}
          </div>
        </div>

      <!-- ========================================================= -->
      <!-- TAB 5: USERS & ROLES (Edit, Suspend, Delete)               -->
      <!-- ========================================================= -->
      {:else if activeTab === 'users'}
        <div class="space-y-4">
          <div class="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="flex items-center gap-3 flex-1 flex-wrap">
              <div class="relative w-full sm:w-72">
                <Search class="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ব্যবহারকারীর নাম বা ইমেইল খুঁজুন..."
                  bind:value={userSearchQuery}
                  class="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div class="flex items-center gap-1.5">
                <span class="text-xs text-slate-400">রোল:</span>
                <select
                  bind:value={userRoleFilter}
                  class="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">সকল রোল ({$platformUsers.length})</option>
                  <option value="super_admin">Super Admin</option>
                  <option value="platform_support">Support Lead</option>
                  <option value="institute_admin">Institute Admin</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              class="px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md flex items-center gap-1.5"
              on:click={() => (isAddUserModalOpen = true)}
            >
              <Plus class="w-4 h-4" />
              <span>+ নতুন ইউজার তৈরি</span>
            </button>
          </div>

          <!-- Users List View (with Border) -->
          <div class="space-y-3">
            {#if filteredUsers.length === 0}
              <div class="p-8 text-center text-slate-500 rounded-2xl bg-slate-900/60 border border-slate-800">
                কোনো ব্যবহারকারী পাওয়া যায়নি।
              </div>
            {:else}
              {#each filteredUsers as u}
                <div class="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 transition-all shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div class="flex items-start gap-3.5">
                    <div class="w-11 h-11 rounded-2xl bg-indigo-950/60 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold shrink-0 mt-0.5">
                      <Users class="w-5 h-5" />
                    </div>
                    <div>
                      <div class="flex items-center gap-2 flex-wrap">
                        <span class="font-bold text-white text-sm sm:text-base">{u.name}</span>
                        <Badge
                          variant={u.role === 'super_admin' ? 'danger' : u.role === 'platform_support' ? 'warning' : 'info'}
                          size="sm"
                        >
                          {u.role.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <Badge variant={u.status === 'active' ? 'success' : 'danger'} size="sm">
                          {u.status.toUpperCase()}
                        </Badge>
                      </div>

                      <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 mt-1">
                        <span class="font-mono text-slate-300">{u.email}</span>
                        <span class="text-slate-600">•</span>
                        <span class="font-mono text-emerald-400">{u.phone}</span>
                      </div>

                      <div class="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                        <span>সংযুক্ত প্রতিষ্ঠান: <strong class="text-slate-300">{u.instituteName || '— (SaaS Headquarters)'}</strong></span>
                        <span>•</span>
                        <span>সর্বশেষ লগইন: <strong class="text-slate-400">{u.lastLogin}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div class="flex items-center justify-end gap-1.5 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-800/80">
                    <button
                      type="button"
                      class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700"
                      title="ইউজার তথ্য সম্পাদনা করুন"
                      on:click={() => openEditUser(u)}
                    >
                      <Pencil class="w-4 h-4 text-indigo-400" />
                    </button>

                    <button
                      type="button"
                      class="p-2 rounded-xl {u.status === 'active' ? 'bg-amber-600/15 hover:bg-amber-600 text-amber-400 border border-amber-500/30' : 'bg-emerald-600/15 hover:bg-emerald-600 text-emerald-400 border border-emerald-500/30'} hover:text-white transition-all"
                      title={u.status === 'active' ? 'ইউজার স্থগিত (Suspend) করুন' : 'ইউজার সক্রিয় করুন'}
                      on:click={() => togglePlatformUserStatus(u.id)}
                    >
                      {#if u.status === 'active'}
                        <Pause class="w-4 h-4" />
                      {:else}
                        <Play class="w-4 h-4" />
                      {/if}
                    </button>

                    {#if u.role !== 'super_admin'}
                      <button
                        type="button"
                        class="p-2 rounded-xl bg-rose-600/15 text-rose-400 hover:bg-rose-600 hover:text-white transition-all border border-rose-500/30"
                        title="ইউজার মুছুন"
                        on:click={() => {
                          if (confirm(`"${u.name}" ব্যবহারকারীকে সিস্টেম থেকে মুছে ফেলতে চান?`)) {
                            deletePlatformUser(u.id);
                          }
                        }}
                      >
                        <Trash2 class="w-4 h-4" />
                      </button>
                    {/if}
                  </div>
                </div>
              {/each}
            {/if}
          </div>
        </div>

      <!-- ========================================================= -->
      <!-- TAB 6: TRANSACTIONS & BILLING (Payment Details)           -->
      <!-- ========================================================= -->
      {:else if activeTab === 'transactions'}
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-bold text-white font-['Outfit']">প্ল্যাটফর্ম রেভিনিউ ও পেমেন্ট রসিদ</h3>
              <p class="text-xs text-slate-400 mt-0.5">বিস্তারিত পেমেন্ট রেকর্ড, ট্রানজেকশন আইডি ও প্রিন্টেবল অফিশিয়াল মানি রসিদ।</p>
            </div>
            <div class="text-xs font-bold text-emerald-400 bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-500/30">
              মোট সংগৃহীত পেমেন্ট: ৳{totalPaidRevenue.toLocaleString()}
            </div>
          </div>

          <!-- Transactions List View (with Border) -->
          <div class="space-y-3">
            {#if $platformTransactions.length === 0}
              <div class="p-8 text-center text-slate-500 rounded-2xl bg-slate-900/60 border border-slate-800">
                কোনো পেমেন্ট বা লেনদেন নেই।
              </div>
            {:else}
              {#each $platformTransactions as trx}
                <div class="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 transition-all shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div class="flex items-start gap-3.5">
                    <div class="w-11 h-11 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold shrink-0 mt-0.5">
                      <Receipt class="w-5 h-5" />
                    </div>
                    <div>
                      <div class="flex items-center gap-2 flex-wrap">
                        <span class="font-bold text-white text-sm sm:text-base">{trx.coachingName}</span>
                        <span class="px-2 py-0.5 rounded-md bg-slate-800 text-indigo-300 font-mono text-[10px] font-semibold border border-slate-700">
                          {trx.receiptNumber || trx.id}
                        </span>
                        <Badge variant={trx.status === 'completed' ? 'success' : trx.status === 'pending' ? 'warning' : 'danger'} size="sm">
                          {trx.status.toUpperCase()}
                        </Badge>
                      </div>

                      <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 mt-1">
                        <span class="text-slate-300">{trx.itemTitle}</span>
                        <span class="text-slate-600">•</span>
                        <span class="font-mono text-slate-300">TrxID: <strong class="text-amber-300">{trx.trxId}</strong></span>
                        {#if trx.senderPhone}
                          <span class="text-slate-600">•</span>
                          <span class="font-mono text-emerald-400">{trx.senderPhone}</span>
                        {/if}
                      </div>

                      <div class="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                        <span>তারিখ: <strong class="text-slate-400 font-mono">{trx.date}</strong></span>
                        <span>•</span>
                        <span>পেমেন্ট মেথড: <span class="px-2 py-0.5 rounded text-[10px] font-semibold {trx.paymentMethod === 'bKash' ? 'bg-pink-950 text-pink-300 border border-pink-500/30' : trx.paymentMethod === 'Nagad' ? 'bg-orange-950 text-orange-300 border border-orange-500/30' : 'bg-slate-800 text-slate-300'}">{trx.paymentMethod}</span></span>
                      </div>
                    </div>
                  </div>

                  <div class="flex items-center justify-between lg:justify-end gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-800/80">
                    <div class="text-left lg:text-right px-3.5 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                      <div class="text-base font-bold font-mono text-emerald-400">৳{trx.amount.toLocaleString()}</div>
                      <div class="text-[10px] text-slate-400">পরিশোধিত</div>
                    </div>

                    <button
                      type="button"
                      class="px-3.5 py-2 rounded-xl bg-indigo-600/15 hover:bg-indigo-600 text-indigo-300 hover:text-white font-semibold transition-all inline-flex items-center gap-1.5 text-xs border border-indigo-500/30 shadow-sm"
                      on:click={() => openPaymentDetails(trx)}
                    >
                      <Eye class="w-4 h-4" />
                      <span>রসিদ ডিটেইলস</span>
                    </button>
                  </div>
                </div>
              {/each}
            {/if}
          </div>
        </div>

      <!-- ========================================================= -->
      <!-- TAB 7: PLATFORM SETTINGS (SEO, Branding, Cloudinary, Pixel)-->
      <!-- ========================================================= -->
      {:else if activeTab === 'settings'}
        <div class="space-y-6 max-w-5xl">
          <div>
            <h3 class="text-lg font-bold text-white font-['Outfit']">প্ল্যাটফর্ম গ্লোবাল কনফিগারেশন</h3>
            <p class="text-xs text-slate-400 mt-0.5">SEO, Cloudinary আপলোড, Facebook Pixel ট্র্যাকিং ও পেমেন্ট গেটওয়ে সেটআপ।</p>
          </div>

          <!-- Settings Sub-tabs Navigation -->
          <div class="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
            <button
              type="button"
              class="px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 {settingsSubTab === 'general' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-900 text-slate-400 hover:text-white'}"
              on:click={() => (settingsSubTab = 'general')}
            >
              <Sliders class="w-3.5 h-3.5" />
              <span>সাধারণ সেটিংস (General)</span>
            </button>
            <button
              type="button"
              class="px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 {settingsSubTab === 'branding' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-900 text-slate-400 hover:text-white'}"
              on:click={() => (settingsSubTab = 'branding')}
            >
              <UploadCloud class="w-3.5 h-3.5" />
              <span>ব্র্যান্ডিং ও Cloudinary</span>
            </button>
            <button
              type="button"
              class="px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 {settingsSubTab === 'seo' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-900 text-slate-400 hover:text-white'}"
              on:click={() => (settingsSubTab = 'seo')}
            >
              <Globe class="w-3.5 h-3.5" />
              <span>সার্চ ইঞ্জিন এসইও (SEO)</span>
            </button>
            <button
              type="button"
              class="px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 {settingsSubTab === 'pixel' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-900 text-slate-400 hover:text-white'}"
              on:click={() => (settingsSubTab = 'pixel')}
            >
              <Code2 class="w-3.5 h-3.5" />
              <span>Facebook Pixel & Tracking</span>
            </button>
            <button
              type="button"
              class="px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 {settingsSubTab === 'gateways' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-900 text-slate-400 hover:text-white'}"
              on:click={() => (settingsSubTab = 'gateways')}
            >
              <CreditCard class="w-3.5 h-3.5" />
              <span>পেমেন্ট গেটওয়ে API</span>
            </button>
          </div>

          <!-- SUB-TAB 1: GENERAL SETTINGS -->
          {#if settingsSubTab === 'general'}
            <div class="space-y-4">
              <div class="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
                <h4 class="text-xs font-bold text-indigo-400 uppercase tracking-wider">১. সাধারণ সাইট ইনফো ও হেল্পডেস্ক</h4>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label for="set-plat-name" class="block font-semibold text-slate-300 mb-1">প্ল্যাটফর্ম নাম</label>
                    <input
                      id="set-plat-name"
                      type="text"
                      bind:value={settingsName}
                      class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label for="set-plat-tag" class="block font-semibold text-slate-300 mb-1">ট্যাগলাইন</label>
                    <input
                      id="set-plat-tag"
                      type="text"
                      bind:value={settingsTagline}
                      class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label for="set-plat-email" class="block font-semibold text-slate-300 mb-1">অফিশিয়াল সাপোর্ট ইমেইল</label>
                    <input
                      id="set-plat-email"
                      type="email"
                      bind:value={settingsEmail}
                      class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label for="set-plat-phone" class="block font-semibold text-slate-300 mb-1">২৪/৭ সাপোর্ট হেল্পলাইন</label>
                    <input
                      id="set-plat-phone"
                      type="text"
                      bind:value={settingsPhone}
                      class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label for="set-plat-website" class="block font-semibold text-slate-300 mb-1">মূল ওয়েবসাইট URL</label>
                    <input
                      id="set-plat-website"
                      type="url"
                      bind:value={settingsWebsite}
                      class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label for="set-currency" class="block font-semibold text-slate-300 mb-1">ডিফল্ট মুদ্রা (Currency)</label>
                    <div class="grid grid-cols-2 gap-2">
                      <input
                        id="set-currency"
                        type="text"
                        bind:value={settingsCurrency}
                        placeholder="BDT"
                        class="px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                      />
                      <input
                        type="text"
                        bind:value={settingsCurrencySymbol}
                        placeholder="৳"
                        class="px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <!-- Policies & Maintenance -->
              <div class="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
                <h4 class="text-xs font-bold text-indigo-400 uppercase tracking-wider">২. পলিসি ও গ্লোবাল সিস্টেম কন্ট্রোল</h4>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label for="set-trial-days" class="block font-semibold text-slate-300 mb-1">ফ্রি ট্রায়াল সময়কাল (দিন)</label>
                    <input
                      id="set-trial-days"
                      type="number"
                      bind:value={settingsTrialDays}
                      class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label for="set-sms-rate" class="block font-semibold text-slate-300 mb-1">ডিফল্ট ক্লাউড SMS রেট (৳ / SMS)</label>
                    <input
                      id="set-sms-rate"
                      type="number"
                      step="0.01"
                      bind:value={settingsSmsRate}
                      class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div class="sm:col-span-2">
                    <label for="set-announcement" class="block font-semibold text-slate-300 mb-1">সিস্টেম-ওয়াইড অ্যানাউন্সমেন্ট ব্যানার</label>
                    <input
                      id="set-announcement"
                      type="text"
                      bind:value={settingsAnnouncement}
                      class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div class="sm:col-span-2 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <div>
                      <div class="font-bold text-white text-xs">সিস্টেম মেইনটেন্যান্স মোড (Maintenance Mode)</div>
                      <div class="text-[11px] text-slate-400">চালু থাকলে সাধারণ ব্যবহারকারীরা "Under Maintenance" পেজ দেখতে পাবেন।</div>
                    </div>
                    <input
                      type="checkbox"
                      bind:checked={settingsMaintenance}
                      class="w-5 h-5 rounded text-rose-600 focus:ring-rose-500 bg-slate-950 border-slate-700"
                    />
                  </div>
                </div>
              </div>
            </div>

          <!-- SUB-TAB 2: BRANDING & CLOUDINARY -->
          {:else if settingsSubTab === 'branding'}
            <div class="space-y-4">
              <!-- Cloudinary Configuration Card -->
              <div class="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <UploadCloud class="w-5 h-5 text-indigo-400" />
                    <h4 class="text-xs font-bold text-indigo-400 uppercase tracking-wider">Cloudinary মিডিয়া আপলোড API কনফিগারেশন</h4>
                  </div>
                  <a
                    href="https://cloudinary.com/console"
                    target="_blank"
                    rel="noreferrer"
                    class="text-xs text-indigo-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    Cloudinary Console ↗
                  </a>
                </div>
                <p class="text-xs text-slate-400">
                  Cloudinary Cloud Name ও Unsigned Upload Preset দিয়ে সরাসরি ব্রাউজার থেকে ছবি ক্লাউড সিডিএন-এ আপলোড করুন।
                </p>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label for="cld-cloud-name" class="block font-semibold text-slate-300 mb-1">Cloud Name *</label>
                    <input
                      id="cld-cloud-name"
                      type="text"
                      bind:value={settingsCloudinaryName}
                      placeholder="e.g. coachflow-media"
                      class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label for="cld-preset" class="block font-semibold text-slate-300 mb-1">Upload Preset (Unsigned) *</label>
                    <input
                      id="cld-preset"
                      type="text"
                      bind:value={settingsCloudinaryPreset}
                      placeholder="e.g. coachflow_preset"
                      class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label for="cld-key" class="block font-semibold text-slate-300 mb-1">API Key (ঐচ্ছিক)</label>
                    <input
                      id="cld-key"
                      type="text"
                      bind:value={settingsCloudinaryKey}
                      placeholder="1234567890..."
                      class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <!-- Logo & Favicon Upload Cards -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <!-- Platform Main Logo -->
                <div class="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
                  <div class="flex items-center justify-between">
                    <h5 class="text-xs font-bold text-white uppercase tracking-wider">১. প্ল্যাটফর্ম মেইন লোগো (Logo)</h5>
                    <span class="text-[10px] text-slate-400">PNG / SVG / WEBP</span>
                  </div>

                  <div class="flex items-center gap-4">
                    <div class="w-16 h-16 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center p-2 shrink-0 overflow-hidden">
                      {#if settingsLogoUrl}
                        <img src={settingsLogoUrl} alt="Logo" class="max-h-full max-w-full object-contain" />
                      {:else}
                        <ImageIcon class="w-6 h-6 text-slate-600" />
                      {/if}
                    </div>
                    <div class="flex-1 space-y-2">
                      <label class="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md">
                        <UploadCloud class="w-4 h-4" />
                        <span>{isUploadingCloudinary && cloudinaryTarget === 'logo' ? 'আপলোড হচ্ছে...' : 'লোগো আপলোড করুন'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          class="hidden"
                          on:change={(e) => handleCloudinaryUpload(e, 'logo')}
                          disabled={isUploadingCloudinary}
                        />
                      </label>
                      <input
                        type="text"
                        placeholder="অথবা সরাসরি ইমেজ লিংক (URL) দিন"
                        bind:value={settingsLogoUrl}
                        class="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-white focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>
                  </div>
                </div>

                <!-- Favicon Upload -->
                <div class="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
                  <div class="flex items-center justify-between">
                    <h5 class="text-xs font-bold text-white uppercase tracking-wider">২. ব্রাউজার ফ্যাভিকন (Favicon)</h5>
                    <span class="text-[10px] text-slate-400">SVG / ICO / 32x32</span>
                  </div>

                  <div class="flex items-center gap-4">
                    <div class="w-16 h-16 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center p-2 shrink-0 overflow-hidden">
                      {#if settingsFaviconUrl}
                        <img src={settingsFaviconUrl} alt="Favicon" class="w-8 h-8 object-contain" />
                      {:else}
                        <Globe class="w-6 h-6 text-slate-600" />
                      {/if}
                    </div>
                    <div class="flex-1 space-y-2">
                      <label class="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md">
                        <UploadCloud class="w-4 h-4" />
                        <span>{isUploadingCloudinary && cloudinaryTarget === 'favicon' ? 'আপলোড হচ্ছে...' : 'ফ্যাভিকন আপলোড করুন'}</span>
                        <input
                          type="file"
                          accept="image/*,.ico"
                          class="hidden"
                          on:change={(e) => handleCloudinaryUpload(e, 'favicon')}
                          disabled={isUploadingCloudinary}
                        />
                      </label>
                      <input
                        type="text"
                        placeholder="অথবা ফ্যাভিকন URL দিন"
                        bind:value={settingsFaviconUrl}
                        class="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-white focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

          <!-- SUB-TAB 3: SEO & SOCIAL META -->
          {:else if settingsSubTab === 'seo'}
            <div class="space-y-4">
              <div class="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <Globe class="w-5 h-5 text-indigo-400" />
                    <h4 class="text-xs font-bold text-indigo-400 uppercase tracking-wider">সার্চ ইঞ্জিন অপটিমাইজেশন (SEO Meta)</h4>
                  </div>
                  <span class="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">Google Indexed</span>
                </div>

                <div class="space-y-3 text-xs">
                  <div>
                    <div class="flex justify-between mb-1">
                      <label for="seo-title" class="font-semibold text-slate-300">এসইও মেটা টাইটেল (Title Tag) *</label>
                      <span class="text-[10px] text-slate-500">{settingsMetaTitle.length}/60 অক্ষর</span>
                    </div>
                    <input
                      id="seo-title"
                      type="text"
                      bind:value={settingsMetaTitle}
                      class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <div class="flex justify-between mb-1">
                      <label for="seo-desc" class="font-semibold text-slate-300">মেটা ডেসক্রিপশন (Description) *</label>
                      <span class="text-[10px] text-slate-500">{settingsMetaDescription.length}/160 অক্ষর</span>
                    </div>
                    <textarea
                      id="seo-desc"
                      rows="3"
                      bind:value={settingsMetaDescription}
                      class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                    ></textarea>
                  </div>

                  <div>
                    <label for="seo-keywords" class="block font-semibold text-slate-300 mb-1">কীওয়ার্ডসমূহ (কমা দিয়ে আলাদা করুন)</label>
                    <input
                      id="seo-keywords"
                      type="text"
                      bind:value={settingsMetaKeywords}
                      class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label for="seo-canon" class="block font-semibold text-slate-300 mb-1">ক্যানোনিকাল URL (Canonical)</label>
                      <input
                        id="seo-canon"
                        type="url"
                        bind:value={settingsCanonicalUrl}
                        class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label for="seo-google-verify" class="block font-semibold text-slate-300 mb-1">Google Site Verification Code</label>
                      <input
                        id="seo-google-verify"
                        type="text"
                        bind:value={settingsGoogleVerification}
                        class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                <!-- Google Search Live Snippet Preview -->
                <div class="mt-4 p-4 rounded-2xl bg-white text-slate-900 border border-slate-200 space-y-1">
                  <div class="text-[11px] text-slate-500 uppercase font-bold tracking-wider">Google Search Result Preview</div>
                  <div class="text-xs text-slate-600 font-mono truncate">{settingsCanonicalUrl}</div>
                  <div class="text-base font-bold text-blue-800 hover:underline cursor-pointer line-clamp-1">{settingsMetaTitle}</div>
                  <div class="text-xs text-slate-700 line-clamp-2">{settingsMetaDescription}</div>
                </div>
              </div>

              <!-- OG Image Social Card -->
              <div class="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
                <div class="flex items-center justify-between">
                  <h4 class="text-xs font-bold text-indigo-400 uppercase tracking-wider">সোশ্যাল মিডিয়া প্রিভিউ ইমেজ (Open Graph 1200x630)</h4>
                  <label class="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all">
                    <UploadCloud class="w-3.5 h-3.5" />
                    <span>{isUploadingCloudinary && cloudinaryTarget === 'ogImage' ? 'আপলোড হচ্ছে...' : 'ছবি আপলোড করুন'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      class="hidden"
                      on:change={(e) => handleCloudinaryUpload(e, 'ogImage')}
                    />
                  </label>
                </div>
                <input
                  type="text"
                  placeholder="OG Image URL..."
                  bind:value={settingsOgImageUrl}
                  class="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                />

                <!-- Facebook Share Card Mockup -->
                <div class="max-w-md rounded-2xl overflow-hidden border border-slate-700 bg-slate-900 shadow-xl">
                  <div class="h-44 bg-slate-950 relative overflow-hidden flex items-center justify-center">
                    {#if settingsOgImageUrl}
                      <img src={settingsOgImageUrl} alt="OG Preview" class="w-full h-full object-cover" />
                    {:else}
                      <span class="text-xs text-slate-500">No Image Uploaded</span>
                    {/if}
                  </div>
                  <div class="p-3.5 bg-slate-800/90 text-xs space-y-1">
                    <div class="text-[10px] text-slate-400 uppercase font-mono">COACHFLOW.APP</div>
                    <div class="font-bold text-white truncate">{settingsMetaTitle}</div>
                    <div class="text-[11px] text-slate-300 line-clamp-1">{settingsMetaDescription}</div>
                  </div>
                </div>
              </div>
            </div>

          <!-- SUB-TAB 4: PIXEL & TRACKING -->
          {:else if settingsSubTab === 'pixel'}
            <div class="space-y-4">
              <!-- Meta / Facebook Pixel Setup -->
              <div class="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <Code2 class="w-5 h-5 text-blue-400" />
                    <h4 class="text-xs font-bold text-blue-400 uppercase tracking-wider">Meta (Facebook) Pixel & Conversions API</h4>
                  </div>
                  <span class="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 font-mono font-bold">
                    Events Active
                  </span>
                </div>
                <p class="text-xs text-slate-400">
                  Facebook Pixel ID ও Conversions API Token যুক্ত করলে ফেসবুক অ্যাডসের কনভার্সন এবং লিড নির্ভুলভাবে ট্র্যাক হবে।
                </p>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label for="fb-pixel-id" class="block font-semibold text-slate-300 mb-1">Facebook Pixel ID *</label>
                    <input
                      id="fb-pixel-id"
                      type="text"
                      bind:value={settingsFbPixelId}
                      placeholder="e.g. 109823471829381"
                      class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label for="ga-id" class="block font-semibold text-slate-300 mb-1">Google Analytics 4 (GA4) ID</label>
                    <input
                      id="ga-id"
                      type="text"
                      bind:value={settingsGA4Id}
                      placeholder="e.g. G-CF9823019"
                      class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div class="sm:col-span-2">
                    <label for="fb-token" class="block font-semibold text-slate-300 mb-1">Facebook Conversions API Access Token</label>
                    <input
                      id="fb-token"
                      type="password"
                      bind:value={settingsFbToken}
                      placeholder="EAAQ..."
                      class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <!-- Custom Scripts Injection -->
              <div class="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
                <h4 class="text-xs font-bold text-indigo-400 uppercase tracking-wider">কাস্টম স্ক্রিপ্ট ইনজেকশন (Custom Head & Body Scripts)</h4>
                <div class="space-y-3 text-xs">
                  <div>
                    <label for="head-scripts" class="block font-semibold text-slate-300 mb-1">Header Scripts (`&lt;head&gt;` ট্যাগের মধ্যে ইনজেক্ট হবে)</label>
                    <textarea
                      id="head-scripts"
                      rows="3"
                      bind:value={settingsHeadScripts}
                      placeholder="<!-- Google Tag Manager / Custom Tracking Code -->"
                      class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-[11px] focus:outline-none focus:border-indigo-500"
                    ></textarea>
                  </div>
                  <div>
                    <label for="body-scripts" class="block font-semibold text-slate-300 mb-1">Body Scripts (`&lt;body&gt;` ট্যাগের শেষে ইনজেক্ট হবে)</label>
                    <textarea
                      id="body-scripts"
                      rows="2"
                      bind:value={settingsBodyScripts}
                      placeholder="<!-- Live Chat Widget or NoScript pixel -->"
                      class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-[11px] focus:outline-none focus:border-indigo-500"
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>

          <!-- SUB-TAB 5: PAYMENT GATEWAYS -->
          {:else if settingsSubTab === 'gateways'}
            <div class="space-y-4">
              <!-- bKash Merchant -->
              <div class="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="px-2 py-0.5 rounded bg-pink-900 text-pink-300 font-bold text-xs">bKash</span>
                    <h4 class="text-xs font-bold text-white uppercase tracking-wider">বিকাশ পেমেন্ট গেটওয়ে API কনফিগারেশন</h4>
                  </div>
                  <div class="flex items-center gap-2 text-xs">
                    <label class="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" bind:checked={settingsBkashSandbox} class="rounded text-pink-600" />
                      <span class="text-slate-400">Sandbox Mode</span>
                    </label>
                    <label class="flex items-center gap-1.5 cursor-pointer ml-3">
                      <input type="checkbox" bind:checked={settingsBkashActive} class="rounded text-pink-600" />
                      <span class="text-emerald-400 font-bold">Active</span>
                    </label>
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label for="bkh-merchant-num" class="block font-semibold text-slate-300 mb-1">মার্চেন্ট ওয়ালেট নম্বর *</label>
                    <input
                      id="bkh-merchant-num"
                      type="text"
                      bind:value={settingsBkashNumber}
                      class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label for="bkh-app-key" class="block font-semibold text-slate-300 mb-1">App Key *</label>
                    <input
                      id="bkh-app-key"
                      type="password"
                      bind:value={settingsBkashAppKey}
                      class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label for="bkh-app-sec" class="block font-semibold text-slate-300 mb-1">App Secret *</label>
                    <input
                      id="bkh-app-sec"
                      type="password"
                      bind:value={settingsBkashSecret}
                      class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label for="bkh-user" class="block font-semibold text-slate-300 mb-1">API Username</label>
                    <input
                      id="bkh-user"
                      type="text"
                      bind:value={settingsBkashUser}
                      class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <!-- Nagad Merchant -->
              <div class="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="px-2 py-0.5 rounded bg-orange-900 text-orange-300 font-bold text-xs">Nagad</span>
                    <h4 class="text-xs font-bold text-white uppercase tracking-wider">নগদ মার্চেন্ট গেটওয়ে</h4>
                  </div>
                  <label class="flex items-center gap-1.5 cursor-pointer text-xs">
                    <input type="checkbox" bind:checked={settingsNagadActive} class="rounded text-orange-600" />
                    <span class="text-emerald-400 font-bold">Active</span>
                  </label>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label for="ngd-num" class="block font-semibold text-slate-300 mb-1">মার্চেন্ট মোবাইল নম্বর</label>
                    <input
                      id="ngd-num"
                      type="text"
                      bind:value={settingsNagadNumber}
                      class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label for="ngd-id" class="block font-semibold text-slate-300 mb-1">Merchant ID</label>
                    <input
                      id="ngd-id"
                      type="text"
                      bind:value={settingsNagadId}
                      class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <!-- Stripe Card Payments -->
              <div class="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="px-2 py-0.5 rounded bg-violet-900 text-violet-300 font-bold text-xs">Stripe</span>
                    <h4 class="text-xs font-bold text-white uppercase tracking-wider">আন্তর্জাতিক কার্ড পেমেন্ট (Stripe Credit/Debit)</h4>
                  </div>
                  <label class="flex items-center gap-1.5 cursor-pointer text-xs">
                    <input type="checkbox" bind:checked={settingsStripeActive} class="rounded text-violet-600" />
                    <span class="text-emerald-400 font-bold">Active</span>
                  </label>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label for="str-pub" class="block font-semibold text-slate-300 mb-1">Publishable Key</label>
                    <input
                      id="str-pub"
                      type="password"
                      bind:value={settingsStripePublishable}
                      class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label for="str-sec" class="block font-semibold text-slate-300 mb-1">Secret Key</label>
                    <input
                      id="str-sec"
                      type="password"
                      bind:value={settingsStripeSecret}
                      class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <!-- Bank Account Information -->
              <div class="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
                <h4 class="text-xs font-bold text-indigo-400 uppercase tracking-wider">ম্যানুয়াল ব্যাংক ট্রান্সফার অ্যাকাউন্ট</h4>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label for="bnk-name" class="block font-semibold text-slate-300 mb-1">ব্যাংকের নাম</label>
                    <input
                      id="bnk-name"
                      type="text"
                      bind:value={settingsBankName}
                      class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label for="bnk-acc-name" class="block font-semibold text-slate-300 mb-1">অ্যাকাউন্টের নাম</label>
                    <input
                      id="bnk-acc-name"
                      type="text"
                      bind:value={settingsBankAccountName}
                      class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label for="bnk-acc-num" class="block font-semibold text-slate-300 mb-1">অ্যাকাউন্ট নম্বর</label>
                    <input
                      id="bnk-acc-num"
                      type="text"
                      bind:value={settingsBankAccountNumber}
                      class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          {/if}

          <!-- Global Save Button -->
          <div class="flex justify-end pt-4">
            <button
              type="button"
              class="px-6 py-3 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-xl shadow-indigo-600/30 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
              on:click={handleSaveAllSettings}
            >
              <CheckCircle2 class="w-4 h-4" />
              <span>সমস্ত প্ল্যাটফর্ম সেটিংস সংরক্ষণ করুন</span>
            </button>
          </div>
        </div>
      {/if}
    </div>
  </main>
</div>

<!-- ========================================================================= -->
<!-- Modal 1: Add Coaching Modal                                              -->
<!-- ========================================================================= -->
<Modal
  open={isAddCoachingModalOpen}
  title="নতুন কোচিং সেন্টার নিবন্ধন করুন"
  subtitle="প্রতিষ্ঠানের নাম, মালিকের তথ্য ও প্যাকেজ প্ল্যান বরাদ্দ করুন"
  onClose={() => (isAddCoachingModalOpen = false)}
  maxWidth="max-w-xl"
>
  <form on:submit|preventDefault={handleCreateCoaching} class="space-y-4 text-xs">
    <div>
      <label for="add-coach-name" class="block font-semibold text-slate-300 mb-1">কোচিং প্রতিষ্ঠানের নাম *</label>
      <input
        id="add-coach-name"
        type="text"
        bind:value={newCoachName}
        placeholder="যেমন: টেকনো সায়েন্স একাডেমি"
        required
        class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
      />
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label for="add-coach-owner" class="block font-semibold text-slate-300 mb-1">মালিক / পরিচালকের নাম *</label>
        <input
          id="add-coach-owner"
          type="text"
          bind:value={newCoachOwner}
          placeholder="নাম লিখুন"
          required
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
        />
      </div>
      <div>
        <label for="add-coach-phone" class="block font-semibold text-slate-300 mb-1">মোবাইল নম্বর *</label>
        <input
          id="add-coach-phone"
          type="text"
          bind:value={newCoachPhone}
          placeholder="+880 17xx-xxxxxx"
          required
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
        />
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label for="add-coach-email" class="block font-semibold text-slate-300 mb-1">ইমেইল ঠিকানা</label>
        <input
          id="add-coach-email"
          type="email"
          bind:value={newCoachEmail}
          placeholder="admin@academy.edu.bd"
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
        />
      </div>
      <div>
        <label for="add-coach-city" class="block font-semibold text-slate-300 mb-1">শহর / জেলা</label>
        <input
          id="add-coach-city"
          type="text"
          bind:value={newCoachCity}
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
        />
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label for="add-coach-plan" class="block font-semibold text-slate-300 mb-1">সাবস্ক্রিপশন প্ল্যান</label>
        <select
          id="add-coach-plan"
          bind:value={newCoachPlanId}
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
        >
          {#each $subscriptionPlans as p}
            <option value={p.id}>{p.name} (৳{p.priceMonthly}/মাস)</option>
          {/each}
        </select>
      </div>

      <div>
        <label for="add-coach-cycle" class="block font-semibold text-slate-300 mb-1">বিলিং সাইকেল</label>
        <select
          id="add-coach-cycle"
          bind:value={newCoachCycle}
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="monthly">মাসিক বিলিং (Monthly)</option>
          <option value="yearly">বার্ষিক বিলিং (Yearly - 20% Off)</option>
        </select>
      </div>
    </div>

    <div class="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-800">
      <button
        type="button"
        class="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700"
        on:click={() => (isAddCoachingModalOpen = false)}
      >
        বাতিল
      </button>
      <button
        type="submit"
        class="px-5 py-2 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md"
      >
        নিবন্ধন সম্পন্ন করুন
      </button>
    </div>
  </form>
</Modal>

<!-- ========================================================================= -->
<!-- Modal 2: Edit Coaching Modal                                             -->
<!-- ========================================================================= -->
<Modal
  open={isEditCoachingModalOpen}
  title="কোচিং সেন্টারের প্রোফাইল সম্পাদনা"
  subtitle="প্রতিষ্ঠানের তথ্য, মালিকের যোগাযোগ ও প্ল্যান হালনাগাদ করুন"
  onClose={() => (isEditCoachingModalOpen = false)}
  maxWidth="max-w-xl"
>
  <form on:submit|preventDefault={handleUpdateCoaching} class="space-y-4 text-xs">
    <div>
      <label for="edit-coach-name" class="block font-semibold text-slate-300 mb-1">কোচিং প্রতিষ্ঠানের নাম</label>
      <input
        id="edit-coach-name"
        type="text"
        bind:value={editCoachName}
        required
        class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
      />
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label for="edit-coach-owner" class="block font-semibold text-slate-300 mb-1">পরিচালক</label>
        <input
          id="edit-coach-owner"
          type="text"
          bind:value={editCoachOwner}
          required
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
        />
      </div>
      <div>
        <label for="edit-coach-phone" class="block font-semibold text-slate-300 mb-1">ফোন</label>
        <input
          id="edit-coach-phone"
          type="text"
          bind:value={editCoachPhone}
          required
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
        />
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label for="edit-coach-plan" class="block font-semibold text-slate-300 mb-1">প্ল্যান প্যাকেজ</label>
        <select
          id="edit-coach-plan"
          bind:value={editCoachPlanId}
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
        >
          {#each $subscriptionPlans as p}
            <option value={p.id}>{p.name}</option>
          {/each}
        </select>
      </div>
      <div>
        <label for="edit-coach-status" class="block font-semibold text-slate-300 mb-1">স্ট্যাটাস</label>
        <select
          id="edit-coach-status"
          bind:value={editCoachStatus}
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="active">Active (সক্রিয়)</option>
          <option value="trial">Trial (ট্রায়াল)</option>
          <option value="past_due">Past Due (বকেয়া)</option>
          <option value="suspended">Suspended (স্থগিত)</option>
        </select>
      </div>
    </div>

    <div class="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-800">
      <button
        type="button"
        class="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700"
        on:click={() => (isEditCoachingModalOpen = false)}
      >
        বাতিল
      </button>
      <button
        type="submit"
        class="px-5 py-2 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md"
      >
        সংরক্ষণ করুন
      </button>
    </div>
  </form>
</Modal>

<!-- ========================================================================= -->
<!-- Modal 3: Add Plan Modal (with Status)                                     -->
<!-- ========================================================================= -->
<Modal
  open={isAddPlanModalOpen}
  title="নতুন সাবস্ক্রিপশন প্যাকেজ প্ল্যান তৈরি করুন"
  subtitle="মূল্য, শিক্ষার্থী কোটা, ব্রাঞ্চ লিমিট ও স্ট্যাটাস নির্ধারণ করুন"
  onClose={() => (isAddPlanModalOpen = false)}
  maxWidth="max-w-xl"
>
  <form on:submit|preventDefault={handleCreatePlan} class="space-y-4 text-xs">
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label for="add-plan-name" class="block font-semibold text-slate-300 mb-1">প্ল্যানের নাম *</label>
        <input
          id="add-plan-name"
          type="text"
          bind:value={newPlanName}
          placeholder="যেমন: গ্রোথ একাডেমি (Growth)"
          required
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
        />
      </div>
      <div>
        <label for="add-plan-tag" class="block font-semibold text-slate-300 mb-1">সাবটাইটেল / ট্যাগ</label>
        <input
          id="add-plan-tag"
          type="text"
          bind:value={newPlanTag}
          placeholder="ছোট ও মাঝারি কোচিং"
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
        />
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div>
        <label for="add-plan-monthly" class="block font-semibold text-slate-300 mb-1">মাসিক মূল্য (৳) *</label>
        <input
          id="add-plan-monthly"
          type="number"
          bind:value={newPlanMonthlyPrice}
          required
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
        />
      </div>
      <div>
        <label for="add-plan-yearly" class="block font-semibold text-slate-300 mb-1">বার্ষিক মূল্য (৳) *</label>
        <input
          id="add-plan-yearly"
          type="number"
          bind:value={newPlanYearlyPrice}
          required
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
        />
      </div>
      <div>
        <label for="add-plan-status" class="block font-semibold text-slate-300 mb-1">প্রাথমিক স্ট্যাটাস</label>
        <select
          id="add-plan-status"
          bind:value={newPlanStatus}
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="active">Active (সক্রিয়)</option>
          <option value="paused">Paused (সাময়িক স্থগিত)</option>
        </select>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div>
        <label for="add-plan-students" class="block font-semibold text-slate-300 mb-1">শিক্ষার্থী লিমিট</label>
        <input
          id="add-plan-students"
          type="number"
          bind:value={newPlanStudentLimit}
          required
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
        />
      </div>
      <div>
        <label for="add-plan-branches" class="block font-semibold text-slate-300 mb-1">শাখা লিমিট</label>
        <input
          id="add-plan-branches"
          type="number"
          bind:value={newPlanBranchLimit}
          required
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
        />
      </div>
      <div>
        <label for="add-plan-sms" class="block font-semibold text-slate-300 mb-1">ফ্রি SMS ক্রেডিট</label>
        <input
          id="add-plan-sms"
          type="number"
          bind:value={newPlanSmsCredits}
          required
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
        />
      </div>
    </div>

    <div>
      <label for="add-plan-features" class="block font-semibold text-slate-300 mb-1">ফিচারসমূহ (প্রতি লাইনে একটি করে লিখুন)</label>
      <textarea
        id="add-plan-features"
        rows="4"
        bind:value={newPlanFeaturesText}
        class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
      ></textarea>
    </div>

    <div class="flex items-center gap-2">
      <input
        type="checkbox"
        id="add-plan-popular"
        bind:checked={newPlanPopular}
        class="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
      />
      <label for="add-plan-popular" class="font-semibold text-slate-300 cursor-pointer">
        জনপ্রিয় ব্যাজ প্রদর্শন করুন (Show Popular Tag)
      </label>
    </div>

    <div class="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-800">
      <button
        type="button"
        class="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700"
        on:click={() => (isAddPlanModalOpen = false)}
      >
        বাতিল
      </button>
      <button
        type="submit"
        class="px-5 py-2 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md"
      >
        প্ল্যান সংরক্ষণ করুন
      </button>
    </div>
  </form>
</Modal>

<!-- ========================================================================= -->
<!-- Modal 4: Edit Plan Modal (with Pause/Active Status)                       -->
<!-- ========================================================================= -->
<Modal
  open={isEditPlanModalOpen}
  title="প্যাকেজ প্ল্যান সম্পাদনা করুন"
  subtitle="মূল্য, কোটা, ফিচার ও সক্রিয়/স্থগিত স্ট্যাটাস পরিবর্তন করুন"
  onClose={() => (isEditPlanModalOpen = false)}
  maxWidth="max-w-xl"
>
  <form on:submit|preventDefault={handleUpdatePlan} class="space-y-4 text-xs">
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label for="edit-plan-name" class="block font-semibold text-slate-300 mb-1">প্ল্যানের নাম *</label>
        <input
          id="edit-plan-name"
          type="text"
          bind:value={editPlanName}
          required
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
        />
      </div>
      <div>
        <label for="edit-plan-tag" class="block font-semibold text-slate-300 mb-1">সাবটাইটেল / ট্যাগ</label>
        <input
          id="edit-plan-tag"
          type="text"
          bind:value={editPlanTag}
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
        />
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div>
        <label for="edit-plan-monthly" class="block font-semibold text-slate-300 mb-1">মাসিক মূল্য (৳)</label>
        <input
          id="edit-plan-monthly"
          type="number"
          bind:value={editPlanMonthlyPrice}
          required
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
        />
      </div>
      <div>
        <label for="edit-plan-yearly" class="block font-semibold text-slate-300 mb-1">বার্ষিক মূল্য (৳)</label>
        <input
          id="edit-plan-yearly"
          type="number"
          bind:value={editPlanYearlyPrice}
          required
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
        />
      </div>
      <div>
        <label for="edit-plan-status" class="block font-semibold text-slate-300 mb-1">স্ট্যাটাস (Status)</label>
        <select
          id="edit-plan-status"
          bind:value={editPlanStatus}
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="active">Active (সক্রিয়)</option>
          <option value="paused">Paused (স্থগিত)</option>
        </select>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div>
        <label for="edit-plan-students" class="block font-semibold text-slate-300 mb-1">শিক্ষার্থী লিমিট</label>
        <input
          id="edit-plan-students"
          type="number"
          bind:value={editPlanStudentLimit}
          required
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
        />
      </div>
      <div>
        <label for="edit-plan-branches" class="block font-semibold text-slate-300 mb-1">শাখা লিমিট</label>
        <input
          id="edit-plan-branches"
          type="number"
          bind:value={editPlanBranchLimit}
          required
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
        />
      </div>
      <div>
        <label for="edit-plan-sms" class="block font-semibold text-slate-300 mb-1">ফ্রি SMS ক্রেডিট</label>
        <input
          id="edit-plan-sms"
          type="number"
          bind:value={editPlanSmsCredits}
          required
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
        />
      </div>
    </div>

    <div>
      <label for="edit-plan-features" class="block font-semibold text-slate-300 mb-1">ফিচারসমূহ</label>
      <textarea
        id="edit-plan-features"
        rows="4"
        bind:value={editPlanFeaturesText}
        class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
      ></textarea>
    </div>

    <div class="flex items-center gap-2">
      <input
        type="checkbox"
        id="edit-plan-popular"
        bind:checked={editPlanPopular}
        class="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
      />
      <label for="edit-plan-popular" class="font-semibold text-slate-300 cursor-pointer">
        জনপ্রিয় ব্যাজ প্রদর্শন করুন (Popular)
      </label>
    </div>

    <div class="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-800">
      <button
        type="button"
        class="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700"
        on:click={() => (isEditPlanModalOpen = false)}
      >
        বাতিল
      </button>
      <button
        type="submit"
        class="px-5 py-2 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md"
      >
        হালনাগাদ সংরক্ষণ করুন
      </button>
    </div>
  </form>
</Modal>

<!-- ========================================================================= -->
<!-- Modal 5: Delete Plan Confirmation Modal                                  -->
<!-- ========================================================================= -->
<Modal
  open={isDeletePlanModalOpen}
  title="প্যাকেজ প্ল্যান মুছে ফেলবেন?"
  subtitle="এই সিদ্ধান্তটি অপরিবর্তনীয়। প্ল্যানটি সমস্ত তালিকা থেকে ডিলিট হয়ে যাবে।"
  onClose={() => (isDeletePlanModalOpen = false)}
  maxWidth="max-w-md"
>
  {#if planToDelete}
    <div class="space-y-4 text-xs">
      <div class="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 space-y-1">
        <div class="font-bold">সতর্কতা:</div>
        <div>আপনি <span class="font-bold underline text-white">"{planToDelete.name}"</span> প্যাকেজটি সিস্টেম থেকে চিরতরে মুছে ফেলতে চলেছেন।</div>
      </div>

      <div class="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
        <button
          type="button"
          class="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 font-semibold"
          on:click={() => (isDeletePlanModalOpen = false)}
        >
          বাতিল
        </button>
        <button
          type="button"
          class="px-5 py-2 rounded-xl font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-md"
          on:click={confirmDeletePlan}
        >
          হ্যাঁ, মুছে ফেলুন
        </button>
      </div>
    </div>
  {/if}
</Modal>

<!-- ========================================================================= -->
<!-- Modal 6: Reject Subscription Modal                                       -->
<!-- ========================================================================= -->
<Modal
  open={isRejectSubModalOpen}
  title="সাবস্ক্রিপশন অনুরোধ বাতিল (Reject)"
  subtitle="বাতিলের কারণ লিখুন যা সংশ্লিষ্ট কোচিং অ্যাডমিনের নোটিশে প্রদর্শিত হবে"
  onClose={() => (isRejectSubModalOpen = false)}
  maxWidth="max-w-md"
>
  {#if rejectingSub}
    <div class="space-y-4 text-xs">
      <div class="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
        <div class="font-bold text-white">{rejectingSub.coachingName}</div>
        <div class="text-slate-400">প্যাকেজ: {rejectingSub.planName} (৳{rejectingSub.amount.toLocaleString()})</div>
        <div class="text-indigo-400 font-mono">TrxID: {rejectingSub.trxId || 'N/A'}</div>
      </div>

      <div>
        <label for="rej-reason" class="block font-semibold text-slate-300 mb-1">প্রত্যাখ্যানের কারণ লিখুন *</label>
        <textarea
          id="rej-reason"
          rows="3"
          bind:value={rejectionReasonInput}
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-rose-500"
        ></textarea>
      </div>

      <div class="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
        <button
          type="button"
          class="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 font-semibold"
          on:click={() => (isRejectSubModalOpen = false)}
        >
          ফিরে যান
        </button>
        <button
          type="button"
          class="px-5 py-2 rounded-xl font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-md"
          on:click={handleConfirmReject}
        >
          প্রত্যাখ্যান নিশ্চিত করুন
        </button>
      </div>
    </div>
  {/if}
</Modal>

<!-- ========================================================================= -->
<!-- Modal 7: Edit Platform User Modal                                        -->
<!-- ========================================================================= -->
<Modal
  open={isEditUserModalOpen}
  title="ব্যবহারকারীর তথ্য সম্পাদনা"
  subtitle="নাম, ইমেইল, ফোন, ভূমিকা (Role) ও সক্রিয়তা পরিবর্তন করুন"
  onClose={() => (isEditUserModalOpen = false)}
  maxWidth="max-w-md"
>
  {#if editingUser}
    <form on:submit|preventDefault={handleUpdateUser} class="space-y-4 text-xs">
      <div>
        <label for="edit-usr-name" class="block font-semibold text-slate-300 mb-1">পূর্ণ নাম *</label>
        <input
          id="edit-usr-name"
          type="text"
          bind:value={editUserName}
          required
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
        />
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label for="edit-usr-email" class="block font-semibold text-slate-300 mb-1">ইমেইল *</label>
          <input
            id="edit-usr-email"
            type="email"
            bind:value={editUserEmail}
            required
            class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div>
          <label for="edit-usr-phone" class="block font-semibold text-slate-300 mb-1">মোবাইল</label>
          <input
            id="edit-usr-phone"
            type="text"
            bind:value={editUserPhone}
            class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label for="edit-usr-role" class="block font-semibold text-slate-300 mb-1">অ্যাক্সেস রোল *</label>
          <select
            id="edit-usr-role"
            bind:value={editUserRole}
            class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="super_admin">Super Admin</option>
            <option value="platform_support">Platform Support</option>
            <option value="institute_admin">Institute Director / Admin</option>
          </select>
        </div>
        <div>
          <label for="edit-usr-status" class="block font-semibold text-slate-300 mb-1">স্ট্যাটাস</label>
          <select
            id="edit-usr-status"
            bind:value={editUserStatus}
            class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="active">Active (সক্রিয়)</option>
            <option value="suspended">Suspended (স্থগিত)</option>
          </select>
        </div>
      </div>

      <div>
        <label for="edit-usr-inst" class="block font-semibold text-slate-300 mb-1">সংযুক্ত কোচিং প্রতিষ্ঠান</label>
        <select
          id="edit-usr-inst"
          bind:value={editUserInstituteId}
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="">— কোনো প্রতিষ্ঠান নেই (HQ Staff) —</option>
          {#each $coachingInstitutes as c}
            <option value={c.id}>{c.name}</option>
          {/each}
        </select>
      </div>

      <div class="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
        <button
          type="button"
          class="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700"
          on:click={() => (isEditUserModalOpen = false)}
        >
          বাতিল
        </button>
        <button
          type="submit"
          class="px-5 py-2 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md"
        >
          তথ্য সংরক্ষণ করুন
        </button>
      </div>
    </form>
  {/if}
</Modal>

<!-- ========================================================================= -->
<!-- Modal 8: Add User Modal                                                  -->
<!-- ========================================================================= -->
<Modal
  open={isAddUserModalOpen}
  title="নতুন প্ল্যাটফর্ম ব্যবহারকারী তৈরি"
  subtitle="সুপার অ্যাডমিন, টেকনিক্যাল সাপোর্ট বা কোচিং ডিরেক্টর রোল দিন"
  onClose={() => (isAddUserModalOpen = false)}
  maxWidth="max-w-md"
>
  <form on:submit|preventDefault={handleCreateUser} class="space-y-4 text-xs">
    <div>
      <label for="add-usr-name" class="block font-semibold text-slate-300 mb-1">পূর্ণ নাম *</label>
      <input
        id="add-usr-name"
        type="text"
        bind:value={newUserName}
        placeholder="নাম লিখুন"
        required
        class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
      />
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div>
        <label for="add-usr-email" class="block font-semibold text-slate-300 mb-1">ইমেইল *</label>
        <input
          id="add-usr-email"
          type="email"
          bind:value={newUserEmail}
          placeholder="user@example.com"
          required
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
        />
      </div>
      <div>
        <label for="add-usr-phone" class="block font-semibold text-slate-300 mb-1">মোবাইল</label>
        <input
          id="add-usr-phone"
          type="text"
          bind:value={newUserPhone}
          placeholder="+880 17xx..."
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
        />
      </div>
    </div>

    <div>
      <label for="add-usr-role" class="block font-semibold text-slate-300 mb-1">অ্যাক্সেস রোল *</label>
      <select
        id="add-usr-role"
        bind:value={newUserRole}
        class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
      >
        <option value="super_admin">Super Admin (সর্বোচ্চ নিয়ন্ত্রণ)</option>
        <option value="platform_support">Platform Support (কাস্টমার সাপোর্ট)</option>
        <option value="institute_admin">Institute Director / Admin</option>
      </select>
    </div>

    <div>
      <label for="add-usr-inst" class="block font-semibold text-slate-300 mb-1">সংযুক্ত কোচিং প্রতিষ্ঠান</label>
      <select
        id="add-usr-inst"
        bind:value={newUserInstituteId}
        class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
      >
        <option value="">— কোনো প্রতিষ্ঠান নেই (HQ Staff) —</option>
        {#each $coachingInstitutes as c}
          <option value={c.id}>{c.name}</option>
        {/each}
      </select>
    </div>

    <div class="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
      <button
        type="button"
        class="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700"
        on:click={() => (isAddUserModalOpen = false)}
      >
        বাতিল
      </button>
      <button
        type="submit"
        class="px-5 py-2 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md"
      >
        ইউজার তৈরি করুন
      </button>
    </div>
  </form>
</Modal>

<!-- ========================================================================= -->
<!-- Modal 9: Grant Subscription Modal                                        -->
<!-- ========================================================================= -->
<Modal
  open={isAddSubModalOpen}
  title="ম্যানুয়াল সাবস্ক্রিপশন বরাদ্দ করুন"
  subtitle="নির্দিষ্ট কোচিং সেন্টারের জন্য প্ল্যান ও বিলিং সাইকেল নির্ধারণ করুন"
  onClose={() => (isAddSubModalOpen = false)}
  maxWidth="max-w-md"
>
  <form on:submit|preventDefault={handleGrantSubscription} class="space-y-4 text-xs">
    <div>
      <label for="man-sub-coach" class="block font-semibold text-slate-300 mb-1">কোচিং প্রতিষ্ঠান নির্বাচন করুন *</label>
      <select
        id="man-sub-coach"
        bind:value={newSubCoachingId}
        required
        class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
      >
        <option value="">— প্রতিষ্ঠান নির্বাচন করুন —</option>
        {#each $coachingInstitutes as c}
          <option value={c.id}>{c.name} ({c.city})</option>
        {/each}
      </select>
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div>
        <label for="man-sub-plan" class="block font-semibold text-slate-300 mb-1">প্ল্যান প্যাকেজ *</label>
        <select
          id="man-sub-plan"
          bind:value={newSubPlanId}
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
        >
          {#each $subscriptionPlans as p}
            <option value={p.id}>{p.name}</option>
          {/each}
        </select>
      </div>
      <div>
        <label for="man-sub-cycle" class="block font-semibold text-slate-300 mb-1">সাইকেল</label>
        <select
          id="man-sub-cycle"
          bind:value={newSubCycle}
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="monthly">মাসিক (Monthly)</option>
          <option value="yearly">বার্ষিক (Yearly)</option>
        </select>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div>
        <label for="man-sub-pay" class="block font-semibold text-slate-300 mb-1">পেমেন্ট মেথড</label>
        <select
          id="man-sub-pay"
          bind:value={newSubPayment}
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="bKash">bKash</option>
          <option value="Nagad">Nagad</option>
          <option value="Bank Transfer">Bank Transfer</option>
          <option value="Cash">Cash / Offline</option>
        </select>
      </div>
      <div>
        <label for="man-sub-phone" class="block font-semibold text-slate-300 mb-1">প্রেরকের নম্বর (ঐচ্ছিক)</label>
        <input
          id="man-sub-phone"
          type="text"
          bind:value={newSubSenderPhone}
          placeholder="017xxxxxxxx"
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
        />
      </div>
    </div>

    <div>
      <label for="man-sub-trx" class="block font-semibold text-slate-300 mb-1">ট্রানজেকশন ID (ঐচ্ছিক)</label>
      <input
        id="man-sub-trx"
        type="text"
        bind:value={newSubTrxId}
        placeholder="e.g. BKH9A82J912"
        class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-indigo-500"
      />
    </div>

    <div class="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
      <button
        type="button"
        class="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700"
        on:click={() => (isAddSubModalOpen = false)}
      >
        বাতিল
      </button>
      <button
        type="submit"
        class="px-5 py-2 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md"
      >
        সাবস্ক্রিপশন বরাদ্দ করুন
      </button>
    </div>
  </form>
</Modal>

<!-- ========================================================================= -->
<!-- Modal 10: Rich Payment Details & Receipt Modal                            -->
<!-- ========================================================================= -->
<Modal
  open={isPaymentDetailsModalOpen}
  title="পেমেন্ট ট্রানজেকশন ও ভাউচার বিবরণ"
  subtitle="গেটওয়ে রেফারেন্স ও অফিশিয়াল ভ্যাট পেমেন্ট রসিদ"
  onClose={() => (isPaymentDetailsModalOpen = false)}
  maxWidth="max-w-lg"
>
  {#if selectedPayment}
    <div class="space-y-4 text-xs">
      <!-- Printable Voucher Box -->
      <div class="p-6 rounded-2xl bg-white text-slate-900 border border-slate-300 shadow-xl space-y-4" id="printable-payment-voucher">
        <div class="text-center border-b-2 border-slate-900 pb-3">
          <h3 class="text-xl font-black text-slate-900 font-['Outfit']">{$platformSettings.platformName}</h3>
          <p class="text-[11px] text-slate-600">{$platformSettings.tagline}</p>
          <div class="mt-2 inline-block px-3 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider">
            OFFICIAL PAYMENT INVOICE RECEIPT
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2 text-xs border-b border-slate-200 pb-3">
          <div>
            <span class="text-slate-500 uppercase text-[10px] block font-semibold">গ্রাহক প্রতিষ্ঠান:</span>
            <strong class="text-slate-900 text-sm">{selectedPayment.coachingName}</strong>
            {#if selectedPayment.senderPhone}
              <div class="text-[11px] text-slate-600 font-mono">মোবাইল: {selectedPayment.senderPhone}</div>
            {/if}
          </div>
          <div class="text-right">
            <span class="text-slate-500 uppercase text-[10px] block font-semibold">রসিদ নম্বর:</span>
            <strong class="text-indigo-900 font-mono">{selectedPayment.receiptNumber || selectedPayment.id}</strong>
            <div class="text-[10px] text-slate-600">{selectedPayment.date}</div>
          </div>
        </div>

        <div class="p-3.5 bg-slate-100 rounded-xl space-y-2 text-xs">
          <div class="flex justify-between">
            <span class="text-slate-600">আইটেম / সাবস্ক্রিপশন:</span>
            <strong class="text-slate-900">{selectedPayment.itemTitle}</strong>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-600">পেমেন্ট মেথড:</span>
            <span class="font-bold text-slate-900">{selectedPayment.paymentMethod}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-600">ট্রানজেকশন ID:</span>
            <strong class="text-indigo-900 font-mono font-bold">{selectedPayment.trxId}</strong>
          </div>
          {#if selectedPayment.notes}
            <div class="text-[11px] text-slate-600 pt-1 border-t border-slate-200">
              নোট: {selectedPayment.notes}
            </div>
          {/if}
          <div class="flex justify-between pt-2 border-t-2 border-slate-300 text-sm">
            <span class="font-bold text-slate-900">মোট পরিশোধিত:</span>
            <strong class="text-emerald-700 font-black text-base">৳{selectedPayment.amount.toLocaleString()}</strong>
          </div>
        </div>

        <div class="flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-200 pt-2">
          <span>ভ্যাট চালান (০% সার্ভিস চার্জ)</span>
          <span class="font-mono text-emerald-700 font-bold uppercase">Status: {selectedPayment.status}</span>
        </div>
      </div>

      <!-- Modal Bottom Actions -->
      <div class="flex items-center justify-between pt-3 border-t border-slate-800">
        <div>
          {#if selectedPayment.status === 'pending'}
            <button
              type="button"
              class="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 shadow-md"
              on:click={() => handleVerifyPayment(selectedPayment)}
            >
              <CheckCircle class="w-4 h-4" />
              <span>পেমেন্ট ভেরিফাই করুন (Approve)</span>
            </button>
          {/if}
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            class="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700"
            on:click={() => (isPaymentDetailsModalOpen = false)}
          >
            বন্ধ করুন
          </button>
          <button
            type="button"
            class="px-4 py-2 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 flex items-center gap-1.5 shadow-md"
            on:click={() => window.print()}
          >
            <Printer class="w-3.5 h-3.5" />
            <span>রসিদ প্রিন্ট করুন</span>
          </button>
        </div>
      </div>
    </div>
  {/if}
</Modal>
