import { and, asc, desc, eq, gt, inArray, like, lt, ne, or, sql } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import type { z } from 'zod';
import { getDb } from '$lib/server/db';
import { questions, quizzes, students, submissions, submissionAnswers } from '$lib/server/db/schema';
import { formatIstInput, parseIstInput } from '$lib/server/india-time';
import { quizInputSchema, quizFilterSchema } from '$lib/validation';

export async function listQuizzes(binding: D1Database, now = new Date()) {
	const db = getDb(binding);
	const rows = await db.select().from(quizzes).orderBy(asc(quizzes.weekNumber));
	const questionCounts = await db.select({ quizId: questions.quizId, count: sql<number>`count(*)` })
		.from(questions).groupBy(questions.quizId);
	const responseCounts = await db.select({ quizId: submissions.quizId, count: sql<number>`count(*)` })
		.from(submissions).groupBy(submissions.quizId);
	const qCount = new Map(questionCounts.map((row) => [row.quizId, row.count]));
	const rCount = new Map(responseCounts.map((row) => [row.quizId, row.count]));
	return rows.map((row) => ({
		...row,
		startAt: row.startAt.toISOString(),
		endAt: row.endAt.toISOString(),
		status: !row.published ? 'Draft' : now < row.startAt ? 'Scheduled' : now >= row.endAt ? 'Closed' : 'Active',
		questionCount: qCount.get(row.id) ?? 0,
		responseCount: rCount.get(row.id) ?? 0
	}));
}

export async function getQuiz(binding: D1Database, id: string) {
	const db = getDb(binding);
	const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, id)).limit(1);
	if (!quiz) error(404, 'Quiz not found.');
	const quizQuestions = await db.select().from(questions).where(eq(questions.quizId, id))
		.orderBy(asc(questions.position));
	const [responseCount] = await db.select({ count: sql<number>`count(*)` }).from(submissions)
		.where(eq(submissions.quizId, id));
	return {
		...quiz,
		startAt: quiz.startAt.toISOString(),
		endAt: quiz.endAt.toISOString(),
		startIst: formatIstInput(quiz.startAt),
		endIst: formatIstInput(quiz.endAt),
		questions: quizQuestions.map(({ id: questionId, prompt, options, correctOption, position }) => ({ id: questionId, prompt, options, correctOption, position })),
		responseCount: responseCount.count
	};
}

export async function saveQuiz(binding: D1Database, input: z.output<typeof quizInputSchema>) {
	const startAt = parseIstInput(input.startIst);
	const endAt = parseIstInput(input.endIst);
	if (startAt >= endAt) error(400, 'End time must be after start time.');
	const db = getDb(binding);
	const id = input.id ?? crypto.randomUUID();
	if (input.id) {
		const [existing] = await db.select({ id: quizzes.id }).from(quizzes).where(eq(quizzes.id, id)).limit(1);
		if (!existing) error(404, 'Quiz not found.');
		const [submitted] = await db.select({ count: sql<number>`count(*)` }).from(submissions)
			.where(eq(submissions.quizId, id));
		if (submitted.count > 0) error(409, 'This quiz already has responses. Its questions and schedule are locked.');
	}
	if (input.published) {
		const [overlap] = await db.select({ id: quizzes.id, title: quizzes.title }).from(quizzes)
			.where(and(eq(quizzes.published, true), ne(quizzes.id, id), lt(quizzes.startAt, endAt), gt(quizzes.endAt, startAt)))
			.limit(1);
		if (overlap) error(409, `This time overlaps with ${overlap.title}. Only one quiz can be active at a time.`);
	}
	const now = Date.now();
	const quizValues = {
		id, weekNumber: input.weekNumber, title: input.title, description: input.description,
		startAt, endAt, published: input.published, createdAt: new Date(now), updatedAt: new Date(now)
	};
	try {
		await db.batch([
			db.insert(quizzes).values(quizValues).onConflictDoUpdate({
				target: quizzes.id,
				set: { weekNumber: input.weekNumber, title: input.title, description: input.description,
					startAt, endAt, published: input.published, updatedAt: new Date(now) }
			}),
			db.delete(questions).where(eq(questions.quizId, id)),
			db.insert(questions).values(input.questions.map((question, position) => ({
				id: crypto.randomUUID(), quizId: id, position: position + 1,
				prompt: question.prompt, options: question.options, correctOption: question.correctOption,
				createdAt: new Date(now)
			})))
		]);
	} catch (cause) {
		if (String(cause).includes('UNIQUE constraint')) error(409, 'Week number is already in use.');
		throw cause;
	}
	return { id };
}

export async function deleteQuiz(binding: D1Database, id: string) {
	const db = getDb(binding);
	const [quiz] = await db.select({ id: quizzes.id }).from(quizzes).where(eq(quizzes.id, id)).limit(1);
	if (!quiz) error(404, 'Quiz not found.');
	const [submitted] = await db.select({ count: sql<number>`count(*)` }).from(submissions)
		.where(eq(submissions.quizId, id));
	if (submitted.count > 0) error(409, 'Quizzes with responses cannot be deleted.');
	await db.delete(quizzes).where(eq(quizzes.id, id));
	return { success: true };
}

export async function getOverview(binding: D1Database, now = new Date()) {
	const db = getDb(binding);
	const [[studentCount], [submissionCount], [quizCount], [averageScore], latest] = await Promise.all([
		db.select({ count: sql<number>`count(*)` }).from(students),
		db.select({ count: sql<number>`count(*)` }).from(submissions),
		db.select({ count: sql<number>`count(*)` }).from(quizzes),
		db.select({ score: sql<number | null>`avg(score * 100.0 / total_questions)` }).from(submissions),
		db.select({ id: submissions.id, submittedAt: submissions.submittedAt, fullName: students.fullName, quizTitle: quizzes.title, score: submissions.score, totalQuestions: submissions.totalQuestions })
			.from(submissions).innerJoin(students, eq(submissions.studentId, students.id))
			.innerJoin(quizzes, eq(submissions.quizId, quizzes.id)).orderBy(desc(submissions.submittedAt)).limit(8)
	]);
	const quizList = await listQuizzes(binding, now);
	return { students: studentCount.count, responses: submissionCount.count, quizzes: quizCount.count,
		averagePercent: Math.round(averageScore.score ?? 0), quizzesByWeek: quizList,
		latest: latest.map((row) => ({ ...row, submittedAt: row.submittedAt.toISOString() })) };
}

export async function listStudents(binding: D1Database, filter: z.output<typeof quizFilterSchema>) {
	const db = getDb(binding);
	const condition = filter.search ? or(like(students.email, `%${filter.search}%`), like(students.fullName, `%${filter.search}%`), like(students.school, `%${filter.search}%`)) : undefined;
	const [rows, [{ count }]] = await Promise.all([
		db.select().from(students).where(condition).orderBy(desc(students.createdAt)).limit(50).offset((filter.page - 1) * 50),
		db.select({ count: sql<number>`count(*)` }).from(students).where(condition)
	]);
	return { rows: rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() })), count, page: filter.page, pageSize: 50 };
}

export async function listResponses(binding: D1Database, filter: z.output<typeof quizFilterSchema>) {
	const db = getDb(binding);
	const search = filter.search ? or(like(students.email, `%${filter.search}%`), like(students.fullName, `%${filter.search}%`)) : undefined;
	const condition = and(filter.quizId ? eq(submissions.quizId, filter.quizId) : undefined, search);
	const [rows, [{ count }]] = await Promise.all([
		db.select({ id: submissions.id, quizId: submissions.quizId, quizTitle: quizzes.title, weekNumber: quizzes.weekNumber,
			fullName: students.fullName, email: students.email, school: students.school, city: students.city,
			score: submissions.score, totalQuestions: submissions.totalQuestions, submittedAt: submissions.submittedAt })
			.from(submissions).innerJoin(students, eq(submissions.studentId, students.id)).innerJoin(quizzes, eq(submissions.quizId, quizzes.id))
			.where(condition).orderBy(desc(submissions.submittedAt)).limit(50).offset((filter.page - 1) * 50),
		db.select({ count: sql<number>`count(*)` }).from(submissions)
			.innerJoin(students, eq(submissions.studentId, students.id)).where(condition)
	]);
	return { rows: rows.map((row) => ({ ...row, submittedAt: row.submittedAt.toISOString() })), count, page: filter.page, pageSize: 50 };
}

export async function getResponse(binding: D1Database, id: string) {
	const db = getDb(binding);
	const [row] = await db.select({ id: submissions.id, quizId: submissions.quizId, quizTitle: quizzes.title,
		fullName: students.fullName, email: students.email, school: students.school, className: students.className,
		section: students.section, city: students.city, schoolAddress: students.schoolAddress,
		score: submissions.score, totalQuestions: submissions.totalQuestions, submittedAt: submissions.submittedAt })
		.from(submissions).innerJoin(students, eq(submissions.studentId, students.id))
		.innerJoin(quizzes, eq(submissions.quizId, quizzes.id)).where(eq(submissions.id, id)).limit(1);
	if (!row) error(404, 'Response not found.');
	const questionRows = await db.select({ questionId: questions.id, position: questions.position, prompt: questions.prompt,
		options: questions.options, correctOption: questions.correctOption, selectedOption: submissionAnswers.selectedOption,
		isCorrect: submissionAnswers.isCorrect })
		.from(submissionAnswers).innerJoin(questions, eq(submissionAnswers.questionId, questions.id))
		.where(eq(submissionAnswers.submissionId, id)).orderBy(asc(questions.position));
	return { ...row, submittedAt: row.submittedAt.toISOString(), answers: questionRows };
}

export async function getQuizExportRows(binding: D1Database, quizId: string, offset: number, limit = 250) {
	const db = getDb(binding);
	const rows = await db.select({ id: submissions.id, submittedAt: submissions.submittedAt, score: submissions.score,
		totalQuestions: submissions.totalQuestions, fullName: students.fullName, email: students.email,
		className: students.className, section: students.section, school: students.school, city: students.city,
		schoolAddress: students.schoolAddress })
		.from(submissions).innerJoin(students, eq(submissions.studentId, students.id))
		.where(eq(submissions.quizId, quizId)).orderBy(asc(submissions.submittedAt), asc(submissions.id))
		.limit(limit).offset(offset);
	if (rows.length === 0) return { rows, answers: [] };
	const answers = await db.select({ submissionId: submissionAnswers.submissionId, questionId: submissionAnswers.questionId,
		selectedOption: submissionAnswers.selectedOption })
		.from(submissionAnswers).where(inArray(submissionAnswers.submissionId, rows.map((row) => row.id)));
	return { rows, answers };
}
