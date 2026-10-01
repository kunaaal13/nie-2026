<script lang="ts">
	import { tick } from 'svelte';
	import { CalendarDate, type DateValue } from '@internationalized/date';
	import { CalendarClock } from '@lucide/svelte';
	import { Calendar } from '$lib/components/ui/calendar';
	import * as Popover from '$lib/components/ui/popover';
	import { Button } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';

	// Value is an IST wall-clock string, `YYYY-MM-DDTHH:mm`, matching what the server parses.
	let { value = $bindable(''), id, disabled = false, invalid = false }: { value?: string; id: string; disabled?: boolean; invalid?: boolean } = $props();
	let open = $state(false);
	let columns = $state<HTMLElement>();

	const HOURS = Array.from({ length: 12 }, (_, index) => index + 1);
	const MINUTES = Array.from({ length: 12 }, (_, index) => index * 5);
	const pad = (number: number) => String(number).padStart(2, '0');

	// Time picked before a date is kept here until a date completes the value.
	let pendingTime = $state('09:00');
	const datePart = $derived(value.slice(0, 10));
	const time = $derived(value.slice(11, 16) || pendingTime);
	const hour24 = $derived(Number(time.slice(0, 2)));
	const minute = $derived(Number(time.slice(3, 5)));
	const hour12 = $derived(hour24 % 12 || 12);
	const meridiem = $derived(hour24 < 12 ? 'AM' : 'PM');
	// Keep an existing off-grid minute (e.g. :07) selectable instead of silently rounding it.
	const minutes = $derived(MINUTES.includes(minute) ? MINUTES : [...MINUTES, minute].sort((a, b) => a - b));

	const selected = $derived.by(() => {
		const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart);
		return match ? new CalendarDate(Number(match[1]), Number(match[2]), Number(match[3])) : undefined;
	});
	const timeLabel = $derived(`${hour12}:${pad(minute)} ${meridiem}`);
	const dateLabel = $derived(selected
		? new Date(Date.UTC(selected.year, selected.month - 1, selected.day)).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
		: '');

	function setTime(nextHour24: number, nextMinute: number) {
		const next = `${pad(nextHour24)}:${pad(nextMinute)}`;
		pendingTime = next;
		if (datePart) value = `${datePart}T${next}`;
	}
	const setHour = (hour: number) => setTime((hour % 12) + (meridiem === 'PM' ? 12 : 0), minute);
	const setMeridiem = (next: 'AM' | 'PM') => setTime((hour24 % 12) + (next === 'PM' ? 12 : 0), minute);
	function setDate(next: DateValue | undefined) {
		if (next) value = `${next.toString()}T${time}`;
	}

	$effect(() => {
		if (!open) return;
		tick().then(() => columns?.querySelectorAll<HTMLElement>('[data-selected]').forEach((element) => element.scrollIntoView({ block: 'center' })));
	});
</script>

{#snippet option(label: string, active: boolean, onclick: () => void, ariaLabel: string)}
	<Button variant={active ? 'default' : 'ghost'} size="sm" class={cn('w-full shrink-0 font-normal tabular-nums', active && 'font-medium')}
		aria-pressed={active} aria-label={ariaLabel} data-selected={active || undefined} {onclick}>{label}</Button>
{/snippet}

<Popover.Root bind:open>
	<Popover.Trigger {id} {disabled} aria-invalid={invalid || undefined}>
		{#snippet child({ props })}
			<Button {...props} variant="outline" class={cn('w-full justify-start gap-2 font-normal', !selected && 'text-muted-foreground', invalid && 'border-destructive')}>
				<CalendarClock class="text-muted-foreground" />
				{#if selected}
					<span class="truncate">{dateLabel}</span>
					<span class="ml-auto shrink-0 text-muted-foreground tabular-nums">{timeLabel}</span>
				{:else}
					Pick date and time
				{/if}
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="w-auto p-0" align="start">
		<div class="flex flex-col sm:flex-row">
			<Calendar type="single" value={selected} onValueChange={setDate} captionLayout="dropdown" />
			<div class="flex flex-col border-t sm:border-t-0 sm:border-l">
				<p class="px-3 pt-3 pb-2 text-xs font-medium text-muted-foreground">Time (IST)</p>
				<div bind:this={columns} class="grid h-56 grid-cols-3 gap-1 px-2 pb-2 sm:h-[17rem]">
					<div class="flex flex-col gap-0.5 overflow-y-auto overscroll-contain [scrollbar-width:none]" role="group" aria-label="Hour">
						{#each HOURS as hour}{@render option(String(hour), hour === hour12, () => setHour(hour), `${hour} o'clock`)}{/each}
					</div>
					<div class="flex flex-col gap-0.5 overflow-y-auto overscroll-contain [scrollbar-width:none]" role="group" aria-label="Minute">
						{#each minutes as option_minute}{@render option(pad(option_minute), option_minute === minute, () => setTime(hour24, option_minute), `${option_minute} minutes`)}{/each}
					</div>
					<div class="flex flex-col gap-0.5" role="group" aria-label="AM or PM">
						{#each ['AM', 'PM'] as const as period}{@render option(period, period === meridiem, () => setMeridiem(period), period)}{/each}
					</div>
				</div>
				<div class="mt-auto border-t p-2">
					<Button size="sm" class="w-full" disabled={!selected} onclick={() => open = false}>{selected ? 'Done' : 'Pick a date'}</Button>
				</div>
			</div>
		</div>
	</Popover.Content>
</Popover.Root>
