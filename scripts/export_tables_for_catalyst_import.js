/**
 * export_tables_for_catalyst_import.js
 * 
 * Generates ready-to-import CSV & JSON files for all 27 relational tables
 * for direct upload into Zoho Catalyst Data Store via Console or CLI (catalyst ds:import).
 * 
 * Usage:
 *   node scripts/export_tables_for_catalyst_import.js
 */

const fs = require("fs");
const path = require("path");

const rawDataPath = path.join(__dirname, "../datathon-chatbot/functions/chat/local_crime_records.json");
const dbSchema = JSON.parse(fs.readFileSync(rawDataPath, "utf-8"));

const outputDir = path.join(__dirname, "cloud_tables_import");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

function jsonToCsv(items) {
  if (!items || !items.length) return "";
  
  // Extract headers
  const headers = Object.keys(items[0]).filter(k => typeof items[0][k] !== "object");
  const csvRows = [];
  
  // Header row
  csvRows.push(headers.join(","));
  
  // Data rows
  for (const item of items) {
    const values = headers.map(header => {
      let val = item[header];
      if (val === undefined || val === null) return "";
      const str = String(val).replace(/"/g, '""');
      return str.includes(",") || str.includes("\n") || str.includes('"') ? `"${str}"` : str;
    });
    csvRows.push(values.join(","));
  }
  
  return csvRows.join("\n");
}

console.log(`=======================================================`);
console.log(`  Exporting Catalyst Data Store CSV & JSON Files       `);
console.log(`=======================================================`);

const tableKeys = Object.keys(dbSchema);
let count = 0;

for (const tableName of tableKeys) {
  let data = dbSchema[tableName];
  if (Array.isArray(data) && data.length > 0) {
    if (tableName === "CaseMaster") {
      data = data.map(r => ({
        ...r,
        latiutude: Number(r.latitude || r.lat || 12.9716),
        latitude: Number(r.latitude || r.lat || 12.9716),
        longitude: Number(r.longitude || r.lng || 77.5946)
      }));
    }
    // Write JSON file
    const jsonPath = path.join(outputDir, `${tableName}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), "utf-8");

    // Write CSV file
    const csvContent = jsonToCsv(data);
    if (csvContent) {
      const csvPath = path.join(outputDir, `${tableName}.csv`);
      fs.writeFileSync(csvPath, csvContent, "utf-8");
    }

    console.log(`[Exported] ${tableName} -> ${data.length} rows (${tableName}.csv & ${tableName}.json)`);
    count++;
  }
}

console.log(`\nSuccessfully generated import files for ${count} tables in:`);
console.log(`file://${outputDir}`);
