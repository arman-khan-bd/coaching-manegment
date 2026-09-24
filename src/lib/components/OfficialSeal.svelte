<script lang="ts">
  import { instituteSettings } from '../store';

  export let size: 'xs' | 'sm' | 'md' | 'lg' = 'md';
  export let customText: string = '';
  export let rotate: boolean = true;
  export let colorScheme: 'indigo' | 'slate' | 'amber' | 'emerald' = 'indigo';
  export let sealUrlOverride: string = '';

  // Unique ID for SVG clip paths to avoid DOM id collisions
  const uid = Math.random().toString(36).substring(2, 7);

  $: instituteName = ($instituteSettings.nameEnglish || $instituteSettings.name || 'COACHFLOW ACADEMY').toUpperCase();
  $: sealText = (customText || $instituteSettings.officialSealText || 'SEAL OF EXCELLENCE • VERIFIED').toUpperCase();
  $: coachingId = $instituteSettings.coachingCenterId || 'AAC-2026';
  $: sealUrl = sealUrlOverride || $instituteSettings.officialSealUrl;

  // Pixel sizes for strict cross-environment and print preservation
  const pixelSizes = {
    xs: 32,
    sm: 58,
    md: 80,
    lg: 110,
  };

  const dimensions = {
    xs: 'w-8 h-8',
    sm: 'w-14 h-14',
    md: 'w-20 h-20',
    lg: 'w-28 h-28',
  };

  const colorStyles = {
    indigo: {
      text: '#3730a3',
      border: '#4338ca',
      bg: 'rgba(238, 242, 255, 0.45)',
      className: 'text-indigo-800 border-indigo-700 bg-indigo-50/50',
    },
    slate: {
      text: '#1e293b',
      border: '#0f172a',
      bg: 'rgba(241, 245, 249, 0.45)',
      className: 'text-slate-900 border-slate-900 bg-slate-100/50',
    },
    amber: {
      text: '#92400e',
      border: '#b45309',
      bg: 'rgba(254, 243, 199, 0.45)',
      className: 'text-amber-800 border-amber-700 bg-amber-50/50',
    },
    emerald: {
      text: '#065f46',
      border: '#047857',
      bg: 'rgba(209, 250, 229, 0.45)',
      className: 'text-emerald-800 border-emerald-700 bg-emerald-50/50',
    },
  };

  $: activeColor = colorStyles[colorScheme] || colorStyles.indigo;
  $: pxSize = pixelSizes[size] || 80;
</script>

{#if sealUrl}
  <div
    class="relative inline-flex items-center justify-center select-none {dimensions[size]} {rotate ? 'rotate-[-5deg]' : ''}"
    style="width: {pxSize}px !important; height: {pxSize}px !important; min-width: {pxSize}px !important; min-height: {pxSize}px !important; max-width: {pxSize}px !important; max-height: {pxSize}px !important; display: inline-flex !important; align-items: center !important; justify-content: center !important; flex-shrink: 0 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;"
  >
    <img
      src={sealUrl}
      alt="Official Institute Seal"
      width={pxSize}
      height={pxSize}
      style="width: {pxSize}px !important; height: {pxSize}px !important; max-width: {pxSize}px !important; max-height: {pxSize}px !important; object-fit: contain !important; border-radius: 9999px !important; display: block !important;"
      class="object-contain rounded-full drop-shadow print:drop-shadow-none"
    />
  </div>
{:else}
  <!-- Auto-Generated Crisp Vector Geometric Circular Seal (SVG textPath) -->
  <div
    class="relative inline-flex items-center justify-center select-none {dimensions[size]} {rotate ? '-rotate-6' : ''} transition-transform hover:rotate-0"
    title="Official Auto-Generated Institute Seal"
    style="width: {pxSize}px !important; height: {pxSize}px !important; min-width: {pxSize}px !important; min-height: {pxSize}px !important; max-width: {pxSize}px !important; max-height: {pxSize}px !important; display: inline-flex !important; align-items: center !important; justify-content: center !important; flex-shrink: 0 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;"
  >
    <svg
      width={pxSize}
      height={pxSize}
      viewBox="0 0 120 120"
      style="width: {pxSize}px !important; height: {pxSize}px !important; min-width: {pxSize}px !important; min-height: {pxSize}px !important; max-width: {pxSize}px !important; max-height: {pxSize}px !important; display: block !important; margin: 0 auto !important; color: {activeColor.border}; overflow: visible;"
    >
      <defs>
        <!-- Top Arc Path for Institute Name -->
        <path
          id="seal-arc-top-{uid}"
          d="M 18,60 A 42,42 0 1,1 102,60"
          fill="none"
        />
        <!-- Bottom Arc Path for Subtext / Verification -->
        <path
          id="seal-arc-bot-{uid}"
          d="M 102,60 A 42,42 0 0,1 18,60"
          fill="none"
        />
      </defs>

      <!-- Background Circle for Print Contrast -->
      <circle
        cx="60"
        cy="60"
        r="57"
        fill={activeColor.bg}
        stroke={activeColor.border}
        stroke-width="2.5"
      />

      <!-- Concentric Outer Serrated / Dashed Ring -->
      <circle
        cx="60"
        cy="60"
        r="52"
        fill="none"
        stroke={activeColor.border}
        stroke-width="1"
        stroke-dasharray="2.5 1.5"
        opacity="0.85"
      />

      <!-- Inner Solid Ring -->
      <circle
        cx="60"
        cy="60"
        r="35"
        fill="none"
        stroke={activeColor.border}
        stroke-width="1.8"
      />
      <!-- Inner Thin Ring -->
      <circle
        cx="60"
        cy="60"
        r="32"
        fill="none"
        stroke={activeColor.border}
        stroke-width="0.75"
        stroke-dasharray="1.5 1"
        opacity="0.7"
      />

      <!-- Top Curving Institute Name -->
      <text
        font-family="sans-serif, system-ui"
        font-size="9.5"
        font-weight="900"
        fill={activeColor.text}
        letter-spacing="1.2"
      >
        <textPath href="#seal-arc-top-{uid}" startOffset="50%" text-anchor="middle">
          {instituteName.length > 28 ? instituteName.slice(0, 26) + '…' : instituteName}
        </textPath>
      </text>

      <!-- Bottom Curving Verification / Location -->
      <text
        font-family="sans-serif, system-ui"
        font-size="8"
        font-weight="700"
        fill={activeColor.text}
        letter-spacing="1"
        opacity="0.9"
      >
        <textPath href="#seal-arc-bot-{uid}" startOffset="50%" text-anchor="middle">
          ★ {sealText.length > 24 ? sealText.slice(0, 22) : sealText} ★
        </textPath>
      </text>

      <!-- Center Elements -->
      <!-- Center Stars / Badge -->
      <g transform="translate(60, 48)" text-anchor="middle">
        <text
          y="0"
          font-family="sans-serif"
          font-size="8"
          fill={activeColor.text}
          font-weight="900"
        >
          ★
        </text>
      </g>

      <g transform="translate(60, 59)" text-anchor="middle">
        <rect
          x="-30"
          y="-6.5"
          width="60"
          height="11"
          rx="2"
          fill={activeColor.border}
        />
        <text
          y="2.2"
          font-family="sans-serif, system-ui"
          font-size="6.8"
          font-weight="900"
          fill="#ffffff"
          letter-spacing="1.4"
        >
          OFFICIAL SEAL
        </text>
      </g>

      <g transform="translate(60, 71)" text-anchor="middle">
        <text
          y="0"
          font-family="monospace, sans-serif"
          font-size="5.5"
          font-weight="700"
          fill={activeColor.text}
          letter-spacing="0.5"
        >
          ID: {coachingId}
        </text>
      </g>
    </svg>
  </div>
{/if}

