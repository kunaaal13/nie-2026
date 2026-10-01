<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { ArrowRight, CalendarClock, ChevronDown, Download, FileText, Plus, Repeat, Target, UserCheck, Users } from '@lucide/svelte';
	import { getOverview } from '$lib/admin.remote';
	import { formatIstDateTime, formatIstShort, formatNumber, fromNow } from '$lib/ist';
	import * as Card from '$lib/components/ui/card';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Table from '$lib/components/ui/table';
	import * as Empty from '$lib/components/ui/empty';
	import { Button } from '$lib/components/ui/button';
	import { Progress } from '$lib/components/ui/progress';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import PageHeader from '$lib/components/admin/PageHeader.svelte';
	import StatCard from '$lib/components/admin/StatCard.svelte';
	import StatusBadge from '$lib/components/admin/StatusBadge.svelte';
	import BarList from '$lib/components/admin/BarList.svelte';
	import ColumnChart from '$lib/components/admin/ColumnChart.svelte';
	import QueryError from '$lib/components/admin/QueryError.svelte';

	const overview = createQuery(() => ({ queryKey: ['admin', 'overview'], queryFn: () => getOverview() }));
	const dayLabel = (day: string) => new Date(`${day}T00:00:00Z`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' });
	const countLabel = (count: number, singular: string, plural = `${singular}s`) => `${formatNumber(count)} ${count === 1 ? singular : plural}`;
</script>

<svelte:head><title>Overview — NIE Read India Admin</title></svelte:head>

<PageHeader title="Overview" description="Registrations, quiz attendance and scores across every week.">
	{#snippet actions()}
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				{#snippet child({ props })}<Button variant="outline" {...props}><Download /> Export <ChevronDown class="text-muted-foreground" /></Button>{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content align="end" class="w-60">
				<DropdownMenu.Item>{#snippet child({ props })}<a href="/admin/export/students" download {...props}><Users /> All students (CSV)</a>{/snippet}</DropdownMenu.Item>
				<DropdownMenu.Item>{#snippet child({ props })}<a href="/admin/export/responses" download {...props}><FileText /> All responses (CSV)</a>{/snippet}</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	{/snippet}
</PageHeader>

{#if overview.isPending}
	<div class="grid gap-4">
		<Skeleton class="h-28" />
		<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{#each Array(4) as _}<Skeleton class="h-36" />{/each}</div>
		<div class="grid gap-4 lg:grid-cols-2"><Skeleton class="h-72" /><Skeleton class="h-72" /></div>
	</div>
{:else if overview.isError}
	<QueryError error={overview.error} retry={() => overview.refetch()} />
{:else}
	{@const data = overview.data}

	<!-- Live / next quiz -->
	{#if data.activeQuiz}
		{@const live = data.activeQuiz}
		<Card.Root class="mb-6 gap-0 overflow-hidden border-brand/30 py-0 shadow-[var(--shadow-card)]">
			<Card.Content class="grid gap-5 p-5 md:grid-cols-[1fr_auto] md:items-center">
				<div class="min-w-0">
					<div class="mb-2 flex items-center gap-2"><StatusBadge status="Active" /><span class="text-xs text-muted-foreground">Closes {fromNow(live.endAt)} · {formatIstShort(live.endAt)} IST</span></div>
					<h2 class="truncate text-lg font-medium tracking-[-0.02em]">Week {live.weekNumber}: {live.title}</h2>
					<div class="mt-3 flex max-w-md items-center gap-3">
						<Progress value={live.participationPercent} max={100} class="h-1.5" aria-label="Attendance" />
						<span class="shrink-0 text-sm tabular-nums"><strong class="font-medium">{formatNumber(live.responseCount)}</strong> <span class="text-muted-foreground">of {formatNumber(live.eligibleCount)} · {live.participationPercent}%</span></span>
					</div>
				</div>
				<div class="flex gap-2">
					<Button variant="outline" href={`/admin/responses?quizId=${live.id}`}>Responses</Button>
					<Button href={`/admin/quizzes/${live.id}`}>Open quiz <ArrowRight /></Button>
				</div>
			</Card.Content>
		</Card.Root>
	{:else if data.nextQuiz}
		<Card.Root class="mb-6 gap-0 py-0">
			<Card.Content class="flex flex-wrap items-center justify-between gap-4 p-5">
				<div class="flex items-center gap-3">
					<span class="grid size-9 place-items-center rounded-sm bg-sky-50 text-sky-800"><CalendarClock class="size-4" /></span>
					<div><p class="text-sm font-medium">No quiz is live. Week {data.nextQuiz.weekNumber}: {data.nextQuiz.title} opens {fromNow(data.nextQuiz.startAt)}.</p><p class="text-xs text-muted-foreground">{formatIstDateTime(data.nextQuiz.startAt)}</p></div>
				</div>
				<Button variant="outline" href={`/admin/quizzes/${data.nextQuiz.id}`}>Review quiz</Button>
			</Card.Content>
		</Card.Root>
	{:else}
		<Card.Root class="mb-6 gap-0 border-dashed py-0 shadow-none">
			<Card.Content class="flex flex-wrap items-center justify-between gap-4 p-5">
				<p class="text-sm"><span class="font-medium">No quiz is live or scheduled.</span> <span class="text-muted-foreground">Students will see that no quiz is open until you publish one.</span></p>
				<Button href="/admin/quizzes/new"><Plus /> Schedule a quiz</Button>
			</Card.Content>
		</Card.Root>
	{/if}

	<!-- KPIs -->
	<section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Key numbers">
		<StatCard label="Registered students" value={formatNumber(data.students)} icon={Users}
			hint={data.newStudents ? `+${formatNumber(data.newStudents)} in the last 7 days` : 'No new sign-ups in the last 7 days'} />
		<StatCard label="Took at least one quiz" value={`${data.participantPercent}%`} icon={UserCheck} progress={data.participantPercent}
			hint={`${formatNumber(data.participants)} of ${countLabel(data.students, 'registered student')}`} />
		<StatCard label="Took every quiz" value={`${data.attendedAllPercent}%`} icon={Repeat} progress={data.attendedAllPercent}
			hint={data.openedQuizzes ? `${countLabel(data.attendedAll, 'student')} completed all ${countLabel(data.openedQuizzes, 'opened quiz', 'opened quizzes')}` : 'No quiz has opened yet'} />
		<StatCard label="Average score" value={data.averagePercent === null ? '—' : `${data.averagePercent}%`} icon={Target}
			hint={`${countLabel(data.responses, 'response')} · ${countLabel(data.perfectScores, 'perfect score')}`} />
	</section>

	<!-- Per-quiz attendance -->
	<Card.Root class="mt-6 gap-0 py-0">
		<Card.Header class="flex flex-row items-center justify-between gap-4 border-b px-5 py-4">
			<div>
				<Card.Title>Attendance by quiz</Card.Title>
				<Card.Description>Responses as a share of students registered before the quiz closed. Average attendance: {data.participationPercent}%.</Card.Description>
			</div>
			<Button variant="ghost" size="sm" href="/admin/quizzes">All quizzes <ArrowRight /></Button>
		</Card.Header>
		{#if data.quizzes.length === 0}
			<Empty.Root class="py-12">
				<Empty.Header><Empty.Title>No quizzes yet</Empty.Title><Empty.Description>Create the first week's quiz to start collecting responses.</Empty.Description></Empty.Header>
				<Empty.Content><Button href="/admin/quizzes/new"><Plus /> New quiz</Button></Empty.Content>
			</Empty.Root>
		{:else}
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head class="pl-5">Quiz</Table.Head>
						<Table.Head>Status</Table.Head>
						<Table.Head class="text-right">Responses</Table.Head>
						<Table.Head class="min-w-48">Attendance</Table.Head>
						<Table.Head class="pr-5 text-right">Avg. score</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each data.quizzes.slice(0, 8) as quiz}
						<Table.Row class="relative">
							<Table.Cell class="pl-5"><a href={`/admin/quizzes/${quiz.id}`} class="font-medium after:absolute after:inset-0">Week {quiz.weekNumber}</a><span class="ml-2 text-muted-foreground">{quiz.title}</span></Table.Cell>
							<Table.Cell><StatusBadge status={quiz.status} /></Table.Cell>
							<Table.Cell class="text-right tabular-nums">{formatNumber(quiz.responseCount)}</Table.Cell>
							<Table.Cell>
								{#if quiz.status === 'Active' || quiz.status === 'Closed'}
									<div class="flex items-center gap-3"><Progress value={quiz.participationPercent} max={100} class="h-1.5 w-28" aria-label={`Week ${quiz.weekNumber} attendance`} /><span class="text-sm tabular-nums">{quiz.participationPercent}%</span></div>
								{:else}<span class="text-sm text-muted-foreground">Not open yet</span>{/if}
							</Table.Cell>
							<Table.Cell class="pr-5 text-right tabular-nums">{quiz.averagePercent === null ? '—' : `${quiz.averagePercent}%`}</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		{/if}
	</Card.Root>

	<!-- Charts -->
	<div class="mt-6 grid gap-6 lg:grid-cols-2">
		<Card.Root>
			<Card.Header>
				<Card.Title>New registrations</Card.Title>
				<Card.Description>Last 30 days · {countLabel(data.registrationsByDay.reduce((sum, day) => sum + day.count, 0), 'student')}</Card.Description>
			</Card.Header>
			<Card.Content>
				<ColumnChart label="New registrations per day, last 30 days" labelEvery={7}
					data={data.registrationsByDay.map((day) => ({ label: dayLabel(day.day), value: day.count }))}
					describe={(item) => `${item.label}: ${item.value} registration${item.value === 1 ? '' : 's'}`} />
			</Card.Content>
		</Card.Root>
		<Card.Root>
			<Card.Header>
				<Card.Title>Score distribution</Card.Title>
				<Card.Description>All responses, grouped by percentage score</Card.Description>
			</Card.Header>
			<Card.Content>
				<ColumnChart label="Number of responses by score range"
					data={data.distribution.map((bucket) => ({ label: bucket.label, value: bucket.count }))}
					describe={(item) => `${item.label}: ${item.value} response${item.value === 1 ? '' : 's'}`} />
			</Card.Content>
		</Card.Root>
	</div>

	<div class="mt-6 grid gap-6 lg:grid-cols-3">
		<Card.Root>
			<Card.Header><Card.Title>Quizzes taken per student</Card.Title><Card.Description>How many of the {countLabel(data.openedQuizzes, 'opened quiz', 'opened quizzes')} each student took</Card.Description></Card.Header>
			<Card.Content>
				<BarList items={data.engagement.map((row, index) => ({
					label: row.attempts === 0 ? 'None yet' : index === data.engagement.length - 1 && data.openedQuizzes > 1 ? `All ${row.attempts}` : `${row.attempts} quiz${row.attempts === 1 ? '' : 'zes'}`,
					value: row.students,
					hint: data.students ? `${Math.round((row.students / data.students) * 100)}%` : undefined
				}))} valueLabel={formatNumber} />
			</Card.Content>
		</Card.Root>
		<Card.Root>
			<Card.Header><Card.Title>Top schools</Card.Title><Card.Description>By registered students</Card.Description></Card.Header>
			<Card.Content><BarList items={data.topSchools.map((row) => ({ label: row.name, value: row.count, href: `/admin/students?search=${encodeURIComponent(row.name)}` }))} valueLabel={formatNumber} empty="No registrations yet." /></Card.Content>
		</Card.Root>
		<Card.Root>
			<Card.Header><Card.Title>Top cities</Card.Title><Card.Description>By registered students</Card.Description></Card.Header>
			<Card.Content><BarList items={data.topCities.map((row) => ({ label: row.name, value: row.count, href: `/admin/students?city=${encodeURIComponent(row.name)}` }))} valueLabel={formatNumber} empty="No registrations yet." /></Card.Content>
		</Card.Root>
	</div>

	<Card.Root class="mt-6 gap-0 py-0">
		<Card.Header class="flex flex-row items-center justify-between gap-4 border-b px-5 py-4">
			<div><Card.Title>Latest responses</Card.Title><Card.Description>Most recent submissions across all quizzes</Card.Description></div>
			<Button variant="ghost" size="sm" href="/admin/responses">All responses <ArrowRight /></Button>
		</Card.Header>
		{#if data.latest.length === 0}
			<p class="px-5 py-10 text-center text-sm text-muted-foreground">Responses appear here once students submit a quiz.</p>
		{:else}
			<ul class="divide-y">
				{#each data.latest as response}
					<li class="relative flex items-center justify-between gap-4 px-5 py-3 hover:bg-muted/50">
						<div class="min-w-0">
							<a href={`/admin/responses/${response.id}`} class="block truncate text-sm font-medium after:absolute after:inset-0">{response.fullName}</a>
							<p class="truncate text-xs text-muted-foreground">Week {response.weekNumber}: {response.quizTitle} · {fromNow(response.submittedAt)}</p>
						</div>
						<span class="shrink-0 font-mono text-sm tabular-nums">{response.score}/{response.totalQuestions}</span>
					</li>
				{/each}
			</ul>
		{/if}
	</Card.Root>
{/if}
