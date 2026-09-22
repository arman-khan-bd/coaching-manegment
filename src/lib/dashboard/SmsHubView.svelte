<script lang="ts">
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
  } from '../store';
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
  } from 'lucide-svelte';

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
        sendSms(s.guardianName, s.guardianPhone, compiled, selectedGateway);
      });
      showToast('success', 'Batch Campaign Dispatched', `Queued SMS to ${batchStudents.length} guardians via ${selectedGateway.toUpperCase()}.`);
    } else if (recipientTarget === 'overdue') {
      const dueStudents = $students.filter((s) => s.feesDue > 0);
      dueStudents.forEach((s) => {
        const compiled = messageContent
          .replace(/{guardian_name}/g, s.guardianName)
          .replace(/{student_name}/g, s.name)
          .replace(/{due_amount}/g, String(s.feesDue));
        sendSms(s.guardianName, s.guardianPhone, compiled, selectedGateway);
      });
      showToast('success', 'Due Reminders Sent', `Dispatched alerts to ${dueStudents.length} due student guardian(s).`);
    } else {
      sendSms(customRecipientName, customPhone, messageContent, selectedGateway);
      showToast('success', 'SMS Sent', `Notification delivered to ${customPhone}.`);
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
            <label for="compose-custom-phone" class="block text-slate-300 font-semibold mb-1">Mobile Phone (with country code)</label>
            <input
              id="compose-custom-phone"
              type="text"
              bind:value={customPhone}
              class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
            />
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
