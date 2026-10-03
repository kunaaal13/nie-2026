<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { createQuery, useQueryClient } from '@tanstack/svelte-query';
	import { toast } from 'svelte-sonner';
	import { Check, Trash2, X } from '@lucide/svelte';
	import { deleteResponse, getResponse } from '$lib/admin.remote';
	import { formatIstDateTime } from '$lib/ist';
	import * as Card from '$lib/components/ui/card';
	import * as Tabs from '$lib/components/ui/tabs';
	import { Button } from '$lib/components/ui/button';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { Progress } from '$lib/components/ui/progress';
	import PageHeader from '$lib/components/admin/PageHeader.svelte';
	import ConfirmDialog from '$lib/components/admin/ConfirmDialog.svelte';
	import QueryError from '$lib/components/admin/QueryError.svelte';

	const queryClient = useQueryClient();
	const response = createQuery(() => ({ queryKey: ['admin', 'response', page.params.id], queryFn: () => getResponse(page.params.id!) }));
	let show = $state<'all' | 'incorrect'>('all');
	let confirmDelete = $state(false);
	let deleting = $state(false);

	async function remove() {
		if (!response.data) return;
		deleting = true;
		try {
			const { quizId } = await deleteResponse(response.data.id);
			await queryClient.invalidateQueries({ queryKey: ['admin'] });
			toast.success('Response deleted. The student can take the quiz again while it is open.');
			await goto(`/admin/responses?quizId=${quizId}`);
		} catch (cause) {
			toast.error(cause instanceof Error ? cause.message : 'Could not delete this response.');
		} finally {
			deleting = false;
			confirmDelete = false;
		}
	}
</script>

<svelte:head><title>{response.data?.fullName ?? 'Response'} — NIE Read India Admin</title></svelte:head>

{#if response.isPending}
	<Skeleton class="mb-6 h-16 w-80" />
	<div class="grid gap-6 lg:grid-cols-[18rem_1fr]"><Skeleton class="h-80" /><Skeleton class="h-96" /></div>
{:else if response.isError}
	<QueryError error={response.error} retry={() => response.refetch()} />
{:else}
	{@const data = response.data}
	{@const percent = Math.round((data.score / data.totalQuestions) * 100)}
	{@const visible = show === 'all' ? data.answers : data.answers.filter((answer) => !answer.isCorrect)}
	<PageHeader title={data.fullName} crumbs={[{ href: '/admin/responses', label: 'Responses' }]}
		description={`Week ${data.weekNumber}: ${data.quizTitle} · submitted ${formatIstDateTime(data.submittedAt)}`}>
		{#snippet actions()}
			<Button variant="outline" href={`/admin/students/${data.studentId}`}>View student</Button>
			<Button variant="destructive" onclick={() => confirmDelete = true}><Trash2 /> Delete</Button>
		{/snippet}
	</PageHeader>

	<div class="grid items-start gap-6 lg:grid-cols-[18rem_1fr]">
		<aside class="grid gap-4 lg:sticky lg:top-20">
			<Card.Root>
				<Card.Content class="grid gap-3">
					<p class="text-sm text-muted-foreground">Score</p>
					<p class="text-[2.5rem] leading-none font-medium tracking-[-0.03em] tabular-nums">{data.score}<span class="text-xl text-muted-foreground">/{data.totalQuestions}</span></p>
					<Progress value={percent} max={100} aria-label="Score" />
					<p class="text-sm text-muted-foreground">{percent}% · {data.totalQuestions - data.score} incorrect</p>
				</Card.Content>
			</Card.Root>
			<Card.Root>
				<Card.Header><Card.Title class="text-sm">Student</Card.Title></Card.Header>
				<Card.Content>
					<dl class="grid gap-3 text-sm">
						{#each [['Email', data.email], ['Mobile / WhatsApp number', data.mobileNumber], ['Class', `${data.className}${data.section ? ` · Section ${data.section}` : ''}`], ['School', data.school], ['City', data.city], ['School address', data.schoolAddress], ['Heard about Read India', data.heardAbout]] as [label, value]}
							<div><dt class="text-xs text-muted-foreground">{label}</dt><dd class="break-words">{value}</dd></div>
						{/each}
					</dl>
				</Card.Content>
			</Card.Root>
		</aside>

		<section aria-labelledby="answers-heading" class="min-w-0">
			<div class="mb-4 flex flex-wrap items-center justify-between gap-3">
				<h2 id="answers-heading" class="text-lg font-medium tracking-[-0.02em]">Answers</h2>
				<Tabs.Root bind:value={show}>
					<Tabs.List><Tabs.Trigger value="all">All {data.answers.length}</Tabs.Trigger><Tabs.Trigger value="incorrect">Incorrect {data.totalQuestions - data.score}</Tabs.Trigger></Tabs.List>
				</Tabs.Root>
			</div>
			<ol class="grid gap-3">
				{#each visible as answer (answer.questionId)}
					<li>
						<Card.Root class="gap-3 py-4">
							<Card.Header class="px-4">
								<div class="flex items-start gap-3">
									<span class={['mt-0.5 grid size-5 shrink-0 place-items-center rounded-full', answer.isCorrect ? 'bg-green-50 text-success' : 'bg-red-50 text-destructive']}>
										{#if answer.isCorrect}<Check class="size-3" aria-label="Correct" />{:else}<X class="size-3" aria-label="Incorrect" />{/if}
									</span>
									<Card.Title class="text-[0.9375rem] leading-snug font-normal"><span class="mr-1 font-mono text-xs text-muted-foreground">Q{answer.position}</span> {answer.prompt}</Card.Title>
								</div>
							</Card.Header>
							<Card.Content class="px-4 pl-12">
								<ul class="grid gap-1.5 text-sm">
									{#each answer.options as option, index}
										{@const chosen = index === answer.selectedOption}
										{@const correct = index === answer.correctOption}
										<li class={['flex items-center justify-between gap-3 rounded-sm border px-3 py-1.5', correct ? 'border-success/30 bg-green-50/60' : chosen ? 'border-destructive/30 bg-red-50/60' : 'border-transparent text-muted-foreground']}>
											<span class="min-w-0">{option}</span>
											<span class="shrink-0 text-xs font-medium">{#if chosen && correct}<span class="text-success">Their answer · correct</span>{:else if chosen}<span class="text-destructive">Their answer</span>{:else if correct}<span class="text-success">Correct answer</span>{/if}</span>
										</li>
									{/each}
								</ul>
							</Card.Content>
						</Card.Root>
					</li>
				{:else}
					<li><p class="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">Every answer is correct.</p></li>
				{/each}
			</ol>
		</section>
	</div>

	<ConfirmDialog bind:open={confirmDelete} title="Delete this response?"
		description={`${data.fullName}'s answers and score will be removed, and they can take this quiz again while it's open. This can't be undone.`}
		pending={deleting} onconfirm={remove} />
{/if}
