<script lang="ts">
	let { onClose, questionCount }: { onClose: () => void; questionCount: number } = $props();
</script>

<div class="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/55 p-5">
	<div class="relative w-[min(775px,100%)] overflow-hidden rounded-[60px] border-[7px] border-[#ffb33e] bg-[#fff9dd] max-[600px]:rounded-[30px] max-[600px]:border-[5px]" role="dialog" aria-modal="true" aria-labelledby="success-title">
		<button class="absolute top-3 right-3.5 z-30 grid size-[42px] cursor-pointer place-items-center rounded-full border-0 bg-[#fff9dd] text-[2rem] leading-none text-[#111] hover:bg-white focus-visible:bg-white" type="button" aria-label="Close confirmation" onclick={onClose}>×</button>
		<div class="relative min-h-[450px] px-[33px] py-5 max-[600px]:min-h-0 max-[600px]:px-5 max-[600px]:pt-5 max-[600px]:pb-[30px]">
			<img class="block h-auto w-[min(85%,646px)] max-[600px]:w-[86%]" src="/assets/figma/success-group110.svg" alt="" />
			<h2 id="success-title" class="sr-only">You did it! Your quiz has been submitted.</h2>
			<img class="absolute top-[35px] right-[10px] h-auto w-[27%] rotate-[8deg] max-[600px]:top-[60px] max-[600px]:-right-[10px] max-[600px]:w-[30%]" src="/assets/figma/success-fox-happy4-x1.png" alt="" />
			<p class="relative z-10 mt-[-2px] mb-[18px] w-max max-w-[70%] rotate-[-4deg] rounded-[8px_10px_30px_25px] bg-[#ffd400] px-[22px] pt-3 pb-4 font-['Patrick_Hand',cursive] text-[clamp(1.2rem,3vw,2rem)] leading-[1.2] tracking-[.07em] max-[600px]:mt-1 max-[600px]:max-w-[78%] max-[600px]:text-[1.15rem]">{questionCount} QUESTIONS. ONE BIG BRAIN.<br />YOUR RESPONSES ARE IN!</p>
			<p class="relative z-10 m-0 w-3/4 text-[clamp(1.3rem,3vw,1.8rem)] leading-[1.37] max-[600px]:w-full max-[600px]:text-[1.15rem]">You read.<br />You remembered.<br />You took the challenge.<br /><strong>And now your Read India Weekly Quiz has officially been submitted.</strong></p>
		</div>
		<div class="relative flex min-h-[140px] items-center justify-between rounded-[50%_35%_0_0/16%_12%_0_0] border-t-[10px] border-[#ffd500] bg-[#009c55] px-8 pt-7 pb-5 text-white max-[600px]:min-h-[130px] max-[600px]:px-[18px] max-[600px]:pt-6 max-[600px]:pb-[18px]">
			<p class="relative z-10 m-0 text-[clamp(.9rem,2.6vw,1.45rem)] leading-[1.35]"><strong class="font-['Anybody_Variable',Arial_Black,sans-serif] text-[clamp(1.3rem,3.8vw,2.25rem)] font-black leading-[1.1] [font-variation-settings:'wdth'_90]">BUT DON’T STOP READING.</strong><br />NEXT WEEK = A WHOLE NEW CHALLENGE.</p>
			<span class="m-[-25px_10px_-15px_0] grid h-[110px] w-[175px] flex-none rotate-[-6deg] place-items-center bg-white text-center font-['Patrick_Hand',cursive] text-[1.7rem] leading-[.95] text-[#111] [clip-path:polygon(50%_0%,56%_8%,63%_0%,69%_9%,77%_2%,80%_12%,89%_7%,90%_18%,99%_17%,95%_28%,100%_36%,94%_43%,100%_51%,92%_58%,98%_67%,88%_70%,91%_81%,82%_81%,77%_94%,69%_88%,63%_100%,56%_91%,50%_100%,43%_91%,36%_99%,31%_89%,21%_94%,18%_82%,8%_82%,12%_70%,1%_67%,7%_58%,0%_51%,7%_43%,1%_35%,10%_29%,6%_18%,17%_18%,20%_8%,28%_12%,33%_2%,40%_9%,45%_0%)] max-[600px]:m-0 max-[600px]:h-[75px] max-[600px]:w-[110px] max-[600px]:text-[1.1rem]">See you<br />next Friday!</span>
		</div>
	</div>
</div>
