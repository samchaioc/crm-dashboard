/**
 * OpenBI‑CRM Dashboard 用的 Google Apps Script
 *
 * 三个主要 Action：
 *   - stats    → 回传 KPI（总保单数、客户数、总保费、本月新增、ANP、AFYC、PaymentFrequency统计）
 *   - records  → 回传最近 20 笔保单记录（依 Timestamp 逆序）
 *   - doPost   → 添加新客户/保单到 CRM
 *
 * 前端必须在呼叫时带上正确的 API_KEY。
 * 部署为 Web App 时，**执行身份** → Me、**存取权限** → Anyone, even anonymous。
 */

// ---------- 1️⃣ 你的金钥（与前端保持一致） ----------
const API_KEY='***';

// ---------- 2️⃣ Google Sheet 设定 ----------
const SPREADSHEET_ID = '10kvqTwPIdmFBkejOZR6VxVOo0wxQhkrudm6pB_ZyjcE'; // CRM_customer_index
const POLICIES_SHEET_NAME = 'Policies';

/**
 * doGet 为入口函数，根据 ?action=xxx 转发到对应的处理函数。
 * 若 API key 错误或 action 不认识，会回传错误 JSON。
 */
function doGet(e) {
  // ---- 安全检查：必须提供正确的 API key ----
  const key = (e.parameter.key || '').trim();
  if (key !== API_KEY) {
    return jsonResponse({ success: false, error: 'Invalid API key' }, 401);
  }

  const action = (e.parameter.action || '').trim().toLowerCase();

  switch (action) {
    case 'stats':
      return getStats(e);
    case 'records':
      return getRecords(e);
    default:
      return jsonResponse({ success: false, error: 'Unknown action' }, 400);
  }
}

/**
 * doPost 为入口函数，处理添加客户/保单。
 * 数据会写入 CRM_customer_index 的 Policies 工作表。
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    // 验证 API Key
    const key = (data.key || '').trim();
    if (key !== API_KEY) {
      return jsonResponse({ success: false, error: 'Invalid API key' }, 401);
    }

    // 检查保单是否已存在
    if (isPolicyExists(data.clientName, data.policyNumber)) {
      return jsonResponse({ 
        success: false, 
        error: '同样的保单已经加入系统。' 
      });
    }

    // 保存到 CRM_customer_index
    savePolicyToCRM(data);

    return jsonResponse({
      success: true,
      message: 'Policy saved successfully'
    });

  } catch (error) {
    return jsonResponse({
      success: false,
      error: error.toString()
    });
  }
}

/* -------------------------------------------------
 * 检查保单是否已存在
 * ------------------------------------------------- */
function isPolicyExists(clientName, policyNumber) {
  if (!clientName || !policyNumber) return false;
  
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(POLICIES_SHEET_NAME);
  
  if (!sheet) return false;
  
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  const header = values[0];
  
  const idxClientName = header.indexOf('ClientName');
  const idxPolicyNumber = header.indexOf('PolicyNumber');
  
  // 从第2行开始检查（跳过表头）
  for (let i = 1; i < values.length; i++) {
    const existingClientName = values[i][idxClientName];
    const existingPolicyNumber = values[i][idxPolicyNumber];
    
    // 如果客户名称和保单号都匹配
    if (existingClientName === clientName && existingPolicyNumber === policyNumber) {
      return true;
    }
  }
  
  return false;
}

/* -------------------------------------------------
 * 保存保单到 CRM_customer_index
 * ------------------------------------------------- */
function savePolicyToCRM(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(POLICIES_SHEET_NAME);
  
  if (!sheet) {
    throw new Error('Policies sheet not found in CRM_customer_index');
  }
  
  const rowData = [
    new Date().toISOString(),           // Timestamp
    data.clientName || '',              // ClientName
    data.clientIC || data.ic_number || '',  // ICNumber
    data.gender || '',                  // Gender
    data.race || '',                    // Race
    data.marriageStatus || '',          // Marriage Status
    data.noOfChild || '',               // No of Child
    data.income || '',                  // Income
    data.policyNumber || '',            // PolicyNumber
    data.insuranceCompany || '',        // InsuranceCompany
    data.policyType || '',              // PolicyType
    data.commencementDate || '',        // CommencementDate (有效日期)
    data.paymentMode || '',             // PaymentMode
    data.paymentTerm || '',             // PaymentTerm
    data.paymentFrequency || '',        // PaymentFrequency
    data.monthlyPremium || '',          // MonthlyPremium
    data.annualPremium || '',           // AnnualPremium
    data.status || 'Submitted',         // Status (default: Submitted)
    data.customerType || 'Potential Customer', // CustomerType
    data.deathTPD || '',                // DeathTPD
    data.advanceCritical || '',         // AdvanceCI
    data.advanceMultiCritical || '',    // AdvanceMultiCI
    data.earlyCritical || '',           // EarlyCI
    data.beyondCritical || '',          // BeyondCritical
    data.beyondEarlyCritical || '',     // BeyondEarlyCritical
    data.juniorCritical || '',          // JuniorCritical
    data.criticalAssured || '',         // CriticalAssured
    data.roomBoard || '',               // RoomBoard
    data.annualLimit || '',             // AnnualLimit
    data.lifetimeLimit || '',           // LifetimeLimit
    data.coInsurance || '',             // CoInsurance
    data.inpatientDays || '',           // InpatientDays
    data.prePostHospitalisation || '',  // PrePostHospitalisation
    data.nonClaimBonus || '',           // NonClaimBonus
    data.waiverAdult || '',             // WaiverAdult
    data.payorChild || '',              // PayorChild
    data.hospitalIncome || '',          // HospitalIncome
    data.purpose || '',                 // Purpose
    data.cashValue || '',               // CashValue
    data.nominee || '',                 // Nominee
    data.vitalityCover || '',           // VitalityCover
    data.sustainabilityAge || '',       // SustainabilityAge
    data.otherBenefits || ''            // OtherBenefits
  ];
  sheet.appendRow(rowData);
}

/* -------------------------------------------------
 * 1️⃣ stats – 产生 KPI（已更新：含 YTD/MTD ANP 和 AFYC + PaymentFrequency统计）
 * ------------------------------------------------- */
function getStats(e) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(POLICIES_SHEET_NAME);
  if (!sheet) return jsonResponse({ success: false, error: 'Sheet not found' });

  const data = sheet.getDataRange().getValues();
  const header = data[0];
  const rows = data.slice(1);

  const idxTimestamp = header.indexOf('Timestamp');
  const idxClientName = header.indexOf('ClientName');
  const idxMonthlyPremium = header.indexOf('MonthlyPremium');
  const idxAnnualPremium = header.indexOf('AnnualPremium');
  const idxPaymentFrequency = header.indexOf('PaymentFrequency');
  const idxPolicyType = header.indexOf('PolicyType');
  const idxPaymentTerm = header.indexOf('PaymentTerm');
  const idxCustomerType = header.indexOf('CustomerType');
  const idxCommencementDate = header.indexOf('CommencementDate');

  let totalPolicies = 0;
  const clientSet = new Set();
  let totalPremium = 0;
  let newThisMonth = 0;
  
  // YTD (Year to Date) - 从1月1日至今
  let ytdANP = 0;
  let ytdAFYC = 0;
  
  // MTD (Month to Date) - 本月
  let mtdANP = 0;
  let mtdAFYC = 0;

  // Payment Frequency 统计
  let monthlyCount = 0;
  let yearlyCount = 0;
  let quarterlyCount = 0;
  let halfYearlyCount = 0;

  const now = new Date();
  const thisYear = now.getFullYear();
  const thisMonth = now.getMonth() + 1;
  const ytdStart = new Date(thisYear, 0, 1); // Jan 1 of this year

  rows.forEach(row => {
    const ts = row[idxTimestamp];
    const commDate = row[idxCommencementDate];
    if (!ts) return;

    // 使用 commencementDate (保单生效日期) 来计算 YTD 和 MTD
    const dateObj = commDate ? new Date(commDate) : new Date(ts);
    if (isNaN(dateObj.getTime())) return; // Invalid date
    
    const recordYear = dateObj.getFullYear();
    const recordMonth = dateObj.getMonth() + 1;
    
    // 只计算 New Customer 或 Existing Customer，不包括 Potential Customer
    const customerType = (row[idxCustomerType] || '').toLowerCase();
    const isCountedCustomer = customerType === 'new customer' || customerType === 'existing customer';
    
    // 如果不是有效客户，跳过 AFYC/ANP 计算但仍计入总保单数
    if (!isCountedCustomer && customerType !== '') {
      // Potential Customer - 仍计入总数但不计入 ANP/AFYC
      totalPolicies++;
      const client = row[idxClientName];
      if (client) clientSet.add(client);
      
      // newThisMonth 也用 commencementDate
      if (recordYear === thisYear && recordMonth === thisMonth) {
        newThisMonth++;
      }
      return;
    }

    totalPolicies++;
    const client = row[idxClientName];
    if (client) clientSet.add(client);

    const paymentFreq = (row[idxPaymentFrequency] || '').toLowerCase();
    
    // 统计 Payment Frequency
    if (paymentFreq === 'monthly' || paymentFreq === '月繳') {
      monthlyCount++;
    } else if (paymentFreq === 'yearly' || paymentFreq === '年繳') {
      yearlyCount++;
    } else if (paymentFreq === 'quarterly' || paymentFreq === '季繳') {
      quarterlyCount++;
    } else if (paymentFreq === 'half yearly' || paymentFreq === '半年繳') {
      halfYearlyCount++;
    }
    
    let monthlyPremium = 0;
    let annualPremium = 0;
    
    if (paymentFreq === 'monthly' || paymentFreq === '月繳') {
      monthlyPremium = Number(row[idxMonthlyPremium]) || 0;
      annualPremium = monthlyPremium * 12;
    } else {
      annualPremium = Number(row[idxAnnualPremium]) || 0;
      monthlyPremium = annualPremium / 12;
    }
    
    totalPremium += annualPremium;

    // 计算 AFYC
    const policyType = row[idxPolicyType] || '';
    const paymentTerm = String(row[idxPaymentTerm] || '');
    let afycPercent = 0;
    
    if (policyType === 'ILP') {
      if (paymentTerm === '5') afycPercent = 25 / 2 / 2;
      else if (paymentTerm === '10') afycPercent = 25 / 2;
      else if (paymentTerm === '20') afycPercent = 25;
      else afycPercent = 12.5;
    } else if (policyType === 'Traditional') {
      afycPercent = 40;
    } else if (policyType === 'PA') {
      afycPercent = 20;
    }
    
    const afyc = annualPremium * (afycPercent / 100);

    // YTD: 从1月1日到现在
    if (dateObj >= ytdStart) {
      ytdANP += annualPremium;
      ytdAFYC += afyc;
    }

    // MTD: 本月
    if (recordYear === thisYear && recordMonth === thisMonth) {
      mtdANP += annualPremium;
      mtdAFYC += afyc;
      newThisMonth++;
    }
  });

  return jsonResponse({ 
    success: true, 
    totalPolicies: totalPolicies, 
    totalClients: clientSet.size, 
    totalPremium: totalPremium,
    ytdANP: ytdANP,
    mtdANP: mtdANP,
    ytdAFYC: ytdAFYC,
    mtdAFYC: mtdAFYC,
    newThisMonth: newThisMonth,
    monthlyCount: monthlyCount,
    yearlyCount: yearlyCount,
    quarterlyCount: quarterlyCount,
    halfYearlyCount: halfYearlyCount
  });
}

/* -------------------------------------------------
 * 2️⃣ records – 最近 20 笔保单记录 (逆序)
 * ------------------------------------------------- */
function getRecords(e) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(POLICIES_SHEET_NAME);
  if (!sheet) {
    return jsonResponse({ success: false, error: 'Sheet not found' }, 500);
  }

  const data = sheet.getDataRange().getValues();
  const header = data[0];
  const rows = data.slice(1);

  const idxTimestamp = header.indexOf('Timestamp');
  const idxClientName = header.indexOf('ClientName');
  const idxICNumber = header.indexOf('ICNumber');
  const idxPolicyNo = header.indexOf('PolicyNumber');
  const idxCommencementDate = header.indexOf('CommencementDate');
  const idxPaymentFrequency = header.indexOf('PaymentFrequency');
  const idxMonthlyPremium = header.indexOf('MonthlyPremium');
  const idxAnnualPremium = header.indexOf('AnnualPremium');
  const idxStatus = header.indexOf('Status');
  const idxGender = header.indexOf('Gender');
  const idxRace = header.indexOf('Race');
  const idxMarriageStatus = header.indexOf('MarriageStatus');
  const idxNoOfChild = header.indexOf('NoOfChild');
  const idxIncome = header.indexOf('Income');
  const idxPolicyType = header.indexOf('PolicyType');
  const idxPaymentTerm = header.indexOf('PaymentTerm');
  const idxCustomerType = header.indexOf('CustomerType');

  const records = rows
    .filter(row => row[idxTimestamp])
    .map(row => {
      let premium = 0;
      const paymentFreq = (row[idxPaymentFrequency] || '').toLowerCase();
      if (paymentFreq === 'monthly' || paymentFreq === '月繳') {
        premium = Number(row[idxMonthlyPremium]) || 0;
      } else {
        premium = Number(row[idxAnnualPremium]) || 0;
      }
      
      return {
        timestamp: row[idxTimestamp] instanceof Date
          ? row[idxTimestamp].toISOString()
          : row[idxTimestamp],
        commencementDate: row[idxCommencementDate] || '',
        clientName: row[idxClientName] || '',
        icNumber: row[idxICNumber] || '',
        gender: row[idxGender] || '',
        race: row[idxRace] || '',
        marriageStatus: row[idxMarriageStatus] || '',
        noOfChild: row[idxNoOfChild] || '',
        income: row[idxIncome] || '',
        policyNumber: row[idxPolicyNo] || '',
        policyType: row[idxPolicyType] || '',
        paymentTerm: row[idxPaymentTerm] || '',
        paymentFrequency: row[idxPaymentFrequency] || '',
        status: row[idxStatus] || '',
        premium: premium,
        customerType: row[idxCustomerType] || ''
      };
    })
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 20);

  return jsonResponse({
    success: true,
    records: records
  });
}

/* -------------------------------------------------
 * Helper – 统一回传 JSON + 正确 HTTP header
 * ------------------------------------------------- */
function jsonResponse(obj, code) {
  const txt = JSON.stringify(obj);
  const out = ContentService.createTextOutput(txt)
    .setMimeType(ContentService.MimeType.JSON);
  return out;
}