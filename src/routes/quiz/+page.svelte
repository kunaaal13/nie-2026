<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import { cn } from 'cn';
	import { submitQuiz as saveQuizResponse } from '$lib/public.remote';
	import QuizSuccessDialog from '$lib/components/QuizSuccessDialog.svelte';
	const display = "font-['Anybody_Variable',Arial_Black,sans-serif] font-black [font-variation-settings:'wdth'_90]";
	const paper = 'bg-white [background-image:linear-gradient(#dce8ef_1px,transparent_1px),linear-gradient(90deg,#dce8ef_1px,transparent_1px)] [background-size:38px_38px] max-[640px]:[background-size:25px_25px]';
	const questionCard = 'relative m-0 min-h-[290px] min-w-0 rounded-[18px] border-0 bg-[#ffeda0] px-[27px] pt-7 pb-[22px] max-[650px]:min-h-0 max-[650px]:px-6 max-[650px]:pt-[30px] max-[650px]:pb-6';
	const questionNumber = "absolute -top-[26px] -left-5 grid h-[58px] w-[60px] rotate-[-5deg] place-items-center rounded-[45%_55%_48%_52%] bg-[#ffa225] font-['Patrick_Hand',cursive] text-[1.55rem] leading-none";
	const optionLabel = 'flex w-fit max-w-full cursor-pointer items-start gap-2 rounded-[7px] px-[5px] py-[2px] text-[clamp(.96rem,1.13vw,1.3rem)] leading-[1.2] max-[650px]:text-base';
	const profileInput = 'min-h-[42px] w-full rounded-[5px] border-2 border-transparent bg-[#b8e5bb] px-3 py-2 font-[inherit] text-[#111] focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#ffcf00] max-[650px]:min-h-11';
	let { data }: { data: PageData } = $props();

	let answers = $state<Record<string, number>>({});
	let showSuccess = $state(false);
	let formError = $state('');
	let isSubmitting = $state(false);
	let email = $state('');
	let answeredCount = $derived(Object.keys(answers).length);
	let quiz = $derived(data.campaign.quiz);
	let weekNumber = $derived(quiz?.weekNumber ?? null);
	let quizQuestions = $derived(quiz?.questions ?? []);
	let lastQuestion = $derived(quizQuestions[quizQuestions.length - 1]);

	onMount(() => {
		const saved = sessionStorage.getItem('nie-registration-preview');
		if (!saved) return;
		try {
			const registration = JSON.parse(saved);
			email = registration.email ?? '';
		} catch {
			// Direct visits can fill in the details below.
		}
	});

	async function submitQuiz(event: SubmitEvent) {
		event.preventDefault();
		if (!quiz || isSubmitting) return;
		if (answeredCount !== quizQuestions.length) {
			formError = `Answer all ${quizQuestions.length} questions before submitting (${answeredCount} answered).`;
			const firstMissing = quizQuestions.findIndex((question) => answers[question.id] === undefined);
			document.getElementById(`question-${firstMissing + 1}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
			return;
		}
		formError = '';
		isSubmitting = true;
		try {
			await saveQuizResponse({
				quizId: quiz.id,
				email,
				answers: quizQuestions.map((question) => ({ questionId: question.id, selectedOption: answers[question.id] }))
			});
			showSuccess = true;
		} catch (cause) {
			formError = cause instanceof Error ? cause.message : 'Submission failed. Please try again.';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>{weekNumber ? `Week ${weekNumber} Quiz` : 'The Friday Quiz'} — NIE Read India 2026</title>
	<meta name="description" content="Take the NIE Read India Friday quiz." />
</svelte:head>

<svelte:window onkeydown={(event) => { if (event.key === 'Escape') showSuccess = false; }} />


<main class={cn(paper, "min-w-80 overflow-hidden pb-20 font-['Epilogue_Variable',sans-serif] text-[#080808] max-[650px]:pb-[45px]")}>
	<header class="relative mx-auto h-[clamp(630px,43.8vw,842px)] w-full max-w-[1922px] max-[650px]:h-[650px]">
		<a class="absolute top-[6.5%] left-[1.8%] z-30 w-[15%] max-[650px]:top-[2%] max-[650px]:left-[3%] max-[650px]:w-[35%]" href="/" aria-label="NIE Read India home"><img class="block h-auto w-full" src="/assets/figma/quiz-artboard84-x1.png" alt="The Times of India NIE" /></a>
		<img class="absolute top-[-2.4%] left-[48%] z-10 h-auto w-[61%] max-[1050px]:top-[3%] max-[1050px]:left-auto max-[1050px]:-right-[12%] max-[1050px]:w-[62%] max-[650px]:top-0 max-[650px]:-right-[3%] max-[650px]:w-[82%]" src="/assets/figma/quiz-ri-unit4-x1.png" alt="Read India 2026" />
		<div class="absolute top-[25.5%] left-0 z-20 w-[62%] max-[1050px]:top-[27%] max-[1050px]:w-[70%] max-[650px]:top-[35%] max-[650px]:w-[102%]">
			<img class="block h-auto w-full max-[650px]:h-[220px] max-[650px]:object-fill" src="/assets/figma/quiz-vector2.svg" alt="" />
			<img class="absolute top-[4.5%] left-0 h-auto w-[98%] max-[650px]:h-[202px]" src="/assets/figma/quiz-vector1.svg" alt="" />
			<div class="absolute top-[-3%] left-[5.9%] z-10 w-[75%] text-white max-[650px]:top-[6%] max-[650px]:left-[5%] max-[650px]:w-[82%]">
				<h1 class={cn(display, 'm-0 whitespace-nowrap text-[clamp(2.2rem,4.8vw,6rem)] leading-[1.02] [-webkit-text-stroke:6px_#ef5f24] [paint-order:stroke_fill] max-[650px]:text-[clamp(2rem,8.5vw,3rem)] max-[650px]:[-webkit-text-stroke:3px_#ef5f24]')}>THE FRIDAY QUIZ</h1>
				<p class="mt-3 mb-0 max-w-[886px] text-[clamp(1rem,1.85vw,2.25rem)] leading-[1.22] max-[1050px]:text-[1.05rem] max-[650px]:mt-[5px] max-[650px]:text-[clamp(.8rem,2.8vw,1rem)] max-[650px]:leading-[1.16]"><strong>You’ve read the words.<br />You’ve followed the stories.<br />You’ve discovered something new every day.</strong><br />Every Friday, take the <strong>Read India Weekly Quiz</strong> and see how much of the week you can remember.</p>
			</div>
		</div>
		<div class="absolute top-[63%] left-[1.8%] z-30 w-[48.7%] rotate-[-1.1deg] max-[650px]:top-auto max-[650px]:bottom-[17%] max-[650px]:left-[3%] max-[650px]:w-[94%]">
			<img class="block h-auto w-full" src="/assets/figma/quiz-vector4.svg" alt="" />
			<p class="absolute inset-0 m-0 flex items-center justify-center whitespace-nowrap px-2 font-['Patrick_Hand',cursive] text-[clamp(1rem,2.1vw,2.5rem)] tracking-[.02em] max-[650px]:text-[clamp(.95rem,4vw,1.35rem)]">{quiz ? quiz.questions.length : 'WEEKLY'} QUESTIONS • 3 QUIZZES • EXCITING GOODIES</p>
		</div>
		{#if data.campaign.phase === 'quiz'}
			<img class="absolute top-[82.3%] left-0 z-10 h-auto w-[32.9%] max-[650px]:top-auto max-[650px]:bottom-[3%] max-[650px]:h-[100px] max-[650px]:w-full" src="/assets/figma/quiz-vector3.svg" alt="" />
			<div class="absolute top-[80.8%] left-[2.2%] z-30 w-[10.4%] max-[650px]:top-auto max-[650px]:bottom-[6.5%] max-[650px]:left-[4%] max-[650px]:w-[29%]">
				<span class={cn(display, 'block rounded-[42px] bg-[#ffab0b] px-2 py-1 text-center text-[clamp(1.1rem,2.1vw,2.5rem)] leading-[1.2] whitespace-nowrap max-[650px]:text-[1.1rem]')}>WEEK {weekNumber}</span>
				<span class={cn(display, 'relative -mt-1 ml-[17%] block w-[95%] rotate-[-1.65deg] rounded-[42px] bg-[#ff1c1e] px-2 py-1 text-center text-[clamp(1.2rem,2.5vw,3rem)] leading-[1.1] text-white max-[650px]:text-[1.35rem]')}>QUIZ</span>
			</div>
			<p class={cn(display, 'absolute top-[79.3%] left-[14.2%] z-20 m-0 text-[clamp(2.4rem,3.33vw,4rem)] leading-none max-[650px]:top-auto max-[650px]:bottom-[4%] max-[650px]:left-[35%] max-[650px]:text-[2.4rem]')}>READY?<br />LET’S GO.</p>
		{:else}
			<div class="absolute bottom-[5%] left-[2%] z-30 max-w-[55%] rotate-[-2deg] rounded-[20px] bg-[#fceb99] px-[3%] py-5 max-[650px]:left-[4%] max-[650px]:max-w-[92%] max-[650px]:px-5">
				<p class={cn(display, 'm-0 text-[clamp(1.4rem,3.3vw,4rem)] leading-[1.05] max-[650px]:text-[1.75rem]')}>
					{#if data.campaign.phase === 'upcoming'}WEEK {data.campaign.nextQuiz?.weekNumber} QUIZ IS COMING.
					{:else if data.campaign.phase === 'not-scheduled'}THE NEXT QUIZ IS BEING PREPARED.
					{:else}THE 2026 QUIZZES HAVE ENDED.{/if}
				</p>
			</div>
		{/if}
	</header>

	{#if data.campaign.phase === 'quiz' && quiz}
	<form class="mx-auto w-[min(94%,1782px)] max-[650px]:w-[min(calc(100%-36px),480px)]" onsubmit={submitQuiz}>
		<div class="grid grid-cols-3 gap-x-[30px] gap-y-[46px] max-[1050px]:grid-cols-2 max-[650px]:grid-cols-1 max-[650px]:gap-10">
			{#each quizQuestions.slice(0, -1) as question, index (question.id)}
				<fieldset id={'question-' + (index + 1)} class={questionCard}>
					<legend class={questionNumber}>Q{index + 1}.</legend>
					<p class="mt-0 mb-[14px] text-[clamp(1.05rem,1.35vw,1.6rem)] font-[850] leading-[1.18] max-[650px]:text-[1.13rem]">{question.prompt}</p>
					<div class="grid gap-[5px]">
						{#each question.options as option, optionIndex}
							<label class={cn(optionLabel, answers[question.id] === optionIndex && 'bg-[#fff4c7] outline-2 outline-[#009c55]')}>
								<input class="mt-[2px] size-4 flex-none accent-[#009c55]" type="radio" name={'question-' + question.id} value={optionIndex} checked={answers[question.id] === optionIndex} onchange={() => answers[question.id] = optionIndex} />
								<span>{option}</span>
							</label>
						{/each}
					</div>
				</fieldset>
			{/each}
		</div>

		<div class="mt-[46px] grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-[30px] max-[1050px]:grid-cols-2 max-[650px]:mt-10 max-[650px]:grid-cols-1 max-[650px]:gap-10">
			<div class="min-w-0">
				{#if lastQuestion}<fieldset id={'question-' + quizQuestions.length} class={questionCard}>
					<legend class={questionNumber}>Q{quizQuestions.length}.</legend>
					<p class="mt-0 mb-[14px] text-[clamp(1.05rem,1.35vw,1.6rem)] font-[850] leading-[1.18] max-[650px]:text-[1.13rem]">{lastQuestion.prompt}</p>
					<div class="grid gap-[5px]">
						{#each lastQuestion.options as option, optionIndex}
							<label class={cn(optionLabel, answers[lastQuestion.id] === optionIndex && 'bg-[#fff4c7] outline-2 outline-[#009c55]')}>
								<input class="mt-[2px] size-4 flex-none accent-[#009c55]" type="radio" name={'question-' + lastQuestion.id} value={optionIndex} checked={answers[lastQuestion.id] === optionIndex} onchange={() => answers[lastQuestion.id] = optionIndex} />
								<span>{option}</span>
							</label>
						{/each}
					</div>
				</fieldset>{/if}
				<div class="mt-[35px] rotate-[-2deg] rounded-[38px_27px_35px_28px] bg-[#f8642f] px-7 py-[25px] text-white">
					<h2 class={cn(display, 'm-0 text-[clamp(1.4rem,2vw,2.4rem)] leading-none')}>HOW DID YOU DO?<br />DON’T STOP NOW.</h2>
					<p class="mt-[10px] mb-0 text-[clamp(.95rem,1.1vw,1.3rem)] leading-[1.25]">You made it through {quizQuestions.length} questions.<br />Enter your registered email and submit your answers.</p>
				</div>
			</div>
			<section class="relative self-end rounded-2xl bg-[#009c55] px-[6%] pt-[70px] pb-6 text-white max-[650px]:mt-[10px] max-[650px]:px-[22px] max-[650px]:pt-[63px] max-[650px]:pb-[30px]" aria-labelledby="submit-title">
				<h2 id="submit-title" class={cn(display, 'absolute -top-7 left-[8%] m-0 rotate-[-2deg] rounded-[14px] bg-[#ffd400] px-[22px] py-[10px] text-[clamp(1.6rem,2.6vw,3.1rem)] leading-none text-black max-[650px]:text-[1.55rem]')}>SUBMIT YOUR QUIZ</h2>
				<div class="grid grid-cols-[minmax(120px,230px)_minmax(0,1fr)] items-center gap-x-[22px] gap-y-[17px] [&_label]:text-[clamp(1rem,1.25vw,1.5rem)] max-[650px]:grid-cols-1 max-[650px]:gap-[5px] max-[650px]:[&_label]:mt-[10px]">
					<label for="quiz-email">Registered Email</label><input class={profileInput} id="quiz-email" name="email" type="email" autocomplete="email" bind:value={email} required />
				</div>
				<p class="mt-4 mb-0 text-center text-sm">Closes {quiz.endAtIst}</p>
				{#if formError}<p class="mt-[15px] mb-0 rounded-md bg-[#fff2d1] p-[10px] font-bold text-[#a02500]" role="alert">{formError}</p>{/if}
				<p class="mt-4 mb-2 text-center text-[.9rem]">{answeredCount} of {quizQuestions.length} answered</p>
				<button class="mx-auto mb-[-38px] block w-[min(100%,370px)] cursor-pointer rounded-xl border-0 bg-[#ef512c] px-5 py-[13px] font-[850] text-white hover:bg-[#c93620] focus-visible:bg-[#c93620] disabled:cursor-wait disabled:opacity-65" type="submit" disabled={isSubmitting}>{isSubmitting ? 'SUBMITTING…' : 'SUBMIT MY ANSWERS'}</button>
			</section>
		</div>
	</form>
	{:else}
		<section class="mx-auto max-w-[850px] px-6 pb-24 text-center">
			<p class="text-[clamp(1.2rem,2.2vw,1.8rem)] leading-[1.3]">
				{#if data.campaign.phase === 'upcoming'}Week {data.campaign.nextQuiz?.weekNumber} opens {data.campaign.nextQuiz?.startAtIst}. Keep reading and come back then.
				{:else if data.campaign.phase === 'not-scheduled'}The next quiz is being prepared. Register now and check back soon.
				{:else}Thanks for reading with us. The available quizzes have closed.{/if}
			</p>
			<a class="inline-block rounded-xl bg-[#009c55] px-8 py-4 font-bold text-white hover:bg-[#007b43] focus-visible:bg-[#007b43]" href="/">Back to Read India</a>
		</section>
	{/if}
</main>

{#if showSuccess}<QuizSuccessDialog onClose={() => showSuccess = false} />{/if}
