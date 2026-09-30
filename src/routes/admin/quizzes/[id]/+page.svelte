<script lang="ts">
	import { page } from '$app/state';
	import { createQuery } from '@tanstack/svelte-query';
	import { getQuiz } from '$lib/admin.remote';
	import QuizEditor from '$lib/components/admin/QuizEditor.svelte';

	const quiz = createQuery(() => ({ queryKey: ['admin', 'quiz', page.params.id], queryFn: () => getQuiz(page.params.id!) }));
</script>

<svelte:head><title>Manage quiz — NIE Read India Admin</title></svelte:head>
{#if quiz.isPending}<p class="rounded-xl border bg-white p-8 text-slate-500">Loading quiz…</p>
{:else if quiz.isError}<p class="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700" role="alert">{quiz.error.message}</p>
{:else}<QuizEditor initial={quiz.data} />{/if}
