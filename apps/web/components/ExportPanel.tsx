import type { LucideIcon } from "lucide-react";

export type ExportAction = {
  label: string;
  icon: LucideIcon;
  onClick: () => void | Promise<void>;
};

export function ExportPanel({
  actions,
  disabled,
  selectedCount,
  copied,
}: {
  actions: ExportAction[];
  disabled: boolean;
  selectedCount: number;
  copied: boolean;
}) {
  return (
    <section className="inspector-section" aria-label="Export">
      <div className="section-heading">
        <p className="eyebrow">Export</p>
        <span>{selectedCount > 0 ? `${selectedCount} selected` : "Full graph"}</span>
      </div>
      <div className="export-grid">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              className="secondary-button"
              type="button"
              disabled={disabled}
              onClick={action.onClick}
            >
              <Icon size={15} aria-hidden="true" />
              {action.label}
            </button>
          );
        })}
      </div>
      {copied ? <p className="quiet-note">Context Pack copied.</p> : null}
    </section>
  );
}
