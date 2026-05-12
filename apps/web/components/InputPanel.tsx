import { Play } from "lucide-react";

export function InputPanel({
  sourceText,
  onSourceTextChange,
  onGenerate,
  disabled,
}: {
  sourceText: string;
  onSourceTextChange: (value: string) => void;
  onGenerate: () => void;
  disabled: boolean;
}) {
  return (
    <aside className="input-panel" aria-label="Input">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Input</p>
          <h2>Source notes</h2>
        </div>
      </div>

      <textarea
        className="source-input"
        value={sourceText}
        onChange={(event) => onSourceTextChange(event.target.value)}
        spellCheck={false}
        placeholder="Paste notes or a conversation..."
        aria-label="Source notes"
      />

      <button className="primary-button" type="button" onClick={onGenerate} disabled={disabled}>
        <Play size={16} aria-hidden="true" />
        Generate graph
      </button>
    </aside>
  );
}
