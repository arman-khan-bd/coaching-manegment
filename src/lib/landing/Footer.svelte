<script lang="ts">
  import { currentView } from '../store';
  import { GraduationCap, Heart, Shield, Mail, Phone, MapPin } from 'lucide-svelte';
</script>

<footer class="bg-slate-950 border-t border-slate-900 pt-16 pb-12 text-xs text-slate-400">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
      <!-- Brand -->
      <div class="md:col-span-1">
        <div class="flex items-center gap-2.5 mb-3">
          <div class="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
            <GraduationCap class="w-5 h-5" />
          </div>
          <span class="text-lg font-bold text-white font-['Outfit']">CoachFlow</span>
        </div>
        <p class="text-xs leading-relaxed text-slate-400">
          The premier Coaching, Tuition & Academy Management Software with Dual-Engine SMS Gateway and Batch Scheduling.
        </p>
      </div>

      <!-- Quick Links -->
      <div>
        <h4 class="font-bold text-white uppercase tracking-wider text-[11px] mb-3">Academic Engine</h4>
        <ul class="space-y-2">
          <li><button on:click={() => currentView.set('dashboard')} class="hover:text-indigo-400 transition-colors">Courses & Units</button></li>
          <li><button on:click={() => currentView.set('dashboard')} class="hover:text-indigo-400 transition-colors">Batch Capacities</button></li>
          <li><button on:click={() => currentView.set('dashboard')} class="hover:text-indigo-400 transition-colors">Student Registrations</button></li>
          <li><button on:click={() => currentView.set('dashboard')} class="hover:text-indigo-400 transition-colors">Faculty Schedules</button></li>
        </ul>
      </div>

      <!-- Modules -->
      <div>
        <h4 class="font-bold text-white uppercase tracking-wider text-[11px] mb-3">Communication & Finance</h4>
        <ul class="space-y-2">
          <li><button on:click={() => currentView.set('dashboard')} class="hover:text-indigo-400 transition-colors">Android SMS Gateway Hub</button></li>
          <li><button on:click={() => currentView.set('dashboard')} class="hover:text-indigo-400 transition-colors">Cloud SMS Packs</button></li>
          <li><button on:click={() => currentView.set('dashboard')} class="hover:text-indigo-400 transition-colors">Tuition Invoicing & Receipts</button></li>
          <li><button on:click={() => currentView.set('dashboard')} class="hover:text-indigo-400 transition-colors">Exam Report Cards</button></li>
        </ul>
      </div>

      <!-- Support & Contact -->
      <div>
        <h4 class="font-bold text-white uppercase tracking-wider text-[11px] mb-3">Platform Status</h4>
        <div class="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div class="flex items-center gap-2 text-emerald-400 font-medium">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>All Systems Operational</span>
          </div>
          <p class="text-[11px] text-slate-400">Android SMS Gateway App v3.4.1 Live</p>
        </div>
      </div>
    </div>

    <div class="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4">
      <p>© 2026 CoachFlow SaaS Technologies Inc. All rights reserved.</p>
      <div class="flex items-center gap-6">
        <button on:click={() => currentView.set('login')} class="hover:text-white transition-colors">Admin Portal</button>
        <button on:click={() => currentView.set('dashboard')} class="hover:text-white transition-colors">Interactive Demo</button>
        <button on:click={() => currentView.set('checkout')} class="hover:text-white transition-colors">Upgrade Plan</button>
      </div>
    </div>
  </div>
</footer>
