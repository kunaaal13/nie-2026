<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { createQuery, useQueryClient } from '@tanstack/svelte-query';
	import { toast } from 'svelte-sonner';
	import { ArrowRight, Trash2 } from '@lucide/svelte';
	import { deleteStudent, getStudent, updateStudent } from '$lib/admin.remote';
	import { studentUpdateSchema } from '$lib/validation';
	import { formatIstDateTime, formatIstShort } from '$lib/ist';
	import * as Card from '$lib/components/ui/card';
	import * as Field from '$lib/components/ui/field';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import PageHeader from '$lib/components/admin/PageHeader.svelte';
	import ScoreBadge from '$lib/components/admin/ScoreBadge.svelte';
	import ConfirmDialog from '$lib/components/admin/ConfirmDialog.svelte';
	import QueryError from '$lib/components/admin/QueryError.svelte';

	type Form = { fullName: string; email: string; className: string; section: string; school: string; city: string; schoolAddress: string; mobileNumber: string; heardAbout: string };
	const fields: { key: keyof Form; label: string; type?: string; wide?: boolean }[] = [
		{ key: 'fullName', label: 'Full name' },
		{ key: 'email', label: 'Email', type: 'email' },
		{ key: 'className', label: 'Class' },
		{ key: 'section', label: 'Section' },
		{ key: 'school', label: 'School', wide: true },
		{ key: 'city', label: 'City' },
		{ key: 'mobileNumber', label: 'Mobile / WhatsApp number', type: 'tel' },
		{ key: 'heardAbout', label: 'How they heard about Read India', wide: true }
	];

	const queryClient = useQueryClient();
	const id = $derived(page.params.id!);
	const student = createQuery(() => ({ queryKey: ['admin', 'student', id], queryFn: () => getStudent(id) }));
	let form = $state<Form | null>(null);
	let errors = $state<Partial<Record<keyof Form, string>>>({});
	let saving = $state(false);
	let confirmDelete = $state(false);
	let deleting = $state(false);

	const original = $derived(student.data ? pick(student.data) : null);
	const dirty = $derived(form && original ? JSON.stringify(form) !== JSON.stringify(original) : false);
	const average = $derived(student.data?.submissions.length
		? Math.round(student.data.submissions.reduce((sum, row) => sum + (row.score * 100) / row.totalQuestions, 0) / student.data.submissions.length)
		: null);

	function pick(source: Form): Form {
		const { fullName, email, className, section, school, city, schoolAddress, mobileNumber, heardAbout } = source;
		return { fullName, email, className, section, school, city, schoolAddress, mobileNumber, heardAbout };
	}
	$effect(() => {
		if (original && !form) form = { ...original };
	});

	async function save(event: SubmitEvent) {
		event.preventDefault();
		if (!form || saving) return;
		const parsed = studentUpdateSchema.safeParse({ ...form, id });
		errors = {};
		if (!parsed.success) {
			for (const issue of parsed.error.issues) errors[issue.path[0] as keyof Form] ??= issue.path[0] === 'email' ? 'Enter a valid email address.' : 'This field is required.';
			return;
		}
		saving = true;
		try {
			await updateStudent(parsed.data);
			form = pick(parsed.data);
			await getStudent(id).refresh();
			await queryClient.invalidateQueries({ queryKey: ['admin'] });
			toast.success('Student details saved');
		} catch (cause) {
			toast.error(cause instanceof Error ? cause.message : 'Could not save these details.');
		} finally {
			saving = false;
		}
	}

	async function remove() {
		deleting = true;
		try {
			await deleteStudent(id);
			await queryClient.invalidateQueries({ queryKey: ['admin'] });
			toast.success('Student deleted');
			await goto('/admin/students');
		} catch (cause) {
			toast.error(cause instanceof Error ? cause.message : 'Could not delete this student.');
		} finally {
			deleting = false;
			confirmDelete = false;
		}
	}
</script>

<svelte:head><title>{student.data?.fullName ?? 'Student'} — NIE Read India Admin</title></svelte:head>

{#if student.isPending}
	<Skeleton class="mb-6 h-16 w-80" />
	<div class="grid gap-6 lg:grid-cols-[1fr_22rem]"><Skeleton class="h-96" /><Skeleton class="h-72" /></div>
{:else if student.isError}
	<QueryError error={student.error} retry={() => student.refetch()} />
{:else}
	{@const data = student.data}
	<PageHeader title={data.fullName} crumbs={[{ href: '/admin/students', label: 'Students' }]}
		description={`Registered ${formatIstDateTime(data.createdAt)}`}>
		{#snippet actions()}<Button variant="destructive" onclick={() => confirmDelete = true}><Trash2 /> Delete student</Button>{/snippet}
	</PageHeader>

	<div class="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
		<Card.Root>
			<Card.Header><Card.Title>Registration details</Card.Title><Card.Description>Fix typos here. The email is what the student enters to take quizzes.</Card.Description></Card.Header>
			{#if form}
				<form onsubmit={save} novalidate>
					<Card.Content>
						<Field.Group class="grid gap-5 sm:grid-cols-2">
							{#each fields as field}
								<Field.Field class={field.wide ? 'sm:col-span-2' : ''} data-invalid={!!errors[field.key] || undefined}>
									<Field.Label for={`student-${field.key}`}>{field.label}</Field.Label>
									<Input id={`student-${field.key}`} type={field.type ?? 'text'} bind:value={form[field.key]} aria-invalid={!!errors[field.key]} />
									{#if errors[field.key]}<Field.Error>{errors[field.key]}</Field.Error>{/if}
								</Field.Field>
							{/each}
							<Field.Field class="sm:col-span-2" data-invalid={!!errors.schoolAddress || undefined}>
								<Field.Label for="student-schoolAddress">School address</Field.Label>
								<Textarea id="student-schoolAddress" rows={2} bind:value={form.schoolAddress} aria-invalid={!!errors.schoolAddress} />
								{#if errors.schoolAddress}<Field.Error>{errors.schoolAddress}</Field.Error>{/if}
							</Field.Field>
						</Field.Group>
					</Card.Content>
					<Card.Footer class="mt-6 justify-end gap-2 border-t">
						<Button variant="ghost" disabled={!dirty || saving} onclick={() => { form = original ? { ...original } : form; errors = {}; }}>Discard</Button>
						<Button type="submit" disabled={!dirty || saving}>{saving ? 'Saving…' : 'Save changes'}</Button>
					</Card.Footer>
				</form>
			{/if}
		</Card.Root>

		<div class="grid gap-4">
			<Card.Root class="gap-0 py-0">
				<div class="grid grid-cols-2 divide-x">
					<div class="p-5"><p class="text-sm text-muted-foreground">Quizzes taken</p><p class="mt-2 text-[2rem] leading-none font-medium tracking-[-0.03em] tabular-nums">{data.submissions.length}</p></div>
					<div class="p-5"><p class="text-sm text-muted-foreground">Average score</p><p class="mt-2 text-[2rem] leading-none font-medium tracking-[-0.03em] tabular-nums">{average === null ? '—' : `${average}%`}</p></div>
				</div>
			</Card.Root>
			<Card.Root class="gap-0 py-0">
				<Card.Header class="border-b px-5 py-4"><Card.Title>Quiz history</Card.Title></Card.Header>
				{#if data.submissions.length === 0}
					<p class="px-5 py-8 text-center text-sm text-muted-foreground">This student hasn't taken a quiz yet.</p>
				{:else}
					<ul class="divide-y">
						{#each data.submissions as submission (submission.id)}
							<li class="relative flex items-center justify-between gap-3 px-5 py-3 hover:bg-muted/50">
								<div class="min-w-0">
									<a href={`/admin/responses/${submission.id}`} class="block truncate text-sm font-medium after:absolute after:inset-0">Week {submission.weekNumber}: {submission.quizTitle}</a>
									<p class="text-xs text-muted-foreground">{formatIstShort(submission.submittedAt)}</p>
								</div>
								<div class="flex shrink-0 items-center gap-2"><ScoreBadge score={submission.score} total={submission.totalQuestions} /><ArrowRight class="size-4 text-muted-foreground" /></div>
							</li>
						{/each}
					</ul>
				{/if}
			</Card.Root>
		</div>
	</div>

	<ConfirmDialog bind:open={confirmDelete} title={`Delete ${data.fullName}?`}
		description={`This removes the registration${data.submissions.length ? ` and all ${data.submissions.length} quiz response${data.submissions.length === 1 ? '' : 's'}` : ''}. This can't be undone.`}
		pending={deleting} onconfirm={remove} />
{/if}
