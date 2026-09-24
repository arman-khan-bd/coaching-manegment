<script lang="ts">
  import {
    books,
    courses,
    instituteSettings,
    addBook,
    updateBook,
    deleteBook,
    showToast,
  } from '../store';
  import type { BookItem } from '../types';
  import Badge from '../components/Badge.svelte';
  import Modal from '../components/Modal.svelte';
  import ConfirmModal from '../components/ConfirmModal.svelte';
  import { printElement } from '../printUtils';
  import {
    BookOpen,
    Plus,
    Printer,
    Search,
    Edit3,
    Trash2,
    CheckCircle2,
    BookmarkCheck,
    Layers,
    Filter,
    DollarSign,
    Sparkles,
    FileText,
    GraduationCap,
    Info,
    Building2,
    Calendar,
    Phone,
    Mail,
    MapPin,
    Eye,
  } from 'lucide-svelte';

  // Filters
  let searchQuery = '';
  let selectedClass = 'all';
  let selectedRequired = 'all';

  // Add / Edit Modal
  let isAddEditModalOpen = false;
  let editingId: string | null = null;
  let formTitle = '';
  let formSubject = '';
  let formAuthor = '';
  let formPublisher = '';
  let formCourseId = '';
  let formCourseName = '';
  let formClassLevel = 'HSC ১ম বর্ষ';
  let formEdition = '২০২৬ সংস্করণ';
  let formPrice: number = 350;
  let formIsRequired: 'mandatory' | 'optional' = 'mandatory';
  let formNotes = '';

  // Delete Confirm Modal
  let isDeleteConfirmOpen = false;
  let bookToDelete: BookItem | null = null;

  // Print Preview Modal
  let isPrintPreviewOpen = false;

  const classLevelOptions = [
    'HSC ১ম বর্ষ',
    'HSC ২য় বর্ষ',
    'এডমিশন ২০২৬',
    '১০ম শ্রেণি (SSC)',
    '৯ম শ্রেণি',
    '৮ম শ্রেণি',
    'সাধারণ / সকল শ্রেণি',
  ];

  // Derived filtered books
  $: filteredBooks = $books.filter((b) => {
    const q = searchQuery.toLowerCase().trim();
    const matchQuery =
      !q ||
      b.title.toLowerCase().includes(q) ||
      b.subject.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      (b.publisher && b.publisher.toLowerCase().includes(q)) ||
      b.classLevel.toLowerCase().includes(q);

    const matchClass = selectedClass === 'all' || b.classLevel === selectedClass;
    const matchReq = selectedRequired === 'all' || b.isRequired === selectedRequired;

    return matchQuery && matchClass && matchReq;
  });

  // Stats
  $: totalBooksCount = $books.length;
  $: mandatoryCount = $books.filter((b) => b.isRequired === 'mandatory').length;
  $: optionalCount = $books.filter((b) => b.isRequired === 'optional').length;
  $: totalEstimatedCost = filteredBooks.reduce((sum, b) => sum + (Number(b.price) || 0), 0);

  function openAddModal() {
    editingId = null;
    formTitle = '';
    formSubject = '';
    formAuthor = '';
    formPublisher = '';
    formCourseId = $courses[0]?.id || '';
    formCourseName = $courses[0]?.title || '';
    formClassLevel = 'HSC ১ম বর্ষ';
    formEdition = '২০২৬ সংস্করণ';
    formPrice = 400;
    formIsRequired = 'mandatory';
    formNotes = '';
    isAddEditModalOpen = true;
  }

  function openEditModal(b: BookItem) {
    editingId = b.id;
    formTitle = b.title;
    formSubject = b.subject;
    formAuthor = b.author;
    formPublisher = b.publisher || '';
    formCourseId = b.courseId || '';
    formCourseName = b.courseName;
    formClassLevel = b.classLevel;
    formEdition = b.edition;
    formPrice = b.price || 0;
    formIsRequired = b.isRequired;
    formNotes = b.notes || '';
    isAddEditModalOpen = true;
  }

  function handleSaveBook() {
    if (!formTitle.trim()) {
      showToast('error', 'বইয়ের নাম আবশ্যক', 'দয়া করে বইটির নাম লিখুন।');
      return;
    }
    if (!formSubject.trim()) {
      showToast('error', 'বিষয় আবশ্যক', 'দয়া করে বিষয়টি নির্বাচন বা লিখুন।');
      return;
    }

    const matchedCourse = $courses.find((c) => c.id === formCourseId);
    const courseName = matchedCourse ? matchedCourse.title : (formCourseName || formClassLevel);

    if (editingId) {
      updateBook(editingId, {
        title: formTitle.trim(),
        subject: formSubject.trim(),
        author: formAuthor.trim(),
        publisher: formPublisher.trim(),
        courseId: formCourseId,
        courseName,
        classLevel: formClassLevel,
        edition: formEdition.trim(),
        price: Number(formPrice) || 0,
        isRequired: formIsRequired,
        notes: formNotes.trim(),
      });
    } else {
      addBook({
        title: formTitle.trim(),
        subject: formSubject.trim(),
        author: formAuthor.trim(),
        publisher: formPublisher.trim(),
        courseId: formCourseId,
        courseName,
        classLevel: formClassLevel,
        edition: formEdition.trim(),
        price: Number(formPrice) || 0,
        isRequired: formIsRequired,
        notes: formNotes.trim(),
      });
    }
    isAddEditModalOpen = false;
  }

  function promptDelete(b: BookItem) {
    bookToDelete = b;
    isDeleteConfirmOpen = true;
  }

  function confirmDelete() {
    if (bookToDelete) {
      deleteBook(bookToDelete.id);
      bookToDelete = null;
    }
    isDeleteConfirmOpen = false;
  }

  function handlePrintBookList() {
    printElement('print-booklist-document', {
      title: `বুক-লিস্ট-২০২৬-${$instituteSettings.name || 'Coaching'}`,
      orientation: 'portrait',
      pageMargin: '12mm',
    });
  }
</script>

<div class="space-y-6 max-w-7xl mx-auto pb-12 font-['Hind_Siliguri',sans-serif]">
  <!-- Top Header Banner -->
  <div class="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/20 shadow-2xl p-6 sm:p-8">
    <div class="absolute -right-12 -top-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
    <div class="absolute -left-12 -bottom-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

    <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div class="space-y-2">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold">
          <BookOpen class="w-3.5 h-3.5" />
          <span>একাডেমিক পাঠ্যসামগ্রী ও রেফারেন্স সংকলন</span>
        </div>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          বুক লিস্ট ও পাঠ্যসামগ্রী
          <span class="px-3 py-0.5 rounded-full text-sm font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            {totalBooksCount} টি বই
          </span>
        </h1>
        <p class="text-sm text-slate-300 max-w-2xl leading-relaxed">
          সকল কোর্স ও ক্লাসের জন্য নির্ধারিত পাঠ্যবই, মডেল টেস্ট গাইড ও রেফারেন্স প্রশ্নব্যাংক পরিচালনা করুন এবং শিক্ষার্থীদের জন্য প্রিন্টযোগ্য অফিসিয়াল বুক লিস্ট ভাউচার প্রস্তুত করুন।
        </p>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-wrap items-center gap-3">
        <button
          on:click={() => (isPrintPreviewOpen = true)}
          class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm border border-slate-700 hover:border-slate-600 transition-all shadow-md active:scale-95"
        >
          <Printer class="w-4 h-4 text-indigo-400" />
          <span>বুক লিস্ট প্রিন্ট প্রিভিউ</span>
        </button>

        <button
          on:click={openAddModal}
          class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all active:scale-95"
        >
          <Plus class="w-4 h-4" />
          <span>নতুন বই যুক্ত করুন</span>
        </button>
      </div>
    </div>

    <!-- Quick Stats Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-slate-800/80">
      <div class="bg-slate-900/60 backdrop-blur-md rounded-xl p-3.5 sm:p-4 border border-slate-800 flex items-center gap-3.5">
        <div class="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 flex-shrink-0">
          <BookOpen class="w-5 h-5" />
        </div>
        <div>
          <div class="text-xs text-slate-400 font-medium">মোট পাঠ্যপুস্তক</div>
          <div class="text-xl font-bold text-white font-['Outfit']">{totalBooksCount} <span class="text-xs font-normal text-slate-400 font-sans">টি</span></div>
        </div>
      </div>

      <div class="bg-slate-900/60 backdrop-blur-md rounded-xl p-3.5 sm:p-4 border border-slate-800 flex items-center gap-3.5">
        <div class="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
          <CheckCircle2 class="w-5 h-5" />
        </div>
        <div>
          <div class="text-xs text-slate-400 font-medium">বাধ্যতামূলক বই</div>
          <div class="text-xl font-bold text-emerald-400 font-['Outfit']">{mandatoryCount} <span class="text-xs font-normal text-slate-400 font-sans">টি</span></div>
        </div>
      </div>

      <div class="bg-slate-900/60 backdrop-blur-md rounded-xl p-3.5 sm:p-4 border border-slate-800 flex items-center gap-3.5">
        <div class="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
          <BookmarkCheck class="w-5 h-5" />
        </div>
        <div>
          <div class="text-xs text-slate-400 font-medium">সহায়ক / ঐচ্ছিক</div>
          <div class="text-xl font-bold text-amber-400 font-['Outfit']">{optionalCount} <span class="text-xs font-normal text-slate-400 font-sans">টি</span></div>
        </div>
      </div>

      <div class="bg-slate-900/60 backdrop-blur-md rounded-xl p-3.5 sm:p-4 border border-slate-800 flex items-center gap-3.5">
        <div class="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 flex-shrink-0">
          <DollarSign class="w-5 h-5" />
        </div>
        <div>
          <div class="text-xs text-slate-400 font-medium">ফিল্টারকৃত মোট মূল্য</div>
          <div class="text-xl font-bold text-sky-400 font-['Outfit']">৳ {totalEstimatedCost.toLocaleString('bn-BD')}</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Filters & Search Toolbar -->
  <div class="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-4 shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
    <!-- Search Bar -->
    <div class="relative flex-1">
      <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      <input
        type="text"
        bind:value={searchQuery}
        placeholder="বইয়ের নাম, বিষয়, লেখক বা প্রকাশনী দিয়ে খুঁজুন..."
        class="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950/70 border border-slate-700/80 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
      />
    </div>

    <!-- Filters Group -->
    <div class="flex flex-wrap items-center gap-3">
      <!-- Class Level Filter -->
      <div class="flex items-center gap-1.5">
        <Filter class="w-3.5 h-3.5 text-slate-400" />
        <select
          bind:value={selectedClass}
          class="bg-slate-950/80 border border-slate-700/80 text-slate-200 text-xs sm:text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
        >
          <option value="all">সকল শ্রেণি / কোর্স</option>
          {#each classLevelOptions as opt}
            <option value={opt}>{opt}</option>
          {/each}
        </select>
      </div>

      <!-- Requirement Filter -->
      <select
        bind:value={selectedRequired}
        class="bg-slate-950/80 border border-slate-700/80 text-slate-200 text-xs sm:text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
      >
        <option value="all">সকল ধরন</option>
        <option value="mandatory">বাধ্যতামূলক (Mandatory)</option>
        <option value="optional">সহায়ক / রেফারেন্স (Optional)</option>
      </select>
    </div>
  </div>

  <!-- Book List Main Table Card -->
  <div class="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
    {#if filteredBooks.length === 0}
      <div class="py-16 text-center space-y-3">
        <div class="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
          <BookOpen class="w-8 h-8" />
        </div>
        <h3 class="text-base font-semibold text-white">কোনো বই পাওয়া যায়নি</h3>
        <p class="text-sm text-slate-400 max-w-md mx-auto">
          আপনার দেওয়া ফিল্টারে কোনো পাঠ্যবই মেলেনি। নতুন বই যুক্ত করতে উপরের বোতামে ক্লিক করুন।
        </p>
        <button
          on:click={openAddModal}
          class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all shadow-md"
        >
          <Plus class="w-4 h-4" />
          <span>বই যুক্ত করুন</span>
        </button>
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-slate-800 bg-slate-950/50 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <th class="py-3.5 px-4 w-12 text-center">নং</th>
              <th class="py-3.5 px-4 min-w-[200px]">বইয়ের বিবরণ ও সংস্করণ</th>
              <th class="py-3.5 px-4 min-w-[140px]">বিষয় ও শ্রেণি</th>
              <th class="py-3.5 px-4 min-w-[150px]">লেখক ও প্রকাশনী</th>
              <th class="py-3.5 px-4 text-center">ধরন</th>
              <th class="py-3.5 px-4 text-right">মূল্য (আনুমানিক)</th>
              <th class="py-3.5 px-4 text-right">অ্যাকশন</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60 text-sm">
            {#each filteredBooks as book, idx}
              <tr class="hover:bg-slate-800/40 transition-colors group">
                <!-- Serial -->
                <td class="py-3.5 px-4 text-center font-mono text-xs text-slate-400">
                  {idx + 1}
                </td>

                <!-- Title & Edition -->
                <td class="py-3.5 px-4">
                  <div class="flex items-start gap-3">
                    <div class="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <BookOpen class="w-4 h-4" />
                    </div>
                    <div>
                      <div class="font-semibold text-white group-hover:text-indigo-300 transition-colors">
                        {book.title}
                      </div>
                      <div class="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                        <span class="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">{book.edition || 'লেটেস্ট'}</span>
                        {#if book.notes}
                          <span class="text-slate-400 truncate max-w-xs" title={book.notes}>• {book.notes}</span>
                        {/if}
                      </div>
                    </div>
                  </div>
                </td>

                <!-- Subject & Class -->
                <td class="py-3.5 px-4">
                  <div class="font-medium text-slate-200">{book.subject}</div>
                  <div class="text-xs text-indigo-400/90 font-medium mt-0.5">{book.classLevel}</div>
                </td>

                <!-- Author & Publisher -->
                <td class="py-3.5 px-4">
                  <div class="text-slate-200">{book.author}</div>
                  {#if book.publisher}
                    <div class="text-xs text-slate-400">{book.publisher}</div>
                  {/if}
                </td>

                <!-- Required Badge -->
                <td class="py-3.5 px-4 text-center">
                  {#if book.isRequired === 'mandatory'}
                    <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      <CheckCircle2 class="w-3 h-3" />
                      <span>বাধ্যতামূলক</span>
                    </span>
                  {:else}
                    <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      <BookmarkCheck class="w-3 h-3" />
                      <span>সহায়ক / ঐচ্ছিক</span>
                    </span>
                  {/if}
                </td>

                <!-- Price -->
                <td class="py-3.5 px-4 text-right font-mono font-medium text-slate-200">
                  {book.price ? `৳ ${book.price}` : '—'}
                </td>

                <!-- Actions -->
                <td class="py-3.5 px-4 text-right">
                  <div class="flex items-center justify-end gap-1.5">
                    <button
                      on:click={() => openEditModal(book)}
                      class="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition-colors"
                      title="সম্পাদনা করুন"
                    >
                      <Edit3 class="w-4 h-4" />
                    </button>
                    <button
                      on:click={() => promptDelete(book)}
                      class="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="মুছে ফেলুন"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>

<!-- ========================================================================= -->
<!-- ADD / EDIT BOOK MODAL -->
<!-- ========================================================================= -->
<Modal
  isOpen={isAddEditModalOpen}
  onClose={() => (isAddEditModalOpen = false)}
  title={editingId ? 'বইয়ের তথ্য সম্পাদনা' : 'নতুন বই যুক্ত করুন'}
  maxWidth="max-w-2xl"
>
  <form on:submit|preventDefault={handleSaveBook} class="space-y-4 font-['Hind_Siliguri',sans-serif]">
    <!-- Book Title -->
    <div>
      <label for="book-input-title" class="block text-xs font-semibold text-slate-300 mb-1.5">
        বইয়ের নাম <span class="text-rose-400">*</span>
      </label>
      <input
        id="book-input-title"
        type="text"
        bind:value={formTitle}
        placeholder="যেমন: উচ্চতর গণিত ১ম পত্র (একাদশ-দ্বাদশ)"
        class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        required
      />
    </div>

    <!-- Subject & Class Level -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label for="book-input-subject" class="block text-xs font-semibold text-slate-300 mb-1.5">
          বিষয় <span class="text-rose-400">*</span>
        </label>
        <input
          id="book-input-subject"
          type="text"
          bind:value={formSubject}
          placeholder="যেমন: উচ্চতর গণিত, পদার্থবিজ্ঞান, রসায়ন"
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          required
        />
      </div>

      <div>
        <label for="book-select-class" class="block text-xs font-semibold text-slate-300 mb-1.5">
          শ্রেণি / পর্যায় <span class="text-rose-400">*</span>
        </label>
        <select
          id="book-select-class"
          bind:value={formClassLevel}
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
        >
          {#each classLevelOptions as opt}
            <option value={opt}>{opt}</option>
          {/each}
        </select>
      </div>
    </div>

    <!-- Author & Publisher -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label for="book-input-author" class="block text-xs font-semibold text-slate-300 mb-1.5">
          লেখক / সংকলক <span class="text-rose-400">*</span>
        </label>
        <input
          id="book-input-author"
          type="text"
          bind:value={formAuthor}
          placeholder="যেমন: প্রফেসর অসীম কুমার সাহা"
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
          required
        />
      </div>

      <div>
        <label for="book-input-publisher" class="block text-xs font-semibold text-slate-300 mb-1.5">
          প্রকাশনী / সংস্থা
        </label>
        <input
          id="book-input-publisher"
          type="text"
          bind:value={formPublisher}
          placeholder="যেমন: অক্ষরপত্র প্রকাশনী / জয়কলি"
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
        />
      </div>
    </div>

    <!-- Edition & Price -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div>
        <label for="book-input-edition" class="block text-xs font-semibold text-slate-300 mb-1.5">
          সংস্করণ (Edition)
        </label>
        <input
          id="book-input-edition"
          type="text"
          bind:value={formEdition}
          placeholder="২০২৫-২৬ সংস্করণ"
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
        />
      </div>

      <div>
        <label for="book-input-price" class="block text-xs font-semibold text-slate-300 mb-1.5">
          আনুমানিক মূল্য (টাকা)
        </label>
        <input
          id="book-input-price"
          type="number"
          min="0"
          bind:value={formPrice}
          placeholder="450"
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm font-mono focus:outline-none focus:border-indigo-500"
        />
      </div>

      <div>
        <label for="book-select-req" class="block text-xs font-semibold text-slate-300 mb-1.5">
          ধরন (Requirement)
        </label>
        <select
          id="book-select-req"
          bind:value={formIsRequired}
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
        >
          <option value="mandatory">বাধ্যতামূলক (Mandatory)</option>
          <option value="optional">সহায়ক / ঐচ্ছিক (Optional)</option>
        </select>
      </div>
    </div>

    <!-- Notes & Instructions -->
    <div>
      <label for="book-input-notes" class="block text-xs font-semibold text-slate-300 mb-1.5">
        শিক্ষার্থীদের জন্য বিশেষ নির্দেশনা / নোট
      </label>
      <textarea
        id="book-input-notes"
        bind:value={formNotes}
        rows="2"
        placeholder="যেমন: ক্লাসে বইটি সাথে আনা বাধ্যতামূলক। ১ম সাময়িক পরীক্ষায় ১-৫ অধ্যায় অন্তর্ভুক্ত থাকবে।"
        class="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none"
      ></textarea>
    </div>

    <!-- Footer Buttons -->
    <div class="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
      <button
        type="button"
        on:click={() => (isAddEditModalOpen = false)}
        class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors"
      >
        বাতিল
      </button>
      <button
        type="submit"
        class="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all shadow-md"
      >
        {editingId ? 'আপডেট সংরক্ষণ করুন' : 'বই সংরক্ষণ করুন'}
      </button>
    </div>
  </form>
</Modal>

<!-- ========================================================================= -->
<!-- DELETE CONFIRMATION MODAL -->
<!-- ========================================================================= -->
<ConfirmModal
  isOpen={isDeleteConfirmOpen}
  title="বইটি মুছে ফেলার নিশ্চিতকরণ"
  message={`আপনি কি নিশ্চিতভাবে '${bookToDelete?.title || ''}' বইটি তালিকা থেকে মুছে ফেলতে চান? এটি মুছে ফেলা হলে তালিকা থেকে বাদ পড়বে।`}
  confirmText="হ্যাঁ, মুছে ফেলুন"
  cancelText="না, রাখুন"
  type="danger"
  onConfirm={confirmDelete}
  onCancel={() => (isDeleteConfirmOpen = false)}
/>

<!-- ========================================================================= -->
<!-- OFFICIAL A4 BOOK LIST PRINT PREVIEW MODAL -->
<!-- ========================================================================= -->
<Modal
  isOpen={isPrintPreviewOpen}
  onClose={() => (isPrintPreviewOpen = false)}
  title="বুক লিস্ট অফিসিয়াল প্রিন্ট প্রিভিউ"
  maxWidth="max-w-4xl"
>
  <div class="space-y-4 font-['Hind_Siliguri',sans-serif]">
    <!-- Modal Control Toolbar -->
    <div class="flex items-center justify-between pb-3 border-b border-slate-800 no-print">
      <div class="text-xs text-slate-300">
        প্রিন্ট বাটনে ক্লিক করলে ব্রাউজারের প্রিন্ট ডায়ালগ এবং নিখুঁত A4 সাদা পেপার লেআউটে ডকুমেন্ট তৈরি হবে।
      </div>
      <button
        on:click={handlePrintBookList}
        class="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
      >
        <Printer class="w-4 h-4" />
        <span>সরাসরি প্রিন্ট করুন / PDF ডাউনলোড</span>
      </button>
    </div>

    <!-- Printable Paper Area (Live A4 Preview) -->
    <div class="bg-slate-950 p-2 sm:p-4 rounded-xl border border-slate-800 max-h-[72vh] overflow-y-auto">
      <div
        id="print-booklist-document"
        class="printable-area bg-white text-slate-900 p-8 sm:p-10 rounded-lg shadow-2xl mx-auto max-w-[800px] border border-slate-200"
        style="font-family: 'Hind Siliguri', 'Noto Sans Bengali', sans-serif;"
      >
        <!-- Document Header / Institute Branding -->
        <div class="flex items-start justify-between pb-4 border-b-2 border-slate-900 gap-4">
          <div class="flex items-center gap-4">
            {#if $instituteSettings.logo}
              <img
                src={$instituteSettings.logo}
                alt="Logo"
                class="w-16 h-16 object-contain rounded-lg border border-slate-200"
              />
            {:else}
              <div class="w-14 h-14 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xl">
                CF
              </div>
            {/if}
            <div>
              <h1 class="text-2xl font-black text-slate-900 leading-tight">
                {$instituteSettings.name || 'অ্যাপেক্স একাডেমিক কেয়ার'}
              </h1>
              {#if $instituteSettings.nameEnglish}
                <div class="text-xs font-semibold text-slate-600 tracking-wider uppercase font-['Outfit']">
                  {$instituteSettings.nameEnglish}
                </div>
              {/if}
              <div class="text-xs text-slate-600 mt-0.5">
                {$instituteSettings.tagline || 'মানসম্মত শিক্ষা ও সেরা প্রস্তুতির নির্ভরযোগ্য প্রতিষ্ঠান'}
              </div>
            </div>
          </div>

          <div class="text-right text-xs text-slate-600 space-y-0.5">
            {#if $instituteSettings.establishedYear}
              <div>স্থাপিত: {$instituteSettings.establishedYear}</div>
            {/if}
            {#if $instituteSettings.branchName}
              <div class="font-semibold text-slate-800">শাখা: {$instituteSettings.branchName}</div>
            {/if}
            <div>হটলাইন: {$instituteSettings.phone || '01700-000000'}</div>
            <div>{$instituteSettings.address || 'ঢাকা, বাংলাদেশ'}</div>
          </div>
        </div>

        <!-- Document Title Banner -->
        <div class="my-5 text-center">
          <div class="inline-block px-6 py-1.5 rounded-full bg-slate-900 text-white text-sm font-bold tracking-wide">
            অনুমোদিত পাঠ্যপুস্তক ও সহায়ক পুস্তক তালিকা — ২০২৬
          </div>
          <div class="text-xs text-slate-500 mt-1">
            OFFICIAL ACADEMIC BOOK LIST & REFERENCE MATERIALS
          </div>
        </div>

        <!-- Meta Summary Strip -->
        <div class="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <span class="text-slate-500">শ্রেণি / কোর্স ফিল্টার:</span>
            <span class="font-bold text-slate-800 ml-1">{selectedClass === 'all' ? 'সকল শ্রেণি ও কোর্স' : selectedClass}</span>
          </div>
          <div>
            <span class="text-slate-500">মোট বই:</span>
            <span class="font-bold text-slate-800 ml-1">{filteredBooks.length} টি</span>
            <span class="text-slate-400 mx-1">|</span>
            <span class="text-emerald-700 font-semibold">বাধ্যতামূলক: {filteredBooks.filter(b => b.isRequired === 'mandatory').length} টি</span>
          </div>
          <div>
            <span class="text-slate-500">তারিখ:</span>
            <span class="font-medium text-slate-800 ml-1">{new Date().toLocaleDateString('bn-BD')}</span>
          </div>
        </div>

        <!-- Main Books Table -->
        <table class="w-full text-left border-collapse text-xs mb-5">
          <thead>
            <tr class="bg-slate-100 text-slate-800 border-y-2 border-slate-900 font-bold">
              <th class="py-2 px-2 text-center w-8">ক্র.</th>
              <th class="py-2 px-2">বইয়ের নাম ও বিবরণ</th>
              <th class="py-2 px-2">বিষয় ও শ্রেণি</th>
              <th class="py-2 px-2">লেখক ও প্রকাশনী</th>
              <th class="py-2 px-2 text-center">ধরন</th>
              <th class="py-2 px-2 text-right">মূল্য (আনুমানিক)</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-300">
            {#each filteredBooks as book, idx}
              <tr class={idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}>
                <td class="py-2 px-2 text-center font-mono text-slate-600 font-medium">
                  {idx + 1}
                </td>
                <td class="py-2 px-2">
                  <div class="font-bold text-slate-900">{book.title}</div>
                  <div class="text-[11px] text-slate-600">
                    সংস্করণ: {book.edition || 'লেটেস্ট'}
                    {#if book.notes}
                      <span class="text-indigo-900"> • {book.notes}</span>
                    {/if}
                  </div>
                </td>
                <td class="py-2 px-2">
                  <div class="font-medium text-slate-800">{book.subject}</div>
                  <div class="text-[11px] text-slate-500">{book.classLevel}</div>
                </td>
                <td class="py-2 px-2">
                  <div class="text-slate-800">{book.author}</div>
                  {#if book.publisher}
                    <div class="text-[11px] text-slate-500">{book.publisher}</div>
                  {/if}
                </td>
                <td class="py-2 px-2 text-center">
                  {#if book.isRequired === 'mandatory'}
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      বাধ্যতামূলক
                    </span>
                  {:else}
                    <span class="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-800 border border-amber-300">
                      ঐচ্ছিক
                    </span>
                  {/if}
                </td>
                <td class="py-2 px-2 text-right font-mono font-bold text-slate-800">
                  {book.price ? `৳ ${book.price}` : '—'}
                </td>
              </tr>
            {/each}
          </tbody>
          <tfoot>
            <tr class="border-t-2 border-slate-900 bg-slate-100 font-bold">
              <td colspan="5" class="py-2 px-3 text-right">
                সর্বমোট আনুমানিক পুস্তক মূল্য:
              </td>
              <td class="py-2 px-2 text-right font-mono text-sm text-slate-950 font-black">
                ৳ {totalEstimatedCost.toLocaleString('bn-BD')}
              </td>
            </tr>
          </tfoot>
        </table>

        <!-- Notice & Instructions Box -->
        <div class="border border-slate-300 rounded-lg p-3 bg-slate-50 text-[11px] text-slate-700 leading-relaxed mb-8">
          <div class="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
            <Info class="w-3.5 h-3.5 text-indigo-700" />
            <span>শিক্ষার্থী ও অভিভাবকদের জন্য প্রয়োজনীয় নির্দেশনা:</span>
          </div>
          <ol class="list-decimal pl-5 space-y-0.5">
            <li>ক্লাসে প্রতিটি বিষয়ের নির্ধারিত মূল পাঠ্যবই এবং কোচিং লেকচার শিট সাথে আনা বাধ্যতামূলক।</li>
            <li>সর্বশেষ বোর্ড অনুমোদিত বা সংশোধিত সংস্করণের বই সংগ্রহ করার জন্য অনুরোধ করা যাচ্ছে।</li>
            <li>যেকোনো সহায়ক প্রশ্নব্যাংক বা নোটস কোচিং লাইব্রেরি বা অফিস কাউন্টার থেকেও সংগ্রহ করা যাবে।</li>
          </ol>
        </div>

        <!-- Official Signatures Strip -->
        <div class="pt-8 border-t border-slate-300 grid grid-cols-3 gap-6 text-center text-xs text-slate-700">
          <div>
            <div class="border-b border-slate-400 pb-1 mb-1 font-semibold text-slate-900">
              একাডেমিক সমন্বয়কারী
            </div>
            <div class="text-[10px] text-slate-500">কোচফ্লো একাডেমি</div>
          </div>
          <div>
            <div class="border-b border-slate-400 pb-1 mb-1 font-semibold text-slate-900">
              বিভাগীয় প্রধান
            </div>
            <div class="text-[10px] text-slate-500">পাঠ্যক্রম ও মূল্যায়ন শাখা</div>
          </div>
          <div>
            <div class="border-b border-slate-400 pb-1 mb-1 font-semibold text-slate-900">
              অধ্যক্ষ / পরিচালক
            </div>
            <div class="text-[10px] text-slate-500">{$instituteSettings.name || 'Apex Academic Care'}</div>
          </div>
        </div>

        <!-- Print Footer Stamp -->
        <div class="mt-6 pt-3 border-t border-slate-200 text-center text-[10px] text-slate-400 font-mono">
          System Generated Book List Voucher • CoachFlow Academic Management Engine • Printed on {new Date().toLocaleString('bn-BD')}
        </div>
      </div>
    </div>
  </div>
</Modal>
