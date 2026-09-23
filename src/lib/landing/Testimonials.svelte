<script lang="ts">
  import { platformReviews, platformFaqs } from '../store';
  import {
    Star,
    Quote,
    CheckCircle2,
    HelpCircle,
    Search,
    ChevronDown,
    Smartphone,
    CreditCard,
    ShieldCheck,
    BookOpen,
    MessageCircle,
    ArrowRight,
    Sparkles,
  } from 'lucide-svelte';
  import { navigate } from '../router';

  // Filters & State
  let openFaqId: string | null = 'faq-1';
  let selectedCategory: string = 'all';
  let faqSearchQuery: string = '';

  const categories = [
    { id: 'all', label: 'সকল প্রশ্নোত্তর', icon: HelpCircle },
    { id: 'sms', label: 'এসএমএস গেটওয়ে', icon: Smartphone },
    { id: 'billing', label: 'ফি ও রসিদ', icon: CreditCard },
    { id: 'academic', label: 'অ্যাকাডেমিক ও আইডি', icon: BookOpen },
    { id: 'security', label: 'ডাটা নিরাপত্তা', icon: ShieldCheck },
  ];

  const categoryLabels: Record<string, { label: string; color: string }> = {
    sms: { label: 'SMS Gateway', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    billing: { label: 'Billing & Fees', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    academic: { label: 'Academics', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
    security: { label: 'Privacy & Cloud', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
    general: { label: 'General', color: 'bg-slate-500/10 text-slate-300 border-slate-500/20' },
  };

  $: visibleReviews = $platformReviews.filter((r) => r.status === 'published');
  $: visibleFaqs = $platformFaqs
    .filter((f) => f.status === 'published')
    .filter((f) => selectedCategory === 'all' || f.category === selectedCategory)
    .filter((f) => {
      if (!faqSearchQuery.trim()) return true;
      const q = faqSearchQuery.toLowerCase();
      return f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q);
    })
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  function toggleFaq(id: string) {
    openFaqId = openFaqId === id ? null : id;
  }
</script>

<section id="faq" class="py-24 bg-slate-950/60 relative overflow-hidden">
  <!-- Glowing Orbs -->
  <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none"></div>
  <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-[140px] pointer-events-none"></div>

  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
    <!-- Testimonials Header -->
    <div class="text-center max-w-3xl mx-auto">
      <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-4">
        <Sparkles class="w-3.5 h-3.5 text-amber-400" />
        <span>বাস্তব গ্রাহক অভিজ্ঞতা</span>
      </div>
      <h2 class="text-3xl sm:text-5xl font-extrabold text-white font-['Outfit'] tracking-tight">
        Trusted by 1,800+ Coaching Institutes & Academies
      </h2>
      <p class="mt-4 text-slate-400 text-sm sm:text-base leading-relaxed">
        Here is how academy directors and faculty save 15+ hours weekly with CoachFlow.
      </p>
    </div>

    <!-- Reviews Grid -->
    <div class="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
      {#each visibleReviews as r}
        <div class="p-6 rounded-3xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800/80 flex flex-col justify-between hover:border-indigo-500/40 transition-all duration-300 shadow-xl hover:shadow-indigo-500/5 group">
          <div>
            <!-- Star Ratings & Quote Icon -->
            <div class="flex items-center justify-between mb-5">
              <div class="flex items-center gap-1 text-amber-400">
                {#each Array(r.rating || 5) as _}
                  <Star class="w-4 h-4 fill-amber-400" />
                {/each}
              </div>
              <Quote class="w-6 h-6 text-slate-700 group-hover:text-indigo-500/50 transition-colors" />
            </div>

            <p class="text-xs sm:text-sm text-slate-300 leading-relaxed italic">
              "{r.comment}"
            </p>
          </div>

          <div class="mt-6 pt-5 border-t border-slate-800/80 flex items-center gap-3.5">
            <img
              src={r.avatar}
              alt={r.name}
              class="w-11 h-11 rounded-2xl object-cover border border-slate-700/80 shadow-md"
            />
            <div>
              <h4 class="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">{r.name}</h4>
              <p class="text-[11px] text-indigo-400">{r.role}</p>
              <span class="text-[10px] text-slate-500 font-medium">{r.students}</span>
            </div>
          </div>
        </div>
      {/each}
    </div>

    <!-- ========================================================= -->
    <!-- MODERN FAQ SECTION                                        -->
    <!-- ========================================================= -->
    <div class="mt-28 max-w-4xl mx-auto">
      <!-- FAQ Section Header -->
      <div class="text-center mb-10">
        <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-950/60 border border-violet-500/30 text-violet-300 text-xs font-semibold mb-3">
          <HelpCircle class="w-3.5 h-3.5 text-violet-400" />
          <span>সহজ সমাধান ও সহায়তা</span>
        </div>
        <h3 class="text-3xl sm:text-4xl font-extrabold text-white font-['Outfit']">Frequently Asked Questions</h3>
        <p class="text-xs sm:text-sm text-slate-400 mt-2 max-w-xl mx-auto">
          Everything you need to know about our Dual-Engine SMS gateway, student enrollment, billing vouchers, and multi-tenant security.
        </p>
      </div>

      <!-- FAQ Search Bar -->
      <div class="relative mb-6">
        <Search class="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          bind:value={faqSearchQuery}
          placeholder="প্রশ্ন বা টপিক খুঁজুন (যেমন: SMS খরচ, আইডি কার্ড, ব্যাকআপ...)"
          class="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/70 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-inner"
        />
        {#if faqSearchQuery}
          <button
            type="button"
            class="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800"
            on:click={() => (faqSearchQuery = '')}
          >
            Clear
          </button>
        {/if}
      </div>

      <!-- Category Filter Pills -->
      <div class="flex items-center gap-2 overflow-x-auto pb-3 mb-6 no-scrollbar">
        {#each categories as cat}
          {@const isActive = selectedCategory === cat.id}
          <button
            type="button"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 border
            {isActive
              ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-transparent shadow-md shadow-indigo-600/30'
              : 'bg-slate-900/70 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'}"
            on:click={() => (selectedCategory = cat.id)}
          >
            <svelte:component this={cat.icon} class="w-3.5 h-3.5" />
            <span>{cat.label}</span>
          </button>
        {/each}
      </div>

      <!-- Accordion List -->
      <div class="space-y-3.5">
        {#if visibleFaqs.length === 0}
          <div class="p-8 text-center rounded-2xl bg-slate-900/50 border border-slate-800 text-slate-400 text-sm">
            <HelpCircle class="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p>কোনো প্রশ্ন পাওয়া যায়নি। অন্য কি-ওয়ার্ড দিয়ে অনুসন্ধান করুন।</p>
          </div>
        {:else}
          {#each visibleFaqs as faq (faq.id)}
            {@const isOpen = openFaqId === faq.id}
            {@const catInfo = categoryLabels[faq.category] || categoryLabels['general']}
            <div
              class="rounded-2xl transition-all duration-300 border overflow-hidden
              {isOpen
                ? 'bg-slate-900/90 border-indigo-500/40 shadow-lg shadow-indigo-500/5 ring-1 ring-indigo-500/20'
                : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700'}"
            >
              <button
                type="button"
                class="w-full p-5 text-left flex items-start justify-between gap-4 transition-colors group"
                on:click={() => toggleFaq(faq.id)}
              >
                <div class="space-y-1.5 pr-2">
                  <div class="flex items-center gap-2">
                    <span class="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border {catInfo.color}">
                      {catInfo.label}
                    </span>
                  </div>
                  <h4 class="font-bold text-base sm:text-lg text-white group-hover:text-indigo-300 transition-colors">
                    {faq.question}
                  </h4>
                </div>

                <div
                  class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-300
                  {isOpen
                    ? 'bg-indigo-600 text-white border-indigo-500 rotate-180 shadow-md shadow-indigo-600/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700 group-hover:text-white'}"
                >
                  <ChevronDown class="w-4 h-4" />
                </div>
              </button>

              {#if isOpen}
                <div class="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/80 animate-in fade-in slide-in-from-top-1 duration-200">
                  <p class="whitespace-pre-line">{faq.answer}</p>
                </div>
              {/if}
            </div>
          {/each}
        {/if}
      </div>

      <!-- Bottom Support CTA Card -->
      <div class="mt-12 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
        <div class="flex items-center gap-4 text-center sm:text-left">
          <div class="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <MessageCircle class="w-6 h-6" />
          </div>
          <div>
            <h4 class="font-bold text-white text-base">আপনার কি আরো কোনো প্রশ্ন আছে?</h4>
            <p class="text-xs text-slate-400 mt-0.5">আমাদের সাপোর্ট টিম ২৪/৭ লাইভ আছে। যেকোনো জিজ্ঞাসায় কল বা মেসেজ দিন।</p>
          </div>
        </div>

        <div class="flex items-center gap-3 shrink-0">
          <a
            href="tel:+8801700000000"
            class="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
          >
            হটলাইন কল
          </a>
          <button
            type="button"
            class="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition-all hover:scale-[1.02]"
            on:click={() => navigate('/register')}
          >
            <span>ফ্রি ট্রায়াল শুরু করুন</span>
            <ArrowRight class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  </div>
</section>
