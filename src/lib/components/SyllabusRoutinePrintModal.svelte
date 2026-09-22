<script lang="ts">
  import { instituteSettings } from '../store';
  import type { SyllabusItem, RoutineSlot } from '../types';
  import {
    Printer,
    X,
    Building2,
    Calendar,
    Clock,
    BookOpen,
    CheckCircle2,
    QrCode,
    FileText,
    Award,
    Sparkles,
    ShieldCheck,
  } from 'lucide-svelte';

  export let open: boolean = false;
  export let mode: 'syllabus' | 'routine' = 'syllabus';
  export let syllabusData: {
    courseName: string;
    subjectName?: string;
    items: SyllabusItem[];
  } = { courseName: '', items: [] };
  export let routineData: {
    batchName: string;
    slots: RoutineSlot[];
  } = { batchName: '', slots: [] };
  export let onClose: () => void = () => {};

  const daysOrder = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const dayNameBn: Record<string, string> = {
    Saturday: 'শনিবার (Saturday)',
    Sunday: 'রবিবার (Sunday)',
    Monday: 'সোমবার (Monday)',
    Tuesday: 'মঙ্গলবার (Tuesday)',
    Wednesday: 'বুধবার (Wednesday)',
    Thursday: 'বৃহস্পতিবার (Thursday)',
    Friday: 'শুক্রবার (Friday)',
  };

  const classTypeLabels: Record<string, { label: string; color: string }> = {
    theory: { label: 'থিওরি লেকচার', color: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
    model_test: { label: 'মডেল টেস্ট / ওএমআর', color: 'bg-rose-50 text-rose-800 border-rose-200' },
    practical: { label: 'ল্যাব / প্র্যাকটিক্যাল', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
    doubt_solve: { label: 'প্রবলেম সলভিং / ডাউট সলভ', color: 'bg-amber-50 text-amber-800 border-amber-200' },
  };

  $: totalLectureHours = syllabusData.items.reduce((sum, item) => sum + (item.lectureHours || 0), 0);
  $: totalExamMarks = syllabusData.items.reduce((sum, item) => sum + (item.examMarks || 0), 0);
  $: completedChapters = syllabusData.items.filter((item) => item.status === 'completed').length;

  const printTimestamp = new Date().toLocaleDateString('bn-BD', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  function handlePrint() {
    window.print();
  }
</script>

{#if open}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static">
    <!-- Modal Card Container -->
    <div class="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden print:max-h-none print:border-none print:shadow-none print:rounded-none print:bg-white">
      
      <!-- Modal Top Action Header (Hidden during actual print) -->
      <div class="p-4 sm:px-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-4 print:hidden shrink-0">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            {#if mode === 'syllabus'}
              <BookOpen class="w-5 h-5" />
            {:else}
              <Calendar class="w-5 h-5" />
            {/if}
          </div>
          <div>
            <h3 class="text-sm font-bold text-white flex items-center gap-2 font-['Outfit']">
              <span>{mode === 'syllabus' ? 'Official Syllabus Print Preview' : 'Official Weekly Routine Print Preview'}</span>
              <span class="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/15 text-emerald-300 font-sans border border-emerald-500/20">
                A4 রেডি ফরম্যাট
              </span>
            </h3>
            <p class="text-[11px] text-slate-400">
              কোচিং সেন্টারের নাম, ঠিকানা, হটলাইন, শিক্ষাবর্ষ এবং পরিচালকের স্বাক্ষরসহ অনুমোদিত প্রিন্ট ভিউ।
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <button
            type="button"
            class="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2"
            on:click={handlePrint}
          >
            <Printer class="w-4 h-4" />
            <span>প্রিন্ট করুন (Print A4)</span>
          </button>

          <button
            type="button"
            class="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
            on:click={onClose}
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Printable Area Wrapper -->
      <div class="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-950/40 print:overflow-visible print:p-0 print:bg-white text-slate-900 font-sans">
        
        <!-- A4 Page Container -->
        <div id="printable-academic-document" class="bg-white text-slate-900 p-6 sm:p-10 rounded-2xl shadow-lg border border-slate-200 mx-auto max-w-3xl space-y-6 print:border-none print:shadow-none print:p-0 print:max-w-none print:rounded-none">
          
          <!-- ========================================================= -->
          <!-- 1. OFFICIAL COACHING CENTER HEADER (COACHING METADATA)   -->
          <!-- ========================================================= -->
          <div class="border-b-2 border-slate-900 pb-5">
            <div class="flex items-start justify-between gap-4">
              <div class="flex items-start gap-3.5">
                <!-- Institute Emblem / Logo -->
                <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-900 to-slate-900 flex flex-col items-center justify-center text-white shrink-0 shadow-md border-2 border-indigo-700">
                  <Building2 class="w-7 h-7 text-indigo-300" />
                  <span class="text-[8px] font-bold tracking-widest uppercase mt-0.5 text-indigo-200">APEX</span>
                </div>

                <!-- Institute Name, Tagline & Address -->
                <div>
                  <h1 class="text-xl sm:text-2xl font-black text-slate-950 font-serif tracking-tight leading-tight">
                    {$instituteSettings.name}
                  </h1>
                  <p class="text-[11px] sm:text-xs font-medium text-indigo-900 mt-0.5">
                    {$instituteSettings.tagline}
                  </p>
                  <p class="text-[10px] text-slate-600 mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                    <span><strong>ঠিকানা:</strong> {$instituteSettings.address}</span>
                    <span>•</span>
                    <span><strong>ফোন:</strong> {$instituteSettings.phone}</span>
                    <span>•</span>
                    <span><strong>ইমেইল:</strong> {$instituteSettings.email}</span>
                  </p>
                </div>
              </div>

              <!-- Document Identity Box -->
              <div class="text-right shrink-0 bg-slate-50 border border-slate-300 p-2 rounded-xl text-[10px] min-w-[120px]">
                <span class="text-slate-500 uppercase font-semibold block text-[9px]">শিক্ষাবর্ষ / সেশন</span>
                <span class="font-bold text-slate-900 text-xs block">{$instituteSettings.academicYear}</span>
                <span class="text-slate-400 text-[9px] mt-0.5 block">তারিখ: {printTimestamp}</span>
              </div>
            </div>

            <!-- Document Title Ribbon -->
            <div class="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
              <div class="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-900 text-white text-xs font-bold uppercase tracking-wider">
                {#if mode === 'syllabus'}
                  <BookOpen class="w-3.5 h-3.5 text-amber-400" />
                  <span>অ্যাকাডেমিক পূর্ণাঙ্গ সিলেবাস ও পাঠ পরিকল্পনা (Curriculum Breakdown)</span>
                {:else}
                  <Calendar class="w-3.5 h-3.5 text-emerald-400" />
                  <span>সাপ্তাহিক ক্লাস রুটিন ও সময়সূচি (Weekly Class Schedule)</span>
                {/if}
              </div>

              <span class="text-[11px] font-semibold text-slate-600">
                {#if mode === 'syllabus'}
                  কোর্স: <strong class="text-slate-900">{syllabusData.courseName}</strong>
                {:else}
                  ব্যাচ: <strong class="text-slate-900">{routineData.batchName}</strong>
                {/if}
              </span>
            </div>
          </div>

          <!-- ========================================================= -->
          <!-- 2. BODY CONTENT: SYLLABUS MODE                            -->
          <!-- ========================================================= -->
          {#if mode === 'syllabus'}
            <div class="space-y-4">
              <!-- Syllabus Meta Summary Box -->
              <div class="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-center text-xs">
                <div>
                  <span class="text-[10px] text-slate-500 uppercase block font-medium">মোট অধ্যায়</span>
                  <strong class="text-slate-900 text-sm">{syllabusData.items.length} টি</strong>
                </div>
                <div class="border-x border-slate-200">
                  <span class="text-[10px] text-slate-500 uppercase block font-medium">সর্বমোট লেকচার</span>
                  <strong class="text-indigo-900 text-sm">{totalLectureHours} ঘণ্টা</strong>
                </div>
                <div>
                  <span class="text-[10px] text-slate-500 uppercase block font-medium">বরাদ্দকৃত নম্বর</span>
                  <strong class="text-emerald-900 text-sm">{totalExamMarks} মার্কস</strong>
                </div>
              </div>

              <!-- Syllabus Chapters Table -->
              <div class="border border-slate-300 rounded-xl overflow-hidden">
                <table class="w-full text-left text-xs border-collapse">
                  <thead class="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 uppercase text-[10px]">
                    <tr>
                      <th class="p-2.5 text-center w-12 border-r border-slate-300">অধ্যায়</th>
                      <th class="p-2.5 border-r border-slate-300">অধ্যায়ের শিরোনাম ও রেফারেন্স</th>
                      <th class="p-2.5 border-r border-slate-300">মূল আলোচ্য বিষয়বস্তু (Topics)</th>
                      <th class="p-2.5 text-center w-16 border-r border-slate-300">ঘণ্টা</th>
                      <th class="p-2.5 text-center w-16 border-r border-slate-300">নম্বর</th>
                      <th class="p-2.5 text-center w-24">টার্গেট তারিখ</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-200 text-[11px]">
                    {#each syllabusData.items as item, idx}
                      <tr class="{idx % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'}">
                        <td class="p-2.5 text-center font-bold text-slate-900 border-r border-slate-200">
                          {item.chapterNo || idx + 1}
                        </td>
                        <td class="p-2.5 border-r border-slate-200">
                          <strong class="text-slate-900 block font-semibold">{item.chapterTitle}</strong>
                          {#if item.textbookReference}
                            <span class="text-[10px] text-slate-500 block mt-0.5">
                              বই: {item.textbookReference}
                            </span>
                          {/if}
                        </td>
                        <td class="p-2.5 border-r border-slate-200">
                          <ul class="list-disc list-inside space-y-0.5 text-slate-700 text-[10px] leading-tight">
                            {#each item.topics as top}
                              <li>{top}</li>
                            {/each}
                          </ul>
                        </td>
                        <td class="p-2.5 text-center font-mono font-semibold text-slate-800 border-r border-slate-200">
                          {item.lectureHours} ঘ.
                        </td>
                        <td class="p-2.5 text-center font-mono font-bold text-indigo-900 border-r border-slate-200">
                          {item.examMarks}
                        </td>
                        <td class="p-2.5 text-center text-slate-600 text-[10px]">
                          {item.targetCompletionDate}
                        </td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>

              <!-- General Guidelines Box -->
              <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[10px] text-slate-700 space-y-1">
                <span class="font-bold text-slate-900 uppercase tracking-wide block">শিক্ষার্থী ও অভিভাবকদের জন্য জরুরি নির্দেশনা:</span>
                <p>১. প্রতিটি লেকচারের পূর্বে নির্ধারিত অধ্যায়ের পাঠ্যবই পড়ে ক্লাসে উপস্থিত হওয়া বাঞ্ছনীয়।</p>
                <p>২. প্রতিটি অধ্যায় সমাপ্তির পর সংশ্লিষ্ট চ্যাপ্টার ওয়াইজ স্পেশাল ওএমআর মডেল টেস্টে অংশগ্রহণ বাধ্যতামূলক।</p>
                <p>৩. বিশেষ সমস্যা বা গাণিতিক ডাউটের জন্য সংশ্লিষ্ট শিক্ষকের সাথে অফিসিয়াল ডাউট সলভ সেশনের সুবিধা উপলব্ধ।</p>
              </div>
            </div>

          <!-- ========================================================= -->
          <!-- 3. BODY CONTENT: ROUTINE MODE                             -->
          <!-- ========================================================= -->
          {:else if mode === 'routine'}
            <div class="space-y-4">
              <!-- Routine Meta Summary Box -->
              <div class="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span class="text-[10px] text-slate-500 uppercase block font-medium">নির্ধারিত ব্যাচ</span>
                  <strong class="text-slate-900 text-sm">{routineData.batchName}</strong>
                </div>
                <div class="text-right">
                  <span class="text-[10px] text-slate-500 uppercase block font-medium">সাপ্তাহিক মোট ক্লাস</span>
                  <strong class="text-indigo-900 text-sm">{routineData.slots.length} টি সেশন</strong>
                </div>
              </div>

              <!-- Weekly Routine Table -->
              <div class="border border-slate-300 rounded-xl overflow-hidden">
                <table class="w-full text-left text-xs border-collapse">
                  <thead class="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 uppercase text-[10px]">
                    <tr>
                      <th class="p-2.5 w-36 border-r border-slate-300">দিন (Day)</th>
                      <th class="p-2.5 w-32 border-r border-slate-300">সময় (Time Slot)</th>
                      <th class="p-2.5 border-r border-slate-300">বিষয় ও ক্লাস টপিক</th>
                      <th class="p-2.5 border-r border-slate-300">দায়িত্বপ্রাপ্ত শিক্ষক</th>
                      <th class="p-2.5 text-center w-24 border-r border-slate-300">রুম নং</th>
                      <th class="p-2.5 text-center w-28">ক্লাসের ধরন</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-200 text-[11px]">
                    {#each routineData.slots as slot, idx}
                      {@const typeInfo = classTypeLabels[slot.classType] || classTypeLabels.theory}
                      <tr class="{idx % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'}">
                        <td class="p-2.5 font-bold text-slate-900 border-r border-slate-200">
                          {dayNameBn[slot.day] || slot.day}
                        </td>
                        <td class="p-2.5 font-mono text-slate-800 font-semibold border-r border-slate-200">
                          {slot.startTime} - {slot.endTime}
                        </td>
                        <td class="p-2.5 border-r border-slate-200">
                          <strong class="text-slate-900 block font-semibold">{slot.subject}</strong>
                        </td>
                        <td class="p-2.5 text-slate-700 border-r border-slate-200 font-medium">
                          {slot.teacherName}
                        </td>
                        <td class="p-2.5 text-center font-semibold text-slate-800 border-r border-slate-200 text-[10px]">
                          {slot.roomNumber}
                        </td>
                        <td class="p-2.5 text-center">
                          <span class="inline-block px-2 py-0.5 rounded text-[10px] font-bold border {typeInfo.color}">
                            {typeInfo.label}
                          </span>
                        </td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>

              <!-- Classroom Rules Box -->
              <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[10px] text-slate-700 space-y-1">
                <span class="font-bold text-slate-900 uppercase tracking-wide block">ক্লাসরুম শৃঙ্খলা ও নিয়মাবলি:</span>
                <p>১. ক্লাস শুরু হওয়ার অন্তত ১০ মিনিট পূর্বে শিক্ষার্থীদের নিজ নিজ আসনে অবস্থান নিশ্চিত করতে হবে।</p>
                <p>২. ডিজিটাল আইডি কার্ড প্রদর্শনপূর্বক ক্লাসরুমে প্রবেশ করতে হবে। কার্ড ব্যতিরেকে প্রবেশ কঠোরভাবে নিষিদ্ধ।</p>
                <p>৩. অনিবার্য কারণে রুটিনে পরিবর্তন আনা হলে অভিভাবকের নিবন্ধিত নম্বরে স্বয়ংক্রিয় SMS-এর মাধ্যমে অবগত করা হবে।</p>
              </div>
            </div>
          {/if}

          <!-- ========================================================= -->
          <!-- 4. OFFICIAL VERIFICATION & AUTHORIZATION FOOTER           -->
          <!-- ========================================================= -->
          <div class="pt-8 border-t-2 border-slate-900/80 mt-8">
            <div class="grid grid-cols-3 gap-6 text-center text-[10px]">
              <!-- Signature 1: Academic Coordinator -->
              <div class="flex flex-col items-center justify-end">
                <div class="w-32 border-b border-slate-400 mb-1"></div>
                <span class="font-bold text-slate-900 block">অ্যাকাডেমিক কো-অর্ডিনেটর</span>
                <span class="text-slate-500 text-[9px]">এপেক্স অ্যাকাডেমিক কেয়ার</span>
              </div>

              <!-- Signature 2: Course Director / Head Instructor -->
              <div class="flex flex-col items-center justify-end">
                <div class="w-32 border-b border-slate-400 mb-1"></div>
                <span class="font-bold text-slate-900 block">কোর্স সমন্বয়কারী / বিভাগীয় প্রধান</span>
                <span class="text-slate-500 text-[9px]">কারিকুলাম ও মূল্যায়ন বিভাগ</span>
              </div>

              <!-- Signature 3: Executive Director / Seal -->
              <div class="flex flex-col items-center justify-end">
                <div class="w-20 h-10 border border-dashed border-indigo-400 rounded-lg flex items-center justify-center text-[8px] text-indigo-700 font-bold uppercase mb-1">
                  [ অফিসিয়াল সিল ]
                </div>
                <div class="w-36 border-b-2 border-slate-900 mb-1"></div>
                <strong class="font-black text-slate-950 block">পরিচালক / অধ্যক্ষ</strong>
                <span class="text-slate-600 text-[9px]">{$instituteSettings.name}</span>
              </div>
            </div>

            <!-- Footer Document Security Watermark -->
            <div class="mt-6 pt-3 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-400">
              <span class="flex items-center gap-1 font-mono">
                <ShieldCheck class="w-3 h-3 text-emerald-600" />
                <span>Doc Security Hash: AAC-SEC-{Math.floor(Math.random() * 89999 + 10000)}-VERIFIED</span>
              </span>
              <span>এই অ্যাকাডেমিক নথির যেকোনো পরিবর্তন কেবলমাত্র পরিচালনা পর্ষদের অনুমোদন সাপেক্ষে বৈধ।</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  @media print {
    :global(body) {
      background: #ffffff !important;
      color: #000000 !important;
      margin: 0 !important;
      padding: 0 !important;
    }

    :global(header),
    :global(aside),
    :global(nav),
    :global(button) {
      display: none !important;
    }

    #printable-academic-document {
      width: 100% !important;
      max-width: 100% !important;
      margin: 0 !important;
      padding: 15mm !important;
      box-shadow: none !important;
      border: none !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      page-break-inside: avoid !important;
    }
  }
</style>
