import React, { useState, useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Tooltip, GeoJSON, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { FaCalendarAlt, FaUser, FaBuilding } from "react-icons/fa";

// Tile Layer details
const MAP_TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const MAP_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

// Map center of Karnataka
const KARNATAKA_CENTER = [14.5, 76.2];
const DEFAULT_ZOOM = 7.2;

// Custom Marker styling based on Severity
const getMarkerColorClass = (severity) => {
  switch (severity) {
    case "CRITICAL": return "bg-red-500";
    case "HIGH": return "bg-amber-500";
    case "MEDIUM": return "bg-blue-500";
    case "LOW":
    default: return "bg-slate-400";
  }
};

const createCustomMarker = (incident) => {
  const isCritical = incident.severity === "CRITICAL";

  const palette = {
    CRITICAL: { dot: "#ef4444", glow: "rgba(239,68,68,0.22)", glowDark: "rgba(239,68,68,0.1)", shadow: "rgba(239,68,68,0.5)" },
    HIGH:     { dot: "#f59e0b", glow: "rgba(245,158,11,0.18)", glowDark: "rgba(245,158,11,0.08)", shadow: "rgba(245,158,11,0.4)" },
    MEDIUM:   { dot: "#3b82f6", glow: "rgba(59,130,246,0.18)", glowDark: "rgba(59,130,246,0.08)", shadow: "rgba(59,130,246,0.4)" },
    LOW:      { dot: "#64748b", glow: "rgba(100,116,139,0.12)", glowDark: "rgba(100,116,139,0.06)", shadow: "rgba(100,116,139,0.3)" },
  };

  const c = palette[incident.severity] || palette.LOW;

  // Outer glow ring — only animates for CRITICAL
  const glowRing = isCritical
    ? `<span class="critical-glow-ring" style="position:absolute;inset:-5px;border-radius:50%;background:radial-gradient(circle, ${c.glow} 0%, transparent 70%);"></span>`
    : `<span style="position:absolute;inset:-3px;border-radius:50%;background:radial-gradient(circle, ${c.glowDark} 0%, transparent 70%);"></span>`;

  return L.divIcon({
    className: "custom-leaflet-marker",
    html: `
      <div style="position:relative;display:flex;align-items:center;justify-content:center;width:20px;height:20px;">
        ${glowRing}
        <span style="
          position:relative;
          display:block;
          width:9px;height:9px;
          border-radius:50%;
          background:${c.dot};
          border:1.5px solid rgba(255,255,255,0.55);
          box-shadow:0 0 8px ${c.shadow}, 0 2px 6px rgba(0,0,0,0.5);
        "></span>
      </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10]
  });
};

// Premium cluster icon — styled by severity/activity level (CRITICAL > 15, HIGH > 6, MEDIUM > 2, LOW <= 2)
const createClusterIcon = (districtName, count) => {
  const isCritical = count > 15;
  const isHigh = count > 6;
  const isMedium = count > 2;

  let outerSize, innerSize, outerBg, innerBg, borderColor, abbrColor, shadow, pulseClass, numFontSize, abbrFontSize;

  if (isCritical) {
    outerSize = 52;
    innerSize = 36;
    outerBg = "rgba(239,68,68,0.28)";
    innerBg = "rgba(185,28,28,0.92)";
    borderColor = "rgba(254,202,202,0.75)";
    abbrColor = "#fca5a5";
    shadow = "0 4px 20px rgba(239,68,68,0.4), 0 2px 8px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.2)";
    pulseClass = "situation-pulse";
    numFontSize = "12px";
    abbrFontSize = "6.5px";
  } else if (isHigh) {
    outerSize = 46;
    innerSize = 32;
    outerBg = "rgba(245,158,11,0.25)";
    innerBg = "rgba(180,83,9,0.92)";
    borderColor = "rgba(253,230,138,0.75)";
    abbrColor = "#fde68a";
    shadow = "0 4px 16px rgba(245,158,11,0.35), 0 2px 8px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.2)";
    pulseClass = "";
    numFontSize = "11px";
    abbrFontSize = "6px";
  } else if (isMedium) {
    outerSize = 40;
    innerSize = 28;
    outerBg = "rgba(59,130,246,0.25)";
    innerBg = "rgba(29,78,216,0.92)";
    borderColor = "rgba(191,219,254,0.75)";
    abbrColor = "#bfdbfe";
    shadow = "0 4px 14px rgba(59,130,246,0.35), 0 2px 8px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.2)";
    pulseClass = "";
    numFontSize = "10.5px";
    abbrFontSize = "5.5px";
  } else {
    // LOW (e.g. 1-2 cases)
    outerSize = 34;
    innerSize = 24;
    outerBg = "rgba(100,116,139,0.22)";
    innerBg = "rgba(51,65,85,0.92)";
    borderColor = "rgba(203,213,225,0.65)";
    abbrColor = "#cbd5e1";
    shadow = "0 4px 12px rgba(100,116,139,0.25), 0 2px 6px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.15)";
    pulseClass = "";
    numFontSize = "10px";
    abbrFontSize = "5px";
  }

  const abbrMap = {
    "Bengaluru City": "BEN",
    "Mysuru City": "MYS",
    "Mangaluru City": "MAN",
    "Hubballi-Dharwad": "HUB",
    "Belagavi": "BEL",
    "Kalaburagi": "KAL",
    "Shivamogga": "SHI",
    "Udupi": "UDU",
    "Davanagere": "DAV",
    "Tumakuru": "TUM",
    "Chikkamagaluru": "CHI",
    "Bidar": "BID",
    "Mandya": "MAN",
    "Ballari": "BAL",
    "Dakshina Kannada": "DAK",
    "Hassan": "HAS",
    "Uttara Kannada": "UTT"
  };

  const abbr = abbrMap[districtName] || districtName.slice(0, 3).toUpperCase();

  return L.divIcon({
    className: `custom-cluster-icon ${pulseClass}`.trim(),
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
          background:${innerBg};
          border:1.5px solid ${borderColor};
          box-shadow:${shadow};
        ">
          <span style="font-family:'IBM Plex Mono',monospace;font-size:${numFontSize};font-weight:800;color:#ffffff;line-height:1;letter-spacing:-0.02em;">${count}</span>
          <span style="font-family:'IBM Plex Mono',monospace;font-size:${abbrFontSize};font-weight:700;text-transform:uppercase;color:${abbrColor};letter-spacing:0.08em;margin-top:1.5px;">${abbr}</span>
        </div>
      </div>
    `,
    iconSize: [outerSize, outerSize],
    iconAnchor: [outerSize / 2, outerSize / 2]
  });
};

// Map controller component to handle programmatic view shifting
const MapController = ({ selectedItem, setZoomLevel }) => {
  const map = useMap();

  useEffect(() => {
    const handleZoom = () => {
      setZoomLevel(map.getZoom());
    };
    map.on("zoomend", handleZoom);
    return () => {
      map.off("zoomend", handleZoom);
    };
  }, [map, setZoomLevel]);

  useEffect(() => {
    if (selectedItem) {
      if (selectedItem.lat && selectedItem.lng) {
        // Zoom into individual incident marker
        map.setView([selectedItem.lat, selectedItem.lng], 10.5, { animate: true });
      } else if (selectedItem.latLng) {
        // Zoom into district center
        map.setView([selectedItem.latLng.lat, selectedItem.latLng.lng], 8.5, { animate: true });
      }
    }
  }, [selectedItem, map]);

  return null;
};

// Available High-Precision Map Tile Services
const MAP_LAYERS = {
  streets: {
    name: "Streets",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  },
  dark: {
    name: "Dark",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
  },
  satellite: {
    name: "Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "&copy; Esri, Maxar, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN, and the GIS User Community"
  }
};

// Severity badge styles for popup
const getSeverityPopupStyle = (severity) => {
  switch (severity) {
    case "CRITICAL": return { bg: "rgba(127,29,29,0.6)", border: "rgba(239,68,68,0.35)", text: "#fca5a5" };
    case "HIGH":     return { bg: "rgba(120,53,15,0.6)", border: "rgba(245,158,11,0.35)", text: "#fcd34d" };
    case "MEDIUM":   return { bg: "rgba(30,58,138,0.5)", border: "rgba(59,130,246,0.3)", text: "#93c5fd" };
    default:         return { bg: "rgba(30,41,59,0.5)", border: "rgba(100,116,139,0.3)", text: "#94a3b8" };
  }
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

const InteractiveMap = ({ incidents, selectedItem, onSelectDistrict, onSelectMarker }) => {
  const [zoomLevel, setZoomLevel] = useState(DEFAULT_ZOOM);
  const [activeLayer, setActiveLayer] = useState("streets");

  // Boundaries state
  const [stateGeoJSON, setStateGeoJSON] = useState(null);
  const [districtsGeoJSON, setDistrictsGeoJSON] = useState(null);
  const [showMarkers, setShowMarkers] = useState(false);

  // Load GeoJSON files asynchronously
  useEffect(() => {
    Promise.all([
      fetch("/karnataka-state.geojson").then(res => {
        if (!res.ok) throw new Error("State boundary GeoJSON not found");
        return res.json();
      }),
      fetch("/karnataka-districts.geojson").then(res => {
        if (!res.ok) throw new Error("District boundary GeoJSON not found");
        return res.json();
      })
    ]).then(([stateData, districtsData]) => {
      setStateGeoJSON(stateData);
      setDistrictsGeoJSON(districtsData);
      
      // Delay marker fade-in slightly to stagger the load after boundary reveals
      setTimeout(() => {
        setShowMarkers(true);
      }, 400);
    }).catch(err => {
      console.error("Error loading boundaries:", err);
      setShowMarkers(true); // Fallback so markers show immediately
    });
  }, []);

  // Inverted mask definition
  const maskData = useMemo(() => {
    if (!stateGeoJSON) return null;
    return createMaskGeoJSON(stateGeoJSON);
  }, [stateGeoJSON]);

  // Group incidents by district for clustering at lower zoom levels
  const getDistrictClusters = () => {
    const clusters = {};
    incidents.forEach((inc) => {
      const name = inc.district || "Bengaluru City";
      const lat = Number(inc.lat) || inc.districtCenter?.lat || 12.9716;
      const lng = Number(inc.lng) || inc.districtCenter?.lng || 77.5946;
      if (!clusters[name]) {
        clusters[name] = {
          name,
          count: 0,
          latLng: inc.districtCenter || { lat, lng },
          incidents: []
        };
      }
      clusters[name].count++;
      clusters[name].incidents.push(inc);
    });
    return Object.values(clusters);
  };

  const districtClusters = getDistrictClusters();
  const showClusters = zoomLevel < 8.2;
  const currentTile = MAP_LAYERS[activeLayer];

  // Compute quick stats for the floating situation overview
  const criticalCount = incidents.filter(i => i.severity === "CRITICAL").length;
  const activeCount = incidents.filter(i => i.status === "Under Investigation" || i.status === "Suspect Apprehended").length;
  const officersSet = new Set(incidents.map(i => i.assignedOfficer?.name).filter(Boolean));
  const officersCount = officersSet.size;

  // Custom Layer styles - Heavily fade surrounding states outside Karnataka
  const maskStyle = {
    fillColor: "#020617",
    fillOpacity: 0.84,
    stroke: false
  };

  // State fill highlight to make Karnataka stand out with bright spotlight
  const stateHighlightStyle = {
    fillColor: "#ffffff",
    fillOpacity: 0.22,
    stroke: false
  };

  // Outer glowing aura for state boundary
  const glowOuterStyle = {
    color: "#2563eb",
    weight: 12,
    opacity: 0.5,
    fill: false,
    lineCap: "round",
    lineJoin: "round"
  };

  const glowMidStyle = {
    color: "#3b82f6",
    weight: 6,
    opacity: 0.8,
    fill: false,
    lineCap: "round",
    lineJoin: "round"
  };

  // Thin bright neon blue boundary line outlining Karnataka state
  const thinBlueBoundaryStyle = {
    color: "#93c5fd",
    weight: 2.5,
    opacity: 1,
    fill: false,
    lineCap: "round",
    lineJoin: "round"
  };

  // District interior line style
  const districtStyle = {
    color: "rgba(255, 255, 255, 0.12)",
    weight: 0.8,
    opacity: 0.6,
    fill: false,
    lineCap: "round",
    lineJoin: "round"
  };

  return (
    <div className="h-full w-full rounded-xl overflow-hidden border border-slate-800/35 bg-slate-950 relative min-h-[500px]" style={{ boxShadow: "0 16px 40px rgba(0,0,0,0.5)" }}>

      {/* ── Floating Situation Overview Panel (Left) ── */}
      <div className="map-float-panel top-3 left-3" style={{ minWidth: 148 }}>
        <div style={{
          background: "rgba(6,13,26,0.88)",
          border: "1px solid rgba(51,65,85,0.25)",
          borderRadius: 10,
          padding: "10px 12px",
          minWidth: 148,
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            marginBottom: 10, paddingBottom: 8,
            borderBottom: "1px solid rgba(51,65,85,0.2)"
          }}>
            <span style={{
              display: "inline-block", width: 6, height: 6,
              borderRadius: "50%", background: "#3b82f6",
              animation: "ping-slow 2s ease-in-out infinite", flexShrink: 0
            }} />
            <span style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 8, fontWeight: 700,
              letterSpacing: "0.12em", textTransform: "uppercase", color: "#475569"
            }}>Situation Overview</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { label: "Active Hotspots", value: districtClusters.length, color: "#ef4444" },
              { label: "Critical Incidents", value: criticalCount, color: "#f59e0b" },
              { label: "Active Cases", value: activeCount, color: "#3b82f6" },
              { label: "Officers Deployed", value: officersCount, color: "#10b981" },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em"
                }}>{label}</span>
                <span style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 14, fontWeight: 700, color, lineHeight: 1
                }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Map Layer Switcher Control (Top Right) ── */}
      <div className="map-float-panel top-3 right-3">
        <div style={{
          display: "flex", gap: 6,
          background: "rgba(6,13,26,0.88)",
          border: "1px solid rgba(51,65,85,0.35)",
          borderRadius: 8, padding: "5px 6px",
        }}>
          {Object.entries(MAP_LAYERS).map(([key, layer]) => (
            <button
              key={key}
              onClick={() => setActiveLayer(key)}
              style={{
                padding: "4px 10px",
                borderRadius: 6,
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                cursor: "pointer",
                border: "none",
                transition: "all 0.15s",
                background: activeLayer === key ? "#2563eb" : "transparent",
                color: activeLayer === key ? "#ffffff" : "#94a3b8",
              }}
            >
              {layer.name}
            </button>
          ))}
        </div>
      </div>

      {/* ── Leaflet Map ── */}
      <MapContainer
        center={KARNATAKA_CENTER}
        zoom={DEFAULT_ZOOM}
        zoomControl={true}
        className="h-full w-full z-10"
        style={{ background: "#020617" }}
      >
        <TileLayer key={activeLayer} url={currentTile.url} attribution={currentTile.attribution} maxZoom={19} />
        
        <MapController selectedItem={selectedItem} setZoomLevel={setZoomLevel} />

        {/* 1. Outside world darken mask */}
        {maskData && (
          <GeoJSON data={maskData} style={maskStyle} interactive={false} />
        )}

        {/* 2. District subtle interior lines */}
        {districtsGeoJSON && (
          <GeoJSON data={districtsGeoJSON} style={districtStyle} interactive={false} />
        )}

        {/* 3. Karnataka State Highlight & Neon Glowing Boundary */}
        {stateGeoJSON && (
          <>
            <GeoJSON data={stateGeoJSON} style={stateHighlightStyle} interactive={false} />
            <GeoJSON data={stateGeoJSON} style={glowOuterStyle} interactive={false} />
            <GeoJSON data={stateGeoJSON} style={glowMidStyle} interactive={false} />
            <GeoJSON data={stateGeoJSON} style={thinBlueBoundaryStyle} interactive={false} />
          </>
        )}

        {/* 4. Hotspot markers / Clusters — Fade in after boundary loaded */}
        {showMarkers && (
          showClusters ? (
            // Render District Cluster Markers
            districtClusters.map((cluster) => {
              const districtIncs = cluster.incidents || incidents.filter(i => (i.district || "Bengaluru City") === cluster.name);
              const categories = {};
              districtIncs.forEach(inc => {
                const cat = inc.type || "General";
                categories[cat] = (categories[cat] || 0) + 1;
              });
              const topCategory = Object.entries(categories).sort((a,b) => b[1] - a[1])[0]?.[0] || "Property Offences";
              const isCritical = cluster.count > 15;
              const isHigh = cluster.count > 6;
              const isMedium = cluster.count > 2;
              const riskLabel = isCritical ? "CRITICAL" : isHigh ? "HIGH" : isMedium ? "MEDIUM" : "LOW";
              const riskColor = isCritical ? "#ef4444" : isHigh ? "#f59e0b" : isMedium ? "#3b82f6" : "#94a3b8";
              const criticalInDistrict = districtIncs.filter(i => i.severity === "CRITICAL").length;

              return (
                <Marker
                  key={cluster.name}
                  position={[cluster.latLng.lat, cluster.latLng.lng]}
                  icon={createClusterIcon(cluster.name, cluster.count)}
                  eventHandlers={{
                    click: () => {
                      onSelectDistrict(cluster.name);
                    }
                  }}
                >
                  <Tooltip direction="top" offset={[0, -22]} opacity={1} className="dark-tooltip">
                    <div style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 10,
                      padding: "8px 10px",
                      minWidth: 160,
                      color: "#f8fafc"
                    }}>
                      <div style={{
                        fontWeight: "bold",
                        color: "#38bdf8",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        borderBottom: "1px solid rgba(51,65,85,0.6)",
                        paddingBottom: 4,
                        marginBottom: 6,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}>
                        <span>{cluster.name}</span>
                        <span style={{
                          fontSize: 8,
                          padding: "1px 5px",
                          borderRadius: 3,
                          background: `${riskColor}22`,
                          color: riskColor,
                          border: `1px solid ${riskColor}55`,
                          fontWeight: 700
                        }}>
                          {riskLabel}
                        </span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ color: "#94a3b8" }}>Total Cases:</span>
                        <span style={{ fontWeight: "bold", color: "#ffffff" }}>{cluster.count} FIRs</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ color: "#94a3b8" }}>Top Crime:</span>
                        <span style={{ fontWeight: "bold", color: "#fcd34d" }}>{topCategory}</span>
                      </div>
                      {criticalInDistrict > 0 && (
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                          <span style={{ color: "#94a3b8" }}>Critical:</span>
                          <span style={{ fontWeight: "bold", color: "#ef4444" }}>{criticalInDistrict} Cases</span>
                        </div>
                      )}
                      <div style={{
                        marginTop: 6,
                        paddingTop: 4,
                        borderTop: "1px dashed rgba(51,65,85,0.5)",
                        fontSize: 8,
                        color: "#64748b",
                        textAlign: "center"
                      }}>
                        Click to filter district
                      </div>
                    </div>
                  </Tooltip>
                </Marker>
              );
            })
          ) : (
            // Render Individual Incident Pin Markers
            incidents.map((inc) => {
              const sevStyle = getSeverityPopupStyle(inc.severity);
              return (
                <Marker
                  key={inc.id}
                  position={[inc.lat, inc.lng]}
                  icon={createCustomMarker(inc)}
                  eventHandlers={{
                    click: () => {
                      onSelectMarker(inc);
                    }
                  }}
                >
                  <Tooltip direction="top" offset={[0, -10]} opacity={1} className="dark-tooltip">
                    <div style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 9,
                      padding: "4px 8px",
                      color: "#f8fafc",
                      whiteSpace: "nowrap"
                    }}>
                      <span style={{ fontWeight: 700, color: "#93c5fd" }}>{inc.caseNo}</span> · <span style={{ color: sevStyle.text, fontWeight: 600 }}>{inc.severity}</span> · {inc.type || "Incident"}
                    </div>
                  </Tooltip>
                  <Popup className="dark-popup font-mono text-xs">
                    <div style={{ padding: "10px 12px", minWidth: 240, maxWidth: 270, fontFamily: "'IBM Plex Mono', monospace" }}>
                      {/* Header */}
                      <div style={{
                        display: "flex", justifyContent: "space-between",
                        paddingBottom: 8, marginBottom: 10,
                        borderBottom: "1px solid rgba(51,65,85,0.4)"
                      }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#93c5fd" }}>{inc.caseNo}</span>
                        <span style={{
                          fontSize: 8.5, fontWeight: 700, letterSpacing: "0.08em",
                          textTransform: "uppercase", padding: "2px 7px", borderRadius: 4,
                          background: sevStyle.bg, border: `1px solid ${sevStyle.border}`, color: sevStyle.text
                        }}>
                          {inc.severity}
                        </span>
                      </div>

                      {/* Details */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <FaBuilding className="text-slate-400 text-[10px] flex-shrink-0" />
                          <span style={{ fontSize: 10.5, color: "#cbd5e1" }}>{inc.unit}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <FaCalendarAlt className="text-slate-400 text-[10px] flex-shrink-0" />
                          <span style={{ fontSize: 10.5, color: "#94a3b8" }}>{inc.date}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <FaUser className="text-slate-400 text-[10px] flex-shrink-0" />
                          <span style={{ fontSize: 10.5, color: "#94a3b8" }}>{inc.assignedOfficer?.name || "Unassigned"}</span>
                        </div>
                      </div>

                      {/* Brief Facts */}
                      <div style={{
                        background: "rgba(2,6,23,0.8)", borderRadius: 6,
                        border: "1px solid rgba(51,65,85,0.4)", padding: "8px 10px", marginBottom: 8
                      }}>
                        <span style={{
                          display: "block", fontSize: 8, fontWeight: 700,
                          color: "#94a3b8", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4
                        }}>Brief Facts</span>
                        <p style={{ fontSize: 9.5, lineHeight: 1.55, color: "#cbd5e1", fontFamily: "Inter, sans-serif",
                          display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden"
                        }}>
                          {inc.briefFacts}
                        </p>
                      </div>

                      {/* Status footer */}
                      <div style={{ display: "flex", justifyContent: "flex-end", fontSize: 8.5, color: "#64748b" }}>
                        Status: <span style={{ color: "#cbd5e1", fontWeight: 700, marginLeft: 4 }}>{inc.status}</span>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })
          )
        )}
      </MapContainer>

      {/* ── Floating Severity Legend (Bottom Right, above attribution) ── */}
      <div className="map-float-panel bottom-8 right-3">
        <div className="map-severity-legend" style={{ padding: "10px 14px" }}>
          <div style={{ color: "#94a3b8", marginBottom: 6, fontSize: 8.5, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700 }}>Severity Index</div>
          {[
            { label: "Critical", color: "#ef4444" },
            { label: "High",     color: "#f59e0b" },
            { label: "Medium",   color: "#3b82f6" },
            { label: "Low",      color: "#475569" },
          ].map(({ label, color }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, display: "inline-block", flexShrink: 0 }} />
              <span style={{ color: "#cbd5e1", fontSize: 9.5 }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default InteractiveMap;
