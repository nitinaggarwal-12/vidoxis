import http from "node:http";
import { URL } from "node:url";

export interface MockServerOptions {
  port?: number;
  host?: string;
  simulatePii?: boolean;
}

export interface RunningMockServer {
  port: number;
  host: string;
  baseUrl: string;
  close: () => Promise<void>;
}

// --------------------------------------------------------------------------------
// 1. GEMINI ENTERPRISE CHAT (User Experience - Tier 1 & 2)
// --------------------------------------------------------------------------------
export function createMockGeminiEnterpriseChatHtml(pathname: string, searchParams: URLSearchParams): string {
  const trialId = searchParams.get("trial") || "NCT-048291";
  const user = "Dr. Maya Lin (Principal Investigator)";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Gemini Enterprise — Merck Clinical Research</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Google+Sans+Flex:wght@400;500;600;700&family=Roboto+Mono:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --gemini-gradient: linear-gradient(135deg, #1a73e8 0%, #7c3aed 50%, #ea4335 100%);
      --bg-surface: #ffffff;
      --bg-sidebar: #f8fafc;
      --border-color: #e2e8f0;
      --text-main: #0f172a;
      --text-sub: #475569;
      --font-main: 'Google Sans Flex', -apple-system, BlinkMacSystemFont, sans-serif;
      --font-mono: 'Roboto Mono', monospace;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: var(--font-main); background: #ffffff; color: var(--text-main); height: 100vh; overflow: hidden; display: flex; flex-direction: column; }

    /* Top Bar */
    .top-nav {
      height: 58px; background: #ffffff; border-bottom: 1px solid var(--border-color);
      display: flex; align-items: center; justify-content: space-between; padding: 0 24px; z-index: 20;
    }
    .brand-group { display: flex; align-items: center; gap: 12px; }
    .gemini-logo {
      width: 28px; height: 28px; background: var(--gemini-gradient); border-radius: 8px;
      display: flex; align-items: center; justify-content: center; color: white; font-size: 16px; font-weight: bold;
    }
    .brand-title { font-size: 17px; font-weight: 700; color: #1e293b; letter-spacing: -0.2px; }
    .org-pill { font-size: 11px; font-weight: 600; color: #0284c7; background: #e0f2fe; padding: 3px 8px; border-radius: 6px; }

    .center-indicator {
      display: flex; align-items: center; gap: 8px; padding: 6px 14px;
      background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 20px; font-size: 12px; font-weight: 600; color: #334155;
    }
    .center-indicator .pulse-dot { width: 8px; height: 8px; border-radius: 50%; background: #10b981; box-shadow: 0 0 8px #10b981; }

    .right-tools { display: flex; align-items: center; gap: 16px; }
    .compliance-chip { font-size: 11px; font-weight: 600; color: #15803d; background: #dcfce7; border: 1px solid #bbf7d0; padding: 4px 10px; border-radius: 12px; }
    .user-profile { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: #1e293b; }
    .user-avatar { width: 32px; height: 32px; border-radius: 50%; background: #1a73e8; color: white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; }

    /* Layout */
    .app-body { display: flex; flex: 1; height: calc(100vh - 58px); }

    /* Sidebar */
    .chat-sidebar {
      width: 280px; background: var(--bg-sidebar); border-right: 1px solid var(--border-color);
      display: flex; flex-direction: column; justify-content: space-between; padding: 16px;
    }
    .new-chat-btn {
      width: 100%; padding: 10px 16px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 12px;
      font-size: 13px; font-weight: 600; color: #0f172a; cursor: pointer; display: flex; align-items: center; gap: 8px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05); transition: all 0.2s;
    }
    .new-chat-btn:hover { background: #f8fafc; border-color: #94a3b8; }
    .session-list { margin-top: 18px; display: flex; flex-direction: column; gap: 4px; }
    .session-label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
    .session-item {
      padding: 9px 12px; border-radius: 8px; font-size: 12.5px; color: #334155; font-weight: 500; cursor: pointer;
      display: flex; align-items: center; gap: 8px; text-decoration: none;
    }
    .session-item.active { background: #e0f2fe; color: #0369a1; font-weight: 600; }
    .session-item:hover:not(.active) { background: #f1f5f9; }

    .sidebar-footer { font-size: 11px; color: #64748b; line-height: 1.5; border-top: 1px solid #e2e8f0; padding-top: 12px; }
    .sidebar-footer span { font-family: var(--font-mono); color: #0284c7; }

    /* Main Chat Stream */
    .chat-main { flex: 1; display: flex; flex-direction: column; background: #ffffff; overflow-y: auto; padding: 24px 36px 120px 36px; }
    .chat-container { max-width: 960px; width: 100%; margin: 0 auto; display: flex; flex-direction: column; gap: 28px; }

    /* User Message */
    .user-bubble-row { display: flex; justify-content: flex-end; }
    .user-bubble {
      max-width: 80%; background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 18px 18px 4px 18px;
      padding: 16px 20px; font-size: 14.5px; color: #0f172a; line-height: 1.6;
    }
    .user-bubble-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; font-size: 11.5px; color: #64748b; font-weight: 600; }

    /* Agent Message */
    .agent-bubble-row { display: flex; gap: 16px; }
    .agent-avatar {
      width: 36px; height: 36px; border-radius: 10px; background: var(--gemini-gradient); flex-shrink: 0;
      display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 18px;
      box-shadow: 0 2px 8px rgba(124, 58, 237, 0.3);
    }
    .agent-content { flex: 1; display: flex; flex-direction: column; gap: 16px; }
    .agent-header { display: flex; align-items: center; gap: 10px; }
    .agent-name { font-size: 14px; font-weight: 700; color: #0f172a; }
    .agent-badge { font-size: 11px; background: #ede9fe; color: #6d28d9; padding: 2px 8px; border-radius: 12px; font-weight: 600; }

    /* Agentic Execution Steps (Accordion / Trace) */
    .execution-trace {
      background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 14px 16px;
      display: flex; flex-direction: column; gap: 10px;
    }
    .trace-title { font-size: 12px; font-weight: 700; color: #0284c7; display: flex; align-items: center; gap: 6px; }
    .trace-step {
      display: flex; align-items: flex-start; gap: 8px; font-size: 12.5px; color: #334155; line-height: 1.5;
      padding-left: 8px; border-left: 2px solid #38bdf8;
    }
    .trace-step strong { color: #0f172a; font-family: var(--font-mono); font-size: 12px; }

    /* Clinical Results Card */
    .clinical-card {
      background: #ffffff; border: 1px solid #cbd5e1; border-radius: 14px; padding: 20px;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05); display: flex; flex-direction: column; gap: 14px;
    }
    .card-heading { font-size: 16px; font-weight: 700; color: #0f172a; }
    .card-text { font-size: 14px; color: #334155; line-height: 1.6; }

    /* Data Table */
    .clinical-table { width: 100%; border-collapse: collapse; font-size: 12.5px; margin-top: 6px; }
    .clinical-table th { background: #f8fafc; padding: 10px 12px; text-align: left; font-weight: 700; color: #475569; border-bottom: 2px solid #e2e8f0; }
    .clinical-table td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #1e293b; }
    .badge-match { background: #dcfce7; color: #166534; padding: 3px 8px; border-radius: 12px; font-weight: 700; font-size: 11px; }
    .badge-stock { background: #e0f2fe; color: #0369a1; padding: 3px 8px; border-radius: 12px; font-weight: 600; font-size: 11px; }

    /* Action CTAs */
    .cta-row { display: flex; gap: 10px; margin-top: 8px; flex-wrap: wrap; }
    .cta-btn-primary {
      padding: 9px 18px; background: #1a73e8; color: white; border: none; border-radius: 10px;
      font-size: 12.5px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px;
      box-shadow: 0 2px 4px rgba(26, 115, 232, 0.25);
    }
    .cta-btn-secondary {
      padding: 9px 16px; background: #ffffff; color: #334155; border: 1px solid #cbd5e1; border-radius: 10px;
      font-size: 12.5px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px;
    }
    .cta-btn-secondary:hover { background: #f8fafc; }

    /* Bottom Prompt Bar */
    .bottom-bar {
      position: fixed; bottom: 0; left: 280px; right: 0; background: linear-gradient(180deg, rgba(255,255,255,0) 0%, #ffffff 40%);
      padding: 20px 36px 24px 36px; display: flex; justify-content: center;
    }
    .prompt-box {
      max-width: 960px; width: 100%; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 28px;
      padding: 8px 16px; display: flex; align-items: center; gap: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    }
    .prompt-input { flex: 1; border: none; outline: none; font-size: 14.5px; font-family: inherit; color: #0f172a; }
    .send-btn {
      width: 38px; height: 38px; border-radius: 50%; background: #1a73e8; border: none; color: white;
      display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 16px;
    }

    /* Top Switcher Banner for Quick Auditing */
    .env-switcher {
      position: fixed; top: 12px; right: 280px; z-index: 50;
      display: flex; align-items: center; gap: 8px; background: rgba(15, 23, 42, 0.9); backdrop-filter: blur(8px);
      padding: 4px 12px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.2);
    }
    .env-switcher a { color: #94a3b8; text-decoration: none; font-size: 11.5px; font-weight: 600; padding: 2px 6px; }
    .env-switcher a.active { color: #ffffff; background: #2563eb; border-radius: 12px; }
  </style>
</head>
<body>
  <!-- Environment Mode Switcher -->
  <div class="env-switcher">
    <a href="/chat/gemini-enterprise" class="active">💬 Gemini Enterprise Chat</a>
    <a href="/vertex-ai/models?project=merck-clinical-ai-prod">☁️ Google Cloud Console</a>
  </div>

  <!-- Top Navigation -->
  <header class="top-nav">
    <div class="brand-group">
      <div class="gemini-logo">✦</div>
      <h1 class="brand-title">Gemini Enterprise</h1>
      <span class="org-pill">Merck Clinical AI</span>
    </div>

    <div class="center-indicator">
      <span class="pulse-dot"></span>
      <span>Gemini 2.0 Flash Agent • Grounded in Clinical Data Lake & SAP ERP</span>
    </div>

    <div class="right-tools">
      <span class="compliance-chip">🔒 HIPAA & GxP Validated</span>
      <div class="user-profile">
        <div class="user-avatar">ML</div>
        <span>Dr. Maya Lin</span>
      </div>
    </div>
  </header>

  <div class="app-body">
    <!-- Sidebar -->
    <aside class="chat-sidebar">
      <div>
        <button class="new-chat-btn">
          <span style="font-size: 16px;">+</span>
          <span>New Research Session</span>
        </button>

        <div class="session-list">
          <div class="session-label">Active Protocols</div>
          <a href="#" class="session-item active">
            <span>●</span>
            <span>Trial ${trialId} Screening</span>
          </a>
          <a href="#" class="session-item">
            <span>○</span>
            <span>Lab Cohort B Biomarkers</span>
          </a>
          <a href="#" class="session-item">
            <span>○</span>
            <span>Keytruda Phase 3 Bio-Profiles</span>
          </a>
          <a href="#" class="session-item">
            <span>○</span>
            <span>SAP Supply Chain - Site 4</span>
          </a>
        </div>
      </div>

      <div class="sidebar-footer">
        Connected Grounding Sources:<br/>
        • BigQuery: <span>clinical-lakehouse</span><br/>
        • Vertex AI: <span>Agent Reasoning Engine</span><br/>
        • SAP Gateway: <span>Private Service Connect</span>
      </div>
    </aside>

    <!-- Main Chat Window -->
    <main class="chat-main">
      <div class="chat-container">
        <!-- User Bubble -->
        <div class="user-bubble-row">
          <div class="user-bubble">
            <div class="user-bubble-header">
              <span>Dr. Maya Lin (Oncology Lead)</span>
              <span>10:42 AM</span>
            </div>
            <p>Screen eligible oncology candidates for Phase 3 Trial ${trialId} with confirmed EGFR exon 19 deletion, summarize their lab reports, and verify medication inventory in SAP ERP.</p>
          </div>
        </div>

        <!-- Agent Response -->
        <div class="agent-bubble-row">
          <div class="agent-avatar">✦</div>
          <div class="agent-content">
            <div class="agent-header">
              <span class="agent-name">Gemini Enterprise Agent</span>
              <span class="agent-badge">Gemini 2.0 Flash • Sub-15ms Private VPC</span>
            </div>

            <!-- Agentic Execution Trace Accordion -->
            <div class="execution-trace" data-test-id="agentic-trace-panel">
              <div class="trace-title">
                <span>⚡</span>
                <span>Agentic Execution Trace (3 Deterministic Tool Calls via Vertex AI)</span>
              </div>
              <div class="trace-step">
                <span>1.</span>
                <div>
                  <strong>query_clinical_lakehouse</strong>(trial="NCT-048291", mutation="EGFR_EXON_19")<br/>
                  <span style="color: #64748b; font-size: 11.5px;">→ BigQuery Lakehouse scanned 12,480 patient records; 42 candidate profiles matched inclusion criteria (100% HIPAA anonymized).</span>
                </div>
              </div>
              <div class="trace-step">
                <span>2.</span>
                <div>
                  <strong>summarize_lab_reports</strong>(cohort_id="NCT-048291", target="EGFR")<br/>
                  <span style="color: #64748b; font-size: 11.5px;">→ Gemini 2.0 Flash Multimodal synthesized pathology notes; confirmed deletion without secondary resistance mutations.</span>
                </div>
              </div>
              <div class="trace-step">
                <span>3.</span>
                <div>
                  <strong>check_sap_inventory</strong>(sku="KEYTRUDA-100MG", site="SITE-4")<br/>
                  <span style="color: #64748b; font-size: 11.5px;">→ SAP ERP Gateway confirmed 150 vials verified in temperature-controlled cold chain distribution.</span>
                </div>
              </div>
            </div>

            <!-- Clinical Assessment Card -->
            <div class="clinical-card" data-test-id="clinical-card-panel">
              <h2 class="card-heading">Phase 3 Cohort Screening & Protocol Assessment Summary</h2>
              <p class="card-text">
                Based on automated grounding against the <strong>BigQuery Clinical Lakehouse</strong> and real-time inventory in <strong>SAP ERP</strong>, <strong>42 patients</strong> meet all eligibility criteria for <strong>Trial ${trialId}</strong>. Genomic lab sequencing confirms the target EGFR exon 19 deletion with zero prior MET amplification. Investigational medication is stocked and ready for immediate patient enrollment.
              </p>

              <table class="clinical-table">
                <thead>
                  <tr>
                    <th>Patient ID</th>
                    <th>Age / Sex</th>
                    <th>Biomarker Variant</th>
                    <th>ECOG</th>
                    <th>Eligibility Match</th>
                    <th>Stock Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code style="font-family: var(--font-mono); font-weight: bold; color: #0284c7;">PT-90412</code></td>
                    <td>58 / F</td>
                    <td>EGFR Exon 19 del (L747_A750)</td>
                    <td>0</td>
                    <td><span class="badge-match">98.5% Match</span></td>
                    <td><span class="badge-stock">Available (Site 4)</span></td>
                  </tr>
                  <tr>
                    <td><code style="font-family: var(--font-mono); font-weight: bold; color: #0284c7;">PT-90488</code></td>
                    <td>64 / M</td>
                    <td>EGFR Exon 19 del (E746_A750)</td>
                    <td>1</td>
                    <td><span class="badge-match">96.2% Match</span></td>
                    <td><span class="badge-stock">Available (Site 4)</span></td>
                  </tr>
                  <tr>
                    <td><code style="font-family: var(--font-mono); font-weight: bold; color: #0284c7;">PT-90533</code></td>
                    <td>52 / F</td>
                    <td>EGFR Exon 19 del (L747_P753)</td>
                    <td>0</td>
                    <td><span class="badge-match">95.1% Match</span></td>
                    <td><span class="badge-stock">Available (Site 4)</span></td>
                  </tr>
                </tbody>
              </table>

              <div class="cta-row">
                <button class="cta-btn-primary" data-test-id="btn-export-lims">
                  <span>📋</span>
                  <span>Export Cohort to LIMS</span>
                </button>
                <button class="cta-btn-secondary" data-test-id="btn-notify-pi">
                  <span>🏥</span>
                  <span>Notify Trial Site Coordinators</span>
                </button>
                <a href="/vertex-ai/models?project=merck-clinical-ai-prod" class="cta-btn-secondary" style="text-decoration: none;">
                  <span>⚙️</span>
                  <span>Inspect Backend in GCP Console &gt;</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Bottom Floating Input -->
    <div class="bottom-bar">
      <div class="prompt-box">
        <input type="text" class="prompt-input" placeholder="Ask Gemini about trial protocols, genomic variants, or SAP logistics..." value="Screen eligible oncology candidates for Phase 3 Trial ${trialId}..." />
        <button class="send-btn">➔</button>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// --------------------------------------------------------------------------------
// 2. GOOGLE CLOUD CONSOLE (Pantheon - Backend Infrastructure - Tier 2, 3 & 4)
// --------------------------------------------------------------------------------
export function createMockConsoleHtml(pathname: string, searchParams: URLSearchParams, simulatePii = false): string {
  if (pathname.startsWith("/chat") || pathname.startsWith("/gemini-enterprise")) {
    return createMockGeminiEnterpriseChatHtml(pathname, searchParams);
  }

  const projectId = searchParams.get("project") || "merck-clinical-ai-prod";
  const billingAccount = simulatePii ? "01A2B3-4C5D6E-7F8G9H" : "01••••-••••••-••••••";
  const userLdap = simulatePii ? "engineer@google.com" : "cloud-architect@merck.com";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Google Cloud Console — Vertex AI — ${projectId}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Google+Sans+Flex:wght@400;500;600;700&family=Roboto+Mono:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --gcp-blue: #1a73e8;
      --gcp-blue-hover: #1557b0;
      --gcp-header-bg: #1a73e8;
      --gcp-header-text: #ffffff;
      --gcp-sidebar-bg: #ffffff;
      --gcp-surface: #ffffff;
      --gcp-text: #202124;
      --gcp-subtext: #5f6368;
      --gcp-border: #dadce0;
      --gcp-success: #1e8e3e;
      --font-family: 'Google Sans Flex', 'Google Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      --font-mono: 'Roboto Mono', monospace;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: var(--font-family); background: #f8f9fa; color: var(--gcp-text); -webkit-font-smoothing: antialiased; }

    /* Top Switcher Banner for Quick Auditing */
    .env-switcher {
      position: fixed; top: 10px; right: 300px; z-index: 200;
      display: flex; align-items: center; gap: 8px; background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(8px);
      padding: 4px 12px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.3);
    }
    .env-switcher a { color: #e2e8f0; text-decoration: none; font-size: 11px; font-weight: 600; padding: 2px 6px; }
    .env-switcher a.active { color: #ffffff; background: #2563eb; border-radius: 12px; }

    /* Pantheon Header Bar */
    .pantheon-header {
      display: flex; align-items: center; justify-content: space-between;
      height: 48px; background: #1a73e8; color: #ffffff; border-bottom: 1px solid #185abc;
      padding: 0 16px; position: sticky; top: 0; z-index: 100; box-shadow: 0 1px 2px rgba(0,0,0,0.1);
    }
    .header-left { display: flex; align-items: center; gap: 14px; }
    .hamburger-btn {
      background: none; border: none; color: white; cursor: pointer; display: flex; align-items: center;
      padding: 6px; border-radius: 50%;
    }
    .hamburger-btn:hover { background: rgba(255,255,255,0.15); }
    .logo-container { display: flex; align-items: center; gap: 8px; font-weight: 500; font-size: 15px; letter-spacing: -0.2px; }
    .logo-cloud { width: 22px; height: 18px; }

    .project-picker-btn {
      display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.2);
      border-radius: 6px; padding: 4px 12px; font-size: 13px; font-weight: 500; color: #ffffff; cursor: pointer; transition: background 0.15s;
    }
    .project-picker-btn:hover { background: rgba(255,255,255,0.25); }

    .header-center { flex: 1; max-width: 580px; margin: 0 24px; }
    .search-box {
      width: 100%; height: 32px; background: rgba(255,255,255,0.2); border: 1px solid transparent;
      border-radius: 8px; padding: 0 12px; color: #ffffff; font-size: 13px; display: flex; align-items: center; justify-content: space-between;
    }
    .search-placeholder { display: flex; align-items: center; gap: 8px; color: rgba(255,255,255,0.8); font-size: 12.5px; }
    .search-shortcut { font-size: 11px; background: rgba(255,255,255,0.25); padding: 1px 6px; border-radius: 4px; font-family: var(--font-mono); }

    .header-right { display: flex; align-items: center; gap: 14px; font-size: 12px; color: #ffffff; }
    .icon-btn { background: none; border: none; color: white; cursor: pointer; padding: 6px; border-radius: 50%; display: flex; align-items: center; }
    .icon-btn:hover { background: rgba(255,255,255,0.15); }
    .billing-badge { background: rgba(255,255,255,0.2); color: #ffffff; padding: 3px 8px; border-radius: 10px; font-size: 11px; font-family: var(--font-mono); }
    .user-avatar-gcp { width: 28px; height: 28px; border-radius: 50%; background: #ea4335; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; }

    /* Page Layout */
    .main-container { display: flex; min-height: calc(100vh - 48px); }
    .nav-sidebar { width: 240px; background: var(--gcp-sidebar-bg); border-right: 1px solid var(--gcp-border); padding: 12px 8px; }
    .sidebar-section-title { font-size: 11px; font-weight: 700; color: #70757a; text-transform: uppercase; letter-spacing: 0.5px; padding: 8px 12px 4px 12px; }
    .nav-item {
      display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-radius: 6px;
      font-size: 13px; text-decoration: none; color: var(--gcp-text); margin-bottom: 2px; font-weight: 500;
    }
    .nav-item.active { background: #e8f0fe; color: var(--gcp-blue); font-weight: 600; }
    .nav-item:hover:not(.active) { background: #f1f3f4; }
    .nav-icon { width: 16px; height: 16px; opacity: 0.75; }

    .content-area { flex: 1; padding: 24px 36px; position: relative; }
    .breadcrumbs { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--gcp-subtext); margin-bottom: 12px; }
    .breadcrumbs a { color: var(--gcp-blue); text-decoration: none; }
    
    .page-title-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
    .page-title { font-size: 22px; font-weight: 500; color: #202124; display: flex; align-items: center; gap: 8px; }

    /* Model Hero Card */
    .hero-model-card {
      background: #ffffff; border: 1px solid var(--gcp-border); border-radius: 8px; padding: 20px 24px;
      margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); display: flex; flex-direction: column; gap: 14px;
    }
    .model-header-row { display: flex; align-items: flex-start; justify-content: space-between; }
    .model-brand { display: flex; align-items: center; gap: 12px; }
    .sparkle-icon { width: 32px; height: 32px; border-radius: 8px; background: linear-gradient(135deg, #1a73e8, #7c3aed); display: flex; align-items: center; justify-content: center; color: white; font-size: 18px; }
    .model-name { font-size: 19px; font-weight: 600; color: #202124; }
    .model-tagline { font-size: 13px; color: var(--gcp-subtext); margin-top: 2px; }

    .badge-row { display: flex; gap: 8px; flex-wrap: wrap; }
    .gcp-tag { font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 4px; background: #e8f0fe; color: var(--gcp-blue); }
    .gcp-tag.green { background: #e6f4ea; color: #137333; }
    .gcp-tag.purple { background: #f3e8fd; color: #7627bb; }

    .metrics-row { display: flex; gap: 24px; padding: 12px 0; border-top: 1px solid #f1f3f4; border-bottom: 1px solid #f1f3f4; }
    .metric-col { display: flex; flex-direction: column; gap: 2px; }
    .metric-label { font-size: 11px; color: var(--gcp-subtext); font-weight: 500; text-transform: uppercase; }
    .metric-val { font-size: 14px; font-weight: 700; color: #202124; font-family: var(--font-mono); }

    /* GCP Buttons */
    .btn-primary {
      background: var(--gcp-blue); color: #ffffff; border: none; border-radius: 4px;
      padding: 8px 18px; font-size: 13.5px; font-weight: 500; cursor: pointer; transition: background 0.15s;
      display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 1px 2px rgba(0,0,0,0.1);
    }
    .btn-primary:hover { background: var(--gcp-blue-hover); }
    .btn-secondary {
      background: #ffffff; color: var(--gcp-blue); border: 1px solid var(--gcp-border);
      border-radius: 4px; padding: 8px 16px; font-size: 13.5px; font-weight: 500; cursor: pointer;
    }

    /* Data Table Card */
    .card { background: #ffffff; border: 1px solid var(--gcp-border); border-radius: 8px; padding: 20px; box-shadow: 0 1px 2px rgba(0,0,0,0.04); }
    .card-title { font-size: 15px; font-weight: 600; margin-bottom: 14px; color: #202124; }
    .endpoints-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .endpoints-table th { background: #f8f9fa; padding: 10px 14px; text-align: left; font-weight: 600; color: var(--gcp-subtext); border-bottom: 1px solid var(--gcp-border); }
    .endpoints-table td { padding: 12px 14px; border-bottom: 1px solid #f1f3f4; color: #202124; }
    .status-badge { display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px; border-radius: 12px; font-size: 11.5px; font-weight: 600; }
    .status-badge.ready { background: #e6f4ea; color: #137333; }
    .status-badge.pending { background: #fef7e0; color: #b06000; }

    /* Deploy Slide Drawer */
    .slide-drawer {
      position: fixed; right: -720px; top: 48px; width: 720px; height: calc(100vh - 48px);
      background: #ffffff; border-left: 1px solid var(--gcp-border); box-shadow: -4px 0 24px rgba(0,0,0,0.12);
      padding: 28px 32px; transition: right 0.25s cubic-bezier(0.25, 0.1, 0.25, 1); z-index: 150; overflow-y: auto;
    }
    .slide-drawer.open { right: 0; }
    .drawer-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 16px; }
    .drawer-title { font-size: 19px; font-weight: 500; color: #202124; }
    .drawer-subtitle { font-size: 12.5px; color: var(--gcp-subtext); margin-top: 4px; }
    .stepper { display: flex; gap: 8px; font-size: 12px; color: var(--gcp-subtext); margin-bottom: 20px; padding-bottom: 12px; border-bottom: 1px solid #e8eaed; }
    .stepper span.active { color: var(--gcp-blue); font-weight: 600; }

    .form-group { margin-bottom: 16px; }
    .form-label { display: block; font-size: 12.5px; font-weight: 600; margin-bottom: 6px; color: #202124; }
    .form-help { font-size: 11px; color: var(--gcp-subtext); margin-top: 4px; }
    .form-input, .form-select {
      width: 100%; padding: 9px 12px; border: 1px solid #dadce0; border-radius: 4px; font-size: 13.5px;
      outline: none; font-family: inherit; transition: border-color 0.15s;
    }
    .form-input:focus, .form-select:focus { border-color: var(--gcp-blue); box-shadow: 0 0 0 2px rgba(26, 115, 232, 0.2); }
  </style>
</head>
<body>
  <!-- Environment Mode Switcher -->
  <div class="env-switcher">
    <a href="/chat/gemini-enterprise">💬 Gemini Enterprise Chat</a>
    <a href="/vertex-ai/models?project=merck-clinical-ai-prod" class="active">☁️ Google Cloud Console</a>
  </div>

  <!-- Pantheon Header Bar -->
  <header class="pantheon-header" role="banner">
    <div class="header-left">
      <button class="hamburger-btn" aria-label="Main menu">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>
      </button>
      <div class="logo-container" data-test-id="pantheon-logo">
        <svg class="logo-cloud" viewBox="0 0 24 24" fill="none"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" fill="#FFFFFF"/></svg>
        <span>Google Cloud</span>
      </div>
      <button class="project-picker-btn" role="combobox" aria-label="Select a project" aria-expanded="false" data-test-id="cfc-project-picker-trigger">
        <span class="project-name" id="active-project-label">${projectId}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
      </button>
    </div>

    <div class="header-center">
      <div class="search-box">
        <div class="search-placeholder">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
          <span>Search products, resources, docs (/)</span>
        </div>
        <span class="search-shortcut">/</span>
      </div>
    </div>

    <div class="header-right">
      <button class="icon-btn" aria-label="Activate Cloud Shell" title="Activate Cloud Shell">
        <span style="font-family: var(--font-mono); font-weight: bold; font-size: 13px;">&gt;_</span>
      </button>
      <button class="icon-btn" aria-label="Notifications" title="Notifications">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>
      </button>
      <span class="billing-badge" data-test-id="billing-account-id">Billing: ${billingAccount}</span>
      <div class="user-avatar-gcp" data-test-id="user-account-ldap" title="${userLdap}">ML</div>
    </div>
  </header>

  <!-- Shell Container -->
  <div class="main-container">
    <nav class="nav-sidebar" role="navigation" aria-label="Cloud Services">
      <div class="sidebar-section-title">VERTEX AI STUDIO</div>
      <a href="/vertex-ai/models?project=${projectId}" class="nav-item active">
        <span>🪴</span>
        <span>Model Garden</span>
      </a>
      <a href="/vertex-ai/agents?project=${projectId}" class="nav-item">
        <span>🤖</span>
        <span>Agent Builder</span>
      </a>
      <a href="/vertex-ai/endpoints?project=${projectId}" class="nav-item">
        <span>⚡</span>
        <span>Online Prediction (Endpoints)</span>
      </a>
      <a href="/vertex-ai/reasoning-engine?project=${projectId}" class="nav-item">
        <span>🧠</span>
        <span>Reasoning Engine</span>
      </a>

      <div class="sidebar-section-title" style="margin-top: 14px;">ENTERPRISE CORE</div>
      <a href="/bigquery?project=${projectId}" class="nav-item">
        <span>🗄️</span>
        <span>BigQuery Studio</span>
      </a>
      <a href="/vpc/private-service-connect?project=${projectId}" class="nav-item">
        <span>🛡️</span>
        <span>Private Service Connect (PSC)</span>
      </a>
      <a href="/run/deploy?project=${projectId}" class="nav-item">
        <span>🏃</span>
        <span>Cloud Run Gateways</span>
      </a>
    </nav>

    <main class="content-area" role="main" id="main-content">
      <div class="breadcrumbs">
        <a href="#">Vertex AI</a> &gt; <a href="#">Model Garden</a> &gt; <span>Gemini 2.0 Flash</span>
      </div>

      <div class="page-title-row">
        <h1 class="page-title">
          <span>Gemini 2.0 Flash Foundation Model</span>
        </h1>
        <button id="btn-open-deploy" class="btn-primary" role="button" aria-label="Deploy Model" data-test-id="mg-deploy-btn">
          <span>🚀</span>
          <span>Deploy to Private Endpoint</span>
        </button>
      </div>

      <!-- Hero Model Card -->
      <div class="hero-model-card">
        <div class="model-header-row">
          <div class="model-brand">
            <div class="sparkle-icon">✦</div>
            <div>
              <h2 class="model-name">gemini-2.0-flash-001</h2>
              <p class="model-tagline">Google DeepMind multimodal reasoning model optimized for sub-15ms agent tool orchestration and clinical lakehouse grounding.</p>
            </div>
          </div>
        </div>

        <div class="badge-row">
          <span class="gcp-tag green">● General Availability (GA)</span>
          <span class="gcp-tag">Multimodal (Audio, Vision, Text)</span>
          <span class="gcp-tag purple">1,048,576 Token Context</span>
          <span class="gcp-tag">Native Function Calling</span>
          <span class="gcp-tag green">Zero Data Retention (ZDR)</span>
        </div>

        <div class="metrics-row">
          <div class="metric-col">
            <span class="metric-label">Inference Latency</span>
            <span class="metric-val" style="color: #137333;">14.2 ms (Private VPC)</span>
          </div>
          <div class="metric-col">
            <span class="metric-label">Throughput</span>
            <span class="metric-val">1,250 tokens / sec</span>
          </div>
          <div class="metric-col">
            <span class="metric-label">VPC Routing</span>
            <span class="metric-val">PSC Forwarding Rule</span>
          </div>
          <div class="metric-col">
            <span class="metric-label">Security Clearance</span>
            <span class="metric-val">HIPAA / GxP Qualified</span>
          </div>
        </div>
      </div>

      <!-- Endpoints Table Card -->
      <div class="card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <h2 class="card-title">Deployed Model Endpoints in ${projectId}</h2>
          <span style="font-size: 12px; color: var(--gcp-subtext);">Showing 2 active endpoints</span>
        </div>

        <table class="endpoints-table">
          <thead>
            <tr>
              <th>Endpoint Name</th>
              <th>Status</th>
              <th>VPC Network</th>
              <th>Deployed Model</th>
              <th>Region</th>
              <th>Autoscaling Replicas</th>
              <th>Audit Telemetry</th>
            </tr>
          </thead>
          <tbody id="endpoints-table-body">
            <tr>
              <td style="font-weight: 600; color: #1a73e8;"><code style="font-family: var(--font-mono);">gemini-20-flash-merck-prod</code></td>
              <td><span class="status-badge ready">● Active (PSC)</span></td>
              <td><code style="font-family: var(--font-mono); font-size: 11.5px;">merck-clinical-vpc</code></td>
              <td>gemini-2.0-flash-001</td>
              <td>us-central1</td>
              <td>1 – 5 replicas</td>
              <td><span style="color: #137333; font-weight: 600; font-size: 11.5px;">Enabled</span></td>
            </tr>
            <tr>
              <td style="font-weight: 600; color: #1a73e8;"><code style="font-family: var(--font-mono);">clinical-search-grounding</code></td>
              <td><span class="status-badge ready">● Active</span></td>
              <td><code style="font-family: var(--font-mono); font-size: 11.5px;">merck-clinical-vpc</code></td>
              <td>text-embedding-005</td>
              <td>us-central1</td>
              <td>2 – 8 replicas</td>
              <td><span style="color: #137333; font-weight: 600; font-size: 11.5px;">Enabled</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>

    <!-- Vertex AI Deploy Drawer Custom Element -->
    <pantheon-deploy-drawer id="pantheon-drawer-component"></pantheon-deploy-drawer>
  </div>

  <script>
    class PantheonDeployDrawer extends HTMLElement {
      constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.innerHTML = \`
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Google Sans Flex', 'Google Sans', sans-serif; }
            .slide-drawer {
              position: fixed; right: -720px; top: 48px; width: 720px; height: calc(100vh - 48px);
              background: #ffffff; border-left: 1px solid #dadce0; box-shadow: -4px 0 24px rgba(0,0,0,0.12);
              padding: 28px 32px; transition: right 0.25s cubic-bezier(0.25, 0.1, 0.25, 1); z-index: 150; overflow-y: auto;
            }
            .slide-drawer.open { right: 0; }
            .drawer-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 12px; }
            .drawer-title { font-size: 19px; font-weight: 600; color: #202124; }
            .drawer-subtitle { font-size: 12.5px; color: #5f6368; margin-top: 2px; }
            .stepper { display: flex; gap: 8px; font-size: 12px; color: #5f6368; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 1px solid #e8eaed; }
            .stepper span.active { color: #1a73e8; font-weight: 600; }
            
            .form-group { margin-bottom: 16px; }
            .form-label { display: block; font-size: 12.5px; font-weight: 600; margin-bottom: 6px; color: #202124; }
            .form-help { font-size: 11px; color: #5f6368; margin-top: 4px; }
            .form-input, .form-select {
              width: 100%; padding: 9px 12px; border: 1px solid #dadce0; border-radius: 4px; font-size: 13.5px;
              outline: none; font-family: inherit;
            }
            .form-input:focus, .form-select:focus { border-color: #1a73e8; box-shadow: 0 0 0 2px rgba(26, 115, 232, 0.2); }
            .btn-primary {
              background: #1a73e8; color: #ffffff; border: none; border-radius: 4px;
              padding: 9px 20px; font-size: 13.5px; font-weight: 600; cursor: pointer;
            }
            .btn-secondary {
              background: #ffffff; color: #1a73e8; border: 1px solid #dadce0;
              border-radius: 4px; padding: 9px 18px; font-size: 13.5px; font-weight: 600; cursor: pointer;
            }
            .status-badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
            .status-badge.ready { background: #e6f4ea; color: #137333; }
            .status-badge.pending { background: #fef7e0; color: #b06000; }
          </style>
          <div id="deploy-drawer" class="slide-drawer" role="dialog" aria-modal="true" aria-label="Deploy model to endpoint" data-test-id="deploy-model-drawer">
            <div class="drawer-header">
              <div>
                <h3 class="drawer-title">Deploy model to private VPC endpoint</h3>
                <p class="drawer-subtitle">Configures Vertex AI Agent Runtime with Private Service Connect (PSC).</p>
              </div>
              <button id="btn-close-drawer" class="btn-secondary" style="padding: 4px 8px; font-size: 12px;" aria-label="Close drawer">✕</button>
            </div>

            <div class="stepper">
              <span class="active">1. Endpoint details</span> •
              <span>2. Model settings</span> •
              <span>3. Security & VPC</span>
            </div>

            <form id="endpoint-deploy-form">
              <div class="form-group">
                <label class="form-label" for="endpoint-name-input">Endpoint name</label>
                <input type="text" id="endpoint-name-input" class="form-input" role="textbox" aria-label="Endpoint name" data-test-id="input-endpoint-name" value="gemini-20-flash-merck-prod" required />
                <p class="form-help">Unique resource identifier within projects/${projectId}/locations/us-central1</p>
              </div>

              <div class="form-group">
                <label class="form-label" for="vpc-select">VPC Network Routing (Zero Public IPs)</label>
                <select id="vpc-select" class="form-select" data-test-id="select-vpc">
                  <option value="merck-clinical-vpc" selected>projects/merck-prod/global/networks/merck-clinical-vpc (PSC Enabled)</option>
                  <option value="default-vpc">default-vpc</option>
                </select>
                <p class="form-help">Traffic routes directly over Google internal backbone with no external egress.</p>
              </div>

              <div class="form-group" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div>
                  <label class="form-label" for="min-replicas-input">Minimum replicas</label>
                  <input type="number" id="min-replicas-input" class="form-input" role="spinbutton" aria-label="Min replicas" data-test-id="input-min-replicas" value="1" min="1" max="10" />
                </div>
                <div>
                  <label class="form-label" for="max-replicas-input">Maximum replicas</label>
                  <input type="number" id="max-replicas-input" class="form-input" role="spinbutton" aria-label="Max replicas" data-test-id="input-max-replicas" value="5" min="1" max="20" />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" for="service-account-input">Service Account (Least Privilege)</label>
                <input type="email" id="service-account-input" class="form-input" role="textbox" aria-label="Service account" data-test-id="input-service-account" value="sa-vertex-agent@${projectId}.iam.gserviceaccount.com" />
                <p class="form-help">Bound to roles/aiplatform.user and roles/bigquery.dataViewer</p>
              </div>

              <div style="display: flex; gap: 12px; margin-top: 24px;">
                <button type="submit" id="btn-submit-deploy" class="btn-primary" role="button" aria-label="Confirm and Deploy" data-test-id="btn-confirm-deploy">Deploy Endpoint</button>
                <button type="button" id="btn-cancel-deploy" class="btn-secondary" role="button" aria-label="Cancel">Cancel</button>
              </div>
            </form>

            <div id="deployment-status-panel" style="display: none; margin-top: 20px;" data-test-id="deployment-status-panel">
              <div class="status-badge pending" id="deploy-badge">Provisioning Private Service Connect endpoint...</div>
            </div>
          </div>
        \`;

        const form = shadow.getElementById('endpoint-deploy-form');
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const statusPanel = shadow.getElementById('deployment-status-panel');
          const badge = shadow.getElementById('deploy-badge');
          const endpointName = shadow.getElementById('endpoint-name-input').value;
          statusPanel.style.display = 'block';
          badge.className = 'status-badge pending';
          badge.textContent = 'Deploying ' + endpointName + ' to merck-clinical-vpc...';

          setTimeout(() => {
            badge.className = 'status-badge ready';
            badge.textContent = '● Active: Endpoint ' + endpointName + ' Ready (PSC Established)';
            const tableBody = document.getElementById('endpoints-table-body');
            if (tableBody) {
              const row = document.createElement('tr');
              row.innerHTML = '<td style="font-weight: 600; color: #1a73e8;"><code>' + endpointName + '</code></td><td><span class="status-badge ready">● Active (PSC)</span></td><td><code>merck-clinical-vpc</code></td><td>gemini-2.0-flash-001</td><td>us-central1</td><td>1 – 5 replicas</td><td><span style="color: #137333; font-weight: 600;">Enabled</span></td>';
              tableBody.prepend(row);
            }
          }, 400);
        });

        shadow.getElementById('btn-close-drawer').addEventListener('click', () => this.close());
        shadow.getElementById('btn-cancel-deploy').addEventListener('click', () => this.close());
      }

      open() {
        this.shadowRoot.getElementById('deploy-drawer').classList.add('open');
        this.shadowRoot.getElementById('endpoint-name-input').focus();
      }

      close() {
        this.shadowRoot.getElementById('deploy-drawer').classList.remove('open');
      }
    }
    customElements.define('pantheon-deploy-drawer', PantheonDeployDrawer);

    window.openDeployDrawer = function() {
      const drawerComp = document.getElementById('pantheon-drawer-component');
      if (drawerComp) drawerComp.open();
    };

    window.closeDeployDrawer = function() {
      const drawerComp = document.getElementById('pantheon-drawer-component');
      if (drawerComp) drawerComp.close();
    };

    document.getElementById('btn-open-deploy')?.addEventListener('click', window.openDeployDrawer);
  </script>
</body>
</html>`;
}

export function startMockServer(options: MockServerOptions = {}): Promise<RunningMockServer> {
  const host = options.host || "127.0.0.1";
  const preferredPort = options.port || 8089;
  const simulatePii = options.simulatePii || false;

  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      try {
        const parsedUrl = new URL(req.url || "/", `http://${host}:${preferredPort}`);
        let html = "";
        if (parsedUrl.pathname.startsWith("/chat") || parsedUrl.pathname.startsWith("/gemini-enterprise")) {
          html = createMockGeminiEnterpriseChatHtml(parsedUrl.pathname, parsedUrl.searchParams);
        } else {
          html = createMockConsoleHtml(parsedUrl.pathname, parsedUrl.searchParams, simulatePii);
        }

        res.writeHead(200, {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-cache",
          "X-GCP-Pantheon-Mock": "v2.0"
        });
        res.end(html);
      } catch (err) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Internal Mock Server Error: " + String(err));
      }
    });

    server.listen(preferredPort, host, () => {
      const address = server.address();
      const actualPort = typeof address === "object" && address ? address.port : preferredPort;
      const baseUrl = `http://${host}:${actualPort}`;

      resolve({
        port: actualPort,
        host,
        baseUrl,
        close: () => {
          return new Promise<void>((closeResolve, closeReject) => {
            server.close((err) => {
              if (err) closeReject(err);
              else closeResolve();
            });
          });
        }
      });
    });

    server.on("error", reject);
  });
}

if (process.argv[1] && process.argv[1].endsWith("server.ts")) {
  const port = parseInt(process.env.PORT || "8089", 10);
  startMockServer({ port }).then(running => {
    console.log(`[Mock Server] Running at ${running.baseUrl}`);
    console.log(`  - Gemini Enterprise Chat: ${running.baseUrl}/chat/gemini-enterprise`);
    console.log(`  - GCP Console: ${running.baseUrl}/vertex-ai/models?project=merck-clinical-ai-prod`);
  });
}
