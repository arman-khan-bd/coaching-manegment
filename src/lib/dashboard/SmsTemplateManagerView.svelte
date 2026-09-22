<script lang="ts">
  import {
    smsTemplates,
    addSmsTemplate,
    updateSmsTemplate,
    deleteSmsTemplate,
    toggleTemplateLanguage,
    showToast,
    instituteSettings,
    students,
    batches,
  } from '../store';
  import type { SmsTemplate } from '../types';
  import Badge from '../components/Badge.svelte';
  import Modal from '../components/Modal.svelte';
  import SendSmsModal from '../components/SendSmsModal.svelte';
  import {
    FileText,
    Plus,
    Search,
    Edit3,
    Trash2,
    Copy,
    Check,
    Send,
    Languages,
    Sparkles,
    CheckCircle2,
    Layers,
    Tag,
    Clock,
    AlertCircle,
    BookOpen,
    Users,
    CreditCard,
    Award,
    CalendarCheck,
    HelpCircle,
  } from 'lucide-svelte';

  // Filters & State
  let selectedCategory: 'all' | 'attendance' | 'fees' | 'exams' | 'batches' | 'teachers' | 'general' = 'all';
  let searchQuery = '';
  let viewMode: 'both' | 'bangla' | 'english' = 'both';

  // Create / Edit Modal State
  let isEditModalOpen = false;
  let editingTemplateId: string | null = null;
  let formTitle = '';
  let formCategory: 'attendance' | 'fees' | 'exams' | 'batches' | 'teachers' | 'general' = 'attendance';
  let formEventType = '';
  let formContentBangla = '';
  let formContentEnglish = '';
  let formDefaultLang: 'bangla' | 'english' = 'bangla';
  let activeTextareaTarget: 'bangla' | 'english' = 'bangla';

  // Test Send Modal State
  let isTestModalOpen = false;
  let testRecipientName = 'ফারহান শাকিল (অভিভাবক)';
  let testRecipientPhone = '+880 1711-456789';
  let testDefaultMessage = '';
  let testTemplatesList: { label: string; text: string }[] = [];

  // Variable Chips for Quick Insertion
  const variableLibrary = [
    { tag: '{student_name}', label: 'শিক্ষার্থীর নাম', sample: 'ফারহান শাকিল' },
    { tag: '{guardian_name}', label: 'অভিভাবকের নাম', sample: 'মেজর (অবঃ) আনিসুর রহমান' },
    { tag: '{batch_name}', label: 'ব্যাচের নাম', sample: 'HSC \'26 ফিজিক্স আলফা' },
    { tag: '{course_name}', label: 'কোর্স', sample: 'এইচএসসি পদার্থবিজ্ঞান' },
    { tag: '{due_amount}', label: 'বকেয়া ফি', sample: '২,৫০০' },
    { tag: '{paid_amount}', label: 'পরিশোধিত ফি', sample: '২,৫০০' },
    { tag: '{due_date}', label: 'পরিশোধের তারিখ', sample: '২৫ সেপ্টেম্বর ২০২৬' },
    { tag: '{receipt_no}', label: 'মানি রিসিট নং', sample: 'REC-8821' },
    { tag: '{payment_method}', label: 'পেমেন্ট মাধ্যম', sample: 'bKash Merchant' },
    { tag: '{exam_title}', label: 'পরীক্ষার নাম', sample: 'ভেক্টর মডেল টেস্ট ১' },
    { tag: '{exam_date}', label: 'পরীক্ষার তারিখ', sample: '১৫ অক্টোবর ২০২৬' },
    { tag: '{marks_obtained}', label: 'প্রাপ্ত নম্বর', sample: '৯৪' },
    { tag: '{total_marks}', label: 'পূর্ণমান', sample: '১০০' },
    { tag: '{grade}', label: 'গ্রেড', sample: 'A+ (GPA 5.0)' },
    { tag: '{teacher_name}', label: 'শিক্ষকের নাম', sample: 'ড. তানভীর আহমেদ' },
    { tag: '{meeting_date}', label: 'মিটিংয়ের তারিখ', sample: '২৭ সেপ্টেম্বর ২০২৬' },
    { tag: '{start_time}', label: 'ক্লাসের সময়', sample: 'সকাল ১০:০০' },
    { tag: '{room_no}', label: 'রুম নং', sample: '৪০২' },
    { tag: '{holiday_occasion}', label: 'ছুটির উপলক্ষ', sample: 'পবিত্র ঈদে মিলাদুন্নবী' },
    { tag: '{holiday_date}', label: 'ছুটির তারিখ', sample: '১৬ সেপ্টেম্বর ২০২৬' },
    { tag: '{institute_name}', label: 'একাডেমির নাম', sample: 'এপেক্স কেয়ার' },
    { tag: '{institute_phone}', label: 'হটলাইন', sample: '+880 1711-456789' },
  ];

  // Helper for Category Metadata
  const categoryMeta: Record<string, { labelBn: string; labelEn: string; color: string; icon: any }> = {
    attendance: { labelBn: 'উপস্থিতি', labelEn: 'Attendance', color: 'emerald', icon: CalendarCheck },
    fees: { labelBn: 'ফি ও পেমেন্ট', labelEn: 'Fees & Invoicing', color: 'amber', icon: CreditCard },
    exams: { labelBn: 'পরীক্ষা ও মূল্যায়ন', labelEn: 'Exams & Marks', color: 'indigo', icon: Award },
    batches: { labelBn: 'ব্যাচ ও রুটিন', labelEn: 'Batches & Routine', color: 'sky', icon: BookOpen },
    teachers: { labelBn: 'শিক্ষক ও স্টাফ', labelEn: 'Faculty & Teachers', color: 'rose', icon: Users },
    general: { labelBn: 'সাধারণ বিজ্ঞপ্তি', labelEn: 'General Notices', color: 'purple', icon: Layers },
  };

  // Filtered Templates
  $: filteredTemplates = $smsTemplates.filter((tpl) => {
    const matchesCat = selectedCategory === 'all' || tpl.category === selectedCategory;
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      tpl.title.toLowerCase().includes(query) ||
      tpl.contentBangla.toLowerCase().includes(query) ||
      tpl.contentEnglish.toLowerCase().includes(query) ||
      tpl.eventType.toLowerCase().includes(query) ||
      tpl.variables.some((v) => v.toLowerCase().includes(query));
    return matchesCat && matchesSearch;
  });

  // Calculate live SMS parts
  function calcParts(text: string, isBangla: boolean) {
    const len = text.length;
    if (len === 0) return { chars: 0, parts: 0 };
    const limit = isBangla ? 70 : 160;
    const parts = Math.ceil(len / limit) || 1;
    return { chars: len, parts };
  }

  $: formBanglaStats = calcParts(formContentBangla, true);
  $: formEnglishStats = calcParts(formContentEnglish, false);

  // Sample Presets for Quick 1-Click Creation
  const presetTemplates = [
    {
      title: 'ভর্তি নিশ্চিতকরণ ও শুভেচ্ছা বার্তা',
      category: 'general' as const,
      eventType: 'admission_welcome',
      contentBangla: 'অভিনন্দন! {student_name} এপেক্স অ্যাকাডেমিক কেয়ারে {course_name}-এ সফলভাবে ভর্তি হয়েছে। রোল: {receipt_no}। হেল্পলাইন: {institute_phone}। - {institute_name}',
      contentEnglish: 'Congratulations! {student_name} has successfully enrolled in {course_name} at {institute_name}. Roll/Receipt: {receipt_no}. Hotline: {institute_phone}.',
    },
    {
      title: 'জরুরি ক্লাসে অনুপস্থিতি নোটিশ',
      category: 'attendance' as const,
      eventType: 'attendance_alert',
      contentBangla: 'সম্মানিত অভিভাবক, {student_name} আজ {batch_name}-এর ক্লাসে উপস্থিত ছিল না। বিস্তারিত জানতে দ্রুত কল করুন: {institute_phone}। - {institute_name}',
      contentEnglish: 'Dear Guardian, {student_name} was ABSENT from {batch_name} session today. Contact academy desk: {institute_phone}. - {institute_name}',
    },
    {
      title: 'মাসিক টিউশন ফি বকেয়া তাগাদা',
      category: 'fees' as const,
      eventType: 'fee_reminder',
      contentBangla: 'সম্মানিত অভিভাবক, {student_name}-এর বকেয়া ফি ৳{due_amount} পরিশোধের শেষ তারিখ {due_date}। বিকাশ মার্চেন্ট: 01711-456789। - {institute_name}',
      contentEnglish: 'Dear Guardian, tuition fee of BDT {due_amount} for {student_name} is due on {due_date}. bKash Merchant: 01711-456789. - {institute_name}',
    },
    {
      title: 'মডেল টেস্ট ফলাফল ও গ্রেডশিট',
      category: 'exams' as const,
      eventType: 'exam_results',
      contentBangla: 'ফলাফল: {exam_title} পরীক্ষায় {student_name} {total_marks}-এ {marks_obtained} নম্বর (গ্রেড: {grade}) অর্জন করেছে। - {institute_name}',
      contentEnglish: 'Result: {student_name} secured {marks_obtained}/{total_marks} (Grade: {grade}) in {exam_title}. - {institute_name}',
    },
  ];

  function loadPreset(preset: typeof presetTemplates[0]) {
    formTitle = preset.title;
    formCategory = preset.category;
    formEventType = preset.eventType;
    formContentBangla = preset.contentBangla;
    formContentEnglish = preset.contentEnglish;
    showToast('info', 'নমুনা টেমপ্লেট লোড হয়েছে', `'${preset.title}' এর ডাটা ফর্মে লোড করা হয়েছে।`);
  }

  function copyBnToEn() {
    if (!formContentBangla.trim()) {
      showToast('warning', 'বাংলা টেক্সট খালি', 'কপি করার জন্য প্রথমে বাংলা মেসেজ লিখুন।');
      return;
    }
    formContentEnglish = formContentBangla;
    showToast('info', 'কপি সম্পন্ন', 'বাংলা মেসেজটি ইংরেজিতে কপি করা হয়েছে।');
  }

  function copyEnToBn() {
    if (!formContentEnglish.trim()) {
      showToast('warning', 'ইংরেজি টেক্সট খালি', 'কপি করার জন্য প্রথমে ইংরেজি মেসেজ লিখুন।');
      return;
    }
    formContentBangla = formContentEnglish;
    showToast('info', 'কপি সম্পন্ন', 'ইংরেজি মেসেজটি বাংলায় কপি করা হয়েছে।');
  }

  // Open Create Modal
  function openCreateModal() {
    editingTemplateId = null;
    formTitle = '';
    formCategory = 'attendance';
    formEventType = 'attendance_notice';
    formContentBangla = 'সম্মানিত অভিভাবক, আপনার সন্তান {student_name}-এর বিষয়ে এপেক্স অ্যাকাডেমিক কেয়ার থেকে বিশেষ বিজ্ঞপ্তি। বিস্তারিত: {institute_phone}।';
    formContentEnglish = 'Dear Guardian, special notice regarding {student_name} from Apex Academic Care. Details: {institute_phone}.';
    formDefaultLang = 'bangla';
    activeTextareaTarget = 'bangla';
    isEditModalOpen = true;
  }

  // Open Edit Modal
  function openEditModal(tpl: SmsTemplate) {
    editingTemplateId = tpl.id;
    formTitle = tpl.title;
    formCategory = tpl.category;
    formEventType = tpl.eventType;
    formContentBangla = tpl.contentBangla || tpl.content || '';
    formContentEnglish = tpl.contentEnglish || tpl.content || '';
    formDefaultLang = tpl.activeLanguage || 'bangla';
    activeTextareaTarget = 'bangla';
    isEditModalOpen = true;
  }

  // Insert Variable Chip into targeted textarea
  function insertVariable(tag: string) {
    if (activeTextareaTarget === 'bangla') {
      formContentBangla = (formContentBangla ? formContentBangla + ' ' : '') + tag;
    } else {
      formContentEnglish = (formContentEnglish ? formContentEnglish + ' ' : '') + tag;
    }
  }

  // Extract variables automatically
  function extractVariables(bnText: string, enText: string): string[] {
    const combined = `${bnText} ${enText}`;
    const matches = combined.match(/\{[a-zA-Z0-9_]+\}/g) || [];
    const unique = Array.from(new Set(matches));
    return unique.length > 0 ? unique : ['{student_name}', '{institute_name}', '{institute_phone}'];
  }

  // Save / Update Handler
  function handleSaveTemplate() {
    if (!formTitle.trim()) {
      showToast('error', 'শিরোনাম আবশ্যক', 'অনুগ্রহ করে টেমপ্লেটের শিরোনাম লিখুন।');
      return;
    }

    const hasBn = !!formContentBangla.trim();
    const hasEn = !!formContentEnglish.trim();

    if (!hasBn && !hasEn) {
      showToast('error', 'মেসেজ কন্টেন্ট প্রয়োজন', 'অন্তত বাংলা অথবা ইংরেজি যেকোনো একটি মেসেজ ফরম্যাট লিখুন।');
      return;
    }

    // Auto-fallback: if one language is provided and the other is blank, mirror it
    const finalBn = hasBn ? formContentBangla.trim() : formContentEnglish.trim();
    const finalEn = hasEn ? formContentEnglish.trim() : formContentBangla.trim();

    const vars = extractVariables(finalBn, finalEn);

    if (editingTemplateId) {
      updateSmsTemplate(editingTemplateId, {
        title: formTitle.trim(),
        category: formCategory,
        eventType: formEventType.trim() || `${formCategory}_notice`,
        contentBangla: finalBn,
        contentEnglish: finalEn,
        variables: vars,
        activeLanguage: formDefaultLang,
      });
    } else {
      addSmsTemplate({
        title: formTitle.trim(),
        category: formCategory,
        eventType: formEventType.trim() || `${formCategory}_${Date.now().toString(36)}`,
        contentBangla: finalBn,
        contentEnglish: finalEn,
        variables: vars,
        activeLanguage: formDefaultLang,
      });
    }

    isEditModalOpen = false;
  }

  // Delete Handler
  function handleDelete(id: string, title: string) {
    if (confirm(`আপনি কি নিশ্চিতভাবে '${title}' টেমপ্লেটটি মুছে ফেলতে চান?`)) {
      deleteSmsTemplate(id);
    }
  }

  // Copy text to clipboard
  function copyText(text: string, label: string) {
    navigator.clipboard.writeText(text);
    showToast('info', 'ক্লিপবোর্ডে কপি হয়েছে', `${label} কপি করা হয়েছে।`);
  }

  // Quick Test Dispatch
  function openTestSend(tpl: SmsTemplate) {
    const isBn = tpl.activeLanguage !== 'english';
    const rawContent = isBn ? tpl.contentBangla : tpl.contentEnglish;

    // Compile with sample data
    let compiled = rawContent;
    variableLibrary.forEach((v) => {
      compiled = compiled.replaceAll(v.tag, v.sample);
    });

    testDefaultMessage = compiled;
    testTemplatesList = [
      { label: `বাংলা: ${tpl.title}`, text: tpl.contentBangla },
      { label: `English: ${tpl.title}`, text: tpl.contentEnglish },
    ];
    isTestModalOpen = true;
  }
</script>

<div class="space-y-6">
  <!-- Top Banner -->
  <div class="rounded-3xl p-6 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
    <div>
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 text-xs font-semibold mb-2 border border-indigo-500/20">
        <Languages class="w-3.5 h-3.5" />
        <span>Bilingual SMS Engine • বাংলা ও ইংরেজি অটোমেশন</span>
      </div>
      <h1 class="text-2xl font-black text-white font-['Outfit'] tracking-tight flex items-center gap-2">
        <span>SMS Template Manager</span>
        <span class="text-indigo-400 font-normal text-lg">(এসএমএস টেমপ্লেট ম্যানেজার)</span>
      </h1>
      <p class="text-slate-400 text-xs mt-1 max-w-2xl leading-relaxed">
        একই সেকশনের (উপস্থিতি, ফি, পরীক্ষা, ব্যাচ নোটিশ) জন্য বাংলা ও ইংরেজি উভয় ফরম্যাটে এসএমএস তৈরি ও পরিচালনা করুন। ডায়নামিক ভ্যারিয়েবল ট্যাগ ও লাইভ এসএমএস পার্ট ক্যালকুলেটর সংযুক্ত।
      </p>
    </div>

    <div class="flex items-center gap-3 shrink-0">
      <button
        type="button"
        class="px-5 py-3 rounded-2xl font-bold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 text-xs"
        on:click={openCreateModal}
      >
        <Plus class="w-4 h-4" />
        <span>নতুন টেমপ্লেট যোগ করুন</span>
      </button>
    </div>
  </div>

  <!-- KPI / Stats Cards -->
  <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
    <div class="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-3 shadow-md">
      <div class="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
        <FileText class="w-5 h-5" />
      </div>
      <div>
        <span class="text-[10px] text-slate-400 uppercase font-semibold block">মোট টেমপ্লেট</span>
        <span class="text-xl font-bold text-white font-['Outfit']">{$smsTemplates.length} টি</span>
      </div>
    </div>

    <div class="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-3 shadow-md">
      <div class="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
        <Languages class="w-5 h-5" />
      </div>
      <div>
        <span class="text-[10px] text-slate-400 uppercase font-semibold block">দ্বিভাষিক কভারেজ</span>
        <span class="text-xl font-bold text-emerald-400 font-['Outfit']">১০০% (বাং + Eng)</span>
      </div>
    </div>

    <div class="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-3 shadow-md">
      <div class="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
        <Layers class="w-5 h-5" />
      </div>
      <div>
        <span class="text-[10px] text-slate-400 uppercase font-semibold block">সেকশন ক্যাটালগ</span>
        <span class="text-xl font-bold text-amber-400 font-['Outfit']">৬ টি ক্যাটাগরি</span>
      </div>
    </div>

    <div class="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-3 shadow-md">
      <div class="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center text-violet-400 shrink-0">
        <Sparkles class="w-5 h-5" />
      </div>
      <div>
        <span class="text-[10px] text-slate-400 uppercase font-semibold block">স্মার্ট ভ্যারিয়েবল</span>
        <span class="text-xl font-bold text-violet-300 font-['Outfit']">২২+ ট্যাগ লাইব্রেরি</span>
      </div>
    </div>
  </div>

  <!-- Filters & Controls Bar -->
  <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <!-- Search Input -->
      <div class="relative flex-1 max-w-md">
        <Search class="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="টেমপ্লেটের নাম, বার্তা বা ট্যাগ দিয়ে খুঁজুন..."
          class="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
        {#if searchQuery}
          <button
            type="button"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
            on:click={() => (searchQuery = '')}
          >
            ✕
          </button>
        {/if}
      </div>

      <!-- View Switcher (Both / Bangla Only / English Only) -->
      <div class="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start md:self-auto text-xs">
        <span class="text-[11px] text-slate-400 px-2 font-medium">প্রদর্শন ভিউ:</span>
        <button
          type="button"
          class="px-2.5 py-1 rounded-lg font-medium transition-all {viewMode === 'both' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}"
          on:click={() => (viewMode = 'both')}
        >
          উভয় (বাংলা + Eng)
        </button>
        <button
          type="button"
          class="px-2.5 py-1 rounded-lg font-medium transition-all {viewMode === 'bangla' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}"
          on:click={() => (viewMode = 'bangla')}
        >
          শুধু বাংলা
        </button>
        <button
          type="button"
          class="px-2.5 py-1 rounded-lg font-medium transition-all {viewMode === 'english' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}"
          on:click={() => (viewMode = 'english')}
        >
          Only English
        </button>
      </div>
    </div>

    <!-- Category Filter Chips -->
    <div class="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
      <button
        type="button"
        class="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5
        {selectedCategory === 'all' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'}"
        on:click={() => (selectedCategory = 'all')}
      >
        <span>সকল সেকশন</span>
        <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300">{$smsTemplates.length}</span>
      </button>

      {#each Object.entries(categoryMeta) as [key, meta]}
        {@const count = $smsTemplates.filter((t) => t.category === key).length}
        <button
          type="button"
          class="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5
          {selectedCategory === key ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'}"
          on:click={() => (selectedCategory = key as any)}
        >
          <svelte:component this={meta.icon} class="w-3.5 h-3.5" />
          <span>{meta.labelBn}</span>
          <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300">{count}</span>
        </button>
      {/each}
    </div>
  </div>

  <!-- Templates Grid List -->
  {#if filteredTemplates.length === 0}
    <div class="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center">
      <AlertCircle class="w-10 h-10 text-slate-600 mx-auto mb-3" />
      <h3 class="text-white font-bold text-sm">কোনো SMS টেমপ্লেট খুঁজে পাওয়া যায়নি</h3>
      <p class="text-slate-400 text-xs mt-1">অনুসন্ধান ফিল্টার পরিবর্তন করুন অথবা নতুন টেমপ্লেট যুক্ত করুন।</p>
      <button
        type="button"
        class="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs"
        on:click={openCreateModal}
      >
        + নতুন টেমপ্লেট তৈরি করুন
      </button>
    </div>
  {:else}
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
      {#each filteredTemplates as tpl (tpl.id)}
        {@const meta = categoryMeta[tpl.category] || categoryMeta.general}
        {@const bnStats = calcParts(tpl.contentBangla, true)}
        {@const enStats = calcParts(tpl.contentEnglish, false)}
        {@const isDefaultBn = tpl.activeLanguage !== 'english'}

        <div class="bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 shadow-xl transition-all flex flex-col justify-between space-y-4">
          <!-- Card Top: Category Badge & Actions -->
          <div>
            <div class="flex items-start justify-between gap-3 mb-2.5">
              <div class="flex flex-wrap items-center gap-2">
                <!-- Section Badge -->
                <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border
                  {meta.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' : ''}
                  {meta.color === 'amber' ? 'bg-amber-500/10 text-amber-300 border-amber-500/20' : ''}
                  {meta.color === 'indigo' ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20' : ''}
                  {meta.color === 'sky' ? 'bg-sky-500/10 text-sky-300 border-sky-500/20' : ''}
                  {meta.color === 'rose' ? 'bg-rose-500/10 text-rose-300 border-rose-500/20' : ''}
                  {meta.color === 'purple' ? 'bg-purple-500/10 text-purple-300 border-purple-500/20' : ''}">
                  <svelte:component this={meta.icon} class="w-3 h-3" />
                  <span>{meta.labelBn}</span>
                  <span class="text-slate-500">({meta.labelEn})</span>
                </span>

                <!-- Event Type Badge -->
                <span class="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                  {tpl.eventType}
                </span>

                <!-- Active Primary Language Switcher Indicator -->
                <button
                  type="button"
                  title="ক্লিক করে ডিফল্ট ভাষা পরিবর্তন করুন"
                  class="text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all flex items-center gap-1
                  {isDefaultBn ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30' : 'bg-indigo-950/40 text-indigo-300 border-indigo-500/30'}"
                  on:click={() => toggleTemplateLanguage(tpl.id)}
                >
                  <Languages class="w-3 h-3" />
                  <span>ডিফল্ট: {isDefaultBn ? 'বাংলা' : 'English'}</span>
                </button>
              </div>

              <!-- Quick action buttons -->
              <div class="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  title="টেম্পলেট সম্পাদনা"
                  class="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                  on:click={() => openEditModal(tpl)}
                >
                  <Edit3 class="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  title="টেমপ্লেট মুছে ফেলুন"
                  class="p-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition-colors"
                  on:click={() => handleDelete(tpl.id, tpl.title)}
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <!-- Title -->
            <h3 class="font-bold text-white text-base leading-snug">{tpl.title}</h3>
          </div>

          <!-- Bilingual Content Section (Bangla & English) -->
          <div class="space-y-3">
            <!-- BANGLA TEMPLATE BOX -->
            {#if viewMode === 'both' || viewMode === 'bangla'}
              <div class="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800/80 hover:border-emerald-500/30 transition-all space-y-2">
                <div class="flex items-center justify-between text-[11px]">
                  <div class="flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span class="font-bold text-emerald-300">বাংলা টেমপ্লেট (Unicode)</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="font-mono text-slate-400 text-[10px]">
                      {bnStats.chars} অক্ষর • <strong class="text-emerald-300">{bnStats.parts} SMS</strong> (৭০/SMS)
                    </span>
                    <button
                      type="button"
                      class="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                      title="বাংলা মেসেজ কপি করুন"
                      on:click={() => copyText(tpl.contentBangla, 'বাংলা টেক্সট')}
                    >
                      <Copy class="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <p class="text-xs text-slate-200 leading-relaxed font-sans bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/50 select-all">
                  {tpl.contentBangla}
                </p>
              </div>
            {/if}

            <!-- ENGLISH TEMPLATE BOX -->
            {#if viewMode === 'both' || viewMode === 'english'}
              <div class="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800/80 hover:border-indigo-500/30 transition-all space-y-2">
                <div class="flex items-center justify-between text-[11px]">
                  <div class="flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-indigo-400"></span>
                    <span class="font-bold text-indigo-300">English Template (ASCII)</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="font-mono text-slate-400 text-[10px]">
                      {enStats.chars} chars • <strong class="text-indigo-300">{enStats.parts} SMS</strong> (160/SMS)
                    </span>
                    <button
                      type="button"
                      class="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                      title="English text copy"
                      on:click={() => copyText(tpl.contentEnglish, 'English text')}
                    >
                      <Copy class="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <p class="text-xs text-slate-300 leading-relaxed font-sans bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/50 select-all">
                  {tpl.contentEnglish}
                </p>
              </div>
            {/if}
          </div>

          <!-- Dynamic Variables Chips -->
          {#if tpl.variables && tpl.variables.length > 0}
            <div>
              <div class="flex items-center gap-1 text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1.5">
                <Tag class="w-3 h-3 text-indigo-400" />
                <span>ব্যবহৃত ডায়নামিক ভ্যারিয়েবল:</span>
              </div>
              <div class="flex flex-wrap gap-1">
                {#each tpl.variables as variableTag}
                  <button
                    type="button"
                    class="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-950 border border-slate-800 hover:border-indigo-500/50 text-indigo-300 hover:text-white transition-colors"
                    title="ক্লিক করে ট্যাগ কপি করুন"
                    on:click={() => copyText(variableTag, variableTag)}
                  >
                    {variableTag}
                  </button>
                {/each}
              </div>
            </div>
          {/if}

          <!-- Card Bottom Action Bar -->
          <div class="pt-3 border-t border-slate-800 flex items-center justify-between gap-3 text-xs">
            <button
              type="button"
              class="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1.5 transition-colors"
              on:click={() => toggleTemplateLanguage(tpl.id)}
            >
              <Languages class="w-3.5 h-3.5" />
              <span>ডিফল্ট ভাষা: <strong>{tpl.activeLanguage === 'english' ? 'English' : 'বাংলা'}</strong></span>
            </button>

            <button
              type="button"
              class="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
              on:click={() => openTestSend(tpl)}
            >
              <Send class="w-3.5 h-3.5" />
              <span>টেস্ট সেন্ড পাঠান</span>
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<!-- ========================================================= -->
<!-- CREATE / EDIT TEMPLATE MODAL -->
<!-- ========================================================= -->
<Modal
  open={isEditModalOpen}
  title={editingTemplateId ? 'SMS টেমপ্লেট সম্পাদনা করুন' : 'নতুন দ্বিভাষিক SMS টেমপ্লেট তৈরি করুন'}
  subtitle="একই সেকশনের জন্য বাংলা ও ইংরেজি উভয় ফরম্যাট বাধ্যতামূলক"
  onClose={() => (isEditModalOpen = false)}
  maxWidth="max-w-3xl"
>
  <div class="space-y-4 text-xs">
    <!-- Row 1: Title & Section -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label for="tpl-title" class="block font-medium text-slate-300 mb-1">
          টেমপ্লেটের নাম / শিরোনাম <span class="text-rose-400">*</span>
        </label>
        <input
          id="tpl-title"
          type="text"
          bind:value={formTitle}
          placeholder="যেমন: সাপ্তাহিক ক্লাস টেস্ট মূল্যায়ন ফলাফল"
          class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
      </div>

      <div>
        <label for="tpl-cat" class="block font-medium text-slate-300 mb-1">
          সেকশন / ক্যাটাগরি <span class="text-rose-400">*</span>
        </label>
        <select
          id="tpl-cat"
          bind:value={formCategory}
          class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="attendance">উপস্থিতি (Attendance)</option>
          <option value="fees">ফি ও পেমেন্ট (Fees & Invoicing)</option>
          <option value="exams">পরীক্ষা ও মূল্যায়ন (Exams & Marks)</option>
          <option value="batches">ব্যাচ ও রুটিন (Batches & Routine)</option>
          <option value="teachers">শিক্ষক ও স্টাফ (Faculty & Teachers)</option>
          <option value="general">সাধারণ নোটিশ (General Announcements)</option>
        </select>
      </div>
    </div>

    <!-- Row 2: Event Type Identifier & Default Language -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label for="tpl-event" class="block font-medium text-slate-300 mb-1">ইভেন্ট কোড / Trigger Identifier</label>
        <input
          id="tpl-event"
          type="text"
          bind:value={formEventType}
          placeholder="যেমন: exam_grade_notification"
          class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
      </div>

      <div>
        <label for="tpl-lang" class="block font-medium text-slate-300 mb-1">প্রাথমিক ডিফল্ট ভাষা</label>
        <select
          id="tpl-lang"
          bind:value={formDefaultLang}
          class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="bangla">বাংলা (Bangla - Unicode 70 chars)</option>
          <option value="english">English (ASCII 160 chars)</option>
        </select>
      </div>
    </div>

    <!-- Quick Preset Templates Bar -->
    <div class="p-3 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 space-y-1.5">
      <div class="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-300">
        <Sparkles class="w-3.5 h-3.5 text-amber-400" />
        <span>১-ক্লিকে নমুনা টেমপ্লেট লোড করুন:</span>
      </div>
      <div class="flex flex-wrap gap-2">
        {#each presetTemplates as preset}
          <button
            type="button"
            class="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-indigo-900/60 border border-slate-800 hover:border-indigo-500/40 text-slate-300 hover:text-white text-[11px] transition-all flex items-center gap-1"
            on:click={() => loadPreset(preset)}
          >
            <span>⚡</span>
            <span>{preset.title}</span>
          </button>
        {/each}
      </div>
    </div>

    <!-- Dynamic Variable Tag Insertion Library -->
    <div class="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-1.5 font-semibold text-slate-300 text-[11px]">
          <Sparkles class="w-3.5 h-3.5 text-amber-400" />
          <span>স্মার্ট ভ্যারিয়েবল ট্যাগ (ক্লিক করে সক্রিয় মেসেজে যোগ করুন):</span>
        </div>
        <div class="flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-[10px]">
          <span class="text-slate-400">যোগ হবে:</span>
          <button
            type="button"
            class="font-bold {activeTextareaTarget === 'bangla' ? 'text-emerald-400 underline' : 'text-slate-500'}"
            on:click={() => (activeTextareaTarget = 'bangla')}
          >
            বাংলায়
          </button>
          <span class="text-slate-600">|</span>
          <button
            type="button"
            class="font-bold {activeTextareaTarget === 'english' ? 'text-indigo-400 underline' : 'text-slate-500'}"
            on:click={() => (activeTextareaTarget = 'english')}
          >
            English-এ
          </button>
        </div>
      </div>

      <div class="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
        {#each variableLibrary as v}
          <button
            type="button"
            class="px-2 py-1 rounded-lg bg-slate-900 hover:bg-indigo-950 border border-slate-800 hover:border-indigo-500/50 text-slate-300 hover:text-white transition-all text-[10px] flex items-center gap-1 font-mono"
            on:click={() => insertVariable(v.tag)}
            title="{v.label} (যেমন: {v.sample})"
          >
            <span>+</span>
            <span>{v.tag}</span>
            <span class="text-slate-500 font-sans">({v.label})</span>
          </button>
        {/each}
      </div>
    </div>

    <!-- BANGLA TEXTAREA -->
    <div class="space-y-1.5">
      <div class="flex items-center justify-between">
        <label for="tpl-msg-bn" class="font-bold text-emerald-400 flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>বাংলা মেসেজ ফরম্যাট (Bangla Template - Unicode)</span>
        </label>
        <span class="font-mono text-slate-400 text-[11px]">
          {formBanglaStats.chars} অক্ষর • <strong class="text-emerald-400">{formBanglaStats.parts} টি SMS</strong> (৭০ অক্ষর/SMS)
        </span>
      </div>
      <textarea
        id="tpl-msg-bn"
        rows="3"
        bind:value={formContentBangla}
        on:focus={() => (activeTextareaTarget = 'bangla')}
        placeholder="সম্মানিত অভিভাবক, {student_name}-এর বিষয়ে নোটিশ..."
        class="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs leading-relaxed"
      ></textarea>
    </div>

    <!-- Quick Synchronize Bar between Bangla and English -->
    <div class="flex items-center justify-between px-2 py-1 bg-slate-950/60 rounded-xl border border-slate-800 text-[11px]">
      <span class="text-slate-400">দ্বিভাষিক দ্রুত কপি ও সিঙ্ক:</span>
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-slate-800 transition-colors"
          on:click={copyBnToEn}
        >
          ↓ বাংলা লেখা ইংরেজিতে কপি
        </button>
        <button
          type="button"
          class="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-indigo-300 border border-slate-800 transition-colors"
          on:click={copyEnToBn}
        >
          ↑ ইংরেজি লেখা বাংলায় কপি
        </button>
      </div>
    </div>

    <!-- ENGLISH TEXTAREA -->
    <div class="space-y-1.5">
      <div class="flex items-center justify-between">
        <label for="tpl-msg-en" class="font-bold text-indigo-400 flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-indigo-400"></span>
          <span>English Message Format (ASCII Template)</span>
        </label>
        <span class="font-mono text-slate-400 text-[11px]">
          {formEnglishStats.chars} chars • <strong class="text-indigo-400">{formEnglishStats.parts} SMS</strong> (160 chars/SMS)
        </span>
      </div>
      <textarea
        id="tpl-msg-en"
        rows="3"
        bind:value={formContentEnglish}
        on:focus={() => (activeTextareaTarget = 'english')}
        placeholder="Dear Guardian, notice regarding {student_name}..."
        class="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs leading-relaxed font-sans"
      ></textarea>
      <p class="text-[10px] text-slate-500">
        * টিপস: যেকোনো একটি ভাষা পূরণ করলেই অপরটি স্বয়ংক্রিয়ভাবে পূরণ হবে।
      </p>
    </div>

    <!-- Modal Actions -->
    <div class="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
      <button
        type="button"
        class="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
        on:click={() => (isEditModalOpen = false)}
      >
        বাতিল
      </button>

      <button
        type="button"
        class="px-6 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
        on:click={handleSaveTemplate}
      >
        <CheckCircle2 class="w-4 h-4" />
        <span>{editingTemplateId ? 'আপডেট সংরক্ষণ করুন' : 'টেমপ্লেট তৈরি করুন'}</span>
      </button>
    </div>
  </div>
</Modal>

<!-- ========================================================= -->
<!-- QUICK TEST DISPATCH MODAL -->
<!-- ========================================================= -->
<SendSmsModal
  open={isTestModalOpen}
  recipientName={testRecipientName}
  recipientPhone={testRecipientPhone}
  recipientRole="guardian"
  defaultMessage={testDefaultMessage}
  templates={testTemplatesList}
  onClose={() => (isTestModalOpen = false)}
/>
