/**
 * @typedef {Object} DataSheet
 * @property {SpreadsheetApp.Sheet} sheet
 * @property {Object[][]} vals
 */



class Utils {

  /**
  * Посчитать количество дней между двумя датами
  * @param {Date} freshDate - Дата из которой будет вычитаться
  * @param {Date} olderDate - Диапазон листа
  * @returns {number} Количество дней
  */
  static diffDays(freshDate, olderDate) {
    const differenceInMilliseconds = freshDate.getTime() - olderDate.getTime()
    let differenceInDays = Math.round(differenceInMilliseconds / (1000 * 3600 * 24))
    return differenceInDays
  }

  /**
  * Посчитать количество часов между двумя датами
  * @param {Date} freshDate - Дата из которой будет вычитаться
  * @param {Date} olderDate - Диапазон листа
  * @returns {number} Количество дней
  */
  static diffHour(freshDate, olderDate) {
    const differenceInMilliseconds = freshDate.getTime() - olderDate.getTime()
    let differenceInHours = Math.round(differenceInMilliseconds / (1000 * 3600))
    return differenceInHours
  }

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


  /**
   * Проверяет правильность настроек Google Sheet листа
  * @param {SpreadsheetApp.Spreadsheet} spreadsheet - Рабочая книга
  */
  static throwCheckSetting(spreadsheet) {
    const loclZone = spreadsheet.getSpreadsheetTimeZone()

    if ((loclZone !== 'Europe/Minsk') && (loclZone !== 'Europe/Moscow'))
      throw new Error(`Необходимо задать временную зону в настройках книги на Москву или на Минск`)
  }
}
