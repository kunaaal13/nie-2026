<script lang="ts">
	import { page } from '$app/state';
	import { createQuery } from '@tanstack/svelte-query';
	import { getQuiz, listQuizzes } from '$lib/admin.remote';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import PageHeader from '$lib/components/admin/PageHeader.svelte';
	import QuizEditor from '$lib/components/admin/QuizEditor.svelte';
	import QueryError from '$lib/components/admin/QueryError.svelte';

	const fromId = page.url.searchParams.get('from');
	const quizzes = createQuery(() => ({ queryKey: ['admin', 'quizzes'], queryFn: () => listQuizzes() }));
	const source = createQuery(() => ({ queryKey: ['admin', 'quiz', fromId], queryFn: () => getQuiz(fromId!), enabled: !!fromId }));
	const nextWeek = $derived(Math.min(52, Math.max(0, ...(quizzes.data ?? []).map((quiz) => quiz.weekNumber)) + 1));
</script>

<svelte:head><title>New quiz — NIE Read India Admin</title></svelte:head>

<PageHeader title={fromId ? 'Duplicate quiz' : 'New quiz'} crumbs={[{ href: '/admin/quizzes', label: 'Quizzes' }]}
	description={fromId ? 'Questions are copied from the original. Set a new week and schedule before saving.' : 'Add the questions, set when it opens and closes, then publish or save as a draft.'} />

{#if quizzes.isPending || (fromId && source.isPending)}
	<Skeleton class="h-[32rem]" />
{:else if source.isError}
	<QueryError error={source.error} />
{:else}
	<QuizEditor prefill={source.data
		? { weekNumber: nextWeek, title: source.data.title, description: source.data.description, published: false,
			questions: source.data.questions.map(({ prompt, options, correctOption }) => ({ prompt, options, correctOption })) }
		: { weekNumber: nextWeek }} />
{/if}
