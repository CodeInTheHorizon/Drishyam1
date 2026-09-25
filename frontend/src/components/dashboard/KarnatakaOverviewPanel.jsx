import React, { useEffect, useRef, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { FaExternalLinkAlt } from "react-icons/fa";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { crimeService } from "../../services/crimeService";
import { recordService } from "../../services/recordService";

// ── Exact same tile layers as InteractiveMap.jsx ──────────────────────────
const MAP_LAYERS = {
  streets: {
    label: "Streets",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  dark: {
    label: "Dark",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
  },
  satellite: {
    label: "Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution:
      "&copy; Esri, Maxar, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN",
  },
};

const KARNATAKA_CENTER = [14.5, 76.2];
const PANEL_ZOOM = 6.5;

// ── Cluster icon (matching concentric rings layout from InteractiveMap) ─────
const createClusterIcon = (districtName, count) => {
  const isCritical = count > 15;
  const isHigh = count > 6;
  const isMedium = count > 2;

  let outerSize, innerSize, bg, borderColor, textColor, outerBg, innerShadow, pulseClass;

  if (isCritical) {
    outerSize = 46; innerSize = 32;
    bg = "rgba(120,25,25,0.92)";
    borderColor = "rgba(239,68,68,0.55)";
    textColor = "#fca5a5";
    outerBg = "rgba(239,68,68,0.14)";
    innerShadow = "0 2px 10px rgba(239,68,68,0.3), 0 1px 4px rgba(0,0,0,0.7), inset 0 0.5px 0 rgba(255,255,255,0.06)";
    pulseClass = "situation-pulse";
  } else if (isHigh) {
    outerSize = 40; innerSize = 28;
    bg = "rgba(113,47,10,0.92)";
    borderColor = "rgba(245,158,11,0.5)";
    textColor = "#fcd34d";
    outerBg = "rgba(245,158,11,0.12)";
    innerShadow = "0 2px 8px rgba(245,158,11,0.25), 0 1px 4px rgba(0,0,0,0.7), inset 0 0.5px 0 rgba(255,255,255,0.05)";
    pulseClass = "";
  } else if (isMedium) {
    outerSize = 34; innerSize = 24;
    bg = "rgba(23,52,130,0.92)";
    borderColor = "rgba(59,130,246,0.45)";
    textColor = "#93c5fd";
    outerBg = "rgba(59,130,246,0.1)";
    innerShadow = "0 2px 6px rgba(59,130,246,0.2), 0 1px 4px rgba(0,0,0,0.7), inset 0 0.5px 0 rgba(255,255,255,0.05)";
    pulseClass = "";
  } else {
    outerSize = 28; innerSize = 20;
    bg = "rgba(30,41,59,0.92)";
    borderColor = "rgba(100,116,139,0.45)";
    textColor = "#cbd5e1";
    outerBg = "rgba(100,116,139,0.1)";
    innerShadow = "0 2px 5px rgba(100,116,139,0.2), 0 1px 3px rgba(0,0,0,0.7), inset 0 0.5px 0 rgba(255,255,255,0.05)";
    pulseClass = "";
  }

  return L.divIcon({
    className: `custom-cluster-icon ${pulseClass}`,
    html: `
      <div style="
        position:relative;
        display:flex;
        align-items:center;
        justify-content:center;
        width:${outerSize}px;height:${outerSize}px;
        border-radius:50%;
        background:${outerBg};
      ">
        <div style="
          display:flex;flex-direction:column;align-items:center;justify-content:center;
          width:${innerSize}px;height:${innerSize}px;
          border-radius:50%;
          background:${bg};
          border:1.25px solid ${borderColor};
          box-shadow:${innerShadow};
        ">
          <span style="font-family:'Space Grotesk',sans-serif;font-size:10px;font-weight:700;color:${textColor};line-height:1;letter-spacing:-0.02em;">${count}</span>
          <span style="font-family:'Space Grotesk',sans-serif;font-size:5px;text-transform:uppercase;color:${textColor};opacity:0.6;letter-spacing:0.08em;margin-top:1.5px;">${districtName.slice(0, 3)}</span>
        </div>
      </div>
    `,
    iconSize: [outerSize, outerSize],
    iconAnchor: [outerSize / 2, outerSize / 2]
  });
};

// ── Individual incident marker ─────────────────────────────────────────────
const createIncidentIcon = (severity) => {
  const isCritical = severity === "CRITICAL";

  const palette = {
    CRITICAL: { dot: "#ef4444", glow: "rgba(239,68,68,0.22)", glowDark: "rgba(239,68,68,0.1)", shadow: "rgba(239,68,68,0.5)" },
    HIGH: { dot: "#f59e0b", glow: "rgba(245,158,11,0.18)", glowDark: "rgba(245,158,11,0.08)", shadow: "rgba(245,158,11,0.4)" },
    MEDIUM: { dot: "#3b82f6", glow: "rgba(59,130,246,0.18)", glowDark: "rgba(59,130,246,0.08)", shadow: "rgba(59,130,246,0.4)" },
    LOW: { dot: "#64748b", glow: "rgba(100,116,139,0.12)", glowDark: "rgba(100,116,139,0.06)", shadow: "rgba(100,116,139,0.3)" },
  };

  const c = palette[severity] || palette.LOW;
  const glowRing = isCritical
    ? `<span class="critical-glow-ring" style="position:absolute;inset:-5px;border-radius:50%;background:radial-gradient(circle, ${c.glow} 0%, transparent 70%);"></span>`
    : `<span style="position:absolute;inset:-3px;border-radius:50%;background:radial-gradient(circle, ${c.glowDark} 0%, transparent 70%);"></span>`;

  return L.divIcon({
    className: "custom-leaflet-marker",
    html: `
      <div style="position:relative;display:flex;align-items:center;justify-content:center;width:18px;height:18px;">
        ${glowRing}
        <span style="
          position:relative;
          display:block;
          width:7px;height:7px;
          border-radius:50%;
          background:${c.dot};
          border:1.25px solid rgba(255,255,255,0.6);
          box-shadow:0 0 6px ${c.shadow}, 0 1px 4px rgba(0,0,0,0.5);
        "></span>
      </div>
    `,
    iconSize: [18, 18],
    iconAnchor: [9, 9]
  });
};

// Generates an inverted polygon mask covering the entire world except Karnataka
const createMaskGeoJSON = (karnatakaGeoJSON) => {
  const worldCoords = [
    [-180, -90],
    [-180, 90],
    [180, 90],
    [180, -90],
    [-180, -90]
  ];

  const feature = karnatakaGeoJSON.features?.[0];
  if (!feature || !feature.geometry) return null;

  const rings = [worldCoords];

  if (feature.geometry.type === "Polygon") {
    feature.geometry.coordinates.forEach(ring => {
      rings.push(ring);
    });
  } else if (feature.geometry.type === "MultiPolygon") {
    feature.geometry.coordinates.forEach(poly => {
      poly.forEach(ring => {
        rings.push(ring);
      });
    });
  }

  return {
    type: "FeatureCollection",
    features: [{
      type: "Feature",
      properties: {},
      geometry: {
        type: "Polygon",
        coordinates: rings
      }
    }]
  };
};

// ─────────────────────────────────────────────────────────────────────────────
const KarnatakaOverviewPanel = () => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markersLayerRef = useRef(null);
  const zoomRef = useRef(PANEL_ZOOM);

  const [tick, setTick] = useState(0);
  const [activeLayer, setActiveLayer] = useState("streets");
  const [zoomLevel, setZoomLevel] = useState(PANEL_ZOOM);
  const [boundariesLoaded, setBoundariesLoaded] = useState(false);

  // Live sync with recordService
  useEffect(() => {
    const unsub = recordService.subscribe(() => setTick((t) => t + 1));
    return () => unsub();
  }, []);

  // Live incidents
  const incidents = useMemo(() => crimeService.getIncidents(), [tick]);

  // Stats
  const hotspots = useMemo(() => crimeService.getHotspotDistricts(incidents), [incidents]);
  const activeCount = useMemo(
    () => incidents.filter((i) => i.status !== "Case Closed / Completed").length,
    [incidents]
  );
  const highCount = incidents.filter(
    (i) => i.severity === "CRITICAL" || i.severity === "HIGH"
  ).length;

  // ── Initialize Leaflet map once ──────────────────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: KARNATAKA_CENTER,
      zoom: PANEL_ZOOM,
      zoomControl: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      dragging: true,
      touchZoom: true,
      keyboard: true,
      attributionControl: false,
    });

    // Style the default zoom control to match the dark theme
    map.zoomControl.setPosition("bottomright");

    // Initial tile layer
    const tile = L.tileLayer(MAP_LAYERS.streets.url, {
      attribution: MAP_LAYERS.streets.attribution,
      maxZoom: 19,
    }).addTo(map);
    tileLayerRef.current = tile;

    let isMounted = true;

    // Load boundaries asynchronously
    Promise.all([
      fetch("/karnataka-state.geojson").then(res => res.json()),
      fetch("/karnataka-districts.geojson").then(res => res.json())
    ]).then(([stateData, districtsData]) => {
      if (!isMounted || !mapRef.current) return;
      // 1. World mask (strongly fades all other states outside Karnataka)
      const maskGeo = createMaskGeoJSON(stateData);
      if (maskGeo) {
        L.geoJSON(maskGeo, {
          style: {
            fillColor: "#020617",
            fillOpacity: 0.84,
            stroke: false
          },
          interactive: false
        }).addTo(map);
      }

      // 2. Districts subtle lines
      L.geoJSON(districtsData, {
        style: {
          color: "rgba(255, 255, 255, 0.12)",
          weight: 0.8,
          opacity: 0.6,
          fill: false
        },
        interactive: false
      }).addTo(map);

      // 3. Karnataka State Fill Highlight (spotlight effect)
      L.geoJSON(stateData, {
        style: {
          fillColor: "#ffffff",
          fillOpacity: 0.22,
          stroke: false
        },
        interactive: false
      }).addTo(map);

      // 4. State boundary glow outer
      L.geoJSON(stateData, {
        style: {
          color: "#2563eb",
          weight: 12,
          opacity: 0.5,
          fill: false,
          lineCap: "round",
          lineJoin: "round"
        },
        interactive: false
      }).addTo(map);

      // State boundary glow mid
      L.geoJSON(stateData, {
        style: {
          color: "#3b82f6",
          weight: 6,
          opacity: 0.8,
          fill: false,
          lineCap: "round",
          lineJoin: "round"
        },
        interactive: false
      }).addTo(map);

      // 5. Thin bright neon blue boundary stroke across Karnataka state
      L.geoJSON(stateData, {
        style: {
          color: "#93c5fd",
          weight: 2.5,
          opacity: 1,
          fill: false,
          lineCap: "round",
          lineJoin: "round"
        },
        interactive: false
      }).addTo(map);

      // Stagger markers fade in after boundaries render
      setTimeout(() => {
        if (isMounted) setBoundariesLoaded(true);
      }, 350);
    }).catch(err => {
      console.error("Error loading dashboard boundaries:", err);
      if (isMounted) setBoundariesLoaded(true); // Fallback
    });

    // Markers layer
    markersLayerRef.current = L.layerGroup().addTo(map);

    // Track zoom for cluster/marker switching
    map.on("zoomend", () => {
      if (!isMounted) return;
      zoomRef.current = map.getZoom();
      setZoomLevel(map.getZoom());
    });

    mapRef.current = map;

    return () => {
      isMounted = false;
      map.remove();
      mapRef.current = null;
      tileLayerRef.current = null;
      markersLayerRef.current = null;
    };
  }, []);

  // ── Swap tile layer when activeLayer changes ─────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !tileLayerRef.current) return;
    mapRef.current.removeLayer(tileLayerRef.current);
    const newTile = L.tileLayer(MAP_LAYERS[activeLayer].url, {
      attribution: MAP_LAYERS[activeLayer].attribution,
      maxZoom: 19,
    }).addTo(mapRef.current);
    tileLayerRef.current = newTile;
    // ensure markers stay on top
    if (markersLayerRef.current) markersLayerRef.current.bringToFront?.();
  }, [activeLayer]);

  // ── Re-render markers on incidents change or zoom change ─────────────────
  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current || !boundariesLoaded) return;
    markersLayerRef.current.clearLayers();

    const showClusters = zoomLevel < 8.2;

    if (showClusters) {
      // District clusters
      const clusters = {};
      incidents.forEach((inc) => {
        const dName = inc.district || "Bengaluru City";
        const lat = Number(inc.lat) || inc.districtCenter?.lat || 12.9716;
        const lng = Number(inc.lng) || inc.districtCenter?.lng || 77.5946;
        if (!clusters[dName]) {
          clusters[dName] = {
            count: 0,
            lat: inc.districtCenter?.lat || lat,
            lng: inc.districtCenter?.lng || lng,
          };
        }
        clusters[dName].count++;
      });

      Object.entries(clusters).forEach(([district, data]) => {
        const districtIncs = incidents.filter(i => (i.district || "Bengaluru City") === district);
        const categories = {};
        districtIncs.forEach(inc => {
          const cat = inc.type || "General";
          categories[cat] = (categories[cat] || 0) + 1;
        });
        const topCategory = Object.entries(categories).sort((a,b) => b[1] - a[1])[0]?.[0] || "Property Offences";
        const isCritical = data.count > 15;
        const isHigh = data.count > 6;
        const isMedium = data.count > 2;
        const riskLabel = isCritical ? "CRITICAL" : isHigh ? "HIGH" : isMedium ? "MEDIUM" : "LOW";
        const riskColor = isCritical ? "#ef4444" : isHigh ? "#f59e0b" : isMedium ? "#3b82f6" : "#94a3b8";

        const tooltipHTML = `
          <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;padding:6px 8px;background:rgba(2,6,23,0.96);border:1px solid rgba(51,65,85,0.8);border-radius:4px;color:#f8fafc;min-width:150px;box-shadow:0 10px 25px rgba(0,0,0,0.5);">
            <div style="font-weight:bold;color:#38bdf8;text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid rgba(51,65,85,0.6);padding-bottom:3px;margin-bottom:4px;">${district}</div>
            <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
              <span style="color:#94a3b8;">Total Cases:</span>
              <span style="font-weight:bold;color:#ffffff;">${data.count} FIRs</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
              <span style="color:#94a3b8;">Top Crime:</span>
              <span style="font-weight:bold;color:#fcd34d;">${topCategory}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
              <span style="color:#94a3b8;">Risk Index:</span>
              <span style="font-weight:bold;color:${riskColor};">${riskLabel}</span>
            </div>
          </div>
        `;

        L.marker([data.lat, data.lng], { icon: createClusterIcon(district, data.count) })
          .bindTooltip(tooltipHTML, { direction: "top", offset: [0, -10], opacity: 1 })
          .addTo(markersLayerRef.current);
      });
    } else {
      // Individual incident pins
      incidents.forEach((inc) => {
        L.marker([inc.lat, inc.lng], { icon: createIncidentIcon(inc.severity) })
          .bindTooltip(
            `<span style="font-family:'IBM Plex Mono',monospace;font-size:9px;text-transform:uppercase;">${inc.caseNo} · ${inc.severity} · ${inc.type || 'Incident'}</span>`,
            { direction: "top", offset: [0, -6], opacity: 1 }
          )
          .addTo(markersLayerRef.current);
      });
    }
  }, [incidents, zoomLevel, boundariesLoaded]);

  return (
    <div className="rounded-md border border-slate-700/60 bg-slate-900/85 backdrop-blur-md shadow-xl overflow-hidden flex flex-col font-sans">

      {/* ── Header ── */}
      <div 
        className="flex items-center justify-between border-b border-slate-700/50"
        style={{ padding: "18px 22px" }}
      >
        <div>
          <h2 className="text-sm font-bold text-white tracking-tight font-sans">
            Karnataka Live Crime Map
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5 font-sans">
            {zoomLevel < 8.2 ? "District Overview" : "Street-Level Incidents"} · Live Feed
          </p>
        </div>
      </div>

      {/* ── Map ── */}
      <div className="relative bg-[#020617]" style={{ height: "360px" }}>
        <div ref={mapContainerRef} style={{ height: "100%", width: "100%" }} />

        {/* ── Layer Switcher (same as Crime Map) ── */}
        <div className="absolute top-3 right-3 z-[1000] flex items-center gap-2 bg-slate-900/90 backdrop-blur-sm border border-slate-800/60 rounded-md p-1.5 shadow-xl font-mono">
          {Object.entries(MAP_LAYERS).map(([key, layer]) => (
            <button
              key={key}
              onClick={() => setActiveLayer(key)}
              className={`px-3 py-1 rounded text-[10px] font-semibold transition-all duration-200 ease-in-out uppercase tracking-wider cursor-pointer ${
                activeLayer === key
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30 font-bold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              {layer.label}
            </button>
          ))}
        </div>

        {/* ── Live badge ── */}
        <div className="absolute top-3 left-3 z-[1000] flex items-center gap-2 bg-slate-950/80 backdrop-blur-sm border border-slate-800/50 rounded-sm px-2.5 py-1 pointer-events-none font-mono">
          <span className="relative flex h-1.5 w-1.5">
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
          </span>
          <span className="text-[9px] text-emerald-400 font-semibold uppercase tracking-wider">
            LIVE · {incidents.length} FIRs
          </span>
        </div>
      </div>

      {/* ── Stats Bar ── */}
      <div 
        className="border-t border-slate-700/50 bg-slate-950/60 grid grid-cols-3 divide-x divide-slate-700/50 font-mono text-xs"
        style={{ padding: "14px 22px" }}
      >
        <div className="pr-4">
          <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-mono">ACTIVE</span>
          <span className="text-amber-400 font-bold text-sm leading-tight tabular-nums font-mono">{activeCount}</span>
        </div>
        <div className="px-4">
          <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-mono">HIGH RISK</span>
          <span className="text-red-400 font-bold text-sm leading-tight tabular-nums font-mono">{highCount}</span>
        </div>
        <div className="pl-4">
          <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-mono">HOTSPOTS</span>
          <span className="text-blue-400 font-bold text-sm leading-tight tabular-nums font-mono">{hotspots.length} Districts</span>
        </div>
      </div>

      {/* ── Footer CTA ── */}
      <div 
        className="border-t border-slate-700/50 flex items-center justify-between font-mono bg-slate-950/90"
        style={{ padding: "14px 22px" }}
      >
        <span className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">COMMAND GIS OVERVIEW</span>
        <Link
          to="/map"
          className="flex items-center gap-2 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-all duration-200 ease-in-out uppercase tracking-wider group"
        >
          Go to Crime Map <span className="group-hover:translate-x-1 transition-transform duration-200 ease-in-out">&rarr;</span>
        </Link>
      </div>
    </div>
  );
};

export default KarnatakaOverviewPanel;
