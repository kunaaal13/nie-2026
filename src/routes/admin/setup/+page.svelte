<script lang="ts">
	import { goto } from '$app/navigation';
	import { setupAdmin } from './setup.remote';
	import { Button } from '$lib/components/ui/button';
	import * as Field from '$lib/components/ui/field';
	import * as Alert from '$lib/components/ui/alert';
	import { Input } from '$lib/components/ui/input';
	import AuthShell from '$lib/components/admin/AuthShell.svelte';
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

<AuthShell title="Create the first admin" description="Use the one-time setup token from the deployment owner.">
	{#if !data.available}
		<p class="text-sm text-muted-foreground">Admin setup is unavailable or already complete. <a class="font-medium text-primary underline underline-offset-4" href="/admin/login">Go to sign in</a>.</p>
	{:else}
		<form class="grid gap-5" onsubmit={submit}>
			<Field.Field><Field.Label for="setup-token">Setup token</Field.Label><Input id="setup-token" type="password" bind:value={token} required /></Field.Field>
			<Field.Field><Field.Label for="setup-name">Name</Field.Label><Input id="setup-name" autocomplete="name" bind:value={name} required /></Field.Field>
			<Field.Field><Field.Label for="setup-email">Email</Field.Label><Input id="setup-email" type="email" autocomplete="email" bind:value={email} required /></Field.Field>
			<Field.Field>
				<Field.Label for="setup-password">Password</Field.Label>
				<Input id="setup-password" type="password" autocomplete="new-password" minlength={12} bind:value={password} required />
				<Field.Description>At least 12 characters.</Field.Description>
			</Field.Field>
			{#if message}<Alert.Root variant="destructive"><Alert.Description>{message}</Alert.Description></Alert.Root>{/if}
			<Button type="submit" disabled={loading} class="w-full">{loading ? 'Creating…' : 'Create admin'}</Button>
		</form>
	{/if}
</AuthShell>
