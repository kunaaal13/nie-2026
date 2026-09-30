<script lang="ts">
	import { page } from '$app/state';
	import { createQuery } from '@tanstack/svelte-query';
	import { ArrowLeft } from '@lucide/svelte';
	import { getResponse } from '$lib/admin.remote';
	import { formatIstDateTime } from '$lib/ist';
	import { Badge } from '$lib/components/ui/badge';
	import * as Card from '$lib/components/ui/card';

	const response = createQuery(() => ({ queryKey: ['admin', 'response', page.params.id], queryFn: () => getResponse(page.params.id!) }));
</script>

<svelte:head><title>Response details — NIE Read India Admin</title></svelte:head>

<a href="/admin/responses" class="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"><ArrowLeft class="size-4" /> Back to responses</a>
{#if response.isPending}<p class="rounded-xl border bg-white p-8 text-slate-500">Loading response…</p>
{:else if response.isError}<p class="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700" role="alert">{response.error.message}</p>
{:else}
	<div class="mb-6 flex flex-wrap items-start justify-between gap-4"><div><h1 class="text-3xl font-bold tracking-tight">{response.data.fullName}</h1><p class="mt-1 text-slate-500">{response.data.email} · {response.data.school}, {response.data.city}</p><p class="mt-1 text-sm text-slate-500">Class {response.data.className}, section {response.data.section} · {formatIstDateTime(response.data.submittedAt)}</p></div><Badge class="px-3 py-1 text-base">{response.data.score} / {response.data.totalQuestions}</Badge></div>
	<p class="mb-5 text-sm font-semibold text-emerald-700">{response.data.quizTitle}</p>
	<div class="grid gap-4 md:grid-cols-2">
		{#each response.data.answers as answer}<Card.Root><Card.Header><Card.Title class="text-base">Q{answer.position}. {answer.prompt}</Card.Title></Card.Header><Card.Content><p class="text-sm">Student chose: <strong>{answer.options[answer.selectedOption]}</strong></p><p class="mt-1 text-sm text-slate-500">Correct: {answer.options[answer.correctOption]}</p><Badge variant={answer.isCorrect ? 'default' : 'destructive'} class="mt-3">{answer.isCorrect ? 'Correct' : 'Incorrect'}</Badge></Card.Content></Card.Root>{/each}
	</div>
{/if}
