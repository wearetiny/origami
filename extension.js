const vscode = require('vscode');

function activate(context) {
	let originalText = null;

	let disposable = vscode.commands.registerCommand('extension.toggleFormatCSS', function () {
		const editor = vscode.window.activeTextEditor;
		if (!editor) return;

		const settings = vscode.workspace.getConfiguration('myExtension');
		const unfoldMethod = settings.get('unfoldMethod');
		const document = editor.document;
		const fullText = document.getText();
		const entireRange = new vscode.Range(
			document.positionAt(0),
			document.positionAt(fullText.length)
		);

		const isSingleLine = fullText.includes('{') && !fullText.includes('\n');

		if (isSingleLine) {
			let unfoldedText;
			if (unfoldMethod === 'lastKnown' && originalText) {
				unfoldedText = originalText;
			} else if (unfoldMethod === 'prettier') {
				// Trigger Prettier or other formatter
				vscode.commands.executeCommand('editor.action.formatDocument');
				return;
			} else {
				// Apply default unfolding logic
				unfoldedText = defaultUnfoldLogic(fullText);
			}

			editor.edit(editBuilder => {
				editBuilder.replace(entireRange, unfoldedText);
			});

		} else {
			originalText = fullText;
			const foldedText = foldCSS(fullText);
			editor.edit(editBuilder => {
				editBuilder.replace(entireRange, foldedText);
			});
		}
	});

	context.subscriptions.push(disposable);
}

function foldCSS(text) {
	// Handle first comment: Move to new line
	let firstCommentHandled = false;
	text = text.replace(/\/\*.*?\*\//gs, (match) => {
		if (!firstCommentHandled) {
			firstCommentHandled = true;
			return `\n${match}\n`;
		}
		return `\n\n${match}\n`;
	});

	// Handle primary parent and nested items formatting
	text = text.replace(/([^{]){\s*/g, "$1{\n\t")
		.replace(/}\s*([^}])/g, "}\n\n$1")
		.replace(/;\s*/g, "; ")
		.replace(/\s*}\s*/g, "}\n")
		.replace(/\n\s*\n/g, '\n'); // Remove extra newlines

	return text;
}

function defaultUnfoldLogic(text) {
	// Basic unfolding logic (this is a placeholder and might need more sophisticated implementation)
	return text.replace(/ {/g, ' {\n\t').replace(/; /g, ';\n\t').replace(/ }/g, ' }\n');
}

exports.activate = activate;

function deactivate() { }

exports.deactivate = deactivate;
