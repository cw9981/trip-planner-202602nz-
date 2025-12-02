// js/i18n.js
let currentLang = 'zh'; // default
let translations = {};

// 檢測瀏覽器語言
function detectLanguage() {
  const userLang = navigator.language || navigator.userLanguage;
  return userLang.startsWith('zh') ? 'zh' : 'en';
}

// 載入語言包
async function loadTranslations() {
  try {
    const lang = detectLanguage();
    currentLang = lang;
    const res = await fetch('/data/language.json');
    const all = await res.json();
    translations = all[lang] || all.en;
    document.documentElement.lang = lang;
  } catch (e) {
    console.error('Failed to load language.json', e);
    translations = {
      title: 'Trip Planner',
      flightInfo: 'Flight Info',
      itinerary: 'Itinerary',
      accommodation: 'Accommodation',
      task: 'Tasks',
      headerPrefix: '✈️ Travel Dates: ',
      participantsLabel: '👥 Participants: '
    };
  }
}

// 獲取翻譯
function t(key) {
  return translations[key] || key;
}

// 切換語言（可選功能）
function switchLanguage(lang) {
  currentLang = lang;
  loadTranslations().then(updateAllTexts);
}

// 匯出
window.i18n = { t, loadTranslations, switchLanguage, currentLang };