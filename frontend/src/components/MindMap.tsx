import React, { useCallback, useEffect, useState, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  MarkerType,
  Node,
  NodeChange,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { GrantNode } from "./GrantNode";
import { CentralNode } from "./CentralNode";
import { GrantDetailsPanel } from "./GrantDetailsPanel";
import { AnimatePresence, motion } from "motion/react";
import { runAgentPipeline, AgentEvent } from "../services/ai";
import { Grant, Organization } from "../types";
import { Sparkles, LayoutGrid, Filter, RefreshCw, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

const nodeTypes = {
  grant: GrantNode,
  central: CentralNode,
};

interface MindMapProps {
  onSelectionChange?: (isSelected: boolean) => void;
  onApply?: (grant: Grant) => void;
  organization: Organization;
  wsRef?: React.MutableRefObject<WebSocket | null>;
  searchQuery?: string;
  onTraceUpdate?: (trace: AgentEvent[]) => void;
  onRunningChange?: (running: boolean) => void;
  excludeIds?: string[];
}

export function MindMap({ onSelectionChange, onApply, organization, wsRef, searchQuery, onTraceUpdate, onRunningChange, excludeIds }: MindMapProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedGrant, setSelectedGrant] = useState<Grant | null>(null);
  const [visibleGrantIds, setVisibleGrantIds] = useState<string[]>([]);
  const [availableGrants, setAvailableGrants] = useState<Grant[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncedFromServer, setSyncedFromServer] = useState(false);
  const [fitFilter, setFitFilter] = useState<"all" | "high" | "med">("all");
  const hasSentInitialSync = useRef(false);
  const isRemoteUpdate = useRef(false);
  const excludeIdsRef = useRef(excludeIds);
  excludeIdsRef.current = excludeIds;

  useEffect(() => {
    const fetchGrants = async () => {
      setLoading(true);
      setSyncedFromServer(false);
      hasSentInitialSync.current = false;
      onTraceUpdate?.([]);
      onRunningChange?.(true);
      const liveTrace: AgentEvent[] = [];
      const { grants } = await runAgentPipeline(
        organization,
        { query: searchQuery, excludeIds: excludeIdsRef.current || [] },
        (event) => {
          liveTrace.push(event);
          onTraceUpdate?.([...liveTrace]);
        }
      );
      onRunningChange?.(false);
      setAvailableGrants(grants);
      setVisibleGrantIds([]);
      setSelectedGrant(null);
      setLoading(false);
    };
    fetchGrants();
  }, [organization, searchQuery]);

  useEffect(() => {
    onSelectionChange?.(!!selectedGrant);
  }, [selectedGrant, onSelectionChange]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    if (node.type === "grant") {
      setSelectedGrant(node.data as unknown as Grant);
    } else {
      setSelectedGrant(null);
    }
  }, []);

  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    onNodesChange(changes);
    if (isRemoteUpdate.current) return;
    if (!wsRef?.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    for (const change of changes) {
      if (change.type === "position" && change.position && change.dragging) {
        wsRef.current.send(JSON.stringify({
          type: "node_move",
          nodeId: change.id,
          position: change.position,
        }));
      }
    }
  }, [onNodesChange, wsRef]);

  const handleApply = (grant: Grant) => {
    onApply?.(grant);
    if (wsRef?.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "node_remove",
        nodeId: grant.id,
      }));
    }
    setAvailableGrants(prev => prev.filter(g => g.id !== grant.id));
    setVisibleGrantIds(prev => prev.filter(id => id !== grant.id));
    setSelectedGrant(null);

    const nextGrant = availableGrants.find(g => !visibleGrantIds.includes(g.id) && g.id !== grant.id);
    if (nextGrant) {
      setVisibleGrantIds(prev => [...prev, nextGrant.id]);
    }
  };

  useEffect(() => {
    if (syncedFromServer) return;
    if (visibleGrantIds.length === 0 && availableGrants.length > 0) {
      const initialIds = availableGrants.slice(0, 6).map(g => g.id);
      setVisibleGrantIds(initialIds);
    }
  }, [availableGrants, visibleGrantIds, syncedFromServer]);

  // Generate Radial Hierarchy layout
  const arrangeNodes = useCallback((grantsList: Grant[]) => {
    const filtered = fitFilter === "high"
      ? grantsList.filter(g => g.matchScore >= 90)
      : fitFilter === "med"
      ? grantsList.filter(g => g.matchScore >= 80)
      : grantsList;

    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    // Central Strategy Hub Node
    newNodes.push({
      id: "root",
      type: "central",
      data: {
        label: organization.name || "Strategy Hub",
        focusAreas: organization.focusAreas || ["Climate", "Education"],
      },
      position: { x: 0, y: 0 },
    });

    const getEdgeColor = (score: number) => {
      if (score >= 90) return "#10b981";
      if (score >= 80) return "#06b6d4";
      if (score >= 70) return "#8b5cf6";
      return "#f59e0b";
    };

    const radius = 480;
    filtered.forEach((grant, index) => {
      const angle = (2 * Math.PI / filtered.length) * index - Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      const color = getEdgeColor(grant.matchScore);

      newNodes.push({
        id: grant.id,
        type: "grant",
        position: { x, y },
        data: { ...grant },
      });

      newEdges.push({
        id: `e-root-${grant.id}`,
        source: "root",
        target: grant.id,
        animated: true,
        style: { stroke: color, strokeWidth: grant.matchScore >= 90 ? 3 : 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color },
      });
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [organization, fitFilter, setNodes, setEdges]);

  useEffect(() => {
    if (syncedFromServer) return;
    if (visibleGrantIds.length === 0) return;
    const currentGrants = availableGrants.filter(g => visibleGrantIds.includes(g.id));
    arrangeNodes(currentGrants);
  }, [availableGrants, visibleGrantIds, syncedFromServer, arrangeNodes]);

  return (
    <div className="w-full h-full bg-zinc-950 relative overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        className="bg-zinc-950"
        minZoom={0.3}
        maxZoom={1.8}
        defaultViewport={{ x: 0, y: 0, zoom: 0.75 }}
      >
        <Background color="#27272a" gap={24} size={1} />
        <Controls className="!bg-zinc-900/80 !backdrop-blur-md !border !border-white/10 !rounded-xl !shadow-2xl fill-white text-white" />
      </ReactFlow>


      {/* Loading & Swarm Status Overlay */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-zinc-900/80 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full flex items-center gap-3 text-xs text-zinc-300 shadow-xl">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>
        <span className="font-medium">
          {loading
            ? "Swarm Agent searching Grant Database…"
            : visibleGrantIds.length < availableGrants.length
            ? "Agent revealing matches in strategy map…"
            : "Strategy Map Synced"}
        </span>
      </div>

      {/* Grant Details Panel */}
      <AnimatePresence>
        {selectedGrant && (
          <GrantDetailsPanel
            grant={selectedGrant}
            onClose={() => setSelectedGrant(null)}
            onApply={handleApply}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
