<script lang="ts">
	import { goto } from '$app/navigation';
	import { setupAdmin } from './setup.remote';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let token = $state('');
	let name = $state('');
	let email = $state('');
	let password = $state('');
	let loading = $state(false);
	let message = $state('');

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		loading = true;
		message = '';
		try {
			await setupAdmin({ token, name, email, password });
			await goto('/admin/login');
		} catch (cause) {
			message = cause instanceof Error ? cause.message : 'Setup failed.';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head><title>Set up admin — NIE Read India</title></svelte:head>

<div class="grid min-h-screen place-items-center bg-slate-100 px-4 py-10 font-['Inter_Variable',sans-serif]">
	<Card.Root class="w-full max-w-md shadow-lg">
		<Card.Header><Card.Title class="text-2xl">Create the first admin</Card.Title><Card.Description>Use the one-time setup token from the deployment owner.</Card.Description></Card.Header>
		<Card.Content>
			{#if !data.available}
				<p class="text-sm text-slate-600">Admin setup is unavailable or already complete. <a class="font-semibold text-emerald-700 underline" href="/admin/login">Go to sign in</a>.</p>
			{:else}
				<form class="grid gap-4" onsubmit={submit}>
					<div class="grid gap-2"><Label for="setup-token">Setup token</Label><Input id="setup-token" type="password" bind:value={token} required /></div>
					<div class="grid gap-2"><Label for="setup-name">Name</Label><Input id="setup-name" autocomplete="name" bind:value={name} required /></div>
					<div class="grid gap-2"><Label for="setup-email">Email</Label><Input id="setup-email" type="email" autocomplete="email" bind:value={email} required /></div>
					<div class="grid gap-2"><Label for="setup-password">Password</Label><Input id="setup-password" type="password" autocomplete="new-password" minlength={12} bind:value={password} required /></div>
					{#if message}<p class="rounded-md bg-red-50 p-3 text-sm text-red-700" role="alert">{message}</p>{/if}
					<Button type="submit" disabled={loading} class="w-full">{loading ? 'Creating…' : 'Create admin'}</Button>
				</form>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
