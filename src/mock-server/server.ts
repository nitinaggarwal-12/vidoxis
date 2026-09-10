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

export function createMockConsoleHtml(pathname: string, searchParams: URLSearchParams, simulatePii = false): string {
  const projectId = searchParams.get("project") || "trainex-sandbox-8f2a";
  const billingAccount = simulatePii ? "01A2B3-4C5D6E-7F8G9H" : "01••••-••••••-••••••";
  const userLdap = simulatePii ? "engineer@google.com" : "cloud-architect@partner.example.com";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Google Cloud Console — ${pathname}</title>
  <style>
    :root {
      --gcp-blue: #1a73e8;
      --gcp-blue-hover: #1557b0;
      --gcp-header-bg: #ffffff;
      --gcp-sidebar-bg: #f8f9fa;
      --gcp-surface: #ffffff;
      --gcp-text: #202124;
      --gcp-subtext: #5f6368;
      --gcp-border: #dadce0;
      --gcp-success: #1e8e3e;
      --font-family: 'Google Sans', 'Google Sans Flex', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: var(--font-family); background: #f8f9fa; color: var(--gcp-text); -webkit-font-smoothing: antialiased; }
    
    /* Top Header Bar */
    .pantheon-header {
      display: flex; align-items: center; justify-content: space-between;
      height: 48px; background: var(--gcp-header-bg); border-bottom: 1px solid var(--gcp-border);
      padding: 0 16px; position: sticky; top: 0; z-index: 100;
    }
    .header-left { display: flex; align-items: center; gap: 16px; }
    .logo-container { display: flex; align-items: center; gap: 8px; font-weight: 500; font-size: 16px; }
    .project-picker-btn {
      display: flex; align-items: center; gap: 8px; background: #f1f3f4; border: 1px solid transparent;
      border-radius: 4px; padding: 6px 12px; font-size: 13px; font-weight: 500; cursor: pointer;
    }
    .project-picker-btn:hover { background: #e8eaed; }
    .header-right { display: flex; align-items: center; gap: 16px; font-size: 12px; color: var(--gcp-subtext); }
    .billing-badge { background: #e8f0fe; color: var(--gcp-blue); padding: 4px 8px; border-radius: 12px; font-size: 11px; }

    /* Page Layout */
    .main-container { display: flex; min-height: calc(100vh - 48px); }
    .nav-sidebar { width: 220px; background: var(--gcp-sidebar-bg); border-right: 1px solid var(--gcp-border); padding: 16px 8px; }
    .nav-item { display: block; padding: 8px 12px; border-radius: 4px; font-size: 13px; text-decoration: none; color: var(--gcp-text); margin-bottom: 4px; }
    .nav-item.active { background: #e8f0fe; color: var(--gcp-blue); font-weight: 500; }
    .nav-item:hover:not(.active) { background: #f1f3f4; }

    .content-area { flex: 1; padding: 24px 32px; position: relative; }
    .page-title-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
    .page-title { font-size: 22px; font-weight: 400; }
    
    /* GCP Buttons */
    .btn-primary {
      background: var(--gcp-blue); color: #ffffff; border: none; border-radius: 4px;
      padding: 8px 16px; font-size: 14px; font-weight: 500; cursor: pointer; transition: background 0.15s;
    }
    .btn-primary:hover { background: var(--gcp-blue-hover); }
    .btn-secondary {
      background: #ffffff; color: var(--gcp-blue); border: 1px solid var(--gcp-border);
      border-radius: 4px; padding: 8px 16px; font-size: 14px; font-weight: 500; cursor: pointer;
    }

    /* Cards and Drawers */
    .card { background: #ffffff; border: 1px solid var(--gcp-border); border-radius: 8px; padding: 20px; margin-bottom: 20px; }
    .form-group { margin-bottom: 16px; }
    .form-label { display: block; font-size: 13px; font-weight: 500; margin-bottom: 6px; color: var(--gcp-text); }
    .form-input, .form-select {
      width: 100%; max-width: 480px; padding: 8px 12px; border: 1px solid var(--gcp-border);
      border-radius: 4px; font-size: 14px; outline: none; font-family: inherit;
    }
    .form-input:focus, .form-select:focus { border-color: var(--gcp-blue); box-shadow: 0 0 0 2px rgba(26, 115, 232, 0.2); }

    /* Deploy Slide Drawer */
    .slide-drawer {
      position: fixed; right: -560px; top: 48px; width: 560px; height: calc(100vh - 48px);
      background: #ffffff; border-left: 1px solid var(--gcp-border); box-shadow: -4px 0 16px rgba(0,0,0,0.08);
      padding: 24px; transition: right 0.25s cubic-bezier(0.25, 0.1, 0.25, 1); z-index: 50; overflow-y: auto;
    }
    .slide-drawer.open { right: 0; }
    .drawer-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
    .status-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 500; }
    .status-badge.ready { background: #e6f4ea; color: var(--gcp-success); }
    .status-badge.pending { background: #fef7e0; color: #b06000; }
  </style>
</head>
<body>
  <!-- Header Bar -->
  <header class="pantheon-header" role="banner">
    <div class="header-left">
      <div class="logo-container" data-test-id="pantheon-logo">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" fill="#1A73E8"/></svg>
        <span>Google Cloud</span>
      </div>
      <button class="project-picker-btn" role="combobox" aria-label="Select a project" aria-expanded="false" data-test-id="cfc-project-picker-trigger">
        <span class="project-name" id="active-project-label">${projectId}</span>
        <svg width="12" height="12" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z" fill="#5F6368"/></svg>
      </button>
    </div>
    <div class="header-right">
      <span class="billing-badge" data-test-id="billing-account-id">Billing: ${billingAccount}</span>
      <span class="user-ldap" data-test-id="user-account-ldap">${userLdap}</span>
    </div>
  </header>

  <!-- Shell Container -->
  <div class="main-container">
    <nav class="nav-sidebar" role="navigation" aria-label="Cloud Services">
      <a href="/vertex-ai/models?project=${projectId}" class="nav-item ${pathname.includes('vertex') ? 'active' : ''}">Vertex AI</a>
      <a href="/run/deploy?project=${projectId}" class="nav-item ${pathname.includes('run') ? 'active' : ''}">Cloud Run</a>
      <a href="/bigquery?project=${projectId}" class="nav-item ${pathname.includes('bigquery') ? 'active' : ''}">BigQuery Studio</a>
    </nav>

    <main class="content-area" role="main" id="main-content">
      ${renderServicePageContent(pathname, projectId)}
    </main>

    <!-- Vertex AI Deploy Drawer -->
    <div id="deploy-drawer" class="slide-drawer" role="dialog" aria-modal="true" aria-label="Deploy model to endpoint" data-test-id="deploy-model-drawer">
      <div class="drawer-header">
        <h3 style="font-size: 18px; font-weight: 500;">Deploy model to endpoint</h3>
        <button id="btn-close-drawer" class="btn-secondary" style="padding: 4px 8px; font-size: 12px;" aria-label="Close drawer">✕</button>
      </div>
      <form id="endpoint-deploy-form" onsubmit="event.preventDefault(); window.submitDeployment();">
        <div class="form-group">
          <label class="form-label" for="endpoint-name-input">Endpoint name</label>
          <input type="text" id="endpoint-name-input" class="form-input" role="textbox" aria-label="Endpoint name" data-test-id="input-endpoint-name" value="gemini-2-flash-prod" required />
        </div>
        <div class="form-group">
          <label class="form-label" for="region-select">Region</label>
          <select id="region-select" class="form-select" role="combobox" aria-label="Region" data-test-id="select-region">
            <option value="us-central1" selected>us-central1 (Iowa)</option>
            <option value="us-east4">us-east4 (N. Virginia)</option>
            <option value="europe-west4">europe-west4 (Netherlands)</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="min-replicas-input">Minimum replicas</label>
          <input type="number" id="min-replicas-input" class="form-input" role="spinbutton" aria-label="Min replicas" data-test-id="input-min-replicas" value="1" min="1" max="10" />
        </div>
        <div class="form-group">
          <label class="form-label" for="max-replicas-input">Maximum replicas</label>
          <input type="number" id="max-replicas-input" class="form-input" role="spinbutton" aria-label="Max replicas" data-test-id="input-max-replicas" value="5" min="1" max="20" />
        </div>
        <div class="form-group">
          <label class="form-label" for="service-account-input">Service account</label>
          <input type="email" id="service-account-input" class="form-input" role="textbox" aria-label="Service account" data-test-id="input-service-account" value="sa-vertex-runner@${projectId}.iam.gserviceaccount.com" />
        </div>
        <div style="display: flex; gap: 12px; margin-top: 24px;">
          <button type="submit" id="btn-submit-deploy" class="btn-primary" role="button" aria-label="Confirm and Deploy" data-test-id="btn-confirm-deploy">Deploy</button>
          <button type="button" id="btn-cancel-deploy" class="btn-secondary" role="button" aria-label="Cancel">Cancel</button>
        </div>
      </form>
      <div id="deployment-status-panel" style="display: none; margin-top: 20px;" data-test-id="deployment-status-panel">
        <div class="status-badge pending" id="deploy-badge">Deploying model...</div>
      </div>
    </div>
  </div>

  <script>
    window.openDeployDrawer = function() {
      const drawer = document.getElementById('deploy-drawer');
      drawer.classList.add('open');
      document.getElementById('endpoint-name-input').focus();
    };

    window.closeDeployDrawer = function() {
      const drawer = document.getElementById('deploy-drawer');
      drawer.classList.remove('open');
    };

    window.submitDeployment = function() {
      const statusPanel = document.getElementById('deployment-status-panel');
      const badge = document.getElementById('deploy-badge');
      const endpointName = document.getElementById('endpoint-name-input').value;
      statusPanel.style.display = 'block';
      badge.className = 'status-badge pending';
      badge.textContent = 'Deploying ' + endpointName + '...';

      setTimeout(() => {
        badge.className = 'status-badge ready';
        badge.textContent = 'Endpoint Active: ' + endpointName;
        // Also update table in parent page
        const tableBody = document.getElementById('endpoints-table-body');
        if (tableBody) {
          const row = document.createElement('tr');
          row.innerHTML = '<td style="padding: 12px; font-weight: 500;">' + endpointName + '</td><td style="padding: 12px;">us-central1</td><td style="padding: 12px;"><span class="status-badge ready">Active</span></td>';
          tableBody.prepend(row);
        }
      }, 500);
    };

    document.getElementById('btn-open-deploy')?.addEventListener('click', window.openDeployDrawer);
    document.getElementById('btn-close-drawer')?.addEventListener('click', window.closeDeployDrawer);
    document.getElementById('btn-cancel-deploy')?.addEventListener('click', window.closeDeployDrawer);
  </script>
</body>
</html>`;
}

function renderServicePageContent(pathname: string, projectId: string): string {
  if (pathname.includes("run")) {
    return `
      <div class="page-title-row">
        <h1 class="page-title">Cloud Run Services</h1>
        <button class="btn-primary" role="button" aria-label="Create Service" data-test-id="cr-create-service-btn">Create Service</button>
      </div>
      <div class="card">
        <p style="color: var(--gcp-subtext); margin-bottom: 16px;">Deploy scalable containerized applications on fully managed serverless infrastructure.</p>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="text-align: left; border-bottom: 1px solid var(--gcp-border); font-size: 12px; color: var(--gcp-subtext);">
              <th style="padding: 8px;">Service Name</th>
              <th style="padding: 8px;">Region</th>
              <th style="padding: 8px;">URL</th>
              <th style="padding: 8px;">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid var(--gcp-border); font-size: 13px;">
              <td style="padding: 12px; font-weight: 500;">api-gateway</td>
              <td style="padding: 12px;">us-central1</td>
              <td style="padding: 12px; color: var(--gcp-blue);">https://api-gateway-8f2a.run.app</td>
              <td style="padding: 12px;"><span class="status-badge ready">Ready</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }

  if (pathname.includes("bigquery")) {
    return `
      <div class="page-title-row">
        <h1 class="page-title">BigQuery Studio</h1>
        <button class="btn-primary" role="button" aria-label="Run Query" data-test-id="bq-run-query-btn">Run</button>
      </div>
      <div class="card">
        <div style="font-family: monospace; background: #202124; color: #ffffff; padding: 16px; border-radius: 4px; font-size: 13px; line-height: 1.5;">
          <span style="color: #8ab4f8;">SELECT</span> model_name, accuracy, latency_ms<br/>
          <span style="color: #8ab4f8;">FROM</span> \`${projectId}.ml_metrics.evaluation_results\`<br/>
          <span style="color: #8ab4f8;">ORDER BY</span> accuracy <span style="color: #8ab4f8;">DESC</span> <span style="color: #8ab4f8;">LIMIT</span> 10;
        </div>
      </div>
    `;
  }

  // Default: Vertex AI Model Garden & Endpoints
  return `
    <div class="page-title-row">
      <div>
        <h1 class="page-title">Vertex AI — Model Garden</h1>
        <p style="font-size: 13px; color: var(--gcp-subtext); margin-top: 4px;">Discover, customize, and deploy foundational generative models.</p>
      </div>
      <button id="btn-open-deploy" class="btn-primary" role="button" aria-label="Deploy Model" data-test-id="mg-deploy-btn">Deploy Model</button>
    </div>
    <div class="card">
      <h2 style="font-size: 16px; font-weight: 500; margin-bottom: 12px;">Deployed Model Endpoints</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="text-align: left; border-bottom: 1px solid var(--gcp-border); font-size: 12px; color: var(--gcp-subtext);">
            <th style="padding: 8px;">Endpoint Name</th>
            <th style="padding: 8px;">Region</th>
            <th style="padding: 8px;">Status</th>
          </tr>
        </thead>
        <tbody id="endpoints-table-body">
          <tr style="border-bottom: 1px solid var(--gcp-border); font-size: 13px;">
            <td style="padding: 12px; font-weight: 500;">text-embedding-gecko</td>
            <td style="padding: 12px;">us-central1</td>
            <td style="padding: 12px;"><span class="status-badge ready">Active</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

export function startMockServer(options: MockServerOptions = {}): Promise<RunningMockServer> {
  const host = options.host || "127.0.0.1";
  const preferredPort = options.port || 8089;
  const simulatePii = options.simulatePii || false;

  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      try {
        const parsedUrl = new URL(req.url || "/", `http://${host}:${preferredPort}`);
        const html = createMockConsoleHtml(parsedUrl.pathname, parsedUrl.searchParams, simulatePii);

        res.writeHead(200, {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-cache",
          "X-GCP-Pantheon-Mock": "v1.0"
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

// If run directly via CLI: tsx src/mock-server/server.ts
if (process.argv[1] && process.argv[1].endsWith("server.ts")) {
  const port = parseInt(process.env.PORT || "8089", 10);
  startMockServer({ port }).then(running => {
    console.log(`[Mock Console] Running at ${running.baseUrl}`);
    console.log(`[Mock Console] Try: ${running.baseUrl}/vertex-ai/models?project=trainex-sandbox-8f2a`);
  });
}
