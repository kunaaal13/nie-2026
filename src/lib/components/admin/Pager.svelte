<script lang="ts">
	import { ChevronLeft, ChevronRight } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';

	let { page = $bindable(1), count, pageSize, noun = 'results' }: { page?: number; count: number; pageSize: number; noun?: string } = $props();
	const pages = $derived(Math.max(1, Math.ceil(count / pageSize)));
	const from = $derived(count === 0 ? 0 : (page - 1) * pageSize + 1);
	const to = $derived(Math.min(count, page * pageSize));
</script>

<div class="flex items-center justify-between gap-3 border-t px-4 py-3 text-sm">
	<p class="text-muted-foreground tabular-nums">{from}–{to} of {count.toLocaleString('en-IN')} {noun}</p>
	<div class="flex items-center gap-2">
		<span class="hidden text-muted-foreground tabular-nums sm:inline">Page {page} of {pages}</span>
		<Button variant="outline" size="icon-sm" aria-label="Previous page" disabled={page <= 1} onclick={() => page--}><ChevronLeft /></Button>
		<Button variant="outline" size="icon-sm" aria-label="Next page" disabled={page >= pages} onclick={() => page++}><ChevronRight /></Button>
	</div>
</div>
