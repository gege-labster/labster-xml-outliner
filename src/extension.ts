import * as vscode from 'vscode';
import { XMLOutlineProvider } from './xmlprocessor';

export function activate(context: vscode.ExtensionContext) {

	const xmlOutlineProvider = new XMLOutlineProvider(context);

	console.log('Congratulations, your extension "labster-xml-outliner" is now active!');
	context.subscriptions.push(vscode.commands.registerCommand('labster-xml-outliner.helloWorld', () => {
		vscode.window.showInformationMessage('Hello, beautiful developers!!! Hope you have a good day.');
	}));
	context.subscriptions.push(vscode.window.registerTreeDataProvider('labsterXMLOutline', xmlOutlineProvider));
	context.subscriptions.push(vscode.commands.registerCommand('labster-xml-outliner.refresh', () => {
		xmlOutlineProvider.refresh();
	}));
}

export function deactivate() {}
