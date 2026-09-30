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
	schoolAddress: trimmed(300)
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

export const quizInputSchema = z.object({
	id: z.uuid().optional(),
	weekNumber: z.number().int().min(1).max(52),
	title: trimmed(160),
	description: z.string().trim().max(1000),
	startIst: z.string(),
	endIst: z.string(),
	published: z.boolean(),
	questions: z.array(questionInputSchema).min(1).max(100)
});

export const quizFilterSchema = z.object({
	quizId: z.uuid().optional(),
	page: z.number().int().min(1).max(10000).default(1),
	search: z.string().trim().max(120).default('')
});

export type RegistrationInput = z.input<typeof registrationSchema>;
export type QuizInput = z.input<typeof quizInputSchema>;
