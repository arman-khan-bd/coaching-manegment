<script lang="ts">
  import { instituteSettings, showToast } from '../store';
  import { Settings, Save, Download, RefreshCw, ShieldCheck, Smartphone, Building, Database } from 'lucide-svelte';

  let name = $instituteSettings.name;
  let tagline = $instituteSettings.tagline;
  let email = $instituteSettings.email;
  let phone = $instituteSettings.phone;
  let address = $instituteSettings.address;
  let currency = $instituteSettings.currency;
  let academicYear = $instituteSettings.academicYear;
  let defaultSmsGateway = $instituteSettings.defaultSmsGateway;

  function handleSaveSettings() {
    instituteSettings.update((curr) => ({
      ...curr,
      name,
      tagline,
      email,
      phone,
      address,
      currency,
      academicYear,
      defaultSmsGateway,
    }));
    showToast('success', 'Settings Saved', 'Coaching institute preferences updated successfully.');
  }

  function handleExportBackup() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify($instituteSettings, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `coachflow_backup_${Date.now()}.json`);
    dlAnchorElem.click();
    showToast('success', 'Backup Exported', 'Full database snapshot downloaded to your device.');
  }
</script>

<div class="max-w-4xl space-y-6">
  <!-- Header -->
  <div>
    <h2 class="text-2xl font-bold text-white font-['Outfit']">Institute Settings & Configuration</h2>
    <p class="text-xs text-slate-400 mt-1">Manage academy brand assets, currency, default SMS gateways, and backups.</p>
  </div>

  <div class="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 shadow-xl space-y-6 text-xs">
    <!-- Section 1: Academy Profile -->
    <div>
      <div class="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
        <Building class="w-4 h-4 text-indigo-400" />
        <h3 class="text-sm font-bold text-white">General Academy Information</h3>
      </div>

      <div class="space-y-4">
        <div>
          <label for="set-inst-name" class="block font-medium text-slate-300 mb-1">Coaching Institute Name</label>
          <input
            id="set-inst-name"
            type="text"
            bind:value={name}
            class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label for="set-tagline" class="block font-medium text-slate-300 mb-1">Tagline / Motto</label>
          <input
            id="set-tagline"
            type="text"
            bind:value={tagline}
            class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label for="set-email" class="block font-medium text-slate-300 mb-1">Official Contact Email</label>
            <input
              id="set-email"
              type="email"
              bind:value={email}
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label for="set-phone" class="block font-medium text-slate-300 mb-1">Helpline Phone</label>
            <input
              id="set-phone"
              type="text"
              bind:value={phone}
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div>
          <label for="set-address" class="block font-medium text-slate-300 mb-1">Campus Physical Address</label>
          <input
            id="set-address"
            type="text"
            bind:value={address}
            class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>
    </div>

    <!-- Section 2: Regional & Gateways -->
    <div>
      <div class="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
        <Smartphone class="w-4 h-4 text-emerald-400" />
        <h3 class="text-sm font-bold text-white">Default SMS Routing & Currency</h3>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label for="set-year" class="block font-medium text-slate-300 mb-1">Current Academic Year</label>
          <input
            id="set-year"
            type="text"
            bind:value={academicYear}
            class="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label for="set-curr" class="block font-medium text-slate-300 mb-1">System Currency</label>
          <select
            id="set-curr"
            bind:value={currency}
            class="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="USD">USD ($)</option>
            <option value="INR">INR (₹)</option>
            <option value="BDT">BDT (৳)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
          </select>
        </div>

        <div>
          <label for="set-def-sms" class="block font-medium text-slate-300 mb-1">Default SMS Route</label>
          <select
            id="set-def-sms"
            bind:value={defaultSmsGateway}
            class="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="android">Android Phone SIM (Free)</option>
            <option value="cloud">Cloud SMS Wallet</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Section 3: Data Safety & Backups -->
    <div>
      <div class="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
        <Database class="w-4 h-4 text-amber-400" />
        <h3 class="text-sm font-bold text-white">Data Backups & Export</h3>
      </div>

      <div class="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 class="font-bold text-white">Full Institute JSON Snapshot</h4>
          <p class="text-slate-400 text-[11px] mt-0.5">Download your complete database of students, batches, attendance logs & fees.</p>
        </div>
        <button
          type="button"
          class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors flex items-center gap-1.5 shrink-0"
          on:click={handleExportBackup}
        >
          <Download class="w-4 h-4" />
          <span>Export Database JSON</span>
        </button>
      </div>
    </div>

    <!-- Save Button -->
    <div class="pt-4 flex justify-end border-t border-slate-800">
      <button
        type="button"
        class="px-6 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all flex items-center gap-2"
        on:click={handleSaveSettings}
      >
        <Save class="w-4 h-4" />
        <span>Save Institute Settings</span>
      </button>
    </div>
  </div>
</div>
