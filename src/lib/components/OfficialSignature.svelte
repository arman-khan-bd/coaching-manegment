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
  class="flex flex-col items-center justify-end text-center select-none"
  style="min-width: {compact ? '90px' : '130px'} !important; max-width: {compact ? '120px' : '170px'} !important; display: flex !important; flex-direction: column !important; align-items: center !important; justify-content: flex-end !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;"
>
  <!-- Signature Image or Auto Calligraphic Handwritten Text -->
  <div style="height: {compact ? '26px' : '38px'} !important; min-height: {compact ? '26px' : '38px'} !important; display: flex !important; align-items: flex-end !important; justify-content: center !important; width: 100% !important; margin-bottom: 3px !important;">
    {#if sigUrl}
      <img
        src={sigUrl}
        alt="Digital Signature"
        style="max-height: {compact ? '24px' : '36px'} !important; max-width: {compact ? '80px' : '140px'} !important; object-fit: contain !important;"
        class="object-contain {darkText ? '' : 'filter invert brightness-200'}"
      />
    {:else}
      <!-- Auto Calligraphic Elegant Signature if image not uploaded -->
      <span
        class="italic font-bold tracking-wide {compact ? 'text-xs' : 'text-base'} {darkText ? 'text-indigo-950' : 'text-indigo-200'} drop-shadow-sm select-text inline-block"
        style="font-family: 'Caveat', 'Dancing Script', 'Brush Script MT', cursive, Georgia, serif; line-height: 1.1; font-size: {compact ? '13px' : '18px'} !important; transform: rotate(-3deg); display: inline-block; color: {darkText ? '#0f172a' : '#c7d2fe'} !important;"
      >
        {fallbackSignature}
      </span>
    {/if}
  </div>

  <!-- Underline Bar -->
  {#if underline}
    <div style="width: {compact ? '80px' : '120px'} !important; border-bottom: 2px solid {darkText ? '#0f172a' : '#818cf8'} !important; margin-bottom: 4px !important;"></div>
  {/if}

  <!-- Signer Details -->
  <div
    class="{compact ? 'text-[9px]' : 'text-[11px]'} font-bold leading-tight {darkText ? 'text-slate-900' : 'text-white'}"
    style="font-size: {compact ? '9px' : '11px'} !important; font-weight: 700 !important; color: {darkText ? '#0f172a' : '#ffffff'} !important; line-height: 1.2 !important;"
  >
    {signerName}
  </div>
  {#if !compact}
    <div
      class="text-[9px] font-medium {darkText ? 'text-slate-600' : 'text-slate-300'}"
      style="font-size: 9.5px !important; font-weight: 500 !important; color: {darkText ? '#475569' : '#cbd5e1'} !important; margin-top: 1px !important;"
    >
      {signerDesignation}
    </div>
  {/if}
  {#if label}
    <div
      class="{compact ? 'text-[7px]' : 'text-[8px]'} uppercase tracking-wider {darkText ? 'text-slate-400' : 'text-slate-400'} pt-0.5"
      style="font-size: 8px !important; text-transform: uppercase !important; letter-spacing: 0.5px !important; color: #94a3b8 !important; margin-top: 2px !important;"
    >
      {label}
    </div>
  {/if}
</div>

