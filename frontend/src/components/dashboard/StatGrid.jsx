import React from "react";
import {
  FaFolderOpen,
  FaSearch,
  FaGavel,
  FaUserLock
} from "react-icons/fa";
import StatCard from "./StatCard";

// Static sparkline trend data for each KPI card (10-point arrays)
const SPARK_DATA = {
  firs:       { data: [168, 172, 170, 176, 181, 179, 184, 190, 196, 200], color: "#3b82f6" },
  active:     { data: [162, 158, 165, 160, 155, 150, 154, 150, 148, 150], color: "#f59e0b" },
  chargeSheet:{ data: [68,  70,  71,  73,  72,  74,  74,  75,  76,  77],  color: "#10b981" },
  arrest:     { data: [28,  29,  30,  31,  30,  31,  32,  32,  33,  33],  color: "#f43f5e" },
};

const StatGrid = ({ metrics }) => {
  if (!metrics) return null;

  const cardsData = [
    {
      title:      "Total Registered FIRs",
      value:      metrics.total_firs.value.toLocaleString("en-IN"),
      change:     `${metrics.total_firs.change_percent >= 0 ? "+" : ""}${metrics.total_firs.change_percent}% from last month`,
      icon:       FaFolderOpen,
      color:      "text-blue-400",
      borderColor:"border-blue-500",
      dataSource: (metrics.total_firs.source_table && metrics.total_firs.source_field) 
        ? `${metrics.total_firs.source_table}.${metrics.total_firs.source_field}` 
        : "CaseMaster (Catalyst Datastore)",
      coverage:   metrics.total_firs.coverage || "Statewide Active Units (CCTNS Datastore)",
      lastSync:   metrics.total_firs.last_sync || "Real-Time Synced",
      subText:    `Cognizable: ${metrics.total_firs.cognizable_count ? metrics.total_firs.cognizable_count.toLocaleString("en-IN") : metrics.total_firs.value.toLocaleString("en-IN")}`,
      sparkData:  SPARK_DATA.firs.data,
      sparkColor: SPARK_DATA.firs.color,
    },
    {
      title:      "Active Investigations",
      value:      metrics.active_investigations.value.toLocaleString("en-IN"),
      change:     `${metrics.active_investigations.change_percent >= 0 ? "+" : ""}${metrics.active_investigations.change_percent}% from last month`,
      icon:       FaSearch,
      color:      "text-amber-400",
      borderColor:"border-amber-500",
      dataSource: (metrics.active_investigations.source_table && metrics.active_investigations.source_field)
        ? `${metrics.active_investigations.source_table} | ${metrics.active_investigations.source_field}`
        : "CaseMaster | CaseStatusMaster",
      coverage:   metrics.active_investigations.coverage || "All Karnataka Police Precincts",
      lastSync:   metrics.active_investigations.last_sync || "Real-Time Synced",
      subText:    metrics.active_investigations.status_code || "Status: Under Investigation",
      sparkData:  SPARK_DATA.active.data,
      sparkColor: SPARK_DATA.active.color,
    },
    {
      title:      "Charge-Sheet Rate (IIF-5)",
      value:      `${metrics.charge_sheet_rate.value}%`,
      change:     `+${metrics.charge_sheet_rate.change_percent}% vs last quarter`,
      icon:       FaGavel,
      color:      "text-emerald-400",
      borderColor:"border-emerald-500",
      dataSource: (metrics.charge_sheet_rate.source_table && metrics.charge_sheet_rate.source_field)
        ? `${metrics.charge_sheet_rate.source_table} | ${metrics.charge_sheet_rate.source_field}`
        : "ChargesheetDetails (IIF-5)",
      coverage:   metrics.charge_sheet_rate.coverage || "Judicial Submission Track",
      lastSync:   metrics.charge_sheet_rate.last_sync || "Real-Time Synced",
      subText:    "Final Report Type 'A'",
      sparkData:  SPARK_DATA.chargeSheet.data,
      sparkColor: SPARK_DATA.chargeSheet.color,
    },
    {
      title:      "Suspect Arrest Rate (IIF-3)",
      value:      `${metrics.apprehension_rate.value}%`,
      change:     `+${metrics.apprehension_rate.change_percent}% YoY tracking`,
      icon:       FaUserLock,
      color:      "text-rose-400",
      borderColor:"border-rose-500",
      dataSource: (metrics.apprehension_rate.source_table && metrics.apprehension_rate.source_field)
        ? `${metrics.apprehension_rate.source_table} | ${metrics.apprehension_rate.source_field}`
        : "ArrestSurrender (IIF-3)",
      coverage:   metrics.apprehension_rate.coverage || "Custodial Verification Log",
      lastSync:   metrics.apprehension_rate.last_sync || "Real-Time Synced",
      subText:    "Primary Accused Logs",
      sparkData:  SPARK_DATA.arrest.data,
      sparkColor: SPARK_DATA.arrest.color,
    },
  ];

  return (
    <div className="grid gap-6 lg:gap-8 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
      {cardsData.map((card) => (
        <StatCard
          key={card.title}
          title={card.title}
          value={card.value}
          change={card.change}
          icon={card.icon}
          color={card.color}
          borderColor={card.borderColor}
          dataSource={card.dataSource}
          coverage={card.coverage}
          lastSync={card.lastSync}
          subText={card.subText}
          sparkData={card.sparkData}
          sparkColor={card.sparkColor}
        />
      ))}
    </div>
  );
};

export default StatGrid;