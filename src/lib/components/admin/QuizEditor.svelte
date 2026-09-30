<script lang="ts">
	import { goto } from '$app/navigation';
	import { untrack } from 'svelte';
	import { useQueryClient } from '@tanstack/svelte-query';
	import { ArrowLeft, ArrowDown, ArrowUp, Plus, Trash2 } from '@lucide/svelte';
	import { deleteQuiz, saveQuiz } from '$lib/admin.remote';
	import { quizInputSchema } from '$lib/validation';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';

	type Question = { prompt: string; options: string[]; correctOption: number };
	type InitialQuiz = {
		id: string; weekNumber: number; title: string; description: string; startIst: string; endIst: string;
		published: boolean; responseCount: number; questions: Question[];
	};
	let { initial }: { initial?: InitialQuiz } = $props();
	const queryClient = useQueryClient();
	const snapshot = untrack(() => initial);
	let locked = $derived(Boolean(initial?.responseCount));
	let weekNumber = $state(snapshot?.weekNumber ?? 1);
	let title = $state(snapshot?.title ?? '');
	let description = $state(snapshot?.description ?? '');
	let startIst = $state(snapshot?.startIst ?? '');
	let endIst = $state(snapshot?.endIst ?? '');
	let published = $state(snapshot?.published ?? false);
	let questions = $state<Question[]>(snapshot?.questions.map((question) => ({ ...question, options: [...question.options] })) ?? [blankQuestion()]);
	let saving = $state(false);
	let deleting = $state(false);
	let message = $state('');
	let success = $state('');

	function blankQuestion(): Question { return { prompt: '', options: ['', '', '', ''], correctOption: 0 }; }
	function moveQuestion(index: number, direction: number) {
		const next = index + direction;
		if (next < 0 || next >= questions.length) return;
		[questions[index], questions[next]] = [questions[next], questions[index]];
	}

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		if (saving || locked) return;
		const parsed = quizInputSchema.safeParse({ id: initial?.id, weekNumber: Number(weekNumber), title, description, startIst, endIst, published, questions });
		if (!parsed.success) { message = parsed.error.issues[0]?.message ?? 'Check the quiz details.'; return; }
		saving = true;
		message = '';
		success = '';
		try {
			const result = await saveQuiz(parsed.data);
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ['admin', 'quizzes'] }),
				queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] }),
				queryClient.invalidateQueries({ queryKey: ['admin', 'quiz', result.id] })
			]);
			if (!initial) await goto('/admin/quizzes/' + result.id);
			else success = 'Quiz saved.';
		} catch (cause) {
			message = cause instanceof Error ? cause.message : 'Could not save this quiz.';
		} finally { saving = false; }
	}

	async function removeQuiz() {
		if (!initial || locked || !confirm('Delete this quiz and its questions?')) return;
		deleting = true;
		try {
			await deleteQuiz(initial.id);
			await queryClient.invalidateQueries({ queryKey: ['admin', 'quizzes'] });
			await goto('/admin/quizzes');
		} catch (cause) {
			message = cause instanceof Error ? cause.message : 'Could not delete this quiz.';
		} finally { deleting = false; }
	}
</script>

<div class="mb-6"><a href="/admin/quizzes" class="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"><ArrowLeft class="size-4" /> Back to quizzes</a><h1 class="mt-3 text-3xl font-bold tracking-tight">{initial ? `Week ${initial.weekNumber} quiz` : 'Create a quiz'}</h1><p class="mt-2 text-sm text-slate-500">Times entered here are interpreted in India Standard Time. The quiz opens at the start time and closes at the end time.</p></div>

{#if locked}<div class="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">This quiz has {initial?.responseCount} response(s), so its schedule and questions are locked to preserve submitted answers.</div>{/if}

<form class="grid gap-6" onsubmit={submit}>
	<fieldset disabled={locked || saving} class="grid gap-6 disabled:opacity-75">
		<Card.Root><Card.Header><Card.Title>Quiz details</Card.Title><Card.Description>Only published quizzes appear to students.</Card.Description></Card.Header><Card.Content class="grid gap-5 sm:grid-cols-2">
			<div class="grid gap-2"><Label for="week-number">Week number</Label><Input id="week-number" type="number" min={1} max={52} bind:value={weekNumber} required /></div>
			<div class="grid gap-2"><Label for="quiz-title">Title</Label><Input id="quiz-title" bind:value={title} placeholder="The Friday Quiz" required /></div>
			<div class="grid gap-2 sm:col-span-2"><Label for="quiz-description">Description</Label><Textarea id="quiz-description" bind:value={description} placeholder="A short note for this week" /></div>
			<div class="grid gap-2"><Label for="quiz-start">Start time (IST)</Label><Input id="quiz-start" type="datetime-local" bind:value={startIst} required /></div>
			<div class="grid gap-2"><Label for="quiz-end">End time (IST)</Label><Input id="quiz-end" type="datetime-local" bind:value={endIst} required /></div>
			<label class="flex items-center gap-3 rounded-lg border p-4 sm:col-span-2"><input class="size-4 accent-emerald-700" type="checkbox" bind:checked={published} /><span><span class="block text-sm font-semibold">Published</span><span class="text-xs text-slate-500">Students can see this quiz during its scheduled window.</span></span></label>
		</Card.Content></Card.Root>

		<div class="flex flex-wrap items-center justify-between gap-3"><div><h2 class="text-xl font-bold">Questions</h2><p class="text-sm text-slate-500">Single-select MCQs. Add as many as you need, up to 100.</p></div><Button type="button" variant="outline" onclick={() => questions = [...questions, blankQuestion()]} disabled={questions.length >= 100}><Plus class="mr-2 size-4" /> Add question</Button></div>
		<div class="grid gap-4">
			{#each questions as question, index}
				<Card.Root><Card.Header class="flex-row items-center justify-between gap-3"><div><Card.Title class="text-lg">Question {index + 1}</Card.Title></div><div class="flex gap-1"><Button type="button" variant="ghost" size="icon" aria-label={'Move question ' + (index + 1) + ' up'} disabled={index === 0} onclick={() => moveQuestion(index, -1)}><ArrowUp class="size-4" /></Button><Button type="button" variant="ghost" size="icon" aria-label={'Move question ' + (index + 1) + ' down'} disabled={index === questions.length - 1} onclick={() => moveQuestion(index, 1)}><ArrowDown class="size-4" /></Button><Button type="button" variant="ghost" size="icon" aria-label={'Remove question ' + (index + 1)} disabled={questions.length === 1} onclick={() => questions = questions.filter((_, i) => i !== index)}><Trash2 class="size-4 text-red-600" /></Button></div></Card.Header>
				<Card.Content class="grid gap-4"><div class="grid gap-2"><Label for={'prompt-' + index}>Question text</Label><Textarea id={'prompt-' + index} bind:value={question.prompt} required /></div><div class="grid gap-3 sm:grid-cols-2">
					{#each question.options as option, optionIndex}<div class="grid gap-2"><Label for={'option-' + index + '-' + optionIndex}>Option {optionIndex + 1}</Label><div class="flex gap-2"><Input id={'option-' + index + '-' + optionIndex} bind:value={question.options[optionIndex]} required /><Button type="button" variant="outline" size="icon" aria-label={'Remove option ' + (optionIndex + 1)} disabled={question.options.length <= 2} onclick={() => { question.options.splice(optionIndex, 1); if (question.correctOption >= question.options.length) question.correctOption = 0; }}><Trash2 class="size-4" /></Button></div></div>{/each}
				</div><div class="flex flex-wrap items-end gap-4"><div class="grid min-w-44 gap-2"><Label for={'correct-' + index}>Correct answer</Label><select id={'correct-' + index} bind:value={question.correctOption} class="h-9 rounded-md border border-input bg-transparent px-3 text-sm">{#each question.options as _, optionIndex}<option value={optionIndex}>Option {optionIndex + 1}</option>{/each}</select></div><Button type="button" variant="outline" disabled={question.options.length >= 6} onclick={() => question.options.push('')}>Add option</Button></div></Card.Content></Card.Root>
			{/each}
		</div>
	</fieldset>
	{#if message}<p class="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">{message}</p>{/if}
	{#if success}<p class="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800" role="status">{success}</p>{/if}
	<div class="flex flex-wrap gap-3"><Button type="submit" disabled={saving || locked}>{saving ? 'Saving…' : initial ? 'Save changes' : 'Create quiz'}</Button>{#if initial && !locked}<Button type="button" variant="destructive" disabled={deleting} onclick={removeQuiz}>{deleting ? 'Deleting…' : 'Delete quiz'}</Button>{/if}</div>
</form>
