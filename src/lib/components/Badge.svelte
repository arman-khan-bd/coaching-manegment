<script lang="ts">
  export let variant: 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'purple' = 'neutral';
  export let size: 'sm' | 'md' = 'sm';

  const variantStyles = {
    primary: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    success: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    warning: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    danger: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    neutral: 'bg-slate-700/40 text-slate-300 border-slate-600/40',
    purple: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  };

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-0.5 font-medium',
    md: 'text-xs px-3 py-1 font-semibold',
  };
</script>

<span class="inline-flex items-center gap-1.5 rounded-full border tracking-wide {variantStyles[variant]} {sizeStyles[size]}">
  <slot />
</span>
