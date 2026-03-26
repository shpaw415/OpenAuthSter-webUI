import { Icon } from "@iconify/react";
import type { Monaco } from "@monaco-editor/react";
import Editor from "@monaco-editor/react";
import type { IPosition, editor as MonacoEditor } from "monaco-editor";
import { useCallback, useEffect, useRef, useState } from "react";

interface Props {
	/** Variable name shown in the modal header. */
	variableKey: string;
	/**
	 * Function body (without the `function::` prefix).
	 * Pass `null` to close/hide the modal.
	 */
	value: string | null;
	/** Mock data whose keys are offered as `props.<key>` completions. */
	props: Record<string, string>;
	onAccept: (body: string) => void;
	onClose: () => void;
	onRemove: () => void;
}

export function FunctionEditorModal({
	variableKey,
	value,
	props,
	onAccept,
	onClose,
	onRemove,
}: Props) {
	const [draft, setDraft] = useState(value ?? "");
	const propsRef = useRef(props);
	const completionDisposable = useRef<{ dispose: () => void } | null>(null);

	useEffect(() => {
		propsRef.current = props;
	}, [props]);

	// Sync draft when the modal is (re-)opened with a new value
	useEffect(() => {
		if (value !== null) setDraft(value);
	}, [value]);

	// Dispose the completion provider when the component unmounts
	useEffect(() => {
		return () => {
			completionDisposable.current?.dispose();
		};
	}, []);

	const handleMount = useCallback((_editor: unknown, monaco: Monaco) => {
		completionDisposable.current?.dispose();
		completionDisposable.current =
			monaco.languages.registerCompletionItemProvider("javascript", {
				triggerCharacters: ["."],
				provideCompletionItems(
					model: MonacoEditor.ITextModel,
					position: IPosition,
				) {
					const lineUpToCursor = model.getValueInRange({
						startLineNumber: position.lineNumber,
						startColumn: 1,
						endLineNumber: position.lineNumber,
						endColumn: position.column,
					});
					const word = model.getWordUntilPosition(position);
					const range = {
						startLineNumber: position.lineNumber,
						endLineNumber: position.lineNumber,
						startColumn: word.startColumn,
						endColumn: word.endColumn,
					};

					// props.<cursor> → suggest keys
					if (/props\.\w*$/.test(lineUpToCursor)) {
						return {
							suggestions: Object.entries(propsRef.current).map(
								([key, val]) => ({
									label: key,
									kind: monaco.languages.CompletionItemKind.Field,
									insertText: key,
									range,
									detail: val.startsWith("function::") ? "(function)" : val,
								}),
							),
						};
					}

					// typing a prefix of "props" → suggest the identifier
					if (word.word.length > 0 && "props".startsWith(word.word)) {
						return {
							suggestions: [
								{
									label: "props",
									kind: monaco.languages.CompletionItemKind.Variable,
									insertText: "props",
									range,
									detail: "Mock data object",
									documentation: `Available keys: ${Object.keys(propsRef.current).join(", ")}`,
								},
							],
						};
					}

					return { suggestions: [] };
				},
			});
	}, []);

	if (value === null) return null;

	return (
		<>
			<button
				type="button"
				aria-label="Close function editor"
				className="fixed inset-0 z-40 bg-black/60 cursor-default"
				onClick={onClose}
			/>
			<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
				<div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-2xl flex flex-col shadow-2xl">
					<div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
						<div>
							<h2 className="text-white font-semibold flex items-center gap-2">
								<Icon
									icon="lucide:code-2"
									className="w-4 h-4 text-purple-400"
								/>
								Edit Function
							</h2>
							<p className="text-gray-400 text-xs mt-0.5">
								Variable:{" "}
								<code className="text-emerald-400">{`{{${variableKey}}}`}</code>
								{" — receives "}
								<code className="text-gray-300">props</code>
								{", return value replaces the variable in preview"}
							</p>
						</div>
						<button
							type="button"
							onClick={onClose}
							className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-700 transition-colors"
							aria-label="Close"
						>
							<Icon icon="lucide:x" className="w-5 h-5" />
						</button>
					</div>
					<div style={{ height: 300 }} className="p-2">
						<Editor
							height="100%"
							defaultLanguage="javascript"
							value={draft}
							onMount={handleMount}
							onChange={(val) => setDraft(val ?? "")}
							theme="vs-dark"
							options={{
								minimap: { enabled: false },
								fontSize: 13,
								lineNumbers: "on",
								scrollBeyondLastLine: false,
								automaticLayout: true,
								tabSize: 2,
							}}
						/>
					</div>
					<div className="flex items-center justify-between px-5 py-4 border-t border-gray-700">
						<button
							type="button"
							onClick={onRemove}
							className="text-xs text-red-400 hover:text-red-300 transition-colors"
						>
							Remove function
						</button>
						<div className="flex gap-2">
							<button
								type="button"
								onClick={onClose}
								className="px-4 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-colors text-sm"
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={() => onAccept(draft)}
								className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
							>
								Accept
							</button>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
