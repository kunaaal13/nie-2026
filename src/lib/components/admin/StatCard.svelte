<script lang="ts">
	import type { Component, Snippet } from 'svelte';
	import * as Card from '$lib/components/ui/card';
	import { Progress } from '$lib/components/ui/progress';

	let { label, value, hint, icon: Icon, progress, footer }: {
		label: string;
		value: string | number;
		hint?: string;
		icon?: Component<{ class?: string }>;
		progress?: number;
		footer?: Snippet;
	} = $props();
</script>

<Card.Root class="gap-0 py-0 shadow-[var(--shadow-card)]">
	<Card.Content class="flex h-full flex-col gap-3 p-5">
		<div class="flex items-center justify-between gap-3">
			<p class="text-sm text-muted-foreground">{label}</p>
			{#if Icon}<span class="grid size-7 place-items-center rounded-sm bg-brand-soft text-primary"><Icon class="size-3.5" /></span>{/if}
		</div>
		<p class="text-[2rem] leading-none font-medium tracking-[-0.03em] tabular-nums">{value}</p>
		{#if progress !== undefined}<Progress value={Math.min(100, progress)} max={100} class="h-1" aria-label={label} />{/if}
		{#if hint}<p class="mt-auto text-xs text-muted-foreground">{hint}</p>{/if}
		{@render footer?.()}
	</Card.Content>
</Card.Root>
