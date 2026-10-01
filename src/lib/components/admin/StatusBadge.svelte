<script lang="ts">
	import { cn } from '$lib/utils';

	let { status, class: className }: { status: 'Draft' | 'Scheduled' | 'Active' | 'Closed'; class?: string } = $props();
	const styles = {
		Active: 'border-brand/30 bg-brand-soft text-accent-foreground',
		Scheduled: 'border-sky-200 bg-sky-50 text-sky-800',
		Closed: 'border-border bg-muted text-muted-foreground',
		Draft: 'border-dashed border-input bg-transparent text-muted-foreground'
	};
	const labels = { Active: 'Live', Scheduled: 'Scheduled', Closed: 'Closed', Draft: 'Draft' };
</script>

<span class={cn('inline-flex h-5 shrink-0 items-center gap-1.5 rounded-full border px-2 text-xs font-medium whitespace-nowrap', styles[status], className)}>
	<span class={cn('size-1.5 rounded-full bg-current', status === 'Active' && 'animate-pulse bg-brand')} aria-hidden="true"></span>
	{labels[status]}
</span>
