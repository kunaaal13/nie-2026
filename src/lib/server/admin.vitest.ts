import { env } from 'cloudflare:workers';
import { beforeEach, describe, expect, it } from 'vitest';
import { getDb } from './db';
import { questions, quizzes, students, submissions, submissionAnswers } from './db/schema';
import { registerStudent, submitQuiz } from './quiz';
import {
	deleteResponse, deleteStudent, getOverview, getQuiz, getQuizExportRows, getQuizStats, getStudent, listQuizzes,
	listResponses, listStudents, saveQuiz, setQuizPublished, updateQuizDetails, updateStudent
} from './admin';
import { parseIstInput } from './india-time';

const student = (name: string, city = 'Delhi', className = '8') => ({
	fullName: name, email: `${name.toLowerCase()}@example.com`, className, section: 'A',
	school: 'NIE School', city, schoolAddress: 'Test Road'
});
const quizInput = (weekNumber: number, startIst: string, endIst: string) => ({
	weekNumber, title: `Week ${weekNumber} quiz`, description: '', published: true, startIst, endIst,
	questions: [
		{ prompt: 'First?', options: ['Wrong', 'Right'], correctOption: 1 },
		{ prompt: 'Second?', options: ['Yes', 'No', 'Maybe'], correctOption: 0 }
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

async function answer(quizId: string, email: string, options: number[], at: string) {
	const quiz = await getQuiz(env.DB, quizId);
	return submitQuiz(env.DB, {
		quizId, email, answers: quiz.questions.map((question, index) => ({ questionId: question.id, selectedOption: options[index] }))
	}, parseIstInput(at));
}

let week1: string;
let week2: string;
const now = parseIstInput('2026-10-20T12:00');

beforeEach(async () => {
	const db = getDb(env.DB);
	await db.delete(submissionAnswers);
	await db.delete(submissions);
	await db.delete(questions);
	await db.delete(quizzes);
	await db.delete(students);
	for (const name of ['Asha', 'Ravi', 'Meera']) await registerStudent(env.DB, student(name, name === 'Meera' ? 'Mumbai' : 'Delhi'));
	week1 = (await saveQuiz(env.DB, quizInput(1, '2026-10-09T09:00', '2026-10-12T00:00'))).id;
	week2 = (await saveQuiz(env.DB, quizInput(2, '2026-10-16T09:00', '2026-10-19T00:00'))).id;
	await answer(week1, 'asha@example.com', [1, 0], '2026-10-09T10:00');
	await answer(week1, 'ravi@example.com', [0, 0], '2026-10-10T10:00');
	await answer(week2, 'asha@example.com', [1, 1], '2026-10-16T10:00');
});

describe('admin statistics', () => {
	it('summarises attendance across quizzes', async () => {
		const overview = await getOverview(env.DB, now);
		expect(overview.students).toBe(3);
		expect(overview.responses).toBe(3);
		expect(overview.participants).toBe(2);
		expect(overview.attendedAll).toBe(1);
		expect(overview.openedQuizzes).toBe(2);
		expect(overview.perfectScores).toBe(1);
		expect(overview.engagement).toEqual([{ attempts: 0, students: 1 }, { attempts: 1, students: 1 }, { attempts: 2, students: 1 }]);
		expect(overview.topCities[0]).toEqual({ name: 'Delhi', count: 2 });
	});

	it('reports per-quiz attendance and question accuracy', async () => {
		const [latest] = await listQuizzes(env.DB, now);
		expect(latest.weekNumber).toBe(2);
		expect(latest).toMatchObject({ status: 'Closed', questionCount: 2, responseCount: 1, eligibleCount: 3, participationPercent: 33.3, averagePercent: 50 });
		const stats = await getQuizStats(env.DB, week1, now);
		expect(stats.responses).toBe(2);
		expect(stats.eligible).toBe(3);
		expect(stats.averagePercent).toBe(75);
		expect(stats.perfectScores).toBe(1);
		expect(stats.questions[0]).toMatchObject({ counts: [1, 1], answered: 2, accuracyPercent: 50 });
		expect(stats.questions[1]).toMatchObject({ counts: [2, 0, 0], accuracyPercent: 100 });
		expect(stats.byDay).toEqual([{ day: '2026-10-09', count: 1 }, { day: '2026-10-10', count: 1 }]);
	});
});

describe('admin lists', () => {
	it('filters students by participation and city', async () => {
		const never = await listStudents(env.DB, { page: 1, search: '', participation: 'never', sort: 'recent' });
		expect(never.rows.map((row) => row.fullName)).toEqual(['Meera']);
		const delhi = await listStudents(env.DB, { page: 1, search: '', city: 'Delhi', participation: 'all', sort: 'attempts' });
		expect(delhi.rows.map((row) => [row.fullName, row.attempts])).toEqual([['Asha', 2], ['Ravi', 1]]);
		expect(delhi.facets.cities).toEqual(['Delhi', 'Mumbai']);
	});

	it('sorts responses by score', async () => {
		const result = await listResponses(env.DB, { quizId: week1, page: 1, search: '', sort: 'score-asc' });
		expect(result.rows.map((row) => row.fullName)).toEqual(['Ravi', 'Asha']);
		expect((await getQuizExportRows(env.DB, week1, 0)).answers).toHaveLength(4);
	});
});

describe('admin changes', () => {
	it('edits the schedule of a quiz with responses but keeps questions locked', async () => {
		await updateQuizDetails(env.DB, { id: week1, weekNumber: 1, title: 'Renamed', description: '', published: true, startIst: '2026-10-09T09:00', endIst: '2026-10-13T00:00' });
		const quiz = await getQuiz(env.DB, week1);
		expect(quiz.title).toBe('Renamed');
		expect(quiz.endIst).toBe('2026-10-13T00:00');
		await expectHttpError(updateQuizDetails(env.DB, { id: week1, weekNumber: 1, title: 'x', description: '', published: true, startIst: '2026-10-16T09:00', endIst: '2026-10-17T00:00' }), 409, 'overlaps');
	});

	it('toggles publishing with the overlap check', async () => {
		const draft = await saveQuiz(env.DB, { ...quizInput(3, '2026-10-18T09:00', '2026-10-25T00:00'), published: false });
		await expectHttpError(setQuizPublished(env.DB, draft.id, true), 409, 'overlaps');
		await setQuizPublished(env.DB, week2, false);
		await setQuizPublished(env.DB, draft.id, true);
		expect((await getQuiz(env.DB, draft.id)).published).toBe(true);
	});

	it('deletes a response so the student can retake the quiz', async () => {
		const [response] = (await listResponses(env.DB, { quizId: week2, page: 1, search: '', sort: 'recent' })).rows;
		await deleteResponse(env.DB, response.id);
		expect((await getQuizStats(env.DB, week2, now)).responses).toBe(0);
		expect(await getDb(env.DB).select().from(submissionAnswers)).toHaveLength(4);
	});

	it('updates and deletes a student with their responses', async () => {
		const [asha] = (await listStudents(env.DB, { page: 1, search: 'asha', participation: 'all', sort: 'recent' })).rows;
		await expectHttpError(updateStudent(env.DB, { ...student('Asha'), id: asha.id, email: 'ravi@example.com' }), 409, 'already registered');
		await updateStudent(env.DB, { ...student('Asha'), id: asha.id, fullName: 'Asha K' });
		expect((await getStudent(env.DB, asha.id)).fullName).toBe('Asha K');
		await deleteStudent(env.DB, asha.id);
		expect(await getDb(env.DB).select().from(submissions)).toHaveLength(1);
		expect(await getDb(env.DB).select().from(submissionAnswers)).toHaveLength(2);
	});
});
