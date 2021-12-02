import * as vscode from 'vscode';
import { XMLOutlineProvider } from './xmlprocessor';

export function activate(context: vscode.ExtensionContext) {

	const xmlOutlineProvider = new XMLOutlineProvider(context);
	context.subscriptions.push(vscode.window.registerTreeDataProvider('labsterXMLOutline', xmlOutlineProvider));
	context.subscriptions.push(vscode.commands.registerCommand('labster-xml-outliner.refresh', () => {
		xmlOutlineProvider.refresh();
	}));
}

export function deactivate() {}
