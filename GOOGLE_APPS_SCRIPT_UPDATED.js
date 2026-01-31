// ========================================================
// ОНОВЛЕНИЙ КОД ДЛЯ GOOGLE APPS SCRIPT
// ========================================================
// Підтримує нові періоди та категорії
// ========================================================

// Функція для збереження фото (POST request)
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Аркуш1');
    var data = JSON.parse(e.postData.contents);
    
    if (data.action === 'addPhoto') {
      // Додаємо новий рядок з даними фото
      sheet.appendRow([
        data.imageUrl,
        data.title,
        data.period,      // before-1900, 1900-1939, 1939-1945, 1945-1991, after-1991
        data.category,    // churches, streets, people, architecture, aerial, drawings, events
        data.date || new Date().toLocaleDateString('uk-UA')
      ]);
      
      return ContentService
        .createTextOutput(JSON.stringify({status: 'success'}))
        .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({status: 'error', message: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Функція для завантаження фото (GET request)
function doGet(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Аркуш1');
    
    if (e.parameter.action === 'getPhotos') {
      var data = sheet.getDataRange().getValues();
      var photos = [];
      
      // Пропускаємо перший рядок (заголовки)
      for (var i = 1; i < data.length; i++) {
        if (data[i][0]) { // Якщо є URL фото
          photos.push({
            imageUrl: data[i][0],
            title: data[i][1],
            period: data[i][2],
            category: data[i][3],
            date: data[i][4]
          });
        }
      }
      
      return ContentService
        .createTextOutput(JSON.stringify({status: 'success', photos: photos}))
        .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({status: 'error', message: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ========================================================
// ІНСТРУКЦІЯ:
// ========================================================
// 1. Створіть Google Таблицю з такими заголовками (рядок 1):
//    A1: imageUrl
//    B1: title
//    C1: period
//    D1: category
//    E1: date
//
// 2. Розширення → Apps Script → Вставити цей код
//
// 3. Зберегти (Ctrl+S) → Назвати "Фотоархів API"
//
// 4. Розгорнути → Нове розгортання → Тип: Веб-додаток
//    - Опис: Фотоархів API v2
//    - Виконувати як: Я
//    - Доступ: УСІ (це важливо!)
//
// 5. Розгорнути → Скопіювати URL (закінчується на /exec)
//
// 6. Вставити URL у файлі script-optimized.js:
//    const GOOGLE_SCRIPT_URL = 'ваша_адреса_тут';
//
// ========================================================
// ПЕРІОДИ:
// ========================================================
// before-1900   - До 1900
// 1900-1939     - 1900—1939
// 1939-1945     - 1939—1945 (Друга світова)
// 1945-1991     - 1945—1991 (Радянський період)
// after-1991    - Після 1991 (Незалежна Україна)
//
// ========================================================
// КАТЕГОРІЇ:
// ========================================================
// churches      - Церкви та храми
// streets       - Вулиці міста
// people        - Люди та портрети
// architecture  - Архітектура
// aerial        - Аерофотознімки
// drawings      - Малюнки та гравюри
// events        - Історичні події
// ========================================================
