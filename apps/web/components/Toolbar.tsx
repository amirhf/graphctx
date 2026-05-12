import type { LucideIcon } from "lucide-react";

export type ToolbarAction = {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  disabled?: boolean;
};

export function Toolbar({ actions }: { actions: ToolbarAction[] }) {
  return (
    <div className="toolbar" role="toolbar" aria-label="Graph actions">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.label}
            className="icon-button"
            type="button"
            title={action.label}
            aria-label={action.label}
            onClick={action.onClick}
            disabled={action.disabled}
          >
            <Icon size={17} aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
