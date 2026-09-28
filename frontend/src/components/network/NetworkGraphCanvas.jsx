import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { 
  RiZoomInLine, 
  RiZoomOutLine, 
  RiFullscreenLine, 
  RiFocus3Line,
  RiInformationLine,
  RiRouteLine
} from "react-icons/ri";
import { traceMuleFlowPath } from "../../services/forensicCorrelationService";

export default function NetworkGraphCanvas({
  nodes,
  edges,
  selectedNodeId,
  onSelectNode,
  isSimulationActive,
  zoomLevel,
  setZoomLevel,
  panOffset,
  setPanOffset,
  analysisMode = "CCTNS"
}) {
  const canvasRef = useRef(null);
  const simNodesRef = useRef([]);
  const simEdgesRef = useRef([]);

  const [hoveredNode, setHoveredNode] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNode, setDraggedNode] = useState(null);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Compute Active Mule Trail Path (if in Forensic mode and a node is focused/selected)
  const { pathNodeIds, pathEdgeIds } = useMemo(() => {
    if (analysisMode === "FORENSIC" && selectedNodeId) {
      return traceMuleFlowPath(selectedNodeId, nodes, edges);
    }
    return { pathNodeIds: new Set(), pathEdgeIds: new Set() };
  }, [analysisMode, selectedNodeId, nodes, edges]);

  // Synchronize simulation nodes and edges with incoming dataset
  useEffect(() => {
    const existingMap = new Map(simNodesRef.current.map((n) => [n.id, n]));
    const canvas = canvasRef.current;
    const width = canvas?.clientWidth || 900;
    const height = canvas?.clientHeight || 600;

    const newSimNodes = nodes.map((node, idx) => {
      let r = 18;
      if (node.type === "SYNDICATE") r = 28;
      else if (node.type === "VICTIM" || node.type === "CASHOUT") r = 24;
      else if (node.type === "L1_MULE" || node.type === "L2_MULE" || node.type === "SUSPECT") r = 22;
      else if (node.type === "MALWARE_APK" || node.type === "C2_SERVER") r = 22;

      if (existingMap.has(node.id)) {
        const existing = existingMap.get(node.id);
        return {
          ...node,
          x: existing.x,
          y: existing.y,
          vx: existing.vx || 0,
          vy: existing.vy || 0,
          radius: r
        };
      }

      // Initial placement heuristic: if forensic, arrange horizontally by layer
      let initX = width / 2;
      let initY = height / 2;

      if (analysisMode === "FORENSIC") {
        if (node.type === "VICTIM") {
          initX = width * 0.16;
          initY = height * 0.35 + (idx % 3) * 80;
        } else if (node.type === "L1_MULE") {
          initX = width * 0.38;
          initY = height * 0.35 + (idx % 3) * 90;
        } else if (node.type === "L2_MULE") {
          initX = width * 0.60;
          initY = height * 0.30 + (idx % 4) * 90;
        } else if (node.type === "CASHOUT") {
          initX = width * 0.84;
          initY = height * 0.35 + (idx % 3) * 90;
        } else if (node.type === "EMAIL_SPOOF") {
          initX = width * 0.18;
          initY = height * 0.72;
        } else if (node.type === "MALWARE_APK") {
          initX = width * 0.36;
          initY = height * 0.75;
        } else if (node.type === "C2_SERVER") {
          initX = width * 0.54;
          initY = height * 0.78;
        } else if (node.type === "PHONE") {
          initX = width * 0.72;
          initY = height * 0.72 + (idx % 3) * 70;
        } else if (node.type === "IMEI") {
          initX = width * 0.88;
          initY = height * 0.72;
        } else {
          initX = width * 0.5 + (Math.random() - 0.5) * 200;
          initY = height * 0.5 + (Math.random() - 0.5) * 200;
        }
      } else {
        const angle = (idx / Math.max(1, nodes.length)) * Math.PI * 2;
        const dist = 120 + (idx % 4) * 60;
        initX = width / 2 + Math.cos(angle) * dist;
        initY = height / 2 + Math.sin(angle) * dist;
      }

      return {
        ...node,
        x: initX + (Math.random() - 0.5) * 30,
        y: initY + (Math.random() - 0.5) * 30,
        vx: 0,
        vy: 0,
        radius: r
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
  }, [nodes, edges, analysisMode]);

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
          n.vx += (centerX - n.x) * 0.0006;
          n.vy += (centerY - n.y) * 0.0006;
        }

        // 2. Node Repulsion (Coulomb Force)
        for (let i = 0; i < simNodes.length; i++) {
          const n1 = simNodes[i];
          for (let j = i + 1; j < simNodes.length; j++) {
            const n2 = simNodes[j];
            const dx = n2.x - n1.x;
            const dy = n2.y - n1.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const minDist = (n1.radius + n2.radius) * 2.8;

            if (dist < 320) {
              const force = (320 - dist) / (dist * 45);
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
          const targetDist = edge.type === "FUNDS_FLOW" ? 130 : edge.type === "CO_ACCUSED" ? 85 : 120;
          const force = (dist - targetDist) * 0.022;

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
          n.vx *= 0.86;
          n.vy *= 0.86;
          n.x += n.vx;
          n.y += n.vy;

          n.x = Math.max(n.radius, Math.min(width - n.radius, n.x));
          n.y = Math.max(n.radius, Math.min(height - n.radius, n.y));
        }
      }

      render();
      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isSimulationActive, draggedNode, zoomLevel, panOffset, selectedNodeId, hoveredNode, pathNodeIds, pathEdgeIds]);

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
    const hasPathHighlight = pathNodeIds.size > 0;
    const nowTime = Date.now();

    // ========================================================================
    // A. Draw Edges
    // ========================================================================
    for (let i = 0; i < simEdges.length; i++) {
      const edge = simEdges[i];
      const s = edge.sourceNode;
      const t = edge.targetNode;
      if (!s || !t) continue;

      const isPathEdge = pathEdgeIds.has(edge.id);
      const isDirectlyFocused = focusedNode && (s.id === focusedNode || t.id === focusedNode);
      const isEdgeHighlighted = isPathEdge || isDirectlyFocused;

      const edgeColor = isPathEdge ? "#10b981" : isDirectlyFocused ? "#f59e0b" : edge.config?.color || "#475569";
      const edgeWidth = isEdgeHighlighted ? 3.6 : edge.config?.width || 1.8;

      ctx.beginPath();
      ctx.strokeStyle = edgeColor;
      ctx.lineWidth = edgeWidth;
      ctx.globalAlpha = hasPathHighlight ? (isPathEdge ? 1.0 : 0.15) : (focusedNode ? (isDirectlyFocused ? 1.0 : 0.2) : 0.7);

      if (edge.config?.style === "dashed") {
        ctx.setLineDash([6, 5]);
      } else {
        ctx.setLineDash([]);
      }

      ctx.moveTo(s.x, s.y);
      ctx.lineTo(t.x, t.y);
      ctx.stroke();

      // Draw Directional Arrowhead
      const isDirectional = edge.config?.isDirectional || analysisMode === "FORENSIC";
      if (isDirectional) {
        const dx = t.x - s.x;
        const dy = t.y - s.y;
        const angle = Math.atan2(dy, dx);
        const arrowLen = 10;
        const targetRadius = t.radius + 3;
        const ax = t.x - Math.cos(angle) * targetRadius;
        const ay = t.y - Math.sin(angle) * targetRadius;

        ctx.fillStyle = edgeColor;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(
          ax - arrowLen * Math.cos(angle - Math.PI / 6),
          ay - arrowLen * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          ax - arrowLen * Math.cos(angle + Math.PI / 6),
          ay - arrowLen * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();
      }

      // Draw Animated Money Flow Pulses along Funds Flow Edges
      if (edge.type === "FUNDS_FLOW" && (!hasPathHighlight || isPathEdge)) {
        const pulseProgress = ((nowTime / 1400 + i * 0.25) % 1.0);
        const px = s.x + (t.x - s.x) * pulseProgress;
        const py = s.y + (t.y - s.y) * pulseProgress;

        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#34d399";
        ctx.shadowColor = "#10b981";
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Draw Edge Label for highlighted edges
      if (isEdgeHighlighted || (analysisMode === "FORENSIC" && edge.type === "FUNDS_FLOW")) {
        const midX = (s.x + t.x) / 2;
        const midY = (s.y + t.y) / 2;
        ctx.font = "bold 9.5px monospace";
        ctx.fillStyle = isPathEdge ? "#34d399" : isDirectlyFocused ? "#f59e0b" : "#cbd5e1";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(edge.label, midX, midY - 7);
      }
    }

    ctx.setLineDash([]);
    ctx.globalAlpha = 1.0;

    // ========================================================================
    // B. Draw Nodes
    // ========================================================================
    for (let i = 0; i < simNodes.length; i++) {
      const node = simNodes[i];
      const isSelected = selectedNodeId === node.id;
      const isHovered = hoveredNode?.id === node.id;
      const isInPath = pathNodeIds.has(node.id);
      const isNeighbor = focusedNode && simEdges.some((e) => 
        (e.sourceNode.id === focusedNode && e.targetNode.id === node.id) ||
        (e.targetNode.id === focusedNode && e.sourceNode.id === node.id)
      );

      const isDimmed = hasPathHighlight 
        ? !isInPath 
        : (focusedNode && !isSelected && !isHovered && !isNeighbor);

      ctx.globalAlpha = isDimmed ? 0.18 : 1.0;

      // Glow effect on selected/hovered/path nodes
      // Pulsing Critical Risk Halo (Feature 4: Triage Visual Indicator)
      if (node.riskScore && node.riskScore >= 85 && !isDimmed) {
        const pulse = (Math.sin(Date.now() / 240) + 1) / 2;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius + 5 + pulse * 7, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(239, 68, 68, ${0.35 + pulse * 0.5})`;
        ctx.lineWidth = 2.2;
        ctx.stroke();
      }

      // Glow effect on selected/hovered/path nodes
      if (isSelected || isHovered || (isInPath && hasPathHighlight)) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius + (isSelected ? 12 : 8), 0, Math.PI * 2);
        ctx.fillStyle = isSelected 
          ? "rgba(245, 158, 11, 0.5)" 
          : (isInPath ? "rgba(16, 185, 129, 0.4)" : node.colorConfig?.glow || "rgba(59, 130, 246, 0.5)");
        ctx.fill();
      }

      // Node Body Circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      ctx.fillStyle = node.colorConfig?.base || "#3b82f6";
      ctx.fill();
      ctx.strokeStyle = isSelected ? "#ffffff" : isInPath ? "#34d399" : node.colorConfig?.border || "#ffffff";
      ctx.lineWidth = isSelected ? 3.5 : isInPath ? 2.8 : 2;
      ctx.stroke();

      // Letter Badge Icon Inside Circle
      let badge = node.colorConfig?.badge;
      if (!badge) {
        if (node.type === "SUSPECT") badge = "S";
        else if (node.type === "LOCATION") badge = "P";
        else if (node.type === "COMPLAINANT") badge = "C";
        else badge = "G";
      }

      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${node.radius > 20 ? 11 : 9}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(badge, node.x, node.y);

      // Node Primary Display Name
      ctx.font = `bold ${node.type === "SYNDICATE" ? 11.5 : 10.5}px sans-serif`;
      ctx.fillStyle = isSelected ? "#ffffff" : isDimmed ? "#94a3b8" : "#f8fafc";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      
      const displayName = node.name || node.id;
      ctx.fillText(
        displayName.length > 22 ? displayName.slice(0, 20) + "..." : displayName, 
        node.x, 
        node.y + node.radius + 4
      );

      // Turnaround Velocity Badge (if rapid multi-hop detected)
      if (node.turnaroundFormatted && !isDimmed) {
        const velText = `⚡ ${node.turnaroundFormatted}`;
        ctx.font = "bold 7.5px monospace";
        const velWidth = ctx.measureText(velText).width + 6;
        const velX = node.x - velWidth / 2;
        const velY = node.y + node.radius + 18;

        ctx.fillStyle = "rgba(245, 158, 11, 0.9)";
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(velX, velY, velWidth, 12, 3);
        else ctx.rect(velX, velY, velWidth, 12);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(velText, node.x, velY + 6);
      }

      // Risk Score Pill Banner (if riskScore >= 65)
      if (node.riskScore && node.riskScore >= 65 && !isDimmed) {
        const isCrit = node.riskScore >= 85;
        const pillText = isCrit ? `🚨 CRIT ${node.riskScore}%` : `RISK ${node.riskScore}%`;
        ctx.font = "bold 8px monospace";
        const textWidth = ctx.measureText(pillText).width;
        const pillWidth = textWidth + 8;
        const pillHeight = 13;
        const pillX = node.x - pillWidth / 2;
        const pillY = node.y - node.radius - 16;

        ctx.fillStyle = isCrit ? "rgba(220, 38, 38, 0.95)" : "rgba(234, 88, 12, 0.95)";
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(pillX, pillY, pillWidth, pillHeight, 3);
        } else {
          ctx.rect(pillX, pillY, pillWidth, pillHeight);
        }
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(pillText, node.x, pillY + pillHeight / 2);
      }

      // Multi-District Badge Pill (for CCTNS mode)
      if (node.isCrossDistrict && node.districts && node.districts.length > 1 && !isDimmed) {
        ctx.fillStyle = "#f59e0b";
        ctx.font = "bold 8px monospace";
        ctx.fillText(`🚨 ${node.districts.length} DISTRICTS`, node.x, node.y - node.radius - 12);
      }
    }

    ctx.restore();
  }, [selectedNodeId, hoveredNode, zoomLevel, panOffset, pathNodeIds, pathEdgeIds, analysisMode]);

  // Coordinate Calculation Helper
  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, screenX: 0, screenY: 0 };
    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    const x = (screenX - width / 2 - panOffset.x) / zoomLevel + width / 2;
    const y = (screenY - height / 2 - panOffset.y) / zoomLevel + height / 2;

    return { x, y, screenX, screenY };
  };

  const findNodeAtCoords = (x, y) => {
    const simNodes = simNodesRef.current;
    for (let i = simNodes.length - 1; i >= 0; i--) {
      const node = simNodes[i];
      const dx = node.x - x;
      const dy = node.y - y;
      if (dx * dx + dy * dy <= (node.radius + 6) * (node.radius + 6)) {
        return node;
      }
    }
    return null;
  };

  const handleMouseDown = (e) => {
    const { x, y, screenX, screenY } = getCanvasCoords(e);
    const clickedNode = findNodeAtCoords(x, y);

    if (clickedNode) {
      setDraggedNode(clickedNode);
      onSelectNode?.(clickedNode.id);
    } else {
      setIsDragging(true);
      dragStartRef.current = { x: screenX - panOffset.x, y: screenY - panOffset.y };
      onSelectNode?.(null);
    }
  };

  const handleMouseMove = (e) => {
    const { x, y, screenX, screenY } = getCanvasCoords(e);

    if (draggedNode) {
      draggedNode.x = x;
      draggedNode.y = y;
      draggedNode.vx = 0;
      draggedNode.vy = 0;
    } else if (isDragging) {
      setPanOffset({
        x: screenX - dragStartRef.current.x,
        y: screenY - dragStartRef.current.y
      });
    } else {
      const node = findNodeAtCoords(x, y);
      setHoveredNode(node);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedNode(null);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
    setZoomLevel((prev) => Math.max(0.35, Math.min(3.2, prev * zoomFactor)));
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

      {/* Path Highlighting Indicator Banner */}
      {analysisMode === "FORENSIC" && pathNodeIds.size > 0 && (
        <div className="absolute left-5 top-5 bg-emerald-950/90 border border-emerald-500/60 rounded-lg px-3.5 py-2 shadow-xl backdrop-blur-md flex items-center gap-2 text-xs text-emerald-300 font-mono animate-fadeIn">
          <RiRouteLine className="text-base text-emerald-400" />
          <span>Active Flow Trail Highlighted ({pathNodeIds.size} Nodes, {pathEdgeIds.size} Hops)</span>
          <button
            onClick={() => onSelectNode?.(null)}
            className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/60 cursor-pointer"
          >
            Clear
          </button>
        </div>
      )}

      {/* Canvas Floating Controls */}
      <div 
        className="absolute left-5 bottom-5 flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/70 rounded-md shadow-2xl backdrop-blur-md"
        style={{ padding: "6px 10px" }}
      >
        <button
          onClick={() => setZoomLevel((z) => Math.min(3.2, z * 1.2))}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-sm transition-colors cursor-pointer"
          title="Zoom In"
        >
          <RiZoomInLine className="text-base" />
        </button>
        <button
          onClick={() => setZoomLevel((z) => Math.max(0.35, z / 1.2))}
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
        className="absolute right-5 top-5 bg-slate-900/90 border border-slate-700/70 rounded-md shadow-xl backdrop-blur-md text-[11px] space-y-1.5 hidden sm:block max-w-[220px]"
        style={{ padding: "14px 16px" }}
      >
        {analysisMode === "FORENSIC" ? (
          <>
            <div className="flex items-center justify-between mb-1 pb-1 border-b border-slate-800">
              <p className="font-mono text-slate-300 font-bold uppercase text-[9.5px] tracking-wider">
                Forensic Entity Legend
              </p>
              <span className="text-[8px] px-1 rounded bg-emerald-500/20 text-emerald-300 font-mono">DIRECTIONAL</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
              <span className="text-slate-200 font-medium text-[10px]">Victim Remitter</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
              <span className="text-slate-200 font-medium text-[10px]">Layer-1 Mule Account</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm shadow-orange-500/50" />
              <span className="text-slate-200 font-medium text-[10px]">Layer-2 Mule Account</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 shadow-sm shadow-red-600/50" />
              <span className="text-slate-200 font-medium text-[10px]">Cash-Out Point (ATM/Crypto)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" />
              <span className="text-slate-200 font-medium text-[10px]">Suspect Phone (MSISDN)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-sm shadow-purple-500/50" />
              <span className="text-slate-200 font-medium text-[10px]">Shared Device (IMEI)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 shadow-sm shadow-rose-600/50" />
              <span className="text-slate-200 font-medium text-[10px]">C2 Server / Drop IP</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-fuchsia-500 shadow-sm shadow-fuchsia-500/50" />
              <span className="text-slate-200 font-medium text-[10px]">Banking Trojan APK</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 shadow-sm shadow-yellow-500/50" />
              <span className="text-slate-200 font-medium text-[10px]">Phishing Email Header</span>
            </div>
          </>
        ) : (
          <>
            <p className="font-mono text-slate-300 font-bold uppercase text-[9.5px] tracking-wider mb-1">
              CCTNS Crime Legend
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
          </>
        )}
        <div className="pt-1.5 border-t border-slate-700/60 text-[9.5px] text-amber-300 font-mono flex items-center gap-1">
          <RiInformationLine className="text-xs text-amber-400" />
          <span>Click node to trace trail</span>
        </div>
      </div>
    </div>
  );
}
