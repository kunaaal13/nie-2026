import { and, asc, desc, eq, gt, inArray, like, lt, ne, or, sql, type SQL } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import type { z } from 'zod';
import { getDb } from '$lib/server/db';
import { questions, quizzes, students, submissions, submissionAnswers } from '$lib/server/db/schema';
import { formatIstInput, parseIstInput } from '$lib/server/india-time';
import type {
	quizDetailsSchema, quizInputSchema, responseFilterSchema, studentFilterSchema, studentUpdateSchema
} from '$lib/validation';

export type QuizStatus = 'Draft' | 'Scheduled' | 'Active' | 'Closed';
const PAGE_SIZE = 25;
const IST_OFFSET_SECONDS = 5.5 * 60 * 60;

function quizStatus(quiz: { published: boolean; startAt: Date; endAt: Date }, now: Date): QuizStatus {
	if (!quiz.published) return 'Draft';
	if (now < quiz.startAt) return 'Scheduled';
	return now >= quiz.endAt ? 'Closed' : 'Active';
}

function percent(part: number, whole: number) {
	return whole > 0 ? Math.round((part / whole) * 1000) / 10 : 0;
}

function parseWindow(startIst: string, endIst: string) {
	let startAt: Date, endAt: Date;
	try {
		startAt = parseIstInput(startIst);
		endAt = parseIstInput(endIst);
	} catch {
		error(400, 'Enter a valid start and end time in IST.');
	}
	if (startAt >= endAt) error(400, 'End time must be after start time.');
	return { startAt, endAt };
}

async function countResponses(binding: D1Database, quizId: string) {
	const [row] = await getDb(binding).select({ count: sql<number>`count(*)` }).from(submissions)
		.where(eq(submissions.quizId, quizId));
	return row.count;
}

async function assertNoOverlap(binding: D1Database, id: string, startAt: Date, endAt: Date) {
	const [overlap] = await getDb(binding).select({ title: quizzes.title, weekNumber: quizzes.weekNumber }).from(quizzes)
		.where(and(eq(quizzes.published, true), ne(quizzes.id, id), lt(quizzes.startAt, endAt), gt(quizzes.endAt, startAt)))
		.limit(1);
	if (overlap) error(409, `This time overlaps with Week ${overlap.weekNumber}: ${overlap.title}. Only one quiz can be live at a time.`);
}

function rethrowUnique(cause: unknown, message: string): never {
	// Drizzle wraps driver errors, so the constraint name may only appear on the cause.
	if (String(cause).includes('UNIQUE constraint') || String((cause as { cause?: unknown })?.cause).includes('UNIQUE constraint')) error(409, message);
	throw cause;
}

/* ───────────────────────────── Quizzes ───────────────────────────── */

export async function listQuizzes(binding: D1Database, now = new Date()) {
	const db = getDb(binding);
	const nowMs = now.getTime();
	const rows = await db.select({
		quiz: quizzes,
		questionCount: sql<number>`(select count(*) from ${questions} where ${questions.quizId} = "quizzes"."id")`,
		responseCount: sql<number>`(select count(*) from ${submissions} where ${submissions.quizId} = "quizzes"."id")`,
		averagePercent: sql<number | null>`(select avg(${submissions.score} * 100.0 / ${submissions.totalQuestions}) from ${submissions} where ${submissions.quizId} = "quizzes"."id")`,
		// Students who had registered before the quiz closed (or by now, for a live quiz) could have taken it.
		eligibleCount: sql<number>`(select count(*) from ${students} where ${students.createdAt} < min("quizzes"."end_at", ${nowMs}))`
	}).from(quizzes).orderBy(desc(quizzes.weekNumber));
	return rows.map(({ quiz, questionCount, responseCount, averagePercent, eligibleCount }) => ({
		...quiz,
		startAt: quiz.startAt.toISOString(),
		endAt: quiz.endAt.toISOString(),
		createdAt: quiz.createdAt.toISOString(),
		updatedAt: quiz.updatedAt.toISOString(),
		status: quizStatus(quiz, now),
		questionCount,
		responseCount,
		eligibleCount,
		participationPercent: percent(responseCount, eligibleCount),
		averagePercent: averagePercent === null ? null : Math.round(averagePercent)
	}));
}

export async function getQuiz(binding: D1Database, id: string, now = new Date()) {
	const db = getDb(binding);
	const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, id)).limit(1);
	if (!quiz) error(404, 'Quiz not found.');
	const quizQuestions = await db.select().from(questions).where(eq(questions.quizId, id))
		.orderBy(asc(questions.position));
	return {
		...quiz,
		startAt: quiz.startAt.toISOString(),
		endAt: quiz.endAt.toISOString(),
		createdAt: quiz.createdAt.toISOString(),
		updatedAt: quiz.updatedAt.toISOString(),
		startIst: formatIstInput(quiz.startAt),
		endIst: formatIstInput(quiz.endAt),
		status: quizStatus(quiz, now),
		questions: quizQuestions.map(({ id: questionId, prompt, options, correctOption, position }) => ({ id: questionId, prompt, options, correctOption, position })),
		responseCount: await countResponses(binding, id)
	};
}

export async function saveQuiz(binding: D1Database, input: z.output<typeof quizInputSchema>) {
	const { startAt, endAt } = parseWindow(input.startIst, input.endIst);
	const db = getDb(binding);
	const id = input.id ?? crypto.randomUUID();
	if (input.id) {
		const [existing] = await db.select({ id: quizzes.id }).from(quizzes).where(eq(quizzes.id, id)).limit(1);
		if (!existing) error(404, 'Quiz not found.');
		if (await countResponses(binding, id) > 0) error(409, 'This quiz already has responses. Its questions are locked.');
	}
	if (input.published) await assertNoOverlap(binding, id, startAt, endAt);
	const now = new Date();
	try {
		await db.batch([
			db.insert(quizzes).values({
				id, weekNumber: input.weekNumber, title: input.title, description: input.description,
				startAt, endAt, published: input.published, createdAt: now, updatedAt: now
			}).onConflictDoUpdate({
				target: quizzes.id,
				set: { weekNumber: input.weekNumber, title: input.title, description: input.description,
					startAt, endAt, published: input.published, updatedAt: now }
			}),
			db.delete(questions).where(eq(questions.quizId, id)),
			db.insert(questions).values(input.questions.map((question, position) => ({
				id: crypto.randomUUID(), quizId: id, position: position + 1,
				prompt: question.prompt, options: question.options, correctOption: question.correctOption,
				createdAt: now
			})))
		]);
	} catch (cause) {
		rethrowUnique(cause, 'Week number is already in use.');
	}
	return { id };
}

// Updates everything except questions, so it is safe for quizzes that already have responses.
export async function updateQuizDetails(binding: D1Database, input: z.output<typeof quizDetailsSchema>) {
	const { startAt, endAt } = parseWindow(input.startIst, input.endIst);
	const db = getDb(binding);
	const [existing] = await db.select({ id: quizzes.id }).from(quizzes).where(eq(quizzes.id, input.id)).limit(1);
	if (!existing) error(404, 'Quiz not found.');
	if (input.published) await assertNoOverlap(binding, input.id, startAt, endAt);
	try {
		await db.update(quizzes).set({
			weekNumber: input.weekNumber, title: input.title, description: input.description,
			startAt, endAt, published: input.published, updatedAt: new Date()
		}).where(eq(quizzes.id, input.id));
	} catch (cause) {
		rethrowUnique(cause, 'Week number is already in use.');
	}
	return { id: input.id };
}

export async function setQuizPublished(binding: D1Database, id: string, published: boolean) {
	const db = getDb(binding);
	const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, id)).limit(1);
	if (!quiz) error(404, 'Quiz not found.');
	if (published) await assertNoOverlap(binding, id, quiz.startAt, quiz.endAt);
	await db.update(quizzes).set({ published, updatedAt: new Date() }).where(eq(quizzes.id, id));
	return { id, published };
}

export async function deleteQuiz(binding: D1Database, id: string) {
	const db = getDb(binding);
	const [quiz] = await db.select({ id: quizzes.id }).from(quizzes).where(eq(quizzes.id, id)).limit(1);
	if (!quiz) error(404, 'Quiz not found.');
	if (await countResponses(binding, id) > 0) error(409, 'Quizzes with responses cannot be deleted.');
	await db.delete(quizzes).where(eq(quizzes.id, id));
	return { success: true };
}

function scoreBuckets(percents: number[]) {
	const labels = ['0–19%', '20–39%', '40–59%', '60–79%', '80–99%', '100%'];
	const counts = labels.map(() => 0);
	for (const value of percents) counts[value >= 100 ? 5 : Math.min(4, Math.floor(value / 20))]++;
	return labels.map((label, index) => ({ label, count: counts[index] }));
}

export async function getQuizStats(binding: D1Database, id: string, now = new Date()) {
	const db = getDb(binding);
	const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, id)).limit(1);
	if (!quiz) error(404, 'Quiz not found.');
	const cutoff = new Date(Math.min(quiz.endAt.getTime(), now.getTime()));
	const [quizQuestions, scores, optionCounts, [eligible], schools, byDay] = await Promise.all([
		db.select().from(questions).where(eq(questions.quizId, id)).orderBy(asc(questions.position)),
		db.select({ score: submissions.score, total: submissions.totalQuestions }).from(submissions).where(eq(submissions.quizId, id)),
		db.select({ questionId: submissionAnswers.questionId, option: submissionAnswers.selectedOption, count: sql<number>`count(*)` })
			.from(submissionAnswers).innerJoin(submissions, eq(submissionAnswers.submissionId, submissions.id))
			.where(eq(submissions.quizId, id)).groupBy(submissionAnswers.questionId, submissionAnswers.selectedOption),
		db.select({ count: sql<number>`count(*)` }).from(students).where(lt(students.createdAt, cutoff)),
		db.select({ school: students.school, count: sql<number>`count(*)`, average: sql<number>`avg(${submissions.score} * 100.0 / ${submissions.totalQuestions})` })
			.from(submissions).innerJoin(students, eq(submissions.studentId, students.id))
			.where(eq(submissions.quizId, id)).groupBy(students.school).orderBy(desc(sql`count(*)`)).limit(8),
		db.select({ day: sql<string>`date(${submissions.submittedAt} / 1000 + ${IST_OFFSET_SECONDS}, 'unixepoch')`, count: sql<number>`count(*)` })
			.from(submissions).where(eq(submissions.quizId, id)).groupBy(sql`1`).orderBy(sql`1`)
	]);
	const percents = scores.map((row) => (row.score * 100) / row.total);
	const sorted = [...percents].sort((a, b) => a - b);
	const median = sorted.length === 0 ? null
		: sorted.length % 2 ? sorted[(sorted.length - 1) / 2] : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;
	const countsByQuestion = new Map<string, number[]>();
	for (const row of optionCounts) {
		const counts = countsByQuestion.get(row.questionId) ?? [];
		counts[row.option] = row.count;
		countsByQuestion.set(row.questionId, counts);
	}
	return {
		status: quizStatus(quiz, now),
		responses: scores.length,
		eligible: eligible.count,
		participationPercent: percent(scores.length, eligible.count),
		averagePercent: percents.length ? Math.round(percents.reduce((a, b) => a + b, 0) / percents.length) : null,
		medianPercent: median === null ? null : Math.round(median),
		perfectScores: scores.filter((row) => row.score === row.total).length,
		distribution: scoreBuckets(percents),
		byDay,
		schools: schools.map((row) => ({ ...row, average: Math.round(row.average) })),
		questions: quizQuestions.map((question) => {
			const counts = question.options.map((_, index) => countsByQuestion.get(question.id)?.[index] ?? 0);
			const answered = counts.reduce((a, b) => a + b, 0);
			return {
				id: question.id, position: question.position, prompt: question.prompt, options: question.options,
				correctOption: question.correctOption, counts, answered,
				accuracyPercent: answered ? percent(counts[question.correctOption], answered) : null
			};
		})
	};
}

/* ───────────────────────────── Overview ───────────────────────────── */

export async function getOverview(binding: D1Database, now = new Date()) {
	const db = getDb(binding);
	const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
	const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
	const attemptsPerStudent = db.select({ studentId: submissions.studentId, attempts: sql<number>`count(*)`.as('attempts') })
		.from(submissions).groupBy(submissions.studentId).as('attempts_per_student');
	const [
		[studentCount], [newStudents], [responseTotals], quizList, attemptRows, scoreRows, registrations, topSchools, topCities, latest
	] = await Promise.all([
		db.select({ count: sql<number>`count(*)` }).from(students),
		db.select({ count: sql<number>`count(*)` }).from(students).where(gt(students.createdAt, weekAgo)),
		db.select({
			count: sql<number>`count(*)`,
			average: sql<number | null>`avg(${submissions.score} * 100.0 / ${submissions.totalQuestions})`,
			perfect: sql<number>`coalesce(sum(case when ${submissions.score} = ${submissions.totalQuestions} then 1 else 0 end), 0)`
		}).from(submissions),
		listQuizzes(binding, now),
		db.select({ attempts: attemptsPerStudent.attempts, students: sql<number>`count(*)` })
			.from(attemptsPerStudent).groupBy(sql`1`).orderBy(sql`1`),
		db.select({ score: submissions.score, total: submissions.totalQuestions }).from(submissions),
		db.select({ day: sql<string>`date(${students.createdAt} / 1000 + ${IST_OFFSET_SECONDS}, 'unixepoch')`, count: sql<number>`count(*)` })
			.from(students).where(gt(students.createdAt, thirtyDaysAgo)).groupBy(sql`1`).orderBy(sql`1`),
		db.select({ name: students.school, count: sql<number>`count(*)` }).from(students)
			.groupBy(students.school).orderBy(desc(sql`count(*)`)).limit(6),
		db.select({ name: students.city, count: sql<number>`count(*)` }).from(students)
			.groupBy(students.city).orderBy(desc(sql`count(*)`)).limit(6),
		db.select({ id: submissions.id, submittedAt: submissions.submittedAt, fullName: students.fullName, email: students.email,
			weekNumber: quizzes.weekNumber, quizTitle: quizzes.title, score: submissions.score, totalQuestions: submissions.totalQuestions })
			.from(submissions).innerJoin(students, eq(submissions.studentId, students.id))
			.innerJoin(quizzes, eq(submissions.quizId, quizzes.id)).orderBy(desc(submissions.submittedAt)).limit(6)
	]);

	const opened = quizList.filter((quiz) => quiz.status === 'Active' || quiz.status === 'Closed');
	const participants = attemptRows.reduce((total, row) => total + row.students, 0);
	const attendedAll = opened.length === 0 ? 0
		: attemptRows.filter((row) => row.attempts >= opened.length).reduce((total, row) => total + row.students, 0);
	const seats = opened.reduce((total, quiz) => total + quiz.eligibleCount, 0);
	const seatResponses = opened.reduce((total, quiz) => total + quiz.responseCount, 0);

	// Fill every IST calendar day in the last 30 so the chart has no gaps.
	const registrationsByDay = new Map(registrations.map((row) => [row.day, row.count]));
	const days = Array.from({ length: 30 }, (_, index) => {
		const date = new Date(now.getTime() + IST_OFFSET_SECONDS * 1000 - (29 - index) * 24 * 60 * 60 * 1000);
		const day = date.toISOString().slice(0, 10);
		return { day, count: registrationsByDay.get(day) ?? 0 };
	});

	const engagement = Array.from({ length: Math.max(opened.length, 1) + 1 }, (_, attempts) => ({
		attempts,
		students: attempts === 0 ? studentCount.count - participants
			: attemptRows.filter((row) => attempts === Math.max(opened.length, 1) ? row.attempts >= attempts : row.attempts === attempts)
				.reduce((total, row) => total + row.students, 0)
	}));

	return {
		students: studentCount.count,
		newStudents: newStudents.count,
		responses: responseTotals.count,
		perfectScores: responseTotals.perfect,
		averagePercent: responseTotals.average === null ? null : Math.round(responseTotals.average),
		participants,
		participantPercent: percent(participants, studentCount.count),
		attendedAll,
		attendedAllPercent: percent(attendedAll, studentCount.count),
		participationPercent: percent(seatResponses, seats),
		openedQuizzes: opened.length,
		quizCounts: {
			total: quizList.length,
			draft: quizList.filter((quiz) => quiz.status === 'Draft').length,
			scheduled: quizList.filter((quiz) => quiz.status === 'Scheduled').length
		},
		activeQuiz: quizList.find((quiz) => quiz.status === 'Active') ?? null,
		nextQuiz: quizList.filter((quiz) => quiz.status === 'Scheduled').sort((a, b) => a.startAt.localeCompare(b.startAt))[0] ?? null,
		quizzes: quizList,
		registrationsByDay: days,
		distribution: scoreBuckets(scoreRows.map((row) => (row.score * 100) / row.total)),
		engagement,
		topSchools,
		topCities,
		latest: latest.map((row) => ({ ...row, submittedAt: row.submittedAt.toISOString() }))
	};
}

/* ───────────────────────────── Students ───────────────────────────── */

const studentAttempts = sql<number>`(select count(*) from ${submissions} where ${submissions.studentId} = "students"."id")`;
const studentAverage = sql<number | null>`(select avg(${submissions.score} * 100.0 / ${submissions.totalQuestions}) from ${submissions} where ${submissions.studentId} = "students"."id")`;

function studentCondition(filter: z.output<typeof studentFilterSchema>) {
	const conditions: (SQL | undefined)[] = [];
	if (filter.search) {
		const pattern = `%${filter.search}%`;
		conditions.push(or(like(students.email, pattern), like(students.fullName, pattern), like(students.school, pattern)));
	}
	if (filter.className) conditions.push(eq(students.className, filter.className));
	if (filter.city) conditions.push(eq(students.city, filter.city));
	if (filter.participation === 'attempted') conditions.push(sql`${studentAttempts} > 0`);
	if (filter.participation === 'never') conditions.push(sql`${studentAttempts} = 0`);
	return and(...conditions);
}

export async function listStudents(binding: D1Database, filter: z.output<typeof studentFilterSchema>) {
	const db = getDb(binding);
	const condition = studentCondition(filter);
	const order = {
		recent: [desc(students.createdAt)],
		oldest: [asc(students.createdAt)],
		name: [asc(students.fullName)],
		attempts: [desc(studentAttempts), desc(students.createdAt)]
	}[filter.sort];
	const [rows, [{ count }], classes, cities] = await Promise.all([
		db.select({ student: students, attempts: studentAttempts, averagePercent: studentAverage }).from(students)
			.where(condition).orderBy(...order).limit(PAGE_SIZE).offset((filter.page - 1) * PAGE_SIZE),
		db.select({ count: sql<number>`count(*)` }).from(students).where(condition),
		db.selectDistinct({ value: students.className }).from(students).orderBy(asc(students.className)),
		db.selectDistinct({ value: students.city }).from(students).orderBy(asc(students.city))
	]);
	return {
		rows: rows.map(({ student, attempts, averagePercent }) => ({
			...student, createdAt: student.createdAt.toISOString(), updatedAt: student.updatedAt.toISOString(),
			attempts, averagePercent: averagePercent === null ? null : Math.round(averagePercent)
		})),
		count, page: filter.page, pageSize: PAGE_SIZE,
		facets: { classes: classes.map((row) => row.value), cities: cities.map((row) => row.value) }
	};
}

export async function getStudent(binding: D1Database, id: string) {
	const db = getDb(binding);
	const [student] = await db.select().from(students).where(eq(students.id, id)).limit(1);
	if (!student) error(404, 'Student not found.');
	const history = await db.select({ id: submissions.id, quizId: quizzes.id, weekNumber: quizzes.weekNumber, quizTitle: quizzes.title,
		score: submissions.score, totalQuestions: submissions.totalQuestions, submittedAt: submissions.submittedAt })
		.from(submissions).innerJoin(quizzes, eq(submissions.quizId, quizzes.id))
		.where(eq(submissions.studentId, id)).orderBy(desc(quizzes.weekNumber));
	return {
		...student, createdAt: student.createdAt.toISOString(), updatedAt: student.updatedAt.toISOString(),
		submissions: history.map((row) => ({ ...row, submittedAt: row.submittedAt.toISOString() }))
	};
}

export async function updateStudent(binding: D1Database, input: z.output<typeof studentUpdateSchema>) {
	const db = getDb(binding);
	const { id, ...values } = input;
	try {
		const updated = await db.update(students).set({ ...values, updatedAt: new Date() }).where(eq(students.id, id))
			.returning({ id: students.id });
		if (updated.length === 0) error(404, 'Student not found.');
	} catch (cause) {
		rethrowUnique(cause, 'Another student is already registered with this email.');
	}
	return { id };
}

// Removes the student together with all of their quiz responses.
export async function deleteStudent(binding: D1Database, id: string) {
	const db = getDb(binding);
	const [student] = await db.select({ id: students.id }).from(students).where(eq(students.id, id)).limit(1);
	if (!student) error(404, 'Student not found.');
	const studentSubmissions = db.select({ id: submissions.id }).from(submissions).where(eq(submissions.studentId, id));
	await db.batch([
		db.delete(submissionAnswers).where(inArray(submissionAnswers.submissionId, studentSubmissions)),
		db.delete(submissions).where(eq(submissions.studentId, id)),
		db.delete(students).where(eq(students.id, id))
	]);
	return { success: true };
}

export async function getStudentExportRows(binding: D1Database, offset: number, limit = 500) {
	return getDb(binding).select({ student: students, attempts: studentAttempts, averagePercent: studentAverage })
		.from(students).orderBy(asc(students.createdAt), asc(students.id)).limit(limit).offset(offset);
}

/* ───────────────────────────── Responses ───────────────────────────── */

export async function listResponses(binding: D1Database, filter: z.output<typeof responseFilterSchema>) {
	const db = getDb(binding);
	const pattern = `%${filter.search}%`;
	const search = filter.search ? or(like(students.email, pattern), like(students.fullName, pattern), like(students.school, pattern)) : undefined;
	const condition = and(filter.quizId ? eq(submissions.quizId, filter.quizId) : undefined, search);
	const scorePercent = sql`${submissions.score} * 1.0 / ${submissions.totalQuestions}`;
	const order = {
		recent: [desc(submissions.submittedAt)],
		oldest: [asc(submissions.submittedAt)],
		'score-desc': [desc(scorePercent), asc(submissions.submittedAt)],
		'score-asc': [asc(scorePercent), asc(submissions.submittedAt)]
	}[filter.sort];
	const [rows, [{ count }]] = await Promise.all([
		db.select({ id: submissions.id, quizId: submissions.quizId, quizTitle: quizzes.title, weekNumber: quizzes.weekNumber,
			studentId: students.id, fullName: students.fullName, email: students.email, school: students.school, city: students.city,
			className: students.className, section: students.section,
			score: submissions.score, totalQuestions: submissions.totalQuestions, submittedAt: submissions.submittedAt })
			.from(submissions).innerJoin(students, eq(submissions.studentId, students.id)).innerJoin(quizzes, eq(submissions.quizId, quizzes.id))
			.where(condition).orderBy(...order).limit(PAGE_SIZE).offset((filter.page - 1) * PAGE_SIZE),
		db.select({ count: sql<number>`count(*)` }).from(submissions)
			.innerJoin(students, eq(submissions.studentId, students.id)).where(condition)
	]);
	return { rows: rows.map((row) => ({ ...row, submittedAt: row.submittedAt.toISOString() })), count, page: filter.page, pageSize: PAGE_SIZE };
}

export async function getResponse(binding: D1Database, id: string) {
	const db = getDb(binding);
	const [row] = await db.select({ id: submissions.id, quizId: submissions.quizId, quizTitle: quizzes.title, weekNumber: quizzes.weekNumber,
		studentId: students.id, fullName: students.fullName, email: students.email, school: students.school, className: students.className,
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

// Deleting a response lets the student take that quiz again while it is open.
export async function deleteResponse(binding: D1Database, id: string) {
	const db = getDb(binding);
	const [row] = await db.select({ id: submissions.id, quizId: submissions.quizId }).from(submissions).where(eq(submissions.id, id)).limit(1);
	if (!row) error(404, 'Response not found.');
	await db.batch([
		db.delete(submissionAnswers).where(eq(submissionAnswers.submissionId, id)),
		db.delete(submissions).where(eq(submissions.id, id))
	]);
	return { quizId: row.quizId };
}

// D1 allows at most 100 bound parameters per query, so batches must stay below that for the answers lookup.
export async function getQuizExportRows(binding: D1Database, quizId: string, offset: number, limit = 90) {
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

export async function getResponseExportRows(binding: D1Database, offset: number, limit = 500) {
	return getDb(binding).select({ weekNumber: quizzes.weekNumber, quizTitle: quizzes.title, submittedAt: submissions.submittedAt,
		score: submissions.score, totalQuestions: submissions.totalQuestions, fullName: students.fullName, email: students.email,
		className: students.className, section: students.section, school: students.school, city: students.city })
		.from(submissions).innerJoin(students, eq(submissions.studentId, students.id)).innerJoin(quizzes, eq(submissions.quizId, quizzes.id))
		.orderBy(asc(quizzes.weekNumber), asc(submissions.submittedAt), asc(submissions.id)).limit(limit).offset(offset);
}
