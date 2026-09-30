<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { authClient } from '$lib/auth-client';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';

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

<div class="grid min-h-screen place-items-center bg-slate-100 px-4 py-10 font-['Inter_Variable',sans-serif]">
	<Card.Root class="w-full max-w-md shadow-lg">
		<Card.Header><Card.Title class="text-2xl">Admin sign in</Card.Title><Card.Description>Manage quizzes, students, and responses.</Card.Description></Card.Header>
		<Card.Content>
			<form class="grid gap-5" onsubmit={signIn}>
				<div class="grid gap-2"><Label for="admin-email">Email</Label><Input id="admin-email" type="email" autocomplete="email" bind:value={email} required /></div>
				<div class="grid gap-2"><Label for="admin-password">Password</Label><Input id="admin-password" type="password" autocomplete="current-password" bind:value={password} required /></div>
				{#if message}<p class="rounded-md bg-red-50 p-3 text-sm text-red-700" role="alert">{message}</p>{/if}
				<Button type="submit" disabled={loading} class="w-full">{loading ? 'Signing in…' : 'Sign in'}</Button>
			</form>
		</Card.Content>
	</Card.Root>
</div>
