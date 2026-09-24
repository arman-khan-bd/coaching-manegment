/**
 * Universal Pixel-Perfect Print Utility for CoachFlow
 * Ensures printed documents match on-screen previews identically, with
 * embedded Bangla typography (Hind Siliguri & Noto Sans Bengali), crisp table styling,
 * full color preservation (-webkit-print-color-adjust: exact), and zero screen artifacts.
 */

export interface PrintOptions {
  title?: string;
  orientation?: 'portrait' | 'landscape';
  pageMargin?: string;
  instituteName?: string;
}

export function printElement(
  target: string | HTMLElement,
  options: PrintOptions = {}
): boolean {
  if (typeof window === 'undefined') return false;

  const element = typeof target === 'string' ? document.getElementById(target) : target;
  if (!element) {
    console.warn(`[printElement] Target element "${target}" not found.`);
    window.print();
    return false;
  }

  // Clone node to strip any screen-only buttons or interactive widgets
  const clone = element.cloneNode(true) as HTMLElement;
  const noPrintEls = clone.querySelectorAll('.no-print, button, input, select');
  noPrintEls.forEach((el) => {
    // Only remove action buttons, not inputs that display data
    if (el.tagName === 'BUTTON' || el.classList.contains('no-print')) {
      el.remove();
    }
  });

  const title = options.title || document.title || 'Official Document';
  const orientation = options.orientation || 'portrait';
  const margin = options.pageMargin || '8mm 10mm';

  // Cleanly collect document stylesheets without broken rules
  let pageStyles = '';
  try {
    const styleEls = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'));
    pageStyles = styleEls
      .map((el) => {
        if (el.tagName === 'STYLE') {
          // Strip any parent application @media print hiding rules so they don't corrupt the print frame
          const cleaned = el.innerHTML
            .replace(/@media\s+print\s*\{[\s\S]*?\}(?:\s*\})?/gi, '')
            .replace(/body\s*\*\s*\{\s*visibility\s*:\s*hidden\s*;?\s*\}/gi, '')
            .replace(/visibility\s*:\s*hidden/gi, 'visibility: visible');
          return `<style>${cleaned}</style>`;
        }
        return el.outerHTML;
      })
      .join('\n');
  } catch (e) {
    console.warn('Could not collect page styles:', e);
  }

  const originUrl = typeof window !== 'undefined' ? window.location.origin : '';

  // Build standalone self-contained printable HTML document
  const printDoc = `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8" />
  <base href="${originUrl}/" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=Dancing+Script:wght@600;700&family=Hind+Siliguri:wght@400;500;600;700&family=Noto+Sans+Bengali:wght@400;500;600;700;800&family=Outfit:wght@500;600;700;800&display=swap" rel="stylesheet">
  ${pageStyles}
  <style>
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      visibility: visible !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }

    @page {
      size: A4 ${orientation};
      margin: ${margin};
    }

    html, body {
      background: #ffffff !important;
      color: #0f172a !important;
      font-family: 'Hind Siliguri', 'Noto Sans Bengali', system-ui, -apple-system, sans-serif !important;
      font-size: 12px;
      line-height: 1.5;
      width: 100% !important;
      height: auto !important;
      min-height: 100% !important;
      padding: 0 !important;
      margin: 0 !important;
      visibility: visible !important;
      display: block !important;
      overflow: visible !important;
    }

    .printable-root {
      width: 100% !important;
      max-width: 100% !important;
      margin: 0 auto !important;
      background: #ffffff !important;
      color: #0f172a !important;
      visibility: visible !important;
      display: block !important;
      opacity: 1 !important;
    }

    .printable-area {
      width: 100% !important;
      max-width: 100% !important;
      margin: 0 auto !important;
      padding: 0 !important;
      box-shadow: none !important;
      border: none !important;
      background: #ffffff !important;
      color: #0f172a !important;
      visibility: visible !important;
      display: block !important;
    }

    .printable-root *, .printable-area * {
      visibility: visible !important;
      opacity: 1 !important;
    }

    /* Preserve all Tailwind colors & table borders */
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 6px 10px;
    }
    th {
      background-color: #f1f5f9 !important;
      color: #0f172a !important;
      font-weight: 700;
    }
    tr:nth-child(even) td {
      background-color: #f8fafc !important;
    }

    /* Utility Helpers */
    .bg-white { background-color: #ffffff !important; }
    .bg-slate-50 { background-color: #f8fafc !important; }
    .bg-slate-100 { background-color: #f1f5f9 !important; }
    .bg-slate-200 { background-color: #e2e8f0 !important; }
    .bg-slate-900 { background-color: #0f172a !important; color: #ffffff !important; }
    .bg-indigo-50 { background-color: #eef2ff !important; }
    .bg-indigo-600 { background-color: #4f46e5 !important; color: #ffffff !important; }
    .text-slate-900 { color: #0f172a !important; }
    .text-slate-800 { color: #1e293b !important; }
    .text-slate-700 { color: #334155 !important; }
    .text-slate-600 { color: #475569 !important; }
    .text-slate-500 { color: #64748b !important; }
    .text-indigo-600 { color: #4f46e5 !important; }
    .text-indigo-700 { color: #4338ca !important; }
    .text-indigo-900 { color: #312e81 !important; }
    .text-emerald-700 { color: #047857 !important; }
    .text-emerald-600 { color: #059669 !important; }
    .text-rose-700 { color: #be123c !important; }
    .text-white { color: #ffffff !important; }

    .border { border: 1px solid #cbd5e1 !important; }
    .border-b { border-bottom: 1px solid #cbd5e1 !important; }
    .border-b-2 { border-bottom: 2px solid #0f172a !important; }
    .border-t { border-top: 1px solid #cbd5e1 !important; }
    .border-slate-200 { border-color: #e2e8f0 !important; }
    .border-slate-300 { border-color: #cbd5e1 !important; }
    .border-slate-800 { border-color: #1e293b !important; }
    .border-slate-900 { border-color: #0f172a !important; }

    .rounded-xl, .rounded-2xl, .rounded-3xl { border-radius: 6px !important; }
    .rounded-full { border-radius: 9999px !important; }
    .shadow-xl, .shadow-2xl, .shadow-md, .shadow-sm { box-shadow: none !important; }

    /* Layout & Flexbox Utilities */
    .flex { display: flex !important; }
    .inline-flex { display: inline-flex !important; }
    .items-center { align-items: center !important; }
    .items-start { align-items: flex-start !important; }
    .items-end { align-items: flex-end !important; }
    .justify-between { justify-content: space-between !important; }
    .justify-center { justify-content: center !important; }
    .justify-end { justify-content: flex-end !important; }
    .flex-col { flex-direction: column !important; }
    .flex-row { flex-direction: row !important; }
    .flex-wrap { flex-wrap: wrap !important; }
    .flex-1 { flex: 1 1 0% !important; }
    .flex-shrink-0 { flex-shrink: 0 !important; }

    .grid { display: grid !important; }
    .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
    .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
    .grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; }

    .gap-1 { gap: 4px !important; }
    .gap-2 { gap: 8px !important; }
    .gap-3 { gap: 12px !important; }
    .gap-4 { gap: 16px !important; }
    .gap-6 { gap: 24px !important; }

    .w-14 { width: 56px !important; }
    .h-14 { height: 56px !important; }
    .w-16 { width: 64px !important; }
    .h-16 { height: 64px !important; }
    .w-20 { width: 80px !important; }
    .h-20 { height: 80px !important; }
    .w-24 { width: 96px !important; }
    .h-24 { height: 96px !important; }
    .w-32 { width: 128px !important; }
    .w-36 { width: 144px !important; }
    .w-full { width: 100% !important; }

    .text-center { text-align: center !important; }
    .text-right { text-align: right !important; }
    .text-left { text-align: left !important; }
    img { max-width: 100%; object-fit: contain; }

    /* Hide screen-only items */
    .no-print {
      display: none !important;
    }

    /* Avoid page-breaks inside signatures or cards */
    .page-break-inside-avoid, tr, .avoid-break {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }

    .page-break-after {
      page-break-after: always !important;
      break-after: page !important;
    }

    /* ID Card & Multi-Page Print Rules */
    .id-card-wrapper {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      display: inline-block !important;
    }

    .id-card-element {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      box-shadow: none !important;
    }

    .a4-print-sheet {
      display: block !important;
      width: 100% !important;
      max-width: 194mm !important;
      margin: 0 auto !important;
      padding: 4mm !important;
      box-sizing: border-box !important;
      page-break-after: always !important;
      break-after: page !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      background: transparent !important;
      box-shadow: none !important;
      border: none !important;
    }

    .a4-print-sheet:last-child {
      page-break-after: auto !important;
      break-after: auto !important;
    }

    .empty-card-slot {
      border: 1.5px dashed #cbd5e1 !important;
      background: transparent !important;
      color: #94a3b8 !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }

    @media print {
      body {
        padding: 0 !important;
      }
    }
  </style>
</head>
<body>
  <div class="printable-root">
    ${clone.outerHTML}
  </div>
</body>
</html>`;

  // PRIMARY PRINT ENGINE: Offscreen desktop-dimensioned iframe
  const iframeSuccess = printViaIframe(printDoc);
  if (iframeSuccess) return true;

  // SECONDARY FALLBACK: Clean popup window with auto-close
  return fallbackWindowPrint(printDoc);
}

/**
 * Universal Offscreen Iframe Printer
 */
export function printViaIframe(printDoc: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const existingIframe = document.getElementById('cf-print-iframe');
    if (existingIframe) {
      existingIframe.remove();
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'cf-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.left = '-9999px';
    iframe.style.top = '-9999px';
    iframe.style.width = '1024px';
    iframe.style.height = '1400px';
    iframe.style.border = '0';
    iframe.style.margin = '0';
    iframe.style.padding = '0';
    iframe.style.opacity = '1';
    iframe.style.visibility = 'visible';
    iframe.style.pointerEvents = 'none';
    iframe.style.zIndex = '-99999';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(printDoc);
      doc.close();

      const win = iframe.contentWindow;
      if (win) {
        let printed = false;
        const doPrint = () => {
          if (printed) return;
          printed = true;
          try {
            win.focus();
            win.print();
          } catch (e) {
            console.warn('Iframe print call failed, trying popup window:', e);
            fallbackWindowPrint(printDoc);
          } finally {
            setTimeout(() => {
              try { iframe.remove(); } catch (e) {}
            }, 3500);
          }
        };

        if (win.document.fonts && typeof win.document.fonts.ready?.then === 'function') {
          win.document.fonts.ready
            .then(() => {
              setTimeout(doPrint, 200);
            })
            .catch(() => {
              setTimeout(doPrint, 250);
            });
          setTimeout(doPrint, 800);
        } else {
          setTimeout(doPrint, 300);
        }
        return true;
      }
    }
  } catch (err) {
    console.warn('Iframe print setup error:', err);
  }
  return false;
}

export function fallbackWindowPrint(html: string): boolean {
  try {
    const printWindow = window.open('', '_blank', 'width=960,height=800,menubar=no,toolbar=no,location=no,status=no');
    if (!printWindow) {
      window.print();
      return false;
    }
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();

    const doPrint = () => {
      try {
        printWindow.focus();
        printWindow.print();
        printWindow.onafterprint = () => {
          try { printWindow.close(); } catch (e) {}
        };
      } catch (e) {}
    };

    if (printWindow.document.readyState === 'complete') {
      setTimeout(doPrint, 300);
    } else {
      printWindow.onload = () => setTimeout(doPrint, 250);
      setTimeout(doPrint, 700);
    }
    return true;
  } catch (e) {
    window.print();
    return false;
  }
}

export interface PrintIdCardOptions {
  studentName?: string;
  rollNo?: string;
  batchName?: string;
  instituteName?: string;
}

/**
 * Dedicated Single Student ID Card Print Engine
 * Positions the card crisply at the LEFT-TOP corner of an A4 page,
 * preserves rich gradients & background colors (-webkit-print-color-adjust: exact),
 * includes a modern on-screen print preview bar, and reliable auto-print trigger.
 */
export function printIdCard(
  target: string | HTMLElement,
  options: PrintIdCardOptions = {}
): boolean {
  if (typeof window === 'undefined') return false;

  const element = typeof target === 'string' ? document.getElementById(target) : target;
  if (!element) {
    console.warn(`[printIdCard] Target element "${target}" not found.`);
    window.print();
    return false;
  }

  // Clone node and clean screen-only buttons
  const clone = element.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('.no-print, button').forEach((el) => el.remove());

  const studentName = options.studentName || 'Student';
  const rollNo = options.rollNo || '';
  const title = `ID Card - ${studentName}${rollNo ? ' (' + rollNo + ')' : ''}`;
  const originUrl = typeof window !== 'undefined' ? window.location.origin : '';

  // Cleanly collect document stylesheets without broken rules
  let pageStyles = '';
  try {
    const styleEls = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'));
    pageStyles = styleEls
      .map((el) => {
        if (el.tagName === 'STYLE') {
          const cleaned = el.innerHTML
            .replace(/@media\s+print\s*\{[\s\S]*?\}(?:\s*\})?/gi, '')
            .replace(/body\s*\*\s*\{\s*visibility\s*:\s*hidden\s*;?\s*\}/gi, '')
            .replace(/visibility\s*:\s*hidden/gi, 'visibility: visible');
          return `<style>${cleaned}</style>`;
        }
        return el.outerHTML;
      })
      .join('\n');
  } catch (e) {
    console.warn('Could not collect page styles:', e);
  }

  const printDoc = `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8" />
  <base href="${originUrl}/" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=Dancing+Script:wght@600;700&family=Hind+Siliguri:wght@400;500;600;700&family=Noto+Sans+Bengali:wght@400;500;600;700;800&family=Outfit:wght@500;600;700;800&display=swap" rel="stylesheet">
  ${pageStyles}
  <style>
    *, *::before, *::after {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }

    /* Print Setup: Position card at Top-Left of A4 Paper */
    @page {
      size: A4 portrait;
      margin: 8mm 8mm; /* standard printer minimum non-printable border */
    }

    html, body {
      margin: 0 !important;
      padding: 0 !important;
      font-family: 'Hind Siliguri', 'Noto Sans Bengali', system-ui, -apple-system, sans-serif !important;
      width: 100% !important;
      height: 100% !important;
      text-align: left !important;
    }

    /* On-Screen Preview Bar & A4 Sheet Simulator */
    @media screen {
      body {
        background: #090d16 !important;
        color: #f1f5f9 !important;
        min-height: 100vh;
        padding-top: 68px !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: flex-start !important;
        padding-left: 28px !important;
        padding-bottom: 40px !important;
      }

      .preview-topbar {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: 56px;
        background: rgba(15, 23, 42, 0.95);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 24px;
        z-index: 99999;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
      }

      .a4-preview-sheet {
        width: 210mm;
        min-height: 297mm;
        background: #ffffff !important;
        color: #0f172a !important;
        box-shadow: 0 16px 48px rgba(0, 0, 0, 0.6);
        border-radius: 4px;
        position: relative;
        padding: 8mm;
        box-sizing: border-box;
        text-align: left;
      }

      .id-card-dock-left-top {
        position: absolute;
        top: 8mm;
        left: 8mm;
        margin: 0;
        padding: 0;
        display: inline-block;
        text-align: left;
      }

      .cut-guide-indicator {
        position: absolute;
        top: 8mm;
        left: 8mm;
        width: 320px;
        height: 450px;
        border: 1.5px dashed rgba(99, 102, 241, 0.45);
        border-radius: 16px;
        pointer-events: none;
      }

      .sheet-watermark-note {
        position: absolute;
        bottom: 10mm;
        left: 8mm;
        right: 8mm;
        padding: 10px 14px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        font-size: 11px;
        color: #64748b;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
    }

    /* Print Rendering Rules */
    @media print {
      .no-print, .preview-topbar, .cut-guide-indicator, .sheet-watermark-note {
        display: none !important;
      }

      html, body {
        background: #ffffff !important;
        color: #0f172a !important;
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
        height: auto !important;
      }

      .a4-preview-sheet {
        width: 100% !important;
        min-height: auto !important;
        margin: 0 !important;
        padding: 0 !important;
        box-shadow: none !important;
        border: none !important;
        background: transparent !important;
      }

      .id-card-dock-left-top {
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
        display: inline-block !important;
        text-align: left !important;
      }
    }

    /* ID Card Structure & Styling Fixes */
    .id-card-wrapper {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      display: inline-block !important;
      text-align: left !important;
    }

    .id-card-element {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      box-shadow: none !important;
    }
  </style>
</head>
<body>
  <!-- Screen Navigation & Action Bar -->
  <div class="no-print preview-topbar">
    <div style="display: flex; align-items: center; gap: 12px;">
      <span style="font-weight: 800; font-size: 14px; color: #ffffff; letter-spacing: -0.01em;">
        🪪 ID Card Print Preview
      </span>
      <span style="font-size: 12px; color: #a5b4fc; background: rgba(99, 102, 241, 0.2); border: 1px solid rgba(99, 102, 241, 0.35); padding: 3px 10px; border-radius: 9999px; font-weight: 600;">
        ${studentName} ${rollNo ? '• ' + rollNo : ''}
      </span>
      <span style="font-size: 11px; color: #94a3b8; background: #1e293b; padding: 2px 8px; border-radius: 6px;">
        A4 শীট (টপ-লেফট সাইড / Left Top Side)
      </span>
    </div>

    <div style="display: flex; align-items: center; gap: 10px;">
      <button
        onclick="triggerPrint()"
        style="background: #4f46e5; color: #ffffff; border: none; padding: 8px 18px; border-radius: 8px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 13px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);"
      >
        🖨️ প্রিন্ট করুন (Print Now)
      </button>
      <button
        onclick="window.close()"
        style="background: #334155; color: #f1f5f9; border: 1px solid rgba(255,255,255,0.1); padding: 8px 14px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 500;"
      >
        ✕ বন্ধ করুন
      </button>
    </div>
  </div>

  <!-- A4 Sheet with Left-Top Card Placement -->
  <div class="a4-preview-sheet">
    <div class="id-card-dock-left-top">
      ${clone.outerHTML}
    </div>
    <div class="screen-guide cut-guide-indicator"></div>
    <div class="sheet-watermark-note">
      <span>✂️ <strong>কাটিং গাইড:</strong> প্রিন্ট করার পর A4 কাগজের বাম-উপরের কোণা (Left Top Side) থেকে আইডি কার্ডটি সহজে কেটে নিতে পারবেন।</span>
      <span style="font-family: monospace; font-size: 10px; color: #94a3b8;">SIZE: 320×450 PX (ID-1)</span>
    </div>
  </div>

  <script>
    var isPrintTriggered = false;
    function triggerPrint() {
      if (isPrintTriggered) return;
      isPrintTriggered = true;
      try {
        window.focus();
        window.print();
      } catch (err) {
        console.warn('Auto print failed:', err);
      }
    }

    // 1. Wait for fonts to be ready
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function() {
        setTimeout(triggerPrint, 250);
      }).catch(function() {
        setTimeout(triggerPrint, 350);
      });
      // Safety fallback
      setTimeout(triggerPrint, 800);
    } else {
      setTimeout(triggerPrint, 400);
    }
  <\/script>
</body>
</html>`;

  try {
    const printWindow = window.open('', '_blank', 'width=1020,height=880,menubar=no,toolbar=no,location=no,status=no');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(printDoc);
      printWindow.document.close();
      return true;
    }
  } catch (e) {
    console.warn('[printIdCard] Popup open failed, falling back to iframe print:', e);
  }

  // Fallback to iframe print if popup blocked
  return printViaIframe(printDoc);
}
