import React, { useState, useEffect, useMemo } from "react";
import PageHeader from "../../components/dashboard/PageHeader";
import OfficerOfTheMonthCard from "../../components/officers/OfficerOfTheMonthCard";
import OfficerFilters from "../../components/officers/OfficerFilters";
import OfficerHeader from "../../components/officers/OfficerHeader";
import OfficerCharts from "../../components/officers/OfficerCharts";
import OfficerWorkload from "../../components/officers/OfficerWorkload";
import AddOfficerModal from "../../components/officers/AddOfficerModal";
import { officerService } from "../../services/officerService";
import { useAuth } from "../../context/AuthContext";
import { FaPlus } from "react-icons/fa";

const Officers = () => {
  const [officerList, setOfficerList] = useState([]);
  const [selectedBadge, setSelectedBadge] = useState("");
  const [profile, setProfile] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [filters, setFilters] = useState({
    search: "",
    unit: "",
    rank: "",
    minClearance: ""
  });

  const { currentUser, isAdmin, registerOfficer } = useAuth();

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: "",
      unit: "",
      rank: "",
      minClearance: ""
    });
  };

  const reloadOfficerList = () => {
    const list = officerService.getOfficers();
    setOfficerList(list);
    return list;
  };

  // Load officer options on mount from online database & restrict based on role
  useEffect(() => {
    const init = async () => {
      await officerService.fetchRemoteOfficers();
      const list = reloadOfficerList();
      if (list.length > 0) {
        if (!isAdmin && currentUser) {
          const match = list.find(
            (o) =>
              o.badgeNumber === currentUser.badge ||
              o.badgeNumber === currentUser.kgid ||
              o.name.toLowerCase().includes(currentUser.name.toLowerCase())
          );
          if (match) {
            setSelectedBadge(match.badgeNumber);
          } else {
            const newProf = await officerService.addOfficer({
              name: currentUser.name,
              rank: currentUser.rank || "Police Inspector",
              badgeNumber: currentUser.badge || currentUser.kgid,
              unit: currentUser.unit || "State Range",
              station: "Karnataka Police Command",
              yearsOfService: "5",
              specialArea: "Field Operations & Cyber Intelligence",
              avatar: currentUser.avatar
            });
            reloadOfficerList();
            setSelectedBadge(newProf.badgeNumber);
          }
        } else if (!selectedBadge) {
          setSelectedBadge(list[0].badgeNumber);
        }
      }
    };
    init();
  }, [isAdmin, currentUser]);

  // Sync profile when selected officer changes
  useEffect(() => {
    if (selectedBadge) {
      const data = officerService.getOfficerProfile(selectedBadge);
      setProfile(data);
    }
  }, [selectedBadge]);

  const handleAddOfficer = async (formData) => {
    const newProfile = await officerService.addOfficer(formData);
    registerOfficer({
      ...formData,
      badge: newProfile.badgeNumber,
      kgid: newProfile.badgeNumber
    });
    reloadOfficerList();
    setSelectedBadge(newProfile.badgeNumber);
  };

  const filteredOfficerList = useMemo(() => {
    return officerList.filter((off) => {
      const prof = officerService.getOfficerProfile(off.badgeNumber);
      if (!prof) return false;

      if (filters.search) {
        const q = filters.search.toLowerCase().trim();
        const matchName = prof.name.toLowerCase().includes(q);
        const matchBadge = prof.badgeNumber.toLowerCase().includes(q);
        if (!matchName && !matchBadge) return false;
      }

      if (filters.unit && !prof.unit.toLowerCase().includes(filters.unit.toLowerCase())) {
        return false;
      }

      if (filters.rank && !prof.rank.toLowerCase().includes(filters.rank.toLowerCase())) {
        return false;
      }

      if (filters.minClearance) {
        const rate = prof.kpis.chargesheetRate || 0;
        if (filters.minClearance === "below80") {
          if (rate >= 80) return false;
        } else {
          if (rate < Number(filters.minClearance)) return false;
        }
      }

      return true;
    });
  }, [officerList, filters]);

  const uniqueRanks = useMemo(() => Array.from(new Set(officerList.map((o) => o.rank).filter(Boolean))), [officerList]);
  const uniqueUnits = useMemo(() => Array.from(new Set(officerList.map((o) => o.unit).filter(Boolean))), [officerList]);
  const officerOfTheMonth = useMemo(() => officerService.getOfficerOfTheMonth(), [officerList]);

  // Keep selectedBadge aligned with filtered list
  useEffect(() => {
    if (filteredOfficerList.length > 0) {
      const exists = filteredOfficerList.some((o) => o.badgeNumber === selectedBadge);
      if (!exists && isAdmin) {
        setSelectedBadge(filteredOfficerList[0].badgeNumber);
      }
    }
  }, [filteredOfficerList, selectedBadge, isAdmin]);

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] font-mono text-xs text-slate-500">
        <div className="relative mb-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-800 border-t-blue-500" />
        </div>
        <div className="animate-pulse tracking-widest uppercase">
          Querying KSP Officer Dossier Master records...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-7 sm:gap-8 font-sans">
      
      {/* 1. Header Row */}
      <PageHeader
        title="Officer Performance Center"
        subtitle="Operational evaluation of investigation case logs, task schedules, and resolution metrics"
        action={
          isAdmin ? (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center justify-center gap-3.5 rounded-lg bg-blue-600 hover:bg-blue-500 border border-blue-400/60 text-sm font-mono font-bold uppercase tracking-wider text-white transition-all cursor-pointer shadow-lg hover:shadow-blue-500/30 active:scale-[0.98] flex-shrink-0 whitespace-nowrap"
              style={{ padding: "14px 36px", borderRadius: "10px" }}
            >
              <FaPlus className="text-base text-white" />
              <span>Add New Officer</span>
            </button>
          ) : null
        }
      />

      {/* 2. Top Hero: Featured Officer + Performance Highlights */}
      <OfficerOfTheMonthCard 
        officer={officerOfTheMonth} 
        onSelectProfile={(badge) => {
          if (badge) {
            setSelectedBadge(badge);
          }
        }} 
      />

      {/* 3. Compact Filter Bar */}
      <OfficerFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
        ranks={uniqueRanks}
        units={uniqueUnits}
      />

      {/* 4. Middle Dual Grid: Selected Officer + KPI Grid (Left) & Charts (Right) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-stretch">
        
        {/* Left Column: Selected Officer Dossier + 2x3 KPI Grid */}
        <OfficerHeader
          profile={profile}
          officerList={filteredOfficerList}
          onOfficerChange={setSelectedBadge}
          allowSelector={isAdmin}
        />

        {/* Right Column: Case Resolution Trend + Performance Snapshot */}
        <OfficerCharts
          monthlyTrend={profile.monthlyTrend}
          categoryDistribution={profile.categoryDistribution}
        />

      </div>

      {/* 5. Bottom Full-Width Table: Active Workload & Court Dockets */}
      <OfficerWorkload workload={profile.workload} />

      {/* Add New Officer Modal */}
      <AddOfficerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddOfficer}
      />

    </div>
  );
};

export default Officers;
