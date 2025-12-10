# 紐西蘭南島旅行行程總覽

## Code

[github](https://github.com/cw9981/trip-planner-202602nz-.git)



## 行程資訊
- **旅行日期**：2026年2月7日 – 2026年3月2日（共24天）


## 行程規劃
- [行程總覽網站](https://cw9981.github.io/trip-planner-202602nz-/)


## 技術說明
本專案以 **Google Apps Script** 開發，部署為 Web 應用程式，提供簡易的 API 介面，供前端透過 URL 查詢或更新行程資料。

- **對應工作表（Sheet）**：`itinerary`  
- **主要欄位**：
  - `stage`：行程階段（例如第1天、第2天等）
  - `person`：參與者
  - `activity`：該階段的活動內容

相關程式碼如下：


```javascript
// Google Apps Script 代碼 - 部署為 Web 應用

// 設定 Google Sheets
const SPREADSHEET_ID = '自行填入'; 
const SHEET_NAME = 'itinerary';

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const path = e.parameter.path || '';

  if (path === 'data') {
    return getItineraryData();
  }

  if (path === 'update') {
    return updateOrAddActivity(e.parameter);
  }

  return ContentService.createTextOutput("可用路徑：?path=data 或 ?path=update")
                        .setMimeType(ContentService.MimeType.TEXT);
}

// 讀取所有資料（供前端顯示）
function getItineraryData() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();

  const headers = data[0];
  const result = [];
  for (let i = 1; i < data.length; i++) {
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = data[i][j] !== undefined ? data[i][j].toString() : '';
    }
    result.push(row);
  }

  return ContentService.createTextOutput(JSON.stringify(result))
                       .setMimeType(ContentService.MimeType.JSON);
}

// 更新或新增活動資料
function updateOrAddActivity(params) {
  const stage = params.stage;
  const person = params.person;
  const newActivity = params.activity;

  if (stage === undefined || person === undefined || newActivity === undefined) {
    return ContentService.createTextOutput(JSON.stringify({ error: "缺少參數: stage, person, activity" }))
                         .setMimeType(ContentService.MimeType.JSON);
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  const stageCol = headers.indexOf('stage');
  const personCol = headers.indexOf('person');
  const activityCol = headers.indexOf('activity');

  if (stageCol === -1 || personCol === -1 || activityCol === -1) {
    return ContentService.createTextOutput(JSON.stringify({ error: "欄位名稱錯誤，需包含 stage, person, activity" }))
                         .setMimeType(ContentService.MimeType.JSON);
  }

  // 嘗試尋找現有資料
  for (let i = 1; i < data.length; i++) {
    const rowStage = data[i][stageCol] !== undefined ? data[i][stageCol].toString() : '';
    const rowPerson = data[i][personCol] !== undefined ? data[i][personCol].toString() : '';

    if (rowStage === stage.toString() && rowPerson === person) {
      // 找到了 → 更新
      sheet.getRange(i + 1, activityCol + 1).setValue(newActivity);
      return ContentService.createTextOutput(JSON.stringify({ success: true, action: "updated", message: "已更新現有資料" }))
                           .setMimeType(ContentService.MimeType.JSON);
    }
  }

  // 找不到 → 新增一筆到最後一行
  const newRow = [];
  for (let j = 0; j < headers.length; j++) {
    if (j === stageCol) newRow.push(stage);
    else if (j === personCol) newRow.push(person);
    else if (j === activityCol) newRow.push(newActivity);
    else newRow.push(''); // 其他欄位留空
  }

  sheet.appendRow(newRow);
  return ContentService.createTextOutput(JSON.stringify({ success: true, action: "added", message: "已新增一筆資料" }))
                       .setMimeType(ContentService.MimeType.JSON);
}

```