<script lang="ts">
	let { onContinue, onClose }: { onContinue: () => void; onClose: () => void } = $props();
</script>

<div class="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/55 p-6">
	<div class="relative flex min-h-[530px] w-[min(981px,100%)] items-center rounded-[17%_22%_16%_18%/24%_31%_25%_24%] border-8 border-[#009c55] bg-white text-center shadow-[0_24px_60px_rgb(0_0_0/17%)] max-[700px]:min-h-0 max-[700px]:rounded-[50px_65px_50px_60px] max-[700px]:border-[5px]" role="dialog" aria-modal="true" aria-labelledby="signup-title">
		<button class="absolute top-5 right-7 z-10 grid size-[42px] cursor-pointer place-items-center rounded-full border-0 bg-transparent text-[2rem] leading-none hover:bg-[#e8f8ef] focus-visible:bg-[#e8f8ef]" type="button" aria-label="Close confirmation" onclick={onClose}>×</button>
		<div class="w-full px-[65px] pt-16 pb-14 pr-[110px] max-[700px]:px-[25px] max-[700px]:pt-[70px] max-[700px]:pb-[45px]">
			<h2 id="signup-title" class="m-0 font-['Anybody_Variable',Arial_Black,sans-serif] text-[clamp(3.3rem,6vw,7.3rem)] font-black leading-[.88] tracking-[-.055em] [font-variation-settings:'wdth'_90] max-[700px]:text-[clamp(2.8rem,11vw,5rem)]"><span class="block whitespace-nowrap text-[#009c55] text-[.81em] max-[700px]:whitespace-normal">Thank you for</span> signing up!</h2>
			<p class="mx-auto mt-8 mb-6 max-w-[720px] text-[clamp(1.4rem,3vw,2.75rem)] leading-[1.12] max-[700px]:mt-[25px] max-[700px]:mb-7 max-[700px]:text-[1.45rem]">You’re in! Start reading now – your first 2,026 words await!</p>
			<button class="min-w-[290px] cursor-pointer rounded-[17px] border-0 bg-[#009c55] px-10 py-[18px] text-[clamp(1.5rem,2.4vw,2rem)] font-extrabold text-white hover:bg-[#007b43] focus-visible:bg-[#007b43] max-[700px]:w-[min(100%,250px)] max-[700px]:min-w-0" type="button" onclick={onContinue}>Continue</button>
		</div>
		<img class="absolute top-[53%] right-[2%] h-auto w-[min(15%,142px)] rotate-[-15deg] max-[700px]:static max-[700px]:-mt-[105px] max-[700px]:mr-4 max-[700px]:mb-0 max-[700px]:-ml-[90px] max-[700px]:w-[85px] max-[700px]:self-end" src="/assets/figma/signup-group6.svg" alt="" />
	</div>
</div>
