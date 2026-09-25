import React, { useState, useEffect, useMemo } from "react";
import PageHeader from "../../components/dashboard/PageHeader";
import MapFilters from "../../components/crimeMap/MapFilters";
import InteractiveMap from "../../components/crimeMap/InteractiveMap";
import IntelligencePanel from "../../components/crimeMap/IntelligencePanel";
import IntelligenceStrip from "../../components/crimeMap/IntelligenceStrip";
import { crimeService } from "../../services/crimeService";
import { recordService } from "../../services/recordService";

const CrimeMap = () => {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const unsubscribe = recordService.subscribe(() => {
      setTick((t) => t + 1);
    });
    return () => unsubscribe();
  }, []);

  // Query Filters state
  const [filters, setFilters] = useState({
    district: "",
    unit: "",
    category: "",
    severity: "",
    status: "",
    startDate: "",
    endDate: ""
  });

  // Spatial selection states
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedMarker, setSelectedMarker] = useState(null);

  // Sync state changes from filters
  const handleFilterChange = (name, value) => {
    setFilters((prev) => {
      const updated = { ...prev, [name]: value };
      
      // If district filter is explicitly set, update selected district state to match
      if (name === "district") {
        setSelectedDistrict(value);
        setSelectedMarker(null); // Clear selected marker on district change
      }
      
      return updated;
    });
  };

  const handleReset = () => {
    setFilters({
      district: "",
      unit: "",
      category: "",
      severity: "",
      status: "",
      startDate: "",
      endDate: ""
    });
    setSelectedDistrict("");
    setSelectedMarker(null);
  };

  const handleSelectDistrict = (districtName) => {
    setSelectedDistrict(districtName);
    setSelectedMarker(null); // Clear active marker when switching districts
    setFilters((prev) => ({ ...prev, district: districtName }));
  };

  const handleSelectMarker = (marker) => {
    setSelectedMarker(marker);
    setSelectedDistrict(marker.district);
  };

  // Memoized query runs
  const filteredIncidents = useMemo(() => {
    return crimeService.getIncidents(filters);
  }, [filters, tick]);

  const districtMetrics = useMemo(() => {
    return crimeService.getDistrictMetrics(selectedDistrict, filteredIncidents);
  }, [selectedDistrict, filteredIncidents]);

  const hotspotDistricts = useMemo(() => {
    return crimeService.getHotspotDistricts(filteredIncidents);
  }, [filteredIncidents]);

  const recentIncidents = useMemo(() => {
    return [...filteredIncidents]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);
  }, [filteredIncidents]);

  const activeCount = useMemo(() => {
    return filteredIncidents.filter(
      (inc) => inc.status === "Under Investigation" || inc.status === "Suspect Apprehended"
    ).length;
  }, [filteredIncidents]);

  // Viewport tracking item to programmatically pan/zoom map
  const selectedItem = useMemo(() => {
    if (selectedMarker) return selectedMarker;
    if (selectedDistrict) {
      // Find the coordinates for the district center
      const incidentsInDistrict = filteredIncidents.filter(inc => inc.district === selectedDistrict);
      if (incidentsInDistrict.length > 0) {
        return { latLng: incidentsInDistrict[0].districtCenter };
      }
    }
    return null;
  }, [selectedMarker, selectedDistrict, filteredIncidents]);

  return (
    <div className="flex flex-col gap-5">
      {/* Page Header */}
      <PageHeader
        title="Crime Geospatial Intelligence Center"
        subtitle="GIS Radar Incident Tracking & Automated Modus Operandi Matching Console"
      />

      {/* Command Toolbar — flat single-row filters */}
      <MapFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleReset}
      />

      {/* Main Spatial Analytics Segment */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-5 items-start">
        {/* Left Side: Leaflet Radar Map (~70% width) */}
        <div className="lg:col-span-7 relative" style={{ height: 680 }}>
          <InteractiveMap
            incidents={filteredIncidents}
            selectedItem={selectedItem}
            onSelectDistrict={handleSelectDistrict}
            onSelectMarker={handleSelectMarker}
          />
        </div>

        {/* Right Side: Stacked Intelligence Cards (~30% width) */}
        <div className="lg:col-span-3 overflow-y-auto pr-2 flex flex-col gap-4 scrollbar-thin" style={{ height: 680 }}>
          <IntelligencePanel
            selectionName={selectedDistrict || "ALL DISTRICTS"}
            metrics={districtMetrics}
            selectedMarker={selectedMarker}
            onDossierClose={() => setSelectedMarker(null)}
          />
        </div>
      </div>

      {/* Bottom Intelligence Summary Strip */}
      <IntelligenceStrip
        hotspots={hotspotDistricts}
        recentIncidents={recentIncidents}
        totalCount={filteredIncidents.length}
        activeCount={activeCount}
      />
    </div>
  );
};

export default CrimeMap;
