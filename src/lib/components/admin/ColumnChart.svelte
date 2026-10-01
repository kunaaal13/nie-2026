<script lang="ts">
	import * as Tooltip from '$lib/components/ui/tooltip';

	// Single-series column chart. Every column has a hover/focus tooltip; sparse x labels avoid collisions.
	let { data, height = 160, labelEvery = 1, describe, label }: {
		data: { label: string; value: number }[];
		height?: number;
		labelEvery?: number;
		describe: (item: { label: string; value: number }) => string;
		label: string;
	} = $props();
	const max = $derived(Math.max(1, ...data.map((item) => item.value)));
	const ticks = $derived([max, Math.round(max / 2), 0]);
</script>

<figure aria-label={label}>
	<div class="grid grid-cols-[auto_1fr] gap-x-2">
		<div class="flex flex-col justify-between pb-6 text-right text-[11px] text-muted-foreground tabular-nums" style:height="{height + 24}px" aria-hidden="true">
			{#each ticks as tick}<span class="leading-none">{tick}</span>{/each}
		</div>
		<div>
			<div class="relative flex items-end gap-[2px] border-b border-border" style:height="{height}px">
				<div class="pointer-events-none absolute inset-x-0 top-0 border-t border-dashed border-border" aria-hidden="true"></div>
				<div class="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-border" aria-hidden="true"></div>
				{#each data as item}
					<Tooltip.Root>
						<Tooltip.Trigger class="group relative flex h-full min-w-0 flex-1 items-end outline-none" aria-label={describe(item)}>
							<span class="absolute inset-0 rounded-t-sm group-hover:bg-muted/70 group-focus-visible:bg-muted/70"></span>
							<span class="relative w-full rounded-t-[3px] bg-brand transition-[height] duration-200 group-hover:bg-primary" style:height="{item.value ? Math.max(2, (item.value / max) * 100) : 0}%"></span>
						</Tooltip.Trigger>
						<Tooltip.Content>{describe(item)}</Tooltip.Content>
					</Tooltip.Root>
				{/each}
			</div>
			<div class="flex h-6 gap-[2px] pt-1.5 text-[11px] text-muted-foreground" aria-hidden="true">
				{#each data as item, index}
					<span class="min-w-0 flex-1 overflow-visible text-center whitespace-nowrap">{index % labelEvery === 0 ? item.label : ''}</span>
				{/each}
			</div>
		</div>
	</div>
</figure>
