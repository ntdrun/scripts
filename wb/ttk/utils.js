/**
 * @typedef {Object} DataSheet
 * @property {SpreadsheetApp.Sheet} sheet
 * @property {Object[][]} vals
 */



class Utils {
  /**
  * @param {SpreadsheetApp.Spreadsheet} spreadsheet - Рабочая книга
  * @param {string} name - Имя листа
  * @param {string} range - Диапазон листа
  * @param {bool} delFirstRow - Удалить первую колонку
  * @returns {DataSheet} Свойства приложения
  */
  static getDataSheet(spreadsheet, name, range, delFirstRow = true) {
    const sheet = spreadsheet.getSheetByName((name))
    const lRow = sheet.getLastRow()
    let values = sheet.getRange(range + lRow).getValues();
    if (delFirstRow) values.splice(0, 1); // Удалили 1 строку
    return { sheet, vals: values.filter(v => (v[0])) }
  }

  static getRandomInRange(min, max) {
    return min + Math.random() * (max - min);
  }

  //Расчитать количество переходов
  static calcClicks(clicksCalc, countInGroupWithStock) {
    //Рек. Перех+(Рек. Перех*(К-во артикулов в группе*0.4))
    const res = clicksCalc + (clicksCalc * (countInGroupWithStock) * Utils.getRandomInRange(0.35, 0.45))
    return Math.round(res)
  }

  static showError(errorMessage) {
    // Получаем пользовательский интерфейс активной таблицы
    var ui = SpreadsheetApp.getUi(); // Правильно: Получаем UI через SpreadsheetApp

    // Показываем диалоговое окно с сообщением об ошибке
    ui.alert('Произошла ошибка', errorMessage, ui.ButtonSet.OK);
  }


}
