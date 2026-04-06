export const HEADER_LINE_COUNT = 11;
export const CREATED_LINE_INDEX = 7;

export const DEFAULT_HEADER_WIDTH = 80;
export const PYTHON_HEADER_WIDTH = 79;
export const MIN_INNER_WIDTH = 20;

export function getHeaderWidthForLanguage(languageId: string): number {
	return languageId.toLowerCase() === 'python' ? PYTHON_HEADER_WIDTH : DEFAULT_HEADER_WIDTH;
}

export const HEADER_SUFFIXES = {
	title: ':::      ::::::::  ',
	column: '+:+ +:+         +:+    ',
	file: ':+:      :+:    :+:  ',
	by: '+#+  +:+       +#+       ',
	spacer: '+#+#+#+#+#+   +#+          ',
	created: '#+#    #+#            ',
	updated: '###   ########.fr      ',
} as const;
