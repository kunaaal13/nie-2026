import { describe, expect, it } from 'vitest';
import { quizDraftKey, restoreQuizDraft } from './quiz-draft';

const questions = [
	{ id: 'first', options: ['A', 'B'] },
	{ id: 'second', options: ['C', 'D', 'E'] }
];

describe('quiz drafts', () => {
	it('keeps drafts separate by quiz id', () => {
		expect(quizDraftKey('quiz-a')).not.toBe(quizDraftKey('quiz-b'));
		expect(restoreQuizDraft(JSON.stringify({ version: 1, quizId: 'quiz-a', email: 'a@b.com', step: 1, answers: { first: 1 } }), 'quiz-b', questions)).toBeNull();
	});

	it('restores the step and only answers valid for current questions', () => {
		expect(restoreQuizDraft(JSON.stringify({ version: 1, quizId: 'quiz-a', email: 'a@b.com', step: 99, answers: { first: 1, second: 9, removed: 0 } }), 'quiz-a', questions)).toEqual({
			version: 1, quizId: 'quiz-a', email: 'a@b.com', step: 3, answers: { first: 1 }
		});
	});

	it('ignores malformed storage', () => {
		expect(restoreQuizDraft('{', 'quiz-a', questions)).toBeNull();
	});
});
