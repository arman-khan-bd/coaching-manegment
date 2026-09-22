<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { uploadToCloudinary, CLOUDINARY_CLOUD } from '../cloudinary';
  import { showToast } from '../store';
  import {
    Upload,
    Cloud,
    CheckCircle2,
    AlertCircle,
    X,
    Loader2,
    Image as ImageIcon,
    ExternalLink,
    Link2,
  } from 'lucide-svelte';

  export let value: string = '';
  export let label: string = 'ছবি আপলোড (Cloudinary)';
  export let folder: string = 'coaching_management';
  export let aspect: 'square' | 'circle' | 'banner' | 'icon' = 'square';
  export let placeholderText: string = 'ক্লিক করুন বা ছবি ড্রপ করুন';
  export let helpText: string = 'সরাসরি ক্লাউডিনারিতে আপলোড হবে';
  export let badgeText: string = 'Cloudinary CDN';
  export let previewSize: 'sm' | 'md' | 'lg' = 'md';

  const dispatch = createEventDispatcher<{
    change: string;
    uploaded: { url: string; publicId: string };
  }>();

  let fileInput: HTMLInputElement;
  let isUploading = false;
  let isDragging = false;
  let errorMessage: string | null = null;
  let showManualInput = false;

  const aspectClasses = {
    square: 'w-24 h-24 rounded-2xl',
    circle: 'w-24 h-24 rounded-full',
    icon: 'w-16 h-16 rounded-xl',
    banner: 'w-full h-32 rounded-2xl',
  };

  const previewSizes = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  };

  async function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files[0]) {
      await processUpload(target.files[0]);
    }
  }

  async function handleDrop(event: DragEvent) {
    event.preventDefault();
    isDragging = false;
    if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
      await processUpload(event.dataTransfer.files[0]);
    }
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    isDragging = true;
  }

  function handleDragLeave() {
    isDragging = false;
  }

  async function processUpload(file: File) {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      errorMessage = 'শুধুমাত্র ছবি (JPG, PNG, WebP) ফাইল আপলোড করা যাবে।';
      showToast('error', 'ফাইল ত্রুটি', errorMessage);
      return;
    }

    // Validate size (max 8MB)
    if (file.size > 8 * 1024 * 1024) {
      errorMessage = 'ছবির সাইজ ৮ মেগাবাইটের বেশি হতে পারবে না।';
      showToast('error', 'সাইজ লিমিট', errorMessage);
      return;
    }

    errorMessage = null;
    isUploading = true;

    try {
      const res = await uploadToCloudinary(file, folder);
      value = res.secure_url;
      dispatch('change', value);
      dispatch('uploaded', { url: res.secure_url, publicId: res.public_id });
      showToast('success', 'ক্লাউডিনারি আপলোড সম্পন্ন', 'ছবিটি সফলভাবে ক্লাউডিনারিতে সংরক্ষিত হয়েছে।');
    } catch (err: any) {
      errorMessage = err?.message || 'ক্লাউডিনারিতে আপলোড ব্যর্থ হয়েছে।';
      showToast('error', 'আপলোড ত্রুটি', errorMessage);
      console.error('Upload error:', err);
    } finally {
      isUploading = false;
      if (fileInput) fileInput.value = '';
    }
  }

  function handleRemove() {
    value = '';
    dispatch('change', '');
    errorMessage = null;
  }
</script>

<div class="space-y-1.5">
  <!-- Label Row -->
  <div class="flex items-center justify-between">
    <label class="block font-semibold text-slate-300 text-xs flex items-center gap-1.5">
      <span>{label}</span>
      <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
        <Cloud class="w-3 h-3 text-cyan-400" />
        {badgeText}
      </span>
    </label>

    <button
      type="button"
      class="text-[11px] text-slate-400 hover:text-indigo-400 transition-colors flex items-center gap-1"
      on:click={() => (showManualInput = !showManualInput)}
    >
      <Link2 class="w-3 h-3" />
      <span>{showManualInput ? 'ফাইল আপলোড মোড' : 'লিংক ইনপুট'}</span>
    </button>
  </div>

  {#if showManualInput}
    <!-- Direct URL Input Mode -->
    <div class="flex items-center gap-2">
      <input
        type="url"
        bind:value
        placeholder="https://res.cloudinary.com/..."
        class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        on:input={() => dispatch('change', value)}
      />
      {#if value}
        <button
          type="button"
          class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors shrink-0"
          on:click={handleRemove}
          title="মুছুন"
        >
          <X class="w-4 h-4" />
        </button>
      {/if}
    </div>
  {:else}
    <!-- Cloudinary Dropzone / File Picker -->
    <div
      class="relative overflow-hidden rounded-2xl border-2 transition-all p-3.5
      {isDragging
        ? 'border-indigo-500 bg-indigo-500/10'
        : 'border-dashed border-slate-800 hover:border-slate-700 bg-slate-950/60'}"
      on:dragover={handleDragOver}
      on:dragleave={handleDragLeave}
      on:drop={handleDrop}
      role="region"
      aria-label="File Upload Dropzone"
    >
      <!-- Hidden File Input -->
      <input
        type="file"
        accept="image/*"
        bind:this={fileInput}
        on:change={handleFileSelect}
        class="hidden"
      />

      {#if isUploading}
        <!-- Uploading Spinner -->
        <div class="py-6 flex flex-col items-center justify-center text-center space-y-2">
          <Loader2 class="w-8 h-8 text-cyan-400 animate-spin" />
          <div class="text-xs font-bold text-white">ক্লাউডিনারিতে আপলোড হচ্ছে...</div>
          <div class="text-[11px] text-slate-400 font-mono">ক্লাউড: {CLOUDINARY_CLOUD}</div>
        </div>
      {:else if value}
        <!-- Image Preview Card -->
        <div class="flex flex-col sm:flex-row items-center gap-3.5">
          <div class="relative shrink-0 group">
            <img
              src={value}
              alt="Uploaded Preview"
              class="{aspect === 'circle' ? 'rounded-full' : 'rounded-xl'} {previewSizes[previewSize]} object-cover border border-slate-700 shadow-md bg-slate-900"
            />
            <div class="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <a
                href={value}
                target="_blank"
                rel="noreferrer"
                class="p-1 rounded-lg bg-black/60 text-white hover:text-indigo-300"
                title="পূর্ণ ছবি দেখুন"
              >
                <ExternalLink class="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <div class="flex-1 text-center sm:text-left min-w-0">
            <div class="flex items-center gap-1.5 text-xs font-bold text-emerald-400 justify-center sm:justify-start">
              <CheckCircle2 class="w-3.5 h-3.5" />
              <span>ছবি সংরক্ষিত আছে</span>
            </div>
            <p class="text-[11px] text-slate-400 font-mono truncate mt-0.5 max-w-xs" title={value}>
              {value}
            </p>
            <div class="flex items-center gap-2 mt-2 justify-center sm:justify-start">
              <button
                type="button"
                class="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-medium transition-colors flex items-center gap-1"
                on:click={() => fileInput.click()}
              >
                <Upload class="w-3 h-3" />
                <span>পরিবর্তন করুন</span>
              </button>
              <button
                type="button"
                class="px-2.5 py-1 rounded-lg bg-rose-600/15 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/20 text-xs font-medium transition-colors flex items-center gap-1"
                on:click={handleRemove}
              >
                <X class="w-3 h-3" />
                <span>মুছুন</span>
              </button>
            </div>
          </div>
        </div>
      {:else}
        <!-- Empty Upload State -->
        <button
          type="button"
          class="w-full py-4 flex flex-col items-center justify-center text-center cursor-pointer group"
          on:click={() => fileInput.click()}
        >
          <div class="w-10 h-10 rounded-xl bg-indigo-500/10 group-hover:bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-2 transition-colors">
            <Cloud class="w-5 h-5" />
          </div>
          <div class="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
            {placeholderText}
          </div>
          <div class="text-[11px] text-slate-400 mt-0.5">
            {helpText}
          </div>
        </button>
      {/if}
    </div>
  {/if}

  {#if errorMessage}
    <div class="flex items-center gap-1.5 text-[11px] text-rose-400 font-medium">
      <AlertCircle class="w-3.5 h-3.5 shrink-0" />
      <span>{errorMessage}</span>
    </div>
  {/if}
</div>
