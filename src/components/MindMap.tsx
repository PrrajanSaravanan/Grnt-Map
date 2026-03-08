import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { GrantNode } from "./GrantNode";
import { GrantDetailsPanel } from "./GrantDetailsPanel";
import { AnimatePresence } from "motion/react";
import { useAppContext } from "@/AppContext";
import { Loader2 } from "lucide-react";

const nodeTypes = {
  grant: GrantNode,
};

interface MindMapProps {
  onSelectionChange?: (isSelected: boolean) => void;
  onApplyGrant?: (grantId: string) => void;
}

export function MindMap({ onSelectionChange, onApplyGrant }: MindMapProps) {
  const ctx = useAppContext();

  // Memoize to avoid new array references on every render
  const availableGrants = useMemo(
    () => ctx.grants.filter(g => g.status === "available"),
    [ctx.grants]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedGrant, setSelectedGrant] = useState<any>(null);
  const [visibleGrantIds, setVisibleGrantIds] = useState<string[]>([]);
  const initializedRef = useRef(false);

  const orgName = ctx.userProfile?.organizationName || "Your Org";

  useEffect(() => {
    onSelectionChange?.(!!selectedGrant);
  }, [selectedGrant, onSelectionChange]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    if (node.type === 'grant') {
      setSelectedGrant(node.data);
    } else {
      setSelectedGrant(null);
    }
  }, []);

  const handleApply = useCallback((grant: any) => {
    setSelectedGrant(null);
    if (onApplyGrant) {
      onApplyGrant(grant.id);
    }
  }, [onApplyGrant]);

  // Initialize visible grants only once
  useEffect(() => {
    console.log(`[MindMap] availableGrants.length=${availableGrants.length}, initialized=${initializedRef.current}`);
    if (!initializedRef.current && availableGrants.length > 0) {
      initializedRef.current = true;
      const sorted = [...availableGrants].sort((a, b) => b.matchScore - a.matchScore);
      const ids = sorted.slice(0, 6).map(g => g.id);
      console.log(`[MindMap] initializing visibleGrantIds:`, ids);
      setVisibleGrantIds(ids);
    }
  }, [availableGrants]);

  // Update visible grants when availableGrants changes
  useEffect(() => {
    // Check if we need to add new grants (up to max 6)
    const currentIdSet = new Set(availableGrants.map(g => g.id));
    const validVisible = visibleGrantIds.filter(id => currentIdSet.has(id));

    // If we have room for more and there are available grants not currently visible
    if (validVisible.length < 6) {
      const remainingToAdd = availableGrants
        .filter(g => !validVisible.includes(g.id))
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 6 - validVisible.length);

      if (remainingToAdd.length > 0) {
        setVisibleGrantIds([...validVisible, ...remainingToAdd.map(g => g.id)]);
        return; // State update will trigger re-render
      }
    }

    // If some visible grants were removed (applied), update the array
    if (validVisible.length !== visibleGrantIds.length) {
      setVisibleGrantIds(validVisible);
    }
  }, [availableGrants, visibleGrantIds]);

  // Helper for edge colors
  const getEdgeColor = useCallback((score: number) => {
    if (score >= 90) return "#10b981";
    if (score >= 80) return "#4ade80";
    if (score >= 70) return "#86efac";
    if (score >= 60) return "#facc15";
    return "#ef4444";
  }, []);

  // Update nodes layout when visible grants change
  useEffect(() => {
    if (visibleGrantIds.length === 0) return;

    const currentGrants = availableGrants.filter(g => visibleGrantIds.includes(g.id));
    const sortedGrants = [...currentGrants].sort((a, b) => b.matchScore - a.matchScore);
    const topGrant = sortedGrants[0];
    const otherGrants = sortedGrants.slice(1);

    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    // Root Node
    newNodes.push({
      id: "root",
      type: "input",
      data: { label: `${orgName} Query` },
      position: { x: 0, y: 0 },
      style: {
        background: "#10b981",
        color: "#fff",
        border: "1px solid #059669",
        borderRadius: "12px",
        width: 160,
        fontSize: "12px",
        fontWeight: "bold",
        boxShadow: "0 0 20px rgba(16, 185, 129, 0.4)",
      },
    });

    // Top Grant
    if (topGrant) {
      const topColor = getEdgeColor(topGrant.matchScore);
      console.log(`[MindMap] topGrant: id=${topGrant.id} position={x:0, y:250}`);
      newNodes.push({
        id: topGrant.id,
        type: "grant",
        position: { x: 0, y: 250 },
        data: { ...topGrant },
      });
      newEdges.push({
        id: `e-root-${topGrant.id}`,
        source: "root",
        target: topGrant.id,
        animated: true,
        style: { stroke: topColor, strokeWidth: 3 },
        label: "Top Match",
        labelStyle: { fill: topColor, fontWeight: 700, fontSize: 12 },
        labelBgStyle: { fill: "#09090b", fillOpacity: 0.8 },
        markerEnd: { type: MarkerType.ArrowClosed, color: topColor },
      });
    }

    // Other Grants (Circular Layout)
    const radius = 450;
    const centerX = 0;
    const centerY = 250;

    otherGrants.forEach((grant, index) => {
      const count = otherGrants.length;
      const angle = (2 * Math.PI / count) * index - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      const edgeColor = getEdgeColor(grant.matchScore);
      console.log(`[MindMap] grant ${grant.id} position={x:${Math.round(x)}, y:${Math.round(y)}}`);

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
        style: { stroke: edgeColor, strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor },
      });
    });

    console.log(`[MindMap] rendering ${newNodes.length} nodes, ${newEdges.length} edges`);
    setNodes(newNodes);
    setEdges(newEdges);
  }, [visibleGrantIds, availableGrants, setNodes, setEdges, orgName, getEdgeColor]);

  return (
    <div
      className="w-full h-full bg-zinc-950 relative"
      style={{ minHeight: "600px", width: "100%" }}
    >
      {/* Loading overlay — shown while discovering and no grants yet */}
      {ctx.isDiscovering && availableGrants.length === 0 && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-zinc-950/90">
          <Loader2 size={36} className="animate-spin text-emerald-500" />
          <p className="text-sm text-zinc-400 font-medium tracking-wide">Discovering grants…</p>
          <p className="text-xs text-zinc-600">TinyFish agent is scanning grant portals</p>
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        className="bg-zinc-950"
        minZoom={0.5}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
      >
        <Background color="#3f3f46" gap={20} size={1} />
        <Controls className="bg-zinc-800 border border-white/10 fill-white text-white" />
      </ReactFlow>

      {/* Status Indicator */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-zinc-900/80 backdrop-blur border border-white/10 px-4 py-2 rounded-full flex items-center gap-3 text-xs text-zinc-400 pointer-events-none">
        <div className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </div>
        <span>{availableGrants.length} grants discovered</span>
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
