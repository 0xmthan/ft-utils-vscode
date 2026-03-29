import * as vscode from 'vscode';
import type { HeaderSettings } from './types';

const OPEN_SETTINGS_LABEL = 'Open Settings';
const MISSING_SETTINGS_MESSAGE = 'Set "ft_utils > Email" in Settings. "Login" is optional and defaults to the part before "@".';
const MISSING_SETTINGS_WARNING_COOLDOWN_MS = 15000;

let lastMissingSettingsWarningAt = 0;

export function readSettings(): HeaderSettings {
	const configuration = vscode.workspace.getConfiguration('ft_utils');
	const email = configuration.get<string>('email', '').trim();
	const configuredLogin = configuration.get<string>('login', '').trim();
	return {
		login: configuredLogin || deriveLoginFromEmail(email),
		email,
	};
}

export async function promptForSettings() {
	const choice = await vscode.window.showErrorMessage(MISSING_SETTINGS_MESSAGE, OPEN_SETTINGS_LABEL);

	if (choice === OPEN_SETTINGS_LABEL) {
		void vscode.commands.executeCommand('workbench.action.openSettings', '@ext:2mdtln.ft-header');
	}
}

export function warnMissingSettings() {
	const now = Date.now();
	if (now - lastMissingSettingsWarningAt < MISSING_SETTINGS_WARNING_COOLDOWN_MS) {
		return;
	}
	lastMissingSettingsWarningAt = now;

	void vscode.window.showWarningMessage(MISSING_SETTINGS_MESSAGE, OPEN_SETTINGS_LABEL).then(choice => {
		if (choice === OPEN_SETTINGS_LABEL) {
			void vscode.commands.executeCommand('workbench.action.openSettings', '@ext:2mdtln.ft-header');
		}
	});
}

function deriveLoginFromEmail(email: string): string {
	const atIndex = email.indexOf('@');
	if (atIndex <= 0) {
		return '';
	}
	return email.slice(0, atIndex).trim();
}
