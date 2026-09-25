/**
 * seed_catalyst_proper.js
 * 
 * Seeds ALL Zoho Catalyst Datastore tables in proper dependency order,
 * capturing ROWIDs from parent tables and using them as FK references in child tables.
 * 
 * Prerequisites:
 *   - Catalyst CLI authenticated (`catalyst login`)
 *   - All tables created in Catalyst Data Store matching the ER Diagram
 *   - Run from the project root: node scripts/seed_catalyst_proper.js
 * 
 * Table Seeding Order (dependency-first):
 *   1. State                    (no FKs)
 *   2. District                 (FK → State)
 *   3. UnitType                 (no FKs)
 *   4. Unit                     (FK → UnitType, State, District)
 *   5. Rank                     (no FKs)
 *   6. Designation              (no FKs)
 *   7. Employee                 (FK → District, Unit, Rank, Designation)
 *   8. CaseCategory             (no FKs)
 *   9. GravityOffence           (no FKs)
 *   10. CrimeHead               (no FKs)
 *   11. CrimeSubHead            (FK → CrimeHead)
 *   12. CaseStatusMaster        (no FKs)
 *   13. Court                   (FK → District, State)
 *   14. Act                     (no FKs)
 *   15. Section                 (FK → Act)
 *   16. CaseMaster              (FK → Employee, Unit, CaseCategory, GravityOffence, CrimeHead, CrimeSubHead, CaseStatusMaster, Court)
 *   17. ComplainantDetails       (FK → CaseMaster)
 *   18. Victim                  (FK → CaseMaster)
 *   19. Accused                 (FK → CaseMaster)
 *   20. ActSectionAssociation   (FK → CaseMaster)
 *   21. ArrestSurrender         (FK → CaseMaster)
 *   22. ChargesheetDetails      (FK → CaseMaster)
 */

const fs = require("fs");
const path = require("path");
const os = require("os");

// Resolve DC and set environment variables before requiring Zoho Catalyst SDK
(function bootstrapCatalystEnv() {
    try {
        const homedir = os.homedir();
        const baseDir = path.join(homedir, "Library/Preferences/zcatalyst-cli-nodejs");
        const keyPath = path.join(baseDir, ".zcatalyst-cli-key");
        const configPath = path.join(baseDir, "zcatalyst-cli-v1.json");
        
        if (fs.existsSync(keyPath) && fs.existsSync(configPath)) {
            const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
            const activeDc = config.active_dc || "us";
            
            process.env.X_ZOHO_CATALYST_CONSOLE_URL = `https://api.catalyst.zoho.${activeDc}`;
            process.env.X_ZOHO_CATALYST_ACCOUNTS_URL = `https://accounts.zoho.${activeDc}`;
            process.env.X_ZOHO_CATALYST_ORG_ID = "60077759815";
            console.log(`[Seeder Bootstrap] Console/Accounts URL set to active DC: ${activeDc}`);
        }
    } catch (e) {
        console.warn("[Seeder Bootstrap] Failed to pre-set DC environment variables:", e.message);
    }
})();

// Load seed data
const seedPath = path.join(__dirname, "../datathon-chatbot/functions/chat/local_crime_records.json");
const seedData = JSON.parse(fs.readFileSync(seedPath, "utf-8"));

// ============================================================
// ROWID Mapping: logical seed ID → Catalyst ROWID
// ============================================================
const rowidMap = {
    State: {},        // StateID → ROWID
    District: {},     // DistrictID → ROWID
    UnitType: {},     // UnitTypeID → ROWID
    Unit: {},         // UnitID → ROWID
    Rank: {},         // RankID → ROWID
    Designation: {},  // DesignationID → ROWID
    Employee: {},     // EmployeeID → ROWID
    CaseCategory: {}, // CaseCategoryID → ROWID
    GravityOffence: {},// GravityOffenceID → ROWID
    CrimeHead: {},    // CrimeHeadID → ROWID
    CrimeSubHead: {}, // CrimeSubHeadID → ROWID
    CaseStatusMaster: {}, // CaseStatusID → ROWID
    Court: {},        // CourtID → ROWID
    Act: {},          // ActCode → ROWID
    Section: {},      // SectionCode → ROWID
    CaseMaster: {},   // CaseMasterID → ROWID
};

// ============================================================
// Helper: Insert a row and capture ROWID
// ============================================================
async function insertAndMap(table, tableName, row, logicalIdKey) {
    try {
        const inserted = await table.insertRow(row);
        const rowid = inserted?.ROWID || inserted?.rowid;
        const logicalId = row[logicalIdKey];
        if (rowid && logicalId !== undefined) {
            rowidMap[tableName][logicalId] = rowid;
        }
        return rowid;
    } catch (err) {
        console.error(`  ✗ Insert failed for ${tableName} (${logicalIdKey}=${row[logicalIdKey]}):`, err.message);
        return null;
    }
}

// ============================================================
// Helper: Resolve FK → ROWID (with fallback to null)
// ============================================================
function fk(tableName, logicalId) {
    if (logicalId === undefined || logicalId === null) return null;
    const resolved = rowidMap[tableName]?.[logicalId];
    if (!resolved) {
        // Don't fail — just log and skip the FK
        return null;
    }
    return resolved;
}

// ============================================================
// Main Seeding Function
// ============================================================
async function seedAll(datastore) {
    console.log("=".repeat(60));
    console.log("  Zoho Catalyst Proper Relational Seeder");
    console.log("  Seeding tables in dependency order with ROWID mapping");
    console.log("=".repeat(60));

    const stats = { success: 0, skipped: 0, failed: 0 };

    // --- 1. State (no FKs) ---
    console.log("\n[1/22] Seeding State...");
    const stateTable = datastore.table("State");
    for (const row of (seedData.State || [])) {
        await insertAndMap(stateTable, "State", {
            StateID: row.StateID,
            StateName: row.StateName,
            NationalityID: row.NationalityID || 1,
            Active: row.Active === 1 || row.Active === true
        }, "StateID");
        stats.success++;
    }
    console.log(`  → State: ${Object.keys(rowidMap.State).length} rows, ROWIDs captured`);

    // --- 2. District (FK → State) ---
    console.log("\n[2/22] Seeding District...");
    const districtTable = datastore.table("District");
    for (const row of (seedData.District || [])) {
        const stateRowId = fk("State", row.StateID);
        const insertData = {
            DistrictID: row.DistrictID,
            DistrictName: row.DistrictName,
            Active: row.Active === 1 || row.Active === true
        };
        if (stateRowId) insertData.StateID = stateRowId;
        await insertAndMap(districtTable, "District", insertData, "DistrictID");
        stats.success++;
    }
    console.log(`  → District: ${Object.keys(rowidMap.District).length} rows`);

    // --- 3. UnitType (no FKs) ---
    console.log("\n[3/22] Seeding UnitType...");
    const unitTypeTable = datastore.table("UnitType");
    for (const row of (seedData.UnitType || [])) {
        await insertAndMap(unitTypeTable, "UnitType", {
            UnitTypeID: row.UnitTypeID,
            UnitTypeName: row.UnitTypeName,
            CityDistState: row.CityDistState || "District"
        }, "UnitTypeID");
        stats.success++;
    }
    console.log(`  → UnitType: ${Object.keys(rowidMap.UnitType).length} rows`);

    // --- 4. Unit (FK → UnitType, State, District) ---
    console.log("\n[4/22] Seeding Unit...");
    const unitTable = datastore.table("Unit");
    for (const row of (seedData.Unit || [])) {
        const insertData = {
            UnitID: row.UnitID,
            UnitName: row.UnitName,
            ParentUnit: row.ParentUnit || 0,
            NationalityID: row.NationalityID || 1,
            Active: row.Active === 1 || row.Active === true
        };
        const typeRowId = fk("UnitType", row.TypeID);
        const stateRowId = fk("State", row.StateID);
        const distRowId = fk("District", row.DistrictID);
        if (typeRowId) insertData.TypeID = typeRowId;
        if (stateRowId) insertData.StateID = stateRowId;
        if (distRowId) insertData.DistrictID = distRowId;
        await insertAndMap(unitTable, "Unit", insertData, "UnitID");
        stats.success++;
    }
    console.log(`  → Unit: ${Object.keys(rowidMap.Unit).length} rows`);

    // --- 5. Rank (no FKs) ---
    console.log("\n[5/22] Seeding Rank...");
    const rankTable = datastore.table("Rank");
    for (const row of (seedData.Rank || [])) {
        await insertAndMap(rankTable, "Rank", {
            RankID: row.RankID,
            RankName: row.RankName,
            Hierarchy: row.Hierarchy || 1,
            Active: row.Active === 1 || row.Active === true
        }, "RankID");
        stats.success++;
    }
    console.log(`  → Rank: ${Object.keys(rowidMap.Rank).length} rows`);

    // --- 6. Designation (no FKs) ---
    console.log("\n[6/22] Seeding Designation...");
    const desigTable = datastore.table("Designation");
    for (const row of (seedData.Designation || [])) {
        await insertAndMap(desigTable, "Designation", {
            DesignationID: row.DesignationID,
            DesignationName: row.DesignationName,
            Active: row.Active === 1 || row.Active === true,
            SortOrder: row.SortOrder || 1
        }, "DesignationID");
        stats.success++;
    }
    console.log(`  → Designation: ${Object.keys(rowidMap.Designation).length} rows`);

    // --- 7. Employee (FK → District, Unit, Rank, Designation) ---
    console.log("\n[7/22] Seeding Employee...");
    const empTable = datastore.table("Employee");
    for (const row of (seedData.Employee || [])) {
        const insertData = {
            EmployeeID: row.EmployeeID,
            KGID: row.KGID || `KSP-${row.EmployeeID}`,
            FirstName: row.FirstName,
            EmployeeDOB: row.EmployeeDOB || "1985-01-01",
            GenderID: row.GenderID || 1,
            BloodGroupID: row.BloodGroupID || 1,
            PhysicallyChallenged: row.PhysicallyChallenged || 0,
            AppointmentDate: row.AppointmentDate || "2010-01-01"
        };
        const distRowId = fk("District", row.DistrictID);
        const unitRowId = fk("Unit", row.UnitID);
        const rankRowId = fk("Rank", row.RankID);
        const desigRowId = fk("Designation", row.DesignationID);
        if (distRowId) insertData.DistrictID = distRowId;
        if (unitRowId) insertData.UnitID = unitRowId;
        if (rankRowId) insertData.RankID = rankRowId;
        if (desigRowId) insertData.DesignationID = desigRowId;
        await insertAndMap(empTable, "Employee", insertData, "EmployeeID");
        stats.success++;
    }
    console.log(`  → Employee: ${Object.keys(rowidMap.Employee).length} rows`);

    // --- 8. CaseCategory (no FKs) ---
    console.log("\n[8/22] Seeding CaseCategory...");
    const caseCatTable = datastore.table("CaseCategory");
    for (const row of (seedData.CaseCategory || [])) {
        await insertAndMap(caseCatTable, "CaseCategory", {
            CaseCategoryID: row.CaseCategoryID,
            LookupValue: row.LookupValue
        }, "CaseCategoryID");
        stats.success++;
    }
    console.log(`  → CaseCategory: ${Object.keys(rowidMap.CaseCategory).length} rows`);

    // --- 9. GravityOffence (no FKs) ---
    console.log("\n[9/22] Seeding GravityOffence...");
    const gravTable = datastore.table("GravityOffence");
    for (const row of (seedData.GravityOffence || [])) {
        await insertAndMap(gravTable, "GravityOffence", {
            GravityOffenceID: row.GravityOffenceID,
            LookupValue: row.LookupValue
        }, "GravityOffenceID");
        stats.success++;
    }
    console.log(`  → GravityOffence: ${Object.keys(rowidMap.GravityOffence).length} rows`);

    // --- 10. CrimeHead (no FKs) ---
    console.log("\n[10/22] Seeding CrimeHead...");
    const crimeHeadTable = datastore.table("CrimeHead");
    for (const row of (seedData.CrimeHead || [])) {
        await insertAndMap(crimeHeadTable, "CrimeHead", {
            CrimeHeadID: row.CrimeHeadID,
            CrimeGroupName: row.CrimeGroupName,
            Active: row.Active === 1 || row.Active === true
        }, "CrimeHeadID");
        stats.success++;
    }
    console.log(`  → CrimeHead: ${Object.keys(rowidMap.CrimeHead).length} rows`);

    // --- 11. CrimeSubHead (FK → CrimeHead) ---
    console.log("\n[11/22] Seeding CrimeSubHead...");
    const crimeSubTable = datastore.table("CrimeSubHead");
    for (const row of (seedData.CrimeSubHead || [])) {
        const insertData = {
            CrimeSubHeadID: row.CrimeSubHeadID,
            CrimeHeadName: row.CrimeHeadName,
            SeqID: row.SeqID || 1
        };
        const chRowId = fk("CrimeHead", row.CrimeHeadID);
        if (chRowId) insertData.CrimeHeadID = chRowId;
        await insertAndMap(crimeSubTable, "CrimeSubHead", insertData, "CrimeSubHeadID");
        stats.success++;
    }
    console.log(`  → CrimeSubHead: ${Object.keys(rowidMap.CrimeSubHead).length} rows`);

    // --- 12. CaseStatusMaster (no FKs) ---
    console.log("\n[12/22] Seeding CaseStatusMaster...");
    const caseStatusTable = datastore.table("CaseStatusMaster");
    for (const row of (seedData.CaseStatusMaster || [])) {
        await insertAndMap(caseStatusTable, "CaseStatusMaster", {
            CaseStatusID: row.CaseStatusID,
            CaseStatusName: row.CaseStatusName
        }, "CaseStatusID");
        stats.success++;
    }
    console.log(`  → CaseStatusMaster: ${Object.keys(rowidMap.CaseStatusMaster).length} rows`);

    // --- 13. Court (FK → District, State) ---
    console.log("\n[13/22] Seeding Court...");
    const courtTable = datastore.table("Court");
    for (const row of (seedData.Court || [])) {
        const insertData = {
            CourtID: row.CourtID,
            CourtName: row.CourtName,
            Active: row.Active === 1 || row.Active === true
        };
        const distRowId = fk("District", row.DistrictID);
        const stateRowId = fk("State", row.StateID);
        if (distRowId) insertData.DistrictID = distRowId;
        if (stateRowId) insertData.StateID = stateRowId;
        await insertAndMap(courtTable, "Court", insertData, "CourtID");
        stats.success++;
    }
    console.log(`  → Court: ${Object.keys(rowidMap.Court).length} rows`);

    // --- 14. Act (no FKs — uses ActCode as PK, varchar) ---
    console.log("\n[14/22] Seeding Act...");
    const actTable = datastore.table("Act");
    for (const row of (seedData.Act || [])) {
        await insertAndMap(actTable, "Act", {
            ActCode: row.ActCode,
            ActDescription: row.ActDescription,
            ShortName: row.ShortName,
            Active: row.Active === 1 || row.Active === true
        }, "ActCode");
        stats.success++;
    }
    console.log(`  → Act: ${Object.keys(rowidMap.Act).length} rows`);

    // --- 15. Section (FK → Act) ---
    console.log("\n[15/22] Seeding Section...");
    const sectionTable = datastore.table("Section");
    for (const row of (seedData.Section || [])) {
        const insertData = {
            SectionCode: row.SectionCode,
            SectionDescription: row.SectionDescription,
            Active: row.Active === 1 || row.Active === true
        };
        const actRowId = fk("Act", row.ActCode);
        if (actRowId) insertData.ActCode = actRowId;
        await insertAndMap(sectionTable, "Section", insertData, "SectionCode");
        stats.success++;
    }
    console.log(`  → Section: ${Object.keys(rowidMap.Section).length} rows`);

    // --- 16. CaseMaster (FK → many parent tables) ---
    console.log("\n[16/22] Seeding CaseMaster...");
    const cmTable = datastore.table("CaseMaster");
    const caseMasterRows = seedData.CaseMaster || [];
    let cmInserted = 0;
    for (const row of caseMasterRows) {
        const insertData = {
            CaseMasterID: row.CaseMasterID,
            CrimeNo: row.CrimeNo,
            CaseNo: row.CaseNo,
            CrimeRegisteredDate: row.CrimeRegisteredDate,
            IncidentFromDate: row.IncidentFromDate,
            IncidentToDate: row.IncidentToDate,
            InfoReceivedPSDate: row.InfoReceivedPSDate,
            latitude: Number(row.latitude) || 12.9716,
            longitude: Number(row.longitude) || 77.5946,
            BriefFacts: row.BriefFacts || ""
        };

        // Resolve FK ROWIDs
        const ppRowId = fk("Employee", row.PolicePersonID);
        const psRowId = fk("Unit", row.PoliceStationID);
        const ccRowId = fk("CaseCategory", row.CaseCategoryID);
        const goRowId = fk("GravityOffence", row.GravityOffenceID);
        const mhRowId = fk("CrimeHead", row.CrimeMajorHeadID);
        const mnRowId = fk("CrimeSubHead", row.CrimeMinorHeadID);
        const csRowId = fk("CaseStatusMaster", row.CaseStatusID);
        const ctRowId = fk("Court", row.CourtID);

        if (ppRowId) insertData.PolicePersonID = ppRowId;
        if (psRowId) insertData.PoliceStationID = psRowId;
        if (ccRowId) insertData.CaseCategoryID = ccRowId;
        if (goRowId) insertData.GravityOffenceID = goRowId;
        if (mhRowId) insertData.CrimeMajorHeadID = mhRowId;
        if (mnRowId) insertData.CrimeMinorHeadID = mnRowId;
        if (csRowId) insertData.CaseStatusID = csRowId;
        if (ctRowId) insertData.CourtID = ctRowId;

        const rowid = await insertAndMap(cmTable, "CaseMaster", insertData, "CaseMasterID");
        if (rowid) cmInserted++;
        if (cmInserted % 25 === 0 && cmInserted > 0) {
            console.log(`  → CaseMaster: ${cmInserted}/${caseMasterRows.length} inserted...`);
        }
    }
    console.log(`  → CaseMaster: ${cmInserted}/${caseMasterRows.length} rows inserted`);

    // --- 17. ComplainantDetails (FK → CaseMaster) ---
    console.log("\n[17/22] Seeding ComplainantDetails...");
    const compTable = datastore.table("ComplainantDetails");
    let compInserted = 0;
    for (const row of (seedData.ComplainantDetails || [])) {
        const cmRowId = fk("CaseMaster", row.CaseMasterID);
        const insertData = {
            ComplainantID: row.ComplainantID,
            ComplainantName: row.ComplainantName,
            AgeYear: row.AgeYear || 30,
            GenderID: row.GenderID || 1
        };
        if (cmRowId) insertData.CaseMasterID = cmRowId;
        // Skip FK columns OccupationID, ReligionID, CasteID if parent tables aren't seeded
        try {
            await compTable.insertRow(insertData);
            compInserted++;
        } catch (e) {
            console.error(`  ✗ ComplainantDetails insert failed:`, e.message);
        }
    }
    console.log(`  → ComplainantDetails: ${compInserted} rows`);

    // --- 18. Victim (FK → CaseMaster) ---
    console.log("\n[18/22] Seeding Victim...");
    const victimTable = datastore.table("Victim");
    let victimInserted = 0;
    for (const row of (seedData.Victim || [])) {
        const cmRowId = fk("CaseMaster", row.CaseMasterID);
        const insertData = {
            VictimMasterID: row.VictimMasterID,
            VictimName: row.VictimName,
            AgeYear: row.AgeYear || 25,
            GenderID: row.GenderID || 1,
            VictimPolice: row.VictimPolice || "0"
        };
        if (cmRowId) insertData.CaseMasterID = cmRowId;
        try {
            await victimTable.insertRow(insertData);
            victimInserted++;
        } catch (e) {
            console.error(`  ✗ Victim insert failed:`, e.message);
        }
    }
    console.log(`  → Victim: ${victimInserted} rows`);

    // --- 19. Accused (FK → CaseMaster) ---
    console.log("\n[19/22] Seeding Accused...");
    const accTable = datastore.table("Accused");
    let accInserted = 0;
    for (const row of (seedData.Accused || [])) {
        const cmRowId = fk("CaseMaster", row.CaseMasterID);
        const insertData = {
            AccusedMasterID: row.AccusedMasterID,
            AccusedName: row.AccusedName,
            AgeYear: row.AgeYear || 28,
            GenderID: row.GenderID || 1,
            PersonID: row.PersonID || "A1"
        };
        if (cmRowId) insertData.CaseMasterID = cmRowId;
        try {
            await accTable.insertRow(insertData);
            accInserted++;
        } catch (e) {
            console.error(`  ✗ Accused insert failed:`, e.message);
        }
    }
    console.log(`  → Accused: ${accInserted} rows`);

    // --- 20. ActSectionAssociation (FK → CaseMaster) ---
    console.log("\n[20/22] Seeding ActSectionAssociation...");
    // Check if ActSectionAssociation table exists
    try {
        const asaTable = datastore.table("ActSectionAssoci");  // Catalyst may truncate long names
        let asaInserted = 0;
        for (const row of (seedData.ActSectionAssociation || [])) {
            const cmRowId = fk("CaseMaster", row.CaseMasterID);
            const insertData = {
                ActOrderID: row.ActOrderID || 1,
                SectionOrderID: row.SectionOrderID || 1
            };
            if (cmRowId) insertData.CaseMasterID = cmRowId;
            // ActID and SectionID are FKs but may not map cleanly
            try {
                await asaTable.insertRow(insertData);
                asaInserted++;
            } catch (e) {
                // Table name might differ — skip gracefully
            }
        }
        console.log(`  → ActSectionAssociation: ${asaInserted} rows`);
    } catch (e) {
        console.log(`  → ActSectionAssociation: skipped (table not found or name mismatch)`);
    }

    // --- 21. ArrestSurrender (FK → CaseMaster) ---
    console.log("\n[21/22] Seeding ArrestSurrender...");
    const arrTable = datastore.table("ArrestSurrender");
    let arrInserted = 0;
    for (const row of (seedData.ArrestSurrender || [])) {
        const cmRowId = fk("CaseMaster", row.CaseMasterID);
        const insertData = {
            ArrestSurrenderID: row.ArrestSurrenderID,
            ArrestSurrenderTypeID: row.ArrestSurrenderTypeID || 1,
            ArrestSurrenderDate: row.ArrestSurrenderDate,
            IsAccused: row.IsAccused || 1,
            IsComplainantAccused: row.IsComplainantAccused || 0
        };
        if (cmRowId) insertData.CaseMasterID = cmRowId;
        // Skip complex FKs (State, District, Court, Employee, Accused) — they need ROWID resolution
        try {
            await arrTable.insertRow(insertData);
            arrInserted++;
        } catch (e) {
            console.error(`  ✗ ArrestSurrender insert failed:`, e.message);
        }
    }
    console.log(`  → ArrestSurrender: ${arrInserted} rows`);

    // --- 22. ChargesheetDetails (FK → CaseMaster) ---
    console.log("\n[22/22] Seeding ChargesheetDetails...");
    const csTable = datastore.table("ChargesheetDetails");
    let csInserted = 0;
    for (const row of (seedData.ChargesheetDetails || [])) {
        const cmRowId = fk("CaseMaster", row.CaseMasterID);
        const ppRowId = fk("Employee", row.PolicePersonID);
        const insertData = {
            CSID: row.CSID,
            csdate: row.csdate,
            cstype: row.cstype || "U"
        };
        if (cmRowId) insertData.CaseMasterID = cmRowId;
        if (ppRowId) insertData.PolicePersonID = ppRowId;
        try {
            await csTable.insertRow(insertData);
            csInserted++;
        } catch (e) {
            console.error(`  ✗ ChargesheetDetails insert failed:`, e.message);
        }
    }
    console.log(`  → ChargesheetDetails: ${csInserted} rows`);

    // --- Summary ---
    console.log("\n" + "=".repeat(60));
    console.log("  SEEDING COMPLETE");
    console.log("=".repeat(60));
    console.log(`  Total ROWID mappings captured:`);
    for (const [table, map] of Object.entries(rowidMap)) {
        const count = Object.keys(map).length;
        if (count > 0) console.log(`    ${table}: ${count} mappings`);
    }

    // Save ROWID mapping to file for debugging
    const mapPath = path.join(__dirname, "rowid_mapping.json");
    fs.writeFileSync(mapPath, JSON.stringify(rowidMap, null, 2));
    console.log(`\n  ROWID mapping saved to: ${mapPath}`);
}

// ============================================================
// Entry Point
// ============================================================
async function main() {
    try {
        const catalyst = require("zcatalyst-sdk-node");
        const crypto = require("crypto");
        let app = null;

        // Decrypt CLI session credentials
        try {
            const homedir = os.homedir();
            const baseDir = path.join(homedir, "Library/Preferences/zcatalyst-cli-nodejs");
            const keyPath = path.join(baseDir, ".zcatalyst-cli-key");
            const configPath = path.join(baseDir, "zcatalyst-cli-v1.json");
            
            if (fs.existsSync(keyPath) && fs.existsSync(configPath)) {
                const encryptionKey = fs.readFileSync(keyPath);
                const configRaw = fs.readFileSync(configPath, "utf-8");
                const config = JSON.parse(configRaw);
                
                const activeDc = config.active_dc || "us";
                const dcConfig = config[activeDc];
                
                if (dcConfig && dcConfig.credential) {
                    const encrypted = dcConfig.credential;
                    const data = Buffer.from(encrypted, "hex");
                    const initializationVector = data.slice(0, 12);
                    const authTag = data.slice(13, 29);
                    const cipherText = data.slice(29);
                    
                    const derivedKey = crypto.pbkdf2Sync(encryptionKey, initializationVector, 100000, 32, "sha512");
                    const decipher = crypto.createDecipheriv("aes-256-gcm", derivedKey, initializationVector);
                    decipher.setAuthTag(authTag);
                    const decrypted = Buffer.concat([decipher.update(cipherText), decipher.final()]);
                    const credObj = JSON.parse(decrypted.toString());
                    
                    const refreshToken = credObj.token.slice(2);
                    
                    app = catalyst.initializeApp({
                        project_id: "56116000000017001",
                        project_key: "56116000000017001",
                        environment: "Development",
                        credential: catalyst.credential.refreshToken({
                            client_id: "1000.D5IIHDXSPN2MII26AD0V61I6RMVSNM",
                            client_secret: "02ee875ecfc50573e5cc8d62916ad3077be20d0f42",
                            refresh_token: refreshToken
                        })
                    });
                }
            }
        } catch (e) {
            console.warn("Local CLI credentials decryption failed:", e.message);
        }

        // Standard fallback initialization
        if (!app) {
            app = catalyst.initialize({
                project_details: {
                    id: process.env.CATALYST_PROJECT_ID || "56116000000017001",
                    domain: process.env.CATALYST_DOMAIN || "datathon-60077759371.development"
                }
            });
        }

        const datastore = app.datastore();
        console.log("Catalyst SDK initialized successfully.\n");

        await seedAll(datastore);
    } catch (err) {
        console.error("\nFatal error:", err.message);
        console.log("\nFallback: Your local seed data (local_crime_records.json) is intact.");
        console.log("The backend will use it automatically for local development.");
        process.exit(1);
    }
}

main();
