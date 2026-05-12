"use client";

import {
  AlertCircle,
  Braces,
  Clipboard,
  Download,
  FileText,
  Network,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { GraphDocument, GraphNode, NodeType } from "@graphctx/graph-schema";
import { getSelectedSubgraph, validateGraphDocument } from "@graphctx/graph-schema";
import { exportContextPack } from "@graphctx/context-pack-exporter";
import { ExportPanel } from "../components/ExportPanel";
import { GraphCanvas } from "../components/GraphCanvas";
import { InputPanel } from "../components/InputPanel";
import { NodeDetailsPanel } from "../components/NodeDetailsPanel";
import { Toolbar } from "../components/Toolbar";
import { downloadTextFile } from "../lib/download";
import { loadCurrentGraph, saveCurrentGraph } from "../lib/localPersistence";
import { createMockGraphFromText } from "../lib/mockGraph";

const nodeTypeOptions: NodeType[] = [
  "idea",
  "question",
  "assumption",
  "decision",
  "risk",
  "task",
  "source",
  "summary",
  "answer",
  "claim",
  "tradeoff",
];

export default function HomePage() {
  const [sourceText, setSourceText] = useState("");
  const [graph, setGraph] = useState<GraphDocument | undefined>();
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [error, setError] = useState<string | undefined>();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const restored = loadCurrentGraph();
    if (restored) {
      setGraph(restored);
      setSourceText(restored.sourceText ?? "");
    }
  }, []);

  useEffect(() => {
    if (graph) {
      saveCurrentGraph(graph);
    }
  }, [graph]);

  const selectedNode = useMemo(() => {
    if (!graph || selectedNodeIds.length !== 1) {
      return undefined;
    }
    return graph.nodes.find((node) => node.id === selectedNodeIds[0]);
  }, [graph, selectedNodeIds]);

  const selectedSubgraph = useMemo(() => {
    if (!graph) {
      return undefined;
    }
    return getSelectedSubgraph(graph, selectedNodeIds);
  }, [graph, selectedNodeIds]);

  function generateGraph(): void {
    setError(undefined);
    const nextGraph = createMockGraphFromText(sourceText);
    const validation = validateGraphDocument(nextGraph);

    if (!validation.ok || !validation.graph) {
      setError(validation.errors.join("\n"));
      return;
    }

    setGraph(validation.graph);
    setSelectedNodeIds([validation.graph.nodes[0]?.id].filter(Boolean));
  }

  function clearGraph(): void {
    setGraph(undefined);
    setSelectedNodeIds([]);
    setError(undefined);
    window.localStorage.removeItem("graphctx.phase2.currentGraph");
  }

  function updateNode(nodeId: string, patch: Partial<GraphNode>): void {
    if (!graph) {
      return;
    }

    const nextGraph: GraphDocument = {
      ...graph,
      nodes: graph.nodes.map((node) => (node.id === nodeId ? { ...node, ...patch } : node)),
      updatedAt: new Date().toISOString(),
    };
    const validation = validateGraphDocument(nextGraph);
    if (!validation.ok || !validation.graph) {
      setError(validation.errors.join("\n"));
      return;
    }
    setGraph(validation.graph);
  }

  function addNode(): void {
    if (!graph) {
      return;
    }
    const id = `node-${graph.nodes.length + 1}`;
    const nextGraph: GraphDocument = {
      ...graph,
      nodes: [
        ...graph.nodes,
        {
          id,
          type: "idea",
          title: "New node",
          body: "Add context.",
          tags: [],
          created_by: "user",
          status: "draft",
        },
      ],
      updatedAt: new Date().toISOString(),
    };
    setGraph(nextGraph);
    setSelectedNodeIds([id]);
  }

  function deleteSelection(): void {
    if (!graph || selectedNodeIds.length === 0) {
      return;
    }
    const selected = new Set(selectedNodeIds);
    const nextGraph: GraphDocument = {
      ...graph,
      nodes: graph.nodes.filter((node) => !selected.has(node.id)),
      edges: graph.edges.filter((edge) => !selected.has(edge.source) && !selected.has(edge.target)),
      updatedAt: new Date().toISOString(),
    };
    const validation = validateGraphDocument(nextGraph);
    if (!validation.ok || !validation.graph) {
      setError(validation.errors.join("\n"));
      return;
    }
    setGraph(validation.graph);
    setSelectedNodeIds([]);
  }

  async function copyContextPack(): Promise<void> {
    if (!graph) {
      return;
    }
    setCopied(false);
    const markdown = exportContextPack({ graph, selectedNodeIds });
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
    } catch {
      setError("Clipboard access failed. Download the Context Pack instead.");
    }
  }

  function downloadContextPack(): void {
    if (!graph) {
      return;
    }
    downloadTextFile("context-pack.md", exportContextPack({ graph, selectedNodeIds }), "text/markdown");
  }

  function downloadGraphJson(): void {
    if (!graph) {
      return;
    }
    downloadTextFile("graph.json", JSON.stringify(graph, null, 2), "application/json");
  }

  function downloadSelectedJson(): void {
    if (!selectedSubgraph) {
      return;
    }
    downloadTextFile("selected-subgraph.json", JSON.stringify(selectedSubgraph, null, 2), "application/json");
  }

  return (
    <main className="workspace-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">GraphCtx Phase 2</p>
          <h1>Local context graph workspace</h1>
        </div>
        <Toolbar
          actions={[
            {
              label: "Add node",
              icon: Plus,
              onClick: addNode,
              disabled: !graph,
            },
            {
              label: "Delete selection",
              icon: Trash2,
              onClick: deleteSelection,
              disabled: selectedNodeIds.length === 0,
            },
            {
              label: "Clear graph",
              icon: RotateCcw,
              onClick: clearGraph,
              disabled: !graph,
            },
          ]}
        />
      </header>

      {error ? (
        <div className="error-strip" role="alert">
          <AlertCircle size={16} aria-hidden="true" />
          <span>{error}</span>
        </div>
      ) : null}

      <section className="workspace-grid" aria-label="GraphCtx workspace">
        <InputPanel
          sourceText={sourceText}
          onSourceTextChange={setSourceText}
          onGenerate={generateGraph}
          disabled={!sourceText.trim()}
        />

        <section className="canvas-panel" aria-label="Graph canvas">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Graph</p>
              <h2>{graph?.title ?? "No graph loaded"}</h2>
            </div>
            <div className="canvas-counts">
              <span>
                <Network size={14} aria-hidden="true" />
                {graph?.nodes.length ?? 0}
              </span>
              <span>
                <Braces size={14} aria-hidden="true" />
                {graph?.edges.length ?? 0}
              </span>
            </div>
          </div>
          <GraphCanvas
            graph={graph}
            selectedNodeIds={selectedNodeIds}
            onSelectionChange={setSelectedNodeIds}
          />
        </section>

        <aside className="inspector-panel" aria-label="Inspector">
          <NodeDetailsPanel
            node={selectedNode}
            nodeTypes={nodeTypeOptions}
            connectedNodes={
              graph && selectedNode
                ? graph.edges
                    .filter((edge) => edge.source === selectedNode.id || edge.target === selectedNode.id)
                    .map((edge) => ({
                      edge,
                      node: graph.nodes.find((node) =>
                        node.id === (edge.source === selectedNode.id ? edge.target : edge.source),
                      ),
                    }))
                : []
            }
            onUpdateNode={updateNode}
          />

          <ExportPanel
            disabled={!graph}
            selectedCount={selectedNodeIds.length}
            copied={copied}
            actions={[
              { label: "Copy pack", icon: Clipboard, onClick: copyContextPack },
              { label: "Download pack", icon: FileText, onClick: downloadContextPack },
              { label: "Graph JSON", icon: Download, onClick: downloadGraphJson },
              { label: "Selection JSON", icon: Download, onClick: downloadSelectedJson },
            ]}
          />
        </aside>
      </section>
    </main>
  );
}
