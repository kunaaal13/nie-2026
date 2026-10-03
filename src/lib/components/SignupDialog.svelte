<script lang="ts">
	import { timesNieInstagram, timesNieWhatsapp } from '$lib/registration-options';
	let { onClose }: { onClose: () => void } = $props();
</script>

<div class="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/55 p-3 sm:p-6">
	<div class="signup-art relative my-auto min-h-[720px] w-[min(1252px,100%)] overflow-hidden text-[#080808] max-[850px]:min-h-0 max-[850px]:rounded-[45px] max-[850px]:border-[7px] max-[850px]:border-[#ef5f24] max-[850px]:bg-[#ffb239] max-[850px]:px-6 max-[850px]:pt-16 max-[850px]:pb-10 max-[480px]:rounded-[30px] max-[480px]:px-4" role="dialog" aria-modal="true" aria-labelledby="signup-title" aria-describedby="signup-description">
		<img class="pointer-events-none absolute top-[75px] left-[4.35%] h-auto w-[112.65%] max-w-none max-[850px]:hidden" src="/assets/figma/signup-popup-background.svg" alt="" />
		<button class="absolute top-6 right-7 z-30 grid size-11 cursor-pointer place-items-center rounded-full border-2 border-black bg-white text-[1.8rem] leading-none hover:bg-[#fff1b2] focus-visible:outline-[3px] focus-visible:outline-offset-3 focus-visible:outline-[#006f3a] max-[850px]:top-3 max-[850px]:right-3" type="button" aria-label="Close registration confirmation" onclick={onClose}>×</button>
		<h2 id="signup-title" class="absolute top-[84px] left-[14%] z-20 m-0 -rotate-[2.28deg] rounded-[60px] bg-[#ef5f24] px-7 py-2 text-center font-['Anybody_Variable',Arial_Black,sans-serif] text-[clamp(2.8rem,5.6vw,4.4rem)] font-black leading-[.85] text-white [-webkit-text-stroke:5px_#ef5f24] [paint-order:stroke_fill] max-[850px]:relative max-[850px]:top-auto max-[850px]:left-auto max-[850px]:mx-auto max-[850px]:mb-8 max-[850px]:w-fit max-[850px]:text-[clamp(2rem,8vw,3.2rem)]">Success,<br />You’re In!</h2>

		<div id="signup-description" class="absolute top-[228px] left-[12.5%] z-10 max-w-[78%] text-[clamp(1.3rem,2.9vw,2.25rem)] leading-[1.22] max-[850px]:relative max-[850px]:top-auto max-[850px]:left-auto max-[850px]:max-w-none max-[850px]:text-[clamp(1.05rem,4.3vw,1.5rem)]">
			<p class="m-0"><strong>1. JOIN FOXY ON WHATSAPP</strong><br />Get your daily Read India updates, polls and reminders.</p>
		</div>
		<a class="absolute top-[168px] right-[5%] z-20 flex h-[75px] min-w-[325px] rotate-[6.68deg] items-center justify-center rounded-full border-[3px] border-black bg-[#fdd301] px-6 pr-12 text-[1.65rem] font-bold leading-none text-black no-underline hover:-translate-y-1 focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-[#006f3a] max-[850px]:relative max-[850px]:top-auto max-[850px]:right-auto max-[850px]:mx-auto max-[850px]:mt-5 max-[850px]:mb-8 max-[850px]:h-[58px] max-[850px]:min-w-0 max-[850px]:w-fit max-[850px]:text-lg" href={timesNieWhatsapp} target="_blank" rel="noopener noreferrer">JOIN WHATSAPP<img class="absolute -right-8 -top-4 h-auto w-[81px] max-[850px]:-right-7 max-[850px]:w-[62px]" src="/assets/figma/signup-popup-whatsapp.svg" alt="" /></a>

		<div class="absolute top-[356px] left-[40%] z-10 text-[clamp(1.3rem,2.9vw,2.25rem)] leading-[1.22] max-[850px]:relative max-[850px]:top-auto max-[850px]:left-auto max-[850px]:text-[clamp(1.05rem,4.3vw,1.5rem)]">
			<p class="m-0"><strong>2. FOLLOW @TIMESNIE</strong><br />Your Friday quiz drops here.</p>
		</div>
		<a class="absolute top-[370px] left-[5%] z-20 flex h-[75px] w-[342px] -rotate-[9.03deg] items-center justify-center rounded-full border-[3px] border-black bg-[#fdd301] px-5 text-[1.55rem] font-bold leading-none text-black no-underline hover:-translate-y-1 focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-[#006f3a] max-[850px]:relative max-[850px]:top-auto max-[850px]:left-auto max-[850px]:mx-auto max-[850px]:mt-6 max-[850px]:mb-10 max-[850px]:h-[58px] max-[850px]:w-fit max-[850px]:text-lg" href={timesNieInstagram} target="_blank" rel="noopener noreferrer">FOLLOW @TIMESNIE<img class="absolute -top-[42px] -right-[30px] h-auto w-[79px] rotate-[-20deg] max-[850px]:-top-[30px] max-[850px]:w-[62px]" src="/assets/figma/signup-popup-instagram.svg" alt="" /></a>

		<div class="absolute top-[490px] left-[22%] z-10 text-[clamp(1.3rem,2.9vw,2.25rem)] leading-[1.22] max-[850px]:relative max-[850px]:top-auto max-[850px]:left-auto max-[850px]:text-[clamp(1.05rem,4.3vw,1.5rem)]">
			<p class="m-0"><strong>3. GRAB THE NIE PAPER + START READING</strong><br />Your first goal: 2,026 words.</p>
		</div>
		<img class="pointer-events-none absolute top-[390px] right-[1%] h-auto w-[205px] max-[850px]:hidden" src="/assets/figma/signup-popup-squiggle.svg" alt="" />
		<div class="absolute top-[585px] left-[34%] z-10 w-[511px] max-[850px]:relative max-[850px]:top-auto max-[850px]:left-auto max-[850px]:mx-auto max-[850px]:mt-7 max-[850px]:w-[min(100%,511px)]">
			<img class="h-auto w-full" src="/assets/figma/signup-popup-ribbon.svg" alt="" />
			<p class="absolute inset-0 m-0 flex -rotate-[3deg] items-center justify-center font-['Patrick_Hand',cursive] text-[clamp(1.25rem,2.9vw,2.25rem)] tracking-[.08em] whitespace-nowrap max-[480px]:text-[clamp(.9rem,5vw,1.5rem)]">READ. COUNT. PLAY. WIN.</p>
		</div>
	</div>
</div>

<style>
	@media (min-width: 851px) {
		.signup-art { zoom: .72; }
	}
</style>
