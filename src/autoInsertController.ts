import * as path from 'node:path';
import * as vscode from 'vscode';
import { getHeaderWidthForLanguage } from './headerConstants';
import { buildHeaderText } from './headerFormat';
import { detectHeader, getHeaderStartLine } from './headerDetection';
import { getDelimitersForDocument } from './commentDelimiters';
import type { HeaderSettings } from './types';
import { formatTimestamp } from './time';
import { StatusNotifier } from './statusNotifier';

const AUTO_INSERT_STATE_KEY = 'ft_utils.autoInsertOnCreate';
const STATUS_LABEL = '42 Auto Header';

export class AutoInsertController implements vscode.Disposable {
	private readonly statusItem: vscode.StatusBarItem;

	constructor(private readonly context: vscode.ExtensionContext, private readonly notifier: StatusNotifier) {
		this.statusItem = vscode.window.createStatusBarItem('42HeaderAutoInsert', vscode.StatusBarAlignment.Right, 100);
		this.statusItem.command = 'ft_utils.toggleAutoInsert';
		this.updateStatusBar();
		this.statusItem.show();
	}

	isEnabled() {
		return this.context.globalState.get<boolean>(AUTO_INSERT_STATE_KEY, false);
	}

	async toggle() {
		const nextState = !this.isEnabled();
		await this.context.globalState.update(AUTO_INSERT_STATE_KEY, nextState);
		this.updateStatusBar();
		this.notifier.show(nextState ? `42 Header auto insert on` : `42 Header auto insert off`);
	}

	async handleFileCreation(uris: readonly vscode.Uri[], settings: HeaderSettings) {
		if (!this.isEnabled()) {
			return;
		}

		for (const uri of uris) {
			await this.insertHeaderIntoFile(uri, settings);
		}
	}

	dispose() {
		this.statusItem.dispose();
	}

	private updateStatusBar() {
		const active = this.isEnabled();
		this.statusItem.text = active ? `$(pass-filled) ${STATUS_LABEL}` : `$(circle-outline) ${STATUS_LABEL}`;
		this.statusItem.tooltip = active
			? `${STATUS_LABEL} for new files is enabled (click to disable).`
			: `${STATUS_LABEL} for new files is disabled (click to enable).`;
	}

	private async insertHeaderIntoFile(uri: vscode.Uri, settings: HeaderSettings) {
		try {
			const document = await vscode.workspace.openTextDocument(uri);
			const AUTO_INSERT_LANGUAGES = new Set(['c', 'cpp', 'python']);
			if (!AUTO_INSERT_LANGUAGES.has(document.languageId) || detectHeader(document)) {
				return;
			}

			const delimiters = getDelimitersForDocument(document);
			const now = formatTimestamp(new Date());
			const headerWidth = getHeaderWidthForLanguage(document.languageId);
			const headerText = buildHeaderText(path.basename(document.fileName), settings, now, now, delimiters, settings.login, headerWidth);
			const edit = new vscode.WorkspaceEdit();
			const trailing = document.getText().length > 0 ? '\n\n' : '\n';
			const startLine = getHeaderStartLine(document);
			edit.insert(uri, new vscode.Position(startLine, 0), headerText + trailing);
			const applied = await vscode.workspace.applyEdit(edit);
			if (applied) {
				this.notifier.show(`${STATUS_LABEL} inserted in ${path.basename(document.fileName)}`);
			}
		} catch (error) {
			console.error('Failed to auto-insert 42 header:', error);
		}
	}
}
