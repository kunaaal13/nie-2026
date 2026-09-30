import { command } from '$app/server';
import { requireEnv } from '$lib/server/auth';
import { registerStudent as register, submitQuiz as submit } from '$lib/server/quiz';
import { quizSubmissionSchema, registrationSchema } from '$lib/validation';

export const registerStudent = command(registrationSchema, async (input) => {
	return register(requireEnv().DB, input);
});

export const submitQuiz = command(quizSubmissionSchema, async (input) => {
	return submit(requireEnv().DB, input);
});
