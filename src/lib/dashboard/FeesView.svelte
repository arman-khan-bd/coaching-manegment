<script lang="ts">
  import {
    feeInvoices,
    students,
    batches,
    courses,
    collectPayment,
    addInvoice,
    updateInvoice,
    deleteInvoice,
    sendSms,
    instituteSettings,
    showToast,
    type FeeInvoice,
  } from '../store';
  import SendSmsModal from '../components/SendSmsModal.svelte';
  import Modal from '../components/Modal.svelte';
  import Badge from '../components/Badge.svelte';
  import ConfirmModal from '../components/ConfirmModal.svelte';
  import { printElement } from '../printUtils';
  import {
    CreditCard,
    DollarSign,
    CheckCircle2,
    Clock,
    AlertCircle,
    Printer,
    Send,
    Plus,
    Filter,
    MessageSquare,
    Receipt,
    Pencil,
    Trash2,
  } from 'lucide-svelte';

  let statusFilter: 'all' | 'paid' | 'partial' | 'unpaid' = 'all';

  // Invoice Add/Edit States
  let isAddInvoiceModalOpen = false;
  let isEditInvoiceModalOpen = false;
  let editInvoice: FeeInvoice | null = null;

  let newStudentId = '';
  let newStudentName = '';
  let newBatchId = '';
  let newBatchName = '';
  let newCourseName = '';
  let newAmount = 3000;
  let newDueDate = new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];

  function openAddInvoice() {
    newStudentId = $students[0]?.id || '';
    newStudentName = $students[0]?.name || '';
    newBatchId = $batches[0]?.id || '';
    newBatchName = $batches[0]?.name || '';
    newCourseName = $courses[0]?.title || 'অ্যাকাডেমিক কোর্স';
    newAmount = 3000;
    newDueDate = new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];
    isAddInvoiceModalOpen = true;
  }

  function handleCreateInvoice() {
    if (!newStudentName || newAmount <= 0) {
      showToast('error', 'ভুল তথ্য', 'শিক্ষার্থীর নাম ও ফি এর পরিমাণ আবশ্যক।');
      return;
    }
    const invNo = `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    addInvoice({
      invoiceNo: invNo,
      studentId: newStudentId,
      studentName: newStudentName,
      batchId: newBatchId,
      batchName: newBatchName,
      courseName: newCourseName,
      amount: newAmount,
      paidAmount: 0,
      dueAmount: newAmount,
      status: 'unpaid',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: newDueDate,
      paymentMethod: 'bKash',
    });
    isAddInvoiceModalOpen = false;
  }

  function openEditInvoice(inv: FeeInvoice) {
    editInvoice = inv;
    newStudentName = inv.studentName;
    newBatchName = inv.batchName;
    newCourseName = inv.courseName;
    newAmount = inv.amount;
    newDueDate = inv.dueDate;
    isEditInvoiceModalOpen = true;
  }

  function handleUpdateInvoice() {
    if (!editInvoice || newAmount <= 0) return;
    const paid = editInvoice.paidAmount;
    const due = Math.max(0, newAmount - paid);
    const status = due === 0 ? 'paid' : paid > 0 ? 'partial' : 'unpaid';
    updateInvoice(editInvoice.id, {
      studentName: newStudentName,
      batchName: newBatchName,
      courseName: newCourseName,
      amount: newAmount,
      dueAmount: due,
      status,
      dueDate: newDueDate,
    });
    isEditInvoiceModalOpen = false;
    editInvoice = null;
  }

  // Delete invoice with confirm modal
  let isConfirmDeleteInvoiceOpen = false;
  let invoiceToDelete: FeeInvoice | null = null;

  function promptDeleteInvoice(inv: FeeInvoice) {
    invoiceToDelete = inv;
    isConfirmDeleteInvoiceOpen = true;
  }

  function handleConfirmDeleteInvoice() {
    if (invoiceToDelete) {
      deleteInvoice(invoiceToDelete.id);
      isConfirmDeleteInvoiceOpen = false;
      invoiceToDelete = null;
    }
  }

  // Payment Collection Modal State
  let isPayModalOpen = false;
  let selectedInvoice: FeeInvoice | null = null;
  let payAmount = 0;
  let payMethod: FeeInvoice['paymentMethod'] = 'Cash';

  // SMS Modal State
  let isSmsModalOpen = false;
  let smsRecipientName = '';
  let smsRecipientPhone = '';
  let smsRecipientRole: 'guardian' = 'guardian';
  let smsDefaultMessage = '';
  let smsTemplates: { label: string; text: string }[] = [];

  // Receipt Modal State
  let isReceiptModalOpen = false;
  let receiptInvoice: FeeInvoice | null = null;

  $: totalBilled = $feeInvoices.reduce((sum, i) => sum + i.amount, 0);
  $: totalCollected = $feeInvoices.reduce((sum, i) => sum + i.paidAmount, 0);
  $: totalDue = $feeInvoices.reduce((sum, i) => sum + i.dueAmount, 0);

  $: filteredInvoices = $feeInvoices.filter((inv) => {
    if (statusFilter === 'all') return true;
    return inv.status === statusFilter;
  });

  function openCollectModal(invoice: FeeInvoice) {
    selectedInvoice = invoice;
    payAmount = invoice.dueAmount;
    isPayModalOpen = true;
  }

  function handleRecordPayment() {
    if (!selectedInvoice || payAmount <= 0) {
      showToast('error', 'Invalid Amount', 'Please enter a valid payment amount.');
      return;
    }

    collectPayment(selectedInvoice.id, payAmount, payMethod);
    isPayModalOpen = false;
  }

  function openReceiptModal(invoice: FeeInvoice) {
    receiptInvoice = invoice;
    isReceiptModalOpen = true;
  }

  function printReceipt() {
    printElement('print-receipt-voucher', {
      title: `মানি-রসিদ-${receiptInvoice?.invoiceNo || 'voucher'}`,
      orientation: 'portrait',
    });
  }

  function handleOpenFeeSms(invoice: FeeInvoice) {
    const student = $students.find((s) => s.id === invoice.studentId || s.name === invoice.studentName);
    smsRecipientName = student?.guardianName || invoice.studentName + '-এর অভিভাবক';
    smsRecipientPhone = student?.guardianPhone || '+880 1711-456789';
    smsRecipientRole = 'guardian';
    smsDefaultMessage = `সম্মানিত অভিভাবক, আপনার সন্তান ${invoice.studentName}-এর রসিদ #${invoice.invoiceNo}-এর অনুকূলে ৳${invoice.dueAmount.toLocaleString()} ফি বকেয়া রয়েছে। দ্রুত পরিশোধের অনুরোধ করা হচ্ছে।`;
    smsTemplates = [
      {
        label: 'বকেয়া ফি তাগাদা',
        text: `জরুরি নোটিশ: সম্মানিত অভিভাবক, ${invoice.studentName}-এর কোচিং ফি ৳${invoice.dueAmount.toLocaleString()} বকেয়া রয়েছে। আগামী ক্লাসের পূর্বে পরিশোধ নিশ্চিত করুন।`,
      },
      {
        label: 'বিকাশ / নগদ পেমেন্ট গাইড',
        text: `বিকাশ বা নগদে ফি পাঠাতে মার্চেন্ট নম্বরে: 01711456789 Make Payment করুন এবং রেফারেন্সে ইনভয়েস #${invoice.invoiceNo} ও শিক্ষার্থীর নাম লিখুন। - এপেক্স কেয়ার`,
      },
      {
        label: 'জরিমানা মওকুফের সুযোগ',
        text: `বিশেষ বিজ্ঞপ্তি: সম্মানিত অভিভাবক, চলতি সপ্তাহের মধ্যে ${invoice.studentName}-এর ৳${invoice.dueAmount.toLocaleString()} বকেয়া ফি পরিশোধ করলে কোনো বিলম্ব ফি প্রযোজ্য হবে না।`,
      },
    ];
    isSmsModalOpen = true;
  }

  function handleBroadcastDueReminders() {
    const dueInvoices = $feeInvoices.filter((i) => i.dueAmount > 0);
    if (dueInvoices.length === 0) {
      showToast('info', 'কোনো বকেয়া নেই', 'বর্তমানে কোনো শিক্ষার্থীর ফি বকেয়া নেই।');
      return;
    }
    smsRecipientName = `সকল বকেয়া অভিভাবক (${dueInvoices.length} জন)`;
    smsRecipientPhone = '+880 1711-xxxxxx (মাল্টিপল)';
    smsRecipientRole = 'guardian';
    smsDefaultMessage = `সম্মানিত অভিভাবক, আপনার সন্তানের অ্যাকাডেমিক কোচিং ফি বকেয়া রয়েছে। অনুগ্রহ করে দ্রুত পরিশোধের অনুরোধ করা হচ্ছে। বিকাশ: 01711456789।`;
    smsTemplates = [
      {
        label: 'সাধারণ বকেয়া নোটিশ',
        text: `সম্মানিত অভিভাবক, চলতি মাসের অ্যাকাডেমিক টিউশন ফি পরিশোধের শেষ সময় অতিক্রম হয়েছে। জরুরি ভিত্তিতে ফি পরিশোধ করে মানি রিসিট সংগ্রহ করুন।`,
      },
      {
        label: 'অনলাইন পেমেন্ট সুবিধা',
        text: `ঘরে বসেই ফি পরিশোধ করুন: বিকাশ/নগদ মার্চেন্ট নম্বর 01711456789-এ পেমেন্ট করে TrxID দিয়ে কাউন্টার থেকে ডিজিটাল রিসিট বুঝে নিন।`,
      },
    ];
    isSmsModalOpen = true;
  }
</script>

<div class="space-y-6">
  <!-- Header & Metrics -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      <h2 class="text-2xl font-bold text-white font-['Outfit']">Tuition Fees & Financial Invoicing</h2>
      <p class="text-xs text-slate-400 mt-1">Track payments, issue printable vouchers, and auto-dispatch receipt SMS.</p>
    </div>

    <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 self-stretch sm:self-auto">
      <button
        type="button"
        class="w-full sm:w-auto justify-center px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all flex items-center gap-2 shadow-md shadow-indigo-600/30"
        on:click={openAddInvoice}
      >
        <Plus class="w-4 h-4" />
        <span>নতুন ইনভয়েস তৈরি</span>
      </button>

      <button
        type="button"
        class="w-full sm:w-auto justify-center px-4 py-2.5 rounded-xl bg-rose-600/15 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 font-semibold text-xs transition-all flex items-center gap-2 shadow-sm"
        title="Broadcast fee due reminder to all overdue students"
        on:click={handleBroadcastDueReminders}
      >
        <MessageSquare class="w-4 h-4 text-rose-400" />
        <span>বকেয়া শিক্ষার্থীদের SMS তাগাদা</span>
      </button>
    </div>
  </div>

  <!-- KPI Row -->
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
    <div class="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
      <span class="text-xs font-semibold text-slate-400 uppercase tracking-wide">মোট ধার্যকৃত ফি (Total Billed)</span>
      <div class="text-xl sm:text-2xl font-bold text-white mt-1 font-['Outfit']">৳{totalBilled.toLocaleString()}</div>
      <p class="text-[11px] text-slate-400 mt-1">সকল চলমান অ্যাকাডেমিক ব্যাচের মোট ফি</p>
    </div>

    <div class="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-emerald-500/30 bg-emerald-950/10">
      <span class="text-xs font-semibold text-emerald-400 uppercase tracking-wide">আদায়কৃত রাজস্ব (Collected)</span>
      <div class="text-xl sm:text-2xl font-bold text-emerald-400 mt-1 font-['Outfit']">৳{totalCollected.toLocaleString()}</div>
      <p class="text-[11px] text-slate-400 mt-1">বিকাশ/নগদ ও ক্যাশে গৃহীত</p>
    </div>

    <div class="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-rose-500/30 bg-rose-950/10">
      <span class="text-xs font-semibold text-rose-400 uppercase tracking-wide">বকেয়া পাওনা (Pending Due)</span>
      <div class="text-xl sm:text-2xl font-bold text-rose-400 mt-1 font-['Outfit']">৳{totalDue.toLocaleString()}</div>
      <p class="text-[11px] text-slate-400 mt-1">শিক্ষার্থীদের নিকট অনাদায়ী ফি</p>
    </div>
  </div>

  <!-- Filter Bar -->
  <div class="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
    <div class="flex items-center gap-1.5 text-xs overflow-x-auto max-w-full pb-1 sm:pb-0">
      <span class="text-slate-400 font-semibold px-1 shrink-0">ফিল্টার:</span>
      <button
        type="button"
        class="px-3 py-1.5 rounded-xl font-medium transition-all shrink-0 {statusFilter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}"
        on:click={() => (statusFilter = 'all')}
      >
        সকল ইনভয়েস
      </button>
      <button
        type="button"
        class="px-3 py-1.5 rounded-xl font-medium transition-all shrink-0 {statusFilter === 'paid' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}"
        on:click={() => (statusFilter = 'paid')}
      >
        পরিশোধিত (Paid)
      </button>
      <button
        type="button"
        class="px-3 py-1.5 rounded-xl font-medium transition-all shrink-0 {statusFilter === 'partial' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}"
        on:click={() => (statusFilter = 'partial')}
      >
        আংশিক বকেয়া
      </button>
      <button
        type="button"
        class="px-3 py-1.5 rounded-xl font-medium transition-all shrink-0 {statusFilter === 'unpaid' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}"
        on:click={() => (statusFilter = 'unpaid')}
      >
        সম্পূর্ণ বকেয়া
      </button>
    </div>

    <span class="text-xs text-slate-400 font-medium shrink-0 self-end sm:self-auto">
      {filteredInvoices.length} টি ইনভয়েস
    </span>
  </div>

  <!-- Invoices Bordered List View (Responsive on Desktop & Mobile) -->
  <div class="space-y-3">
    {#if filteredInvoices.length === 0}
      <div class="text-center py-12 text-slate-400 text-xs bg-slate-900/60 rounded-2xl border border-slate-800">
        কোনো ইনভয়েস পাওয়া যায়নি
      </div>
    {:else}
      {#each filteredInvoices as inv}
        <div class="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 transition-all shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <!-- Left: Invoice # & Student info -->
          <div class="flex items-start gap-3.5">
            <div class="w-11 h-11 rounded-2xl {inv.status === 'paid' ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-400' : inv.status === 'partial' ? 'bg-amber-950/60 border-amber-500/30 text-amber-400' : 'bg-rose-950/60 border-rose-500/30 text-rose-400'} border flex items-center justify-center font-bold shrink-0 mt-0.5">
              <Receipt class="w-5 h-5" />
            </div>
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <span class="font-bold text-white text-sm sm:text-base">{inv.studentName}</span>
                <span class="px-2 py-0.5 rounded-md bg-slate-800 text-indigo-300 font-mono text-xs font-bold border border-slate-700">
                  {inv.invoiceNo}
                </span>
                {#if inv.status === 'paid'}
                  <Badge variant="success" size="sm">পরিশোধিত ({inv.paymentMethod || 'Cash'})</Badge>
                {:else if inv.status === 'partial'}
                  <Badge variant="warning" size="sm">আংশিক বকেয়া</Badge>
                {:else}
                  <Badge variant="danger" size="sm">বকেয়া</Badge>
                {/if}
              </div>

              <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 mt-1">
                <span class="text-slate-300">কোর্স/ব্যাচ: <strong class="text-white">{inv.batchName}</strong></span>
                <span class="text-slate-600">•</span>
                <span>পরিশোধের তারিখ: <strong class="text-slate-300 font-mono">{inv.dueDate}</strong></span>
              </div>
            </div>
          </div>

          <!-- Middle / Right: Financial Stats and Actions -->
          <div class="flex flex-wrap items-center justify-between lg:justify-end gap-3.5 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-800/80">
            <!-- 3 Stat Blocks -->
            <div class="grid grid-cols-3 gap-2 px-3 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800/90 text-center shrink-0">
              <div class="px-2">
                <div class="text-[10px] text-slate-400">মোট ফি</div>
                <div class="text-xs font-bold text-white font-mono mt-0.5">৳{inv.amount.toLocaleString()}</div>
              </div>
              <div class="px-2 border-x border-slate-800/80">
                <div class="text-[10px] text-slate-400">জমা</div>
                <div class="text-xs font-bold text-emerald-400 font-mono mt-0.5">৳{inv.paidAmount.toLocaleString()}</div>
              </div>
              <div class="px-2">
                <div class="text-[10px] text-slate-400">বকেয়া</div>
                <div class="text-xs font-bold {inv.dueAmount > 0 ? 'text-rose-400' : 'text-slate-400'} font-mono mt-0.5">
                  ৳{inv.dueAmount.toLocaleString()}
                </div>
              </div>
            </div>

            <!-- Action buttons -->
            <div class="flex items-center gap-1.5 flex-wrap">
              {#if inv.dueAmount > 0}
                <button
                  type="button"
                  class="px-2.5 py-1.5 rounded-xl bg-rose-600/15 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 font-semibold text-xs flex items-center gap-1 transition-all"
                  title="Send Due SMS"
                  on:click={() => handleOpenFeeSms(inv)}
                >
                  <MessageSquare class="w-3.5 h-3.5 text-rose-400" />
                  <span>তাগাদা</span>
                </button>

                <button
                  type="button"
                  class="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 transition-all"
                  on:click={() => openCollectModal(inv)}
                >
                  ফি আদায়
                </button>
              {/if}

              <button
                type="button"
                class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all"
                title="Print Receipt Voucher"
                on:click={() => openReceiptModal(inv)}
              >
                <Printer class="w-4 h-4" />
              </button>

              <button
                type="button"
                class="p-2 rounded-xl bg-slate-800 hover:bg-amber-500/20 text-amber-400 border border-slate-700 transition-all"
                title="ইনভয়েস সম্পাদন"
                on:click={() => openEditInvoice(inv)}
              >
                <Pencil class="w-4 h-4" />
              </button>

              <button
                type="button"
                class="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-rose-400 border border-slate-700 transition-all"
                title="ইনভয়েস মুছুন"
                on:click={() => promptDeleteInvoice(inv)}
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      {/each}
    {/if}
  </div>

</div>

<!-- Collect Payment Modal -->
<Modal open={isPayModalOpen} title="Collect Tuition Fee" subtitle="Record payment and dispatch automatic SMS receipt" onClose={() => (isPayModalOpen = false)} maxWidth="max-w-md">
  {#if selectedInvoice}
    <div class="space-y-4 text-xs">
      <div class="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
        <div class="flex justify-between">
          <span class="text-slate-400">Student:</span>
          <strong class="text-white">{selectedInvoice.studentName}</strong>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-400">Invoice:</span>
          <span class="font-mono text-indigo-300">{selectedInvoice.invoiceNo}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-400">Remaining Balance:</span>
          <strong class="text-rose-400">৳{selectedInvoice.dueAmount.toLocaleString()}</strong>
        </div>
      </div>

      <div>
        <label for="collect-amount" class="block font-medium text-slate-300 mb-1">আদায়কৃত ফি-এর পরিমাণ (৳)</label>
        <input
          id="collect-amount"
          type="number"
          bind:value={payAmount}
          max={selectedInvoice.dueAmount}
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold text-sm focus:outline-none focus:border-indigo-500"
        />
      </div>

      <div>
        <label for="collect-method" class="block font-medium text-slate-300 mb-1">পেমেন্ট মাধ্যম (Payment Channel)</label>
        <select
          id="collect-method"
          bind:value={payMethod}
          class="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="bKash">bKash (বিকাশ মার্চেন্ট / পার্সোনাল)</option>
          <option value="Nagad">Nagad (নগদ)</option>
          <option value="Cash">অফিস ফ্রন্টডেস্ক ক্যাশ (Cash)</option>
          <option value="Bank Transfer">ব্যাংক ট্রান্সফার (DBBL / City Bank)</option>
        </select>
      </div>

      <div class="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-[11px] flex items-center gap-2">
        <CheckCircle2 class="w-4 h-4 shrink-0" />
        <span>ফি নিশ্চিতকরণের পর অভিভাবকের মোবাইলে স্বয়ংক্রিয় কনফার্মেশন SMS যাবে।</span>
      </div>

      <div class="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
        <button
          type="button"
          class="px-4 py-2 rounded-xl text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700"
          on:click={() => (isPayModalOpen = false)}
        >
          বাতিল
        </button>
        <button
          type="button"
          class="px-5 py-2 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/30 transition-all"
          on:click={handleRecordPayment}
        >
          ৳{payAmount.toLocaleString()} টাকা গ্রহণ নিশ্চিত করুন
        </button>
      </div>
    </div>
  {/if}
</Modal>

<!-- Printable Receipt Voucher Modal -->
<Modal open={isReceiptModalOpen} title="অফিসিয়াল ফি রসিদ ভাউচার (Money Receipt)" subtitle="প্রতিষ্ঠান সিল ও ভেরিফিকেশন কোডসহ প্রিন্টযোগ্য মানি রিসিট" onClose={() => (isReceiptModalOpen = false)} maxWidth="max-w-lg">
  {#if receiptInvoice}
    <div class="space-y-6">
      <div id="print-receipt-voucher" class="printable-area p-6 rounded-2xl bg-white text-slate-900 border border-slate-300 shadow-2xl">
        <!-- Header -->
        <div class="flex items-center justify-between border-b-2 border-slate-800 pb-4 mb-4">
          <div>
            <h3 class="text-lg font-black tracking-tight text-slate-900">{$instituteSettings.name}</h3>
            <p class="text-[11px] text-slate-600">{$instituteSettings.address} • ফোন: {$instituteSettings.phone}</p>
          </div>
          <div class="text-right">
            <span class="px-2.5 py-1 rounded bg-slate-900 text-white font-bold text-[10px] uppercase tracking-wider">
              মানি রসিদ (MONEY RECEIPT)
            </span>
            <div class="text-xs font-mono font-bold mt-1">{receiptInvoice.invoiceNo}</div>
          </div>
        </div>

        <!-- Student & Date Details -->
        <div class="grid grid-cols-2 gap-3 text-xs mb-4">
          <div>
            <span class="text-slate-500 block text-[10px] uppercase">শিক্ষার্থীর নাম:</span>
            <strong class="text-slate-900 text-sm">{receiptInvoice.studentName}</strong>
            <div class="text-slate-600 text-[11px] mt-0.5">{receiptInvoice.batchName}</div>
          </div>
          <div class="text-right">
            <span class="text-slate-500 block text-[10px] uppercase">রসিদ ইস্যু তারিখ:</span>
            <strong class="text-slate-900">{receiptInvoice.issueDate}</strong>
            <div class="text-slate-600 text-[11px] mt-0.5">পদ্ধতি: {receiptInvoice.paymentMethod || 'bKash'}</div>
          </div>
        </div>

        <!-- Ledger Table -->
        <table class="w-full text-xs border border-slate-200 mb-4">
          <thead class="bg-slate-100 font-bold border-b border-slate-200">
            <tr>
              <th class="p-2 text-left">বিবরণ (Course / Program)</th>
              <th class="p-2 text-right">পরিমাণ (টাকা)</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr>
              <td class="p-2">মাসিক অ্যাকাডেমিক ফি - {receiptInvoice.courseName}</td>
              <td class="p-2 text-right">৳{receiptInvoice.amount.toLocaleString()}</td>
            </tr>
            <tr class="font-bold bg-slate-50">
              <td class="p-2">পরিশোধিত অর্থ (Paid Amount)</td>
              <td class="p-2 text-right text-emerald-700">৳{receiptInvoice.paidAmount.toLocaleString()}</td>
            </tr>
            <tr class="font-semibold text-slate-600">
              <td class="p-2">বর্তমান অবশিষ্ট বকেয়া (Due Balance)</td>
              <td class="p-2 text-right">৳{receiptInvoice.dueAmount.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>

        <!-- Signatures -->
        <div class="pt-6 flex items-center justify-between text-[11px] text-slate-500">
          <div>
            <div class="font-mono text-[10px]">Verified By System</div>
          </div>
          <div class="text-right border-t border-slate-400 pt-1 w-32">
            <span>Authorized Signature</span>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
        <button
          type="button"
          class="px-4 py-2 rounded-xl text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700"
          on:click={() => (isReceiptModalOpen = false)}
        >
          Close
        </button>
        <button
          type="button"
          class="px-5 py-2 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 flex items-center gap-2"
          on:click={printReceipt}
        >
          <Printer class="w-4 h-4" />
          <span>Print Voucher Receipt</span>
        </button>
      </div>
    </div>
  {/if}
</Modal>

<!-- Quick Send SMS Modal -->
<SendSmsModal
  open={isSmsModalOpen}
  recipientName={smsRecipientName}
  recipientPhone={smsRecipientPhone}
  recipientRole={smsRecipientRole}
  defaultMessage={smsDefaultMessage}
  templates={smsTemplates}
  onClose={() => {
    isSmsModalOpen = false;
  }}
/>

<!-- Add Invoice Modal -->
<Modal open={isAddInvoiceModalOpen} title="নতুন ইনভয়েস তৈরি" subtitle="শিক্ষার্থীর অনুকূলে টিউশন ফি বা পরীক্ষার ইনভয়েস যোগ করুন" onClose={() => (isAddInvoiceModalOpen = false)}>
  <form on:submit|preventDefault={handleCreateInvoice} class="space-y-4 text-xs">
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label for="inv-student-select" class="block font-medium text-slate-300 mb-1">শিক্ষার্থী নির্বাচন *</label>
        <select
          id="inv-student-select"
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-indigo-500 focus:outline-none"
          bind:value={newStudentId}
          on:change={(e) => {
            const stu = $students.find((s) => s.id === e.currentTarget.value);
            if (stu) newStudentName = stu.name;
          }}
        >
          <option value="">-- শিক্ষার্থী বাছাই করুন --</option>
          {#each $students as s}
            <option value={s.id}>{s.name} ({s.rollNo})</option>
          {/each}
        </select>
      </div>
      <div>
        <label for="inv-student-name" class="block font-medium text-slate-300 mb-1">অথবা নাম লিখুন *</label>
        <input id="inv-student-name" type="text" bind:value={newStudentName} placeholder="যেমন: ফারহান শাকিল" class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-indigo-500 focus:outline-none" required />
      </div>
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div>
        <label for="inv-batch-select" class="block font-medium text-slate-300 mb-1">ব্যাচ</label>
        <select
          id="inv-batch-select"
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-indigo-500 focus:outline-none"
          bind:value={newBatchId}
          on:change={(e) => {
            const b = $batches.find((x) => x.id === e.currentTarget.value);
            if (b) newBatchName = b.name;
          }}
        >
          <option value="">-- ব্যাচ বাছাই করুন --</option>
          {#each $batches as b}
            <option value={b.id}>{b.name}</option>
          {/each}
        </select>
      </div>
      <div>
        <label for="inv-course-name" class="block font-medium text-slate-300 mb-1">কোর্স/বিবরণ</label>
        <input id="inv-course-name" type="text" bind:value={newCourseName} placeholder="যেমন: HSC পদার্থবিজ্ঞান" class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-indigo-500 focus:outline-none" />
      </div>
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div>
        <label for="inv-amount" class="block font-medium text-slate-300 mb-1">ফি-এর পরিমাণ (৳) *</label>
        <input id="inv-amount" type="number" bind:value={newAmount} min="1" class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-indigo-500 focus:outline-none" required />
      </div>
      <div>
        <label for="inv-due-date" class="block font-medium text-slate-300 mb-1">পরিশোধের শেষ তারিখ *</label>
        <input id="inv-due-date" type="date" bind:value={newDueDate} class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-indigo-500 focus:outline-none" required />
      </div>
    </div>

    <div class="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
      <button type="button" class="px-4 py-2.5 rounded-xl text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors" on:click={() => (isAddInvoiceModalOpen = false)}>বাতিল</button>
      <button type="submit" class="px-5 py-2.5 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all">ইনভয়েস তৈরি করুন</button>
    </div>
  </form>
</Modal>

<!-- Edit Invoice Modal -->
<Modal open={isEditInvoiceModalOpen} title="ইনভয়েস সম্পাদন" subtitle="ইনভয়েসের তথ্য, বকেয়া ও তারিখ পরিবর্তন করুন" onClose={() => { isEditInvoiceModalOpen = false; editInvoice = null; }}>
  <form on:submit|preventDefault={handleUpdateInvoice} class="space-y-4 text-xs">
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label for="edit-inv-student" class="block font-medium text-slate-300 mb-1">শিক্ষার্থীর নাম</label>
        <input id="edit-inv-student" type="text" bind:value={newStudentName} class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-indigo-500 focus:outline-none" required />
      </div>
      <div>
        <label for="edit-inv-batch" class="block font-medium text-slate-300 mb-1">ব্যাচ / কোর্স</label>
        <input id="edit-inv-batch" type="text" bind:value={newBatchName} class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-indigo-500 focus:outline-none" />
      </div>
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div>
        <label for="edit-inv-amount" class="block font-medium text-slate-300 mb-1">মোট ফি (৳)</label>
        <input id="edit-inv-amount" type="number" bind:value={newAmount} min="1" class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-indigo-500 focus:outline-none" required />
      </div>
      <div>
        <label for="edit-inv-due-date" class="block font-medium text-slate-300 mb-1">পরিশোধের শেষ তারিখ</label>
        <input id="edit-inv-due-date" type="date" bind:value={newDueDate} class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-indigo-500 focus:outline-none" required />
      </div>
    </div>

    <div class="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
      <button type="button" class="px-4 py-2.5 rounded-xl text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors" on:click={() => { isEditInvoiceModalOpen = false; editInvoice = null; }}>বাতিল</button>
      <button type="submit" class="px-5 py-2.5 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all">তথ্য সংরক্ষণ করুন</button>
    </div>
  </form>
</Modal>

<!-- Delete Invoice Confirmation -->
<ConfirmModal
  open={isConfirmDeleteInvoiceOpen}
  title="ইনভয়েস মুছুন"
  message="আপনি কি নিশ্চিত যে এই ইনভয়েসটি ডাটাবেজ থেকে মুছে ফেলতে চান? সংশ্লিষ্ট ফি ও বকেয়া হিসাব সমন্বয় হবে।"
  itemName={invoiceToDelete ? `${invoiceToDelete.studentName} (ইনভয়েস #${invoiceToDelete.invoiceNo} - ৳${invoiceToDelete.amount})` : ''}
  confirmText="মুছে ফেলুন"
  confirmVariant="danger"
  onConfirm={handleConfirmDeleteInvoice}
  onCancel={() => { isConfirmDeleteInvoiceOpen = false; invoiceToDelete = null; }}
/>
