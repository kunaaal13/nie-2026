function csvCell(value: unknown): string {
	let text = String(value ?? '');
	// Keep spreadsheet programs from evaluating student-supplied values as formulas.
	if (/^\s*[=+\-@]/.test(text)) text = `'${text}`;
	return `"${text.replaceAll('"', '""')}"`;
}

export function csvRow(values: unknown[]): string {
	return values.map(csvCell).join(',') + '\r\n';
}

// Streams a CSV in batches: `next(offset)` returns the rows for that offset, or an empty array when done.
export function csvResponse(filename: string, header: unknown[], next: (offset: number) => Promise<unknown[][]>) {
	const encoder = new TextEncoder();
	let offset = 0;
	const stream = new ReadableStream<Uint8Array>({
		async start(controller) {
			controller.enqueue(encoder.encode('﻿' + csvRow(header)));
		},
		async pull(controller) {
			try {
				const rows = await next(offset);
				if (rows.length === 0) { controller.close(); return; }
				controller.enqueue(encoder.encode(rows.map(csvRow).join('')));
				offset += rows.length;
			} catch (cause) {
				controller.error(cause);
			}
		}
	});
	return new Response(stream, {
		headers: {
			'content-type': 'text/csv; charset=utf-8',
			'content-disposition': `attachment; filename="${filename}"`,
			'cache-control': 'private, no-store',
			'x-content-type-options': 'nosniff'
		}
	});
}
