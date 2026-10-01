<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { createQuery, keepPreviousData, useQueryClient } from '@tanstack/svelte-query';
	import { toast } from 'svelte-sonner';
	import { Download, Eye, MoreHorizontal, Search, Trash2, User, X } from '@lucide/svelte';
	import { deleteResponse, listQuizzes, listResponses } from '$lib/admin.remote';
	import { formatIstShort, fromNow } from '$lib/ist';
	import * as Card from '$lib/components/ui/card';
	import * as Select from '$lib/components/ui/select';
	import * as Table from '$lib/components/ui/table';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as InputGroup from '$lib/components/ui/input-group';
	import * as Empty from '$lib/components/ui/empty';
	import { Button } from '$lib/components/ui/button';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import PageHeader from '$lib/components/admin/PageHeader.svelte';
	import Pager from '$lib/components/admin/Pager.svelte';
	import ScoreBadge from '$lib/components/admin/ScoreBadge.svelte';
	import ConfirmDialog from '$lib/components/admin/ConfirmDialog.svelte';
	import QueryError from '$lib/components/admin/QueryError.svelte';

	type Sort = 'recent' | 'oldest' | 'score-desc' | 'score-asc';
	const sorts: Record<Sort, string> = { recent: 'Newest first', oldest: 'Oldest first', 'score-desc': 'Highest score', 'score-asc': 'Lowest score' };
	const queryClient = useQueryClient();

	let quizId = $state(page.url.searchParams.get('quizId') ?? '');
	let searchDraft = $state(page.url.searchParams.get('search') ?? '');
	let search = $state(page.url.searchParams.get('search') ?? '');
	let sort = $state<Sort>((page.url.searchParams.get('sort') as Sort) in sorts ? page.url.searchParams.get('sort') as Sort : 'recent');
	let currentPage = $state(1);
	let pendingDelete = $state<{ id: string; fullName: string } | null>(null);
	let deleting = $state(false);

	const quizzes = createQuery(() => ({ queryKey: ['admin', 'quizzes'], queryFn: () => listQuizzes() }));
	const responses = createQuery(() => ({
		queryKey: ['admin', 'responses', quizId, search, sort, currentPage],
		queryFn: () => listResponses({ quizId: quizId || undefined, search, sort, page: currentPage }),
		placeholderData: keepPreviousData
	}));
	const selectedQuiz = $derived(quizzes.data?.find((quiz) => quiz.id === quizId));
	const filtered = $derived(Boolean(quizId || search));

	// Debounce typing, then keep the filters in the URL so views can be bookmarked and shared.
	$effect(() => {
		const value = searchDraft.trim();
		const timer = setTimeout(() => { if (value !== search) { search = value; currentPage = 1; } }, 300);
		return () => clearTimeout(timer);
	});
	$effect(() => {
		const url = new URL(page.url);
		for (const [key, value] of [['quizId', quizId], ['search', search], ['sort', sort === 'recent' ? '' : sort]]) {
			if (value) url.searchParams.set(key, value); else url.searchParams.delete(key);
		}
		if (url.search !== page.url.search) goto(url, { replaceState: true, keepFocus: true, noScroll: true });
	});

	function clearFilters() {
		quizId = ''; searchDraft = ''; search = ''; currentPage = 1;
	}

	async function confirmDelete() {
		if (!pendingDelete) return;
		deleting = true;
		try {
			await deleteResponse(pendingDelete.id);
			toast.success(`Response from ${pendingDelete.fullName} deleted. They can take the quiz again while it's open.`);
			pendingDelete = null;
			await queryClient.invalidateQueries({ queryKey: ['admin'] });
		} catch (cause) {
			toast.error(cause instanceof Error ? cause.message : 'Could not delete this response.');
		} finally {
			deleting = false;
		}
	}
</script>

<svelte:head><title>Responses — NIE Read India Admin</title></svelte:head>

<PageHeader title="Responses" description="Every quiz submission. Filter by quiz to export it with each student's answers.">
	{#snippet actions()}
		{#if quizId}
			<Button variant="outline" href={`/admin/export?quizId=${quizId}`} download><Download /> Export week {selectedQuiz?.weekNumber ?? ''} CSV</Button>
		{:else}
			<Button variant="outline" href="/admin/export/responses" download><Download /> Export all CSV</Button>
		{/if}
	{/snippet}
</PageHeader>

<Card.Root class="gap-0 py-0">
	<div class="flex flex-col gap-2 border-b p-3 md:flex-row md:items-center">
		<Select.Root type="single" bind:value={quizId} onValueChange={() => currentPage = 1}>
			<Select.Trigger class="w-full md:w-72" aria-label="Filter by quiz">
				<span class="truncate">{selectedQuiz ? `Week ${selectedQuiz.weekNumber}: ${selectedQuiz.title}` : 'All quizzes'}</span>
			</Select.Trigger>
			<Select.Content>
				<Select.Item value="">All quizzes</Select.Item>
				<Select.Separator />
				{#each quizzes.data ?? [] as quiz}
					<Select.Item value={quiz.id} label={`Week ${quiz.weekNumber}: ${quiz.title}`}>
						<span class="truncate">Week {quiz.weekNumber}: {quiz.title}</span>
						<span class="ml-auto pl-3 text-xs text-muted-foreground tabular-nums">{quiz.responseCount}</span>
					</Select.Item>
				{/each}
			</Select.Content>
		</Select.Root>
		<InputGroup.Root class="md:max-w-80">
			<InputGroup.Addon><Search /></InputGroup.Addon>
			<InputGroup.Input placeholder="Search name, email or school" aria-label="Search responses" bind:value={searchDraft} />
			{#if searchDraft}<InputGroup.Addon align="inline-end"><InputGroup.Button size="icon-xs" aria-label="Clear search" onclick={() => searchDraft = ''}><X /></InputGroup.Button></InputGroup.Addon>{/if}
		</InputGroup.Root>
		<Select.Root type="single" bind:value={sort} onValueChange={() => currentPage = 1}>
			<Select.Trigger class="w-full md:ml-auto md:w-44" aria-label="Sort responses">{sorts[sort]}</Select.Trigger>
			<Select.Content>{#each Object.entries(sorts) as [value, label]}<Select.Item {value} {label}>{label}</Select.Item>{/each}</Select.Content>
		</Select.Root>
	</div>

	{#if responses.isPending}
		<div class="grid gap-2 p-4">{#each Array(8) as _}<Skeleton class="h-11" />{/each}</div>
	{:else if responses.isError}
		<div class="p-4"><QueryError error={responses.error} retry={() => responses.refetch()} /></div>
	{:else if responses.data.count === 0}
		<Empty.Root class="py-16">
			<Empty.Header>
				<Empty.Title>{filtered ? 'No matching responses' : 'No responses yet'}</Empty.Title>
				<Empty.Description>{filtered ? 'Try another quiz or search term.' : 'Submissions appear here once students take a published quiz.'}</Empty.Description>
			</Empty.Header>
			{#if filtered}<Empty.Content><Button variant="outline" onclick={clearFilters}>Clear filters</Button></Empty.Content>{/if}
		</Empty.Root>
	{:else}
		<div class={['transition-opacity', responses.isPlaceholderData && 'opacity-60']}>
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head class="pl-4">Student</Table.Head>
						{#if !quizId}<Table.Head>Quiz</Table.Head>{/if}
						<Table.Head>School</Table.Head>
						<Table.Head>Score</Table.Head>
						<Table.Head>Submitted</Table.Head>
						<Table.Head class="w-12 pr-4"><span class="sr-only">Actions</span></Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each responses.data.rows as response (response.id)}
						<Table.Row>
							<Table.Cell class="max-w-64 pl-4">
								<a href={`/admin/responses/${response.id}`} class="block truncate font-medium hover:underline">{response.fullName}</a>
								<span class="block truncate text-xs text-muted-foreground">{response.email}</span>
							</Table.Cell>
							{#if !quizId}<Table.Cell class="whitespace-nowrap">Week {response.weekNumber}</Table.Cell>{/if}
							<Table.Cell class="max-w-64">
								<span class="block truncate">{response.school}</span>
								<span class="block truncate text-xs text-muted-foreground">Class {response.className}{response.section ? ` · ${response.section}` : ''} · {response.city}</span>
							</Table.Cell>
							<Table.Cell><ScoreBadge score={response.score} total={response.totalQuestions} /></Table.Cell>
							<Table.Cell class="whitespace-nowrap" title={`${formatIstShort(response.submittedAt)} IST`}>
								<span class="text-sm">{formatIstShort(response.submittedAt)}</span>
								<span class="block text-xs text-muted-foreground">{fromNow(response.submittedAt)}</span>
							</Table.Cell>
							<Table.Cell class="pr-4">
								<DropdownMenu.Root>
									<DropdownMenu.Trigger>
										{#snippet child({ props })}<Button {...props} variant="ghost" size="icon-sm" aria-label={`Actions for ${response.fullName}`}><MoreHorizontal /></Button>{/snippet}
									</DropdownMenu.Trigger>
									<DropdownMenu.Content align="end" class="w-48">
										<DropdownMenu.Item>{#snippet child({ props })}<a href={`/admin/responses/${response.id}`} {...props}><Eye /> View answers</a>{/snippet}</DropdownMenu.Item>
										<DropdownMenu.Item>{#snippet child({ props })}<a href={`/admin/students/${response.studentId}`} {...props}><User /> View student</a>{/snippet}</DropdownMenu.Item>
										<DropdownMenu.Separator />
										<DropdownMenu.Item variant="destructive" onclick={() => pendingDelete = response}><Trash2 /> Delete response</DropdownMenu.Item>
									</DropdownMenu.Content>
								</DropdownMenu.Root>
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
			<Pager bind:page={currentPage} count={responses.data.count} pageSize={responses.data.pageSize} noun="responses" />
		</div>
	{/if}
</Card.Root>

<ConfirmDialog bind:open={() => pendingDelete !== null, (open) => { if (!open) pendingDelete = null; }}
	title="Delete this response?"
	description={`${pendingDelete?.fullName ?? 'The student'}'s answers and score will be removed, and they will be able to take this quiz again while it's open. This can't be undone.`}
	pending={deleting} onconfirm={confirmDelete} />
