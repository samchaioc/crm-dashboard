// Cloudflare Worker - CRM Dashboard
// 靜態文件 + Google Apps Script API 代理

addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  // API 路由: /api/gas - 代理 GAS GET 請求
  if (path === '/api/gas') {
    return handleGasProxy(url);
  }
  
  // API 路由: /api/add-customer - 提交新客戶
  if (path === '/api/add-customer' && request.method === 'POST') {
    return handleAddCustomer(request);
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

// 處理添加客戶請求
async function handleAddCustomer(request) {
  const gasUrl = 'https://script.google.com/macros/s/AKfycbzhwuCJh1giGUcL9v9Y_JKuaYMX5v2uzkrD1iV7kvQJ9hdkdZacElz5HAnBKcoYmWfxKg/exec';
  
  try {
    const formData = await request.json();
    
    // 構建 GAS 需要的數據格式
    const data = {
      clientName: formData.clientName,
      clientIC: formData.clientIC,
      ic_number: formData.clientIC,
      gender: formData.gender || '',
      race: formData.race || '',
      marriageStatus: formData.marriageStatus || '',
      noOfChild: formData.noOfChild || '',
      income: formData.income || '',
      insuranceCompany: formData.insuranceCompany || '',
      policyNumber: formData.policyNumber || '',
      policyType: formData.policyType || '',
      commencementDate: formData.commencementDate || '',
      paymentTerm: formData.paymentTerm || '',
      monthlyPremium: formData.monthlyPremium || '',
      annualPremium: formData.annualPremium || '',
      paymentMode: formData.paymentMode || '',
      paymentFrequency: formData.paymentFrequency || '',
      status: formData.status || 'Submitted',
      customerType: formData.customerType || 'Potential Customer',
      deathTPD: formData.deathTPD || '',
      advanceCritical: formData.advanceCritical || '',
      advanceMultiCritical: formData.advanceMultiCritical || '',
      earlyCritical: formData.earlyCritical || '',
      beyondCritical: formData.beyondCritical || '',
      beyondEarlyCritical: formData.beyondEarlyCritical || '',
      juniorCritical: formData.juniorCritical || '',
      criticalAssured: formData.criticalAssured || '',
      roomBoard: formData.roomBoard || '',
      annualLimit: formData.annualLimit || '',
      lifetimeLimit: formData.lifetimeLimit || '',
      coInsurance: formData.coInsurance || '',
      inpatientDays: formData.inpatientDays || '',
      prePostHospitalisation: formData.prePostHospitalisation || '',
      nonClaimBonus: formData.nonClaimBonus || '',
      waiverAdult: formData.waiverAdult || '',
      payorChild: formData.payorChild || '',
      hospitalIncome: formData.hospitalIncome || '',
      purpose: formData.purpose || '',
      cashValue: formData.cashValue || '',
      nominee: formData.nominee || '',
      vitalityCover: formData.vitalityCover || '',
      sustainabilityAge: formData.sustainabilityAge || '',
      otherBenefits: formData.otherBenefits || ''
    };
    
    const response = await fetch(gasUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; CRM/1.0)'
      },
      body: JSON.stringify(data)
    });
    
    const result = await response.text();
    
    return new Response(result, {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

// 提供靜態文件
async function serveStatic(path) {
  if (path === '/' || path === '/index.html') {
    return new Response(INDEX_HTML, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
  
  // 添加客户页面
  if (path === '/add-customer') {
    return new Response(ADD_CUSTOMER_HTML, {
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
    .sidebar-item {display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 8px; cursor: pointer; transition: all 0.2s; margin-bottom: 4px; font-size: 14px; text-decoration: none; color: white;}
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
        <a href="/" class="sidebar-item" id="nav-records">
          <span>📋</span>
          <span>保單記錄</span>
        </a>
        <a href="/add-customer" class="sidebar-item" id="nav-add">
          <span>➕</span>
          <span>添加客戶</span>
        </a>
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
        <div class="kpi-card">
          <div class="kpi-header"><div class="kpi-title">ANP (年化保费)</div></div>
          <div class="kpi-value" id="crm-anp">-</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-header"><div class="kpi-title">AFYC (第一年佣金)</div></div>
          <div class="kpi-value" id="crm-afyc">-</div>
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
      CRM_GAS_URL: 'https://script.google.com/macros/s/AKfycbzhwuCJh1giGUcL9v9Y_JKuaYMX5v2uzkrD1iV7kvQJ9hdkdZacElz5HAnBKcoYmWfxKg/exec',
      API_KEY: 'a8K3mP9vQ2wR5tY7'
    };

    function formatNumber(num) {
      if (!num || isNaN(num)) return '0';
      return num.toLocaleString('en-MY');
    }

    function calculateAFYC(policyType, paymentTerm, premium) {
      if (!policyType || !premium || premium === 0) return '-';
      
      const annualPremium = Number(premium);
      let afycPercent = 0;
      
      if (policyType === 'ILP') {
        // Investment linked product
        if (paymentTerm === '5') {
          afycPercent = 25 / 2 / 2; // 6.25%
        } else if (paymentTerm === '10') {
          afycPercent = 25 / 2; // 12.5%
        } else if (paymentTerm === '20') {
          afycPercent = 25; // 25%
        } else {
          // 如果是其他年期，默认给 12.5%
          afycPercent = 12.5;
        }
      } else if (policyType === 'Traditional') {
        afycPercent = 40;
      } else if (policyType === 'PA') {
        afycPercent = 20;
      } else {
        return '-';
      }
      
      const afyc = annualPremium * (afycPercent / 100);
      return 'RM ' + formatNumber(afyc.toFixed(2));
    }

    function formatDate(dateStr) {
      if (!dateStr) return '';
      // 如果包含时间，只取日期部分
      if (dateStr.includes('T')) {
        return dateStr.split('T')[0];
      }
      return dateStr;
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
          document.getElementById('crm-anp').innerHTML = 'RM ' + formatNumber(Math.round(stats.totalANP || 0));
          document.getElementById('crm-afyc').innerHTML = 'RM ' + formatNumber(Math.round(stats.totalAFYC || 0));
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
          ['有效日期', '客戶', '保單號', '產品類型', '繳費年期', '繳費頻率', '狀態', '保費', 'AFYC'].forEach(txt => {
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
              formatDate(rec.commencementDate) || '',
              rec.clientName || '',
              rec.policyNumber || '',
              rec.policyType || '',
              rec.paymentTerm ? rec.paymentTerm + ' 年' : '',
              rec.paymentFrequency || '',
              rec.status || '',
              rec.premium ? 'RM ' + formatNumber(rec.premium) : '',
              calculateAFYC(rec.policyType, rec.paymentTerm, rec.premium)
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
      
      // 根據當前路徑設置導航active狀態
      const path = window.location.pathname;
      if (path === '/add-customer') {
        document.getElementById('nav-add').classList.add('active');
        document.getElementById('nav-records').classList.remove('active');
      } else {
        document.getElementById('nav-records').classList.add('active');
        document.getElementById('nav-add').classList.remove('active');
      }
    });
  </script>
</body>
</html>`;

// 添加客户页面 HTML
const ADD_CUSTOMER_HTML = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>添加客戶 - CRM</title>
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
    .sidebar-item {display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 8px; cursor: pointer; transition: all 0.2s; margin-bottom: 4px; font-size: 14px; text-decoration: none; color: white;}
    .sidebar-item:hover {background: rgba(255,255,255,0.05);}
    .sidebar-item.active {background: var(--sidebar-active);}
    .main-content {flex: 1; margin-left: 260px; padding: 24px; max-width: 900px;}
    .header {display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;}
    .header-title {font-size: 24px; font-weight: 600;}
    .card {background: var(--card-bg); border-radius: 12px; padding: 24px; border: 1px solid var(--border-color); margin-bottom: 16px;}
    .card-title {font-size: 18px; font-weight: 600; margin-bottom: 20px; border-bottom: 1px solid var(--border-color); padding-bottom: 12px;}
    .form-grid {display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;}
    .form-group {margin-bottom: 16px;}
    .form-group.full-width {grid-column: span 2;}
    .form-label {display: block; font-size: 14px; font-weight: 500; margin-bottom: 6px; color: var(--text-primary);}
    .form-input, .form-select {width: 100%; padding: 10px 12px; border: 1px solid var(--border-color); border-radius: 8px; font-size: 14px; transition: border-color 0.2s;}
    .form-input:focus, .form-select:focus {outline: none; border-color: var(--sidebar-active);}
    .btn {display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; border: none; transition: all 0.2s;}
    .btn-primary {background: var(--sidebar-active); color: white;}
    .btn-primary:hover {background: #4f46e5;}
    .btn-primary:disabled {background: #9ca3af; cursor: not-allowed;}
    .btn-secondary {background: white; color: var(--text-primary); border: 1px solid var(--border-color);}
    .btn-secondary:hover {background: #f9fafb;}
    .form-actions {display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--border-color);}
    .alert {padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; display: none;}
    .alert-success {background: #d1fae5; color: #065f46; border: 1px solid #34d399;}
    .alert-error {background: #fee2e2; color: #991b1b; border: 1px solid #f87171;}
    .section-divider {grid-column: span 2; height: 1px; background: var(--border-color); margin: 8px 0 16px;}
    @media (max-width: 768px) {
      .sidebar {width: 100%; position: relative; height: auto;}
      .main-content {margin-left: 0; max-width: 100%;}
      .layout {flex-direction: column;}
      .form-grid {grid-template-columns: 1fr;}
      .form-group.full-width {grid-column: span 1;}
      .section-divider {grid-column: span 1;}
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
        <a href="/" class="sidebar-item" id="nav-records">
          <span>📋</span>
          <span>保單記錄</span>
        </a>
        <a href="/add-customer" class="sidebar-item active" id="nav-add">
          <span>➕</span>
          <span>添加客戶</span>
        </a>
      </div>
    </div>

    <main class="main-content">
      <div class="header">
        <h1 class="header-title">添加新客戶</h1>
      </div>

      <div id="alert-success" class="alert alert-success">
        ✅ 客戶添加成功！正在跳轉...
      </div>
      <div id="alert-error" class="alert alert-error"></div>

      <form id="customer-form">
        <!-- 基本資料 -->
        <div class="card">
          <div class="card-title">📝 基本資料</div>
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">客戶名稱 *</label>
              <input type="text" class="form-input" name="clientName" required placeholder="例如：陳大明">
            </div>
            <div class="form-group">
              <label class="form-label">IC 號碼 *</label>
              <input type="text" class="form-input" name="clientIC" required placeholder="例如：890123-14-5678">
            </div>
            <div class="form-group">
              <label class="form-label">性別 / Gender</label>
              <select class="form-select" name="gender">
                <option value="">請選擇...</option>
                <option value="Male">Male (男性)</option>
                <option value="Female">Female (女性)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">種族 / Race</label>
              <select class="form-select" name="race">
                <option value="">請選擇...</option>
                <option value="Malay">Malay (馬來人)</option>
                <option value="Chinese">Chinese (華人)</option>
                <option value="Indian">Indian (印度人)</option>
                <option value="Other">Other (其他)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">結婚狀況 / Marriage Status</label>
              <select class="form-select" name="marriageStatus">
                <option value="">請選擇...</option>
                <option value="Single">Single (單身)</option>
                <option value="Married">Married (已婚)</option>
                <option value="Divorced">Divorced (離異)</option>
                <option value="Widowed">Widowed (喪偶)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">孩子人數 / No of Child</label>
              <input type="number" class="form-input" name="noOfChild" min="0" placeholder="例如：2">
            </div>
            <div class="form-group">
              <label class="form-label">收入 / Income (RM)</label>
              <input type="number" step="0.01" class="form-input" name="income" placeholder="例如：5000.00">
            </div>
          </div>
        </div>

        <!-- 保單資料 -->
        <div class="card">
          <div class="card-title">📄 保單資料</div>
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">保險公司</label>
              <input type="text" class="form-input" name="insuranceCompany" placeholder="例如：AIA / Prudential">
            </div>
            <div class="form-group">
              <label class="form-label">保單號碼</label>
              <input type="text" class="form-input" name="policyNumber" placeholder="例如：POL123456">
            </div>
            <div class="form-group">
              <label class="form-label">保單類型 / Product Type</label>
              <select class="form-select" name="policyType">
                <option value="">請選擇...</option>
                <option value="ILP">ILP (投资连结)</option>
                <option value="Traditional">Traditional (传统保险)</option>
                <option value="PA">PA (意外险)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">保單生效日</label>
              <input type="date" class="form-input" name="commencementDate">
            </div>
            <div class="form-group">
              <label class="form-label">繳費年期 / Payment Term</label>
              <select class="form-select" name="paymentTerm">
                <option value="">請選擇...</option>
                <option value="5">5 年</option>
                <option value="10">10 年</option>
                <option value="20">20 年</option>
                <option value="other">其他</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 保費資料 -->
        <div class="card">
          <div class="card-title">💰 保費資料</div>
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">月繳保費 (RM)</label>
              <input type="number" step="0.01" class="form-input" name="monthlyPremium" placeholder="例如：500.00">
            </div>
            <div class="form-group">
              <label class="form-label">年繳保費 (RM)</label>
              <input type="number" step="0.01" class="form-input" name="annualPremium" placeholder="例如：6000.00">
            </div>
            <div class="form-group">
              <label class="form-label">繳費方式</label>
              <select class="form-select" name="paymentMode">
                <option value="">請選擇...</option>
                <option value="年繳">年繳</option>
                <option value="半年繳">半年繳</option>
                <option value="季繳">季繳</option>
                <option value="月繳">月繳</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">繳費頻率</label>
              <select class="form-select" name="paymentFrequency">
                <option value="">請選擇...</option>
                <option value="自動轉帳">自動轉帳</option>
                <option value="信用卡">信用卡</option>
                <option value="現金">現金</option>
                <option value=" cheque"> cheque</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 保障資料 -->
        <div class="card">
          <div class="card-title">🛡️ 保障資料</div>
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">壽險/完全殘廢 (Death/TPD)</label>
              <input type="text" class="form-input" name="deathTPD" placeholder="例如：RM 100,000">
            </div>
            <div class="form-group">
              <label class="form-label">45 種早期危疾</label>
              <input type="text" class="form-input" name="advanceCritical" placeholder="例如：RM 50,000">
            </div>
            <div class="form-group">
              <label class="form-label">多重早期危疾</label>
              <input type="text" class="form-input" name="advanceMultiCritical" placeholder="例如：RM 30,000">
            </div>
            <div class="form-group">
              <label class="form-label">早期危疾</label>
              <input type="text" class="form-input" name="earlyCritical" placeholder="例如：RM 50,000">
            </div>
            <div class="form-group">
              <label class="form-label">嚴重危疾</label>
              <input type="text" class="form-input" name="beyondCritical" placeholder="例如：RM 100,000">
            </div>
            <div class="form-group">
              <label class="form-label">多重嚴重危疾</label>
              <input type="text" class="form-input" name="beyondEarlyCritical" placeholder="例如：RM 100,000">
            </div>
            <div class="form-group">
              <label class="form-label">兒童危疾</label>
              <input type="text" class="form-input" name="juniorCritical" placeholder="例如：RM 50,000">
            </div>
            <div class="form-group">
              <label class="form-label">危疾保證</label>
              <input type="text" class="form-input" name="criticalAssured" placeholder="例如：RM 20,000">
            </div>
          </div>
        </div>

        <!-- 醫藥卡資料 -->
        <div class="card">
          <div class="card-title">🏥 醫藥卡資料</div>
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">病房級別</label>
              <input type="text" class="form-input" name="roomBoard" placeholder="例如：病房 1">
            </div>
            <div class="form-group">
              <label class="form-label">年度限額</label>
              <input type="text" class="form-input" name="annualLimit" placeholder="例如：RM 50,000">
            </div>
            <div class="form-group">
              <label class="form-label">終身限額</label>
              <input type="text" class="form-input" name="lifetimeLimit" placeholder="例如：RM 500,000">
            </div>
            <div class="form-group">
              <label class="form-label">共同保險</label>
              <input type="text" class="form-input" name="coInsurance" placeholder="例如：10%">
            </div>
            <div class="form-group">
              <label class="form-label">住院天數</label>
              <input type="text" class="form-input" name="inpatientDays" placeholder="例如：120 天/年">
            </div>
            <div class="form-group">
              <label class="form-label">入院前/後覆診</label>
              <input type="text" class="form-input" name="prePostHospitalisation" placeholder="例如：60 天 / 90 天">
            </div>
            <div class="form-group">
              <label class="form-label">無索償獎金</label>
              <input type="text" class="form-input" name="nonClaimBonus" placeholder="例如：10% increase">
            </div>
          </div>
        </div>

        <!-- 附加保障 -->
        <div class="card">
          <div class="card-title">➕ 附加保障</div>
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">投保人免費附加 (Waiver Adult)</label>
              <input type="text" class="form-input" name="waiverAdult" placeholder="是/否">
            </div>
            <div class="form-group">
              <label class="form-label">子女免費附加 (Payor Child)</label>
              <input type="text" class="form-input" name="payorChild" placeholder="是/否">
            </div>
            <div class="form-group">
              <label class="form-label">住院收入津貼</label>
              <input type="text" class="form-input" name="hospitalIncome" placeholder="例如：RM 100/天">
            </div>
            <div class="form-group">
              <label class="form-label">Vitality 保障</label>
              <input type="text" class="form-input" name="vitalityCover" placeholder="是/否">
            </div>
          </div>
        </div>

        <!-- 狀態與客戶類型 -->
        <div class="card">
          <div class="card-title">📊 狀態與客戶類型</div>
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">狀態 / 动态</label>
              <select class="form-select" name="status">
                <option value="Submitted">Submitted (已提交)</option>
                <option value="Reviewed Policy">Reviewed Policy (已审核保单)</option>
                <option value="Active">Active (生效中)</option>
                <option value="Lapsed">Lapsed (已失效)</option>
                <option value="Surrendered">Surrendered (已退保)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">客戶類型 / Customer Type</label>
              <select class="form-select" name="customerType">
                <option value="Potential Customer">Potential Customer (潜在客户)</option>
                <option value="New Customer">New Customer (新客户)</option>
                <option value="Existing Customer">Existing Customer (现有客户)</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 其他資料 -->
        <div class="card">
          <div class="card-title">📌 其他資料</div>
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">保單目的</label>
              <input type="text" class="form-input" name="purpose" placeholder="例如：儲蓄、退休、保障">
            </div>
            <div class="form-group">
              <label class="form-label">現金價值</label>
              <input type="text" class="form-input" name="cashValue" placeholder="例如：RM 10,000">
            </div>
            <div class="form-group">
              <label class="form-label">受益人</label>
              <input type="text" class="form-input" name="nominee" placeholder="例如：妻子 - 李小華">
            </div>
            <div class="form-group">
              <label class="form-label">可持續年齡</label>
              <input type="text" class="form-input" name="sustainabilityAge" placeholder="例如：75 歲">
            </div>
            <div class="form-group full-width">
              <label class="form-label">其他保障</label>
              <input type="text" class="form-input" name="otherBenefits" placeholder="其他補充說明">
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" onclick="location.href='/'">取消</button>
          <button type="submit" class="btn btn-primary" id="submit-btn">💾 儲存客戶</button>
        </div>
      </form>
    </main>
  </div>

  <script>
    document.getElementById('customer-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const submitBtn = document.getElementById('submit-btn');
      const alertSuccess = document.getElementById('alert-success');
      const alertError = document.getElementById('alert-error');
      
      // 收集表單數據
      const formData = new FormData(e.target);
      const data = Object.fromEntries(formData.entries());
      
      // 加入 API Key
      data.key = 'a8K3mP9vQ2wR5tY7';
      
      // 顯示載入狀態
      submitBtn.disabled = true;
      submitBtn.innerHTML = '⏳ 儲存中...';
      alertSuccess.style.display = 'none';
      alertError.style.display = 'none';
      
      try {
        const response = await fetch('/api/add-customer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
          alertSuccess.style.display = 'block';
          alertSuccess.innerHTML = '✅ ' + (result.message || '客戶添加成功！');
          
          // 2秒後跳轉回主頁
          setTimeout(() => {
            location.href = '/';
          }, 2000);
        } else {
          alertError.style.display = 'block';
          alertError.textContent = '❌ 錯誤：' + (result.error || '無法儲存客戶');
        }
      } catch (error) {
        alertError.style.display = 'block';
        alertError.textContent = '❌ 網絡錯誤，請稍後再試';
        console.error('Submit error:', error);
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '💾 儲存客戶';
      }
    });

    // 根據當前路徑設置導航active狀態
    const path = window.location.pathname;
    if (path === '/add-customer') {
      document.getElementById('nav-add').classList.add('active');
      document.getElementById('nav-records').classList.remove('active');
    }
  </script>
</body>
</html>`;