import { env } from 'cloudflare:workers';
import { beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { getDb } from './db';
import { questions, quizzes, students, submissions, submissionAnswers } from './db/schema';
import { getPublicQuizState, registerStudent, submitQuiz } from './quiz';
import { deleteQuiz, getQuiz, saveQuiz } from './admin';
import { parseIstInput } from './india-time';

const registration = {
	fullName: 'Test Student', email: 'student@example.com', className: '8', section: 'A',
	school: 'NIE School', city: 'Delhi', schoolAddress: 'Test Road, Delhi'
};
const quizInput = (weekNumber = 1) => ({
	weekNumber, title: `Week ${weekNumber} quiz`, description: 'Reading quiz', published: true,
	startIst: '2026-10-09T09:00', endIst: '2026-10-16T00:00',
	questions: [
		{ prompt: 'First question?', options: ['Wrong', 'Right'], correctOption: 1 },
		{ prompt: 'Second question?', options: ['Yes', 'No', 'Maybe'], correctOption: 0 }
	]
});

async function expectHttpError(operation: Promise<unknown>, status: number, message: string) {
	try {
		await operation;
		throw new Error('Expected an HTTP error.');
	} catch (cause) {
		const received = cause as { status?: number; body?: { message?: string } };
		expect(received.status).toBe(status);
		expect(received.body?.message).toContain(message);
	}
}

beforeEach(async () => {
	const db = getDb(env.DB);
	await db.delete(submissionAnswers);
	await db.delete(submissions);
	await db.delete(questions);
	await db.delete(quizzes);
	await db.delete(students);
});

describe('registration and quiz flow on D1', () => {
	it('stores one student for a normalized email', async () => {
		expect(await registerStudent(env.DB, registration)).toEqual({ email: registration.email, alreadyRegistered: false });
		expect(await registerStudent(env.DB, registration)).toEqual({ email: registration.email, alreadyRegistered: true });
		expect(await getDb(env.DB).select().from(students)).toHaveLength(1);
	});

	it('opens at the configured IST start and closes at the configured IST end', async () => {
		await saveQuiz(env.DB, quizInput());
		expect((await getPublicQuizState(env.DB, new Date('2026-10-09T03:29:59Z'))).phase).toBe('upcoming');
		const open = await getPublicQuizState(env.DB, new Date('2026-10-09T03:30:00Z'));
		expect(open.phase).toBe('quiz');
		expect(open.quiz?.questions).toHaveLength(2);
		expect(open.quiz?.questions[0]).not.toHaveProperty('correctOption');
		expect((await getPublicQuizState(env.DB, new Date('2026-10-15T18:30:00Z'))).phase).toBe('ended');
	});

	it('saves a complete response and server-calculated score once', async () => {
		await registerStudent(env.DB, registration);
		const { id } = await saveQuiz(env.DB, quizInput());
		const quiz = await getQuiz(env.DB, id);
		const answers = quiz.questions.map((question, index) => ({ questionId: question.id, selectedOption: index === 0 ? 1 : 2 }));
		const now = parseIstInput('2026-10-09T10:00');
		const result = await submitQuiz(env.DB, { quizId: id, email: registration.email, answers }, now);
		const [saved] = await getDb(env.DB).select().from(submissions).where(eq(submissions.id, result.submissionId));
		expect(saved.score).toBe(1);
		expect(saved.totalQuestions).toBe(2);
		expect(await getDb(env.DB).select().from(submissionAnswers)).toHaveLength(2);
		await expectHttpError(submitQuiz(env.DB, { quizId: id, email: registration.email, answers }, now), 409, 'already been submitted');
		await expectHttpError(deleteQuiz(env.DB, id), 409, 'cannot be deleted');
		await expectHttpError(saveQuiz(env.DB, { ...quizInput(), id }), 409, 'locked');
	});

	it('rejects unregistered emails, incomplete answers, and late submissions', async () => {
		const { id } = await saveQuiz(env.DB, quizInput());
		const quiz = await getQuiz(env.DB, id);
		const complete = quiz.questions.map((question) => ({ questionId: question.id, selectedOption: 0 }));
		const open = parseIstInput('2026-10-09T10:00');
		await expectHttpError(submitQuiz(env.DB, { quizId: id, email: registration.email, answers: complete }, open), 404, 'Register');
		await registerStudent(env.DB, registration);
		await expectHttpError(submitQuiz(env.DB, { quizId: id, email: registration.email, answers: complete.slice(0, 1) }, open), 400, 'exactly once');
		await expectHttpError(submitQuiz(env.DB, { quizId: id, email: registration.email, answers: complete }, parseIstInput('2026-10-16T00:00')), 403, 'not open');
	});

	it('prevents overlapping published quizzes', async () => {
		await saveQuiz(env.DB, quizInput());
		await expectHttpError(saveQuiz(env.DB, { ...quizInput(2), startIst: '2026-10-15T09:00', endIst: '2026-10-22T09:00' }), 409, 'overlaps');
		const draft = await saveQuiz(env.DB, { ...quizInput(2), startIst: '2026-10-15T09:00', endIst: '2026-10-22T09:00', published: false });
		expect((await getQuiz(env.DB, draft.id)).published).toBe(false);
	});
});
