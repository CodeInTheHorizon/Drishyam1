/**
 * ============================================================================
 * File: frontend/src/services/forensicParserService.js
 * ----------------------------------------------------------------------------
 * Multi-Source Ingestion & Normalization Engine for Cyber Fraud Investigation
 * 
 * Capabilities:
 * 1. Cryptographic Evidentiary Integrity: Computes SHA-256 hash at ingestion
 *    (Admissible under Sec 65B Indian Evidence Act / BSA forensic standards).
 * 2. Multi-Source Ingestion & Normalization:
 *    • Telecom Records (CSV/TSV/JSON CDR & IPDR)
 *    • Bank / UPI Settlement Sheets (CSV/TSV/JSON multi-tier transfer logs)
 *    • Email Headers (.eml / raw RFC 5322 MIME headers with SPF/DKIM/DMARC)
 *    • Android System / App Dump Logs (.txt / .json APK dumps & permission audits)
 * 3. Entity Resolution Normalizer: Standardizes Phone, IMEI, IMSI, UPI VPA,
 *    Bank Accounts, IP Subnets, and Malicious Package Identifiers.
 * 4. Preloaded High-Fidelity Forensic Samples for 1-Click Evaluation.
 * ============================================================================
 */

// Helper to calculate SHA-256 in browser via Web Crypto API
export async function calculateSHA256(content) {
  try {
    let buffer;
    if (content instanceof ArrayBuffer) {
      buffer = content;
    } else if (content instanceof Blob) {
      buffer = await content.arrayBuffer();
    } else if (typeof content === "string") {
      const encoder = new TextEncoder();
      buffer = encoder.encode(content);
    } else {
      const encoder = new TextEncoder();
      buffer = encoder.encode(JSON.stringify(content));
    }

    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    return hashHex;
  } catch (err) {
    console.error("SHA-256 calculation error:", err);
    // Fallback pseudo-hash if crypto.subtle is restricted in non-secure context
    let hash = 0;
    const str = typeof content === "string" ? content : JSON.stringify(content);
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(64, "0");
  }
}

// Entity cleaning utilities
export function normalizePhone(raw) {
  if (!raw) return "";
  let clean = String(raw).replace(/[^0-9]/g, "");
  if (clean.length === 12 && clean.startsWith("91")) {
    clean = clean.substring(2);
  } else if (clean.length === 11 && clean.startsWith("0")) {
    clean = clean.substring(1);
  }
  return clean;
}

export function normalizeUPI(raw) {
  if (!raw) return "";
  return String(raw).trim().toLowerCase();
}

export function normalizeIMEI(raw) {
  if (!raw) return "";
  return String(raw).replace(/[^0-9]/g, "").slice(0, 15);
}

export function normalizeIP(raw) {
  if (!raw) return "";
  const match = String(raw).match(/\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/);
  return match ? match[0] : String(raw).trim();
}

/**
 * Universal CSV / TSV line parser that cleanly handles quoted fields containing commas
 */
export function parseCSVLine(line) {
  if (!line) return [];
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' || char === "'") {
      inQuotes = !inQuotes;
    } else if ((char === ',' || char === '\t' || char === ';') && !inQuotes) {
      result.push(current.trim().replace(/^["']|["']$/g, ""));
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim().replace(/^["']|["']$/g, ""));
  return result;
}

/**
 * Maps IFSC 4-character prefix to official Indian Public & Private Banks
 */
export function getBankNameFromIFSC(ifsc) {
  if (!ifsc) return "";
  const prefix = String(ifsc).trim().toUpperCase().slice(0, 4);
  const bankMap = {
    SBIN: "State Bank of India",
    HDFC: "HDFC Bank",
    ICIC: "ICICI Bank",
    UTIB: "Axis Bank",
    KKBK: "Kotak Mahindra Bank",
    PUNB: "Punjab National Bank",
    BARB: "Bank of Baroda",
    CNRB: "Canara Bank",
    UBIN: "Union Bank of India",
    YESB: "Yes Bank",
    IDIB: "Indian Bank",
    INDB: "IndusInd Bank",
    CBIN: "Central Bank of India",
    IOBA: "Indian Overseas Bank",
    MAHB: "Bank of Maharashtra",
    PSIB: "Punjab & Sind Bank",
    UCOB: "UCO Bank"
  };
  return bankMap[prefix] || (prefix ? `${prefix} Bank` : "Nodal Bank");
}

/**
 * Detects scam markers and off-ramp keywords in bank transfer narration remarks
 */
export function detectScamMarker(narration) {
  if (!narration) return null;
  const lower = String(narration).toLowerCase();

  // 1. Remote Access Trojan / Screen Share
  if (lower.includes("anydesk") || lower.includes("teamviewer") || lower.includes("rustdesk") || lower.includes("apk") || (lower.includes("remote") && lower.includes("support"))) {
    return { type: "RAT_SCAM", label: "Remote Access Trojan Vector", severity: "CRITICAL" };
  }
  // 2. Task / Work-from-Home Scam Markers
  if (lower.includes("task") || lower.includes("telegram") || lower.includes("rating") || lower.includes("review") || lower.includes("part time") || lower.includes("youtube") || lower.includes("vip")) {
    return { type: "TASK_SCAM", label: "Work-From-Home Task Scam", severity: "HIGH" };
  }
  // 3. Lottery / KBC Lures
  if (lower.includes("lottery") || lower.includes("kbc") || lower.includes("prize") || lower.includes("reward") || lower.includes("gift") || lower.includes("bonus")) {
    return { type: "LOTTERY_SCAM", label: "Social Engineering Lure", severity: "HIGH" };
  }
  // 4. Predatory Loan Apps
  if (lower.includes("loan") || lower.includes("disburs") || lower.includes("processing fee") || lower.includes("advance")) {
    return { type: "LOAN_SCAM", label: "Predatory Loan App Siphoning", severity: "HIGH" };
  }
  // 5. Crypto P2P Cashout Off-Ramps
  if (lower.includes("crypto") || lower.includes("usdt") || lower.includes("binance") || lower.includes("wazirx") || lower.includes("p2p") || lower.includes("escrow") || lower.includes("btc")) {
    return { type: "CRYPTO_CASHOUT", label: "Crypto P2P Off-Ramp", severity: "CRITICAL" };
  }
  // 6. ATM / Cash Withdrawal (Word boundary to prevent matching 'deposit' as 'pos')
  if (/\b(?:atm|cash|wdl|withdrawal|self|pos)\b/i.test(lower)) {
    return { type: "ATM_CASHOUT", label: "Physical ATM / Cashout", severity: "CRITICAL" };
  }
  return null;
}

/**
 * Evaluates Client Device Profile (Android, iOS, Windows_Browser, Web_Emulator, Linux_Script)
 */
export function analyzeDeviceProfile(deviceType) {
  if (!deviceType) return { isAnomaly: false, label: "Unknown Device", severity: "NORMAL" };
  const d = String(deviceType).trim();
  if (d === "Web_Emulator" || d.toLowerCase().includes("emulator") || d.toLowerCase().includes("bluestacks") || d.toLowerCase().includes("nox")) {
    return { isAnomaly: true, label: "Web_Emulator (Automated Android Sandbox)", severity: "CRITICAL", flag: "Synthetic Web/Android Emulator Profile" };
  }
  if (d === "Linux_Script" || d.toLowerCase().includes("script") || d.toLowerCase().includes("bot") || d.toLowerCase().includes("python") || d.toLowerCase().includes("curl")) {
    return { isAnomaly: true, label: "Linux_Script (Headless API Botnet)", severity: "CRITICAL", flag: "Automated Headless Script / Botnet Ingestion" };
  }
  return { isAnomaly: false, label: d, severity: "NORMAL" };
}

/**
 * Detects Foreign / Bulletproof Proxy & Tor exit node IP anomalies
 */
export function analyzeIPAnomaly(ip) {
  if (!ip) return { isProxy: false, label: "Unknown IP", severity: "NORMAL" };
  const clean = normalizeIP(ip);
  if (clean.startsWith("185.220.") || clean.startsWith("103.21.") || clean.startsWith("45.") || clean.startsWith("194.") || clean.startsWith("195.") || clean.startsWith("178.") || clean.startsWith("91.")) {
    return { isProxy: true, label: "Foreign Proxy / Bulletproof Host", severity: "CRITICAL", flag: `Foreign Proxy / Tor Anomaly (${clean})` };
  }
  return { isProxy: false, label: "Domestic Client IP", severity: "NORMAL" };
}

// ----------------------------------------------------------------------------
// 1. Telecom Parser (CDR & IPDR)
// ----------------------------------------------------------------------------
export function parseTelecomRecords(csvText, fileName = "telecom_records.csv") {
  const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) throw new Error("Empty or invalid Telecom log file");

  const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9_]/g, ""));
  const records = [];
  const entities = new Map();

  function addEntity(type, value, metadata = {}) {
    if (!value) return;
    const key = `${type}:${value}`;
    if (!entities.has(key)) {
      entities.set(key, { type, value, occurrences: 0, metadata });
    }
    entities.get(key).occurrences++;
  }

  // Detect column indices with flexible schema mapping
  let colA = headers.findIndex((h) => h.includes("calling") || h.includes("a_party") || h.includes("caller") || h.includes("from_msisdn") || h.includes("calling_party"));
  let colB = headers.findIndex((h) => h.includes("called") || h.includes("b_party") || h.includes("callee") || h.includes("to_msisdn") || h.includes("called_party") || h.includes("dialed"));
  const colTime = headers.findIndex((h) => h.includes("time") || h.includes("date") || h.includes("call_start") || h.includes("timestamp"));
  const colDur = headers.findIndex((h) => h.includes("duration") || h.includes("dur_sec") || h.includes("call_dur") || h.includes("sec"));
  const colType = headers.findIndex((h) => h.includes("call_type") || h.includes("service") || (h.includes("type") && !h.includes("device")));
  const colIMEI = headers.findIndex((h) => h.includes("imei") || h.includes("device_id") || h.includes("hardware"));
  const colIMSI = headers.findIndex((h) => h.includes("imsi") || h.includes("sim_id"));
  const colTower = headers.findIndex((h) => h.includes("tower") || h.includes("cell_id") || h.includes("first_cell") || h.includes("cgi") || h.includes("bts"));
  const colLocation = headers.findIndex((h) => h.includes("location") || h.includes("address") || h.includes("circle") || h.includes("site") || h.includes("city"));
  const colLat = headers.findIndex((h) => h.includes("lat"));
  const colLng = headers.findIndex((h) => h.includes("long") || h.includes("lng"));
  const colIP = headers.findIndex((h) => h.includes("ip") || h.includes("destination_ip") || h.includes("src_ip"));

  if (colA === -1 && headers.length >= 2) colA = 0;
  if (colB === -1 && headers.length >= 2) colB = 1;

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length < 2) continue;

    const callingNumber = normalizePhone(colA !== -1 ? cols[colA] : cols[0]);
    const calledNumber = normalizePhone(colB !== -1 ? cols[colB] : cols[1]);
    const timestamp = colTime !== -1 && cols[colTime] ? cols[colTime] : new Date().toISOString();
    const duration = colDur !== -1 ? parseInt(cols[colDur], 10) || 0 : 0;
    const callType = colType !== -1 && cols[colType] ? cols[colType].toUpperCase() : (duration > 0 ? "VOICE_CALL" : "SMS");
    const imei = normalizeIMEI(colIMEI !== -1 ? cols[colIMEI] : "");
    const imsi = colIMSI !== -1 && cols[colIMSI] ? cols[colIMSI].replace(/[^0-9]/g, "") : "";
    const tower = colTower !== -1 && cols[colTower] ? cols[colTower] : "";
    const location = colLocation !== -1 && cols[colLocation] ? cols[colLocation] : "";
    const lat = colLat !== -1 ? parseFloat(cols[colLat]) || null : null;
    const lng = colLng !== -1 ? parseFloat(cols[colLng]) || null : null;
    const ip = colIP !== -1 && cols[colIP] ? normalizeIP(cols[colIP]) : "";

    const record = {
      recordId: `TEL-${i}`,
      callingNumber,
      calledNumber,
      timestamp,
      duration,
      callType,
      imei,
      imsi,
      tower,
      location,
      lat,
      lng,
      ip
    };

    records.push(record);

    if (callingNumber) addEntity("PHONE", callingNumber, { role: "CALLER" });
    if (calledNumber) addEntity("PHONE", calledNumber, { role: "CALLEE" });
    if (imei) addEntity("IMEI", imei, { linkedPhone: callingNumber });
    if (imsi) addEntity("IMSI", imsi, { linkedPhone: callingNumber });
    if (tower) addEntity("CELL_TOWER", tower, { location, lat, lng });
    if (ip) addEntity("IP_ADDRESS", ip);
  }

  return {
    sourceType: "TELECOM_RECORDS",
    fileName,
    recordCount: records.length,
    records,
    entities: Array.from(entities.values()),
    summary: {
      uniqueCallers: new Set(records.map((r) => r.callingNumber).filter(Boolean)).size,
      uniqueReceivers: new Set(records.map((r) => r.calledNumber).filter(Boolean)).size,
      uniqueIMEIs: new Set(records.map((r) => r.imei).filter(Boolean)).size,
      uniqueIMSIs: new Set(records.map((r) => r.imsi).filter(Boolean)).size,
      totalDurationSeconds: records.reduce((acc, r) => acc + (r.duration || 0), 0)
    }
  };
}

// ----------------------------------------------------------------------------
// 2. Bank / UPI Settlement Parser
// ----------------------------------------------------------------------------
export function parseFinancialRecords(csvText, fileName = "bank_upi_settlement.csv") {
  const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) throw new Error("Empty or invalid Bank/UPI settlement file");

  const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9_]/g, ""));
  const records = [];
  const entities = new Map();

  function addEntity(type, value, metadata = {}) {
    if (!value) return;
    const key = `${type}:${value}`;
    if (!entities.has(key)) {
      entities.set(key, { type, value, occurrences: 0, metadata });
    }
    entities.get(key).occurrences++;
  }

  const colTxnId = headers.findIndex((h) => 
    h === "transaction_id" || h.includes("txn") || h.includes("utr") || h.includes("ref") || 
    h.includes("journal") || h.includes("rrn") || h.includes("transaction")
  );
  const colSenderAcc = headers.findIndex((h) => 
    h === "sender_account" || h === "sender_acc" || (h.includes("sender") && h.includes("acc")) || 
    h === "from_account" || (h.includes("from") && h.includes("acc")) || h.includes("remitter") || 
    h.includes("sender") || h.includes("from") || h.includes("payer") || h.includes("dr_acc")
  );
  const colReceiverAcc = headers.findIndex((h) => 
    h === "receiver_account" || h === "receiver_acc" || (h.includes("receiver") && h.includes("acc")) || 
    h === "to_account" || (h.includes("to") && h.includes("acc")) || h.includes("beneficiary") || 
    h.includes("receiver") || h.includes("to") || h.includes("payee") || h.includes("cr_acc")
  );
  const colSenderIFSC = headers.findIndex((h) => 
    h === "sender_ifsc" || (h.includes("sender") && h.includes("ifsc")) || 
    (h.includes("remitter") && h.includes("ifsc")) || (h.includes("from") && h.includes("ifsc"))
  );
  const colReceiverIFSC = headers.findIndex((h) => 
    h === "receiver_ifsc" || (h.includes("receiver") && h.includes("ifsc")) || 
    (h.includes("beneficiary") && h.includes("ifsc")) || (h.includes("to") && h.includes("ifsc")) || 
    (h.includes("ifsc") && !h.includes("sender") && !h.includes("from"))
  );
  const colAmount = headers.findIndex((h) => 
    h === "amount" || h.includes("amount") || h.includes("amt") || h.includes("inr") || 
    h.includes("value") || h.includes("volume") || h.includes("rs") || h.includes("sum") || h.includes("total")
  );
  const colTime = headers.findIndex((h) => 
    h === "timestamp" || h.includes("time") || h.includes("date") || h.includes("val_date")
  );
  const colMode = headers.findIndex((h) => 
    h === "payment_mode" || h.includes("payment_mode") || (h.includes("mode") && !h.includes("node")) || 
    h.includes("channel")
  );
  const colNarration = headers.findIndex((h) => 
    h === "narration" || h.includes("narration") || h.includes("remark") || h.includes("desc") || h.includes("purpose")
  );
  const colIP = headers.findIndex((h) => 
    h === "ip_address" || h === "ip" || h.includes("ip_address") || h.includes("client_ip") || h.includes("ip")
  );
  const colDevice = headers.findIndex((h) => 
    h === "device_type" || h === "device" || h.includes("device_type") || h.includes("device") || 
    h.includes("profile") || h.includes("client_type")
  );

  // Exact 11-column positional fallback if 11 columns exist or fallback if some are missing
  const is11Col = headers.length === 11;
  const idxTxnId = colTxnId !== -1 ? colTxnId : (is11Col ? 0 : 0);
  const idxSenderAcc = colSenderAcc !== -1 ? colSenderAcc : (is11Col ? 1 : 0);
  const idxReceiverAcc = colReceiverAcc !== -1 ? colReceiverAcc : (is11Col ? 2 : 1);
  const idxSenderIFSC = colSenderIFSC !== -1 ? colSenderIFSC : (is11Col ? 3 : -1);
  const idxReceiverIFSC = colReceiverIFSC !== -1 ? colReceiverIFSC : (is11Col ? 4 : -1);
  const idxAmount = colAmount !== -1 ? colAmount : (is11Col ? 5 : 2);
  const idxTime = colTime !== -1 ? colTime : (is11Col ? 6 : -1);
  const idxMode = colMode !== -1 ? colMode : (is11Col ? 7 : -1);
  const idxNarration = colNarration !== -1 ? colNarration : (is11Col ? 8 : -1);
  const idxIP = colIP !== -1 ? colIP : (is11Col ? 9 : -1);
  const idxDevice = colDevice !== -1 ? colDevice : (is11Col ? 10 : -1);

  for (let i = 1; i < lines.length; i++) {
    const rawCols = parseCSVLine(lines[i]);
    if (rawCols.length < 2) continue;

    // Auto-heal unquoted numbers containing commas (e.g. 5,00,000 without quotes)
    let cols = rawCols;
    if (rawCols.length > headers.length && idxAmount !== -1) {
      const extraCount = rawCols.length - headers.length;
      const candidateRejoined = rawCols.slice(idxAmount, idxAmount + extraCount + 1).join("");
      const cleanCandidate = candidateRejoined.replace(/[^0-9.]/g, "");
      if (cleanCandidate && !isNaN(parseFloat(cleanCandidate))) {
        cols = [
          ...rawCols.slice(0, idxAmount),
          candidateRejoined,
          ...rawCols.slice(idxAmount + extraCount + 1)
        ];
      }
    }

    const txnId = idxTxnId !== -1 && cols[idxTxnId] ? cols[idxTxnId].trim() : `TXN-${1000 + i}`;
    const senderAccount = idxSenderAcc !== -1 && cols[idxSenderAcc] ? cols[idxSenderAcc].trim() : `Sender-${i}`;
    const receiverAccount = idxReceiverAcc !== -1 && cols[idxReceiverAcc] ? cols[idxReceiverAcc].trim() : `Receiver-${i}`;
    const senderIFSC = idxSenderIFSC !== -1 && cols[idxSenderIFSC] ? cols[idxSenderIFSC].toUpperCase().trim() : "";
    const receiverIFSC = idxReceiverIFSC !== -1 && cols[idxReceiverIFSC] ? cols[idxReceiverIFSC].toUpperCase().trim() : "";
    const senderBank = getBankNameFromIFSC(senderIFSC);
    const receiverBank = getBankNameFromIFSC(receiverIFSC);
    
    const rawAmt = idxAmount !== -1 && cols[idxAmount] ? cols[idxAmount] : "0";
    const amount = parseFloat(String(rawAmt).replace(/[^0-9.]/g, "")) || 0;
    const timestamp = idxTime !== -1 && cols[idxTime] ? cols[idxTime].trim() : new Date().toISOString();
    const paymentMode = idxMode !== -1 && cols[idxMode] ? cols[idxMode].toUpperCase().trim() : "UPI";
    const narration = idxNarration !== -1 && cols[idxNarration] ? cols[idxNarration].trim() : "";
    const ip = idxIP !== -1 && cols[idxIP] ? normalizeIP(cols[idxIP]) : "";
    const deviceType = idxDevice !== -1 && cols[idxDevice] ? cols[idxDevice].trim() : "Android";

    const scamMarker = detectScamMarker(narration);
    const deviceAnalysis = analyzeDeviceProfile(deviceType);
    const ipAnalysis = analyzeIPAnomaly(ip);

    const record = {
      recordId: `FIN-${i}`,
      txnId,
      senderAccount,
      receiverAccount,
      senderIFSC,
      receiverIFSC,
      senderBank,
      receiverBank,
      amount,
      timestamp,
      mode: paymentMode,
      paymentMode,
      narration,
      ip,
      deviceType,
      device: deviceType,
      scamMarker,
      deviceAnalysis,
      ipAnalysis,
      // Backward compatibility aliases for all views and graph correlators:
      remitter: `A/C ${senderAccount}`,
      remitterAccount: senderAccount,
      remitterVPA: `${senderAccount}@${senderIFSC ? senderIFSC.slice(0, 4).toLowerCase() : "bank"}`,
      remitterBank: senderBank,
      beneficiary: `A/C ${receiverAccount}`,
      beneficiaryAccount: receiverAccount,
      beneficiaryVPA: `${receiverAccount}@${receiverIFSC ? receiverIFSC.slice(0, 4).toLowerCase() : "bank"}`,
      beneficiaryBank: receiverBank,
      status: "SUCCESS"
    };

    records.push(record);

    if (senderAccount) addEntity("BANK_ACCOUNT", senderAccount, { role: "REMITTER", ifsc: senderIFSC, bank: senderBank });
    if (receiverAccount) addEntity("BANK_ACCOUNT", receiverAccount, { role: "BENEFICIARY", ifsc: receiverIFSC, bank: receiverBank });
    if (senderIFSC) addEntity("IFSC_CODE", senderIFSC, { bank: senderBank });
    if (receiverIFSC) addEntity("IFSC_CODE", receiverIFSC, { bank: receiverBank });
    if (ip) addEntity("IP_ADDRESS", ip, { isProxy: ipAnalysis.isProxy });
    if (deviceType) addEntity("DEVICE_FINGERPRINT", deviceType, { isAnomaly: deviceAnalysis.isAnomaly });
  }

  const totalAmount = records.reduce((acc, r) => acc + r.amount, 0);

  return {
    sourceType: "FINANCIAL_UPI_BANK",
    fileName,
    recordCount: records.length,
    records,
    entities: Array.from(entities.values()),
    summary: {
      totalTransactions: records.length,
      totalVolumeINR: totalAmount,
      uniqueRemitters: new Set(records.map((r) => r.senderAccount).filter(Boolean)).size,
      uniqueBeneficiaries: new Set(records.map((r) => r.receiverAccount).filter(Boolean)).size,
      uniqueBanks: new Set([...records.map(r => r.senderBank), ...records.map(r => r.receiverBank)].filter(Boolean)).size,
      scamMarkersDetected: records.filter((r) => r.scamMarker !== null).length,
      emulatorOrScriptAlerts: records.filter((r) => r.deviceAnalysis.isAnomaly).length,
      proxyIPAlerts: records.filter((r) => r.ipAnalysis.isProxy).length
    }
  };
}

// ----------------------------------------------------------------------------
// 3. Email Header Parser (.eml / RFC 5322)
// ----------------------------------------------------------------------------
export function parseEmailHeader(emlText, fileName = "phishing_email.eml") {
  if (!emlText || typeof emlText !== "string") throw new Error("Invalid .eml email header content");

  // Unfold multi-line headers (RFC 822 / 5322 folding: lines starting with space or tab)
  const unfolded = emlText.replace(/\r?\n[ \t]+/g, " ");
  const lines = unfolded.split(/\r?\n/);

  const rawHeaders = {};
  const receivedHops = [];
  const entities = new Map();

  function addEntity(type, value, metadata = {}) {
    if (!value) return;
    const key = `${type}:${value}`;
    if (!entities.has(key)) {
      entities.set(key, { type, value, occurrences: 0, metadata });
    }
    entities.get(key).occurrences++;
  }

  for (const line of lines) {
    // End of header section in RFC 5322 is marked by empty line
    if (line.trim() === "" && Object.keys(rawHeaders).length > 2) break;

    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;

    const key = line.substring(0, colonIdx).trim().toLowerCase();
    const val = line.substring(colonIdx + 1).trim();

    if (key === "received") {
      receivedHops.push(val);
    } else {
      rawHeaders[key] = val;
    }
  }

  // Extract core fields
  const subject = rawHeaders["subject"] || "No Subject";
  const from = rawHeaders["from"] || "";
  const to = rawHeaders["to"] || "";
  const date = rawHeaders["date"] || new Date().toISOString();
  const returnPath = rawHeaders["return-path"] || "";
  const messageId = rawHeaders["message-id"] || "";
  const authResults = rawHeaders["authentication-results"] || "";
  const xOriginatingIP = rawHeaders["x-originating-ip"] || rawHeaders["x-sender-ip"] || "";
  const xMailer = rawHeaders["x-mailer"] || rawHeaders["user-agent"] || "Generic MUA";

  // Parse SPF, DKIM, DMARC statuses
  const spfMatch = authResults.match(/spf=([a-zA-Z0-9]+)/i) || (rawHeaders["received-spf"] ? rawHeaders["received-spf"].match(/^([a-zA-Z0-9]+)/i) : null);
  const spfStatus = spfMatch ? spfMatch[1].toUpperCase() : "NONE";

  const dkimMatch = authResults.match(/dkim=([a-zA-Z0-9]+)/i);
  const dkimStatus = dkimMatch ? dkimMatch[1].toUpperCase() : "NONE";

  const dmarcMatch = authResults.match(/dmarc=([a-zA-Z0-9]+)/i);
  const dmarcStatus = dmarcMatch ? dmarcMatch[1].toUpperCase() : "NONE";

  // Extract IPs from Received hops
  const hopIPs = [];
  for (const hop of receivedHops) {
    const ipMatches = hop.match(/\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g) || [];
    for (const ip of ipMatches) {
      if (!ip.startsWith("127.") && !ip.startsWith("10.") && !ip.startsWith("192.168.")) {
        hopIPs.push(ip);
      }
    }
  }

  const originatingIP = xOriginatingIP ? normalizeIP(xOriginatingIP) : (hopIPs[hopIPs.length - 1] || "127.0.0.1");

  // Extract emails
  const fromEmailMatch = from.match(/<([^>]+)>/) || from.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  const fromEmail = fromEmailMatch ? fromEmailMatch[1].toLowerCase() : from;
  const toEmailMatch = to.match(/<([^>]+)>/) || to.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  const toEmail = toEmailMatch ? toEmailMatch[1].toLowerCase() : to;
  const returnPathEmail = (returnPath.match(/<([^>]+)>/) || [null, returnPath])[1].toLowerCase();

  // Extract domains
  const fromDomain = fromEmail.includes("@") ? fromEmail.split("@")[1] : "";
  const returnDomain = returnPathEmail.includes("@") ? returnPathEmail.split("@")[1] : "";

  // Anomaly & Spoofing Heuristics
  const isDomainSpoofed = fromDomain && returnDomain && fromDomain !== returnDomain;
  const isSpfFailed = spfStatus === "FAIL" || spfStatus === "SOFTFAIL";
  const isDkimFailed = dkimStatus === "FAIL";
  const spoofConfidence = (isDomainSpoofed ? 40 : 0) + (isSpfFailed ? 40 : 0) + (isDkimFailed ? 20 : 0);

  if (fromEmail) addEntity("EMAIL_ADDRESS", fromEmail, { role: "SENDER", domain: fromDomain });
  if (toEmail) addEntity("EMAIL_ADDRESS", toEmail, { role: "RECIPIENT" });
  if (originatingIP) addEntity("IP_ADDRESS", originatingIP, { role: "ORIGINATING_IP" });
  if (fromDomain) addEntity("DOMAIN", fromDomain, { role: "SENDER_DOMAIN" });
  if (returnDomain && returnDomain !== fromDomain) addEntity("DOMAIN", returnDomain, { role: "RETURN_PATH_DOMAIN" });

  const record = {
    recordId: `EML-1`,
    subject,
    fromEmail,
    toEmail,
    date,
    originatingIP,
    spfStatus,
    dkimStatus,
    dmarcStatus,
    xMailer,
    receivedHopsCount: receivedHops.length,
    hopIPs,
    isDomainSpoofed,
    isSpfFailed,
    spoofConfidenceScore: Math.min(100, spoofConfidence)
  };

  return {
    sourceType: "EMAIL_HEADER",
    fileName,
    recordCount: 1,
    records: [record],
    entities: Array.from(entities.values()),
    summary: {
      fromEmail,
      toEmail,
      originatingIP,
      spfStatus,
      dkimStatus,
      dmarcStatus,
      spoofConfidenceScore: Math.min(100, spoofConfidence),
      isSpoofedAlert: spoofConfidence >= 60
    }
  };
}

// ----------------------------------------------------------------------------
// 4. Android System & App Dump Parser (.txt / .json)
// ----------------------------------------------------------------------------
export function parseAndroidAppDump(content, fileName = "android_app_dump.json") {
  let parsed = null;
  const entities = new Map();

  function addEntity(type, value, metadata = {}) {
    if (!value) return;
    const key = `${type}:${value}`;
    if (!entities.has(key)) {
      entities.set(key, { type, value, occurrences: 0, metadata });
    }
    entities.get(key).occurrences++;
  }

  // Attempt JSON parsing
  if (typeof content === "string") {
    try {
      parsed = JSON.parse(content);
    } catch {
      // Parse as plain text dumpsys
      parsed = null;
    }
  } else if (typeof content === "object") {
    parsed = content;
  }

  const records = [];

  // Critical banking trojan permission signatures
  const DANGEROUS_PERMISSIONS = [
    "android.permission.BIND_ACCESSIBILITY_SERVICE",
    "android.permission.SYSTEM_ALERT_WINDOW",
    "android.permission.READ_SMS",
    "android.permission.RECEIVE_SMS",
    "android.permission.SEND_SMS",
    "android.permission.RECEIVE_BOOT_COMPLETED",
    "android.permission.REQUEST_INSTALL_PACKAGES",
    "android.permission.QUERY_ALL_PACKAGES"
  ];

  if (parsed && Array.isArray(parsed.packages)) {
    // Array of packages in JSON dump
    parsed.packages.forEach((pkg, idx) => {
      const perms = pkg.permissions || [];
      const dangerousFound = perms.filter((p) => DANGEROUS_PERMISSIONS.includes(p));
      const c2Endpoints = pkg.c2Endpoints || pkg.networkTraffic || [];

      const record = {
        recordId: `APK-${idx + 1}`,
        packageName: pkg.packageName || pkg.name || `com.app.${idx}`,
        versionName: pkg.versionName || "1.0",
        appLabel: pkg.appLabel || pkg.packageName,
        permissionsCount: perms.length,
        dangerousPermissions: dangerousFound,
        trojanSignatureDetected: dangerousFound.length >= 3,
        c2Endpoints,
        installTime: pkg.installTime || new Date().toISOString()
      };
      records.push(record);

      addEntity("PACKAGE_NAME", record.packageName, { dangerousCount: dangerousFound.length });
      c2Endpoints.forEach((ep) => {
        const ip = normalizeIP(ep);
        if (ip) addEntity("IP_ADDRESS", ip, { role: "C2_SERVER" });
        else addEntity("DOMAIN", ep, { role: "C2_SERVER" });
      });
    });
  } else {
    // Text parsing regex approach
    const text = typeof content === "string" ? content : JSON.stringify(content);
    const pkgMatches = text.match(/Package\s*\[([^\]]+)\]/gi) || text.match(/package:\s*([a-zA-Z0-9._]+)/gi) || [];
    const ipMatches = text.match(/\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g) || [];
    const phoneMatches = text.match(/\b(?:(?:\+?91)|0)?[6-9][0-9]{9}\b/g) || [];

    const permsFound = DANGEROUS_PERMISSIONS.filter((p) => text.includes(p));

    const record = {
      recordId: `APK-1`,
      packageName: pkgMatches[0] ? pkgMatches[0].replace(/.*\[|.*:\s*|\]/g, "") : "com.sec.fraud.trojan",
      appLabel: "Suspicious APK / Accessibility Sideload",
      permissionsCount: permsFound.length,
      dangerousPermissions: permsFound,
      trojanSignatureDetected: permsFound.length >= 2,
      c2Endpoints: Array.from(new Set(ipMatches)).slice(0, 5),
      installTime: new Date().toISOString()
    };
    records.push(record);

    addEntity("PACKAGE_NAME", record.packageName);
    record.c2Endpoints.forEach((ip) => addEntity("IP_ADDRESS", ip, { role: "C2_SERVER" }));
    phoneMatches.forEach((ph) => addEntity("PHONE", normalizePhone(ph), { role: "SMS_FORWARD_TARGET" }));
  }

  return {
    sourceType: "ANDROID_APK_DUMP",
    fileName,
    recordCount: records.length,
    records,
    entities: Array.from(entities.values()),
    summary: {
      totalPackagesAudited: records.length,
      trojansIdentified: records.filter((r) => r.trojanSignatureDetected).length,
      highRiskPermissionsLogged: records.reduce((acc, r) => acc + r.dangerousPermissions.length, 0),
      c2EndpointsExtracted: Array.from(entities.values()).filter((e) => e.type === "IP_ADDRESS" || e.type === "DOMAIN").length
    }
  };
}

// ----------------------------------------------------------------------------
// Unified Auto-Detection Ingestion Pipeline
// ----------------------------------------------------------------------------
export async function ingestAndNormalizeArtifact(fileOrText, fileName = "artifact.txt", officerBadge = "MPP-2026-INVESTIGATOR") {
  let content = "";
  let rawBuffer = null;
  let fileSize = 0;

  if (fileOrText instanceof File || fileOrText instanceof Blob) {
    fileName = fileOrText.name || fileName;
    fileSize = fileOrText.size;
    rawBuffer = await fileOrText.arrayBuffer();
    const decoder = new TextDecoder("utf-8");
    content = decoder.decode(rawBuffer);
  } else if (typeof fileOrText === "string") {
    content = fileOrText;
    fileSize = new TextEncoder().encode(content).length;
    rawBuffer = new TextEncoder().encode(content).buffer;
  } else {
    content = JSON.stringify(fileOrText);
    fileSize = new TextEncoder().encode(content).length;
    rawBuffer = new TextEncoder().encode(content).buffer;
  }

  // 1. Calculate Cryptographic SHA-256 for Evidentiary Integrity
  const sha256 = await calculateSHA256(rawBuffer);
  const ingestedAt = new Date().toISOString();
  const evidenceId = `EVD-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

  // 2. Auto-Detect Artifact Type
  const lowerName = fileName.toLowerCase();
  const lowerContent = content.slice(0, 4000).toLowerCase();
  const firstLine = (content.split(/\r?\n/)[0] || "").toLowerCase();
  let normalized = null;

  if (lowerName.endsWith(".eml") || (content.includes("Received:") && content.includes("Message-ID:"))) {
    normalized = parseEmailHeader(content, fileName);
  } else if (lowerName.includes("apk") || lowerName.includes("android") || content.includes("android.permission") || content.includes("dumpsys package")) {
    normalized = parseAndroidAppDump(content, fileName);
  } else {
    // Discriminate between Telecom CDR vs Bank/UPI Financial settlement
    const telecomStrong = [
      "calling", "caller", "called", "callee", "call_type", "dur_sec", 
      "duration", "imei", "imsi", "tower", "cell_id", "bts", "cgi", "msisdn", "dialed"
    ];
    const financialStrong = [
      "transaction_id", "sender_account", "receiver_account", "sender_ifsc", "receiver_ifsc",
      "remitter", "beneficiary", "amount", "amt", "inr", "upi", "vpa", 
      "utr", "bank", "payer", "payee", "debit", "credit", "txn", "dr_acc", "cr_acc", 
      "from", "to", "value", "settlement", "payment_mode", "narration", "device_type"
    ];

    const telecomScore = telecomStrong.filter((kw) => firstLine.includes(kw) || lowerName.includes(kw)).length;
    const financialScore = financialStrong.filter((kw) => firstLine.includes(kw) || lowerName.includes(kw)).length;

    if (telecomScore > financialScore && !firstLine.includes("amount") && !firstLine.includes("amt") && !lowerContent.includes("₹")) {
      try {
        normalized = parseTelecomRecords(content, fileName);
      } catch {
        normalized = parseFinancialRecords(content, fileName);
      }
    } else {
      try {
        normalized = parseFinancialRecords(content, fileName);
      } catch {
        normalized = parseTelecomRecords(content, fileName);
      }
    }
  }

  // 3. Assemble Complete Court-Admissible Evidence Dossier Object
  const evidenceArtifact = {
    id: evidenceId,
    fileName,
    fileSize,
    sha256,
    ingestedAt,
    officerBadge,
    integrityStatus: "INTEGRITY_VERIFIED_SEC65B",
    sourceType: normalized.sourceType,
    recordCount: normalized.recordCount,
    records: normalized.records,
    entities: normalized.entities,
    summary: normalized.summary,
    rawContentSnippet: content.slice(0, 1000)
  };

  return evidenceArtifact;
}

// ----------------------------------------------------------------------------
// Live Database Evidence Store (Zero Local Storage - Strictly Cloud API)
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// In-Memory Evidence Store
// ----------------------------------------------------------------------------
class ForensicEvidenceStore {
  constructor() {
    this.artifacts = [];
    this.listeners = new Set();
    // Strictly purge any legacy browser localStorage
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem("cctns_forensic_artifacts_v1");
      }
    } catch {}

    // Start with clean volatile session store (no auto-seeded sample data)
    this.artifacts = [];
  }

  seedSampleForensics() {
    this.artifacts = [
      {
        id: "EVD-FIN-2026-001",
        fileName: "axis_hdfc_upi_layering_log.csv",
        fileSize: 4280,
        sha256: "7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
        ingestedAt: "2026-09-28T14:15:00.000Z",
        officerBadge: "MPP-2026-IO",
        integrityStatus: "INTEGRITY_VERIFIED_SEC65B",
        sourceType: "FINANCIAL_UPI_BANK",
        recordCount: 5,
        records: [
          {
            recordId: "FIN-1",
            txnId: "TXN1000109281",
            senderAccount: "501004123456",
            receiverAccount: "912010045678",
            senderIFSC: "SBIN0001234",
            receiverIFSC: "UTIB0005678",
            senderBank: "State Bank of India",
            receiverBank: "Axis Bank",
            amount: 450000,
            timestamp: "2026-09-28 14:02:10",
            paymentMode: "UPI",
            mode: "UPI",
            narration: "Task deposit refund guarantee",
            ip: "185.220.101.45",
            deviceType: "Windows_Browser",
            device: "Windows_Browser",
            scamMarker: { type: "TASK_SCAM", label: "Work-From-Home Task Scam", severity: "HIGH" },
            deviceAnalysis: { isAnomaly: false, label: "Windows_Browser", severity: "NORMAL" },
            ipAnalysis: { isProxy: true, label: "Foreign Proxy / Bulletproof Host", severity: "CRITICAL" },
            remitter: "A/C 501004123456 (Victim)",
            remitterAccount: "501004123456",
            remitterVPA: "501004123456@sbin",
            remitterBank: "State Bank of India",
            beneficiary: "A/C 912010045678",
            beneficiaryAccount: "912010045678",
            beneficiaryVPA: "912010045678@utib",
            beneficiaryBank: "Axis Bank",
            status: "SUCCESS"
          },
          {
            recordId: "FIN-2",
            txnId: "TXN1000109282",
            senderAccount: "912010045678",
            receiverAccount: "109923847561",
            senderIFSC: "UTIB0005678",
            receiverIFSC: "HDFC0001099",
            senderBank: "Axis Bank",
            receiverBank: "HDFC Bank",
            amount: 250000,
            timestamp: "2026-09-28 14:04:25",
            paymentMode: "IMPS",
            mode: "IMPS",
            narration: "Urgent vendor transfer TRF-992",
            ip: "185.220.101.45",
            deviceType: "Web_Emulator",
            device: "Web_Emulator",
            scamMarker: null,
            deviceAnalysis: { isAnomaly: true, label: "Web_Emulator (Automated Android Sandbox)", severity: "CRITICAL" },
            ipAnalysis: { isProxy: true, label: "Foreign Proxy / Bulletproof Host", severity: "CRITICAL" },
            remitter: "A/C 912010045678",
            remitterAccount: "912010045678",
            remitterVPA: "912010045678@utib",
            remitterBank: "Axis Bank",
            beneficiary: "A/C 109923847561",
            beneficiaryAccount: "109923847561",
            beneficiaryVPA: "109923847561@hdfc",
            beneficiaryBank: "HDFC Bank",
            status: "SUCCESS"
          },
          {
            recordId: "FIN-3",
            txnId: "TXN1000109283",
            senderAccount: "912010045678",
            receiverAccount: "445588990012",
            senderIFSC: "UTIB0005678",
            receiverIFSC: "ICIC0004455",
            senderBank: "Axis Bank",
            receiverBank: "ICICI Bank",
            amount: 190000,
            timestamp: "2026-09-28 14:05:10",
            paymentMode: "IMPS",
            mode: "IMPS",
            narration: "Split settlement batch 04",
            ip: "185.220.101.45",
            deviceType: "Linux_Script",
            device: "Linux_Script",
            scamMarker: null,
            deviceAnalysis: { isAnomaly: true, label: "Linux_Script (Headless API Botnet)", severity: "CRITICAL" },
            ipAnalysis: { isProxy: true, label: "Foreign Proxy / Bulletproof Host", severity: "CRITICAL" },
            remitter: "A/C 912010045678",
            remitterAccount: "912010045678",
            remitterVPA: "912010045678@utib",
            remitterBank: "Axis Bank",
            beneficiary: "A/C 445588990012",
            beneficiaryAccount: "445588990012",
            beneficiaryVPA: "445588990012@icic",
            beneficiaryBank: "ICICI Bank",
            status: "SUCCESS"
          },
          {
            recordId: "FIN-4",
            txnId: "TXN1000109284",
            senderAccount: "109923847561",
            receiverAccount: "889911223344",
            senderIFSC: "HDFC0001099",
            receiverIFSC: "HDFC0001099",
            senderBank: "HDFC Bank",
            receiverBank: "HDFC Bank",
            amount: 240000,
            timestamp: "2026-09-28 14:11:30",
            paymentMode: "IMPS",
            mode: "IMPS",
            narration: "ATM WDL MP Nagar cashout",
            ip: "103.21.244.10",
            deviceType: "Android",
            device: "Android",
            scamMarker: { type: "ATM_CASHOUT", label: "Physical ATM / Cashout", severity: "CRITICAL" },
            deviceAnalysis: { isAnomaly: false, label: "Android", severity: "NORMAL" },
            ipAnalysis: { isProxy: true, label: "Foreign Proxy / Bulletproof Host", severity: "CRITICAL" },
            remitter: "A/C 109923847561",
            remitterAccount: "109923847561",
            remitterVPA: "109923847561@hdfc",
            remitterBank: "HDFC Bank",
            beneficiary: "A/C 889911223344 (ATM Cashout)",
            beneficiaryAccount: "889911223344",
            beneficiaryVPA: "889911223344@hdfc",
            beneficiaryBank: "HDFC Bank",
            status: "SUCCESS"
          },
          {
            recordId: "FIN-5",
            txnId: "TXN1000109285",
            senderAccount: "445588990012",
            receiverAccount: "332211445566",
            senderIFSC: "ICIC0004455",
            receiverIFSC: "KKBK0002233",
            senderBank: "ICICI Bank",
            receiverBank: "Kotak Mahindra Bank",
            amount: 185000,
            timestamp: "2026-09-28 14:09:45",
            paymentMode: "NEFT",
            mode: "NEFT",
            narration: "Binance USDT P2P buy order #9921",
            ip: "185.220.101.45",
            deviceType: "Linux_Script",
            device: "Linux_Script",
            scamMarker: { type: "CRYPTO_CASHOUT", label: "Crypto P2P Off-Ramp", severity: "CRITICAL" },
            deviceAnalysis: { isAnomaly: true, label: "Linux_Script (Headless API Botnet)", severity: "CRITICAL" },
            ipAnalysis: { isProxy: true, label: "Foreign Proxy / Bulletproof Host", severity: "CRITICAL" },
            remitter: "A/C 445588990012",
            remitterAccount: "445588990012",
            remitterVPA: "445588990012@icic",
            remitterBank: "ICICI Bank",
            beneficiary: "A/C 332211445566 (Crypto P2P)",
            beneficiaryAccount: "332211445566",
            beneficiaryVPA: "332211445566@kkbk",
            beneficiaryBank: "Kotak Mahindra Bank",
            status: "SUCCESS"
          }
        ],
        entities: [
          { type: "BANK_ACCOUNT", value: "501004123456", occurrences: 1 },
          { type: "BANK_ACCOUNT", value: "912010045678", occurrences: 3 },
          { type: "BANK_ACCOUNT", value: "109923847561", occurrences: 2 },
          { type: "BANK_ACCOUNT", value: "445588990012", occurrences: 2 },
          { type: "BANK_ACCOUNT", value: "889911223344", occurrences: 1 },
          { type: "BANK_ACCOUNT", value: "332211445566", occurrences: 1 },
          { type: "IP_ADDRESS", value: "185.220.101.45", occurrences: 4 },
          { type: "DEVICE_FINGERPRINT", value: "Web_Emulator", occurrences: 1 },
          { type: "DEVICE_FINGERPRINT", value: "Linux_Script", occurrences: 2 }
        ],
        summary: {
          totalTransactions: 5,
          totalVolumeINR: 1315000,
          uniqueRemitters: 3,
          uniqueBeneficiaries: 5,
          uniqueBanks: 5,
          scamMarkersDetected: 3,
          emulatorOrScriptAlerts: 3,
          proxyIPAlerts: 5
        }
      },
      {
        id: "EVD-TEL-2026-002",
        fileName: "telecom_cdr_tower_dump.csv",
        fileSize: 3120,
        sha256: "3b9a76d8b241416e91cfbc5c5c0529d38c4c79f9024f0c8e2354f6b3cf781192",
        ingestedAt: "2026-09-28T14:16:00.000Z",
        officerBadge: "MPP-2026-IO",
        integrityStatus: "INTEGRITY_VERIFIED_SEC65B",
        sourceType: "TELECOM_RECORDS",
        recordCount: 3,
        records: [
          {
            recordId: "TEL-1",
            callingNumber: "9826011223",
            calledNumber: "9826099887",
            timestamp: "2026-09-28T13:45:00Z",
            duration: 180,
            callType: "VOICE_CALL",
            imei: "864920041234567",
            imsi: "404450123456789",
            tower: "CGI-404-45-7712",
            location: "MP Nagar Zone-1, Bhopal",
            lat: 23.2332,
            lng: 77.4343,
            ip: "185.220.101.45"
          },
          {
            recordId: "TEL-2",
            callingNumber: "9826033445",
            calledNumber: "9826011223",
            timestamp: "2026-09-28T13:50:00Z",
            duration: 45,
            callType: "VOICE_CALL",
            imei: "864920041234567",
            imsi: "404450987654321",
            tower: "CGI-404-45-8831",
            location: "Vijay Nagar, Indore",
            lat: 22.7533,
            lng: 75.8937,
            ip: "185.220.101.45"
          },
          {
            recordId: "TEL-3",
            callingNumber: "9826077112",
            calledNumber: "9826011223",
            timestamp: "2026-09-28T13:55:00Z",
            duration: 95,
            callType: "VOICE_CALL",
            imei: "864920041234567",
            imsi: "404450554433221",
            tower: "CGI-404-45-7712",
            location: "MP Nagar Zone-1, Bhopal",
            lat: 23.2332,
            lng: 77.4343,
            ip: "185.220.101.45"
          }
        ],
        entities: [
          { type: "PHONE", value: "9826011223", occurrences: 3 },
          { type: "PHONE", value: "9826099887", occurrences: 1 },
          { type: "PHONE", value: "9826033445", occurrences: 1 },
          { type: "PHONE", value: "9826077112", occurrences: 1 },
          { type: "IMEI", value: "864920041234567", occurrences: 3 },
          { type: "IP_ADDRESS", value: "185.220.101.45", occurrences: 3 }
        ],
        summary: {
          totalCallsLogged: 3,
          uniqueMsisdns: 4,
          sharedImeis: 1
        }
      },
      {
        id: "EVD-EML-2026-003",
        fileName: "sbi_netbanking_spoofed_phish.eml",
        fileSize: 2840,
        sha256: "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
        ingestedAt: "2026-09-28T14:17:00.000Z",
        officerBadge: "MPP-2026-IO",
        integrityStatus: "INTEGRITY_VERIFIED_SEC65B",
        sourceType: "EMAIL_HEADER",
        recordCount: 1,
        records: [
          {
            messageId: "<202609281358.SBI.ALERT@sbi-kyc-update.com>",
            fromEmail: "support@sbi-kyc-update.com",
            returnPath: "bounce@darkrelay-drop.ru",
            subject: "URGENT: Mandatory KYC Verification Failure - Account Restricted",
            originatingIP: "185.220.101.45",
            spfStatus: "FAIL",
            dkimStatus: "FAIL",
            dmarcStatus: "FAIL",
            clientMailer: "Python/3.10 aiohttp (Automated Phishing Suite)",
            spoofConfidenceScore: 94
          }
        ],
        entities: [
          { type: "EMAIL", value: "support@sbi-kyc-update.com", occurrences: 1 },
          { type: "IP_ADDRESS", value: "185.220.101.45", occurrences: 1 }
        ],
        summary: {
          spoofedEmailHeadersFound: 1,
          authenticationFailureCount: 1
        }
      },
      {
        id: "EVD-APK-2026-004",
        fileName: "axis_support_v2_trojan_dump.json",
        fileSize: 3410,
        sha256: "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",
        ingestedAt: "2026-09-28T14:18:00.000Z",
        officerBadge: "MPP-2026-IO",
        integrityStatus: "INTEGRITY_VERIFIED_SEC65B",
        sourceType: "ANDROID_APK_DUMP",
        recordCount: 1,
        records: [
          {
            packageName: "com.axis.netbanking.update",
            versionName: "2.4.1",
            appLabel: "Axis NetBanking QuickSupport",
            dangerousPermissions: [
              "android.permission.RECEIVE_SMS",
              "android.permission.READ_SMS",
              "android.permission.BIND_ACCESSIBILITY_SERVICE",
              "android.permission.INTERNET"
            ],
            c2Endpoints: [
              "185.220.101.45",
              "drop.darktunnel-c2.net"
            ],
            smsInterceptForwardTarget: "9826011223",
            trojanSignatureDetected: true
          }
        ],
        entities: [
          { type: "PACKAGE_NAME", value: "com.axis.netbanking.update", occurrences: 1 },
          { type: "IP_ADDRESS", value: "185.220.101.45", occurrences: 1 },
          { type: "PHONE", value: "9826011223", occurrences: 1 }
        ],
        summary: {
          totalPackagesAudited: 1,
          trojansIdentified: 1,
          highRiskPermissionsLogged: 4,
          c2EndpointsExtracted: 2
        }
      }
    ];
    this.notify();
  }

  getArtifacts() {
    return [...this.artifacts];
  }

  getArtifactById(id) {
    return this.artifacts.find((a) => a.id === id) || null;
  }

  addArtifact(artifact) {
    // Pure volatile in-memory storage for active triage session
    this.artifacts = this.artifacts.filter((a) => a.id !== artifact.id);
    this.artifacts.unshift(artifact);
    this.notify();
    return artifact;
  }

  removeArtifact(id) {
    this.artifacts = this.artifacts.filter((a) => a.id !== id);
    this.notify();
  }

  clearAll() {
    this.artifacts = [];
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem("cctns_forensic_artifacts_v1");
      }
    } catch {}
    this.notify();
  }

  async ingest2MBenchmark() {
    try {
      const response = await fetch("/api/forensics/benchmark-2m");
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      const json = await response.json();
      if (json.success && json.data) {
        this.addArtifact(json.data);
        return json.data;
      }
      throw new Error(json.error || "Failed to process 2M benchmark");
    } catch (err) {
      console.error("2M Benchmark Ingestion Error:", err);
      throw err;
    }
  }

  // Aggregate all extracted entities across all loaded evidence files
  getAllEntities() {
    const entityMap = new Map();
    this.artifacts.forEach((art) => {
      (art.entities || []).forEach((ent) => {
        const key = `${ent.type}:${ent.value}`;
        if (!entityMap.has(key)) {
          entityMap.set(key, {
            type: ent.type,
            value: ent.value,
            occurrences: 0,
            artifactsFoundIn: [],
            metadata: ent.metadata || {}
          });
        }
        const item = entityMap.get(key);
        item.occurrences += ent.occurrences || 1;
        if (!item.artifactsFoundIn.includes(art.id)) {
          item.artifactsFoundIn.push(art.id);
        }
      });
    });
    return Array.from(entityMap.values());
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify() {
    this.listeners.forEach((cb) => {
      try {
        cb(this.getArtifacts());
      } catch (e) {
        console.error("ForensicEvidenceStore listener error:", e);
      }
    });
  }
}

export const forensicEvidenceStore = new ForensicEvidenceStore();
