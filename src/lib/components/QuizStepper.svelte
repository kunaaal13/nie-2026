<script lang="ts">
	import { onMount } from 'svelte';
	import { submitQuiz as saveQuizResponse } from '$lib/public.remote';
	import { quizDraftKey, restoreQuizDraft } from '$lib/quiz-draft';
	import QuizSuccessDialog from './QuizSuccessDialog.svelte';

	type Question = { id: string; prompt: string; options: string[] };
	type Quiz = { id: string; title: string; weekNumber: number; endAtIst: string; questions: Question[] };
	let { quiz }: { quiz: Quiz } = $props();

	let answers = $state<Record<string, number>>({});
	let email = $state('');
	let step = $state(0);
	let emailReturnStep = $state(1);
	let restored = $state(false);
	let showSuccess = $state(false);
	let submitted = $state(false);
	let isSubmitting = $state(false);
	let formError = $state('');
	let emailInput = $state<HTMLInputElement>();
	let stepHeading = $state<HTMLElement>();

	let answeredCount = $derived(quiz.questions.filter((question) => answers[question.id] !== undefined).length);
	let currentQuestion = $derived(step > 0 && step <= quiz.questions.length ? quiz.questions[step - 1] : null);
	let draftKey = $derived(quizDraftKey(quiz.id));

	onMount(() => {
		try {
			const registration = sessionStorage.getItem('nie-registration-preview');
			if (registration) {
				const value = JSON.parse(registration);
				if (typeof value.email === 'string') email = value.email;
			}
		} catch {
			// The student can enter their email directly.
		}
		try {
			const draft = restoreQuizDraft(localStorage.getItem(draftKey), quiz.id, quiz.questions);
			if (draft) {
				email = draft.email;
				answers = draft.answers;
				step = draft.step;
			}
		} catch {
			// Storage may be unavailable in a private or restricted browser context.
		}
		restored = true;
	});

	$effect(() => {
		if (!restored || submitted) return;
		try {
			localStorage.setItem(draftKey, JSON.stringify({ version: 1, quizId: quiz.id, email, step, answers }));
		} catch {
			// Quiz navigation still works if the browser does not allow local storage.
		}
	});

	function goTo(nextStep: number) {
		if (nextStep === 0 && step > 0) emailReturnStep = step;
		step = Math.max(0, Math.min(quiz.questions.length + 1, nextStep));
		formError = '';
		requestAnimationFrame(() => stepHeading?.focus());
	}

	function startQuiz(event: SubmitEvent) {
		event.preventDefault();
		if (!emailInput?.reportValidity()) return;
		email = email.trim().toLowerCase();
		goTo(emailReturnStep);
	}

	function selectAnswer(questionId: string, optionIndex: number) {
		answers = { ...answers, [questionId]: optionIndex };
		formError = '';
	}

	async function submitQuiz() {
		if (isSubmitting) return;
		const missing = quiz.questions.findIndex((question) => answers[question.id] === undefined);
		if (missing !== -1) {
			goTo(missing + 1);
			formError = 'Choose an answer before submitting your quiz.';
			return;
		}
		if (!email.trim()) {
			goTo(0);
			formError = 'Enter your registered email to continue.';
			return;
		}
		formError = '';
		isSubmitting = true;
		try {
			await saveQuizResponse({
				quizId: quiz.id,
				email: email.trim().toLowerCase(),
				answers: quiz.questions.map((question) => ({ questionId: question.id, selectedOption: answers[question.id] }))
			});
			submitted = true;
			showSuccess = true;
			try { localStorage.removeItem(draftKey); } catch { /* Storage may be unavailable. */ }
		} catch (cause) {
			formError = cause instanceof Error ? cause.message : 'Submission failed. Please try again.';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<svelte:window onkeydown={(event) => { if (event.key === 'Escape') showSuccess = false; }} />

<section class="relative z-20 mx-auto mt-[clamp(64px,5vw,96px)] w-[min(calc(100%-48px),1120px)] pb-14 font-['Epilogue_Variable',sans-serif] text-black max-[600px]:mt-10 max-[600px]:w-[min(calc(100%-32px),520px)]" aria-label={`${quiz.title} quiz`}>
	<div class="mx-auto mb-12 max-w-[1036px] px-1 max-[600px]:mb-11">
		<div class="mb-2 flex items-center justify-between gap-4 text-sm font-bold text-[#293e2f] max-[600px]:text-xs">
			<span>{step === 0 ? 'Your details' : step > quiz.questions.length ? 'Review and submit' : `Question ${step} of ${quiz.questions.length}`}</span>
			<span>{answeredCount} of {quiz.questions.length} answered</span>
		</div>
		<div class="h-2 overflow-hidden rounded-full bg-[#fbd991]" role="progressbar" aria-label="Quiz progress" aria-valuenow={answeredCount} aria-valuemin="0" aria-valuemax={quiz.questions.length}>
			<div class="h-full rounded-full bg-[#009c55] transition-[width] duration-200" style:width={`${quiz.questions.length ? (answeredCount / quiz.questions.length) * 100 : 0}%`}></div>
		</div>
	</div>

	{#if submitted}
		<div class="mx-auto max-w-[1036px] rounded-[30px] border-[5px] border-[#ef5f24] bg-[#fceb99] px-[clamp(24px,7vw,72px)] py-14 text-center">
			<h2 class="text-[clamp(1.7rem,3.5vw,2.6rem)] font-bold">Your quiz is in!</h2>
			<p class="mt-3 text-lg">Thanks for taking the Read India challenge.</p>
			<button class="mt-5 cursor-pointer rounded-xl bg-[#009c55] px-6 py-3 font-bold text-white" type="button" onclick={() => showSuccess = true}>See confirmation</button>
		</div>
	{:else if step === 0}
		<form class="relative mx-auto max-w-[1036px] rounded-[30px] border-[5px] border-[#ef5f24] bg-[#fceb99] px-[clamp(24px,7vw,76px)] pt-[clamp(45px,6vw,70px)] pb-14 max-[600px]:rounded-[24px] max-[600px]:border-[4px] max-[600px]:pt-28" onsubmit={startQuiz}>
			<div class="absolute -top-8 -left-6 grid size-[88px] place-items-center rounded-full border-[4px] border-[#ef5f24] bg-[#ffb13b] font-['Patrick_Hand',cursive] text-[1.55rem] max-[600px]:-left-3 max-[600px]:size-[72px]" aria-hidden="true">START</div>
			<img class="pointer-events-none absolute -top-8 right-2 h-auto w-[clamp(110px,20vw,190px)] rotate-[8deg] max-[600px]:-top-5 max-[600px]:-right-3 max-[600px]:w-[115px]" src="/assets/figma/success-fox-happy4-x1.png" alt="" />
			<h2 bind:this={stepHeading} tabindex="-1" class="relative z-10 mb-4 max-w-[700px] text-[clamp(1.65rem,3.4vw,2.6rem)] leading-[1.18] font-bold outline-none">First, what’s your registered email?</h2>
			<p class="relative z-10 mb-7 max-w-[700px] text-[clamp(1rem,1.7vw,1.3rem)] leading-[1.4]">We’ll use it to match your answers to your registration. Your progress is saved on this device as you go.</p>
			<label class="relative z-10 block max-w-[650px] text-lg font-semibold" for="quiz-email">Registered email</label>
			<input bind:this={emailInput} id="quiz-email" name="email" type="email" autocomplete="email" bind:value={email} required class="relative z-10 mt-2 block min-h-[60px] w-full max-w-[650px] rounded-xl border-[3px] border-[#ef5f24] bg-white px-4 text-lg text-black focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#009c55]" />
			{#if formError}<p class="relative z-10 mt-4 rounded-lg bg-white px-4 py-3 font-semibold text-[#a02500]" role="alert">{formError}</p>{/if}
			<div class="relative z-10 mt-8 flex justify-end">
				<button class="cursor-pointer rounded-xl bg-[#ef5f24] px-8 py-4 text-lg font-bold text-white hover:bg-[#d94717] focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#009c55]" type="submit">Start quiz →</button>
			</div>
		</form>
	{:else if currentQuestion}
		<div class="relative mx-auto max-w-[1036px]">
			<fieldset class="relative min-h-[348px] rounded-[30px] border-[5px] border-[#ef5f24] bg-[#fceb99] px-[clamp(28px,7vw,72px)] pt-[clamp(60px,6vw,68px)] pb-[74px] max-[600px]:min-h-[390px] max-[600px]:rounded-[24px] max-[600px]:border-[4px] max-[600px]:pb-[82px]">
				<legend class="sr-only">Question {step} of {quiz.questions.length}</legend>
				<div class="absolute -top-8 -left-5 grid h-[88px] w-[91px] place-items-center max-[600px]:-left-3 max-[600px]:h-[70px] max-[600px]:w-[72px]" aria-hidden="true">
					<img class="absolute left-0 top-0 block h-auto max-w-full" src="/assets/figma/quiz-step-badge.svg" alt="" width="91" height="88" />
					<span class="relative z-10 font-['Patrick_Hand',cursive] text-[clamp(1.55rem,3vw,2.6rem)] leading-none">Q{step}.</span>
				</div>
				<h2 bind:this={stepHeading} tabindex="-1" class="mb-8 text-[clamp(1.5rem,3.2vw,2.5rem)] leading-[1.25] font-bold outline-none">{currentQuestion.prompt}</h2>
				<div class="quiz-options gap-x-16 gap-y-3 max-[700px]:gap-y-4" style={`--option-rows: ${Math.ceil(currentQuestion.options.length / 2)}`}>
					{#each currentQuestion.options as option, optionIndex}
						<label class={`flex min-w-0 cursor-pointer items-start gap-3 rounded-xl px-2 py-1 text-[clamp(1.15rem,2.6vw,2.15rem)] leading-[1.25] has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-[#009c55] ${answers[currentQuestion.id] === optionIndex ? 'bg-[#fff6c5]' : ''}`}>
							<input class="mt-[.22em] size-[.75em] min-h-5 min-w-5 flex-none accent-[#ef5f24]" type="radio" name={`question-${currentQuestion.id}`} value={optionIndex} checked={answers[currentQuestion.id] === optionIndex} onchange={() => selectAnswer(currentQuestion.id, optionIndex)} />
							<span class="min-w-0 break-words">{option}</span>
						</label>
					{/each}
				</div>
				{#if formError}<p class="mt-5 rounded-lg bg-white px-4 py-3 font-semibold text-[#a02500]" role="alert">{formError}</p>{/if}
			</fieldset>
			<div class="relative z-10 -mt-10 flex items-center justify-between gap-3 px-[6%] max-[600px]:-mt-9 max-[600px]:px-3">
				<button class="w-[min(42%,171px)] min-w-0 cursor-pointer border-0 bg-transparent p-0 hover:brightness-95 focus-visible:rounded-xl focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#009c55]" type="button" aria-label={step === 1 ? 'Back to email' : 'Previous question'} onclick={() => goTo(step - 1)}><img class="block h-auto max-w-full [transform:rotate(180deg)_scaleY(-1)]" src="/assets/figma/quiz-step-prev.svg" alt="" width="171" height="82" /></button>
				<button class="w-[min(42%,171px)] min-w-0 cursor-pointer border-0 bg-transparent p-0 hover:brightness-95 focus-visible:rounded-xl focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#009c55]" type="button" aria-label={step === quiz.questions.length ? 'Review answers' : 'Next question'} onclick={() => goTo(step + 1)}><img class="block h-auto max-w-full" src="/assets/figma/quiz-step-next.svg" alt="" width="171" height="82" /></button>
			</div>
		</div>
	{:else}
		<div class="relative mx-auto max-w-[1036px] rounded-[30px] border-[5px] border-[#ef5f24] bg-[#fceb99] px-[clamp(26px,7vw,72px)] pt-14 pb-16 max-[600px]:rounded-[24px] max-[600px]:border-[4px]">
			<span class="absolute -top-7 -left-4 rotate-[-4deg] rounded-xl bg-[#ffb13b] px-5 py-2 font-['Patrick_Hand',cursive] text-[clamp(1.4rem,3vw,2rem)]">ALL DONE?</span>
			<h2 bind:this={stepHeading} tabindex="-1" class="mb-4 text-[clamp(1.7rem,3.5vw,2.6rem)] leading-[1.2] font-bold outline-none">Ready to send your answers?</h2>
			<p class="mb-5 text-[clamp(1rem,1.7vw,1.3rem)]">You answered <strong>{answeredCount} of {quiz.questions.length}</strong> questions. Review your email and submit when you’re ready.</p>
			<div class="mb-6 rounded-xl bg-white/80 p-5 text-lg leading-[1.4]">
				<p class="m-0 font-semibold">Registered email</p>
				<p class="my-1 break-all">{email}</p>
				<button class="cursor-pointer border-0 bg-transparent p-0 font-bold text-[#006d3d] underline underline-offset-2" type="button" onclick={() => goTo(0)}>Edit email</button>
			</div>
			<p class="mb-6 text-sm">Quiz closes {quiz.endAtIst}. Your answers are saved on this device until submission.</p>
			{#if formError}<p class="mb-5 rounded-lg bg-white px-4 py-3 font-semibold text-[#a02500]" role="alert">{formError}</p>{/if}
			<div class="flex flex-wrap items-center justify-between gap-4">
				<button class="cursor-pointer rounded-xl border-[3px] border-[#ef5f24] bg-white px-6 py-3 font-bold text-[#b23c17]" type="button" onclick={() => goTo(quiz.questions.length)}>← Previous question</button>
				<button class="cursor-pointer rounded-xl bg-[#009c55] px-7 py-4 text-lg font-bold text-white hover:bg-[#007d44] focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#ef5f24] disabled:cursor-wait disabled:opacity-60" type="button" disabled={isSubmitting} onclick={submitQuiz}>{isSubmitting ? 'Submitting…' : 'Submit my answers'}</button>
			</div>
		</div>
	{/if}
</section>

{#if showSuccess}<QuizSuccessDialog questionCount={quiz.questions.length} onClose={() => showSuccess = false} />{/if}

<style>
	.quiz-options {
		display: grid;
		grid-auto-flow: column;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		grid-template-rows: repeat(var(--option-rows), minmax(0, auto));
	}
	@media (max-width: 700px) {
		.quiz-options {
			grid-auto-flow: row;
			grid-template-columns: minmax(0, 1fr);
			grid-template-rows: none;
		}
	}
</style>
