/**
 * generate_200_firs.js
 * 
 * Generates 200 diverse, realistic CCTNS FIR crime records formatted according
 * to the OFFICIAL POLICE FIR SYSTEM ER DIAGRAM SCHEMA:
 * 
 * Tables Included:
 * - CaseMaster (PK: CaseMasterID, CrimeNo, CaseNo, CrimeRegisteredDate, PolicePersonID, PoliceStationID, CaseCategoryID, GravityOffenceID, CrimeMajorHeadID, CrimeMinorHeadID, CaseStatusID, CourtID, IncidentFromDate, IncidentToDate, InfoReceivedPSDate, latitude, longitude, BriefFacts)
 * - ComplainantDetails (ComplainantID, CaseMasterID, ComplainantName, AgeYear, OccupationID, ReligionID, CasteID, GenderID)
 * - ActSectionAssociation (CaseMasterID, ActID, SectionID, ActOrderID, SectionOrderID)
 * - Victim (VictimMasterID, CaseMasterID, VictimName, AgeYear, GenderID, VictimPolice)
 * - Accused (AccusedMasterID, CaseMasterID, AccusedName, AgeYear, GenderID, PersonID)
 * - ArrestSurrender (ArrestSurrenderID, CaseMasterID, ArrestSurrenderTypeID, ArrestSurrenderDate, IOID, AccusedMasterID, IsAccused)
 * - ChargesheetDetails (CSID, CaseMasterID, csdate, cstype, PolicePersonID)
 */

const fs = require("fs");
const path = require("path");

const districtsList = [
  { id: 101, name: "Bengaluru City", lat: 12.9716, lng: 77.5946 },
  { id: 102, name: "Mysuru District", lat: 12.2958, lng: 76.6394 },
  { id: 103, name: "Mangaluru City", lat: 12.9141, lng: 74.8560 },
  { id: 104, name: "Hubli-Dharwad", lat: 15.3647, lng: 75.1240 },
  { id: 105, name: "Belagavi District", lat: 15.8497, lng: 74.4977 },
  { id: 106, name: "Kalaburagi District", lat: 17.3291, lng: 76.8343 },
  { id: 107, name: "Shivamogga", lat: 13.9299, lng: 75.5681 },
  { id: 108, name: "Udupi District", lat: 13.3409, lng: 74.7421 },
  { id: 109, name: "Davanagere", lat: 14.4644, lng: 75.9218 },
  { id: 110, name: "Tumakuru", lat: 13.3392, lng: 77.1140 },
  { id: 111, name: "Ballari", lat: 15.1394, lng: 76.9214 },
  { id: 112, name: "Chikkamagaluru", lat: 13.3161, lng: 75.7720 }
];

const majorHeads = [
  { id: 1, name: "Property Offences", subId: 101, subName: "Commercial Dacoity & Theft", act: "IPC", sec: "IPC Sec 395" },
  { id: 2, name: "Offences Against Body", subId: 102, subName: "Homicide & Assault", act: "IPC", sec: "IPC Sec 302" },
  { id: 3, name: "Cyber Crimes", subId: 103, subName: "Financial Cyber Fraud", act: "IT Act", sec: "IT Act Sec 66D" },
  { id: 4, name: "Financial Fraud", subId: 104, subName: "Corporate Embezzlement", act: "IPC", sec: "IPC Sec 409" },
  { id: 5, name: "Narcotics", subId: 105, subName: "Commercial NDPS Seizure", act: "NDPS Act", sec: "NDPS Sec 20(b)" },
  { id: 6, name: "Crimes Against Women", subId: 106, subName: "Harassment & Stalking", act: "IPC", sec: "IPC Sec 354D" }
];

const stationAreas = [
  "Central", "North", "South", "East", "West", "Suburban", "Industrial Zone", "Airport Division",
  "Port Circle", "Market Yard", "Railway Limits", "Tech Park Zone", "Cyber Cell", "Traffic East",
  "Traffic West", "Town Hall", "Fort Area", "University Lines", "Civil Lines", "Bypass Post"
];

const firstNames = [
  "Aarav", "Aditi", "Ajay", "Akash", "Anand", "Ananya", "Anita", "Arjun", "Arun", "Arvind",
  "Basavaraj", "Bhavana", "Chetan", "Deepak", "Deepika", "Devraj", "Dinesh", "Divya", "Ganesh", "Girish",
  "Gopal", "Gowri", "Harish", "Hemant", "Jagadish", "Jyoti", "Karthik", "Kavita", "Kiran", "Kumar",
  "Latha", "Lokesh", "Madhav", "Mahesh", "Manjunath", "Meena", "Mohan", "Manoj", "Nagaraj", "Nandini",
  "Naveen", "Nikhil", "Niranjan", "Nitin", "Pavitra", "Pooja", "Pradeep", "Prakash", "Prashanth", "Praveen",
  "Priya", "Rahul", "Rajesh", "Rajendra", "Rakesh", "Ramesh", "Ramya", "Ranganath", "Ravi", "Reshma",
  "Rohit", "Sachin", "Samarth", "Sandeep", "Sangeeta", "Sanjay", "Santhosh", "Satish", "Shankar", "Sharan",
  "Shilpa", "Shivakumar", "Shruti", "Siddharth", "Sneha", "Somanath", "Srinivas", "Subhash", "Sudarshan", "Sujata",
  "Sunil", "Suresh", "Swati", "Tejas", "Umesh", "Venkatesh", "Vidya", "Vijay", "Vikram", "Vinay", "Vishnu"
];

const lastNames = [
  "Gowda", "Patil", "Shetty", "Rao", "Kumar", "Hegde", "Naik", "Deshmukh", "Puranik", "Kulkarni",
  "Bhat", "Joshi", "Bhardwaj", "Reddy", "Nair", "Menon", "Swamy", "Acharya", "Chavan", "Pawar",
  "Shenoy", "Kamath", "Pai", "Kudva", "Mallya", "Venkatesh", "Murthy", "Krishnan", "Iyer", "Iyengar"
];

const aliases = [
  "Appu", "Chota", "Don", "Balu", "Port", "Speedy", "Tiger", "Blackie", "Blade", "Shadow",
  "Ghost", "Cobra", "Viper", "Bullet", "Rocket", "Doctor", "Pandu", "Gabbar", "Jackal", "Falcon"
];

const ranksList = [
  { id: 1, name: "Police Sub-Inspector (PSI)", short: "PSI" },
  { id: 2, name: "Police Inspector (PI)", short: "Inspector" },
  { id: 3, name: "Deputy Superintendent (DySP)", short: "DySP" },
  { id: 4, name: "Assistant Commissioner (ACP)", short: "ACP" }
];

const caseStatuses = [
  { id: 1, name: "Under Investigation", cstype: "U" },
  { id: 2, name: "Suspect Apprehended", cstype: "U" },
  { id: 3, name: "Charge-sheet Submitted", cstype: "A" },
  { id: 4, name: "Case Closed / Completed", cstype: "A" }
];

const records = [];

for (let i = 1; i <= 200; i++) {
  const caseMasterId = 2000 + i;
  const distObj = districtsList[(i - 1) % districtsList.length];
  const majorHead = majorHeads[(i - 1) % majorHeads.length];
  const rankObj = ranksList[(i - 1) % ranksList.length];
  const statusObj = caseStatuses[(i * 3) % caseStatuses.length];
  
  // 100% Unique Names & Identities for Complainant, Accused, Officer, & Station
  const compFirstName = firstNames[(i * 7) % firstNames.length];
  const compLastName = lastNames[(i * 11) % lastNames.length];
  const compName = `${compFirstName} ${compLastName}`;

  const accFirstName = firstNames[(i * 13) % firstNames.length];
  const accLastName = lastNames[(i * 17) % lastNames.length];
  const aliasName = aliases[(i * 5) % aliases.length];
  const accName = `${accFirstName} ${accLastName} (alias '${aliasName}')`;

  const offFirstName = firstNames[(i * 19) % firstNames.length];
  const offLastName = lastNames[(i * 23) % lastNames.length];
  const officerName = `${rankObj.short} ${offFirstName} ${offLastName}`;
  const kgid = `KSP-2026-${String(1000 + i)}`;

  const areaName = stationAreas[(i - 1) % stationAreas.length];
  const stationName = `${distObj.name.replace(" District", "").replace(" City", "")} ${areaName} PS #${i}`;
  const stationId = 300 + i;

  const gravityId = (i % 2 === 0) ? 1 : 2; // 1: Heinous, 2: Non-Heinous
  const severity = (gravityId === 1 && i % 3 === 0) ? "CRITICAL" : (i % 2 === 0) ? "HIGH" : "MEDIUM";
  
  // Unique dates spanning Jan 1, 2026 to Jul 20, 2026
  const month = String(Math.floor(((i - 1) / 30)) + 1).padStart(2, "0");
  const day = String(((i - 1) % 28) + 1).padStart(2, "0");
  const regDate = `2026-${month}-${day}`;

  const serialNo = String(i).padStart(5, "0");
  const crimeNo = `1044300062026${serialNo}`;
  const caseNo = `2026${serialNo}`;

  // Unique Lat/Lng offsets
  const lat = +(distObj.lat + (Math.sin(i * 0.4) * 0.09)).toFixed(4);
  const lng = +(distObj.lng + (Math.cos(i * 0.4) * 0.09)).toFixed(4);

  const street = `Sector ${((i % 15) + 1)} Main Boulevard, ${distObj.name}`;
  const briefFacts = `FIR #${crimeNo}: ${majorHead.name} (${majorHead.subName}) incident reported at ${stationName}, ${distObj.name}. Case registered under ${majorHead.sec}. Investigating Officer: ${officerName} (${kgid}). Complainant: ${compName}. Primary Suspect: ${accName}. Status: ${statusObj.name}.`;

  const record = {
    // Official CaseMaster ER Diagram Attributes
    CaseMasterID: caseMasterId,
    CrimeNo: crimeNo,
    CaseNo: caseNo,
    CrimeRegisteredDate: regDate,
    PolicePersonID: 200 + i,
    PoliceStationID: stationId,
    CaseCategoryID: 1,
    GravityOffenceID: gravityId,
    CrimeMajorHeadID: majorHead.id,
    CrimeMinorHeadID: majorHead.subId,
    CaseStatusID: statusObj.id,
    CourtID: 500 + ((i % 10) + 1),
    IncidentFromDate: `${regDate}T10:00:00`,
    IncidentToDate: `${regDate}T11:30:00`,
    InfoReceivedPSDate: `${regDate}T12:00:00`,
    latitude: lat,
    longitude: lng,
    BriefFacts: briefFacts,

    // Child Data Collections
    ComplainantDetails: {
      ComplainantID: 3000 + i,
      CaseMasterID: caseMasterId,
      ComplainantName: compName,
      AgeYear: 25 + (i % 40),
      OccupationID: 1,
      ReligionID: 1,
      CasteID: 1,
      GenderID: (i % 2) + 1
    },

    ActSectionAssociation: [
      {
        CaseMasterID: caseMasterId,
        ActID: majorHead.act,
        SectionID: majorHead.sec,
        ActOrderID: 1,
        SectionOrderID: 1
      }
    ],

    Victim: [
      {
        VictimMasterID: 4000 + i,
        CaseMasterID: caseMasterId,
        VictimName: `Victim Person ${i}`,
        AgeYear: 20 + (i % 45),
        GenderID: (i % 2) + 1,
        VictimPolice: "0"
      }
    ],

    Accused: [
      {
        AccusedMasterID: 5000 + i,
        CaseMasterID: caseMasterId,
        AccusedName: accName,
        AgeYear: 22 + (i % 35),
        GenderID: 1,
        PersonID: `A${i}`
      }
    ],

    ArrestSurrender: [
      {
        ArrestSurrenderID: 6000 + i,
        CaseMasterID: caseMasterId,
        ArrestSurrenderTypeID: 1,
        ArrestSurrenderDate: regDate,
        ArrestSurrenderStateID: 29,
        ArrestSurrenderStateId: 29,
        ArrestSurrenderDistrictID: distObj.id,
        ArrestSurrenderDistrictId: distObj.id,
        PoliceStationID: stationId,
        IOID: 200 + i,
        CourtID: 500 + ((i % 10) + 1),
        AccusedMasterID: 5000 + i,
        IsAccused: 1,
        IsComplainantAccused: 0
      }
    ],

    ChargesheetDetails: {
      CSID: 7000 + i,
      CaseMasterID: caseMasterId,
      csdate: regDate,
      cstype: statusObj.cstype,
      PolicePersonID: 200 + i
    },

    // Hydrated UI Display Attributes
    id: `fir-${caseMasterId}`,
    ROWID: caseMasterId,
    crimeNo: crimeNo,
    caseNo: caseNo,
    regDate: regDate,
    district: distObj.name,
    District: distObj.name,
    unit: stationName,
    PoliceStation: stationName,
    crimeHead: majorHead.name,
    CrimeCategory: majorHead.name,
    crimeSubHead: majorHead.subName,
    actSections: majorHead.sec,
    ActSections: majorHead.sec,
    severity: severity,
    Severity: severity,
    status: statusObj.name,
    Status: statusObj.name,
    complainantName: compName,
    ComplainantName: compName,
    allottedOfficerName: officerName,
    OfficerName: officerName,
    allottedOfficerRank: rankObj.short,
    allottedOfficerKgid: kgid,
    accusedName: accName,
    AccusedName: accName,
    briefFacts: briefFacts,
    Description: briefFacts,
    propertyDescription: majorHead.name.includes("Property") ? `Seized goods / item log #${i}` : `Evidence catalogued under mahazar #${i}`,
    estimatedValue: (i * 12500) + 25000,
    officialReportImage: "https://images.unsplash.com/photo-1568667256549-094345857637?q=80&w=800&auto=format&fit=crop",
    lat: lat,
    Latitude: lat,
    lng: lng,
    Longitude: lng,
    locationStreet: street
  };

  records.push(record);
}

// Full 26-table ER Diagram Database Export Structure
const fullDatabaseSchema = {
  State: [
    { StateID: 29, StateName: "Karnataka", NationalityID: 1, Active: 1 }
  ],
  District: districtsList.map(d => ({ DistrictID: d.id, DistrictName: d.name, StateID: 29, Active: 1 })),
  UnitType: [
    { UnitTypeID: 1, UnitTypeName: "Police Station", CityDistState: "District" },
    { UnitTypeID: 2, UnitTypeName: "Circle Office", CityDistState: "District" }
  ],
  Unit: districtsList.map((d, index) => ({
    UnitID: 301 + index,
    UnitName: `${d.name.replace(" District", "").replace(" City", "")} Central PS`,
    TypeID: 1,
    ParentUnit: 0,
    NationalityID: 1,
    StateID: 29,
    DistrictID: d.id,
    Active: 1
  })),
  Rank: [
    { RankID: 1, RankName: "Police Sub-Inspector (PSI)", Hierarchy: 3, Active: 1 },
    { RankID: 2, RankName: "Police Inspector (PI)", Hierarchy: 2, Active: 1 },
    { RankID: 3, RankName: "Deputy Superintendent of Police (DySP)", Hierarchy: 1, Active: 1 },
    { RankID: 4, RankName: "Assistant Commissioner of Police (ACP)", Hierarchy: 1, Active: 1 },
    { RankID: 5, RankName: "Head Constable (HC)", Hierarchy: 4, Active: 1 }
  ],
  Designation: [
    { DesignationID: 1, DesignationName: "Investigating Officer (IO)", Active: 1, SortOrder: 1 },
    { DesignationID: 2, DesignationName: "Station House Officer (SHO)", Active: 1, SortOrder: 2 },
    { DesignationID: 3, DesignationName: "Crime Inspector", Active: 1, SortOrder: 3 }
  ],
  Employee: records.map(r => ({
    EmployeeID: r.PolicePersonID,
    DistrictID: 101,
    UnitID: r.PoliceStationID,
    RankID: 1,
    DesignationID: 1,
    KGID: r.allottedOfficerKgid,
    FirstName: r.allottedOfficerName,
    EmployeeDOB: "1985-05-15",
    GenderID: 1,
    BloodGroupID: 1,
    PhysicallyChallenged: 0,
    AppointmentDate: "2010-06-01"
  })),
  CaseCategory: [
    { CaseCategoryID: 1, LookupValue: "FIR" },
    { CaseCategoryID: 2, LookupValue: "UDR" },
    { CaseCategoryID: 3, LookupValue: "PAR" }
  ],
  GravityOffence: [
    { GravityOffenceID: 1, LookupValue: "Heinous" },
    { GravityOffenceID: 2, LookupValue: "Non-Heinous" }
  ],
  CrimeHead: majorHeads.map(m => ({ CrimeHeadID: m.id, CrimeGroupName: m.name, Active: 1 })),
  CrimeSubHead: majorHeads.map(m => ({ CrimeSubHeadID: m.subId, CrimeHeadID: m.id, CrimeHeadName: m.subName, SeqID: 1 })),
  CaseStatusMaster: caseStatuses.map(s => ({ CaseStatusID: s.id, CaseStatusName: s.name })),
  Court: [1, 2, 3, 4, 5].map(id => ({ CourtID: 500 + id, CourtName: `Metropolitan Magistrate Court ${id}`, DistrictID: 101, StateID: 29, Active: 1 })),
  Act: [
    { ActCode: "IPC", ActDescription: "Indian Penal Code", ShortName: "IPC", Active: 1 },
    { ActCode: "NDPS", ActDescription: "Narcotic Drugs & Psychotropic Substances Act", ShortName: "NDPS", Active: 1 },
    { ActCode: "IT Act", ActDescription: "Information Technology Act", ShortName: "IT Act", Active: 1 },
    { ActCode: "POCSO", ActDescription: "Protection of Children from Sexual Offences Act", ShortName: "POCSO", Active: 1 }
  ],
  Section: [
    { ActCode: "IPC", SectionCode: "Sec 302", SectionDescription: "Murder", Active: 1 },
    { ActCode: "IPC", SectionCode: "Sec 379", SectionDescription: "Theft", Active: 1 },
    { ActCode: "IPC", SectionCode: "Sec 395", SectionDescription: "Dacoity", Active: 1 },
    { ActCode: "IT Act", SectionCode: "Sec 66D", SectionDescription: "Cheating by Personation Using Computer Resource", Active: 1 },
    { ActCode: "NDPS", SectionCode: "Sec 20(b)", SectionDescription: "Possession of Cannabis", Active: 1 }
  ],
  CasteMaster: [{ caste_master_id: 1, caste_master_name: "General" }],
  ReligionMaster: [{ ReligionID: 1, ReligionName: "Hindu" }],
  OccupationMaster: [{ OccupationID: 1, OccupationName: "Private Employee" }],

  CrimeHeadActSection: [
    { CrimeHeadID: 1, ActCode: "IPC", SectionCode: "Sec 379" },
    { CrimeHeadID: 1, ActCode: "IPC", SectionCode: "Sec 395" },
    { CrimeHeadID: 2, ActCode: "IPC", SectionCode: "Sec 302" },
    { CrimeHeadID: 3, ActCode: "IT Act", SectionCode: "Sec 66D" },
    { CrimeHeadID: 5, ActCode: "NDPS", SectionCode: "Sec 20(b)" }
  ],
  Inv_OccuranceTime: records.map(r => ({
    CaseMasterID: r.CaseMasterID,
    IncidentFromDate: r.IncidentFromDate,
    IncidentToDate: r.IncidentToDate,
    InfoReceivedPSDate: r.InfoReceivedPSDate
  })),

  // Transactional Case Master array
  CaseMaster: records,

  // Child collections
  ComplainantDetails: records.map(r => r.ComplainantDetails),
  Victim: records.flatMap(r => r.Victim),
  Accused: records.flatMap(r => r.Accused),
  ActSectionAssociation: records.flatMap(r => r.ActSectionAssociation),
  ArrestSurrender: records.flatMap(r => r.ArrestSurrender),
  ChargesheetDetails: records.map(r => r.ChargesheetDetails)
};

// 1. Write to local_crime_records.json
const localSeedPath = path.join(__dirname, "../datathon-chatbot/functions/chat/local_crime_records.json");
fs.writeFileSync(localSeedPath, JSON.stringify(fullDatabaseSchema, null, 2), "utf-8");

// 2. Write to datastore_db.json
const datastoreDbPath = path.join(__dirname, "../datathon-chatbot/functions/chat/datastore_db.json");
fs.writeFileSync(datastoreDbPath, JSON.stringify(fullDatabaseSchema, null, 2), "utf-8");

console.log(`[ER Diagram Seeder] Successfully generated full 26-Table ER Diagram Schema (200 CaseMaster FIR records) into local_crime_records.json and datastore_db.json!`);

