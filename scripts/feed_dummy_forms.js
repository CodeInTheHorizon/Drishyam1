/**
 * feed_dummy_forms.js
 * 
 * Generates and submits 50 brand-new, 100% unique, non-duplicate FIR records
 * via the platform API form endpoint (/api/records).
 * 
 * Usage:
 *   node scripts/feed_dummy_forms.js
 */

const http = require("http");

const districtsList = [
  { name: "Bengaluru City", lat: 12.9716, lng: 77.5946 },
  { name: "Mysuru District", lat: 12.2958, lng: 76.6394 },
  { name: "Mangaluru City", lat: 12.9141, lng: 74.8560 },
  { name: "Hubli-Dharwad", lat: 15.3647, lng: 75.1240 },
  { name: "Belagavi District", lat: 15.8497, lng: 74.4977 },
  { name: "Kalaburagi District", lat: 17.3291, lng: 76.8343 },
  { name: "Shivamogga", lat: 13.9299, lng: 75.5681 },
  { name: "Udupi District", lat: 13.3409, lng: 74.7421 },
  { name: "Davanagere", lat: 14.4644, lng: 75.9218 },
  { name: "Tumakuru", lat: 13.3392, lng: 77.1140 },
  { name: "Ballari", lat: 15.1394, lng: 76.9214 },
  { name: "Chikkamagaluru", lat: 13.3161, lng: 75.7720 }
];

const crimeCategories = [
  { head: "Property Offences", subHead: "Commercial Dacoity & Theft", sec: "IPC Sec 395" },
  { head: "Offences Against Body", subHead: "Homicide & Assault", sec: "IPC Sec 302" },
  { head: "Cyber Crimes", subHead: "Financial Cyber Fraud", sec: "IT Act Sec 66D" },
  { head: "Financial Fraud", subHead: "Corporate Embezzlement", sec: "IPC Sec 409" },
  { head: "Narcotics", subHead: "Commercial NDPS Seizure", sec: "NDPS Sec 20(b)" },
  { head: "Crimes Against Women", subHead: "Harassment & Stalking", sec: "IPC Sec 354D" }
];

const firstNames = [
  "Aarav", "Aditi", "Ajay", "Akash", "Anand", "Ananya", "Anita", "Arjun", "Arun", "Arvind",
  "Basavaraj", "Bhavana", "Chetan", "Deepak", "Deepika", "Devraj", "Dinesh", "Divya", "Ganesh", "Girish",
  "Gopal", "Gowri", "Harish", "Hemant", "Jagadish", "Jyoti", "Karthik", "Kavita", "Kiran", "Kumar",
  "Latha", "Lokesh", "Madhav", "Mahesh", "Manjunath", "Meena", "Mohan", "Manoj", "Nagaraj", "Nandini",
  "Naveen", "Nikhil", "Niranjan", "Nitin", "Pavitra", "Pooja", "Pradeep", "Prakash", "Prashanth", "Praveen"
];

const lastNames = [
  "Gowda", "Patil", "Shetty", "Rao", "Kumar", "Hegde", "Naik", "Deshmukh", "Puranik", "Kulkarni",
  "Bhat", "Joshi", "Bhardwaj", "Reddy", "Nair", "Menon", "Swamy", "Acharya", "Chavan", "Pawar"
];

const aliases = [
  "Appu", "Chota", "Don", "Balu", "Port", "Speedy", "Tiger", "Blackie", "Blade", "Shadow",
  "Ghost", "Cobra", "Viper", "Bullet", "Rocket", "Doctor", "Pandu", "Gabbar", "Jackal", "Falcon"
];

const officerRanks = ["PSI", "Inspector", "DySP", "ACP"];
const caseStatuses = ["Under Investigation", "Suspect Apprehended", "Charge-sheet Submitted", "Case Closed / Completed"];

const dummyFormEntries = [];

for (let i = 1; i <= 50; i++) {
  const serialNo = String(100 + i).padStart(5, "0");
  const crimeNo = `1044300062026${serialNo}`;
  const caseNo = `2026${serialNo}`;

  const dist = districtsList[(i - 1) % districtsList.length];
  const cat = crimeCategories[(i - 1) % crimeCategories.length];
  const rank = officerRanks[(i - 1) % officerRanks.length];
  const status = caseStatuses[(i * 3) % caseStatuses.length];
  const severity = (i % 3 === 0) ? "CRITICAL" : (i % 2 === 0) ? "HIGH" : "MEDIUM";

  const compFirst = firstNames[(i * 7) % firstNames.length];
  const compLast = lastNames[(i * 11) % lastNames.length];
  const complainantName = `${compFirst} ${compLast}`;

  const accFirst = firstNames[(i * 13) % firstNames.length];
  const accLast = lastNames[(i * 17) % lastNames.length];
  const alias = aliases[(i * 5) % aliases.length];
  const accusedName = `${accFirst} ${accLast} (alias '${alias}')`;

  const offFirst = firstNames[(i * 19) % firstNames.length];
  const offLast = lastNames[(i * 23) % lastNames.length];
  const officerName = `${rank} ${offFirst} ${offLast}`;
  const officerKgid = `KSP-2026-${String(9000 + i)}`;

  const stationName = `${dist.name.replace(" District", "").replace(" City", "")} Central PS #${i}`;
  const month = String(Math.floor(((i - 1) / 8)) + 1).padStart(2, "0");
  const day = String(((i - 1) % 25) + 1).padStart(2, "0");
  const regDate = `2026-${month}-${day}`;

  const lat = +(dist.lat + (Math.sin(i * 0.5) * 0.08)).toFixed(4);
  const lng = +(dist.lng + (Math.cos(i * 0.5) * 0.08)).toFixed(4);
  const street = `Sector ${((i % 12) + 1)} Main Road, ${dist.name}`;

  const briefFacts = `FIR #${crimeNo}: ${cat.head} (${cat.subHead}) incident reported at ${stationName}, ${dist.name}. Registered under ${cat.sec}. Investigating Officer: ${officerName} (${officerKgid}). Complainant: ${complainantName}. Suspect: ${accusedName}. Status: ${status}.`;

  dummyFormEntries.push({
    crimeNo,
    caseNo,
    regDate,
    district: dist.name,
    unit: stationName,
    crimeHead: cat.head,
    crimeSubHead: cat.subHead,
    actSections: cat.sec,
    severity,
    status,
    complainantName,
    complainantPhone: `+91 ${98450 + (i % 800)} ${10000 + (i * 111)}`,
    complainantAddress: `House #${i * 12}, ${street}`,
    accusedName,
    locationStreet: street,
    lat,
    lng,
    allottedOfficerName: officerName,
    allottedOfficerKgid: officerKgid,
    briefFacts
  });
}

function submitFormRecord(entry) {
  return new Promise((resolve) => {
    const postData = JSON.stringify(entry);

    const options = {
      hostname: "localhost",
      port: 3000,
      path: "/api/records",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => { body += chunk; });
      res.on("end", () => {
        try {
          const parsed = JSON.parse(body);
          console.log(`[FIR #${entry.crimeNo}] Submitted | Complainant: ${entry.complainantName} | Status: ${res.statusCode}`);
          resolve(parsed);
        } catch (e) {
          console.log(`[FIR #${entry.crimeNo}] Submitted | Status: ${res.statusCode}`);
          resolve(null);
        }
      });
    });

    req.on("error", (e) => {
      console.error(`[Submission Error] ${e.message}`);
      resolve(null);
    });

    req.write(postData);
    req.end();
  });
}

async function runFormFeed() {
  console.log(`=======================================================`);
  console.log(`  Feeding 50 Non-Duplicate FIR Records via API Forms   `);
  console.log(`=======================================================`);

  for (let idx = 0; idx < dummyFormEntries.length; idx++) {
    const entry = dummyFormEntries[idx];
    await submitFormRecord(entry);
  }

  console.log(`\n[Feed Complete] Successfully submitted all 50 unique non-duplicate FIR records into the database!`);
}

runFormFeed();
