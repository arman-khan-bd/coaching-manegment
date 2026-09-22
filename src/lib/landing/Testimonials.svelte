<script lang="ts">
  import { Star, Quote, CheckCircle2 } from 'lucide-svelte';

  const reviews = [
    {
      name: 'ইঞ্জি. তারিক হাসান (বুয়েট CSE)',
      role: 'পরিচালক, কোয়ান্টাম ফিজিক্স একাডেমি (ফার্মগেট)',
      students: '৬৫০+ শিক্ষার্থী',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      comment: 'অ্যান্ড্রয়েড এসএমএস গেটওয়ে ইন্টিগ্রেশনের কারণে আমাদের প্রতি মাসে ১৫,০০০ টাকারও বেশি এসএমএস খরচ বাঁচছে! সকালের ব্যাচ শুরু হলেই অনুপস্থিত ছাত্রদের অভিভাবকেরা সাথে সাথে বাংলা এসএমএস পান।',
    },
    {
      name: 'ডাঃ ফারহানা ইসলাম',
      role: 'প্রতিষ্ঠাতা, মেডিএইড এক্সক্লুসিভ (ধানমন্ডি)',
      students: '৪২০+ শিক্ষার্থী',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      comment: 'ইউনিট ও ব্যাচভিত্তিক আসন ব্যবস্থাপনা এবং ১-ক্লিকে ৪ ধরনের প্রফেশনাল স্টুডেন্ট আইডি কার্ড প্রিন্টিং আমাদের ভর্তি প্রক্রিয়াকে সম্পূর্ণ ডিজিটাল করে দিয়েছে।',
    },
    {
      name: 'প্রভাষক আনিসুর রহমান',
      role: 'প্রধান শিক্ষক, প্রাইম ম্যাথ কেয়ার (উত্তরা ও মিরপুর শাখা)',
      students: '১,২০০+ শিক্ষার্থী',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      comment: 'বিকাশ, নগদ ও ক্যাশ পেমেন্ট রিকনসিলিয়েশন এবং তাৎক্ষণিক মানি রিসিট ভাউচার প্রিন্টিং ফি আদায় সহজ করেছে। বাংলাদেশের যেকোনো কোচিংয়ের জন্য এটি সেরা সফটওয়্যার।',
    },
  ];

  const faqs = [
    {
      q: 'অ্যান্ড্রয়েড এসএমএস গেটওয়ে কীভাবে খরচ বাঁচায়?',
      a: 'অন্যান্য এসএমএস প্রোভাইডারেরা প্রতি মেসেজে ৩৫ থেকে ৫০ পয়সা নেয়। কোচফ্লোর অ্যান্ড্রয়েড গেটওয়ের মাধ্যমে আপনার নিজস্ব ফোন (গ্রামীণফোন/রবি/বাংলালিংক আনলিমিটেড এসএমএস প্যাক) দিয়ে সরাসরি ৳০.০০ অতিরিক্ত চার্জে অভিভাবকের কাছে মেসেজ চলে যায়!',
    },
    {
      q: 'Can I also use Cloud SMS if I do not have a spare Android phone?',
      a: 'Yes! CoachFlow is a Dual-Engine system. You can switch between your Android Gateway or buy instant Cloud SMS packs anytime with 1 click in your SMS settings.',
    },
    {
      q: 'Can I print Student ID Cards and Fee Receipts?',
      a: 'Absolutely. Every student profile includes a printable high-resolution ID card with institute logo and barcode/QR. All fee invoices also generate instant printable payment vouchers.',
    },
    {
      q: 'Is multi-branch management supported?',
      a: 'Yes, our Pro and Enterprise plans allow coaching centers to manage multiple physical centers, assign teachers across branches, and view centralized financials.',
    },
  ];

  let openFaq: number | null = 0;
</script>

<section id="faq" class="py-24 bg-slate-950/40 relative">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <!-- Testimonials -->
    <div class="text-center max-w-3xl mx-auto">
      <h2 class="text-3xl sm:text-4xl font-extrabold text-white font-['Outfit']">
        Trusted by 1,800+ Coaching Institutes & Academies
      </h2>
      <p class="mt-3 text-slate-400 text-sm sm:text-base">
        Here is how academy directors and faculty save 15+ hours weekly with CoachFlow.
      </p>
    </div>

    <div class="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
      {#each reviews as r}
        <div class="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-colors">
          <div>
            <div class="flex items-center gap-1 text-amber-400 mb-4">
              {#each Array(5) as _}
                <Star class="w-4 h-4 fill-amber-400" />
              {/each}
            </div>
            <p class="text-xs sm:text-sm text-slate-300 leading-relaxed italic">
              "{r.comment}"
            </p>
          </div>

          <div class="mt-6 pt-4 border-t border-slate-800/80 flex items-center gap-3">
            <img src={r.avatar} alt={r.name} class="w-10 h-10 rounded-full object-cover border border-slate-700" />
            <div>
              <h4 class="text-sm font-bold text-white">{r.name}</h4>
              <p class="text-xs text-indigo-400">{r.role}</p>
              <span class="text-[10px] text-slate-400">{r.students}</span>
            </div>
          </div>
        </div>
      {/each}
    </div>

    <!-- FAQ Accordion -->
    <div class="mt-24 max-w-3xl mx-auto">
      <div class="text-center mb-10">
        <h3 class="text-2xl sm:text-3xl font-bold text-white font-['Outfit']">Frequently Asked Questions</h3>
        <p class="text-xs sm:text-sm text-slate-400 mt-2">Everything you need to know about the platform and SMS gateways.</p>
      </div>

      <div class="space-y-3">
        {#each faqs as faq, i}
          <div class="rounded-xl bg-slate-900/70 border border-slate-800 overflow-hidden transition-colors">
            <button
              type="button"
              class="w-full p-4.5 text-left font-semibold text-white flex items-center justify-between gap-4 hover:text-indigo-400 transition-colors text-sm sm:text-base"
              on:click={() => (openFaq = openFaq === i ? null : i)}
            >
              <span>{faq.q}</span>
              <span class="text-xl text-slate-400 font-mono shrink-0">{openFaq === i ? '−' : '+'}</span>
            </button>
            {#if openFaq === i}
              <div class="px-4.5 pb-4.5 pt-1 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/60 animate-in fade-in duration-200">
                {faq.a}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  </div>
</section>
