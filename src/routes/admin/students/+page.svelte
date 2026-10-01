<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { createQuery, keepPreviousData } from '@tanstack/svelte-query';
	import { Download, Search, X } from '@lucide/svelte';
	import { listStudents } from '$lib/admin.remote';
	import { formatIstDate, formatNumber } from '$lib/ist';
	import * as Card from '$lib/components/ui/card';
	import * as Select from '$lib/components/ui/select';
	import * as Table from '$lib/components/ui/table';
	import * as Tabs from '$lib/components/ui/tabs';
	import * as InputGroup from '$lib/components/ui/input-group';
	import * as Empty from '$lib/components/ui/empty';
	import { Button } from '$lib/components/ui/button';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import PageHeader from '$lib/components/admin/PageHeader.svelte';
	import Pager from '$lib/components/admin/Pager.svelte';
	import QueryError from '$lib/components/admin/QueryError.svelte';

	type Sort = 'recent' | 'oldest' | 'name' | 'attempts';
	type Participation = 'all' | 'attempted' | 'never';
	const sorts: Record<Sort, string> = { recent: 'Newest first', oldest: 'Oldest first', name: 'Name A–Z', attempts: 'Most quizzes taken' };
	const params = page.url.searchParams;

	let searchDraft = $state(params.get('search') ?? '');
	let search = $state(page.url.searchParams.get('search') ?? '');
	let className = $state(params.get('class') ?? '');
	let city = $state(params.get('city') ?? '');
	let participation = $state<Participation>((['attempted', 'never'] as const).find((value) => value === params.get('took')) ?? 'all');
	let sort = $state<Sort>(params.get('sort') as Sort in sorts ? params.get('sort') as Sort : 'recent');
	let currentPage = $state(1);

	const students = createQuery(() => ({
		queryKey: ['admin', 'students', search, className, city, participation, sort, currentPage],
		queryFn: () => listStudents({ search, className: className || undefined, city: city || undefined, participation, sort, page: currentPage }),
		placeholderData: keepPreviousData
	}));
	const filtered = $derived(Boolean(search || className || city || participation !== 'all'));

	$effect(() => {
		const value = searchDraft.trim();
		const timer = setTimeout(() => { if (value !== search) { search = value; currentPage = 1; } }, 300);
		return () => clearTimeout(timer);
	});
	$effect(() => {
		const url = new URL(page.url);
		for (const [key, value] of [['search', search], ['class', className], ['city', city], ['took', participation === 'all' ? '' : participation], ['sort', sort === 'recent' ? '' : sort]]) {
			if (value) url.searchParams.set(key, value); else url.searchParams.delete(key);
		}
		if (url.search !== page.url.search) goto(url, { replaceState: true, keepFocus: true, noScroll: true });
	});

	function clearFilters() {
		searchDraft = ''; search = ''; className = ''; city = ''; participation = 'all'; currentPage = 1;
	}
</script>

<svelte:head><title>Students — NIE Read India Admin</title></svelte:head>

<PageHeader title="Students" description="Everyone who registered on the landing page, with how many quizzes they've taken.">
	{#snippet actions()}<Button variant="outline" href="/admin/export/students" download><Download /> Export CSV</Button>{/snippet}
</PageHeader>

<Card.Root class="gap-0 py-0">
	<div class="grid gap-2 border-b p-3">
		<div class="flex flex-col gap-2 md:flex-row md:items-center">
			<InputGroup.Root class="md:max-w-80">
				<InputGroup.Addon><Search /></InputGroup.Addon>
				<InputGroup.Input placeholder="Search name, email or school" aria-label="Search students" bind:value={searchDraft} />
				{#if searchDraft}<InputGroup.Addon align="inline-end"><InputGroup.Button size="icon-xs" aria-label="Clear search" onclick={() => searchDraft = ''}><X /></InputGroup.Button></InputGroup.Addon>{/if}
			</InputGroup.Root>
			<Select.Root type="single" bind:value={className} onValueChange={() => currentPage = 1}>
				<Select.Trigger class="w-full md:w-36" aria-label="Filter by class">{className ? `Class ${className}` : 'All classes'}</Select.Trigger>
				<Select.Content>
					<Select.Item value="">All classes</Select.Item>
					{#each students.data?.facets.classes ?? [] as value}<Select.Item {value} label={`Class ${value}`}>Class {value}</Select.Item>{/each}
				</Select.Content>
			</Select.Root>
			<Select.Root type="single" bind:value={city} onValueChange={() => currentPage = 1}>
				<Select.Trigger class="w-full md:w-40" aria-label="Filter by city"><span class="truncate">{city || 'All cities'}</span></Select.Trigger>
				<Select.Content>
					<Select.Item value="">All cities</Select.Item>
					{#each students.data?.facets.cities ?? [] as value}<Select.Item {value} label={value}>{value}</Select.Item>{/each}
				</Select.Content>
			</Select.Root>
			<Select.Root type="single" bind:value={sort} onValueChange={() => currentPage = 1}>
				<Select.Trigger class="w-full md:ml-auto md:w-48" aria-label="Sort students">{sorts[sort]}</Select.Trigger>
				<Select.Content>{#each Object.entries(sorts) as [value, label]}<Select.Item {value} {label}>{label}</Select.Item>{/each}</Select.Content>
			</Select.Root>
		</div>
		<Tabs.Root bind:value={participation} onValueChange={() => currentPage = 1}>
			<Tabs.List>
				<Tabs.Trigger value="all">Everyone</Tabs.Trigger>
				<Tabs.Trigger value="attempted">Took a quiz</Tabs.Trigger>
				<Tabs.Trigger value="never">Never took one</Tabs.Trigger>
			</Tabs.List>
		</Tabs.Root>
	</div>

	{#if students.isPending}
		<div class="grid gap-2 p-4">{#each Array(8) as _}<Skeleton class="h-11" />{/each}</div>
	{:else if students.isError}
		<div class="p-4"><QueryError error={students.error} retry={() => students.refetch()} /></div>
	{:else if students.data.count === 0}
		<Empty.Root class="py-16">
			<Empty.Header>
				<Empty.Title>{filtered ? 'No matching students' : 'No registrations yet'}</Empty.Title>
				<Empty.Description>{filtered ? 'Try a different search or filter.' : 'Students appear here after they register on the landing page.'}</Empty.Description>
			</Empty.Header>
			{#if filtered}<Empty.Content><Button variant="outline" onclick={clearFilters}>Clear filters</Button></Empty.Content>{/if}
		</Empty.Root>
	{:else}
		<div class={['transition-opacity', students.isPlaceholderData && 'opacity-60']}>
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head class="pl-4">Student</Table.Head>
						<Table.Head>Class</Table.Head>
						<Table.Head>School</Table.Head>
						<Table.Head class="text-right">Quizzes</Table.Head>
						<Table.Head class="text-right">Avg. score</Table.Head>
						<Table.Head class="pr-4">Registered</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each students.data.rows as student (student.id)}
						<Table.Row class="relative">
							<Table.Cell class="max-w-64 pl-4">
								<a href={`/admin/students/${student.id}`} class="block truncate font-medium after:absolute after:inset-0 hover:underline">{student.fullName}</a>
								<span class="block truncate text-xs text-muted-foreground">{student.email}</span>
							</Table.Cell>
							<Table.Cell class="whitespace-nowrap">{student.className}{student.section ? ` · ${student.section}` : ''}</Table.Cell>
							<Table.Cell class="max-w-72">
								<span class="block truncate">{student.school}</span>
								<span class="block truncate text-xs text-muted-foreground">{student.city}</span>
							</Table.Cell>
							<Table.Cell class={['text-right tabular-nums', !student.attempts && 'text-muted-foreground']}>{formatNumber(student.attempts)}</Table.Cell>
							<Table.Cell class="text-right tabular-nums">{student.averagePercent === null ? '—' : `${student.averagePercent}%`}</Table.Cell>
							<Table.Cell class="pr-4 whitespace-nowrap text-muted-foreground">{formatIstDate(student.createdAt)}</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
			<Pager bind:page={currentPage} count={students.data.count} pageSize={students.data.pageSize} noun="students" />
		</div>
	{/if}
</Card.Root>
