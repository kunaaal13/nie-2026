<script lang="ts">
	import type { Snippet } from 'svelte';
	import * as Card from '$lib/components/ui/card';

	let { title, description, children }: { title: string; description: string; children: Snippet } = $props();
</script>

<div class="grid min-h-svh place-items-center bg-background px-4 py-10">
	<div class="w-full max-w-sm">
		<a href="/" class="mb-6 flex items-center gap-2.5">
			<span class="grid size-8 place-items-center rounded-sm bg-brand text-sm font-semibold text-white">N</span>
			<span class="text-sm font-medium tracking-[-0.02em]">NIE Read India <span class="text-muted-foreground">· Admin</span></span>
		</a>
		<Card.Root class="shadow-[var(--shadow-card)]">
			<Card.Header>
				<Card.Title class="text-xl font-medium tracking-[-0.02em]">{title}</Card.Title>
				<Card.Description>{description}</Card.Description>
			</Card.Header>
			<Card.Content>{@render children()}</Card.Content>
		</Card.Root>
	</div>
</div>
