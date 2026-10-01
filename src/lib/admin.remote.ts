import { command, query } from '$app/server';
import { z } from 'zod';
import { requireAdmin } from '$lib/server/auth';
import * as admin from '$lib/server/admin';
import {
	quizDetailsSchema, quizInputSchema, quizPublishSchema, responseFilterSchema, studentFilterSchema, studentUpdateSchema
} from '$lib/validation';

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

export const getQuizStats = query(z.uuid(), async (id) => {
	const { env } = await requireAdmin();
	return admin.getQuizStats(env.DB, id);
});

export const saveQuiz = command(quizInputSchema, async (input) => {
	const { env } = await requireAdmin();
	return admin.saveQuiz(env.DB, input);
});

export const updateQuizDetails = command(quizDetailsSchema, async (input) => {
	const { env } = await requireAdmin();
	return admin.updateQuizDetails(env.DB, input);
});

export const setQuizPublished = command(quizPublishSchema, async ({ id, published }) => {
	const { env } = await requireAdmin();
	return admin.setQuizPublished(env.DB, id, published);
});

export const deleteQuiz = command(z.uuid(), async (id) => {
	const { env } = await requireAdmin();
	return admin.deleteQuiz(env.DB, id);
});

export const listStudents = query(studentFilterSchema, async (filter) => {
	const { env } = await requireAdmin();
	return admin.listStudents(env.DB, filter);
});

export const getStudent = query(z.uuid(), async (id) => {
	const { env } = await requireAdmin();
	return admin.getStudent(env.DB, id);
});

export const updateStudent = command(studentUpdateSchema, async (input) => {
	const { env } = await requireAdmin();
	return admin.updateStudent(env.DB, input);
});

export const deleteStudent = command(z.uuid(), async (id) => {
	const { env } = await requireAdmin();
	return admin.deleteStudent(env.DB, id);
});

export const listResponses = query(responseFilterSchema, async (filter) => {
	const { env } = await requireAdmin();
	return admin.listResponses(env.DB, filter);
});

export const getResponse = query(z.uuid(), async (id) => {
	const { env } = await requireAdmin();
	return admin.getResponse(env.DB, id);
});

export const deleteResponse = command(z.uuid(), async (id) => {
	const { env } = await requireAdmin();
	return admin.deleteResponse(env.DB, id);
});
