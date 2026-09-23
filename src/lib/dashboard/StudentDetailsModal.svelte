<script lang="ts">
  import Modal from '../components/Modal.svelte';
  import Badge from '../components/Badge.svelte';
  import { students, batches, courses, type Student } from '../store';
  import {
    GraduationCap,
    School,
    Users,
    Users2,
    Phone,
    Mail,
    MapPin,
    Home,
    HeartHandshake,
    ShieldAlert,
    MessageSquare,
    QrCode,
    Pencil,
    FileText,
    Calendar,
    Award,
    CreditCard,
  } from 'lucide-svelte';

  export let open: boolean = false;
  export let student: Student | null = null;
  export let onClose: () => void = () => {};
  export let onEdit: ((s: Student) => void) | undefined = undefined;
  export let onSms: ((s: Student) => void) | undefined = undefined;
  export let onIdCard: ((s: Student) => void) | undefined = undefined;

  $: studentFriends = (student?.friendStudentIds || [])
    .map((fid) => $students.find((s) => s.id === fid))
    .filter(Boolean) as Student[];

  $: assignedBatches = (student?.batchIds || [])
    .map((bid) => $batches.find((b) => b.id === bid))
    .filter(Boolean);

  function getSmsTargetLabel(target?: string): string {
    switch (target) {
      case 'mother':
        return 'মাতা (Mother)';
      case 'both':
        return 'উভয় পিতা-মাতা (Both Parents)';
      case 'student':
        return 'শিক্ষার্থী (Student Directly)';
      default:
        return 'পিতা / প্রধান অভিভাবক (Father / Guardian)';
    }
  }
</script>

<Modal {open} title="শিক্ষার্থীর পূর্ণাঙ্গ প্রোফাইল ও বিবরণ" subtitle="একাডেমিক, পারিবারিক যোগাযোগ, মেস/হোস্টেল ও অভিভাবকের তথ্য" {onClose} maxWidth="max-w-3xl">
  {#if student}
    <div class="space-y-5 text-xs text-slate-200">
      <!-- Profile Header Banner -->
      <div class="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/20 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 shadow-lg">
        <div class="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
          <img
            src={student.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'}
            alt={student.name}
            class="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-indigo-500/40 shadow-md shrink-0 bg-slate-950"
          />
          <div class="space-y-1">
            <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h3 class="text-base sm:text-lg font-bold text-white font-['Outfit']">{student.name}</h3>
              <span class="px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-300 font-mono text-[11px] font-bold border border-indigo-500/30">
                রোল: {student.rollNo}
              </span>
              <span class="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase
                {student.status === 'active' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'}">
                {student.status}
              </span>
            </div>

            {#if student.studyingInstitute}
              <div class="text-xs text-indigo-300 font-medium flex items-center justify-center sm:justify-start gap-1.5 pt-0.5">
                <School class="w-3.5 h-3.5 text-indigo-400" />
                <span>{student.studyingInstitute}</span>
              </div>
            {/if}

            <div class="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1 text-slate-400 text-[11px] pt-1">
              <span>লিঙ্গ: <strong class="text-slate-200 capitalize">{student.gender}</strong></span>
              <span>•</span>
              <span>রক্তের গ্রুপ: <strong class="text-rose-400 font-bold">{student.bloodGroup}</strong></span>
              <span>•</span>
              <span>ভর্তি: <strong class="text-slate-300">{student.enrollmentDate}</strong></span>
            </div>
          </div>
        </div>

        <!-- Quick Action Buttons -->
        <div class="flex items-center gap-1.5 self-center sm:self-start">
          {#if onSms}
            <button
              type="button"
              class="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all flex items-center gap-1.5 shadow-sm"
              on:click={() => { onClose(); onSms?.(student); }}
            >
              <MessageSquare class="w-3.5 h-3.5" />
              <span>SMS</span>
            </button>
          {/if}

          {#if onIdCard}
            <button
              type="button"
              class="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all flex items-center gap-1.5 shadow-sm"
              on:click={() => { onClose(); onIdCard?.(student); }}
            >
              <QrCode class="w-3.5 h-3.5" />
              <span>ID Card</span>
            </button>
          {/if}

          {#if onEdit}
            <button
              type="button"
              class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-white border border-slate-700 transition-colors"
              title="সম্পাদনা করুন"
              on:click={() => { onClose(); onEdit?.(student); }}
            >
              <Pencil class="w-3.5 h-3.5" />
            </button>
          {/if}
        </div>
      </div>

      <!-- 4-Card Details Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        <!-- 1. Academic & Batches Card -->
        <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-inner">
          <h4 class="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5 text-indigo-400">
            <GraduationCap class="w-4 h-4" />
            <span>অ্যাকাডেমিক ও ব্যাচ বিবরণ</span>
          </h4>

          <div class="space-y-2">
            <div>
              <span class="text-slate-400 text-[11px] block">অধ্যয়নরত প্রতিষ্ঠান:</span>
              <p class="font-semibold text-white">{student.studyingInstitute || 'নথিভুক্ত করা হয়নি'}</p>
            </div>

            <div>
              <span class="text-slate-400 text-[11px] block">পূর্ববর্তী ক্লাসের জিপিএ / রেজাল্ট:</span>
              <p class="font-semibold text-emerald-300 font-mono">{student.previousGpa || '–'}</p>
            </div>

            <div>
              <span class="text-slate-400 text-[11px] block mb-1">অ্যাসাইনকৃত ব্যাচসমূহ:</span>
              <div class="flex flex-wrap gap-1.5">
                {#if assignedBatches.length > 0}
                  {#each assignedBatches as b}
                    <span class="px-2 py-0.5 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-semibold text-[11px]">
                      {b.name} ({b.code}) - {b.startTime}
                    </span>
                  {/each}
                {:else}
                  <span class="text-slate-500 text-[11px]">কোনো ব্যাচ অ্যাসাইন করা নেই</span>
                {/if}
              </div>
            </div>

            <div class="pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <span class="text-slate-400">বকেয়া ফি স্ট্যাটাস:</span>
              {#if student.feesDue === 0}
                <span class="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  পরিশোধিত (৳০.০০)
                </span>
              {:else}
                <span class="text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                  ৳{student.feesDue.toLocaleString()} বকেয়া
                </span>
              {/if}
            </div>
          </div>
        </div>

        <!-- 2. Family & Guardians Card -->
        <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-inner">
          <h4 class="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5 text-indigo-400">
            <Users2 class="w-4 h-4" />
            <span>পারিবারিক যোগাযোগ ও অভিভাবক</span>
          </h4>

          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <div>
                <span class="text-slate-400 text-[11px] block">পিতা / প্রধান অভিভাবক:</span>
                <p class="font-semibold text-white">{student.guardianName || student.fatherName || '–'}</p>
              </div>
              <a href="tel:{student.guardianPhone}" class="text-emerald-400 hover:underline font-mono text-[11px] font-bold">
                {student.guardianPhone}
              </a>
            </div>

            {#if student.motherName || student.motherPhone}
              <div class="flex items-center justify-between pt-1 border-t border-slate-800/60">
                <div>
                  <span class="text-slate-400 text-[11px] block">মাতার নাম:</span>
                  <p class="font-semibold text-white">{student.motherName || '–'}</p>
                </div>
                {#if student.motherPhone}
                  <a href="tel:{student.motherPhone}" class="text-emerald-400 hover:underline font-mono text-[11px] font-bold">
                    {student.motherPhone}
                  </a>
                {:else}
                  <span class="text-slate-500">–</span>
                {/if}
              </div>
            {/if}

            <div class="pt-1 border-t border-slate-800/60">
              <span class="text-slate-400 text-[11px] block">SMS প্রেরণের প্রাথমিক পছন্দ:</span>
              <p class="font-semibold text-indigo-300">{getSmsTargetLabel(student.smsRecipientTarget)}</p>
            </div>

            {#if student.additionalGuardianName || student.additionalGuardianPhone}
              <div class="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 mt-2">
                <span class="text-slate-400 text-[10px] block font-semibold uppercase">বিকল্প / স্থানীয় অভিভাবক:</span>
                <div class="flex items-center justify-between mt-0.5">
                  <span class="font-semibold text-white">{student.additionalGuardianName} ({student.additionalGuardianRelation || 'অভিভাবক'})</span>
                  <a href="tel:{student.additionalGuardianPhone}" class="text-emerald-400 font-mono text-[11px] hover:underline font-semibold">
                    {student.additionalGuardianPhone}
                  </a>
                </div>
              </div>
            {/if}
          </div>
        </div>

        <!-- 3. Residence, Address & Mess/Hostel Card -->
        <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-inner">
          <h4 class="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5 text-indigo-400">
            <Home class="w-4 h-4" />
            <span>ঠিকানা ও বাসস্থান / মেস</span>
          </h4>

          <div class="space-y-2">
            <div>
              <span class="text-slate-400 text-[11px] block">বর্তমান ঠিকানা:</span>
              <p class="font-medium text-slate-200">{student.address || '–'}</p>
            </div>

            <div>
              <span class="text-slate-400 text-[11px] block">গ্রাম / স্থায়ী এলাকা:</span>
              <p class="font-semibold text-white">{student.village || '–'}</p>
            </div>

            <div class="p-2.5 rounded-xl bg-amber-950/20 border border-amber-500/30">
              <span class="text-amber-300 text-[10px] block font-semibold uppercase">মেস / হোস্টেল / ম্যাচ নাম:</span>
              <p class="font-bold text-white mt-0.5">{student.messOrHostelName || 'বাসায় থাকে / কোনো মেস তথ্য নেই'}</p>
            </div>
          </div>
        </div>

        <!-- 4. Friends in Coaching & Special Notes Card -->
        <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-inner">
          <h4 class="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5 text-indigo-400">
            <HeartHandshake class="w-4 h-4 text-pink-400" />
            <span>কোচিংয়ে বন্ধু ও বিশেষ নোট</span>
          </h4>

          <div class="space-y-2.5">
            <div>
              <span class="text-slate-400 text-[11px] block mb-1">এই কোচিংয়ে অধ্যয়নরত বন্ধু / সহপাঠী:</span>
              {#if studentFriends.length > 0}
                <div class="flex flex-wrap gap-1.5">
                  {#each studentFriends as friend}
                    <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-pink-500/10 border border-pink-500/25 text-pink-300 font-semibold text-[11px]">
                      <span>{friend.name} (রোল: {friend.rollNo})</span>
                    </span>
                  {/each}
                </div>
              {:else}
                <p class="text-slate-500 text-[11px]">কোনো বন্ধু নির্বাচন করা হয়নি</p>
              {/if}
            </div>

            {#if student.notes}
              <div class="pt-2 border-t border-slate-800/80">
                <span class="text-slate-400 text-[11px] block mb-0.5">বিশেষ নোট / মন্তব্য:</span>
                <p class="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-300 text-[11px] leading-relaxed">
                  {student.notes}
                </p>
              </div>
            {/if}
          </div>
        </div>
      </div>

      <!-- Footer Buttons -->
      <div class="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
        <button
          type="button"
          class="px-4 py-2 rounded-xl text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
          on:click={onClose}
        >
          বন্ধ করুন
        </button>
      </div>
    </div>
  {/if}
</Modal>
