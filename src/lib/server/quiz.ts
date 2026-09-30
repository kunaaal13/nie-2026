import { and, asc, eq, gt, lte, sql } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { questions, quizzes, students, submissions, submissionAnswers } from '$lib/server/db/schema';
import type { z } from 'zod';
import { quizSubmissionSchema, registrationSchema } from '$lib/validation';
import { formatIst } from '$lib/server/india-time';

export async function registerStudent(binding: D1Database, input: z.output<typeof registrationSchema>) {
	const db = getDb(binding);
	const now = new Date();
	const result = await db.insert(students).values({
		id: crypto.randomUUID(),
		...input,
		createdAt: now,
		updatedAt: now
	}).onConflictDoNothing({ target: students.email }).returning({ id: students.id });
	return { email: input.email, alreadyRegistered: result.length === 0 };
}

export async function getPublicQuizState(binding: D1Database, now = new Date()) {
	const db = getDb(binding);
	const [active] = await db.select().from(quizzes).where(and(
		eq(quizzes.published, true),
		lte(quizzes.startAt, now),
		gt(quizzes.endAt, now)
	)).orderBy(asc(quizzes.startAt)).limit(1);
	if (active) {
		const quizQuestions = await db.select({
			id: questions.id,
			prompt: questions.prompt,
			options: questions.options,
			position: questions.position
		}).from(questions).where(eq(questions.quizId, active.id)).orderBy(asc(questions.position));
		return {
			phase: 'quiz' as const,
			quiz: { id: active.id, title: active.title, description: active.description, weekNumber: active.weekNumber, endAt: active.endAt.toISOString(), endAtIst: formatIst(active.endAt), questions: quizQuestions },
			nextQuiz: null
		};
	}
	const [next] = await db.select({
		id: quizzes.id,
		title: quizzes.title,
		weekNumber: quizzes.weekNumber,
		startAt: quizzes.startAt
	}).from(quizzes).where(and(eq(quizzes.published, true), gt(quizzes.startAt, now)))
		.orderBy(asc(quizzes.startAt)).limit(1);
	if (next) return { phase: 'upcoming' as const, quiz: null, nextQuiz: { ...next, startAt: next.startAt.toISOString(), startAtIst: formatIst(next.startAt) } };
	const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(quizzes)
		.where(eq(quizzes.published, true));
	return { phase: (count > 0 ? 'ended' : 'not-scheduled') as 'ended' | 'not-scheduled', quiz: null, nextQuiz: null };
}

export async function submitQuiz(binding: D1Database, input: z.output<typeof quizSubmissionSchema>, now = new Date()) {
	const db = getDb(binding);
	const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, input.quizId)).limit(1);
	if (!quiz || !quiz.published || now < quiz.startAt || now >= quiz.endAt) {
		error(403, 'This quiz is not open for submissions.');
	}
	const [student] = await db.select({ id: students.id }).from(students)
		.where(eq(students.email, input.email)).limit(1);
	if (!student) error(404, 'Register with this email before submitting the quiz.');
	const [existing] = await db.select({ id: submissions.id }).from(submissions)
		.where(and(eq(submissions.quizId, quiz.id), eq(submissions.studentId, student.id))).limit(1);
	if (existing) error(409, 'A response for this quiz has already been submitted with this email.');
	const quizQuestions = await db.select().from(questions).where(eq(questions.quizId, quiz.id));
	const selected = new Map(input.answers.map((answer) => [answer.questionId, answer.selectedOption]));
	if (selected.size !== quizQuestions.length || input.answers.length !== quizQuestions.length ||
		quizQuestions.some((question) => {
			const option = selected.get(question.id);
			return option === undefined || option < 0 || option >= question.options.length;
		})) {
		error(400, 'Answer every question exactly once.');
	}
	const score = quizQuestions.reduce((total, question) => total + Number(selected.get(question.id) === question.correctOption), 0);
	const submissionId = crypto.randomUUID();
	try {
		await db.batch([
			db.insert(submissions).values({
				id: submissionId,
				quizId: quiz.id,
				studentId: student.id,
				score,
				totalQuestions: quizQuestions.length,
				submittedAt: now
			}),
			db.insert(submissionAnswers).values(quizQuestions.map((question) => ({
				id: crypto.randomUUID(),
				submissionId,
				questionId: question.id,
				selectedOption: selected.get(question.id)!,
				isCorrect: selected.get(question.id) === question.correctOption
			})))
		]);
	} catch (cause) {
		if (String(cause).includes('UNIQUE constraint')) error(409, 'A response for this quiz has already been submitted with this email.');
		throw cause;
	}
	return { submissionId };
}
