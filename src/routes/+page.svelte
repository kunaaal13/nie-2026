<script lang="ts">
	import { goto } from '$app/navigation';
	import { cn } from 'cn';
	import SignupDialog from '$lib/components/SignupDialog.svelte';
	const display = "font-['Anybody_Variable',Arial_Black,sans-serif] font-black [font-variation-settings:'wdth'_90]";
	const paper = 'bg-white [background-image:linear-gradient(#dce8ef_1px,transparent_1px),linear-gradient(90deg,#dce8ef_1px,transparent_1px)] [background-size:38px_38px] max-[640px]:[background-size:25px_25px]';

	let showConfirmation = $state(false);
	let registration = $state({
		fullName: '', email: '', className: '', section: '', school: '', city: '', schoolAddress: ''
	});

	const steps = [
		{ title: 'READ', copy: "Pick up your Times NIE every day and dive into the day's stories, features, facts and surprises.", art: 'landing-vector6.svg', side: 'left' },
		{ title: 'TRACK', copy: 'Read across different topics and track the number of words you read everyday.', art: 'landing-vector7.svg', side: 'right' },
		{ title: 'QUIZ', copy: 'Every Friday, your reading gets put to the test. A weekly quiz drawn from the world you’ve been reading about. The more you read, the more you know. The more you know, the better you play.', art: 'landing-vector8.svg', side: 'left' },
		{ title: 'WIN', copy: 'Top your reading game. Ace the Friday quizzes. Win exciting prizes.', art: 'landing-vector9.svg', side: 'right' }
	];

	function register(event: SubmitEvent) {
		event.preventDefault();
		// Preview only until registration storage and validation rules are provided.
		sessionStorage.setItem('nie-registration-preview', JSON.stringify(registration));
		showConfirmation = true;
	}
</script>

<svelte:head>
	<title>NIE Read India 2026 — You Can’t Just Read One</title>
	<meta name="description" content="Join the NIE Read India reading adventure and take the Friday quiz." />
</svelte:head>

<svelte:window onkeydown={(event) => { if (event.key === 'Escape') showConfirmation = false; }} />

<main class={cn(paper, "relative min-w-80 overflow-hidden font-['Epilogue_Variable',sans-serif] text-[#080808] [font-synthesis:none]")}>
	<section class="relative mx-auto max-w-[1922px]" aria-labelledby="hero-title">
		<div class="relative aspect-[1922/1035] w-full max-[900px]:aspect-[1922/1160] max-[640px]:aspect-[1/1.05]">
			<img class="absolute top-[10%] left-[23%] z-10 h-auto w-1/2 max-[640px]:top-[6%] max-[640px]:left-[15%] max-[640px]:w-[70%]" src="/assets/figma/landing-artboard74-x1.png" alt="The Times of India NIE Read India 2026" />
			<img class="absolute top-[9%] left-[7%] z-20 h-auto w-[28%] max-[640px]:top-[27%] max-[640px]:-left-[1%] max-[640px]:w-[43%]" src="/assets/figma/landing-chat-gpt-image-sep252026011714-pm1.png" alt="Fox reading a Times NIE newspaper" />
			<img class="absolute top-[14%] right-[6%] z-20 h-auto w-[29%] max-[640px]:top-[31%] max-[640px]:-right-[1%] max-[640px]:w-[44%]" src="/assets/figma/landing-chat-gpt-image-sep252026011233-pm1.png" alt="Fox holding a Times NIE newspaper" />
		</div>
		<div class="relative z-30 px-[22px] pb-[34px] text-center max-[640px]:-mt-[4%] max-[640px]:px-4 max-[640px]:pb-6">
			<h1 id="hero-title" class={cn(display, 'm-0 whitespace-nowrap text-[clamp(2.25rem,5.65vw,6.75rem)] leading-none tracking-[-.045em] max-[900px]:whitespace-normal max-[640px]:text-[clamp(2.1rem,8.8vw,3.5rem)] max-[640px]:leading-[.97]')}>YOU CAN’T JUST READ ONE.</h1>
			<p class="mx-auto mt-[22px] mb-10 max-w-[1050px] text-[clamp(1.25rem,2.75vw,3.3rem)] font-[750] leading-[1.06] max-[640px]:mt-[14px] max-[640px]:mb-[23px] max-[640px]:text-[clamp(1.05rem,4.5vw,1.5rem)]">One story. One fact. One more page.<br class="max-[640px]:hidden" /> And suddenly, you’re hooked.</p>
			<div class="inline-block rotate-[-1.5deg] rounded-[29%_16%_22%_12%/38%_32%_25%_28%] bg-[#ffbe00] px-9 pt-5 pb-4 text-[clamp(1.1rem,2.2vw,2.6rem)] font-[850] leading-none max-[640px]:px-5 max-[640px]:py-[13px] max-[640px]:text-[clamp(1rem,4.3vw,1.45rem)]" aria-label="October 5 to October 23">OCTOBER 5 – OCTOBER 23</div>
		</div>
		<img class="absolute bottom-[9%] left-[7%] z-30 h-auto w-[6.7%] max-[640px]:bottom-[4%] max-[640px]:w-[10%]" src="/assets/figma/landing-vector4.svg" alt="" />
	</section>

	<section class="relative mt-[18px] grid min-h-[clamp(205px,16.3vw,313px)] w-full place-items-center text-center max-[640px]:mt-2 max-[640px]:min-h-[210px]" aria-labelledby="adventure-title">
		<img class="absolute inset-0 h-full w-full object-fill" src="/assets/figma/landing-layer1.svg" alt="" />
		<div class="relative z-10 w-[min(96%,1650px)] px-5 py-[30px] max-[640px]:px-4 max-[640px]:py-[22px]">
			<h2 id="adventure-title" class={cn(display, 'mt-0 mb-[10px] text-[clamp(1.55rem,3.35vw,4.05rem)] leading-[1.1] text-white max-[640px]:text-[clamp(1.5rem,6vw,2.2rem)]')}>INDIA’S BIGGEST READING ADVENTURE IS BACK!</h2>
			<p class="m-0 text-[clamp(.95rem,2vw,2.45rem)] leading-[1.15] max-[640px]:text-[.95rem] max-[640px]:leading-[1.25]"><strong>Read the newspaper. Read something new every day. Come back every Friday.<br class="max-[640px]:hidden" />Take the quiz.</strong> And if you think you can stop at just one… <strong>we dare you.</strong></p>
		</div>
	</section>

	<section class="relative mx-auto max-w-[1922px] px-[7%] pt-6 pb-5 max-[640px]:px-[14px] max-[640px]:pt-8 max-[640px]:pb-3" aria-labelledby="how-title">
		<h2 id="how-title" class={cn(display, 'mt-0 mb-[25px] text-center text-[clamp(2.2rem,3.4vw,4.1rem)] leading-[1.1] max-[640px]:mb-[17px] max-[640px]:text-[clamp(2rem,8vw,3rem)]')}>HOW IT WORKS</h2>
		<img class="absolute top-[2%] right-[6%] h-auto w-[6%] max-[640px]:w-[9%]" src="/assets/figma/landing-vector4.svg" alt="" />
		<div class="mx-auto grid w-[min(100%,1480px)] grid-cols-2 gap-x-[5%] gap-y-[18px] max-[900px]:gap-x-[2%] max-[900px]:gap-y-[10px] max-[640px]:w-[min(100%,480px)] max-[640px]:grid-cols-1 max-[640px]:gap-2">
			{#each steps as step}
				<article class="relative flex min-h-[clamp(220px,17vw,318px)] flex-col items-center justify-center bg-[url(/assets/figma/landing-group9.svg)] bg-center bg-no-repeat px-[13%] py-[35px] text-center text-white [background-size:100%_100%] max-[900px]:px-[11%] max-[900px]:py-[26px] max-[640px]:min-h-[220px] max-[640px]:px-[16%] max-[640px]:py-[30px]">
					<img class={cn('pointer-events-none absolute z-20 h-auto w-[clamp(58px,8vw,160px)] max-[640px]:w-[70px]', step.side === 'left' ? 'top-[10%] -left-[4%]' : 'top-[1%] -right-[3%]')} src={'/assets/figma/' + step.art} alt="" />
					<h3 class={cn(display, 'mt-0 mb-[10px] text-[clamp(2rem,3.3vw,4.1rem)] leading-none max-[640px]:text-[2.5rem]')}>{step.title}</h3>
					<p class="m-0 max-w-[510px] text-[clamp(.95rem,1.43vw,1.7rem)] leading-[1.18] max-[640px]:text-base">{step.copy}</p>
				</article>
			{/each}
		</div>
	</section>

	<section class="relative mx-auto min-h-[1400px] max-w-[1922px] px-[5%] pt-8 pb-[490px] max-[900px]:min-h-0 max-[900px]:pb-[31vw] max-[640px]:px-[14px] max-[640px]:pt-[34px] max-[640px]:pb-[33vw]" aria-labelledby="join-title">
		<h2 id="join-title" class={cn(display, 'relative z-20 mt-0 mb-[25px] text-center text-[clamp(2.2rem,3.4vw,4.1rem)] leading-[1.1] max-[640px]:mb-[17px] max-[640px]:text-[clamp(2rem,8vw,3rem)]')}>READY TO GET HOOKED?</h2>
		<img class="absolute top-[3%] left-[6%] h-auto w-[6%] max-[640px]:w-[10%]" src="/assets/figma/landing-vector4.svg" alt="" />
		<div class="relative z-20 mx-auto w-[min(100%,1262px)] text-center">
			<form id="registration-form" class="rounded-[8%_11%_9%_8%/15%_16%_13%_12%] bg-[#ffac00] px-[5%] pt-11 pb-[85px] max-[640px]:rounded-[45px] max-[640px]:px-[23px] max-[640px]:pt-[30px] max-[640px]:pb-[55px]" onsubmit={register}>
				<p class="mt-0 mb-[31px] text-[clamp(1.35rem,1.8vw,2.1rem)] max-[640px]:mb-[22px] max-[640px]:text-[1.13rem]">Please fill in your details carefully:</p>
				<div class="grid grid-cols-[minmax(175px,255px)_minmax(0,1fr)] items-center gap-x-[26px] gap-y-[22px] text-left [&_input]:min-h-12 [&_input]:w-full [&_input]:rounded-[5px] [&_input]:border-2 [&_input]:border-transparent [&_input]:bg-white [&_input]:px-[14px] [&_input]:py-[9px] [&_input]:font-[inherit] [&_input]:text-[1.2rem] [&_input]:focus-visible:outline-[3px] [&_input]:focus-visible:outline-offset-2 [&_input]:focus-visible:outline-[#006f3a] [&_label]:text-[clamp(1.1rem,1.5vw,1.75rem)] [&_label]:leading-[1.1] max-[640px]:grid-cols-1 max-[640px]:gap-[7px] max-[640px]:[&_input]:min-h-11 max-[640px]:[&_input]:text-base max-[640px]:[&_label]:mt-2 max-[640px]:[&_label]:text-base">
					<label for="fullName">Full Name</label><input id="fullName" name="fullName" autocomplete="name" bind:value={registration.fullName} required />
					<label for="email">Email ID <small class="block text-[.78em] max-[640px]:inline">(student/parent)</small></label><input id="email" name="email" type="email" autocomplete="email" bind:value={registration.email} required />
					<label for="className">Class</label><input id="className" name="className" bind:value={registration.className} required />
					<label for="section">Section</label><input id="section" name="section" bind:value={registration.section} required />
					<label for="school">School</label><input id="school" name="school" autocomplete="organization" bind:value={registration.school} required />
					<label for="city">City</label><input id="city" name="city" autocomplete="address-level2" bind:value={registration.city} required />
					<label for="schoolAddress">School Address</label><input id="schoolAddress" name="schoolAddress" autocomplete="street-address" bind:value={registration.schoolAddress} required />
				</div>
			</form>
			<button class="relative mx-auto -mt-8 cursor-pointer rounded-[19px] border-0 bg-[#009d54] px-[42px] py-[21px] text-[clamp(1.25rem,2.2vw,2.65rem)] font-[850] leading-[1.1] text-white hover:bg-[#00783f] focus-visible:bg-[#00783f] max-[640px]:-mt-[17px] max-[640px]:w-[min(93%,400px)] max-[640px]:px-[18px] max-[640px]:py-[15px] max-[640px]:text-[1.15rem]" form="registration-form" type="submit">Submit &amp; Join the Challenge</button>
		</div>
		<p class="relative z-20 mt-[10px] mb-0 text-center text-[clamp(1rem,1.7vw,2rem)] font-extrabold">#YouCantJustReadOne</p>
		<img class="pointer-events-none absolute right-0 bottom-0 left-0 z-10 h-auto w-full max-[640px]:-left-[5%] max-[640px]:w-[110%] max-[640px]:max-w-none" src="/assets/figma/landing-artboard64-x1.png" alt="A collage of Indian landmarks, a newspaper reader in a taxi, and a reader in an auto rickshaw" />
	</section>
</main>

{#if showConfirmation}
	<SignupDialog onContinue={() => { showConfirmation = false; goto('/quiz'); }} onClose={() => showConfirmation = false} />
{/if}

