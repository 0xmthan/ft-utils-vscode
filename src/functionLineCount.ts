import * as vscode from 'vscode';
import { isCFile, isFunctionDefinition, stripCommentsAndStrings } from './functionCountStatus';

const NORMINETTE_LINE_LIMIT = 25;

interface FunctionInfo {
	lineCount: number;
	closingLine: number;
}

export class FunctionLineCount implements vscode.Disposable {
	private readonly okType: vscode.TextEditorDecorationType;
	private readonly warnType: vscode.TextEditorDecorationType;
	private readonly subscriptions: vscode.Disposable[];

	constructor() {
		this.okType = vscode.window.createTextEditorDecorationType({
			after: {
				color: new vscode.ThemeColor('editorCodeLens.foreground'),
				fontStyle: 'italic',
				margin: '0 0 0 1em',
			},
		});
		this.warnType = vscode.window.createTextEditorDecorationType({
			after: {
				color: new vscode.ThemeColor('errorForeground'),
				fontStyle: 'italic',
				margin: '0 0 0 1em',
			},
		});
		this.subscriptions = [
			this.okType,
			this.warnType,
			vscode.window.onDidChangeActiveTextEditor(editor => {
				if (editor) { this.refresh(editor); }
			}),
			vscode.workspace.onDidChangeTextDocument(({ document }) => {
				const editor = vscode.window.activeTextEditor;
				if (editor?.document === document) { this.refresh(editor); }
			}),
			vscode.workspace.onDidChangeConfiguration(event => {
				if (event.affectsConfiguration('ft_utils.showFunctionLineCount')) {
					const editor = vscode.window.activeTextEditor;
					if (editor) { this.refresh(editor); }
				}
			}),
		];
		if (vscode.window.activeTextEditor) {
			this.refresh(vscode.window.activeTextEditor);
		}
	}

	dispose() {
		for (const sub of this.subscriptions) { sub.dispose(); }
	}

	private refresh(editor: vscode.TextEditor) {
		const enabled = vscode.workspace.getConfiguration('ft_utils').get<boolean>('showFunctionLineCount', true);
		if (!enabled || !isCFile(editor.document)) {
			editor.setDecorations(this.okType, []);
			editor.setDecorations(this.warnType, []);
			return;
		}

		const functions = parseFunctions(editor.document.getText());
		const ok: vscode.DecorationOptions[] = [];
		const warn: vscode.DecorationOptions[] = [];

		for (const fn of functions) {
			const lineEnd = editor.document.lineAt(fn.closingLine).range.end;
			const range = new vscode.Range(lineEnd, lineEnd);
			const over = fn.lineCount > NORMINETTE_LINE_LIMIT;
			const plural = fn.lineCount === 1 ? 'line' : 'lines';
			const label = over ? `${fn.lineCount} ${plural}  ⚠` : `${fn.lineCount} ${plural}`;
			const hover = new vscode.MarkdownString(
				`**ft_utils** — ${fn.lineCount} / ${NORMINETTE_LINE_LIMIT} ${plural}` +
				(over ? `  ⚠ *over norminette limit*` : '')
			);
			const opts: vscode.DecorationOptions = {
				range,
				hoverMessage: hover,
				renderOptions: { after: { contentText: label } },
			};
			(over ? warn : ok).push(opts);
		}

		editor.setDecorations(this.okType, ok);
		editor.setDecorations(this.warnType, warn);
	}
}

function parseFunctions(text: string): FunctionInfo[] {
	const stripped = stripCommentsAndStrings(text);
	const results: FunctionInfo[] = [];
	let depth = 0;
	let declarationStart = 0;
	let bodyStart = -1;

	for (let i = 0; i < stripped.length; i++) {
		const char = stripped[i];

		if (char === '{') {
			if (depth === 0) {
				const candidate = stripped.slice(declarationStart, i + 1);
				bodyStart = isFunctionDefinition(candidate) ? i + 1 : -1;
			}
			depth++;
			continue;
		}

		if (char === '}') {
			depth = Math.max(0, depth - 1);
			if (depth === 0) {
				if (bodyStart >= 0) {
					results.push({
						lineCount: countNewlines(text, bodyStart, i) - 1,
						closingLine: countNewlines(text, 0, i),
					});
				}
				declarationStart = i + 1;
				bodyStart = -1;
			}
			continue;
		}

		if (char === ';' && depth === 0) {
			declarationStart = i + 1;
		}
	}

	return results;
}

function countNewlines(text: string, from: number, to: number): number {
	let count = 0;
	for (let i = from; i < to; i++) {
		if (text[i] === '\n') { count++; }
	}
	return count;
}
