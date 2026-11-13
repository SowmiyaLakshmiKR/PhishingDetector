import { useEffect, useState } from "react";
import { ShieldCheck, ShieldAlert, ShieldX, Search, Activity, Clock3, Trash2, ExternalLink, Network, LockKeyhole, Github, Globe2, ArrowUpRight } from "lucide-react";

const API = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
const samples = ["https://www.google.com", "http://secure-login-account.example.com/verify", "https://paypal.com.security-check.example.net/login", "htp:/bad url"];

function StatusIcon({ status }) {
  if (status === "Valid") return <ShieldCheck size={17} />;
  if (status === "Suspicious") return <ShieldAlert size={17} />;
  return <ShieldX size={17} />;
}

export default function App() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [apiStatus, setApiStatus] = useState("Checking");

  async function loadData() {
    try {
      const [health, records] = await Promise.all([fetch(`${API}/health`), fetch(`${API}/history`)]);
      if (!health.ok || !records.ok) throw new Error("API unavailable");
      const h = await health.json();
      setApiStatus(h.database);
      setHistory(await records.json());
    } catch { setApiStatus("Offline"); }
  }
  useEffect(() => { loadData(); }, []);

  async function analyze(e) {
    e.preventDefault();
    setError(""); setResult(null);
    if (!url.trim()) { setError("Enter a URL to begin analysis."); return; }
    setLoading(true);
    try {
      const response = await fetch(`${API}/analyze`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Request failed");
      setResult(data); setUrl(data.url); await loadData();
    } catch (err) { setError(`${err.message}. Check that the backend server is running.`); }
    finally { setLoading(false); }
  }

  async function deleteRecord(id) {
    try {
      const response = await fetch(`${API}/history/${id}`, { method: "DELETE" });
      if (!response.ok) { const d = await response.json(); throw new Error(d.message); }
      await loadData();
    } catch (e) { setError(e.message); }
  }

  const counts = {
    total: history.length,
    suspicious: history.filter(x => x.classification === "Suspicious").length,
    invalid: history.filter(x => x.classification === "Invalid").length
  };

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><ShieldCheck size={23}/></div><div><b>URL GUARD</b><small>THREAT INTELLIGENCE</small></div></div>
      <div className="side-label">WORKSPACE</div>
      <a className="nav-item active"><Activity size={17}/> Overview</a>
      <a className="nav-item" href="#history"><Clock3 size={17}/> Scan history</a>
      <div className="side-bottom"><div className="side-shield"><LockKeyhole size={19}/></div><b>Stay one step ahead.</b><p>Inspect suspicious links before you open them.</p><span className="api-pill"><i/> API {apiStatus}</span></div>
      <div className="sidebar-foot">ACADEMIC PROJECT · 2026–27</div>
    </aside>

    <main className="main">
      <header className="topbar"><div className="breadcrumb">Workspace <span>/</span> <b>URL Analyzer</b></div><div className="top-right"><span className="live-dot"/> SYSTEM ONLINE <span className="avatar">UG</span></div></header>
      <section className="hero">
        <div className="eyebrow"><span/> WEB SECURITY ANALYSIS</div>
        <h1>Know before<br/><em>you click.</em></h1>
        <p className="hero-copy">Analyze URLs for phishing indicators, suspicious structures, and malformed domains with regex validation and rule-based automata.</p>
        <div className="scan-card">
          <form onSubmit={analyze}>
            <label htmlFor="url-input">URL TO INSPECT</label>
            <div className="input-row"><Globe2 size={19}/><input id="url-input" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com/login" /><button disabled={loading} type="submit"><Search size={17}/>{loading ? "Analyzing..." : "Analyze URL"}</button></div>
          </form>
          <div className="examples"><span>TRY SAMPLE</span>{samples.map(s => <button key={s} onClick={() => setUrl(s)}>{s.length > 34 ? s.slice(0, 31)+"..." : s}</button>)}</div>
          {error && <div className="error-msg">{error}</div>}
        </div>
      </section>

      {result && <section className="result-panel">
        <div className="section-head"><div><div className="eyebrow">ANALYSIS REPORT</div><h2>Inspection result</h2></div><span className={`status ${result.classification.toLowerCase()}`}><StatusIcon status={result.classification}/>{result.classification}</span></div>
        <div className="result-grid">
          <div className="score-card"><span>RISK SCORE</span><strong>{result.score}<small>/100</small></strong><div className="score-track"><i style={{width:`${result.score}%`}}/></div><small>{result.score >= 30 ? "Elevated risk indicators found" : "No configured risk indicators found"}</small></div>
          <div className="details-card"><span>HOSTNAME</span><b>{result.hostname || "Not available"}</b><span>PROTOCOL</span><b>{result.protocol || "Not detected"}</b><span>URL</span><b className="url-break">{result.url}</b></div>
          <div className="reasons-card"><span>DETECTION REASONS</span>{result.reasons.map((r,i)=><p key={i}><i/> {r}</p>)}</div>
        </div>
        <div className="automata"><div><Network size={16}/><b>FINITE AUTOMATON TRACE</b></div><div className="state-list">{(result.automaton || []).map((s,i)=><span key={i} className={s==="ERROR"?"bad-state":s==="DONE"?"good-state":""}>{s}</span>)}</div></div>
      </section>}

      <section className="stats">
        <div className="stat-card"><div className="stat-icon"><Activity size={18}/></div><span>TOTAL SCANS</span><b>{counts.total}</b><small>Recorded analyses</small></div>
        <div className="stat-card"><div className="stat-icon orange"><ShieldAlert size={18}/></div><span>SUSPICIOUS URLS</span><b>{counts.suspicious}</b><small>Needs further review</small></div>
        <div className="stat-card"><div className="stat-icon red"><ShieldX size={18}/></div><span>INVALID URLS</span><b>{counts.invalid}</b><small>Failed format checks</small></div>
      </section>

      <section className="history-section" id="history">
        <div className="section-head"><div><div className="eyebrow">RECENT ACTIVITY</div><h2>Scan history</h2></div><button className="refresh" onClick={loadData}>Refresh <ArrowUpRight size={15}/></button></div>
        <div className="table-wrap"><table><thead><tr><th>URL / HOST</th><th>CLASSIFICATION</th><th>RISK</th><th>DATE</th><th></th></tr></thead><tbody>
          {history.length === 0 ? <tr><td colSpan="5" className="empty">No scans yet. Submit a URL above to start.</td></tr> : history.slice(0,10).map((item,i)=><tr key={item._id || i}><td><div className="url-cell"><Globe2 size={15}/><span>{item.url}</span></div></td><td><span className={`mini-status ${item.classification.toLowerCase()}`}><StatusIcon status={item.classification}/>{item.classification}</span></td><td>{item.score}/100</td><td>{new Date(item.analyzedAt || item.createdAt).toLocaleString()}</td><td>{item._id && !String(item._id).startsWith("local-") && <button className="icon-btn" title="Delete record" onClick={()=>deleteRecord(item._id)}><Trash2 size={15}/></button>}</td></tr>)}
        </tbody></table></div>
      </section>
      <footer><span>URL GUARD <b>·</b> EDUCATIONAL SECURITY TOOL</span><span>Heuristic results are not a guarantee of website safety.</span></footer>
    </main>
  </div>;
}
