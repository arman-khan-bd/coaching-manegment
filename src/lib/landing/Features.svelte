<script lang="ts">
  import {
    Users,
    GraduationCap,
    Layers,
    CalendarCheck,
    MessageSquare,
    CreditCard,
    Award,
    Smartphone,
    QrCode,
    Printer,
    CheckCircle2,
    Shield,
    FileSpreadsheet,
    Zap,
  } from 'lucide-svelte';

  const featureCards = [
    {
      icon: Layers,
      title: 'Course -> Unit -> Batch Engine',
      category: 'Academic Hierarchy',
      desc: 'Organize your curriculum from high-level Courses down to granular Units/Syllabus modules and running Batches with real-time seat occupancy counters.',
      color: 'indigo',
    },
    {
      icon: Smartphone,
      title: 'Dual-Engine SMS Hub (Android Own-SIM)',
      category: 'CodeCanyon Specialty',
      desc: 'Send automated parent notifications at virtually ৳0.00 cost by linking your own Android smartphone (GP, Banglalink, Robi SIM), or use seamless Cloud SMS credit bundles.',
      color: 'emerald',
      highlight: true,
    },
    {
      icon: CalendarCheck,
      title: 'Batch Attendance & Absent Triggers',
      category: 'Student Engagement',
      desc: 'Mark entire batch registers in seconds. Toggle "Instant SMS Alert" to immediately notify guardians whenever a student is late or absent.',
      color: 'violet',
    },
    {
      icon: CreditCard,
      title: 'Tuition Fees & Printable Receipts',
      category: 'Financial Control',
      desc: 'Issue automated invoices, track partial payments, filter overdue fees, and print clean branded payment vouchers and receipts on the spot.',
      color: 'amber',
    },
    {
      icon: QrCode,
      title: 'Printable Student ID Cards',
      category: 'Administration',
      desc: 'Generate professional student identity cards complete with passport photo, unique barcode/QR code, batch codes, and emergency contact details.',
      color: 'purple',
    },
    {
      icon: Award,
      title: 'Exams, Gradebook & Report Cards',
      category: 'Evaluation',
      desc: 'Conduct MCQ or subjective exams, enter batch scores, calculate percentages and grades automatically, and print official academy report cards.',
      color: 'rose',
    },
    {
      icon: Users,
      title: 'Teacher Rosters & Faculty Payroll',
      category: 'Staff Management',
      desc: 'Assign faculty to multiple batches, track lecture hours, manage monthly/hourly salaries or commissions, and view individual teacher timetables.',
      color: 'cyan',
    },
    {
      icon: Shield,
      title: 'Multi-Role Access Control',
      category: 'Security & Privacy',
      desc: 'Tailored portals for Institute Owners, Branch Admins, Teachers, and Students with fine-grained permissions and complete audit security.',
      color: 'blue',
    },
  ];
</script>

<section id="features" class="py-24 bg-slate-950/60 border-y border-slate-800/80 relative">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <!-- Section Header -->
    <div class="text-center max-w-3xl mx-auto">
      <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-4 border border-indigo-500/20">
        <Zap class="w-3.5 h-3.5" />
        <span>Packed With Powerful Modules</span>
      </div>
      <h2 class="text-3xl sm:text-5xl font-extrabold text-white font-['Outfit'] tracking-tight">
        Built Specifically for Modern Tuition & Coaching Centers
      </h2>
      <p class="mt-4 text-base sm:text-lg text-slate-300">
        Every single tool needed to run small tuition batches or multi-branch coaching academies without juggling 10 different spreadsheets.
      </p>
    </div>

    <!-- Features Grid -->
    <div class="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {#each featureCards as feat}
        <div
          class="group relative rounded-2xl p-6 bg-slate-900/60 border {feat.highlight ? 'border-emerald-500/50 shadow-lg shadow-emerald-500/10 bg-emerald-950/10' : 'border-slate-800 hover:border-indigo-500/40'} transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 flex flex-col justify-between"
        >
          <div>
            <div class="flex items-center justify-between">
              <div
                class="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110
                {feat.color === 'emerald' ? 'bg-emerald-500/15 text-emerald-400' :
                 feat.color === 'violet' ? 'bg-violet-500/15 text-violet-400' :
                 feat.color === 'amber' ? 'bg-amber-500/15 text-amber-400' :
                 feat.color === 'purple' ? 'bg-purple-500/15 text-purple-400' :
                 feat.color === 'rose' ? 'bg-rose-500/15 text-rose-400' :
                 feat.color === 'cyan' ? 'bg-cyan-500/15 text-cyan-400' :
                 feat.color === 'blue' ? 'bg-blue-500/15 text-blue-400' :
                 'bg-indigo-500/15 text-indigo-400'}"
              >
                <svelte:component this={feat.icon} class="w-6 h-6" />
              </div>
              {#if feat.highlight}
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                  Zero Extra Cost
                </span>
              {/if}
            </div>

            <div class="mt-5">
              <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">{feat.category}</span>
              <h3 class="text-lg font-bold text-white mt-1 group-hover:text-indigo-300 transition-colors font-['Outfit']">
                {feat.title}
              </h3>
              <p class="mt-2.5 text-xs sm:text-sm text-slate-300 leading-relaxed">
                {feat.desc}
              </p>
            </div>
          </div>

          <div class="mt-5 pt-4 border-t border-slate-800/80 flex items-center gap-1 text-xs font-semibold text-indigo-400 group-hover:text-indigo-300">
            <CheckCircle2 class="w-3.5 h-3.5 text-emerald-400" />
            <span>Included in all academy plans</span>
          </div>
        </div>
      {/each}
    </div>

    <!-- Dual SMS Highlight Banner -->
    <div id="sms-gateway" class="mt-16 rounded-3xl p-8 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 shadow-2xl relative overflow-hidden">
      <div class="absolute -right-10 -bottom-10 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div class="lg:col-span-7">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20 mb-3">
            <Smartphone class="w-3.5 h-3.5" />
            <span>Famous CodeCanyon Architecture Included</span>
          </div>
          <h3 class="text-2xl sm:text-3xl font-bold text-white font-['Outfit']">
            Save Thousands Every Month: Send Parent SMS using Your Own Android Phone
          </h3>
          <p class="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed">
            Most SaaS platforms charge high per-SMS gateway markup fees. CoachFlow gives you both options: purchase ready-to-go cloud SMS credit packs OR install our lightweight Android Gateway app on your spare smartphone to broadcast unlimited attendance and fee reminders using your local carrier SMS pack!
          </p>

          <div class="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
            <div class="flex items-center gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
              <CheckCircle2 class="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Dual SIM slot support with load balancing</span>
            </div>
            <div class="flex items-center gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
              <CheckCircle2 class="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Instant QR code phone pairing in 10 seconds</span>
            </div>
            <div class="flex items-center gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
              <CheckCircle2 class="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Live battery level & signal heartbeat telemetry</span>
            </div>
            <div class="flex items-center gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
              <CheckCircle2 class="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Daily carrier safety quota limits to prevent SIM bans</span>
            </div>
          </div>
        </div>

        <div class="lg:col-span-5 bg-slate-950/80 p-6 rounded-2xl border border-slate-800 shadow-xl">
          <div class="flex items-center justify-between pb-4 border-b border-slate-800">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Smartphone class="w-5 h-5" />
              </div>
              <div>
                <h4 class="text-sm font-bold text-white">Samsung Galaxy S24 Ultra</h4>
                <p class="text-[11px] text-emerald-400 font-medium">Gateway Node #1 Online • 92% Battery</p>
              </div>
            </div>
            <span class="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></span>
          </div>

          <div class="mt-4 space-y-3 text-xs">
            <div class="flex justify-between items-center text-slate-300">
              <span class="text-slate-400">SIM 1 Carrier:</span>
              <span class="font-medium text-white">Grameenphone 4G (GP)</span>
            </div>
            <div class="flex justify-between items-center text-slate-300">
              <span class="text-slate-400">Today's Sent / Limit:</span>
              <span class="font-semibold text-emerald-400">148 / 1,000 sent</span>
            </div>
            <div class="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div class="bg-gradient-to-r from-emerald-500 to-indigo-500 h-2 rounded-full" style="width: 15%"></div>
            </div>
            <div class="flex justify-between items-center text-slate-300">
              <span class="text-slate-400">Total Savings This Month:</span>
              <span class="font-bold text-emerald-300">৳৪,২০০ সাশ্রয়</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
