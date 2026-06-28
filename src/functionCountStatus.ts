import * as path from 'node:path';
import * as vscode from 'vscode';

const FUNCTION_WARNING_THRESHOLD = 5;
const CONTROL_KEYWORDS = new Set(['if', 'for', 'while', 'switch']);

export class FunctionCountStatus implements vscode.Disposable {
	private readonly statusBarItem: vscode.StatusBarItem;
	private readonly subscriptions: vscode.Disposable[];

	constructor(command: string) {
		this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 98);
		this.statusBarItem.command = command;
		this.subscriptions = [
			this.statusBarItem,
			vscode.window.onDidChangeActiveTextEditor(() => this.refresh()),
			vscode.workspace.onDidChangeTextDocument(event => {
				const activeDocument = vscode.window.activeTextEditor?.document;
				if (activeDocument && event.document === activeDocument) {
					this.refresh();
				}
			}),
		];
		this.refresh();
	}

	dispose() {
		for (const subscription of this.subscriptions) {
			subscription.dispose();
		}
	}

	private refresh() {
		const document = vscode.window.activeTextEditor?.document;
		if (!document || !isCFile(document)) {
			this.statusBarItem.hide();
			return;
		}

		const count = countFunctions(document.getText());
		const warning = count > FUNCTION_WARNING_THRESHOLD ? ' $(warning)' : '';
		this.statusBarItem.text = `Functions: ${count}${warning}`;
		this.statusBarItem.tooltip = `Detected C functions: ${count}`;
		this.statusBarItem.show();
	}
}

export function isCFile(document: vscode.TextDocument): boolean {
	if (document.languageId === 'c') {
		return true;
	}
	return path.extname(document.fileName).toLowerCase() === '.c';
}

function countFunctions(content: string): number {
	const text = stripCommentsAndStrings(content);
	let count = 0;
	let depth = 0;
	let declarationStart = 0;

	for (let index = 0; index < text.length; index += 1) {
		const char = text[index];

		if (char === '{') {
			if (depth === 0) {
				const candidate = text.slice(declarationStart, index + 1);
				if (isFunctionDefinition(candidate)) {
					count += 1;
				}
				declarationStart = index + 1;
			}
			depth += 1;
			continue;
		}

		if (char === '}') {
			depth = Math.max(0, depth - 1);
			if (depth === 0) {
				declarationStart = index + 1;
			}
			continue;
		}

		if (char === ';' && depth === 0) {
			declarationStart = index + 1;
		}
	}

	return count;
}

export function isFunctionDefinition(candidate: string): boolean {
	const declaration = candidate.trim();
	if (!declaration.endsWith('{') || declaration.startsWith('typedef')) {
		return false;
	}

	const withoutBrace = declaration.slice(0, -1).trim();
	if (!withoutBrace.endsWith(')')) {
		return false;
	}

	const closeParenIndex = withoutBrace.length - 1;
	const openParenIndex = findMatchingOpenParen(withoutBrace, closeParenIndex);
	if (openParenIndex < 0) {
		return false;
	}

	const nameEnd = skipWhitespaceBackward(withoutBrace, openParenIndex - 1);
	if (nameEnd < 0) {
		return false;
	}

	let nameStart = nameEnd;
	while (nameStart >= 0 && /[A-Za-z0-9_]/.test(withoutBrace[nameStart])) {
		nameStart -= 1;
	}

	const functionName = withoutBrace.slice(nameStart + 1, nameEnd + 1);
	if (!functionName || CONTROL_KEYWORDS.has(functionName)) {
		return false;
	}

	const prefix = withoutBrace.slice(0, nameStart + 1).trim();
	if (!prefix || /[=]/.test(prefix)) {
		return false;
	}

	return true;
}

function findMatchingOpenParen(text: string, closeParenIndex: number): number {
	let depth = 0;
	for (let index = closeParenIndex; index >= 0; index -= 1) {
		const char = text[index];
		if (char === ')') {
			depth += 1;
			continue;
		}
		if (char === '(') {
			depth -= 1;
			if (depth === 0) {
				return index;
			}
		}
	}
	return -1;
}

function skipWhitespaceBackward(text: string, index: number): number {
	let cursor = index;
	while (cursor >= 0 && /\s/.test(text[cursor])) {
		cursor -= 1;
	}
	return cursor;
}

export function stripCommentsAndStrings(content: string): string {
	enum State {
		Code,
		LineComment,
		BlockComment,
		String,
		Char,
	}

	let result = '';
	let state = State.Code;
	let escaped = false;

	for (let index = 0; index < content.length; index += 1) {
		const char = content[index];
		const nextChar = content[index + 1];

		switch (state) {
			case State.Code:
				if (char === '/' && nextChar === '/') {
					state = State.LineComment;
					result += '  ';
					index += 1;
					break;
				}
				if (char === '/' && nextChar === '*') {
					state = State.BlockComment;
					result += '  ';
					index += 1;
					break;
				}
				if (char === '"') {
					state = State.String;
					escaped = false;
					result += ' ';
					break;
				}
				if (char === '\'') {
					state = State.Char;
					escaped = false;
					result += ' ';
					break;
				}
				result += char;
				break;
			case State.LineComment:
				if (char === '\n') {
					state = State.Code;
					result += '\n';
				} else {
					result += ' ';
				}
				break;
			case State.BlockComment:
				if (char === '*' && nextChar === '/') {
					state = State.Code;
					result += '  ';
					index += 1;
				} else if (char === '\n') {
					result += '\n';
				} else {
					result += ' ';
				}
				break;
			case State.String:
				if (!escaped && char === '"') {
					state = State.Code;
				}
				escaped = !escaped && char === '\\';
				result += char === '\n' ? '\n' : ' ';
				break;
			case State.Char:
				if (!escaped && char === '\'') {
					state = State.Code;
				}
				escaped = !escaped && char === '\\';
				result += char === '\n' ? '\n' : ' ';
				break;
		}
	}

	return result;
}
