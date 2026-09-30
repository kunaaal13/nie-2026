import { error, type RequestHandler } from '@sveltejs/kit';
import { requireAdmin } from '$lib/server/auth';
import { getQuiz, getQuizExportRows } from '$lib/server/admin';
import { formatIst } from '$lib/server/india-time';

function csvCell(value: unknown): string {
	let text = String(value ?? '');
	// Keep spreadsheet programs from evaluating student-supplied values as formulas.
	if (/^\s*[=+\-@]/.test(text)) text = `'${text}`;
	return `"${text.replaceAll('"', '""')}"`;
}

function csvRow(values: unknown[]): string {
	return values.map(csvCell).join(',') + '\r\n';
}

export const GET: RequestHandler = async ({ url }) => {
	const { env } = await requireAdmin();
	const quizId = url.searchParams.get('quizId');
	if (!quizId || !/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(quizId)) error(400, 'Choose a quiz to export.');
	const quiz = await getQuiz(env.DB, quizId);
	const encoder = new TextEncoder();
	let offset = 0;
	const stream = new ReadableStream<Uint8Array>({
		async pull(controller) {
			try {
				if (offset === 0) controller.enqueue(encoder.encode(csvRow([
					'Full name', 'Email', 'Class', 'Section', 'School', 'City', 'School address',
					'Score', 'Total questions', 'Submitted at (IST)',
					...quiz.questions.flatMap((question) => [`Q${question.position} answer`, `Q${question.position} correct`])
				])));
				const batch = await getQuizExportRows(env.DB, quizId, offset);
				if (batch.rows.length === 0) { controller.close(); return; }
				const answerMap = new Map<string, Map<string, number>>();
				for (const answer of batch.answers) {
					const byQuestion = answerMap.get(answer.submissionId) ?? new Map<string, number>();
					byQuestion.set(answer.questionId, answer.selectedOption);
					answerMap.set(answer.submissionId, byQuestion);
				}
				for (const row of batch.rows) {
					const selected = answerMap.get(row.id);
					controller.enqueue(encoder.encode(csvRow([
						row.fullName, row.email, row.className, row.section, row.school, row.city, row.schoolAddress,
						row.score, row.totalQuestions, formatIst(row.submittedAt),
						...quiz.questions.flatMap((question) => {
							const selectedIndex = selected?.get(question.id);
							return [selectedIndex === undefined ? '' : question.options[selectedIndex], selectedIndex === question.correctOption ? 'Yes' : 'No'];
						})
					])));
				}
				offset += batch.rows.length;
			} catch (cause) {
				controller.error(cause);
			}
		}
	});
	return new Response(stream, {
		headers: {
			'content-type': 'text/csv; charset=utf-8',
			'content-disposition': `attachment; filename="nie-read-india-week-${quiz.weekNumber}-responses.csv"`,
			'cache-control': 'private, no-store',
			'x-content-type-options': 'nosniff'
		}
	});
};
