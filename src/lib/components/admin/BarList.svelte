<script lang="ts">
	// Horizontal ranked bars with labels and values in text ink; the bar carries magnitude only.
	let { items, valueLabel = (value: number) => String(value), empty = 'No data yet.' }: {
		items: { label: string; value: number; hint?: string; href?: string }[];
		valueLabel?: (value: number) => string;
		empty?: string;
	} = $props();
	const max = $derived(Math.max(1, ...items.map((item) => item.value)));
</script>

{#if items.length === 0}
	<p class="py-6 text-center text-sm text-muted-foreground">{empty}</p>
{:else}
	<ul class="grid gap-2.5">
		{#each items as item}
			<li class="grid gap-1">
				<div class="flex items-baseline justify-between gap-3 text-sm">
					{#if item.href}<a href={item.href} class="min-w-0 truncate hover:underline">{item.label}</a>{:else}<span class="min-w-0 truncate">{item.label}</span>{/if}
					<span class="shrink-0 tabular-nums text-muted-foreground">{valueLabel(item.value)}{#if item.hint}<span class="ml-1.5 text-xs">{item.hint}</span>{/if}</span>
				</div>
				<div class="h-1.5 rounded-full bg-muted">
					<div class="h-full rounded-full bg-brand transition-[width] duration-200" style:width="{(item.value / max) * 100}%"></div>
				</div>
			</li>
		{/each}
	</ul>
{/if}
