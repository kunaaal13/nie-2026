<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';
	import { ChevronsUpDown, ClipboardList, ExternalLink, FileText, LayoutDashboard, LogOut, Plus, Users } from '@lucide/svelte';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Avatar from '$lib/components/ui/avatar';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import { Toaster } from '$lib/components/ui/sonner';
	import { authClient } from '$lib/auth-client';
	import type { LayoutData } from './$types';
	import type { Snippet } from 'svelte';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();
	const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } } });
	const links = [
		{ href: '/admin', label: 'Overview', icon: LayoutDashboard },
		{ href: '/admin/quizzes', label: 'Quizzes', icon: ClipboardList },
		{ href: '/admin/responses', label: 'Responses', icon: FileText },
		{ href: '/admin/students', label: 'Students', icon: Users }
	];
	const isActive = (href: string) => href === '/admin' ? page.url.pathname === href : page.url.pathname.startsWith(href);
	const initials = $derived((data.admin?.name ?? '').split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'A');

	async function signOut() {
		await authClient.signOut();
		queryClient.clear();
		await invalidateAll();
		await goto('/admin/login');
	}
</script>

<div data-admin-shell class="contents">
	<QueryClientProvider client={queryClient}>
		{#if data.admin}
			<Sidebar.Provider>
				<Sidebar.Root collapsible="icon">
					<Sidebar.Header class="h-14 justify-center border-b">
						<Sidebar.Menu>
							<Sidebar.MenuItem>
								<Sidebar.MenuButton size="lg" class="hover:bg-transparent">
									{#snippet child({ props })}
										<a href="/admin" {...props}>
											<span class="grid size-8 shrink-0 place-items-center rounded-sm bg-brand text-sm font-semibold text-white">N</span>
											<span class="grid leading-tight">
												<span class="truncate text-sm font-medium tracking-[-0.02em]">NIE Read India</span>
												<span class="truncate text-xs text-muted-foreground">Quiz admin</span>
											</span>
										</a>
									{/snippet}
								</Sidebar.MenuButton>
							</Sidebar.MenuItem>
						</Sidebar.Menu>
					</Sidebar.Header>
					<Sidebar.Content>
						<Sidebar.Group>
							<Sidebar.GroupLabel>Dashboard</Sidebar.GroupLabel>
							<Sidebar.Menu>
								{#each links as link}
									<Sidebar.MenuItem>
										<Sidebar.MenuButton isActive={isActive(link.href)} tooltipContent={link.label}>
											{#snippet child({ props })}
												<a href={link.href} aria-current={isActive(link.href) ? 'page' : undefined} {...props}><link.icon /><span>{link.label}</span></a>
											{/snippet}
										</Sidebar.MenuButton>
									</Sidebar.MenuItem>
								{/each}
							</Sidebar.Menu>
						</Sidebar.Group>
						<Sidebar.Group>
							<Sidebar.GroupLabel>Shortcuts</Sidebar.GroupLabel>
							<Sidebar.Menu>
								<Sidebar.MenuItem>
									<Sidebar.MenuButton tooltipContent="New quiz">
										{#snippet child({ props })}<a href="/admin/quizzes/new" {...props}><Plus /><span>New quiz</span></a>{/snippet}
									</Sidebar.MenuButton>
								</Sidebar.MenuItem>
								<Sidebar.MenuItem>
									<Sidebar.MenuButton tooltipContent="Open public site">
										{#snippet child({ props })}<a href="/" target="_blank" rel="noopener" {...props}><ExternalLink /><span>Public site</span></a>{/snippet}
									</Sidebar.MenuButton>
								</Sidebar.MenuItem>
							</Sidebar.Menu>
						</Sidebar.Group>
					</Sidebar.Content>
					<Sidebar.Footer class="border-t">
						<Sidebar.Menu>
							<Sidebar.MenuItem>
								<DropdownMenu.Root>
									<DropdownMenu.Trigger>
										{#snippet child({ props })}
											<Sidebar.MenuButton size="lg" {...props}>
												<Avatar.Root class="size-8 rounded-sm"><Avatar.Fallback class="rounded-sm bg-secondary text-xs">{initials}</Avatar.Fallback></Avatar.Root>
												<span class="grid min-w-0 flex-1 leading-tight">
													<span class="truncate text-sm font-medium">{data.admin?.name}</span>
													<span class="truncate text-xs text-muted-foreground">{data.admin?.email}</span>
												</span>
												<ChevronsUpDown class="ml-auto text-muted-foreground" />
											</Sidebar.MenuButton>
										{/snippet}
									</DropdownMenu.Trigger>
									<DropdownMenu.Content side="top" align="start" class="w-(--bits-dropdown-menu-anchor-width) min-w-56">
										<DropdownMenu.Label class="font-normal">
											<span class="block text-sm font-medium text-foreground">{data.admin?.name}</span>
											<span class="block truncate text-xs text-muted-foreground">{data.admin?.email}</span>
										</DropdownMenu.Label>
										<DropdownMenu.Separator />
										<DropdownMenu.Item onclick={signOut}><LogOut /> Sign out</DropdownMenu.Item>
									</DropdownMenu.Content>
								</DropdownMenu.Root>
							</Sidebar.MenuItem>
						</Sidebar.Menu>
					</Sidebar.Footer>
					<Sidebar.Rail />
				</Sidebar.Root>
				<Sidebar.Inset class="min-w-0">
					<header class="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background/90 px-4 backdrop-blur-sm">
						<Sidebar.Trigger class="-ml-1.5" />
						<Separator orientation="vertical" class="mr-1 data-[orientation=vertical]:h-4" />
						<p class="text-sm text-muted-foreground">All times in <abbr title="India Standard Time, UTC+5:30" class="no-underline">IST</abbr></p>
						<Button href="/admin/quizzes/new" size="sm" class="ml-auto"><Plus /> New quiz</Button>
					</header>
					<main class="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">{@render children()}</main>
				</Sidebar.Inset>
			</Sidebar.Provider>
		{:else}
			{@render children()}
		{/if}
		<Toaster theme="light" position="bottom-right" richColors closeButton />
	</QueryClientProvider>
</div>
