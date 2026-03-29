import {
	HEADER_SUFFIXES,
	LONG_EMAIL_THRESHOLD,
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
	const isCompact = settings.email.length > LONG_EMAIL_THRESHOLD;
	const leftPadding = isCompact ? ' ' : '  ';
	const suffixes = isCompact ? shiftSuffixesRight() : HEADER_SUFFIXES;

	return [
		formatBorder(innerWidth, delimiters),
		formatEmpty(innerWidth, delimiters),
		formatRightAligned(suffixes.title, innerWidth, delimiters),
		formatLine(`${leftPadding}${fileName}`, suffixes.file, innerWidth, delimiters),
		formatRightAligned(suffixes.column, innerWidth, delimiters),
		formatLine(`${leftPadding}By: ${identity}`, suffixes.by, innerWidth, delimiters),
		formatRightAligned(suffixes.spacer, innerWidth, delimiters),
		formatLine(`${leftPadding}Created: ${createdAt} by ${createdBylogin}`, suffixes.created, innerWidth, delimiters),
		formatLine(`${leftPadding}Updated: ${updatedAt} by ${settings.login}`, suffixes.updated, innerWidth, delimiters),
		formatEmpty(innerWidth, delimiters),
		formatBorder(innerWidth, delimiters),
	];
}

export function computeInnerWidth(totalWidth: number, delimiters: CommentDelimiters): number {
	const available = totalWidth - delimiters.start.length - delimiters.end.length;
	return Math.max(MIN_INNER_WIDTH, available);
}

function formatLine(
	left: string,
	right: string,
	innerWidth: number,
	delimiters: CommentDelimiters,
): string {
	const sanitizedRight = right.slice(0, Math.max(0, innerWidth - 1));
	const fittedLeft = truncate(left, Math.max(0, innerWidth - sanitizedRight.length));
	const padding = Math.max(0, innerWidth - fittedLeft.length - sanitizedRight.length);
	return `${delimiters.start}${fittedLeft}${' '.repeat(padding)}${sanitizedRight}${delimiters.end}`;
}

function formatRightAligned(text: string, innerWidth: number, delimiters: CommentDelimiters): string {
	return formatLine('', text, innerWidth, delimiters);
}

function formatBorder(innerWidth: number, delimiters: CommentDelimiters): string {
	return `${delimiters.start}${'*'.repeat(innerWidth)}${delimiters.end}`;
}

function formatEmpty(innerWidth: number, delimiters: CommentDelimiters): string {
	return `${delimiters.start}${' '.repeat(innerWidth)}${delimiters.end}`;
}

function truncate(value: string, maxLength: number): string {
	if (value.length <= maxLength) {
		return value;
	}
	return value.slice(0, Math.max(0, maxLength));
}

function shiftSuffixesRight() {
	return {
		title: shiftTextRight(HEADER_SUFFIXES.title),
		column: shiftTextRight(HEADER_SUFFIXES.column),
		file: shiftTextRight(HEADER_SUFFIXES.file),
		by: shiftTextRight(HEADER_SUFFIXES.by),
		spacer: shiftTextRight(HEADER_SUFFIXES.spacer),
		created: shiftTextRight(HEADER_SUFFIXES.created),
		updated: shiftTextRight(HEADER_SUFFIXES.updated),
	};
}

function shiftTextRight(value: string): string {
	if (!value) {
		return value;
	}
	return ` ${value.slice(0, -1)}`;
}
