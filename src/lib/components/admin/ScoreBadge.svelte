<script lang="ts">
	let { score, total }: { score: number; total: number } = $props();
	const percent = $derived(total ? Math.round((score / total) * 100) : 0);
</script>

<span class="inline-flex items-center gap-2 whitespace-nowrap">
	<span class="font-mono text-sm tabular-nums">{score}/{total}</span>
	<span class={['rounded-sm px-1.5 py-px text-xs tabular-nums', percent >= 80 ? 'bg-green-50 text-success' : percent >= 50 ? 'bg-muted text-muted-foreground' : 'bg-red-50 text-destructive']}>{percent}%</span>
</span>
