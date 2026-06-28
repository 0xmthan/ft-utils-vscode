import * as path from 'node:path';
import * as vscode from 'vscode';
import { AutoInsertController } from './autoInsertController';
import { getHeaderWidthForLanguage, HEADER_LINE_COUNT } from './headerConstants';
import { buildHeaderText } from './headerFormat';
import { detectHeader, createHeaderEdit, getHeaderStartLine } from './headerDetection';
import { getDelimitersForDocument } from './commentDelimiters';
import { promptForSettings, readSettings, warnMissingSettings } from './settings';
import { formatTimestamp } from './time';
import type { HeaderSettings } from './types';
import { StatusNotifier } from './statusNotifier';
import { FunctionCountStatus } from './functionCountStatus';
import { FunctionLineCount } from './functionLineCount';

const UPDATE_ON_SAVE_STATE_KEY = 'ft_utils.updateHeaderOnSave';

export function activate(context: vscode.ExtensionContext) {
	const notifier = new StatusNotifier();
	const starPromptCommand = vscode.commands.registerCommand('ft_utils.showStarPrompt', async () => {
		const choice = await vscode.window.showInformationMessage(
			'If you find this extension helpful, consider giving it a ⭐️ on GitHub :)',
			'Open Repository',
		);
		if (choice === 'Open Repository') {
			await vscode.env.openExternal(vscode.Uri.parse('https://github.com/0xmthan/ft-utils-vscode'));
		}
	});
	const functionCountStatus = new FunctionCountStatus('ft_utils.showStarPrompt');
	const functionLineCount = new FunctionLineCount();
	const autoInsertController = new AutoInsertController(context, notifier);

	const insertCommand = vscode.commands.registerCommand('ft_utils.insertHeader', async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage('Open a file before inserting a 42 header.');
			return;
		}

		const settings = readSettings();
		if (!settings.login || !settings.email) {
			await promptForSettings();
			return;
		}

		const result = await applyHeader(editor, settings);
		notifier.show(result === 'updated' ? '42 header refreshed' : '42 header inserted');
	});

	const saveSubscription = vscode.workspace.onWillSaveTextDocument(event => {
		if (!isHeaderUpdateOnSaveEnabled(context)) {
			return;
		}

		const settings = readSettings();
		if (!settings.login || !settings.email) {
			warnMissingSettings();
			return;
		}

		event.waitUntil((async () => {
			const edit = createHeaderEdit(event.document, settings);
			if (!edit) {
				return;
			}
			return [edit];
		})());
	});

	const toggleAutoInsert = vscode.commands.registerCommand('ft_utils.toggleAutoInsert', () => autoInsertController.toggle());
	const toggleUpdateOnSave = vscode.commands.registerCommand('ft_utils.toggleUpdateOnSave', async () => {
		const nextState = !isHeaderUpdateOnSaveEnabled(context);
		await context.globalState.update(UPDATE_ON_SAVE_STATE_KEY, nextState);
		notifier.show(nextState ? '42 header update on save on' : '42 header update on save off');
	});

	const fileCreateSubscription = vscode.workspace.onDidCreateFiles(async event => {
		const settings = readSettings();
		if (!settings.login || !settings.email) {
			return;
		}
		await autoInsertController.handleFileCreation(event.files, settings);
	});

	context.subscriptions.push(
		insertCommand,
		starPromptCommand,
		saveSubscription,
		toggleAutoInsert,
		toggleUpdateOnSave,
		fileCreateSubscription,
		autoInsertController,
		notifier,
		functionCountStatus,
		functionLineCount,
	);
}

export function deactivate() {}

function isHeaderUpdateOnSaveEnabled(context: vscode.ExtensionContext): boolean {
	return context.globalState.get<boolean>(UPDATE_ON_SAVE_STATE_KEY, true);
}

type HeaderApplyResult = 'inserted' | 'updated';

async function applyHeader(editor: vscode.TextEditor, settings: HeaderSettings): Promise<HeaderApplyResult> {
	const document = editor.document;
	const fileName = path.basename(document.fileName);
	const detection = detectHeader(document);
	const delimiters = detection?.delimiters ?? getDelimitersForDocument(document);
	const result: HeaderApplyResult = detection ? 'updated' : 'inserted';

	const now = formatTimestamp(new Date());
	const createdAt = detection?.createdAt ?? now;
	const createdBy = detection?.createdBy ?? settings.login;
	const needsSeparatorLine = detection ? hasTextDirectlyBelowHeader(document, detection.startLine) : false;
	const separator = needsSeparatorLine ? '\n' : '';
	const headerWidth = getHeaderWidthForLanguage(document.languageId);
	const headerText = buildHeaderText(fileName, settings, createdAt, now, delimiters, createdBy, headerWidth) + separator;

	await editor.edit(editBuilder => {
		if (detection) {
			editBuilder.replace(detection.range, headerText);
		} else {
			const hasContent = document.getText().length > 0;
			const trailing = hasContent ? '\n\n' : '\n';
			const startLine = getHeaderStartLine(document);
			editBuilder.insert(new vscode.Position(startLine, 0), headerText + trailing);
		}
	});

	return result;
}

function hasTextDirectlyBelowHeader(document: vscode.TextDocument, startLine: number): boolean {
	const lineBelowHeader = startLine + HEADER_LINE_COUNT;
	if (document.lineCount <= lineBelowHeader) {
		return false;
	}
	return document.lineAt(lineBelowHeader).text.trim().length > 0;
}
