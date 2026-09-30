<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';
	import { LayoutDashboard, ClipboardList, Users, FileText, LogOut, Menu, X } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import { authClient } from '$lib/auth-client';
	import type { LayoutData } from './$types';
	import type { Snippet } from 'svelte';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();
	const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } } });
	let menuOpen = $state(false);
	const links = [
		{ href: '/admin', label: 'Overview', icon: LayoutDashboard },
		{ href: '/admin/quizzes', label: 'Quizzes', icon: ClipboardList },
		{ href: '/admin/responses', label: 'Responses', icon: FileText },
		{ href: '/admin/students', label: 'Students', icon: Users }
	];

	async function signOut() {
		await authClient.signOut();
		queryClient.clear();
		await invalidateAll();
		await goto('/admin/login');
	}
</script>

<QueryClientProvider client={queryClient}>
	{#if data.admin}
		<div class="min-h-screen bg-[#f5f7f7] font-['Inter_Variable',sans-serif] text-slate-900">
			<header class="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 md:hidden">
				<a class="font-black tracking-tight text-[#087a4b]" href="/admin">NIE Read India <span class="text-slate-900">Admin</span></a>
				<Button variant="ghost" size="icon" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} onclick={() => menuOpen = !menuOpen}>{#if menuOpen}<X class="size-5" />{:else}<Menu class="size-5" />{/if}</Button>
			</header>
			<div class="mx-auto flex max-w-[1800px]">
				<aside class:translate-x-0={menuOpen} class="fixed inset-y-16 left-0 z-30 w-64 -translate-x-full border-r border-slate-200 bg-white p-5 transition-transform md:sticky md:top-0 md:h-screen md:translate-x-0 md:shrink-0">
					<a class="mb-8 hidden text-xl font-black tracking-tight text-[#087a4b] md:block" href="/admin">NIE Read India <span class="block text-sm font-semibold text-slate-500">Admin dashboard</span></a>
					<nav class="grid gap-1" aria-label="Admin navigation">
						{#each links as link}
							<a href={link.href} onclick={() => menuOpen = false} aria-current={page.url.pathname === link.href ? 'page' : undefined} class:font-semibold={page.url.pathname === link.href} class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-100 aria-[current=page]:bg-emerald-50 aria-[current=page]:text-emerald-800">
								<link.icon class="size-4" />{link.label}
							</a>
						{/each}
					</nav>
					<div class="absolute right-5 bottom-5 left-5 border-t border-slate-200 pt-4">
						<p class="truncate text-sm font-medium">{data.admin.name}</p>
						<p class="mb-3 truncate text-xs text-slate-500">{data.admin.email}</p>
						<Button variant="outline" class="w-full justify-start gap-2" onclick={signOut}><LogOut class="size-4" /> Sign out</Button>
					</div>
				</aside>
				<main class="min-w-0 flex-1 px-4 py-6 sm:px-6 md:px-8 md:py-9">{@render children()}</main>
			</div>
		</div>
	{:else}
		{@render children()}
	{/if}
</QueryClientProvider>
