import { useCallback, useEffect, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { GrantNode } from "./GrantNode";

const nodeTypes = {
  grant: GrantNode,
};

const INITIAL_NODES = [
  {
    id: "root",
    type: "input",
    data: { label: "EcoYouth Query: $50k+ Climate" },
    position: { x: 0, y: 0 },
    style: {
      background: "#10b981",
      color: "#fff",
      border: "1px solid #059669",
      borderRadius: "12px",
      width: 200,
      fontSize: "12px",
      fontWeight: "bold",
      boxShadow: "0 0 20px rgba(16, 185, 129, 0.4)",
    },
  },
];

const MOCK_GRANTS = [
  { title: "EU Horizon Climate Innovation Fund 2026", amount: "€75,000", deadline: "3 months", portal: "EU Horizon", matchScore: 92 },
  { title: "Green Energy Transition Grant", amount: "$50,000", deadline: "2 months", portal: "Grants.gov", matchScore: 88 },
  { title: "Youth for Planet Action Fund", amount: "$60,000", deadline: "4 months", portal: "UN", matchScore: 95 },
  { title: "Sustainable Communities Initiative", amount: "$100,000", deadline: "6 months", portal: "Ford Foundation", matchScore: 85 },
  { title: "Clean Water Access Project", amount: "$45,000", deadline: "1 month", portal: "EcoFund", matchScore: 78 },
  { title: "Renewable Tech Accelerator", amount: "$120,000", deadline: "5 months", portal: "Grants.gov", matchScore: 91 },
];

export function MindMap() {
  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [grantIndex, setGrantIndex] = useState(0);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Simulate streaming agents discovering grants
  useEffect(() => {
    if (grantIndex >= MOCK_GRANTS.length) return;

    const timeout = setTimeout(() => {
      const grant = MOCK_GRANTS[grantIndex];
      const newNodeId = `grant-${grantIndex}`;
      
      // Calculate random position in a semi-circle around the root
      const angle = (Math.PI / (MOCK_GRANTS.length - 1)) * grantIndex - Math.PI / 2;
      const radius = 400 + Math.random() * 100;
      const x = Math.cos(angle) * radius + 100; // Offset slightly right
      const y = Math.sin(angle) * radius * 0.8; // Flatten slightly

      const newNode = {
        id: newNodeId,
        type: "grant",
        position: { x, y },
        data: { ...grant },
      };

      const newEdge: Edge = {
        id: `e-root-${newNodeId}`,
        source: "root",
        target: newNodeId,
        animated: true,
        style: { stroke: "#10b981", strokeWidth: 2 },
        label: grant.matchScore > 90 ? "High Match" : "Eligible",
        labelStyle: { fill: "#10b981", fontWeight: 700, fontSize: 10 },
        labelBgStyle: { fill: "#09090b", fillOpacity: 0.8 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#10b981" },
      };

      setNodes((nds) => [...nds, newNode]);
      setEdges((eds) => [...eds, newEdge]);
      setGrantIndex((prev) => prev + 1);
    }, 2000); // New grant every 2 seconds

    return () => clearTimeout(timeout);
  }, [grantIndex, setNodes, setEdges]);

  return (
    <div className="w-full h-full bg-zinc-950">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        className="bg-zinc-950"
        minZoom={0.5}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
      >
        <Background color="#3f3f46" gap={20} size={1} />
        <Controls className="bg-zinc-800 border border-white/10 fill-white text-white" />
        <MiniMap 
          nodeColor={(n) => {
            if (n.type === 'input') return '#10b981';
            return '#3f3f46';
          }}
          className="bg-zinc-900 border border-white/10" 
          maskColor="rgba(0, 0, 0, 0.6)"
        />
      </ReactFlow>
      
      {/* Loading Indicator Overlay */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-zinc-900/80 backdrop-blur border border-white/10 px-4 py-2 rounded-full flex items-center gap-3 text-xs text-zinc-400 pointer-events-none">
        <div className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </div>
        <span>
          {grantIndex < MOCK_GRANTS.length 
            ? `Agent #${Math.floor(Math.random() * 10) + 1} discovering...` 
            : "Discovery Complete"}
        </span>
      </div>
    </div>
  );
}
