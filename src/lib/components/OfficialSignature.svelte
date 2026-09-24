<script lang="ts">
  import { instituteSettings } from '../store';

  export let name: string = '';
  export let designation: string = '';
  export let signatureUrl: string = '';
  export let label: string = 'Authorized Signatory';
  export let darkText: boolean = true;
  export let underline: boolean = true;
  export let compact: boolean = false;

  $: sigUrl = signatureUrl || $instituteSettings.directorSignatureUrl || $instituteSettings.headTeacherSignatureUrl;
  $: signerName = name || $instituteSettings.directorName || 'মোঃ সাইফুল ইসলাম';
  $: signerDesignation = designation || $instituteSettings.directorDesignation || 'অধ্যক্ষ ও প্রধান শিক্ষক';
  $: fallbackSignature = $instituteSettings.directorSignature || signerName;
</script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=Dancing+Script:wght@600;700&display=swap" rel="stylesheet">
</svelte:head>

<div
  class="flex flex-col items-center justify-end text-center {compact ? 'min-w-[90px]' : 'min-w-[130px]'} select-none"
  style="-webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;"
>
  <!-- Signature Image or Auto Calligraphic Handwritten Text -->
  <div class="{compact ? 'h-6 mb-0.5' : 'h-10 mb-1'} flex items-end justify-center w-full px-1">
    {#if sigUrl}
      <img
        src={sigUrl}
        alt="Digital Signature"
        class="{compact ? 'max-h-5 max-w-[80px]' : 'max-h-9 max-w-[140px]'} object-contain {darkText ? '' : 'filter invert brightness-200'}"
      />
    {:else}
      <!-- Auto Calligraphic Elegant Signature if image not uploaded -->
      <span
        class="italic font-bold tracking-wide {compact ? 'text-xs' : 'text-base'} {darkText ? 'text-indigo-950' : 'text-indigo-200'} drop-shadow-sm transform -rotate-3 select-text inline-block"
        style="font-family: 'Caveat', 'Dancing Script', 'Brush Script MT', cursive, Georgia, serif; line-height: 1.1;"
      >
        {fallbackSignature}
      </span>
    {/if}
  </div>

  <!-- Underline Bar -->
  {#if underline}
    <div class="{compact ? 'w-20' : 'w-32'} border-b-2 {darkText ? 'border-slate-800' : 'border-indigo-400/50'} mb-1"></div>
  {/if}

  <!-- Signer Details -->
  <div class="{compact ? 'text-[9px]' : 'text-[11px]'} font-bold leading-tight {darkText ? 'text-slate-900' : 'text-white'}">
    {signerName}
  </div>
  {#if !compact}
    <div class="text-[9px] font-medium {darkText ? 'text-slate-600' : 'text-slate-300'}">
      {signerDesignation}
    </div>
  {/if}
  {#if label}
    <div class="{compact ? 'text-[7px]' : 'text-[8px]'} uppercase tracking-wider {darkText ? 'text-slate-400' : 'text-slate-400'} pt-0.5">
      {label}
    </div>
  {/if}
</div>

