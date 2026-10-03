import { z } from 'zod';

const trimmed = (max: number) => z.string().trim().min(1).max(max);
const email = z.email().transform((value) => value.trim().toLowerCase());

export const registrationSchema = z.object({
	fullName: trimmed(120),
	email,
	className: trimmed(40),
	section: trimmed(40),
	school: trimmed(180),
	city: trimmed(100),
	schoolAddress: z.string().trim().max(300).default(''),
	mobileNumber: z.string().trim().min(8).max(24),
	heardAbout: trimmed(200)
});

export const quizSubmissionSchema = z.object({
	quizId: z.uuid(),
	email,
	answers: z.array(z.object({
		questionId: z.uuid(),
		selectedOption: z.number().int().min(0).max(5)
	})).min(1).max(100)
});

export const questionInputSchema = z.object({
	prompt: trimmed(500),
	options: z.array(trimmed(250)).min(2).max(6),
	correctOption: z.number().int().min(0).max(5)
}).refine((value) => value.correctOption < value.options.length, {
	message: 'Choose a correct answer within the options.',
	path: ['correctOption']
});

const quizDetailsFields = {
	weekNumber: z.number().int().min(1).max(52),
	title: trimmed(160),
	description: z.string().trim().max(1000),
	startIst: z.string(),
	endIst: z.string(),
	published: z.boolean()
};

export const quizInputSchema = z.object({
	id: z.uuid().optional(),
	...quizDetailsFields,
	questions: z.array(questionInputSchema).min(1).max(100)
});

// Schedule and details only; used for quizzes whose questions are locked by responses.
export const quizDetailsSchema = z.object({ id: z.uuid(), ...quizDetailsFields });

export const quizPublishSchema = z.object({ id: z.uuid(), published: z.boolean() });

const page = z.number().int().min(1).max(10000).default(1);
const search = z.string().trim().max(120).default('');

export const responseFilterSchema = z.object({
	quizId: z.uuid().optional(),
	page,
	search,
	sort: z.enum(['recent', 'oldest', 'score-desc', 'score-asc']).default('recent')
});

export const studentFilterSchema = z.object({
	page,
	search,
	className: z.string().trim().max(40).optional(),
	city: z.string().trim().max(100).optional(),
	participation: z.enum(['all', 'attempted', 'never']).default('all'),
	sort: z.enum(['recent', 'oldest', 'name', 'attempts']).default('recent')
});

export const studentUpdateSchema = registrationSchema.extend({
	id: z.uuid(),
	mobileNumber: z.string().trim().max(24),
	heardAbout: z.string().trim().max(200)
});

export type RegistrationInput = z.input<typeof registrationSchema>;
export type QuizInput = z.input<typeof quizInputSchema>;
