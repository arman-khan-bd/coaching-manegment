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

  // Build standalone self-contained printable HTML document
  const printDoc = `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=Dancing+Script:wght@600;700&family=Hind+Siliguri:wght@400;500;600;700&family=Noto+Sans+Bengali:wght@400;500;600;700;800&family=Outfit:wght@500;600;700;800&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
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
      padding: 0 !important;
      margin: 0 !important;
    }

    .printable-root {
      width: 100% !important;
      max-width: 100% !important;
      margin: 0 auto !important;
      background: #ffffff !important;
      color: #0f172a !important;
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
    .shadow-xl, .shadow-2xl, .shadow-md, .shadow-sm { box-shadow: none !important; }

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
  <script>
    function triggerPrint() {
      try {
        window.focus();
        window.print();
      } catch (err) {
        console.warn('Print error:', err);
      }
    }
    if (document.readyState === 'complete') {
      setTimeout(triggerPrint, 350);
    } else {
      window.addEventListener('load', function() {
        setTimeout(triggerPrint, 350);
      });
      // Safety timeout in case load event already occurred
      setTimeout(triggerPrint, 700);
    }
  <\/script>
</body>
</html>`;

  // Use popup window with parent-side print trigger
  const printWindow = window.open('', '_blank', 'width=960,height=800,menubar=no,toolbar=no,location=no,status=no');
  if (printWindow) {
    try {
      printWindow.document.open();
      printWindow.document.write(printDoc);
      printWindow.document.close();
      setTimeout(() => {
        try {
          printWindow.focus();
          printWindow.print();
        } catch (e) {
          // Handled by child script
        }
      }, 500);
      return true;
    } catch (e) {
      console.warn('Popup write failed, falling back to iframe:', e);
    }
  }

  // Fallback: if popup blocked, use hidden iframe
  try {
    let iframe = document.getElementById('cf-print-iframe') as HTMLIFrameElement;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'cf-print-iframe';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
    }
    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(printDoc);
      doc.close();
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (e) {
          console.error('Iframe print invocation error:', e);
        }
      }, 500);
      return true;
    }
  } catch (err) {
    console.error('Print iframe error:', err);
  }

  // Final fallback to native print
  window.print();
  return true;
}
