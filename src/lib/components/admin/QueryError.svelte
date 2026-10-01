<script lang="ts">
	import { CircleAlert } from '@lucide/svelte';
	import * as Alert from '$lib/components/ui/alert';
	import { Button } from '$lib/components/ui/button';

	let { error, retry }: { error: Error; retry?: () => void } = $props();
</script>

<Alert.Root variant="destructive">
	<CircleAlert />
	<Alert.Title>Couldn't load this page</Alert.Title>
	<Alert.Description>
		<p>{error.message}</p>
		{#if retry}<Button variant="outline" size="sm" class="mt-2" onclick={retry}>Try again</Button>{/if}
	</Alert.Description>
</Alert.Root>
