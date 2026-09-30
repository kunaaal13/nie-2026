<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { ArrowRight, ClipboardList, FileText, GraduationCap, Target } from '@lucide/svelte';
	import { getOverview } from '$lib/admin.remote';
	import { formatIstDateTime } from '$lib/ist';
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';

	const overview = createQuery(() => ({ queryKey: ['admin', 'overview'], queryFn: () => getOverview() }));
</script>

<svelte:head><title>Overview — NIE Read India Admin</title></svelte:head>

<div class="mb-7 flex flex-wrap items-start justify-between gap-4">
	<div><p class="mb-1 text-sm font-semibold uppercase tracking-widest text-emerald-700">Dashboard</p><h1 class="text-3xl font-bold tracking-tight sm:text-4xl">Overview</h1><p class="mt-2 text-slate-500">All dates and times are shown in IST.</p></div>
	<a href="/admin/quizzes/new"><Button>Create quiz <ArrowRight class="ml-2 size-4" /></Button></a>
</div>

{#if overview.isPending}
	<p class="rounded-xl border bg-white p-8 text-slate-500">Loading overview…</p>
{:else if overview.isError}
	<p class="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700" role="alert">{overview.error.message}</p>
{:else}
	<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
		{#each [
			{ label: 'Registered students', value: overview.data.students, icon: GraduationCap },
			{ label: 'Quiz responses', value: overview.data.responses, icon: FileText },
			{ label: 'Quizzes', value: overview.data.quizzes, icon: ClipboardList },
			{ label: 'Average score', value: `${overview.data.averagePercent}%`, icon: Target }
		] as metric}
			<Card.Root><Card.Content class="flex items-start justify-between pt-6"><div><p class="text-sm text-slate-500">{metric.label}</p><p class="mt-2 text-3xl font-bold">{metric.value}</p></div><div class="rounded-lg bg-emerald-50 p-2 text-emerald-700"><metric.icon class="size-5" /></div></Card.Content></Card.Root>
		{/each}
	</div>

	<div class="mt-6 grid gap-6 xl:grid-cols-[1.3fr_1fr]">
		<Card.Root>
			<Card.Header class="flex-row items-center justify-between"><div><Card.Title>Quiz schedule</Card.Title><Card.Description>Published windows cannot overlap.</Card.Description></div><a class="text-sm font-semibold text-emerald-700 hover:underline" href="/admin/quizzes">View all</a></Card.Header>
			<Card.Content>
				{#if overview.data.quizzesByWeek.length === 0}<p class="py-10 text-center text-sm text-slate-500">No quizzes yet. Create your first week to get started.</p>{:else}
					<div class="grid gap-3">
						{#each overview.data.quizzesByWeek as quiz}
							<a href={'/admin/quizzes/' + quiz.id} class="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4 hover:bg-slate-50">
								<div><p class="font-semibold">Week {quiz.weekNumber}: {quiz.title}</p><p class="mt-1 text-xs text-slate-500">{formatIstDateTime(quiz.startAt)} – {formatIstDateTime(quiz.endAt)}</p></div>
								<div class="flex items-center gap-2"><Badge variant={quiz.status === 'Active' ? 'default' : 'secondary'}>{quiz.status}</Badge><ArrowRight class="size-4 text-slate-400" /></div>
							</a>
						{/each}
					</div>
				{/if}
			</Card.Content>
		</Card.Root>
		<Card.Root>
			<Card.Header><Card.Title>Recent responses</Card.Title><Card.Description>Newest quiz submissions</Card.Description></Card.Header>
			<Card.Content>
				{#if overview.data.latest.length === 0}<p class="py-10 text-center text-sm text-slate-500">Responses will appear here after the first quiz opens.</p>{:else}
					<div class="grid divide-y">
						{#each overview.data.latest as response}
							<div class="flex items-center justify-between gap-3 py-3"><div class="min-w-0"><p class="truncate text-sm font-semibold">{response.fullName}</p><p class="truncate text-xs text-slate-500">{response.quizTitle} · {formatIstDateTime(response.submittedAt)}</p></div><span class="shrink-0 text-sm font-semibold">{response.score}/{response.totalQuestions}</span></div>
						{/each}
					</div>
				{/if}
			</Card.Content>
		</Card.Root>
	</div>
{/if}
