import type { GraphEdge, GraphNode, NodeType } from "@graphctx/graph-schema";

export function NodeDetailsPanel({
  node,
  nodeTypes,
  connectedNodes,
  onUpdateNode,
}: {
  node?: GraphNode;
  nodeTypes: NodeType[];
  connectedNodes: Array<{ edge: GraphEdge; node?: GraphNode }>;
  onUpdateNode: (nodeId: string, patch: Partial<GraphNode>) => void;
}) {
  if (!node) {
    return (
      <section className="inspector-section node-empty" aria-label="Node details">
        <div className="section-heading">
          <p className="eyebrow">Inspector</p>
          <span>No selection</span>
        </div>
      </section>
    );
  }

  return (
    <section className="inspector-section" aria-label="Node details">
      <div className="section-heading">
        <p className="eyebrow">Inspector</p>
        <span>{node.id}</span>
      </div>

      <label className="field">
        <span>Type</span>
        <select
          value={node.type}
          onChange={(event) => onUpdateNode(node.id, { type: event.target.value as NodeType })}
        >
          {nodeTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Title</span>
        <input
          value={node.title}
          onChange={(event) => onUpdateNode(node.id, { title: event.target.value || "Untitled node" })}
        />
      </label>

      <label className="field">
        <span>Body</span>
        <textarea
          value={node.body}
          onChange={(event) => onUpdateNode(node.id, { body: event.target.value || "Add context." })}
        />
      </label>

      <label className="field">
        <span>Tags</span>
        <input
          value={(node.tags ?? []).join(", ")}
          onChange={(event) =>
            onUpdateNode(node.id, {
              tags: event.target.value
                .split(",")
                .map((tag) => tag.trim())
                .filter(Boolean),
            })
          }
        />
      </label>

      <div className="node-meta">
        <span>Confidence</span>
        <strong>
          {typeof node.confidence === "number" ? `${Math.round(node.confidence * 100)}%` : "Unspecified"}
        </strong>
      </div>

      <div className="connected-list">
        <div className="section-heading compact">
          <p className="eyebrow">Connected</p>
          <span>{connectedNodes.length}</span>
        </div>
        {connectedNodes.length > 0 ? (
          connectedNodes.map(({ edge, node: connectedNode }) => (
            <div key={edge.id} className="connected-row">
              <span>{edge.type}</span>
              <strong>{connectedNode?.title ?? edge.id}</strong>
            </div>
          ))
        ) : (
          <p className="quiet-note">No connected nodes.</p>
        )}
      </div>
    </section>
  );
}
