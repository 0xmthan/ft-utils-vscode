import {
	HEADER_SUFFIXES,
	MIN_INNER_WIDTH,
} from './headerConstants';
import type { CommentDelimiters, HeaderSettings } from './types';

export function buildHeaderText(
	fileName: string,
	settings: HeaderSettings,
	createdAt: string,
	updatedAt: string,
	delimiters: CommentDelimiters,
	createdBylogin = settings.login,
	totalWidth: number,
): string {
	return buildHeaderLines(fileName, settings, createdAt, updatedAt, delimiters, createdBylogin, totalWidth).join('\n');
}

export function buildHeaderLines(
	fileName: string,
	settings: HeaderSettings,
	createdAt: string,
	updatedAt: string,
	delimiters: CommentDelimiters,
	createdBylogin = settings.login,
	totalWidth: number,
): string[] {
	const innerWidth = computeInnerWidth(totalWidth, delimiters);
	const identity = `${settings.login} <${settings.email}>`;

	return [
		formatBorder(innerWidth, delimiters),
		formatRightAligned(HEADER_SUFFIXES.first, innerWidth, delimiters),
		formatRightAligned(HEADER_SUFFIXES.title, innerWidth, delimiters),
		formatLine(`${fileName}`, HEADER_SUFFIXES.file, innerWidth, delimiters),
		formatRightAligned(HEADER_SUFFIXES.column, innerWidth, delimiters),
		formatLine(`By: ${identity}`, HEADER_SUFFIXES.by, innerWidth, delimiters),
		formatRightAligned(HEADER_SUFFIXES.spacer, innerWidth, delimiters),
		formatLine(`Created: ${createdAt} by ${createdBylogin}`, HEADER_SUFFIXES.created, innerWidth, delimiters),
		formatLine(`Updated: ${updatedAt} by ${settings.login}`, HEADER_SUFFIXES.updated, innerWidth, delimiters),
		formatRightAligned(HEADER_SUFFIXES.last, innerWidth, delimiters),
		formatBorder(innerWidth, delimiters),
	];
}

export function computeInnerWidth(totalWidth: number, delimiters: CommentDelimiters): number {
	const available = totalWidth - delimiters.start.length - delimiters.end.length;
	return Math.max(MIN_INNER_WIDTH, available);
}

function formatLine(left: string, right: string, innerWidth: number, delimiters: CommentDelimiters): string {
	const sanitizedRight = right.slice(0, Math.max(0, innerWidth - 1));
	const maxLeft = Math.max(0, innerWidth - sanitizedRight.length);
	const sanitizedLeft = truncate(left, maxLeft);
	const padding = Math.max(0, innerWidth - sanitizedLeft.length - sanitizedRight.length);
	return `${delimiters.start}${sanitizedLeft}${' '.repeat(padding)}${sanitizedRight}${delimiters.end}`;
}

function formatRightAligned(text: string, innerWidth: number, delimiters: CommentDelimiters): string {
	return formatLine('', text, innerWidth, delimiters);
}

function formatBorder(innerWidth: number, delimiters: CommentDelimiters): string {
	return `${delimiters.start}${'*'.repeat(innerWidth)}${delimiters.end}`;
}

/*function formatEmpty(innerWidth: number, delimiters: CommentDelimiters): string {
	return `${delimiters.start}${' '.repeat(innerWidth)}${delimiters.end}`;
}*/

function truncate(value: string, maxLength: number): string {
	if (value.length <= maxLength) {
		return value;
	}
	return value.slice(0, Math.max(0, maxLength));
}
