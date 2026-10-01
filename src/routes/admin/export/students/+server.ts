import type { RequestHandler } from '@sveltejs/kit';
import { requireAdmin } from '$lib/server/auth';
import { getStudentExportRows } from '$lib/server/admin';
import { csvResponse } from '$lib/server/csv';
import { formatIst } from '$lib/server/india-time';

export const GET: RequestHandler = async () => {
	const { env } = await requireAdmin();
	const header = ['Full name', 'Email', 'Class', 'Section', 'School', 'City', 'School address', 'Registered at (IST)', 'Quizzes attempted', 'Average score %'];
	return csvResponse('nie-read-india-students.csv', header, async (offset) => {
		const rows = await getStudentExportRows(env.DB, offset);
		return rows.map(({ student, attempts, averagePercent }) => [
			student.fullName, student.email, student.className, student.section, student.school, student.city, student.schoolAddress,
			formatIst(student.createdAt), attempts, averagePercent === null ? '' : Math.round(averagePercent)
		]);
	});
};
