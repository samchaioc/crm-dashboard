# CRM Dashboard

客戶管理儀表板，部署於 Cloudflare Workers。

## 部署

```bash
# 安裝依賴
npm install

# 本地測試
npx wrangler dev

# 部署到 Cloudflare
npx wrangler deploy
```

## 配置

修改 `worker.js` 中的 `CONFIG.CRM_GAS_URL` 為你的 Google Apps Script Web App URL。

## 功能

- KPI 統計（總保單、客戶數、總保費、本月新增）
- 最近保單記錄表格
- 即時數據刷新