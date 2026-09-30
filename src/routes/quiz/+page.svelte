<script lang="ts">
	import type { PageData } from './$types';
	import { cn } from 'cn';
	import QuizStepper from '$lib/components/QuizStepper.svelte';
	const display = "font-['Anybody_Variable',Arial_Black,sans-serif] font-black [font-variation-settings:'wdth'_90]";
	const paper = 'bg-white [background-image:linear-gradient(#dce8ef_1px,transparent_1px),linear-gradient(90deg,#dce8ef_1px,transparent_1px)] [background-size:38px_38px] max-[640px]:[background-size:25px_25px]';
	let { data }: { data: PageData } = $props();
	let quiz = $derived(data.campaign.quiz);
	let weekNumber = $derived(quiz?.weekNumber ?? null);
</script>

<svelte:head>
	<title>{weekNumber ? `Week ${weekNumber} Quiz` : 'The Friday Quiz'} — NIE Read India 2026</title>
	<meta name="description" content="Take the NIE Read India Friday quiz." />
</svelte:head>

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
	{#key quiz.id}<QuizStepper {quiz} />{/key}
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
