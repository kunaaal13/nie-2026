<script lang="ts">
	import { page } from '$app/state';
	import { createQuery } from '@tanstack/svelte-query';
	import { Download, Search } from '@lucide/svelte';
	import { listQuizzes, listResponses } from '$lib/admin.remote';
	import { formatIstDateTime } from '$lib/ist';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import * as Table from '$lib/components/ui/table';

	let quizId = $state(page.url.searchParams.get('quizId') ?? '');
	let searchDraft = $state('');
	let search = $state('');
	let currentPage = $state(1);
	const quizzes = createQuery(() => ({ queryKey: ['admin', 'quizzes'], queryFn: () => listQuizzes() }));
	const responses = createQuery(() => ({ queryKey: ['admin', 'responses', quizId, search, currentPage], queryFn: () => listResponses({ quizId: quizId || undefined, search, page: currentPage }) }));
</script>

<svelte:head><title>Responses — NIE Read India Admin</title></svelte:head>

<div class="mb-7"><p class="mb-1 text-sm font-semibold uppercase tracking-widest text-emerald-700">Manage</p><h1 class="text-3xl font-bold tracking-tight sm:text-4xl">Responses</h1><p class="mt-2 text-slate-500">Review student answers and export a quiz as CSV. All times are IST.</p></div>

<Card.Root><Card.Content class="pt-6">
	<div class="mb-5 flex flex-wrap items-end gap-3">
		<div class="grid min-w-52 flex-1 gap-2"><label class="text-sm font-medium" for="response-quiz">Quiz</label><select id="response-quiz" bind:value={quizId} onchange={() => currentPage = 1} class="h-9 rounded-md border border-input bg-white px-3 text-sm"><option value="">All quizzes</option>{#each quizzes.data ?? [] as quiz}<option value={quiz.id}>Week {quiz.weekNumber}: {quiz.title}</option>{/each}</select></div>
		<form class="flex min-w-52 flex-[2] gap-2" onsubmit={(event) => { event.preventDefault(); search = searchDraft.trim(); currentPage = 1; }}><Input aria-label="Search by student name or email" placeholder="Search name or email" bind:value={searchDraft} /><Button type="submit" variant="outline"><Search class="size-4" /><span class="sr-only">Search</span></Button></form>
		{#if quizId}<a href={'/admin/export?quizId=' + quizId}><Button variant="outline"><Download class="mr-2 size-4" /> Export CSV</Button></a>{/if}
	</div>
	{#if responses.isPending}<p class="py-10 text-center text-slate-500">Loading responses…</p>
	{:else if responses.isError}<p class="rounded-md bg-red-50 p-4 text-red-700" role="alert">{responses.error.message}</p>
	{:else if responses.data.count === 0}<p class="py-10 text-center text-slate-500">No responses match these filters.</p>
	{:else}
		<p class="mb-3 text-sm text-slate-500">{responses.data.count} response(s)</p>
		<div class="overflow-x-auto"><Table.Root><Table.Header><Table.Row><Table.Head>Student</Table.Head><Table.Head>Quiz</Table.Head><Table.Head>School</Table.Head><Table.Head>Score</Table.Head><Table.Head>Submitted (IST)</Table.Head><Table.Head><span class="sr-only">Details</span></Table.Head></Table.Row></Table.Header><Table.Body>
			{#each responses.data.rows as response}<Table.Row><Table.Cell><span class="font-semibold">{response.fullName}</span><span class="block text-xs text-slate-500">{response.email}</span></Table.Cell><Table.Cell>Week {response.weekNumber}: {response.quizTitle}</Table.Cell><Table.Cell>{response.school}</Table.Cell><Table.Cell class="font-semibold">{response.score}/{response.totalQuestions}</Table.Cell><Table.Cell class="whitespace-nowrap">{formatIstDateTime(response.submittedAt)}</Table.Cell><Table.Cell><a class="font-semibold text-emerald-700 hover:underline" href={'/admin/responses/' + response.id}>View</a></Table.Cell></Table.Row>{/each}
		</Table.Body></Table.Root></div>
		<div class="mt-5 flex items-center justify-between"><Button variant="outline" disabled={currentPage <= 1} onclick={() => currentPage--}>Previous</Button><span class="text-sm text-slate-500">Page {currentPage} of {Math.ceil(responses.data.count / responses.data.pageSize)}</span><Button variant="outline" disabled={currentPage * responses.data.pageSize >= responses.data.count} onclick={() => currentPage++}>Next</Button></div>
	{/if}
</Card.Content></Card.Root>
