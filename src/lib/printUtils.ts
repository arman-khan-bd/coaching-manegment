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
  // Chromium requires real viewport dimensions (e.g. 1024x1400) and visibility:visible
  // to properly compute layout boxes and prevent blank white print previews.
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

        // Ensure fonts and stylesheets are fully loaded before triggering Chrome print
        if (win.document.fonts && typeof win.document.fonts.ready?.then === 'function') {
          win.document.fonts.ready
            .then(() => {
              setTimeout(doPrint, 200);
            })
            .catch(() => {
              setTimeout(doPrint, 250);
            });
          // Fallback safety timeout in case font promise hangs
          setTimeout(doPrint, 800);
        } else {
          setTimeout(doPrint, 300);
        }
        return true;
      }
    }
  } catch (err) {
    console.warn('Iframe print setup error, falling back to popup window:', err);
  }

  // SECONDARY FALLBACK: Clean popup window with auto-close
  return fallbackWindowPrint(printDoc);
}

function fallbackWindowPrint(html: string): boolean {
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
