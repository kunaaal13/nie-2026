<script lang="ts">
	import { createQuery, useQueryClient } from '@tanstack/svelte-query';
	import { toast } from 'svelte-sonner';
	import { Copy, Download, Eye, EyeOff, FileText, MoreHorizontal, Pencil, Plus, Search, Trash2 } from '@lucide/svelte';
	import { deleteQuiz, listQuizzes, setQuizPublished } from '$lib/admin.remote';
	import { formatIstShort, formatNumber } from '$lib/ist';
	import * as Card from '$lib/components/ui/card';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Table from '$lib/components/ui/table';
	import * as Tabs from '$lib/components/ui/tabs';
	import * as Empty from '$lib/components/ui/empty';
	import * as InputGroup from '$lib/components/ui/input-group';
	import { Button } from '$lib/components/ui/button';
	import { Progress } from '$lib/components/ui/progress';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import PageHeader from '$lib/components/admin/PageHeader.svelte';
	import StatusBadge from '$lib/components/admin/StatusBadge.svelte';
	import ConfirmDialog from '$lib/components/admin/ConfirmDialog.svelte';
	import QueryError from '$lib/components/admin/QueryError.svelte';

	type Quiz = NonNullable<typeof quizzes.data>[number];
	const queryClient = useQueryClient();
	const quizzes = createQuery(() => ({ queryKey: ['admin', 'quizzes'], queryFn: () => listQuizzes() }));
	const statuses = ['all', 'Active', 'Scheduled', 'Draft', 'Closed'] as const;
	const tabLabels = { all: 'All', Active: 'Live', Scheduled: 'Scheduled', Draft: 'Drafts', Closed: 'Closed' };
	let status = $state<(typeof statuses)[number]>('all');
	let search = $state('');
	let pendingDelete = $state<Quiz | null>(null);
	let deleting = $state(false);

	const visible = $derived((quizzes.data ?? []).filter((quiz) =>
		(status === 'all' || quiz.status === status) &&
		(!search.trim() || `week ${quiz.weekNumber} ${quiz.title}`.toLowerCase().includes(search.trim().toLowerCase()))));
	const countFor = (key: (typeof statuses)[number]) => (quizzes.data ?? []).filter((quiz) => key === 'all' || quiz.status === key).length;

	async function refresh() {
		await queryClient.invalidateQueries({ queryKey: ['admin'] });
	}

	async function togglePublished(quiz: Quiz) {
		try {
			await setQuizPublished({ id: quiz.id, published: !quiz.published });
			toast.success(quiz.published ? `Week ${quiz.weekNumber} moved to drafts` : `Week ${quiz.weekNumber} published`);
			await refresh();
		} catch (cause) {
			toast.error(cause instanceof Error ? cause.message : 'Could not update this quiz.');
		}
	}

	async function confirmDelete() {
		if (!pendingDelete) return;
		deleting = true;
		try {
			await deleteQuiz(pendingDelete.id);
			toast.success(`Week ${pendingDelete.weekNumber} deleted`);
			pendingDelete = null;
			await refresh();
		} catch (cause) {
			toast.error(cause instanceof Error ? cause.message : 'Could not delete this quiz.');
		} finally {
			deleting = false;
		}
	}
</script>

<svelte:head><title>Quizzes — NIE Read India Admin</title></svelte:head>

<PageHeader title="Quizzes" description="One quiz per week. Published quizzes open and close automatically at their IST times, and only one can be live at a time.">
	{#snippet actions()}<Button href="/admin/quizzes/new"><Plus /> New quiz</Button>{/snippet}
</PageHeader>

{#if quizzes.isPending}
	<Skeleton class="h-96" />
{:else if quizzes.isError}
	<QueryError error={quizzes.error} retry={() => quizzes.refetch()} />
{:else if quizzes.data.length === 0}
	<Card.Root>
		<Empty.Root class="py-16">
			<Empty.Header>
				<Empty.Title>No quizzes yet</Empty.Title>
				<Empty.Description>Create a week, add its questions and set when it opens. You can save it as a draft first.</Empty.Description>
			</Empty.Header>
			<Empty.Content><Button href="/admin/quizzes/new"><Plus /> Create the first quiz</Button></Empty.Content>
		</Empty.Root>
	</Card.Root>
{:else}
	<Card.Root class="gap-0 py-0">
		<div class="flex flex-col gap-3 border-b p-3 sm:flex-row sm:items-center sm:justify-between">
			<Tabs.Root bind:value={status}>
				<Tabs.List class="max-w-full overflow-x-auto">
					{#each statuses as key}
						<Tabs.Trigger value={key}>{tabLabels[key]} <span class="ml-1 text-xs text-muted-foreground tabular-nums">{countFor(key)}</span></Tabs.Trigger>
					{/each}
				</Tabs.List>
			</Tabs.Root>
			<InputGroup.Root class="sm:max-w-64">
				<InputGroup.Addon><Search /></InputGroup.Addon>
				<InputGroup.Input placeholder="Search quizzes" aria-label="Search quizzes" bind:value={search} />
			</InputGroup.Root>
		</div>
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head class="pl-4">Quiz</Table.Head>
					<Table.Head>Status</Table.Head>
					<Table.Head>Window (IST)</Table.Head>
					<Table.Head class="text-right">Questions</Table.Head>
					<Table.Head class="min-w-44">Responses</Table.Head>
					<Table.Head class="text-right">Avg. score</Table.Head>
					<Table.Head class="w-12 pr-4"><span class="sr-only">Actions</span></Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each visible as quiz (quiz.id)}
					<Table.Row>
						<Table.Cell class="max-w-72 pl-4">
							<a href={`/admin/quizzes/${quiz.id}`} class="block truncate font-medium hover:underline">Week {quiz.weekNumber}: {quiz.title}</a>
							{#if quiz.description}<span class="block truncate text-xs text-muted-foreground">{quiz.description}</span>{/if}
						</Table.Cell>
						<Table.Cell><StatusBadge status={quiz.status} /></Table.Cell>
						<Table.Cell class="text-sm whitespace-nowrap">{formatIstShort(quiz.startAt)}<span class="block text-xs text-muted-foreground">to {formatIstShort(quiz.endAt)}</span></Table.Cell>
						<Table.Cell class="text-right tabular-nums">{quiz.questionCount}</Table.Cell>
						<Table.Cell>
							<div class="flex items-center gap-2.5">
								<span class="w-10 text-right tabular-nums">{formatNumber(quiz.responseCount)}</span>
								{#if quiz.status === 'Active' || quiz.status === 'Closed'}
									<Progress value={quiz.participationPercent} max={100} class="h-1 w-16" aria-label="Attendance" />
									<span class="text-xs text-muted-foreground tabular-nums">{quiz.participationPercent}%</span>
								{/if}
							</div>
						</Table.Cell>
						<Table.Cell class="text-right tabular-nums">{quiz.averagePercent === null ? '—' : `${quiz.averagePercent}%`}</Table.Cell>
						<Table.Cell class="pr-4">
							<DropdownMenu.Root>
								<DropdownMenu.Trigger>
									{#snippet child({ props })}<Button {...props} variant="ghost" size="icon-sm" aria-label={`Actions for week ${quiz.weekNumber}`}><MoreHorizontal /></Button>{/snippet}
								</DropdownMenu.Trigger>
								<DropdownMenu.Content align="end" class="w-52">
									<DropdownMenu.Item>{#snippet child({ props })}<a href={`/admin/quizzes/${quiz.id}`} {...props}><Eye /> View insights</a>{/snippet}</DropdownMenu.Item>
									<DropdownMenu.Item>{#snippet child({ props })}<a href={`/admin/quizzes/${quiz.id}?tab=edit`} {...props}><Pencil /> Edit</a>{/snippet}</DropdownMenu.Item>
									<DropdownMenu.Item>{#snippet child({ props })}<a href={`/admin/responses?quizId=${quiz.id}`} {...props}><FileText /> Responses</a>{/snippet}</DropdownMenu.Item>
									<DropdownMenu.Item disabled={quiz.responseCount === 0}>{#snippet child({ props })}<a href={`/admin/export?quizId=${quiz.id}`} download {...props}><Download /> Export CSV</a>{/snippet}</DropdownMenu.Item>
									<DropdownMenu.Item>{#snippet child({ props })}<a href={`/admin/quizzes/new?from=${quiz.id}`} {...props}><Copy /> Duplicate</a>{/snippet}</DropdownMenu.Item>
									<DropdownMenu.Separator />
									<DropdownMenu.Item onclick={() => togglePublished(quiz)}>
										{#if quiz.published}<EyeOff /> Unpublish{:else}<Eye /> Publish{/if}
									</DropdownMenu.Item>
									<DropdownMenu.Item variant="destructive" disabled={quiz.responseCount > 0} onclick={() => pendingDelete = quiz}><Trash2 /> Delete</DropdownMenu.Item>
								</DropdownMenu.Content>
							</DropdownMenu.Root>
						</Table.Cell>
					</Table.Row>
				{:else}
					<Table.Row><Table.Cell colspan={7} class="py-12 text-center text-muted-foreground">No quizzes match this filter.</Table.Cell></Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</Card.Root>
{/if}

<ConfirmDialog bind:open={() => pendingDelete !== null, (open) => { if (!open) pendingDelete = null; }}
	title={`Delete week ${pendingDelete?.weekNumber ?? ''}?`}
	description="The quiz and all of its questions will be removed. This can't be undone."
	pending={deleting} onconfirm={confirmDelete} />
