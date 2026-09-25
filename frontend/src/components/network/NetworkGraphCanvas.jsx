import React, { useRef, useEffect, useState, useCallback } from "react";
import { 
  RiZoomInLine, 
  RiZoomOutLine, 
  RiFullscreenLine, 
  RiFocus3Line,
  RiInformationLine
} from "react-icons/ri";

export default function NetworkGraphCanvas({
  nodes,
  edges,
  selectedNodeId,
  onSelectNode,
  isSimulationActive,
  zoomLevel,
  setZoomLevel,
  panOffset,
  setPanOffset
}) {
  const canvasRef = useRef(null);
  const simulationRef = useRef(null);
  const simNodesRef = useRef([]);
  const simEdgesRef = useRef([]);

  const [hoveredNode, setHoveredNode] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNode, setDraggedNode] = useState(null);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Initialize and synchronize simulation nodes/edges with incoming data
  useEffect(() => {
    const existingMap = new Map(simNodesRef.current.map((n) => [n.id, n]));
    const canvas = canvasRef.current;
    const width = canvas?.clientWidth || 900;
    const height = canvas?.clientHeight || 600;

    const newSimNodes = nodes.map((node, idx) => {
      if (existingMap.has(node.id)) {
        const existing = existingMap.get(node.id);
        return {
          ...node,
          x: existing.x,
          y: existing.y,
          vx: existing.vx || 0,
          vy: existing.vy || 0,
          radius: node.type === "SYNDICATE" ? 28 : node.type === "SUSPECT" ? 22 : node.type === "LOCATION" ? 18 : 14
        };
      }
      // Cluster placement by type
      const angle = (idx / Math.max(1, nodes.length)) * Math.PI * 2;
      const dist = 120 + (idx % 4) * 60;
      return {
        ...node,
        x: width / 2 + Math.cos(angle) * dist + (Math.random() - 0.5) * 50,
        y: height / 2 + Math.sin(angle) * dist + (Math.random() - 0.5) * 50,
        vx: 0,
        vy: 0,
        radius: node.type === "SYNDICATE" ? 28 : node.type === "SUSPECT" ? 22 : node.type === "LOCATION" ? 18 : 14
      };
    });

    const nodeIndexMap = new Map(newSimNodes.map((n) => [n.id, n]));
    const newSimEdges = edges
      .map((edge) => ({
        ...edge,
        sourceNode: nodeIndexMap.get(edge.source),
        targetNode: nodeIndexMap.get(edge.target)
      }))
      .filter((e) => e.sourceNode && e.targetNode);

    simNodesRef.current = newSimNodes;
    simEdgesRef.current = newSimEdges;
  }, [nodes, edges]);

  // Main Force Physics Simulation Loop
  useEffect(() => {
    let animationFrameId;

    const tick = () => {
      if (isSimulationActive && canvasRef.current) {
        const simNodes = simNodesRef.current;
        const simEdges = simEdgesRef.current;
        const width = canvasRef.current.clientWidth || 900;
        const height = canvasRef.current.clientHeight || 600;
        const centerX = width / 2;
        const centerY = height / 2;

        // 1. Center Gravitation
        for (let i = 0; i < simNodes.length; i++) {
          const n = simNodes[i];
          if (n === draggedNode) continue;
          n.vx += (centerX - n.x) * 0.0008;
          n.vy += (centerY - n.y) * 0.0008;
        }

        // 2. Node Repulsion (Coulomb Force)
        for (let i = 0; i < simNodes.length; i++) {
          const n1 = simNodes[i];
          for (let j = i + 1; j < simNodes.length; j++) {
            const n2 = simNodes[j];
            const dx = n2.x - n1.x;
            const dy = n2.y - n1.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const minDist = (n1.radius + n2.radius) * 2.5;

            if (dist < 320) {
              const force = (320 - dist) / (dist * 40);
              const fx = (dx / dist) * force;
              const fy = (dy / dist) * force;

              if (n1 !== draggedNode) {
                n1.vx -= fx;
                n1.vy -= fy;
              }
              if (n2 !== draggedNode) {
                n2.vx += fx;
                n2.vy += fy;
              }
            }
          }
        }

        // 3. Link Spring Force (Hooke's Law)
        for (let i = 0; i < simEdges.length; i++) {
          const edge = simEdges[i];
          const n1 = edge.sourceNode;
          const n2 = edge.targetNode;
          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const targetDist = edge.type === "CO_ACCUSED" ? 80 : edge.type === "MEMBER_OF" ? 110 : 140;
          const force = (dist - targetDist) * 0.025;

          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          if (n1 !== draggedNode) {
            n1.vx += fx;
            n1.vy += fy;
          }
          if (n2 !== draggedNode) {
            n2.vx -= fx;
            n2.vy -= fy;
          }
        }

        // 4. Update Positions with Velocity Damping
        for (let i = 0; i < simNodes.length; i++) {
          const n = simNodes[i];
          if (n === draggedNode) continue;
          n.vx *= 0.88; // Damping
          n.vy *= 0.88;
          n.x += n.vx;
          n.y += n.vy;

          // Boundary constraints
          n.x = Math.max(n.radius, Math.min(width - n.radius, n.x));
          n.y = Math.max(n.radius, Math.min(height - n.radius, n.y));
        }
      }

      // Draw Canvas Frame
      render();
      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isSimulationActive, draggedNode, zoomLevel, panOffset, selectedNodeId, hoveredNode]);

  // Canvas Render Routine
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    // Apply Zoom and Pan Transformations
    ctx.translate(width / 2 + panOffset.x, height / 2 + panOffset.y);
    ctx.scale(zoomLevel, zoomLevel);
    ctx.translate(-width / 2, -height / 2);

    const simNodes = simNodesRef.current;
    const simEdges = simEdgesRef.current;

    const focusedNode = selectedNodeId || hoveredNode?.id;

    // A. Draw Edges
    for (let i = 0; i < simEdges.length; i++) {
      const edge = simEdges[i];
      const s = edge.sourceNode;
      const t = edge.targetNode;
      if (!s || !t) continue;

      const isEdgeHighlighted = focusedNode && (s.id === focusedNode || t.id === focusedNode);
      const edgeColor = isEdgeHighlighted ? "#f59e0b" : edge.config?.color || "#475569";
      const edgeWidth = isEdgeHighlighted ? 3.5 : edge.config?.width || 1.5;

      ctx.beginPath();
      ctx.strokeStyle = edgeColor;
      ctx.lineWidth = edgeWidth;
      ctx.globalAlpha = isEdgeHighlighted ? 1.0 : focusedNode ? 0.2 : 0.65;

      if (edge.config?.style === "dashed") {
        ctx.setLineDash([5, 5]);
      } else {
        ctx.setLineDash([]);
      }

      ctx.moveTo(s.x, s.y);
      ctx.lineTo(t.x, t.y);
      ctx.stroke();

      // Draw Edge Label for highlighted edges
      if (isEdgeHighlighted) {
        const midX = (s.x + t.x) / 2;
        const midY = (s.y + t.y) / 2;
        ctx.font = "bold 9px monospace";
        ctx.fillStyle = "#f59e0b";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(edge.label, midX, midY - 6);
      }
    }

    ctx.setLineDash([]);
    ctx.globalAlpha = 1.0;

    // B. Draw Nodes
    for (let i = 0; i < simNodes.length; i++) {
      const node = simNodes[i];
      const isSelected = selectedNodeId === node.id;
      const isHovered = hoveredNode?.id === node.id;
      const isNeighbor = focusedNode && simEdges.some((e) => 
        (e.sourceNode.id === focusedNode && e.targetNode.id === node.id) ||
        (e.targetNode.id === focusedNode && e.sourceNode.id === node.id)
      );
      const isDimmed = focusedNode && !isSelected && !isHovered && !isNeighbor;

      ctx.globalAlpha = isDimmed ? 0.2 : 1.0;

      // Glow effect on selected/hovered nodes
      if (isSelected || isHovered) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius + 10, 0, Math.PI * 2);
        ctx.fillStyle = node.colorConfig?.glow || "rgba(59, 130, 246, 0.5)";
        ctx.fill();
      }

      // Outer Circle / Border
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      ctx.fillStyle = node.colorConfig?.base || "#3b82f6";
      ctx.fill();
      ctx.strokeStyle = isSelected ? "#ffffff" : node.colorConfig?.border || "#ffffff";
      ctx.lineWidth = isSelected ? 3.5 : 2;
      ctx.stroke();

      // Badge Icon / Initial
      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${node.radius > 20 ? 12 : 9}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const initial = node.type === "SUSPECT" ? "S" : node.type === "LOCATION" ? "P" : node.type === "COMPLAINANT" ? "C" : "G";
      ctx.fillText(initial, node.x, node.y);

      // Node Name Label
      ctx.font = `bold ${node.type === "SYNDICATE" ? 11 : 10}px sans-serif`;
      ctx.fillStyle = isSelected ? "#ffffff" : isDimmed ? "#94a3b8" : "#f1f5f9";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      
      const displayName = node.alias ? `${node.name} (${node.alias})` : node.name;
      ctx.fillText(displayName.length > 20 ? displayName.slice(0, 18) + "..." : displayName, node.x, node.y + node.radius + 4);

      // Multi-District Badge Pill
      if (node.isCrossDistrict && node.districts && node.districts.length > 1) {
        ctx.fillStyle = "#f59e0b";
        ctx.font = "bold 8px monospace";
        ctx.fillText(`🚨 ${node.districts.length} DISTRICTS`, node.x, node.y - node.radius - 12);
      }
    }

    ctx.restore();
  }, [selectedNodeId, hoveredNode, zoomLevel, panOffset]);

  // Coordinate Conversion (Screen to Canvas Space)
  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    const canvasX = (screenX - (width / 2 + panOffset.x)) / zoomLevel + width / 2;
    const canvasY = (screenY - (height / 2 + panOffset.y)) / zoomLevel + height / 2;

    return { x: canvasX, y: canvasY, screenX, screenY };
  };

  // Find node under cursor
  const findNodeAtCoords = (x, y) => {
    const simNodes = simNodesRef.current;
    for (let i = simNodes.length - 1; i >= 0; i--) {
      const n = simNodes[i];
      const dx = x - n.x;
      const dy = y - n.y;
      if (dx * dx + dy * dy <= (n.radius + 6) * (n.radius + 6)) {
        return n;
      }
    }
    return null;
  };

  const handleMouseDown = (e) => {
    const { x, y, screenX, screenY } = getCanvasCoords(e);
    const node = findNodeAtCoords(x, y);

    if (node) {
      setDraggedNode(node);
      setIsDragging(true);
      onSelectNode(node.id);
    } else {
      setIsDragging(true);
      dragStartRef.current = { x: screenX - panOffset.x, y: screenY - panOffset.y };
    }
  };

  const handleMouseMove = (e) => {
    const { x, y, screenX, screenY } = getCanvasCoords(e);

    if (isDragging) {
      if (draggedNode) {
        draggedNode.x = x;
        draggedNode.y = y;
        draggedNode.vx = 0;
        draggedNode.vy = 0;
      } else {
        setPanOffset({
          x: screenX - dragStartRef.current.x,
          y: screenY - dragStartRef.current.y
        });
      }
    } else {
      const node = findNodeAtCoords(x, y);
      setHoveredNode(node);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedNode(null);
  };  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
    setZoomLevel((prev) => Math.max(0.4, Math.min(3.0, prev * zoomFactor)));
  };

  return (
    <div className="relative w-full h-[640px] bg-[#040916] border border-slate-700/60 rounded-md overflow-hidden shadow-2xl">
      {/* Background blueprint grid */}
      <div 
        className="absolute inset-0 opacity-25 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#1e293b 1px, transparent 1px), radial-gradient(#0f172a 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          backgroundPosition: "0 0, 12px 12px"
        }}
      />

      {/* Main Graph Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        className="w-full h-full cursor-grab active:cursor-grabbing block"
      />

      {/* Canvas Floating Controls */}
      <div 
        className="absolute left-5 bottom-5 flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/70 rounded-md shadow-2xl backdrop-blur-md"
        style={{ padding: "6px 10px" }}
      >
        <button
          onClick={() => setZoomLevel((z) => Math.min(3.0, z * 1.2))}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-sm transition-colors cursor-pointer"
          title="Zoom In"
        >
          <RiZoomInLine className="text-base" />
        </button>
        <button
          onClick={() => setZoomLevel((z) => Math.max(0.4, z / 1.2))}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-sm transition-colors cursor-pointer"
          title="Zoom Out"
        >
          <RiZoomOutLine className="text-base" />
        </button>
        <button
          onClick={() => {
            setZoomLevel(1.0);
            setPanOffset({ x: 0, y: 0 });
          }}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-sm transition-colors cursor-pointer"
          title="Reset Center"
        >
          <RiFocus3Line className="text-base" />
        </button>
        <div className="h-4 w-[1px] bg-slate-700 mx-1" />
        <span className="px-2 font-mono text-[10px] text-slate-300 font-medium">
          {Math.round(zoomLevel * 100)}%
        </span>
      </div>

      {/* Node Legend Box */}
      <div 
        className="absolute right-5 top-5 bg-slate-900/90 border border-slate-700/70 rounded-md shadow-xl backdrop-blur-md text-[11px] space-y-2 hidden sm:block"
        style={{ padding: "14px 16px" }}
      >
        <p className="font-mono text-slate-300 font-bold uppercase text-[9.5px] tracking-wider mb-1">
          Graph Legend
        </p>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500/50" />
          <span className="text-slate-200 font-medium text-[10.5px]">Suspect / Accused</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" />
          <span className="text-slate-200 font-medium text-[10.5px]">Police Station / Unit</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-sm shadow-green-500/50" />
          <span className="text-slate-200 font-medium text-[10.5px]">Complainant / Citizen</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-sm shadow-purple-500/50" />
          <span className="text-slate-200 font-medium text-[10.5px]">Organized Syndicate</span>
        </div>
        <div className="pt-1.5 border-t border-slate-700/60 text-[9.5px] text-amber-300 font-mono flex items-center gap-1">
          <RiInformationLine className="text-xs text-amber-400" />
          <span>Click node for dossier</span>
        </div>
      </div>
    </div>
  );
}
