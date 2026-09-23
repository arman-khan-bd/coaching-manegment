<script lang="ts">
  import { sendSms, smsAccount, smsTemplates, students, showToast } from '../store';
  import {
    normalizePhoneNumber,
    isValidPhoneNumber,
    getBdCarrierName,
    parseMultiplePhoneNumbers,
  } from '../smsQueueApi';
  import type { SmsTemplate } from '../types';
  import Modal from './Modal.svelte';
  import {
    Send,
    Smartphone,
    Cloud,
    MessageSquare,
    CheckCircle2,
    Sparkles,
    Phone,
    Languages,
    Layers,
    Users,
    AlertCircle,
    Trash2,
  } from 'lucide-svelte';

  export let open: boolean = false;
  export let recipientName: string = '';
  export let recipientPhone: string = '';
  export let recipientRole: 'guardian' | 'student' | 'teacher' | 'general' = 'guardian';
  export let defaultMessage: string = '';
  export let templates: { label: string; text: string; textEnglish?: string }[] = [];
  export let allowMultiple: boolean = true;
  export let onClose: () => void = () => {};

  let messageText = '';
  let selectedGateway: 'android_sim1' | 'cloud' = 'android_sim1';
  let isSending = false;
  let activeLangMode: 'bangla' | 'english' = 'bangla';
  let selectedTemplateObj: SmsTemplate | null = null;
  let showAllLibraryTemplates = false;
  let isMultipleMode = false;
  let multiplePhonesText = '';

  $: if (open && defaultMessage && (!messageText || messageText === defaultMessage)) {
    messageText = defaultMessage;
  }

  $: charCount = messageText.length;
  $: isBangla = /[\u0980-\u09FF]/.test(messageText);
  $: partLimit = isBangla ? 70 : 160;
  $: actualParts = Math.ceil(charCount / partLimit) || 1;

  $: parsedMultiplePhones = parseMultiplePhoneNumbers(multiplePhonesText);

  function loadAllParentsToModal() {
    const parentPhones = $students
      .map((s) => s.guardianPhone)
      .filter((p) => p && isValidPhoneNumber(p));
    const unique = Array.from(new Set(parentPhones.map((p) => normalizePhoneNumber(p))));
    if (unique.length === 0) {
      showToast('info', 'অভিভাবকের নম্বর নেই', 'শিক্ষার্থীদের তালিকায় কোনো অভিভাবকের নম্বর পাওয়া যায়নি।');
      return;
    }
    multiplePhonesText = unique.join('\n');
    showToast('success', 'সকল অভিভাবক যুক্ত হয়েছে', `${unique.length} জন অভিভাবকের নম্বর যুক্ত হয়েছে।`);
  }

  function formatAndDedupeModalPhones() {
    if (parsedMultiplePhones.valid.length === 0) {
      showToast('info', 'কোনো নম্বর নেই', 'ফরম্যাট করার মতো কোনো বৈধ নম্বর পাওয়া যায়নি।');
      return;
    }
    multiplePhonesText = parsedMultiplePhones.valid.join('\n');
    showToast('info', 'ফরম্যাট সম্পন্ন', 'নম্বরসমূহ সুবিন্যস্ত করা হয়েছে এবং ডুপ্লিকেট বাদ দেওয়া হয়েছে।');
  }

  function clearModalPhones() {
    multiplePhonesText = '';
  }

  function applySimpleTemplate(tpl: { label: string; text: string; textEnglish?: string }) {
    if (activeLangMode === 'english' && tpl.textEnglish) {
      messageText = tpl.textEnglish;
    } else {
      messageText = tpl.text;
    }
  }

  function applySystemTemplate(tpl: SmsTemplate) {
    selectedTemplateObj = tpl;
    const raw = activeLangMode === 'english' ? tpl.contentEnglish : tpl.contentBangla;
    // Replace with recipient context
    messageText = raw
      .replace(/{student_name}/g, recipientName || 'শিক্ষার্থী')
      .replace(/{guardian_name}/g, recipientName || 'অভিভাবক')
      .replace(/{institute_name}/g, 'এপেক্স অ্যাকাডেমিক কেয়ার');
  }

  function switchLanguage(targetLang: 'bangla' | 'english') {
    activeLangMode = targetLang;
    if (selectedTemplateObj) {
      const raw = targetLang === 'english' ? selectedTemplateObj.contentEnglish : selectedTemplateObj.contentBangla;
      messageText = raw
        .replace(/{student_name}/g, recipientName || 'শিক্ষার্থী')
        .replace(/{guardian_name}/g, recipientName || 'অভিভাবক')
        .replace(/{institute_name}/g, 'এপেক্স অ্যাকাডেমিক কেয়ার');
    }
  }

  $: normPhone = normalizePhoneNumber(recipientPhone);
  $: isValidPhone = isValidPhoneNumber(recipientPhone);
  $: carrierName = getBdCarrierName(recipientPhone);

  function handleSend() {
    if (isSending) return;
    if (!messageText.trim()) {
      showToast('error', 'মেসেজ খালি', 'অনুগ্রহ করে SMS-এর বিবরণ লিখুন।');
      return;
    }

    if (isMultipleMode) {
      if (parsedMultiplePhones.valid.length === 0) {
        showToast('error', 'কোনো বৈধ নম্বর নেই', 'অনুগ্রহ করে টেক্সট এরিয়ায় কমপক্ষে একটি বৈধ মোবাইল নম্বর লিখুন বা পেস্ট করুন।');
        return;
      }
      isSending = true;
      try {
        const validList = parsedMultiplePhones.valid;
        validList.forEach((phone) => {
          sendSms('অভিভাবক', phone, messageText, selectedGateway);
        });
        const gwLabel = selectedGateway === 'android_sim1' ? 'Android SIM (৳০.০০)' : 'Cloud SMS (৳০.৩৫)';
        showToast(
          'success',
          'একাধিক অভিভাবককে SMS পাঠানো হয়েছে',
          `${validList.length} জন অভিভাবককে ${gwLabel}-এর মাধ্যমে সফলভাবে কিউতে যুক্ত করা হয়েছে।`
        );
        messageText = '';
        multiplePhonesText = '';
        selectedTemplateObj = null;
        onClose();
      } catch (err: any) {
        showToast('error', 'ব্যর্থ হয়েছে', err.message || 'SMS পাঠাতে সমস্যা হয়েছে।');
      } finally {
        isSending = false;
      }
      return;
    }

    const cleanPhone = normalizePhoneNumber(recipientPhone);
    if (!cleanPhone) {
      showToast('error', 'ফোন নম্বর সঠিক নয়', 'প্রাপকের বৈধ মোবাইল নম্বর দিন (যেমন: 01701034883 বা +8801701034883)।');
      return;
    }

    isSending = true;
    try {
      sendSms(recipientName || 'প্রাপক', cleanPhone, messageText, selectedGateway);
      const gwLabel = selectedGateway === 'android_sim1' ? 'Android SIM (৳০.০০)' : 'Cloud SMS (৳০.৩৫)';
      showToast(
        'success',
        'SMS সফলভাবে পাঠানো হয়েছে',
        `${recipientName}-কে (${cleanPhone}) ${gwLabel}-এর মাধ্যমে পাঠানো হয়েছে।`
      );
      messageText = '';
      selectedTemplateObj = null;
      onClose();
    } catch (err: any) {
      showToast('error', 'ব্যর্থ হয়েছে', err.message || 'SMS পাঠাতে সমস্যা হয়েছে।');
    } finally {
      isSending = false;
    }
  }
</script>

<Modal
  {open}
  title="Send SMS Notification"
  subtitle="অভিভাবক, শিক্ষার্থী বা শিক্ষকের ফোনে সরাসরি দ্রুত দ্বিভাষিক বার্তা পাঠান"
  {onClose}
  maxWidth="max-w-xl"
>
  <div class="space-y-4 text-xs">
    <!-- Recipient Badge & Info Header -->
    <div class="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-indigo-600/15 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold shrink-0">
          <MessageSquare class="w-5 h-5" />
        </div>
        <div>
          <div class="flex items-center gap-2">
            <span class="font-bold text-white text-sm">{recipientName || 'প্রাপক'}</span>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 uppercase">
              {recipientRole}
            </span>
          </div>
          <div class="flex items-center gap-2 text-slate-400 font-mono mt-0.5 flex-wrap">
            <div class="flex items-center gap-1.5">
              <Phone class="w-3 h-3 text-slate-500" />
              <span class="text-white font-semibold">{normPhone || recipientPhone || 'নম্বর দেওয়া হয়নি'}</span>
            </div>
            {#if carrierName}
              <span class="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 font-semibold text-[10px] border border-emerald-500/20">
                {carrierName}
              </span>
            {/if}
          </div>
        </div>
      </div>

      <div class="text-right shrink-0">
        <span class="text-[10px] text-slate-500 uppercase block">গেটওয়ে স্ট্যাটাস</span>
        <span class="font-bold text-emerald-400 flex items-center justify-end gap-1">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          {$smsAccount.androidGateway.connected ? 'GP 4G Online' : 'Cloud Active'}
        </span>
      </div>
    </div>

    <!-- Quick Templates Section -->
    <div class="space-y-2">
      <div class="flex items-center justify-between text-[11px]">
        <div class="flex items-center gap-1.5 text-slate-400 font-medium">
          <Sparkles class="w-3 h-3 text-amber-400" />
          <span>রেডিমেড টেমপ্লেট নির্বাচন করুন:</span>
        </div>

        <!-- Language Switcher for templates -->
        <div class="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
          <button
            type="button"
            class="px-2 py-0.5 rounded text-[10px] font-bold transition-all
            {activeLangMode === 'bangla' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}"
            on:click={() => switchLanguage('bangla')}
          >
            বাংলা
          </button>
          <button
            type="button"
            class="px-2 py-0.5 rounded text-[10px] font-bold transition-all
            {activeLangMode === 'english' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}"
            on:click={() => switchLanguage('english')}
          >
            English
          </button>
        </div>
      </div>

      <!-- Specific Context Templates -->
      {#if templates && templates.length > 0 && !showAllLibraryTemplates}
        <div class="flex flex-wrap gap-1.5">
          {#each templates as tpl}
            <button
              type="button"
              class="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/40 text-slate-300 hover:text-white transition-all text-[11px] flex items-center gap-1"
              on:click={() => applySimpleTemplate(tpl)}
            >
              <span>+</span>
              <span>{tpl.label}</span>
            </button>
          {/each}
          <button
            type="button"
            class="px-2.5 py-1 rounded-lg bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-500/30 text-indigo-300 hover:text-white transition-all text-[11px] flex items-center gap-1 font-semibold"
            on:click={() => (showAllLibraryTemplates = true)}
          >
            <Layers class="w-3 h-3" />
            <span>সকল টেমপ্লেট লাইব্রেরি ({$smsTemplates.length})</span>
          </button>
        </div>
      {:else}
        <!-- All System SMS Templates -->
        <div class="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
          {#each $smsTemplates as sysTpl}
            <button
              type="button"
              class="px-2 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/40 text-slate-300 hover:text-white transition-all text-[11px] flex items-center gap-1
              {selectedTemplateObj?.id === sysTpl.id ? 'border-indigo-500 text-indigo-300 bg-indigo-950/30 font-semibold' : ''}"
              on:click={() => applySystemTemplate(sysTpl)}
            >
              <span>+</span>
              <span>{sysTpl.title}</span>
            </button>
          {/each}
          {#if templates && templates.length > 0}
            <button
              type="button"
              class="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-[11px]"
              on:click={() => (showAllLibraryTemplates = false)}
            >
              সেকশন টেমপ্লেট ভিউ
            </button>
          {/if}
        </div>
      {/if}
    </div>

    <!-- Recipient Mode Switcher (Single vs Multiple Parents) -->
    {#if allowMultiple}
      <div class="flex items-center justify-between p-1 bg-slate-950 rounded-xl border border-slate-800">
        <button
          type="button"
          class="flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5
          {!isMultipleMode ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}"
          on:click={() => (isMultipleMode = false)}
        >
          <Phone class="w-3.5 h-3.5" />
          <span>একক নম্বর (Single Phone)</span>
        </button>

        <button
          type="button"
          class="flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5
          {isMultipleMode ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}"
          on:click={() => (isMultipleMode = true)}
        >
          <Users class="w-3.5 h-3.5" />
          <span>একাধিক অভিভাবক (Phone Text Area)</span>
        </button>
      </div>
    {/if}

    {#if isMultipleMode}
      <!-- Multiple Parents Phone Text Area Section -->
      <div class="space-y-2.5 p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <div>
            <label for="modal-multiple-phones" class="block font-semibold text-slate-200 text-xs flex items-center gap-1.5">
              <Users class="w-3.5 h-3.5 text-indigo-400" />
              <span>অভিভাবকদের ফোন নম্বর টেক্সট এরিয়া</span>
            </label>
            <p class="text-[10px] text-slate-400 mt-0.5">
              প্রতি লাইনে একটি নম্বর অথবা কমা (,) দিয়ে একাধিক অভিভাবকের নম্বর লিখুন বা পেস্ট করুন
            </p>
          </div>

          <div class="flex items-center gap-1.5">
            <button
              type="button"
              class="px-2 py-1 rounded-lg bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-500/30 text-indigo-300 hover:text-white text-[10px] font-semibold transition-all flex items-center gap-1"
              on:click={loadAllParentsToModal}
              title="সকল শিক্ষার্থীর অভিভাবকের নম্বর লোড করুন"
            >
              <Users class="w-3 h-3 text-indigo-400" />
              <span>সকল অভিভাবক ({$students.length})</span>
            </button>

            <button
              type="button"
              class="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-[10px] transition-all flex items-center gap-1"
              on:click={formatAndDedupeModalPhones}
            >
              <Sparkles class="w-3 h-3 text-amber-400" />
              <span>ফরম্যাট</span>
            </button>

            {#if multiplePhonesText}
              <button
                type="button"
                class="px-1.5 py-1 rounded-lg text-rose-400 hover:bg-rose-950/40 text-[10px]"
                on:click={clearModalPhones}
              >
                <Trash2 class="w-3 h-3" />
              </button>
            {/if}
          </div>
        </div>

        <textarea
          id="modal-multiple-phones"
          rows="4"
          bind:value={multiplePhonesText}
          placeholder="01711223344&#10;01811223344&#10;01911223344&#10;+8801701034883"
          class="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-xs placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors leading-relaxed"
        ></textarea>

        <!-- Live Metrics Counter -->
        <div class="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80 flex-wrap gap-2">
          <div class="flex items-center gap-2">
            <span>মোট: <strong class="text-white font-mono">{parsedMultiplePhones.totalParsed}</strong></span>
            <span class="text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 class="w-3 h-3 text-emerald-400" />
              <span>বৈধ অভিভাবক: <strong class="font-mono text-emerald-300">{parsedMultiplePhones.valid.length}</strong></span>
            </span>
            {#if parsedMultiplePhones.duplicatesCount > 0}
              <span class="text-amber-400 text-[10px]">• ডুপ্লিকেট বাদ: {parsedMultiplePhones.duplicatesCount}</span>
            {/if}
            {#if parsedMultiplePhones.invalid.length > 0}
              <span class="text-rose-400 text-[10px]">• অকার্যকর: {parsedMultiplePhones.invalid.length}</span>
            {/if}
          </div>

          <!-- Carrier breakdown -->
          {#if Object.keys(parsedMultiplePhones.carrierCounts).length > 0}
            <div class="flex items-center gap-1 flex-wrap">
              {#each Object.entries(parsedMultiplePhones.carrierCounts) as [carrier, count]}
                <span class="px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-[9px] text-slate-300 font-mono">
                  {carrier}: {count}
                </span>
              {/each}
            </div>
          {/if}
        </div>
      </div>
    {:else}
      <!-- Single Recipient Details -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label for="modal-rec-name" class="block font-medium text-slate-300 mb-1">প্রাপকের নাম</label>
          <input
            id="modal-rec-name"
            type="text"
            bind:value={recipientName}
            class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            placeholder="যেমন: ফারহানের অভিভাবক"
          />
        </div>

        <div>
          <label for="modal-rec-phone" class="block font-medium text-slate-300 mb-1">মোবাইল নম্বর (+৮৮০ সহ)</label>
          <input
            id="modal-rec-phone"
            type="text"
            bind:value={recipientPhone}
            class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            placeholder="+880 1711-xxxxxx"
          />
        </div>
      </div>
    {/if}

    <!-- Message Content Textarea -->
    <div>
      <div class="flex items-center justify-between mb-1.5">
        <label for="modal-sms-msg" class="font-medium text-slate-300 flex items-center gap-1.5">
          <span>বার্তা বা নোটিশের টেক্সট</span>
          {#if selectedTemplateObj}
            <span class="text-[10px] text-indigo-400 bg-indigo-950/50 px-1.5 py-0.2 rounded border border-indigo-500/20">
              {selectedTemplateObj.title}
            </span>
          {/if}
        </label>
        <div class="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
          <span>{charCount} অক্ষর</span>
          <span class="text-slate-600">•</span>
          <span class="text-indigo-300 font-semibold">{actualParts} টি SMS</span>
          {#if isBangla}
            <span class="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 text-[10px]">বাংলা (৭০/SMS)</span>
          {:else}
            <span class="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 text-[10px]">English (160/SMS)</span>
          {/if}
        </div>
      </div>
      <textarea
        id="modal-sms-msg"
        rows="4"
        bind:value={messageText}
        placeholder="এখানে আপনার বার্তা লিখুন..."
        class="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs leading-relaxed"
      ></textarea>
    </div>

    <!-- Delivery Gateway Route Selector -->
    <div>
      <span class="block text-slate-300 font-semibold mb-1.5">ডেলিভারি মাধ্যম (Routing Engine):</span>
      <div class="grid grid-cols-2 gap-2.5">
        <label
          class="p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all
          {selectedGateway === 'android_sim1' ? 'bg-emerald-950/30 border-emerald-500 text-emerald-300 shadow-sm shadow-emerald-500/10' : 'bg-slate-950 border-slate-800 text-slate-400'}"
        >
          <div class="flex items-center gap-2">
            <input type="radio" name="sms_gw_choice" value="android_sim1" bind:group={selectedGateway} />
            <div class="flex flex-col">
              <span class="font-bold text-white text-[11px]">Android SIM 1</span>
              <span class="text-[10px] text-emerald-400">গ্রামীণফোন 4G</span>
            </div>
          </div>
          <span class="font-bold text-emerald-400 text-xs">৳০.০০</span>
        </label>

        <label
          class="p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all
          {selectedGateway === 'cloud' ? 'bg-indigo-950/30 border-indigo-500 text-indigo-300 shadow-sm shadow-indigo-500/10' : 'bg-slate-950 border-slate-800 text-slate-400'}"
        >
          <div class="flex items-center gap-2">
            <input type="radio" name="sms_gw_choice" value="cloud" bind:group={selectedGateway} />
            <div class="flex flex-col">
              <span class="font-bold text-white text-[11px]">Cloud BTRC Masking</span>
              <span class="text-[10px] text-indigo-400">ব্যালেন্স: {$smsAccount.cloudBalance}</span>
            </div>
          </div>
          <span class="font-bold text-indigo-400 text-xs">৳০.৩৫</span>
        </label>
      </div>
    </div>

    <!-- Actions -->
    <div class="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
      <button
        type="button"
        class="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
        on:click={onClose}
      >
        বাতিল
      </button>

      <button
        type="button"
        disabled={isSending || !messageText.trim()}
        class="px-5 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
        on:click={handleSend}
      >
        {#if isSending}
          <span class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          <span>পাঠানো হচ্ছে...</span>
        {:else}
          <Send class="w-4 h-4" />
          <span>SMS পাঠান</span>
        {/if}
      </button>
    </div>
  </div>
</Modal>
