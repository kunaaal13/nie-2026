<script lang="ts">
	import { beforeNavigate, goto } from '$app/navigation';
	import { untrack } from 'svelte';
	import { useQueryClient } from '@tanstack/svelte-query';
	import { toast } from 'svelte-sonner';
	import { ArrowDown, ArrowUp, CopyPlus, Lock, Plus, Trash2, X } from '@lucide/svelte';
	import { deleteQuiz, getOverview, getQuiz, listQuizzes, saveQuiz, updateQuizDetails } from '$lib/admin.remote';
	import { quizDetailsSchema, quizInputSchema } from '$lib/validation';
	import * as Card from '$lib/components/ui/card';
	import * as Field from '$lib/components/ui/field';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import * as Alert from '$lib/components/ui/alert';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Switch } from '$lib/components/ui/switch';
	import { Badge } from '$lib/components/ui/badge';
	import DateTimeField from './DateTimeField.svelte';
	import ConfirmDialog from './ConfirmDialog.svelte';

	type Question = { prompt: string; options: string[]; correctOption: number };
	export type QuizDraft = {
		weekNumber: number; title: string; description: string; startIst: string; endIst: string;
		published: boolean; questions: Question[];
	};
	let { initial, prefill, onsaved }: {
		initial?: QuizDraft & { id: string; responseCount: number };
		prefill?: Partial<QuizDraft>;
		onsaved?: () => void;
	} = $props();

	const queryClient = useQueryClient();
	const source = untrack(() => initial ?? prefill);
	const locked = untrack(() => Boolean(initial?.responseCount));
	let weekNumber = $state(source?.weekNumber ?? 1);
	let title = $state(source?.title ?? '');
	let description = $state(source?.description ?? '');
	let startIst = $state(source?.startIst ?? '');
	let endIst = $state(source?.endIst ?? '');
	let published = $state(source?.published ?? false);
	let questions = $state<Question[]>(source?.questions?.map((question) => ({ ...question, options: [...question.options] })) ?? [blankQuestion()]);
	let saving = $state(false);
	let errors = $state<Record<string, string>>({});
	let confirmDelete = $state(false);
	let deleting = $state(false);

	const snapshot = () => JSON.stringify({ weekNumber, title, description, startIst, endIst, published, questions });
	let saved = $state(untrack(snapshot));
	const dirty = $derived(snapshot() !== saved);

	beforeNavigate((navigation) => {
		if (dirty && !saving && !confirm('You have unsaved changes. Leave without saving?')) navigation.cancel();
	});

	function blankQuestion(): Question { return { prompt: '', options: ['', '', '', ''], correctOption: 0 }; }
	function moveQuestion(index: number, direction: number) {
		const next = index + direction;
		if (next < 0 || next >= questions.length) return;
		[questions[index], questions[next]] = [questions[next], questions[index]];
	}
	function duplicateQuestion(index: number) {
		const copy = $state.snapshot(questions[index]);
		questions.splice(index + 1, 0, { ...copy, options: [...copy.options] });
	}
	function removeOption(question: Question, optionIndex: number) {
		question.options.splice(optionIndex, 1);
		if (question.correctOption === optionIndex) question.correctOption = 0;
		else if (question.correctOption > optionIndex) question.correctOption--;
	}
	async function addQuestion() {
		questions.push(blankQuestion());
		await Promise.resolve();
		document.getElementById(`prompt-${questions.length - 1}`)?.focus();
	}

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		if (saving) return;
		const values = { weekNumber: Number(weekNumber), title, description, startIst, endIst, published };
		const parsed = locked
			? quizDetailsSchema.safeParse({ ...values, id: initial!.id })
			: quizInputSchema.safeParse({ ...values, id: initial?.id, questions });
		const nextErrors: Record<string, string> = {};
		if (!startIst) nextErrors.startIst = 'Choose when the quiz opens.';
		if (!endIst) nextErrors.endIst = 'Choose when the quiz closes.';
		if (startIst && endIst && startIst >= endIst) nextErrors.endIst = 'Closing time must be after the opening time.';
		if (!parsed.success) for (const issue of parsed.error.issues) {
			const key = issue.path.join('.');
			nextErrors[key] ??= key.endsWith('prompt') ? 'Enter the question.' : key.includes('options') ? 'Enter this option or remove it.' : key === 'title' ? 'Give the quiz a title.' : issue.message;
		}
		errors = nextErrors;
		if (!parsed.success || Object.keys(nextErrors).length) {
			toast.error(`Fix ${Object.keys(nextErrors).length === 1 ? 'the highlighted field' : `${Object.keys(nextErrors).length} highlighted fields`} before saving.`);
			document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
			return;
		}
		saving = true;
		try {
			const result = locked
				? await updateQuizDetails(parsed.data as Parameters<typeof updateQuizDetails>[0])
				: await saveQuiz(parsed.data as Parameters<typeof saveQuiz>[0]);
			saved = snapshot();
			await Promise.all([
				getOverview().refresh(),
				listQuizzes().refresh(),
				...(initial ? [getQuiz(initial.id).refresh()] : [])
			]);
			await queryClient.invalidateQueries({ queryKey: ['admin'] });
			toast.success(initial ? 'Changes saved' : published ? 'Quiz created and published' : 'Draft saved');
			if (!initial) await goto(`/admin/quizzes/${result.id}`);
			else onsaved?.();
		} catch (cause) {
			toast.error(cause instanceof Error ? cause.message : 'Could not save this quiz.');
		} finally {
			saving = false;
		}
	}

	async function removeQuiz() {
		if (!initial) return;
		deleting = true;
		try {
			await deleteQuiz(initial.id);
			saved = snapshot();
			await Promise.all([getOverview().refresh(), listQuizzes().refresh()]);
			await queryClient.invalidateQueries({ queryKey: ['admin'] });
			toast.success('Quiz deleted');
			await goto('/admin/quizzes');
		} catch (cause) {
			toast.error(cause instanceof Error ? cause.message : 'Could not delete this quiz.');
		} finally {
			deleting = false;
			confirmDelete = false;
		}
	}
</script>

<form class="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]" onsubmit={submit} novalidate>
	<div class="grid min-w-0 gap-6">
		<Card.Root>
			<Card.Header><Card.Title>Details</Card.Title><Card.Description>Students see the week, title and description on the quiz page.</Card.Description></Card.Header>
			<Card.Content>
				<Field.Group class="grid gap-5 sm:grid-cols-[8rem_1fr]">
					<Field.Field data-invalid={!!errors.weekNumber || undefined}>
						<Field.Label for="week-number">Week</Field.Label>
						<Input id="week-number" type="number" min={1} max={52} bind:value={weekNumber} aria-invalid={!!errors.weekNumber} />
						{#if errors.weekNumber}<Field.Error>{errors.weekNumber}</Field.Error>{/if}
					</Field.Field>
					<Field.Field data-invalid={!!errors.title || undefined}>
						<Field.Label for="quiz-title">Title</Field.Label>
						<Input id="quiz-title" bind:value={title} placeholder="e.g. The Friday Quiz" maxlength={160} aria-invalid={!!errors.title} />
						{#if errors.title}<Field.Error>{errors.title}</Field.Error>{/if}
					</Field.Field>
					<Field.Field class="sm:col-span-2">
						<Field.Label for="quiz-description">Description <span class="font-normal text-muted-foreground">(optional)</span></Field.Label>
						<Textarea id="quiz-description" bind:value={description} placeholder="A short note shown above the questions" maxlength={1000} rows={2} />
					</Field.Field>
				</Field.Group>
			</Card.Content>
		</Card.Root>

		<section class="grid gap-4" aria-labelledby="questions-heading">
			<div class="flex flex-wrap items-end justify-between gap-3">
				<div>
					<h2 id="questions-heading" class="text-lg font-medium tracking-[-0.02em]">Questions <span class="text-muted-foreground tabular-nums">{questions.length}</span></h2>
					<p class="text-sm text-muted-foreground">{locked ? 'Questions are locked because students have already answered them.' : 'Single-choice questions with 2–6 options. Select the correct answer with the radio button.'}</p>
				</div>
				{#if locked}<Badge variant="secondary"><Lock /> Locked</Badge>{/if}
			</div>

			{#each questions as question, index}
				<Card.Root class="gap-4">
					<Card.Header class="flex flex-row items-center justify-between gap-3">
						<Card.Title class="text-sm font-medium text-muted-foreground">Question {index + 1}</Card.Title>
						{#if !locked}
							<div class="-my-1 flex gap-0.5">
								<Button variant="ghost" size="icon-sm" aria-label={`Move question ${index + 1} up`} disabled={index === 0} onclick={() => moveQuestion(index, -1)}><ArrowUp /></Button>
								<Button variant="ghost" size="icon-sm" aria-label={`Move question ${index + 1} down`} disabled={index === questions.length - 1} onclick={() => moveQuestion(index, 1)}><ArrowDown /></Button>
								<Button variant="ghost" size="icon-sm" aria-label={`Duplicate question ${index + 1}`} disabled={questions.length >= 100} onclick={() => duplicateQuestion(index)}><CopyPlus /></Button>
								<Button variant="ghost" size="icon-sm" class="text-destructive hover:text-destructive" aria-label={`Delete question ${index + 1}`} disabled={questions.length === 1} onclick={() => questions.splice(index, 1)}><Trash2 /></Button>
							</div>
						{/if}
					</Card.Header>
					<Card.Content class="grid gap-4">
						<Field.Field data-invalid={!!errors[`questions.${index}.prompt`] || undefined}>
							<Field.Label for={`prompt-${index}`} class="sr-only">Question {index + 1} text</Field.Label>
							<Textarea id={`prompt-${index}`} bind:value={question.prompt} placeholder="Type the question" rows={2} maxlength={500} readonly={locked}
								aria-invalid={!!errors[`questions.${index}.prompt`]} class="text-base" />
							{#if errors[`questions.${index}.prompt`]}<Field.Error>{errors[`questions.${index}.prompt`]}</Field.Error>{/if}
						</Field.Field>
						<Field.Set>
							<Field.Legend variant="label" class="text-muted-foreground">Options · select the correct answer</Field.Legend>
							<RadioGroup.Root value={String(question.correctOption)} onValueChange={(value) => question.correctOption = Number(value)} disabled={locked} class="gap-2">
								{#each question.options as _, optionIndex}
									{@const key = `questions.${index}.options.${optionIndex}`}
									<div class={['flex items-center gap-3 rounded-md border py-1 pr-1 pl-3 transition-colors', question.correctOption === optionIndex ? 'border-success/40 bg-green-50/60' : 'border-border']}>
										<RadioGroup.Item value={String(optionIndex)} id={`correct-${index}-${optionIndex}`} aria-label={`Mark option ${optionIndex + 1} as correct`} />
										<span class="w-4 font-mono text-xs text-muted-foreground">{String.fromCharCode(65 + optionIndex)}</span>
										<Input id={`option-${index}-${optionIndex}`} bind:value={question.options[optionIndex]} placeholder={`Option ${optionIndex + 1}`} maxlength={250} readonly={locked}
											aria-label={`Question ${index + 1}, option ${optionIndex + 1}`} aria-invalid={!!errors[key]}
											class="h-8 border-transparent bg-transparent px-1 shadow-none focus-visible:border-input" />
										{#if question.correctOption === optionIndex}<span class="hidden shrink-0 text-xs font-medium text-success sm:inline">Correct</span>{/if}
										{#if !locked}
											<Button variant="ghost" size="icon-sm" aria-label={`Remove option ${optionIndex + 1}`} disabled={question.options.length <= 2} onclick={() => removeOption(question, optionIndex)}><X /></Button>
										{/if}
									</div>
								{/each}
							</RadioGroup.Root>
							{#if question.options.some((_, optionIndex) => errors[`questions.${index}.options.${optionIndex}`])}<Field.Error>Fill in every option or remove the empty ones.</Field.Error>{/if}
							{#if !locked && question.options.length < 6}
								<Button variant="ghost" size="sm" class="w-fit text-muted-foreground" onclick={() => question.options.push('')}><Plus /> Add option</Button>
							{/if}
						</Field.Set>
					</Card.Content>
				</Card.Root>
			{/each}

			{#if !locked}
				<Button variant="outline" class="h-12 border-dashed" onclick={addQuestion} disabled={questions.length >= 100}><Plus /> Add question</Button>
			{/if}
		</section>
	</div>

	<aside class="grid gap-4 lg:sticky lg:top-20">
		<Card.Root>
			<Card.Header><Card.Title>Schedule</Card.Title><Card.Description>Times are India Standard Time.</Card.Description></Card.Header>
			<Card.Content>
				<Field.Group class="gap-5">
					<Field.Field data-invalid={!!errors.startIst || undefined}>
						<Field.Label for="quiz-start">Opens</Field.Label>
						<DateTimeField id="quiz-start" bind:value={startIst} invalid={!!errors.startIst} />
						{#if errors.startIst}<Field.Error>{errors.startIst}</Field.Error>{/if}
					</Field.Field>
					<Field.Field data-invalid={!!errors.endIst || undefined}>
						<Field.Label for="quiz-end">Closes</Field.Label>
						<DateTimeField id="quiz-end" bind:value={endIst} invalid={!!errors.endIst} />
						{#if errors.endIst}<Field.Error>{errors.endIst}</Field.Error>{/if}
					</Field.Field>
					<Field.Separator />
					<Field.Field orientation="horizontal">
						<Field.Content>
							<Field.Label for="quiz-published">Published</Field.Label>
							<Field.Description>{published ? 'Students can take it during its window.' : 'Saved as a draft. Students can’t see it.'}</Field.Description>
						</Field.Content>
						<Switch id="quiz-published" bind:checked={published} />
					</Field.Field>
				</Field.Group>
			</Card.Content>
			<Card.Footer class="flex-col items-stretch gap-2 border-t">
				<Button type="submit" disabled={saving || (!!initial && !dirty)}>{saving ? 'Saving…' : initial ? 'Save changes' : published ? 'Create and publish' : 'Save draft'}</Button>
				<p class="text-center text-xs text-muted-foreground" aria-live="polite">{dirty ? 'You have unsaved changes' : initial ? 'All changes saved' : `${questions.length} question${questions.length === 1 ? '' : 's'}`}</p>
			</Card.Footer>
		</Card.Root>

		{#if locked}
			<Alert.Root>
				<Lock />
				<Alert.Title>{initial?.responseCount} response{initial?.responseCount === 1 ? '' : 's'} received</Alert.Title>
				<Alert.Description>You can still change the details and schedule. Questions are locked so existing scores stay correct.</Alert.Description>
			</Alert.Root>
		{/if}

		{#if initial}
			<Card.Root class="border-destructive/25">
				<Card.Header><Card.Title class="text-sm">Delete quiz</Card.Title><Card.Description>{locked ? 'Quizzes with responses can’t be deleted. Unpublish it instead.' : 'Permanently removes the quiz and its questions.'}</Card.Description></Card.Header>
				<Card.Content><Button variant="destructive" class="w-full" disabled={locked} onclick={() => confirmDelete = true}><Trash2 /> Delete quiz</Button></Card.Content>
			</Card.Root>
		{/if}
	</aside>
</form>

<ConfirmDialog bind:open={confirmDelete} title="Delete this quiz?" description="The quiz and all of its questions will be removed. This can't be undone." pending={deleting} onconfirm={removeQuiz} />
