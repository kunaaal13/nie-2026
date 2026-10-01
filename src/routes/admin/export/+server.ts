import { error, type RequestHandler } from '@sveltejs/kit';
import { requireAdmin } from '$lib/server/auth';
import { getQuiz, getQuizExportRows } from '$lib/server/admin';
import { csvResponse } from '$lib/server/csv';
import { formatIst } from '$lib/server/india-time';

export const GET: RequestHandler = async ({ url }) => {
	const { env } = await requireAdmin();
	const quizId = url.searchParams.get('quizId');
	if (!quizId || !/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(quizId)) error(400, 'Choose a quiz to export.');
	const quiz = await getQuiz(env.DB, quizId);
	const header = [
		'Full name', 'Email', 'Class', 'Section', 'School', 'City', 'School address',
		'Score', 'Total questions', 'Score %', 'Submitted at (IST)',
		...quiz.questions.flatMap((question) => [`Q${question.position} answer`, `Q${question.position} correct`])
	];
	return csvResponse(`nie-read-india-week-${quiz.weekNumber}-responses.csv`, header, async (offset) => {
		const batch = await getQuizExportRows(env.DB, quizId, offset);
		const answerMap = new Map<string, Map<string, number>>();
		for (const answer of batch.answers) {
			const byQuestion = answerMap.get(answer.submissionId) ?? new Map<string, number>();
			byQuestion.set(answer.questionId, answer.selectedOption);
			answerMap.set(answer.submissionId, byQuestion);
		}
		return batch.rows.map((row) => {
			const selected = answerMap.get(row.id);
			return [
				row.fullName, row.email, row.className, row.section, row.school, row.city, row.schoolAddress,
				row.score, row.totalQuestions, Math.round((row.score * 100) / row.totalQuestions), formatIst(row.submittedAt),
				...quiz.questions.flatMap((question) => {
					const selectedIndex = selected?.get(question.id);
					return [selectedIndex === undefined ? '' : question.options[selectedIndex], selectedIndex === question.correctOption ? 'Yes' : 'No'];
				})
			];
		});
	});
};
