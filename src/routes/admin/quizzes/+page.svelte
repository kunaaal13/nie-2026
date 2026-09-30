<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { ArrowRight, Plus } from '@lucide/svelte';
	import { listQuizzes } from '$lib/admin.remote';
	import { formatIstDateTime } from '$lib/ist';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Table from '$lib/components/ui/table';

	const quizzes = createQuery(() => ({ queryKey: ['admin', 'quizzes'], queryFn: () => listQuizzes() }));
</script>

<svelte:head><title>Quizzes — NIE Read India Admin</title></svelte:head>

<div class="mb-7 flex flex-wrap items-start justify-between gap-4">
	<div><p class="mb-1 text-sm font-semibold uppercase tracking-widest text-emerald-700">Manage</p><h1 class="text-3xl font-bold tracking-tight sm:text-4xl">Quizzes</h1><p class="mt-2 text-slate-500">Set the start and end times in IST. Only one published quiz can be active at a time.</p></div>
	<a href="/admin/quizzes/new"><Button><Plus class="mr-2 size-4" /> New quiz</Button></a>
</div>

<Card.Root>
	<Card.Content class="pt-6">
		{#if quizzes.isPending}<p class="py-12 text-center text-slate-500">Loading quizzes…</p>
		{:else if quizzes.isError}<p class="rounded-md bg-red-50 p-4 text-red-700" role="alert">{quizzes.error.message}</p>
		{:else if quizzes.data.length === 0}<div class="py-14 text-center"><p class="font-semibold">No quizzes yet</p><p class="mt-1 text-sm text-slate-500">Create a week, add its questions, and publish its schedule.</p><a class="mt-5 inline-block" href="/admin/quizzes/new"><Button>Create quiz</Button></a></div>
		{:else}
			<div class="overflow-x-auto">
				<Table.Root>
					<Table.Header><Table.Row><Table.Head>Quiz</Table.Head><Table.Head>Status</Table.Head><Table.Head>Opens (IST)</Table.Head><Table.Head>Closes (IST)</Table.Head><Table.Head>Questions</Table.Head><Table.Head>Responses</Table.Head><Table.Head><span class="sr-only">Edit</span></Table.Head></Table.Row></Table.Header>
					<Table.Body>
						{#each quizzes.data as quiz}
							<Table.Row>
								<Table.Cell class="font-semibold">Week {quiz.weekNumber}<span class="block text-sm font-normal text-slate-500">{quiz.title}</span></Table.Cell>
								<Table.Cell><Badge variant={quiz.status === 'Active' ? 'default' : 'secondary'}>{quiz.status}</Badge></Table.Cell>
								<Table.Cell class="whitespace-nowrap">{formatIstDateTime(quiz.startAt)}</Table.Cell>
								<Table.Cell class="whitespace-nowrap">{formatIstDateTime(quiz.endAt)}</Table.Cell>
								<Table.Cell>{quiz.questionCount}</Table.Cell><Table.Cell>{quiz.responseCount}</Table.Cell>
								<Table.Cell><a class="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:underline" href={'/admin/quizzes/' + quiz.id}>Manage <ArrowRight class="size-4" /></a></Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</div>
		{/if}
	</Card.Content>
</Card.Root>
