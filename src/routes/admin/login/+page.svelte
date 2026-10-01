<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { authClient } from '$lib/auth-client';
	import { Button } from '$lib/components/ui/button';
	import * as Field from '$lib/components/ui/field';
	import * as Alert from '$lib/components/ui/alert';
	import { Input } from '$lib/components/ui/input';
	import AuthShell from '$lib/components/admin/AuthShell.svelte';

	let email = $state('');
	let password = $state('');
	let loading = $state(false);
	let message = $state('');

	async function signIn(event: SubmitEvent) {
		event.preventDefault();
		if (loading) return;
		loading = true;
		message = '';
		try {
			const result = await authClient.signIn.email({ email, password });
			if (result.error) throw new Error(result.error.message ?? 'Sign in failed.');
			await invalidateAll();
			await goto('/admin');
		} catch (cause) {
			message = cause instanceof Error ? cause.message : 'Sign in failed.';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head><title>Admin sign in — NIE Read India</title></svelte:head>

<AuthShell title="Sign in" description="Manage quizzes, students and responses.">
	<form class="grid gap-5" onsubmit={signIn}>
		<Field.Field>
			<Field.Label for="admin-email">Email</Field.Label>
			<Input id="admin-email" type="email" autocomplete="email" bind:value={email} required />
		</Field.Field>
		<Field.Field>
			<Field.Label for="admin-password">Password</Field.Label>
			<Input id="admin-password" type="password" autocomplete="current-password" bind:value={password} required />
		</Field.Field>
		{#if message}<Alert.Root variant="destructive"><Alert.Description>{message}</Alert.Description></Alert.Root>{/if}
		<Button type="submit" disabled={loading} class="w-full">{loading ? 'Signing in…' : 'Sign in'}</Button>
	</form>
</AuthShell>
