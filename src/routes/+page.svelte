<script lang="ts">
	import { goto } from '$app/navigation';
	import { cn } from 'cn';
	import SignupDialog from '$lib/components/SignupDialog.svelte';
	import { registerStudent } from '$lib/public.remote';
	const display = "font-['Anybody_Variable',Arial_Black,sans-serif] font-black [font-variation-settings:'wdth'_90]";
	const paper = 'bg-white [background-image:linear-gradient(#dce8ef_1px,transparent_1px),linear-gradient(90deg,#dce8ef_1px,transparent_1px)] [background-size:38px_38px] max-[640px]:[background-size:25px_25px]';

	let showConfirmation = $state(false);
	let isSubmitting = $state(false);
	let registrationError = $state('');
	let registration = $state({
		fullName: '', email: '', className: '', section: '', school: '', city: '', schoolAddress: ''
	});

	const steps = [
		{ title: 'READ', copy: "Pick up your Times NIE every day and dive into the day's stories, features, facts and surprises.", art: 'landing-vector6.svg', side: 'left' },
		{ title: 'TRACK', copy: 'Read across different topics and track the number of words you read everyday.', art: 'landing-vector7.svg', side: 'right' },
		{ title: 'QUIZ', copy: 'Every Friday, your reading gets put to the test. A weekly quiz drawn from the world you’ve been reading about. The more you read, the more you know. The more you know, the better you play.', art: 'landing-vector8.svg', side: 'left' },
		{ title: 'WIN', copy: 'Top your reading game. Ace the Friday quizzes. Win exciting prizes.', art: 'landing-vector9.svg', side: 'right' }
	];

	// Brand glyph paths from Simple Icons (CC0).
	const socials = [
		{ label: 'Join the Times NIE WhatsApp channel', href: 'https://whatsapp.com/channel/0029VbDUzYm0VycQKZ2g0x2T', background: 'bg-[#25d366]', tilt: 'rotate-[-4deg]', path: 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z' },
		{ label: 'Follow Times NIE on Instagram', href: 'https://www.instagram.com/timesnie', background: 'bg-[linear-gradient(45deg,#f9b233,#ee2a7b_55%,#6228d7)]', tilt: 'rotate-[4deg]', path: 'M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077' }
	];

	async function register(event: SubmitEvent) {
		event.preventDefault();
		if (isSubmitting) return;
		isSubmitting = true;
		registrationError = '';
		try {
			await registerStudent(registration);
			sessionStorage.setItem('nie-registration-preview', JSON.stringify(registration));
			showConfirmation = true;
		} catch (cause) {
			registrationError = cause instanceof Error ? cause.message : 'Registration failed. Please try again.';
		} finally {
			isSubmitting = false;
		}
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
		<div class="relative z-30 px-[22px] pb-[34px] text-center max-[1200px]:pt-[5vw] max-[640px]:px-4 max-[640px]:pt-[8vw] max-[640px]:pb-6">
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

	<section class="relative mx-auto max-w-[1922px] px-[5%] pt-8 max-[640px]:px-[14px] max-[640px]:pt-[34px]" aria-labelledby="join-title">
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
				{#if registrationError}<p class="mt-5 rounded-lg bg-white px-4 py-3 text-left font-semibold text-[#a02500]" role="alert">{registrationError}</p>{/if}
			</form>
			<button class="relative mx-auto -mt-8 cursor-pointer rounded-[19px] border-0 bg-[#009d54] px-[42px] py-[21px] text-[clamp(1.25rem,2.2vw,2.65rem)] font-[850] leading-[1.1] text-white hover:bg-[#00783f] focus-visible:bg-[#00783f] disabled:cursor-wait disabled:opacity-65 max-[640px]:-mt-[17px] max-[640px]:w-[min(93%,400px)] max-[640px]:px-[18px] max-[640px]:py-[15px] max-[640px]:text-[1.15rem]" form="registration-form" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Joining…' : 'Submit & Join the Challenge'}</button>
		</div>
		<p class="relative z-20 mt-6 mb-0 text-center text-[clamp(1rem,1.7vw,2rem)] font-extrabold">#YouCantJustReadOne</p>
		<footer class="relative [margin-top:calc(1.5rem-16%)] max-[640px]:[margin-top:calc(1rem-16%)]">
			<img class="pointer-events-none relative h-auto w-full" src="/assets/figma/landing-artboard64-x1.png" alt="A collage of Indian landmarks, a newspaper reader in a taxi, and a reader in an auto rickshaw" />
			<nav class="absolute top-[30%] left-1/2 z-20 flex -translate-x-1/2 gap-[clamp(14px,1.6vw,30px)] max-[640px]:top-[22%]" aria-label="Times NIE on social media">
				{#each socials as social}
					<a class="grid size-[clamp(46px,4.4vw,84px)] place-items-center rounded-full border-[3px] border-[#080808] text-white shadow-[0_5px_0_#080808] transition-transform duration-150 hover:-translate-y-1 hover:rotate-0 focus-visible:-translate-y-1 focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-[#006f3a] max-[640px]:size-11 max-[640px]:border-2 max-[640px]:shadow-[0_3px_0_#080808] {social.background} {social.tilt}" href={social.href} target="_blank" rel="noopener noreferrer" aria-label={social.label} title={social.label}>
						<svg class="size-[52%]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d={social.path} /></svg>
					</a>
				{/each}
			</nav>
		</footer>
	</section>
</main>

{#if showConfirmation}
	<SignupDialog onContinue={() => { showConfirmation = false; goto('/quiz'); }} onClose={() => showConfirmation = false} />
{/if}
