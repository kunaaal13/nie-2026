import { command, query } from '$app/server';
import { z } from 'zod';
import { requireAdmin } from '$lib/server/auth';
import * as admin from '$lib/server/admin';
import { quizInputSchema, quizFilterSchema } from '$lib/validation';

export const getOverview = query(async () => {
	const { env } = await requireAdmin();
	return admin.getOverview(env.DB);
});

export const listQuizzes = query(async () => {
	const { env } = await requireAdmin();
	return admin.listQuizzes(env.DB);
});

export const getQuiz = query(z.uuid(), async (id) => {
	const { env } = await requireAdmin();
	return admin.getQuiz(env.DB, id);
});

export const saveQuiz = command(quizInputSchema, async (input) => {
	const { env } = await requireAdmin();
	return admin.saveQuiz(env.DB, input);
});

export const deleteQuiz = command(z.uuid(), async (id) => {
	const { env } = await requireAdmin();
	return admin.deleteQuiz(env.DB, id);
});

export const listStudents = query(quizFilterSchema, async (filter) => {
	const { env } = await requireAdmin();
	return admin.listStudents(env.DB, filter);
});

export const listResponses = query(quizFilterSchema, async (filter) => {
	const { env } = await requireAdmin();
	return admin.listResponses(env.DB, filter);
});

export const getResponse = query(z.uuid(), async (id) => {
	const { env } = await requireAdmin();
	return admin.getResponse(env.DB, id);
});
