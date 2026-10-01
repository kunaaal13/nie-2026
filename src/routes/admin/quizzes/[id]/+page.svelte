<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { createQuery, useQueryClient } from '@tanstack/svelte-query';
	import { toast } from 'svelte-sonner';
	import { Award, CalendarRange, Check, Copy, Download, Eye, EyeOff, FileText, MoreHorizontal, Target, UserCheck } from '@lucide/svelte';
	import { getOverview, getQuiz, getQuizStats, listQuizzes, setQuizPublished } from '$lib/admin.remote';
	import { formatIstDateTime, formatNumber, fromNow } from '$lib/ist';
	import * as Card from '$lib/components/ui/card';
	import * as Tabs from '$lib/components/ui/tabs';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Empty from '$lib/components/ui/empty';
	import { Button } from '$lib/components/ui/button';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { Progress } from '$lib/components/ui/progress';
	import PageHeader from '$lib/components/admin/PageHeader.svelte';
	import StatusBadge from '$lib/components/admin/StatusBadge.svelte';
	import StatCard from '$lib/components/admin/StatCard.svelte';
	import ColumnChart from '$lib/components/admin/ColumnChart.svelte';
	import BarList from '$lib/components/admin/BarList.svelte';
	import QuizEditor from '$lib/components/admin/QuizEditor.svelte';
	import QueryError from '$lib/components/admin/QueryError.svelte';

	const queryClient = useQueryClient();
	const id = $derived(page.params.id!);
	const tab = $derived(page.url.searchParams.get('tab') === 'edit' ? 'edit' : 'insights');
	const quiz = createQuery(() => ({ queryKey: ['admin', 'quiz', id], queryFn: () => getQuiz(id) }));
	const stats = createQuery(() => ({ queryKey: ['admin', 'quiz-stats', id], queryFn: () => getQuizStats(id), enabled: tab === 'insights' }));
	let questionOrder = $state<'position' | 'hardest'>('position');
	let publishing = $state(false);

	const orderedQuestions = $derived.by(() => {
		const list = [...(stats.data?.questions ?? [])];
		return questionOrder === 'hardest' ? list.sort((a, b) => (a.accuracyPercent ?? 101) - (b.accuracyPercent ?? 101)) : list;
	});

	function setTab(value: string) {
		const url = new URL(page.url);
		if (value === 'edit') url.searchParams.set('tab', 'edit'); else url.searchParams.delete('tab');
		goto(url, { replaceState: true, noScroll: true, keepFocus: true });
	}

	async function togglePublished() {
		if (!quiz.data) return;
		publishing = true;
		try {
			await setQuizPublished({ id, published: !quiz.data.published });
			await Promise.all([
				getOverview().refresh(), getQuiz(id).refresh(), getQuizStats(id).refresh(), listQuizzes().refresh()
			]);
			toast.success(quiz.data.published ? 'Moved to drafts. Students can no longer see it.' : 'Published');
			await queryClient.invalidateQueries({ queryKey: ['admin'] });
		} catch (cause) {
			toast.error(cause instanceof Error ? cause.message : 'Could not update this quiz.');
		} finally {
			publishing = false;
		}
	}
</script>

<svelte:head><title>{quiz.data ? `Week ${quiz.data.weekNumber}` : 'Quiz'} — NIE Read India Admin</title></svelte:head>

{#if quiz.isPending}
	<Skeleton class="mb-6 h-16 w-96 max-w-full" />
	<Skeleton class="h-96" />
{:else if quiz.isError}
	<QueryError error={quiz.error} retry={() => quiz.refetch()} />
{:else}
	{@const data = quiz.data}
	<PageHeader title={`Week ${data.weekNumber}: ${data.title}`} crumbs={[{ href: '/admin/quizzes', label: 'Quizzes' }]}>
		{#snippet meta()}<StatusBadge status={data.status} />{/snippet}
		{#snippet actions()}
			<Button variant="outline" href={`/admin/responses?quizId=${id}`}><FileText /> Responses <span class="text-muted-foreground tabular-nums">{formatNumber(data.responseCount)}</span></Button>
			<Button variant={data.published ? 'outline' : 'default'} disabled={publishing} onclick={togglePublished}>
				{#if data.published}<EyeOff /> Unpublish{:else}<Eye /> Publish{/if}
			</Button>
			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					{#snippet child({ props })}<Button {...props} variant="outline" size="icon" aria-label="More actions"><MoreHorizontal /></Button>{/snippet}
				</DropdownMenu.Trigger>
				<DropdownMenu.Content align="end" class="w-48">
					<DropdownMenu.Item disabled={data.responseCount === 0}>{#snippet child({ props })}<a href={`/admin/export?quizId=${id}`} download {...props}><Download /> Export CSV</a>{/snippet}</DropdownMenu.Item>
					<DropdownMenu.Item>{#snippet child({ props })}<a href={`/admin/quizzes/new?from=${id}`} {...props}><Copy /> Duplicate</a>{/snippet}</DropdownMenu.Item>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		{/snippet}
	</PageHeader>

	<p class="-mt-3 mb-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
		<CalendarRange class="size-4" />
		<span>{formatIstDateTime(data.startAt)} → {formatIstDateTime(data.endAt)}</span>
		{#if data.status === 'Active'}<span>· closes {fromNow(data.endAt)}</span>{:else if data.status === 'Scheduled'}<span>· opens {fromNow(data.startAt)}</span>{/if}
	</p>

	<Tabs.Root value={tab} onValueChange={setTab}>
		<Tabs.List variant="line" class="mb-6 w-full justify-start border-b pb-0">
			<Tabs.Trigger value="insights">Insights</Tabs.Trigger>
			<Tabs.Trigger value="edit">{data.responseCount ? 'Details & schedule' : 'Edit quiz'}</Tabs.Trigger>
		</Tabs.List>

		<Tabs.Content value="insights">
			{#if stats.isPending}
				<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{#each Array(4) as _}<Skeleton class="h-32" />{/each}</div>
			{:else if stats.isError}
				<QueryError error={stats.error} retry={() => stats.refetch()} />
			{:else}
				{@const s = stats.data}
				<section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Quiz numbers">
					<StatCard label="Responses" value={formatNumber(s.responses)} icon={FileText} hint={`${data.questions.length} questions`} />
					<StatCard label="Attendance" value={s.status === 'Draft' || s.status === 'Scheduled' ? '—' : `${s.participationPercent}%`} icon={UserCheck}
						progress={s.status === 'Draft' || s.status === 'Scheduled' ? undefined : s.participationPercent}
						hint={`${formatNumber(s.responses)} of ${formatNumber(s.eligible)} ${s.eligible === 1 ? 'student' : 'students'} registered ${s.status === 'Closed' ? 'before it closed' : 'so far'}`} />
					<StatCard label="Average score" value={s.averagePercent === null ? '—' : `${s.averagePercent}%`} icon={Target}
						hint={s.medianPercent === null ? 'No responses yet' : `Median ${s.medianPercent}%`} />
					<StatCard label="Perfect scores" value={formatNumber(s.perfectScores)} icon={Award}
						hint={s.responses ? `${Math.round((s.perfectScores / s.responses) * 100)}% of responses` : 'No responses yet'} />
				</section>

				{#if s.responses === 0}
					<Card.Root class="mt-6">
						<Empty.Root class="py-14">
							<Empty.Header>
								<Empty.Title>No responses yet</Empty.Title>
								<Empty.Description>{data.status === 'Active' ? 'The quiz is live. Responses will show up here as students submit.' : data.status === 'Draft' ? 'Publish the quiz so students can take it during its window.' : data.status === 'Scheduled' ? `It opens ${fromNow(data.startAt)}.` : 'Nobody took this quiz.'}</Empty.Description>
							</Empty.Header>
						</Empty.Root>
					</Card.Root>
				{:else}
					<div class="mt-6 grid gap-6 lg:grid-cols-2">
						<Card.Root>
							<Card.Header><Card.Title>Score distribution</Card.Title><Card.Description>Responses grouped by percentage score</Card.Description></Card.Header>
							<Card.Content>
								<ColumnChart label="Responses by score range" data={s.distribution.map((bucket) => ({ label: bucket.label, value: bucket.count }))}
									describe={(item) => `${item.label}: ${item.value} response${item.value === 1 ? '' : 's'}`} />
							</Card.Content>
						</Card.Root>
						<Card.Root>
							<Card.Header><Card.Title>Schools</Card.Title><Card.Description>Most responses, with average score</Card.Description></Card.Header>
							<Card.Content>
								<BarList items={s.schools.map((row) => ({ label: row.school, value: row.count, hint: `avg ${row.average}%` }))} valueLabel={formatNumber} />
							</Card.Content>
						</Card.Root>
					</div>
					{#if s.byDay.length > 1}
						<Card.Root class="mt-6">
							<Card.Header><Card.Title>Responses per day</Card.Title><Card.Description>When students submitted, by IST date</Card.Description></Card.Header>
							<Card.Content>
								<ColumnChart label="Responses per day" height={120} labelEvery={Math.ceil(s.byDay.length / 8)}
									data={s.byDay.map((row) => ({ label: new Date(`${row.day}T00:00:00Z`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' }), value: row.count }))}
									describe={(item) => `${item.label}: ${item.value} response${item.value === 1 ? '' : 's'}`} />
							</Card.Content>
						</Card.Root>
					{/if}
				{/if}

				<section class="mt-8" aria-labelledby="question-analysis">
					<div class="mb-4 flex flex-wrap items-end justify-between gap-3">
						<div>
							<h2 id="question-analysis" class="text-lg font-medium tracking-[-0.02em]">Question analysis</h2>
							<p class="text-sm text-muted-foreground">How students answered each question. The correct option is marked.</p>
						</div>
						<Tabs.Root bind:value={questionOrder}>
							<Tabs.List><Tabs.Trigger value="position">In order</Tabs.Trigger><Tabs.Trigger value="hardest">Hardest first</Tabs.Trigger></Tabs.List>
						</Tabs.Root>
					</div>
					<div class="grid gap-4 md:grid-cols-2">
						{#each orderedQuestions as question (question.id)}
							<Card.Root class="gap-4">
								<Card.Header>
									<div class="flex items-start justify-between gap-3">
										<Card.Title class="text-[0.9375rem] leading-snug font-normal"><span class="mr-1 font-mono text-xs text-muted-foreground">Q{question.position}</span> {question.prompt}</Card.Title>
										{#if question.accuracyPercent !== null}
											<span class={['shrink-0 rounded-sm px-1.5 py-0.5 text-xs font-medium tabular-nums', question.accuracyPercent < 40 ? 'bg-red-50 text-destructive' : question.accuracyPercent < 70 ? 'bg-amber-50 text-warning' : 'bg-green-50 text-success']}>{question.accuracyPercent}% correct</span>
										{/if}
									</div>
								</Card.Header>
								<Card.Content>
									<ul class="grid gap-2">
										{#each question.options as option, index}
											{@const share = question.answered ? Math.round((question.counts[index] / question.answered) * 100) : 0}
											<li class="grid gap-1">
												<div class="flex items-baseline justify-between gap-3 text-sm">
													<span class={['flex min-w-0 items-center gap-1.5', index === question.correctOption && 'font-medium']}>
														{#if index === question.correctOption}<Check class="size-3.5 shrink-0 text-success" aria-label="Correct answer" />{:else}<span class="w-3.5 shrink-0"></span>{/if}
														<span class="truncate">{option}</span>
													</span>
													<span class="shrink-0 text-xs text-muted-foreground tabular-nums">{formatNumber(question.counts[index])} · {share}%</span>
												</div>
												<Progress value={share} max={100} class={['ml-5 h-1', index === question.correctOption ? '[&>*]:bg-success' : '[&>*]:bg-muted-foreground/40']} aria-label={`${option}: ${share}%`} />
											</li>
										{/each}
									</ul>
								</Card.Content>
							</Card.Root>
						{/each}
					</div>
				</section>
			{/if}
		</Tabs.Content>

		<Tabs.Content value="edit">
			<QuizEditor initial={data} />
		</Tabs.Content>
	</Tabs.Root>
{/if}
