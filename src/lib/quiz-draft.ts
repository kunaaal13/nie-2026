export type DraftQuestion = { id: string; options: string[] };

export type QuizDraft = {
	version: 1;
	quizId: string;
	email: string;
	step: number;
	answers: Record<string, number>;
};

export function quizDraftKey(quizId: string) {
	return `nie-quiz-draft:v1:${quizId}`;
}

export function restoreQuizDraft(raw: string | null, quizId: string, questions: DraftQuestion[]): QuizDraft | null {
	if (!raw) return null;
	try {
		const value: unknown = JSON.parse(raw);
		if (!value || typeof value !== 'object') return null;
		const draft = value as Record<string, unknown>;
		if (draft.version !== 1 || draft.quizId !== quizId) return null;
		const possibleAnswers = draft.answers && typeof draft.answers === 'object'
			? draft.answers as Record<string, unknown> : {};
		const answers: Record<string, number> = {};
		for (const question of questions) {
			const selected = possibleAnswers[question.id];
			if (typeof selected === 'number' && Number.isInteger(selected) && selected >= 0 && selected < question.options.length) {
				answers[question.id] = selected;
			}
		}
		const step = typeof draft.step === 'number' && Number.isInteger(draft.step)
			? Math.max(0, Math.min(questions.length + 1, draft.step)) : 0;
		return {
			version: 1,
			quizId,
			email: typeof draft.email === 'string' ? draft.email.slice(0, 320) : '',
			step,
			answers
		};
	} catch {
		return null;
	}
}
