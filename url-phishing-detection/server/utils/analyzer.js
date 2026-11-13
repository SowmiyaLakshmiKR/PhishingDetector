const URL_PATTERN = /^(https?):\/\/([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d{1,5})?(\/[^\s]*)?$/i;
const IPV4_PATTERN = /^(?:\d{1,3}\.){3}\d{1,3}$/;
const DOMAIN_LABEL_PATTERN = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;

function scanUrlStates(value) {
  // Deterministic character scanner: START -> SCHEME -> AUTHORITY -> PATH/QUERY/FRAGMENT -> DONE.
  let state = "START";
  const trace = [state];
  for (let i = 0; i < value.length; i++) {
    const ch = value[i];
    if (state === "START") state = ch.match(/[a-z]/i) ? "SCHEME" : "ERROR";
    else if (state === "SCHEME") {
      if (value.slice(i, i + 3) === "://") { state = "AUTHORITY"; i += 2; }
      else if (!/[a-z0-9+.-]/i.test(ch)) state = "ERROR";
    } else if (state === "AUTHORITY") {
      if (ch === "/") state = "PATH";
      else if (ch === "?") state = "QUERY";
      else if (ch === "#") state = "FRAGMENT";
      else if (/\s/.test(ch)) state = "ERROR";
    } else if (state === "PATH") {
      if (ch === "?") state = "QUERY";
      else if (ch === "#") state = "FRAGMENT";
      else if (/\s/.test(ch)) state = "ERROR";
    } else if (state === "QUERY") {
      if (ch === "#") state = "FRAGMENT";
      else if (/\s/.test(ch)) state = "ERROR";
    } else if (state === "FRAGMENT" && /\s/.test(ch)) state = "ERROR";
    trace.push(state);
    if (state === "ERROR") break;
  }
  if (state !== "ERROR") state = "DONE";
  trace.push(state);
  return { accepted: state === "DONE", trace };
}

export function analyzeUrl(input) {
  const original = String(input ?? "").trim();
  const reasons = [];
  if (!original) {
    return { url: original, classification: "Invalid", score: 100, reasons: ["URL cannot be empty."], protocol: "", hostname: "", automaton: ["START", "ERROR"] };
  }
  if (original.length > 2048) {
    return { url: original, classification: "Invalid", score: 100, reasons: ["URL exceeds the 2048-character limit."], protocol: "", hostname: "", automaton: ["START", "ERROR"] };
  }

  const scan = scanUrlStates(original);
  let parsed;
  try { parsed = new URL(original); } catch { parsed = null; }

  if (!URL_PATTERN.test(original) || !parsed || !scan.accepted) {
    reasons.push("URL format is invalid. Use http:// or https:// followed by a valid domain.");
    return { url: original, classification: "Invalid", score: 100, reasons, protocol: parsed?.protocol ?? "", hostname: parsed?.hostname ?? "", automaton: scan.trace };
  }

  let score = 0;
  const host = parsed.hostname.toLowerCase();
  const labels = host.split(".");
  if (parsed.protocol !== "https:") { score += 15; reasons.push("The URL does not use HTTPS encryption."); }
  if (IPV4_PATTERN.test(host)) { score += 25; reasons.push("The URL uses an IP address instead of a domain name."); }
  if (original.includes("@")) { score += 25; reasons.push("The @ symbol may hide the actual destination host."); }
  if (host.startsWith("xn--") || host.includes(".xn--")) { score += 20; reasons.push("The domain contains punycode, which can be used for look-alike domains."); }
  if (host.split(".").length > 4) { score += 15; reasons.push("The domain contains an unusually large number of subdomains."); }
  if (host.includes("-")) { score += 8; reasons.push("The domain contains hyphens; verify that it is not imitating a trusted brand."); }
  if (original.length > 100) { score += 10; reasons.push("The URL is unusually long."); }
  if (/(login|verify|account|secure|update|banking|password)/i.test(original)) {
    score += 12; reasons.push("The URL contains sensitive-action keywords; check the domain carefully.");
  }
  if (/%[0-9a-f]{2}/i.test(original)) { score += 8; reasons.push("The URL contains percent-encoded characters."); }
  if (labels.some(label => label.length > 30)) { score += 8; reasons.push("A domain label is unusually long."); }

  score = Math.min(score, 100);
  let classification = "Valid";
  if (score >= 30) classification = "Suspicious";
  if (reasons.length === 0) reasons.push("The URL passed the configured format and heuristic checks.");
  return { url: original, classification, score, reasons, protocol: parsed.protocol.replace(":", "").toUpperCase(), hostname: parsed.hostname, automaton: scan.trace };
}
