<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import {
    smsAccount,
    smsTemplates,
    smsLogs,
    batches,
    students,
    feeInvoices,
    sendSms,
    buySmsPack,
    toggleAndroidGateway,
    showToast,
    addSmsTemplate,
    smsQueue,
    instituteSettings,
    cancelSms,
    cancelAllPendingSms,
    refreshSmsQueue,
  } from '../store';
  import {
    enqueueSmsToQueue,
    normalizePhoneNumber,
    isValidPhoneNumber,
    getBdCarrierName,
    formatPhoneNumberDisplay,
  } from '../smsQueueApi';
  import Badge from '../components/Badge.svelte';
  import Modal from '../components/Modal.svelte';
  import {
    Smartphone,
    Radio,
    Battery,
    Wifi,
    QrCode,
    Coins,
    Send,
    FileText,
    Copy,
    Check,
    Plus,
    AlertCircle,
    CheckCircle2,
    Clock,
    RefreshCw,
    XCircle,
    Trash2,
    Ban,
  } from 'lucide-svelte';

  let pollIntervalTimer: any;
  onMount(() => {
    refreshSmsQueue();
    pollIntervalTimer = setInterval(() => {
      refreshSmsQueue();
    }, 6000);
  });

  onDestroy(() => {
    if (pollIntervalTimer) clearInterval(pollIntervalTimer);
  });

  import SmsTemplateManagerView from './SmsTemplateManagerView.svelte';

  let activeSmsTab: 'gateway' | 'packs' | 'compose' | 'templates' | 'logs' = 'gateway';

  // Compose SMS State
  let recipientTarget: 'batch' | 'overdue' | 'custom' = 'batch';
  let selectedBatchId = 'b-1';
  let customPhone = '+880 1711-';
  let customRecipientName = 'অভিভাবক';
  let messageContent = 'সম্মানিত অভিভাবক, {student_name}-এর বিষয়ে এপেক্স অ্যাকাডেমিক কেয়ার (ফার্মগেট) থেকে বিশেষ নোটিশ।';
  let selectedGateway: 'android_sim1' | 'cloud' = 'android_sim1';

  // Buy Pack modal
  let isBuyModalOpen = false;

  $: gateway = $smsAccount.androidGateway;
  $: cloudBalance = $smsAccount.cloudBalance;

  // Character & SMS Part calculation
  $: charCount = messageContent.length;
  $: isBanglaMsg = /[\u0980-\u09FF]/.test(messageContent);
  $: partLimit = isBanglaMsg ? 70 : 160;
  $: smsParts = Math.ceil(charCount / partLimit) || 1;

  // 10-Second Polling Queue State
  let testQueuePhone = '+8801701034883';
  let testQueueMsg = 'সম্মানিত অভিভাবক, ১০-সেকেন্ড আউটবক্স টেস্ট সফল! আপনার ফোন থেকে SIM 1 দিয়ে পাঠানো হচ্ছে।';
  let isQueueing = false;

  $: coachingCenterId = $instituteSettings.coachingCenterId || 'aac-dhaka-01';
  $: pendingQueueItems = $smsQueue.filter((q) => q.coachingCenterId === coachingCenterId && q.status === 'pending');
  $: completedQueueItems = $smsQueue.filter((q) => q.coachingCenterId === coachingCenterId && q.status === 'sent');

  // Live reactive phone validation & normalization
  $: normTestPhone = normalizePhoneNumber(testQueuePhone);
  $: isValidTestPhone = isValidPhoneNumber(testQueuePhone);
  $: testCarrier = getBdCarrierName(testQueuePhone);

  $: normCustomPhone = normalizePhoneNumber(customPhone);
  $: isValidCustomPhone = isValidPhoneNumber(customPhone);
  $: customCarrier = getBdCarrierName(customPhone);

  async function handleEnqueueTest() {
    const cleanPhone = normalizePhoneNumber(testQueuePhone);
    if (!cleanPhone) {
      showToast('error', 'সঠিক নম্বর দিন', 'সঠিক মোবাইল নম্বর (যেমন: 01701034883 বা +8801701034883) দিন।');
      return;
    }
    if (!testQueueMsg.trim()) {
      showToast('error', 'মেসেজ দিন', 'SMS বার্তা লিখুন।');
      return;
    }
    testQueuePhone = cleanPhone;
    isQueueing = true;
    try {
      const res = await enqueueSmsToQueue(coachingCenterId, cleanPhone, 'টেস্ট অভিভাবক', testQueueMsg);
      if (res && res.item) {
        smsQueue.update((q) => [res.item, ...q.filter((x) => x.id !== res.item.id)]);
        showToast('success', 'SMS কিউতে যুক্ত হয়েছে', `নম্বর: ${cleanPhone}। ফোন ১০ সেকেন্ডে পেয়ে SIM 1 দিয়ে পাঠাবে।`);
      }
    } catch (e: any) {
      showToast('error', 'ব্যর্থ', e.message || 'Error enqueueing SMS');
    } finally {
      isQueueing = false;
    }
  }

  function insertVariable(varName: string) {
    messageContent += ` ${varName}`;
  }

  function handleSendBroadcast() {
    if (!messageContent.trim()) {
      showToast('error', 'Empty Message', 'Please enter your SMS notification content.');
      return;
    }

    if (recipientTarget === 'batch') {
      const batchStudents = $students.filter((s) => s.batchIds.includes(selectedBatchId));
      batchStudents.forEach((s) => {
        const compiled = messageContent
          .replace(/{guardian_name}/g, s.guardianName)
          .replace(/{student_name}/g, s.name);
        const phone = normalizePhoneNumber(s.guardianPhone) || s.guardianPhone;
        sendSms(s.guardianName, phone, compiled, selectedGateway);
      });
      showToast('success', 'Batch Campaign Dispatched', `Queued SMS to ${batchStudents.length} guardians via ${selectedGateway.toUpperCase()}.`);
    } else if (recipientTarget === 'overdue') {
      const dueStudents = $students.filter((s) => s.feesDue > 0);
      dueStudents.forEach((s) => {
        const compiled = messageContent
          .replace(/{guardian_name}/g, s.guardianName)
          .replace(/{student_name}/g, s.name)
          .replace(/{due_amount}/g, String(s.feesDue));
        const phone = normalizePhoneNumber(s.guardianPhone) || s.guardianPhone;
        sendSms(s.guardianName, phone, compiled, selectedGateway);
      });
      showToast('success', 'Due Reminders Sent', `Dispatched alerts to ${dueStudents.length} due student guardian(s).`);
    } else {
      const cleanPhone = normalizePhoneNumber(customPhone);
      if (!cleanPhone) {
        showToast('error', 'সঠিক নম্বর দিন', 'সঠিক মোবাইল নম্বর দিন (যেমন: 01701034883 বা +8801701034883)।');
        return;
      }
      customPhone = cleanPhone;
      sendSms(customRecipientName, cleanPhone, messageContent, selectedGateway);
      showToast('success', 'SMS পাঠানো হয়েছে', `${cleanPhone} নম্বরে SMS কিউতে যুক্ত হয়েছে।`);
    }
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    showToast('info', 'Copied to Clipboard', `${label} is now in your clipboard.`);
  }

  function saveCurrentAsTemplate() {
    if (!messageContent.trim()) {
      showToast('error', 'মেসেজ খালি', 'টেমপ্লেট হিসেবে সংরক্ষণ করতে মেসেজ লিখুন।');
      return;
    }
    const title = prompt('নতুন SMS টেমপ্লেটের নাম / শিরোনাম দিন:', 'কাস্টম ক্যাম্পেইন টেমপ্লেট');
    if (!title || !title.trim()) return;

    addSmsTemplate({
      title: title.trim(),
      category: 'general',
      eventType: `custom_${Date.now().toString(36)}`,
      contentBangla: messageContent.trim(),
      contentEnglish: messageContent.trim(),
      variables: ['{student_name}', '{guardian_name}', '{due_amount}', '{batch_name}'],
      activeLanguage: /[\u0980-\u09FF]/.test(messageContent) ? 'bangla' : 'english',
    });
  }
</script>

<div class="space-y-6">
  <!-- Top Banner -->
  <div class="rounded-3xl p-6 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
    <div>
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 text-xs font-semibold mb-2 border border-emerald-500/20">
        <Smartphone class="w-3.5 h-3.5" />
        <span>Dual-Engine SMS Architecture (Cloud Packs + Android Own-SIM)</span>
      </div>
      <h2 class="text-2xl font-bold text-white font-['Outfit']">SMS Management & Android Gateway Hub</h2>
      <p class="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
        Send batch updates, attendance absent alerts, and fee reminders with ৳0.00 carrier markup through your own Android phone (GP/Banglalink/Robi), or fallback to BTRC-approved Cloud packs.
      </p>
    </div>

    <!-- Quick Stats Box -->
    <div class="flex items-center gap-3">
      <div class="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 text-center min-w-[110px]">
        <span class="text-[10px] text-slate-400 uppercase font-semibold">Cloud SMS</span>
        <div class="text-xl font-bold text-indigo-400 font-['Outfit']">{cloudBalance.toLocaleString()}</div>
        <button
          type="button"
          class="text-[10px] font-semibold text-emerald-400 hover:text-emerald-300 mt-0.5 block mx-auto"
          on:click={() => (activeSmsTab = 'packs')}
        >
          + Buy Packs
        </button>
      </div>

      <div class="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 text-center min-w-[130px]">
        <span class="text-[10px] text-slate-400 uppercase font-semibold">Android Node</span>
        <div class="text-sm font-bold {gateway.connected ? 'text-emerald-400' : 'text-rose-400'} flex items-center justify-center gap-1.5 mt-0.5">
          <span class="w-2 h-2 rounded-full {gateway.connected ? 'bg-emerald-400 animate-ping' : 'bg-rose-400'}"></span>
          <span>{gateway.connected ? 'Online' : 'Disconnected'}</span>
        </div>
        <span class="text-[10px] text-slate-400 mt-0.5 block">{gateway.batteryLevel}% Battery</span>
      </div>
    </div>
  </div>

  <!-- Sub Navigation -->
  <div class="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
    <button
      type="button"
      class="px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2
      {activeSmsTab === 'gateway' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-900'}"
      on:click={() => (activeSmsTab = 'gateway')}
    >
      <Smartphone class="w-4 h-4" />
      <span>Android Gateway Node</span>
    </button>

    <button
      type="button"
      class="px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2
      {activeSmsTab === 'packs' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-900'}"
      on:click={() => (activeSmsTab = 'packs')}
    >
      <Coins class="w-4 h-4 text-amber-400" />
      <span>Buy Cloud SMS Packs</span>
    </button>

    <button
      type="button"
      class="px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2
      {activeSmsTab === 'compose' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-900'}"
      on:click={() => (activeSmsTab = 'compose')}
    >
      <Send class="w-4 h-4" />
      <span>Send Broadcast Campaign</span>
    </button>

    <button
      type="button"
      class="px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2
      {activeSmsTab === 'templates' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-900'}"
      on:click={() => (activeSmsTab = 'templates')}
    >
      <FileText class="w-4 h-4 text-emerald-400" />
      <span>SMS Templates ({$smsTemplates.length})</span>
    </button>

    <button
      type="button"
      class="px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2
      {activeSmsTab === 'logs' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-900'}"
      on:click={() => (activeSmsTab = 'logs')}
    >
      <Clock class="w-4 h-4" />
      <span>Outbox Logs ({$smsLogs.length})</span>
    </button>
  </div>

  <!-- TAB 1: ANDROID GATEWAY CONFIG -->
  {#if activeSmsTab === 'gateway'}
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- Device Telemetry Card -->
      <div class="lg:col-span-7 rounded-3xl bg-slate-900/80 border border-slate-800 p-6 flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 class="text-base font-bold text-white font-['Outfit']">{gateway.deviceName}</h3>
              <p class="text-xs text-slate-400 mt-0.5">Last Sync: {gateway.lastSyncTime}</p>
            </div>

            <button
              type="button"
              class="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5
              {gateway.connected ? 'bg-rose-950/40 text-rose-300 border border-rose-500/30 hover:bg-rose-900/40' : 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-900/40'}"
              on:click={toggleAndroidGateway}
            >
              <RefreshCw class="w-3.5 h-3.5" />
              <span>{gateway.connected ? 'Disconnect Device' : 'Connect Device'}</span>
            </button>
          </div>

          <!-- Live Metrics Grid -->
          <div class="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div class="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
              <span class="text-slate-400 block text-[10px] uppercase font-semibold">Battery:</span>
              <div class="text-lg font-bold text-white mt-1 flex items-center gap-1.5">
                <Battery class="w-4 h-4 text-emerald-400" />
                <span>{gateway.batteryLevel}%</span>
              </div>
            </div>

            <div class="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
              <span class="text-slate-400 block text-[10px] uppercase font-semibold">Network Signal:</span>
              <div class="text-lg font-bold text-white mt-1 flex items-center gap-1.5">
                <Wifi class="w-4 h-4 text-indigo-400" />
                <span>{gateway.signalStrength}% (5G)</span>
              </div>
            </div>

            <div class="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
              <span class="text-slate-400 block text-[10px] uppercase font-semibold">SIM 1 Carrier:</span>
              <div class="text-xs font-bold text-slate-200 mt-1 truncate">
                {gateway.sim1Carrier}
              </div>
            </div>

            <div class="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
              <span class="text-slate-400 block text-[10px] uppercase font-semibold">Today's Sent:</span>
              <div class="text-lg font-bold text-emerald-400 mt-1">
                {gateway.sim1DailySent} / {gateway.sim1DailyLimit}
              </div>
            </div>
          </div>

          <!-- Daily Safety Quota Slider -->
          <div class="mt-6 p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <div class="flex items-center justify-between text-xs mb-2">
              <span class="font-semibold text-slate-300">Carrier Anti-Spam Safety Limit:</span>
              <span class="font-bold text-indigo-300">{gateway.sim1DailyLimit} SMS / Day</span>
            </div>
            <div class="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800">
              <div
                class="bg-gradient-to-r from-indigo-500 to-emerald-500 h-2.5 rounded-full"
                style="width: {(gateway.sim1DailySent / gateway.sim1DailyLimit) * 100}%"
              ></div>
            </div>
            <p class="text-[11px] text-slate-400 mt-2">
              Automatically pauses sending and queues remaining messages if local SIM reaches this safe threshold.
            </p>
          </div>
        </div>

        <!-- API & Webhook Creds -->
        <div class="mt-6 pt-4 border-t border-slate-800 space-y-3 text-xs">
          <div>
            <label for="gw-api-key" class="block text-slate-400 font-semibold mb-1">Android Gateway API Key</label>
            <div class="flex rounded-xl bg-slate-950 border border-slate-800 overflow-hidden">
              <input
                id="gw-api-key"
                type="text"
                readonly
                value={gateway.apiKey}
                class="w-full px-3 py-2 bg-transparent text-slate-300 font-mono text-xs focus:outline-none"
              />
              <button
                type="button"
                class="px-3 py-2 bg-slate-800/80 text-slate-300 hover:text-white flex items-center gap-1"
                on:click={() => copyToClipboard(gateway.apiKey, 'API Key')}
              >
                <Copy class="w-3.5 h-3.5" />
                <span>Copy</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Pairing QR Code & Mobile Instructions -->
      <div class="lg:col-span-5 rounded-3xl bg-slate-900/80 border border-slate-800 p-6 flex flex-col justify-between">
        <div>
          <div class="flex items-center gap-2 mb-3">
            <QrCode class="w-5 h-5 text-indigo-400" />
            <h3 class="text-base font-bold text-white font-['Outfit']">Pair New Android Phone</h3>
          </div>
          <p class="text-xs text-slate-400 leading-relaxed">
            Install the <strong>CoachFlow Gateway APK</strong> from your dashboard and scan this pairing QR code to begin routing SMS at zero gateway cost.
          </p>

          <!-- QR Container -->
          <div class="my-6 p-4 rounded-2xl bg-white w-48 h-48 mx-auto flex items-center justify-center shadow-2xl">
            <QrCode class="w-40 h-40 text-slate-900" />
          </div>

          <!-- Step by Step -->
          <div class="space-y-2 text-xs text-slate-300 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
            <div class="flex items-center gap-2">
              <span class="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">1</span>
              <span>Insert any local SIM card with an SMS bundle.</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">2</span>
              <span>Open the CoachFlow Android App and scan QR.</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">3</span>
              <span>All parent alerts will transmit through your SIM!</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          class="w-full mt-6 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors flex items-center justify-center gap-2"
          on:click={() => showToast('info', 'Download Started', 'Downloading CoachFlow Android SMS Gateway v3.4.1 APK...')}
        >
          <span>Download Android Gateway APK (v3.4.1)</span>
        </button>
      </div>
    </div>

    <!-- 10-SECOND POLLING OUTBOX QUEUE MONITOR -->
    <div class="mt-6 rounded-3xl bg-slate-900/80 border border-slate-800 p-6 space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <h3 class="text-base font-bold text-white font-['Outfit']">
              ১০-সেকেন্ড আউটবক্স পোলিং কিউ (Android SIM 1 Auto-Sender)
            </h3>
          </div>
          <p class="text-xs text-slate-400 mt-0.5">
            ওয়েব বা যেকোনো API থেকে SMS রিকোয়েস্ট আসলে কিউতে জমা হয়। লগইন থাকা অ্যান্ড্রয়েড ফোন প্রতি ১০ সেকেন্ডে এই API কল করে SIM 1 দিয়ে মেসেজ সেন্ড করে।
          </p>
        </div>

        <div class="flex items-center gap-2">
          <span class="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
            ১০ সেকেন্ড পোলিং সক্রিয়
          </span>
        </div>
      </div>

      <!-- Credentials & Endpoints Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <!-- 1. Coaching Center ID -->
        <div class="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
          <span class="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
            Coaching Center ID (লগইন আইডি)
          </span>
          <div class="flex items-center justify-between bg-slate-900 px-3 py-2 rounded-xl border border-slate-800">
            <span class="font-mono font-bold text-indigo-400 text-sm">{coachingCenterId}</span>
            <button
              type="button"
              class="text-slate-400 hover:text-white p-1 rounded transition-colors"
              title="Copy Coaching ID"
              on:click={() => copyToClipboard(coachingCenterId, 'Coaching Center ID')}
            >
              <Copy class="w-3.5 h-3.5" />
            </button>
          </div>
          <p class="text-[11px] text-slate-500">
            অ্যান্ড্রয়েড অ্যাপে এই আইডি সেট থাকলে ফোন প্রতি ১০ সেকেন্ডে এই কোচিং সেন্টারের SMS তুলবে।
          </p>
        </div>

        <!-- 2. Phone Polling GET Endpoint -->
        <div class="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
          <span class="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
            ফোন পোলিং API (GET)
          </span>
          <div class="flex items-center justify-between bg-slate-900 px-3 py-2 rounded-xl border border-slate-800">
            <span class="font-mono text-emerald-400 truncate text-[11px]">/api/sms/{coachingCenterId}</span>
            <button
              type="button"
              class="text-slate-400 hover:text-white p-1 rounded transition-colors shrink-0"
              title="Copy URL"
              on:click={() => copyToClipboard(`/api/sms/${coachingCenterId}`, 'Polling API URL')}
            >
              <Copy class="w-3.5 h-3.5" />
            </button>
          </div>
          <p class="text-[11px] text-slate-500">
            ফোন প্রতি ১০ সেকেন্ডে এই API কল করে। মেসেজ পেলে SIM 1 দিয়ে সেন্ড করে, না পেলে কিছু করে না।
          </p>
        </div>

        <!-- 3. External Trigger POST Endpoint -->
        <div class="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
          <span class="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
            যেকোনো জায়গা থেকে SMS ট্রিগার (POST)
          </span>
          <div class="flex items-center justify-between bg-slate-900 px-3 py-2 rounded-xl border border-slate-800">
            <span class="font-mono text-amber-400 truncate text-[11px]">POST /api/sms/{coachingCenterId}</span>
            <button
              type="button"
              class="text-slate-400 hover:text-white p-1 rounded transition-colors shrink-0"
              title="Copy Endpoint"
              on:click={() => copyToClipboard(`POST /api/sms/${coachingCenterId}`, 'POST Trigger Endpoint')}
            >
              <Copy class="w-3.5 h-3.5" />
            </button>
          </div>
          <p class="text-[11px] text-slate-500">
            বডি: <code class="text-slate-400">&#123; "to": "017...", "message": "..." &#125;</code> (যেকোনো সাইট থেকে কল করা যাবে)।
          </p>
        </div>
      </div>

      <!-- Quick Test Enqueue Form -->
      <div class="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
        <h4 class="text-xs font-bold text-slate-200 mb-3 flex items-center gap-1.5">
          <Send class="w-3.5 h-3.5 text-indigo-400" />
          <span>১০-সেকেন্ড পোলিং টেস্ট SMS কিউ করুন</span>
        </h4>
        <div class="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
          <div class="sm:col-span-5">
            <input
              type="text"
              bind:value={testQueuePhone}
              placeholder="মোবাইল নম্বর (+88017..., 017..., ইত্যাদি)"
              class="w-full px-3 py-2 rounded-xl bg-slate-900 border text-xs text-white placeholder-slate-500 focus:outline-none transition-colors {isValidTestPhone ? 'border-emerald-500/50 focus:border-emerald-400' : 'border-slate-800 focus:border-indigo-500'}"
            />
            {#if testQueuePhone.trim()}
              <div class="flex items-center gap-1.5 mt-1.5 text-[10px] flex-wrap">
                {#if isValidTestPhone}
                  <span class="text-emerald-400 flex items-center gap-1 font-semibold">
                    <CheckCircle2 class="w-3 h-3 text-emerald-400" />
                    <span>সঠিক নম্বর: {normTestPhone}</span>
                  </span>
                  {#if testCarrier}
                    <span class="px-1.5 py-0.2 rounded bg-indigo-950/60 text-indigo-300 font-semibold border border-indigo-800/40">
                      {testCarrier}
                    </span>
                  {/if}
                {:else}
                  <span class="text-amber-400 flex items-center gap-1">
                    <AlertCircle class="w-3 h-3 text-amber-400" />
                    <span>সঠিক ১১-ডিজিটের নম্বর দিন (যেমন: 01701034883 বা +8801701034883)</span>
                  </span>
                {/if}
              </div>
            {/if}
          </div>
          <div class="sm:col-span-5">
            <input
              type="text"
              bind:value={testQueueMsg}
              placeholder="মেসেজ লিখুন..."
              class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div class="sm:col-span-2">
            <button
              type="button"
              class="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
              disabled={isQueueing}
              on:click={handleEnqueueTest}
            >
              <Plus class="w-3.5 h-3.5" />
              <span>{isQueueing ? 'যোগ হচ্ছে...' : 'কিউ করুন'}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Modern Bordered List View: Active Outbox Queue Items -->
      <div class="space-y-3">
        <div class="flex items-center justify-between text-xs text-slate-400 flex-wrap gap-2">
          <div class="flex items-center gap-2">
            <span class="font-bold text-slate-300">
              রিয়েল-টাইম আউটবক্স কিউ ({$smsQueue.length} টি রেকর্ড)
            </span>
            <button
              type="button"
              class="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="কিউ রিফ্রেশ করুন"
              on:click={() => refreshSmsQueue()}
            >
              <RefreshCw class="w-3.5 h-3.5" />
            </button>
          </div>

          <div class="flex items-center gap-2">
            <span class="text-[11px] text-emerald-400">
              {pendingQueueItems.length} টি অপেক্ষমাণ (১০ সেকেন্ডের মধ্যে SIM 1 পাঠাবে)
            </span>
            {#if pendingQueueItems.length > 0}
              <button
                type="button"
                class="px-2 py-1 rounded-lg text-[11px] font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500/20 transition-all flex items-center gap-1 shadow-sm"
                on:click={cancelAllPendingSms}
              >
                <Trash2 class="w-3 h-3 text-rose-400" />
                <span>সব পেন্ডিং বাতিল</span>
              </button>
            {/if}
          </div>
        </div>

        {#if $smsQueue.length === 0}
          <div class="p-6 text-center text-xs text-slate-500 border border-slate-800 rounded-2xl bg-slate-950">
            আউটবক্স কিউ বর্তমানে খালি। কোনো নতুন SMS পাঠানো হলে এখানে প্রদর্শিত হবে।
          </div>
        {:else}
          <div class="border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800 bg-slate-950/60">
            {#each $smsQueue as item}
              <div class="p-3.5 hover:bg-slate-900/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div class="flex items-start gap-3">
                  <div class="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center font-bold text-xs
                    {item.status === 'pending' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                     item.status === 'sent' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                     item.status === 'cancelled' ? 'bg-slate-800 text-slate-400 border border-slate-700' :
                     'bg-rose-500/20 text-rose-300 border border-rose-500/30'}">
                    {#if item.status === 'pending'}
                      ⏳
                    {:else if item.status === 'sent'}
                      ✓
                    {:else if item.status === 'cancelled'}
                      ✕
                    {:else}
                      !
                    {/if}
                  </div>

                  <div>
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="font-bold text-white font-mono">{normalizePhoneNumber(item.recipientPhone)}</span>
                      {#if getBdCarrierName(item.recipientPhone)}
                        <span class="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                          {getBdCarrierName(item.recipientPhone)}
                        </span>
                      {/if}
                      {#if item.recipientName}
                        <span class="text-slate-400">({item.recipientName})</span>
                      {/if}
                      <span class="text-[10px] text-indigo-400 font-mono bg-indigo-950/50 px-2 py-0.5 rounded border border-indigo-800/40">
                        {item.coachingCenterId}
                      </span>
                    </div>
                    <p class="text-slate-300 mt-1 line-clamp-1">{item.message}</p>
                    <span class="text-[10px] text-slate-500 mt-0.5 block">
                      তৈরি: {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      {#if item.sentAt}
                        • SIM 1 ডেলিভারি: {new Date(item.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      {/if}
                      {#if item.errorMessage}
                        • নোট: {item.errorMessage}
                      {/if}
                    </span>
                  </div>
                </div>

                <div class="shrink-0 flex items-center gap-2 self-end sm:self-center">
                  {#if item.status === 'pending'}
                    <span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                      <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                      অপেক্ষমাণ
                    </span>
                    <button
                      type="button"
                      class="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 transition-all flex items-center gap-1.5 shadow-sm"
                      title="এই SMS বাতিল করুন"
                      on:click={() => cancelSms(item.id)}
                    >
                      <XCircle class="w-3.5 h-3.5 text-rose-400" />
                      <span>বাতিল করুন</span>
                    </button>
                  {:else if item.status === 'sent'}
                    <span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      SIM 1 দিয়ে প্রেরিত (৳0.00)
                    </span>
                  {:else if item.status === 'cancelled'}
                    <span class="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1">
                      <Ban class="w-3 h-3 text-slate-400" />
                      বাতিলকৃত
                    </span>
                  {:else}
                    <span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                      ব্যর্থ
                    </span>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>

  <!-- TAB 2: BUY CLOUD SMS PACKS -->
  {:else if activeSmsTab === 'packs'}
    <div class="space-y-6">
      <div class="max-w-2xl">
        <h3 class="text-lg font-bold text-white font-['Outfit']">Purchase Cloud SMS Packs</h3>
        <p class="text-xs text-slate-400 mt-1">
          High-throughput multi-carrier cloud fallback packs. Credits never expire and activate immediately.
        </p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <!-- Pack 1 -->
        <div class="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-colors">
          <div>
            <span class="text-xs font-semibold text-indigo-400 uppercase">Mini Pack</span>
            <div class="text-3xl font-extrabold text-white mt-2 font-['Outfit']">1,000 SMS</div>
            <p class="text-xs text-slate-400 mt-1">Best for small batch exam results & urgent notices.</p>
            <div class="text-2xl font-bold text-indigo-300 mt-4">৳৩৫০ <span class="text-xs text-slate-400 font-normal">one-time (৳০.৩৫/SMS)</span></div>
          </div>
          <button
            type="button"
            class="w-full mt-6 py-2.5 rounded-xl font-semibold text-xs text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all"
            on:click={() => buySmsPack(1000, 350)}
          >
            Buy 1,000 Credits
          </button>
        </div>

        <!-- Pack 2 (Popular) -->
        <div class="p-6 rounded-3xl bg-gradient-to-b from-indigo-950/60 to-slate-900 border-2 border-indigo-500 flex flex-col justify-between shadow-xl shadow-indigo-500/10">
          <div>
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-indigo-400 uppercase">Academy Pack</span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 uppercase">Popular</span>
            </div>
            <div class="text-3xl font-extrabold text-white mt-2 font-['Outfit']">5,000 SMS</div>
            <p class="text-xs text-slate-400 mt-1">Recommended for daily absent alerts & monthly reminders.</p>
            <div class="text-2xl font-bold text-indigo-300 mt-4">৳১,৫০০ <span class="text-xs text-slate-400 font-normal">one-time (৳০.৩০/SMS)</span></div>
          </div>
          <button
            type="button"
            class="w-full mt-6 py-2.5 rounded-xl font-semibold text-xs text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all"
            on:click={() => buySmsPack(5000, 1500)}
          >
            Buy 5,000 Credits
          </button>
        </div>

        <!-- Pack 3 -->
        <div class="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-colors">
          <div>
            <span class="text-xs font-semibold text-indigo-400 uppercase">Enterprise Pack</span>
            <div class="text-3xl font-extrabold text-white mt-2 font-['Outfit']">20,000 SMS</div>
            <p class="text-xs text-slate-400 mt-1">For multi-branch institutions broadcasting bulk campaigns.</p>
            <div class="text-2xl font-bold text-indigo-300 mt-4">৳৫,৫০০ <span class="text-xs text-slate-400 font-normal">one-time (৳০.২৭/SMS)</span></div>
          </div>
          <button
            type="button"
            class="w-full mt-6 py-2.5 rounded-xl font-semibold text-xs text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all"
            on:click={() => buySmsPack(20000, 5500)}
          >
            Buy 20,000 Credits
          </button>
        </div>
      </div>
    </div>

  <!-- TAB 3: COMPOSE & BROADCAST -->
  {:else if activeSmsTab === 'compose'}
    <div class="max-w-3xl mx-auto rounded-3xl bg-slate-900/80 border border-slate-800 p-6 shadow-xl space-y-5 text-xs">
      <div>
        <h3 class="text-lg font-bold text-white font-['Outfit']">Compose SMS Notification</h3>
        <p class="text-xs text-slate-400 mt-0.5">Send targeted batch messages with automated placeholder tags.</p>
      </div>

      <!-- Recipient Filter Selection -->
      <div>
        <span class="block text-slate-300 font-semibold mb-1.5">Target Audience</span>
        <div class="grid grid-cols-3 gap-2">
          <button
            type="button"
            class="p-2.5 rounded-xl border text-center font-medium transition-all
            {recipientTarget === 'batch' ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'}"
            on:click={() => (recipientTarget = 'batch')}
          >
            By Academic Batch
          </button>
          <button
            type="button"
            class="p-2.5 rounded-xl border text-center font-medium transition-all
            {recipientTarget === 'overdue' ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'}"
            on:click={() => (recipientTarget = 'overdue')}
          >
            Fee Overdue Students
          </button>
          <button
            type="button"
            class="p-2.5 rounded-xl border text-center font-medium transition-all
            {recipientTarget === 'custom' ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'}"
            on:click={() => (recipientTarget = 'custom')}
          >
            Custom Single Phone
          </button>
        </div>
      </div>

      {#if recipientTarget === 'batch'}
        <div>
          <label for="compose-batch-select" class="block text-slate-300 font-semibold mb-1">Select Batch:</label>
          <select
            id="compose-batch-select"
            bind:value={selectedBatchId}
            class="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
          >
            {#each $batches as b}
              <option value={b.id}>{b.name} ({b.enrolledCount} enrolled)</option>
            {/each}
          </select>
        </div>
      {:else if recipientTarget === 'custom'}
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label for="compose-custom-name" class="block text-slate-300 font-semibold mb-1">Recipient Name</label>
            <input
              id="compose-custom-name"
              type="text"
              bind:value={customRecipientName}
              class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <div class="flex items-center justify-between mb-1">
              <label for="compose-custom-phone" class="block text-slate-300 font-semibold">মোবাইল নম্বর (+8801..., 01..., ইত্যাদি)</label>
              {#if customCarrier}
                <span class="text-[10px] text-emerald-400 font-semibold">অপারেটর: {customCarrier}</span>
              {/if}
            </div>
            <input
              id="compose-custom-phone"
              type="text"
              bind:value={customPhone}
              placeholder="+8801701034883 বা 01701034883"
              class="w-full px-3 py-2 rounded-xl bg-slate-950 border text-white focus:outline-none transition-colors {isValidCustomPhone ? 'border-emerald-500/50 focus:border-emerald-400' : 'border-slate-800 focus:border-indigo-500'}"
            />
            {#if customPhone.trim()}
              <div class="flex items-center gap-1.5 mt-1.5 text-[10px] flex-wrap">
                {#if isValidCustomPhone}
                  <span class="text-emerald-400 flex items-center gap-1 font-semibold">
                    <CheckCircle2 class="w-3 h-3 text-emerald-400" />
                    <span>সঠিক নম্বর: {normCustomPhone}</span>
                  </span>
                {:else}
                  <span class="text-amber-400 flex items-center gap-1">
                    <AlertCircle class="w-3 h-3 text-amber-400" />
                    <span>১১ ডিজিটের সঠিক নম্বর দিন (যেমন: 01701034883 বা +8801701034883)</span>
                  </span>
                {/if}
              </div>
            {/if}
          </div>
        </div>
      {/if}

      <!-- Message Content & Template Shortcuts -->
      <div>
        <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
          <label for="compose-textarea" class="font-semibold text-slate-300">Message Text Body</label>

          <div class="flex items-center gap-2">
            <!-- Select Template Dropdown -->
            <select
              aria-label="Load from Template"
              class="px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-indigo-300 hover:border-indigo-500/50 text-[11px] focus:outline-none"
              on:change={(e) => {
                const id = e.currentTarget.value;
                if (!id) return;
                const found = $smsTemplates.find((t) => t.id === id);
                if (found) {
                  messageContent = found.activeLanguage === 'english' ? found.contentEnglish : found.contentBangla;
                  showToast('info', 'টেমপ্লেট লোড হয়েছে', `'${found.title}' মেসেজ বক্সে যুক্ত হয়েছে।`);
                }
              }}
            >
              <option value="">📂 Load Saved Template ({$smsTemplates.length})</option>
              {#each $smsTemplates as tpl}
                <option value={tpl.id}>{tpl.title}</option>
              {/each}
            </select>

            <!-- Save as Template Button -->
            <button
              type="button"
              class="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 hover:border-emerald-500/40 text-[11px] font-semibold transition-all flex items-center gap-1"
              on:click={saveCurrentAsTemplate}
              title="বর্তমান টেক্সটকে একটি নতুন SMS টেমপ্লেট হিসেবে সংরক্ষণ করুন"
            >
              <span>+ Save as Template</span>
            </button>
          </div>
        </div>

        <div class="relative">
          <textarea
            id="compose-textarea"
            rows="4"
            bind:value={messageContent}
            class="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs leading-relaxed"
          ></textarea>
          <div class="flex items-center justify-between text-[11px] text-slate-400 font-mono mt-1 px-1">
            <span>{charCount} chars • {smsParts} SMS Part ({isBanglaMsg ? 'Unicode/Bangla 70 chars' : 'ASCII 160 chars'})</span>
          </div>
        </div>
      </div>

      <!-- Placeholder Helper Tags -->
      <div>
        <span class="block text-[11px] text-slate-400 uppercase font-semibold mb-1.5">Click to insert dynamic variable:</span>
        <div class="flex flex-wrap gap-1.5">
          <button
            type="button"
            class="px-2 py-1 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-indigo-300 font-mono text-[10px]"
            on:click={() => insertVariable('{guardian_name}')}
          >
            + {"{guardian_name}"}
          </button>
          <button
            type="button"
            class="px-2 py-1 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-indigo-300 font-mono text-[10px]"
            on:click={() => insertVariable('{student_name}')}
          >
            + {"{student_name}"}
          </button>
          <button
            type="button"
            class="px-2 py-1 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-indigo-300 font-mono text-[10px]"
            on:click={() => insertVariable('{due_amount}')}
          >
            + {"{due_amount}"}
          </button>
          <button
            type="button"
            class="px-2 py-1 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-indigo-300 font-mono text-[10px]"
            on:click={() => insertVariable('{batch_name}')}
          >
            + {"{batch_name}"}
          </button>
        </div>
      </div>

      <!-- Gateway Routing Choice -->
      <div class="pt-2 border-t border-slate-800">
        <span class="block text-slate-300 font-semibold mb-1.5">Delivery Route</span>
        <div class="grid grid-cols-2 gap-3">
          <label class="p-3 rounded-xl border flex items-center justify-between cursor-pointer {selectedGateway === 'android_sim1' ? 'bg-emerald-950/30 border-emerald-500 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-400'}">
            <div class="flex items-center gap-2">
              <input type="radio" name="gw_choice" value="android_sim1" bind:group={selectedGateway} />
              <span>Android Gateway (SIM 1)</span>
            </div>
            <span class="font-bold text-emerald-400">৳0.00</span>
          </label>

          <label class="p-3 rounded-xl border flex items-center justify-between cursor-pointer {selectedGateway === 'cloud' ? 'bg-indigo-950/30 border-indigo-500 text-indigo-300' : 'bg-slate-950 border-slate-800 text-slate-400'}">
            <div class="flex items-center gap-2">
              <input type="radio" name="gw_choice" value="cloud" bind:group={selectedGateway} />
              <span>Cloud SMS Wallet</span>
            </div>
            <span class="font-bold text-indigo-400">1 credit</span>
          </label>
        </div>
      </div>

      <!-- Dispatch Button -->
      <div class="pt-4 flex justify-end">
        <button
          type="button"
          class="px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
          on:click={handleSendBroadcast}
        >
          <Send class="w-4 h-4" />
          <span>Dispatch Notification Campaign</span>
        </button>
      </div>
    </div>

  <!-- TAB: SMS TEMPLATE MANAGER -->
  {:else if activeSmsTab === 'templates'}
    <SmsTemplateManagerView />

  <!-- TAB 4: OUTBOX LOGS -->
  {:else if activeSmsTab === 'logs'}
    <!-- TAB 4: OUTBOX LOGS (Bordered List View) -->
    <div class="space-y-3">
      {#if $smsLogs.length === 0}
        <div class="p-12 text-center text-slate-500 rounded-2xl bg-slate-900/60 border border-slate-800">
          কোনো প্রেরিত এসএমএস হিস্ট্রি নেই।
        </div>
      {:else}
        {#each $smsLogs as log}
          <div class="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 transition-all shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <!-- Left: Recipient & Message bubble -->
            <div class="flex items-start gap-3.5 flex-1 min-w-0">
              <div class="w-11 h-11 rounded-2xl {log.gateway === 'cloud' ? 'bg-indigo-950/60 border-indigo-500/30 text-indigo-400' : 'bg-emerald-950/60 border-emerald-500/30 text-emerald-400'} border flex items-center justify-center font-bold shrink-0 mt-0.5">
                <MessageSquare class="w-5 h-5" />
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="font-bold text-white text-sm sm:text-base">{log.recipientName}</span>
                  <a href="tel:{log.recipientPhone}" class="font-mono text-xs font-semibold text-emerald-400 hover:underline">
                    {log.recipientPhone}
                  </a>
                  {#if log.gateway === 'cloud'}
                    <Badge variant="primary" size="sm">Cloud SMS</Badge>
                  {:else}
                    <Badge variant="success" size="sm">Android SIM 1</Badge>
                  {/if}
                </div>

                <!-- Message bubble -->
                <div class="mt-2 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-200 leading-relaxed font-sans select-text">
                  {log.message}
                </div>
              </div>
            </div>

            <!-- Right: Cost, Time & Delivery Status -->
            <div class="flex items-center justify-between lg:justify-end gap-4 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-800/80 shrink-0">
              <div class="text-left lg:text-right">
                <div class="font-mono font-bold {log.cost === 0 ? 'text-emerald-400' : 'text-white'} text-sm">
                  ৳{log.cost.toFixed(2)}
                </div>
                <div class="text-[10px] text-slate-500">খরচ</div>
              </div>

              <div class="text-left lg:text-right">
                <div class="text-xs text-slate-400 font-mono">{log.timestamp}</div>
                <div class="text-[10px] text-slate-500">প্রেরণের সময়</div>
              </div>

              <div>
                <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/50 border border-emerald-500/30 text-emerald-400 font-semibold text-xs shadow-sm">
                  <CheckCircle2 class="w-3.5 h-3.5" />
                  <span>Delivered</span>
                </span>
              </div>
            </div>
          </div>
        {/each}
      {/if}
    </div>
  {/if}
</div>
