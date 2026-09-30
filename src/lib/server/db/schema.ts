import { integer, sqliteTable, text, uniqueIndex, index } from 'drizzle-orm/sqlite-core';

// Better Auth's core tables use its default table and column names.
export const authUser = sqliteTable('user', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: integer('emailVerified', { mode: 'boolean' }).notNull(),
	image: text('image'),
	createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull(),
	updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).notNull()
});

export const authSession = sqliteTable('session', {
	id: text('id').primaryKey(),
	expiresAt: integer('expiresAt', { mode: 'timestamp_ms' }).notNull(),
	token: text('token').notNull().unique(),
	createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull(),
	updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).notNull(),
	ipAddress: text('ipAddress'),
	userAgent: text('userAgent'),
	userId: text('userId').notNull().references(() => authUser.id, { onDelete: 'cascade' })
}, (table) => [index('session_user_id_idx').on(table.userId)]);

export const authAccount = sqliteTable('account', {
	id: text('id').primaryKey(),
	accountId: text('accountId').notNull(),
	providerId: text('providerId').notNull(),
	userId: text('userId').notNull().references(() => authUser.id, { onDelete: 'cascade' }),
	accessToken: text('accessToken'),
	refreshToken: text('refreshToken'),
	idToken: text('idToken'),
	accessTokenExpiresAt: integer('accessTokenExpiresAt', { mode: 'timestamp_ms' }),
	refreshTokenExpiresAt: integer('refreshTokenExpiresAt', { mode: 'timestamp_ms' }),
	scope: text('scope'),
	password: text('password'),
	createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull(),
	updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).notNull()
}, (table) => [index('account_user_id_idx').on(table.userId)]);

export const authVerification = sqliteTable('verification', {
	id: text('id').primaryKey(),
	identifier: text('identifier').notNull(),
	value: text('value').notNull(),
	expiresAt: integer('expiresAt', { mode: 'timestamp_ms' }).notNull(),
	createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull(),
	updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).notNull()
}, (table) => [index('verification_identifier_idx').on(table.identifier)]);

export const adminUsers = sqliteTable('admin_users', {
	email: text('email').primaryKey(),
	createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull()
});

export const students = sqliteTable('students', {
	id: text('id').primaryKey(),
	email: text('email').notNull().unique(),
	fullName: text('full_name').notNull(),
	className: text('class_name').notNull(),
	section: text('section').notNull(),
	school: text('school').notNull(),
	city: text('city').notNull(),
	schoolAddress: text('school_address').notNull(),
	createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull()
});

export const quizzes = sqliteTable('quizzes', {
	id: text('id').primaryKey(),
	weekNumber: integer('week_number').notNull().unique(),
	title: text('title').notNull(),
	description: text('description').notNull().default(''),
	startAt: integer('start_at', { mode: 'timestamp_ms' }).notNull(),
	endAt: integer('end_at', { mode: 'timestamp_ms' }).notNull(),
	published: integer('published', { mode: 'boolean' }).notNull().default(false),
	createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull()
}, (table) => [index('quizzes_window_idx').on(table.published, table.startAt, table.endAt)]);

export const questions = sqliteTable('questions', {
	id: text('id').primaryKey(),
	quizId: text('quiz_id').notNull().references(() => quizzes.id, { onDelete: 'cascade' }),
	position: integer('position').notNull(),
	prompt: text('prompt').notNull(),
	options: text('options', { mode: 'json' }).$type<string[]>().notNull(),
	correctOption: integer('correct_option').notNull(),
	createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull()
}, (table) => [
	uniqueIndex('questions_quiz_position_unique').on(table.quizId, table.position),
	index('questions_quiz_idx').on(table.quizId)
]);

export const submissions = sqliteTable('submissions', {
	id: text('id').primaryKey(),
	quizId: text('quiz_id').notNull().references(() => quizzes.id, { onDelete: 'restrict' }),
	studentId: text('student_id').notNull().references(() => students.id, { onDelete: 'restrict' }),
	score: integer('score').notNull(),
	totalQuestions: integer('total_questions').notNull(),
	submittedAt: integer('submitted_at', { mode: 'timestamp_ms' }).notNull()
}, (table) => [
	uniqueIndex('submissions_quiz_student_unique').on(table.quizId, table.studentId),
	index('submissions_student_idx').on(table.studentId),
	index('submissions_quiz_idx').on(table.quizId)
]);

export const submissionAnswers = sqliteTable('submission_answers', {
	id: text('id').primaryKey(),
	submissionId: text('submission_id').notNull().references(() => submissions.id, { onDelete: 'cascade' }),
	questionId: text('question_id').notNull().references(() => questions.id, { onDelete: 'restrict' }),
	selectedOption: integer('selected_option').notNull(),
	isCorrect: integer('is_correct', { mode: 'boolean' }).notNull()
}, (table) => [
	uniqueIndex('submission_answers_submission_question_unique').on(table.submissionId, table.questionId),
	index('submission_answers_question_idx').on(table.questionId)
]);
