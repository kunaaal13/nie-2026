<script lang="ts">
	import type { Snippet } from 'svelte';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb';

	let { title, description, crumbs = [], actions, meta }: {
		title: string;
		description?: string;
		crumbs?: { href: string; label: string }[];
		actions?: Snippet;
		meta?: Snippet;
	} = $props();
</script>

<header class="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
	<div class="min-w-0">
		{#if crumbs.length}
			<Breadcrumb.Root class="mb-3">
				<Breadcrumb.List>
					{#each crumbs as crumb}
						<Breadcrumb.Item><Breadcrumb.Link href={crumb.href}>{crumb.label}</Breadcrumb.Link></Breadcrumb.Item>
						<Breadcrumb.Separator />
					{/each}
					<Breadcrumb.Item><Breadcrumb.Page class="max-w-56 truncate">{title}</Breadcrumb.Page></Breadcrumb.Item>
				</Breadcrumb.List>
			</Breadcrumb.Root>
		{/if}
		<div class="flex flex-wrap items-center gap-2.5">
			<h1 class="text-2xl leading-none font-medium tracking-[-0.025em] text-balance sm:text-[2rem]">{title}</h1>
			{@render meta?.()}
		</div>
		{#if description}<p class="mt-2.5 max-w-2xl text-sm text-pretty text-muted-foreground">{description}</p>{/if}
	</div>
	{#if actions}<div class="flex shrink-0 flex-wrap items-center gap-2">{@render actions()}</div>{/if}
</header>
