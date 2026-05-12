"use client";

import type { GraphDocument } from "@graphctx/graph-schema";
import {
  Background,
  Controls,
  MarkerType,
  ReactFlow,
  type Edge,
  type Node,
  type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useMemo } from "react";
import { layoutGraph } from "../lib/graphLayout";

const nodeTypeClass: Record<string, string> = {
  idea: "flow-node idea",
  question: "flow-node question",
  assumption: "flow-node assumption",
  decision: "flow-node decision",
  risk: "flow-node risk",
  task: "flow-node task",
  source: "flow-node source",
  summary: "flow-node summary",
  answer: "flow-node answer",
  claim: "flow-node claim",
  tradeoff: "flow-node tradeoff",
};

export function GraphCanvas({
  graph,
  selectedNodeIds,
  onSelectionChange,
}: {
  graph?: GraphDocument;
  selectedNodeIds: string[];
  onSelectionChange: (nodeIds: string[]) => void;
}) {
  const { nodes, edges } = useMemo(() => {
    if (!graph) {
      return { nodes: [] as Node[], edges: [] as Edge[] };
    }

    const positions = layoutGraph(graph);
    return {
      nodes: graph.nodes.map((node) => ({
        id: node.id,
        type: "default",
        position: positions[node.id] ?? { x: 0, y: 0 },
        selected: selectedNodeIds.includes(node.id),
        className: nodeTypeClass[node.type] ?? "flow-node",
        data: {
          label: (
            <div className="flow-node-content">
              <span>{node.type}</span>
              <strong>{node.title}</strong>
            </div>
          ),
        },
      })),
      edges: graph.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.type,
        markerEnd: { type: MarkerType.ArrowClosed },
        className: "flow-edge",
      })),
    };
  }, [graph, selectedNodeIds]);

  const onNodeClick: NodeMouseHandler = (event, node) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey) {
      const nextSelection = selectedNodeIds.includes(node.id)
        ? selectedNodeIds.filter((id) => id !== node.id)
        : [...selectedNodeIds, node.id];
      onSelectionChange(nextSelection);
      return;
    }
    onSelectionChange([node.id]);
  };

  if (!graph) {
    return <div className="canvas-empty">No graph</div>;
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      fitView
      fitViewOptions={{ padding: 0.18 }}
      minZoom={0.35}
      maxZoom={1.4}
      onNodeClick={onNodeClick}
      onPaneClick={() => onSelectionChange([])}
      nodesDraggable
      elementsSelectable
    >
      <Background color="var(--grid-line)" gap={24} />
      <Controls showInteractive={false} />
    </ReactFlow>
  );
}
