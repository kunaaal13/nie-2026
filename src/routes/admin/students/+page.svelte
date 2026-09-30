<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { Search } from '@lucide/svelte';
	import { listStudents } from '$lib/admin.remote';
	import { formatIstDateTime } from '$lib/ist';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import * as Table from '$lib/components/ui/table';

	let searchDraft = $state('');
	let search = $state('');
	let currentPage = $state(1);
	const students = createQuery(() => ({ queryKey: ['admin', 'students', search, currentPage], queryFn: () => listStudents({ search, page: currentPage }) }));
</script>

<svelte:head><title>Students — NIE Read India Admin</title></svelte:head>

<div class="mb-7"><p class="mb-1 text-sm font-semibold uppercase tracking-widest text-emerald-700">Manage</p><h1 class="text-3xl font-bold tracking-tight sm:text-4xl">Students</h1><p class="mt-2 text-slate-500">Registrations from the landing page. All times are IST.</p></div>

<Card.Root><Card.Content class="pt-6">
	<form class="mb-5 flex max-w-lg gap-2" onsubmit={(event) => { event.preventDefault(); search = searchDraft.trim(); currentPage = 1; }}><Input aria-label="Search students" placeholder="Search name, email, or school" bind:value={searchDraft} /><Button type="submit" variant="outline"><Search class="size-4" /><span class="sr-only">Search</span></Button></form>
	{#if students.isPending}<p class="py-10 text-center text-slate-500">Loading students…</p>
	{:else if students.isError}<p class="rounded-md bg-red-50 p-4 text-red-700" role="alert">{students.error.message}</p>
	{:else if students.data.count === 0}<p class="py-10 text-center text-slate-500">No students match this search.</p>
	{:else}
		<p class="mb-3 text-sm text-slate-500">{students.data.count} registration(s)</p>
		<div class="overflow-x-auto"><Table.Root><Table.Header><Table.Row><Table.Head>Student</Table.Head><Table.Head>Class</Table.Head><Table.Head>School</Table.Head><Table.Head>City</Table.Head><Table.Head>Registered (IST)</Table.Head></Table.Row></Table.Header><Table.Body>
			{#each students.data.rows as student}<Table.Row><Table.Cell><span class="font-semibold">{student.fullName}</span><span class="block text-xs text-slate-500">{student.email}</span></Table.Cell><Table.Cell>{student.className} · {student.section}</Table.Cell><Table.Cell><span class="block">{student.school}</span><span class="block max-w-64 truncate text-xs text-slate-500" title={student.schoolAddress}>{student.schoolAddress}</span></Table.Cell><Table.Cell>{student.city}</Table.Cell><Table.Cell class="whitespace-nowrap">{formatIstDateTime(student.createdAt)}</Table.Cell></Table.Row>{/each}
		</Table.Body></Table.Root></div>
		<div class="mt-5 flex items-center justify-between"><Button variant="outline" disabled={currentPage <= 1} onclick={() => currentPage--}>Previous</Button><span class="text-sm text-slate-500">Page {currentPage} of {Math.ceil(students.data.count / students.data.pageSize)}</span><Button variant="outline" disabled={currentPage * students.data.pageSize >= students.data.count} onclick={() => currentPage++}>Next</Button></div>
	{/if}
</Card.Content></Card.Root>
