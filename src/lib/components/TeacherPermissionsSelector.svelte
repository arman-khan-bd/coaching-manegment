<script lang="ts">
  import {
    TEACHER_PERMISSION_MODULES,
    TEACHER_PERMISSION_PRESETS,
    getAllTeacherPermissionIds,
    type TeacherPermissionModule,
  } from '../permissions';
  import {
    Sliders,
    CalendarClock,
    CalendarCheck,
    Users,
    BookOpen,
    FileText,
    Smartphone,
    QrCode,
    LayoutDashboard,
    Award,
    CheckCircle2,
    ShieldCheck,
    Check,
  } from 'lucide-svelte';

  export let permissions: string[] = [];
  export let label: string = 'শিক্ষক রোল লিমিট ও অ্যাক্সেস কন্ট্রোল (Role-Based Access Limit)';
  export let description: string = 'যেসব মডিউল ও ফিচারে টিক চিহ্ন দেওয়া হবে, শিক্ষক লগইন করলে ড্যাশবোর্ডে শুধুমাত্র সেগুলোই দেখতে ও পরিচালনা করতে পারবেন।';
  export let maxHeight: string = 'max-h-72';

  const iconMap: Record<string, any> = {
    CalendarClock,
    CalendarCheck,
    Users,
    BookOpen,
    FileText,
    Award,
    Smartphone,
    QrCode,
    LayoutDashboard,
  };

  function isModuleFullyChecked(module: TeacherPermissionModule): boolean {
    if (!module.subPermissions.length) return false;
    return module.subPermissions.every((s) => permissions.includes(s.id));
  }

  function isModulePartiallyChecked(module: TeacherPermissionModule): boolean {
    const hasSome = module.subPermissions.some((s) => permissions.includes(s.id));
    const hasAll = module.subPermissions.every((s) => permissions.includes(s.id));
    return hasSome && !hasAll;
  }

  function toggleModule(module: TeacherPermissionModule) {
    const subIds = module.subPermissions.map((s) => s.id);
    const allSelected = subIds.every((id) => permissions.includes(id));
    if (allSelected) {
      permissions = permissions.filter((id) => !subIds.includes(id));
    } else {
      const set = new Set([...permissions, ...subIds]);
      permissions = Array.from(set);
    }
  }

  function toggleSub(subId: string) {
    if (permissions.includes(subId)) {
      permissions = permissions.filter((id) => id !== subId);
    } else {
      permissions = [...permissions, subId];
    }
  }

  function applyPreset(presetPerms: string[]) {
    permissions = [...presetPerms];
  }
</script>

<div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3.5 shadow-inner">
  <!-- Header -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
    <div>
      <h5 class="font-bold text-white text-xs flex items-center gap-1.5 font-['Outfit']">
        <Sliders class="w-4 h-4 text-indigo-400" />
        <span>{label}</span>
      </h5>
      {#if description}
        <p class="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{description}</p>
      {/if}
    </div>
    <span class="self-start sm:self-auto text-[10px] font-bold text-indigo-300 bg-indigo-500/15 px-2.5 py-1 rounded-full border border-indigo-500/30 whitespace-nowrap">
      {permissions.length} টি পারমিশন নির্বাচিত
    </span>
  </div>

  <!-- Quick Presets -->
  <div class="space-y-1.5 pt-2 border-t border-slate-800/80">
    <span class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">কুইক প্রিসেট (Quick Presets):</span>
    <div class="flex flex-wrap gap-1.5">
      {#each TEACHER_PERMISSION_PRESETS as preset}
        {@const isActive =
          permissions.length === preset.permissions.length &&
          preset.permissions.every((p) => permissions.includes(p))}
        <button
          type="button"
          class="px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1
          {isActive
            ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30 font-semibold'
            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}"
          on:click={() => applyPreset(preset.permissions)}
        >
          {#if isActive}
            <Check class="w-3 h-3 text-white" />
          {/if}
          <span>{preset.name}</span>
        </button>
      {/each}
    </div>
  </div>

  <!-- Modules List with Sub-Permissions -->
  <div class="space-y-2.5 pt-1 {maxHeight} overflow-y-auto pr-1">
    {#each TEACHER_PERMISSION_MODULES as mod}
      {@const isFull = isModuleFullyChecked(mod)}
      {@const isPart = isModulePartiallyChecked(mod)}
      {@const IconComp = iconMap[mod.iconName] || BookOpen}
      <div
        class="p-3 rounded-xl bg-slate-950/70 border transition-all duration-150
        {isFull
          ? 'border-indigo-500/40 bg-indigo-950/10'
          : isPart
            ? 'border-indigo-500/20'
            : 'border-slate-800/80'}"
      >
        <!-- Module header with Select All Toggle -->
        <div class="flex items-center justify-between pb-2 border-b border-slate-800/60">
          <label class="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isFull}
              indeterminate={isPart}
              class="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700 focus:ring-indigo-500"
              on:change={() => toggleModule(mod)}
            />
            <span class="font-bold text-white text-xs flex items-center gap-1.5">
              <svelte:component this={IconComp} class="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>{mod.label}</span>
            </span>
          </label>
          <span class="text-[10px] text-slate-400 font-mono">
            {mod.subPermissions.filter((s) => permissions.includes(s.id)).length}/{mod.subPermissions.length}
          </span>
        </div>

        <!-- Sub-permissions checkboxes -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2.5">
          {#each mod.subPermissions as sub}
            {@const isChecked = permissions.includes(sub.id)}
            <label
              class="flex items-start gap-2 p-2 rounded-lg cursor-pointer transition-all duration-150 select-none
              {isChecked
                ? 'bg-indigo-950/25 border border-indigo-500/30'
                : 'bg-slate-900/40 border border-slate-800/40 hover:bg-slate-900'}"
            >
              <input
                type="checkbox"
                checked={isChecked}
                class="w-3.5 h-3.5 rounded text-indigo-600 bg-slate-950 border-slate-700 focus:ring-indigo-500 mt-0.5"
                on:change={() => toggleSub(sub.id)}
              />
              <div class="min-w-0">
                <span class="block text-[11px] font-semibold {isChecked ? 'text-indigo-200' : 'text-slate-300'} leading-tight">
                  {sub.label}
                </span>
                <span class="block text-[9px] text-slate-400 leading-snug mt-0.5">
                  {sub.description}
                </span>
              </div>
            </label>
          {/each}
        </div>
      </div>
    {/each}
  </div>
</div>
