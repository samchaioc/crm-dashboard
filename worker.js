// Cloudflare Worker - CRM Dashboard
// 靜態文件 + Google Apps Script API 代理

addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  // API 路由: /api/gas - 代理 GAS 請求
  if (path === '/api/gas') {
    return handleGasProxy(url);
  }
  
  // 靜態文件
  return serveStatic(path);
}

// 處理 GAS API 請求（解決 CORS 問題）
async function handleGasProxy(url) {
  const gasUrl = url.searchParams.get('url');
  
  if (!gasUrl) {
    return new Response('Missing url parameter', { 
      status: 400,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
  
  try {
    const response = await fetch(gasUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CRM/1.0)'
      }
    });
    
    if (!response.ok) {
      return new Response(`GAS fetch failed: ${response.status}`, { 
        status: 500 
      });
    }
    
    const data = await response.text();
    
    return new Response(data, {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Cache-Control': 'no-cache'
      },
    });
    
  } catch (error) {
    return new Response('Error: ' + error.message, { status: 500 });
  }
}

// 提供靜態文件
async function serveStatic(path) {
  if (path === '/' || path === '/index.html') {
    return new Response(INDEX_HTML, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
  
  // Favicon - return empty
  if (path === '/favicon.ico') {
    return new Response('', { status: 204 });
  }
  
  return new Response('Not Found', { status: 404 });
}

// CRM Dashboard HTML
const INDEX_HTML = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CRM 客戶管理</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --sidebar-bg: #1a1f37;
      --sidebar-active: #6366f1;
      --main-bg: #f3f4f6;
      --card-bg: #ffffff;
      --text-primary: #111827;
      --text-secondary: #6b7280;
      --border-color: #e5e7eb;
      --success: #10b981;
      --danger: #ef4444;
    }
    body {font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: var(--main-bg); color: var(--text-primary); min-height: 100vh;}
    .layout {display: flex; min-height: 100vh;}
    .sidebar {width: 260px; background: var(--sidebar-bg); color: white; padding: 24px 16px; position: fixed; height: 100vh;}
    .sidebar-logo {display: flex; align-items: center; gap: 12px; padding: 0 12px 24px; border-bottom: 1px solid rgba(255,255,255,0.1); margin-bottom: 24px;}
    .sidebar-logo-icon {width: 40px; height: 40px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px;}
    .sidebar-logo-text {font-size: 18px; font-weight: 600;}
    .sidebar-section {margin-bottom: 24px;}
    .sidebar-section-title {font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.5; padding: 0 12px; margin-bottom: 8px;}
    .sidebar-item {display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 8px; cursor: pointer; transition: all 0.2s; margin-bottom: 4px; font-size: 14px;}
    .sidebar-item:hover {background: rgba(255,255,255,0.05);}
    .sidebar-item.active {background: var(--sidebar-active);}
    .main-content {flex: 1; margin-left: 260px; padding: 24px;}
    .header {display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;}
    .header-title {font-size: 24px; font-weight: 600;}
    .kpi-grid {display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px;}
    .kpi-card {background: var(--card-bg); border-radius: 12px; padding: 20px; border: 1px solid var(--border-color);}
    .kpi-header {display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;}
    .kpi-title {font-size: 14px; color: var(--text-secondary);}
    .kpi-value {font-size: 28px; font-weight: 700;}
    .kpi-unit {font-size: 14px; font-weight: 400; color: var(--text-secondary); margin-left: 4px;}
    .card {background: var(--card-bg); border-radius: 12px; padding: 20px; border: 1px solid var(--border-color); margin-bottom: 16px;}
    .card-header {display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;}
    .card-title {font-size: 16px; font-weight: 600;}
    .loading {display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px; color: var(--text-secondary);}
    .spinner {width: 40px; height: 40px; border: 3px solid var(--border-color); border-top-color: var(--sidebar-active); border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 12px;}
    @keyframes spin {to { transform: rotate(360deg); }}
    .error {color: var(--danger); text-align: center; padding: 20px;}
    .empty-state {text-align: center; padding: 40px; color: var(--text-secondary);}
    .empty-state-icon {font-size: 48px; margin-bottom: 16px;}
    table {width: 100%; border-collapse: collapse; margin-top: 12px;}
    th, td {border: 1px solid var(--border-color); padding: 10px; text-align: left;}
    th {background: #f9fafb; font-weight: 600;}
    tr:hover {background: #f9fafb;}
    @media (max-width: 1024px) {.kpi-grid {grid-template-columns: repeat(2, 1fr);}}
    @media (max-width: 768px) {
      .sidebar {width: 100%; position: relative; height: auto;}
      .main-content {margin-left: 0;}
      .layout {flex-direction: column;}
      .kpi-grid {grid-template-columns: 1fr;}
    }
  </style>
</head>
<body>
  <div class="layout">
    <div class="sidebar">
      <div class="sidebar-logo">
        <div class="sidebar-logo-icon">👥</div>
        <div class="sidebar-logo-text">CRM</div>
      </div>
      <div class="sidebar-section">
        <div class="sidebar-section-title">客戶管理</div>
        <div class="sidebar-item active">
          <span>📋</span>
          <span>保單記錄</span>
        </div>
      </div>
    </div>

    <main class="main-content">
      <div class="header">
        <h1 class="header-title">CRM 客戶管理</h1>
      </div>

      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-header"><div class="kpi-title">總保單數</div></div>
          <div class="kpi-value" id="crm-policies">-</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-header"><div class="kpi-title">客戶數量</div></div>
          <div class="kpi-value" id="crm-clients">-</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-header"><div class="kpi-title">總保費</div></div>
          <div class="kpi-value" id="crm-premium">-</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-header"><div class="kpi-title">本月新增</div></div>
          <div class="kpi-value" id="crm-new">-</div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title">最近保單記錄</div>
        </div>
        <div id="crm-table-container">
          <div class="loading">
            <div class="spinner"></div>
            <div>從 Google Sheets 加載數據...</div>
          </div>
        </div>
      </div>
    </main>
  </div>

  <script>
    const CONFIG = {
      // CRM GAS URL - 請替換成你的 GAS Web App URL
      CRM_GAS_URL: 'https://script.google.com/macros/s/AKfycbzoSGH19_O1Lcfp5OOmQhgHJWd6i6IT43k_TV7GuLA9at0XPLxA-bPYtlOGv4ukE5KN/exec',
      API_KEY: 'a8K3mP9vQ2wR5tY7'
    };

    function formatNumber(num) {
      if (!num || isNaN(num)) return '0';
      return num.toLocaleString('en-MY');
    }

    async function loadCRMData() {
      try {
        // 1️⃣ 抓統計資料
        const statsUrl = CONFIG.CRM_GAS_URL + '?action=stats&key=' + CONFIG.API_KEY;
        const statsResp = await fetch('/api/gas?url=' + encodeURIComponent(statsUrl));
        const stats = await statsResp.json();
        
        if (stats.success) {
          document.getElementById('crm-policies').innerHTML = formatNumber(stats.totalPolicies) + '<span class="kpi-unit"> 張</span>';
          document.getElementById('crm-clients').innerHTML = formatNumber(stats.totalClients) + '<span class="kpi-unit"> 人</span>';
          document.getElementById('crm-premium').innerHTML = 'RM ' + formatNumber(stats.totalPremium);
          document.getElementById('crm-new').innerHTML = formatNumber(stats.newThisMonth) + '<span class="kpi-unit"> 張</span>';
        }

        // 2️⃣ 抓最近保單記錄
        const recordsUrl = CONFIG.CRM_GAS_URL + '?action=records&key=' + CONFIG.API_KEY;
        const recResp = await fetch('/api/gas?url=' + encodeURIComponent(recordsUrl));
        const recData = await recResp.json();
        
        const container = document.getElementById('crm-table-container');
        
        if (recData.success && Array.isArray(recData.records) && recData.records.length) {
          // 建立表格
          const table = document.createElement('table');
          
          // 表頭
          const thead = document.createElement('thead');
          const headerRow = document.createElement('tr');
          ['日期', '客戶', '保單號', '保費'].forEach(txt => {
            const th = document.createElement('th');
            th.textContent = txt;
            headerRow.appendChild(th);
          });
          thead.appendChild(headerRow);
          table.appendChild(thead);
          
          // 表身
          const tbody = document.createElement('tbody');
          recData.records.forEach(rec => {
            const tr = document.createElement('tr');
            const cells = [
              rec.timestamp ? rec.timestamp.slice(0, 10) : '',
              rec.clientName || '',
              rec.policyNumber || '',
              rec.premium ? 'RM ' + formatNumber(rec.premium) : ''
            ];
            cells.forEach(txt => {
              const td = document.createElement('td');
              td.textContent = txt;
              tr.appendChild(td);
            });
            tbody.appendChild(tr);
          });
          table.appendChild(tbody);
          
          container.innerHTML = '';
          container.appendChild(table);
        } else {
          container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📭</div>目前沒有最近保單記錄。</div>';
        }
      } catch (error) {
        console.error('CRM load error:', error);
        document.getElementById('crm-table-container').innerHTML =
          '<div class="error">載入失敗，請稍後再試。</div>';
      }
    }

    document.addEventListener('DOMContentLoaded', () => {
      loadCRMData();
    });
  </script>
</body>
</html>`;