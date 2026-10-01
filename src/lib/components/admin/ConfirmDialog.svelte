<script lang="ts">
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { buttonVariants } from '$lib/components/ui/button';

	let { open = $bindable(false), title, description, confirmLabel = 'Delete', pending = false, onconfirm }: {
		open?: boolean;
		title: string;
		description: string;
		confirmLabel?: string;
		pending?: boolean;
		onconfirm: () => void | Promise<void>;
	} = $props();
</script>

<AlertDialog.Root bind:open>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>{title}</AlertDialog.Title>
			<AlertDialog.Description>{description}</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel disabled={pending}>Cancel</AlertDialog.Cancel>
			<AlertDialog.Action class={buttonVariants({ variant: 'destructive' })} disabled={pending}
				onclick={async (event: MouseEvent) => { event.preventDefault(); await onconfirm(); }}>
				{pending ? 'Working…' : confirmLabel}
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
