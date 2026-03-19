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
import { GrantDetailsPanel } from "./GrantDetailsPanel";
import { AnimatePresence } from "motion/react";
import { generateGrants } from "../services/ai";
import { Grant, Organization } from "../types";

const nodeTypes = {
  grant: GrantNode,
};

interface MindMapProps {
  onSelectionChange?: (isSelected: boolean) => void;
  onApply?: (grant: Grant) => void;
  organization: Organization;
  wsRef?: React.MutableRefObject<WebSocket | null>;
  searchQuery?: string;
}

export function MindMap({ onSelectionChange, onApply, organization, wsRef, searchQuery }: MindMapProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedGrant, setSelectedGrant] = useState<Grant | null>(null);
  const [visibleGrantIds, setVisibleGrantIds] = useState<string[]>([]);
  const [availableGrants, setAvailableGrants] = useState<Grant[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncedFromServer, setSyncedFromServer] = useState(false);
  const hasSentInitialSync = useRef(false);
  const isRemoteUpdate = useRef(false);

  useEffect(() => {
    const fetchGrants = async () => {
      setLoading(true);
      setSyncedFromServer(false);
      hasSentInitialSync.current = false;
      
      // Use search query if provided, otherwise construct from org profile
      // Also use matchedGrants from org profile if no search query provided
      console.log("[MindMap] fetchGrants called with searchQuery:", searchQuery, "organization.matchedGrants:", organization.matchedGrants?.length);
      if (!searchQuery && organization.matchedGrants && organization.matchedGrants.length > 0) {
        console.log("[MindMap] Using matched grants from profile");
        setAvailableGrants(organization.matchedGrants);
        setVisibleGrantIds([]);
        setSelectedGrant(null);
        setLoading(false);
        return;
      }

      console.log("[MindMap] Falling back to generateGrants");
      let query: string;
      if (searchQuery) {
        query = searchQuery;
      } else {
        const focus = organization.focusAreas?.join(", ") || "general non-profit";
        query = `${focus} grants for ${organization.mission}`;
      }
      
      console.log("Generating grants for query:", query);
      const grants = await generateGrants(query);
      setAvailableGrants(grants);
      setVisibleGrantIds([]);
      setSelectedGrant(null);
      setLoading(false);
    };
    fetchGrants();
  }, [organization, searchQuery]); // Re-run on org change or new search

  useEffect(() => {
    onSelectionChange?.(!!selectedGrant);
  }, [selectedGrant, onSelectionChange]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    if (node.type === 'grant') {
      setSelectedGrant(node.data as unknown as Grant);
    } else {
      setSelectedGrant(null);
    }
  }, []);

  // Wrap onNodesChange to detect user-initiated node drags and broadcast them
  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    onNodesChange(changes);

    // Don't broadcast if this was a remote update
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
    // Call parent handler if exists
    onApply?.(grant);

    // Broadcast removal via WebSocket
    if (wsRef?.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "node_remove",
        nodeId: grant.id,
      }));
    }

    // Remove the applied grant from the map
    setAvailableGrants(prev => prev.filter(g => g.id !== grant.id));
    setVisibleGrantIds(prev => prev.filter(id => id !== grant.id));
    setSelectedGrant(null);
    
    // Add the next best grant if available
    const nextGrant = availableGrants.find(g => !visibleGrantIds.includes(g.id) && g.id !== grant.id);
    if (nextGrant) {
       setVisibleGrantIds(prev => [...prev, nextGrant.id]);
    }
  };

  // Initialize with top grant + 5 others
  useEffect(() => {
    if (syncedFromServer) return; // Skip if we already synced from server
    if (visibleGrantIds.length === 0 && availableGrants.length > 0) {
      const initialIds = availableGrants.slice(0, 6).map(g => g.id);
      setVisibleGrantIds(initialIds);
    }
  }, [availableGrants, visibleGrantIds, syncedFromServer]);

  // Update nodes layout when visible grants change
  useEffect(() => {
    if (syncedFromServer) return; // Skip if we got state from server
    if (visibleGrantIds.length === 0) return;

    const currentGrants = availableGrants.filter(g => visibleGrantIds.includes(g.id));
    // Sort by match score to find the best one
    const sortedGrants = [...currentGrants].sort((a, b) => b.matchScore - a.matchScore);
    const topGrant = sortedGrants[0];
    const otherGrants = sortedGrants.slice(1);

    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    // Root Node (User Query)
    const rootNode = {
      id: "root",
      type: "input",
      data: { label: organization.name || "Grant Query" },
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
    };
    newNodes.push(rootNode);

    // Helper for edge colors
    const getEdgeColor = (score: number) => {
      if (score >= 90) return "#10b981"; // Bright Green (Emerald-500)
      if (score >= 80) return "#4ade80"; // Light Green (Green-400)
      if (score >= 70) return "#86efac"; // Very Mild Green (Green-300)
      if (score >= 60) return "#facc15"; // Yellow (Yellow-400)
      return "#ef4444"; // Red (Red-500)
    };

    // Top Grant (Center-ish, slightly offset)
    if (topGrant) {
       const topColor = getEdgeColor(topGrant.matchScore);
       newNodes.push({
         id: topGrant.id,
         type: "grant",
         position: { x: 0, y: 250 }, // Directly below root
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

    // Other Grants (Circular Layout around Top Grant)
    const radius = 450;
    const centerX = 0;
    const centerY = 250;
    
    otherGrants.forEach((grant, index) => {
      const angle = (2 * Math.PI / otherGrants.length) * index - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      const edgeColor = getEdgeColor(grant.matchScore);

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

    setNodes(newNodes);
    setEdges(newEdges);

    // Send initial map state to server (first client becomes the "host")
    if (wsRef?.current && wsRef.current.readyState === WebSocket.OPEN && !hasSentInitialSync.current) {
      hasSentInitialSync.current = true;
      // Small delay to ensure nodes are set first
      setTimeout(() => {
        const serializableNodes = newNodes.map(n => ({
          id: n.id,
          type: n.type,
          position: n.position,
          data: n.data,
          style: n.style,
        }));
        wsRef.current?.send(JSON.stringify({
          type: "map_sync",
          nodes: serializableNodes,
          edges: newEdges,
        }));
      }, 500);
    }

  }, [visibleGrantIds, availableGrants, setNodes, setEdges, syncedFromServer]);

  // Listen for incoming WebSocket map messages
  useEffect(() => {
    if (!wsRef?.current) return;
    const ws = wsRef.current;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case "node_move": {
            isRemoteUpdate.current = true;
            setNodes(prevNodes =>
              prevNodes.map(n =>
                n.id === data.nodeId ? { ...n, position: data.position } : n
              )
            );
            // Reset flag after React processes the update
            requestAnimationFrame(() => { isRemoteUpdate.current = false; });
            break;
          }

          case "node_remove": {
            setNodes(prevNodes => prevNodes.filter(n => n.id !== data.nodeId));
            setEdges(prevEdges => prevEdges.filter(e => e.source !== data.nodeId && e.target !== data.nodeId));
            setAvailableGrants(prev => prev.filter(g => g.id !== data.nodeId));
            setVisibleGrantIds(prev => prev.filter(id => id !== data.nodeId));
            if (selectedGrant?.id === data.nodeId) {
              setSelectedGrant(null);
            }
            break;
          }

          case "map_sync": {
            // Another client sent the full map state — adopt it
            setSyncedFromServer(true);
            isRemoteUpdate.current = true;
            setNodes(data.nodes || []);
            setEdges(data.edges || []);
            requestAnimationFrame(() => { isRemoteUpdate.current = false; });
            break;
          }
        }
      } catch {
        // Ignore non-JSON or unrelated messages
      }
    };

    ws.addEventListener("message", handleMessage);
    return () => ws.removeEventListener("message", handleMessage);
  }, [wsRef?.current, setNodes, setEdges]);

  // Also check init message for mapState (late joiner)
  useEffect(() => {
    if (!wsRef?.current) return;
    const ws = wsRef.current;

    const handleInit = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "init" && data.mapState) {
          setSyncedFromServer(true);
          isRemoteUpdate.current = true;
          setNodes(data.mapState.nodes || []);
          setEdges(data.mapState.edges || []);
          requestAnimationFrame(() => { isRemoteUpdate.current = false; });
        }
      } catch {
        // Ignore
      }
    };

    ws.addEventListener("message", handleInit);
    return () => ws.removeEventListener("message", handleInit);
  }, [wsRef?.current, setNodes, setEdges]);

  return (
    <div className="w-full h-full bg-zinc-950 relative">
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
        minZoom={0.5}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
      >
        <Background color="#3f3f46" gap={20} size={1} />
        <Controls className="bg-zinc-800 border border-white/10 fill-white text-white" />
      </ReactFlow>
      
      {/* Loading Indicator Overlay */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-zinc-900/80 backdrop-blur border border-white/10 px-4 py-2 rounded-full flex items-center gap-3 text-xs text-zinc-400 pointer-events-none">
        <div className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </div>
        <span>
          {loading ? "Agent discovering grants..." : 
           visibleGrantIds.length < availableGrants.length 
            ? `Agent #${Math.floor(Math.random() * 10) + 1} discovering...` 
            : "Discovery Complete"}
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
