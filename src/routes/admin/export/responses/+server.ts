import type { RequestHandler } from '@sveltejs/kit';
import { requireAdmin } from '$lib/server/auth';
import { getResponseExportRows } from '$lib/server/admin';
import { csvResponse } from '$lib/server/csv';
import { formatIst } from '$lib/server/india-time';

export const GET: RequestHandler = async () => {
	const { env } = await requireAdmin();
	const header = ['Week', 'Quiz', 'Full name', 'Email', 'Class', 'Section', 'School', 'City', 'Score', 'Total questions', 'Score %', 'Submitted at (IST)'];
	return csvResponse('nie-read-india-all-responses.csv', header, async (offset) => {
		const rows = await getResponseExportRows(env.DB, offset);
		return rows.map((row) => [
			row.weekNumber, row.quizTitle, row.fullName, row.email, row.className, row.section, row.school, row.city,
			row.score, row.totalQuestions, Math.round((row.score * 100) / row.totalQuestions), formatIst(row.submittedAt)
		]);
	});
};
