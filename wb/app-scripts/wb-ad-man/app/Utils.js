class Utils {
  static showAlert(title, msg) {
    var ui = SpreadsheetApp.getUi(); // Правильно: Получаем UI через SpreadsheetApp
    ui.alert(title, msg, ui.ButtonSet.OK);
  }

  static get Spreadsheet() {
    return SpreadsheetApp.getActiveSpreadsheet()
  }

  static get SetSheet() {
    const res = Utils.Spreadsheet.getSheetByName(setSheet.name)
    return res
  }
  static get AdCompaniesSheet() {
    const res = Utils.Spreadsheet.getSheetByName(adCompaniesSheet.name)
    return res
  }

  static get SchedSheet() {
    const res = Utils.Spreadsheet.getSheetByName(schedSheet.name)
    return res
  }


  /**
   * Включен ли режим автоматического опроса
   */
  static get IsAutoOn() {
    const res = Utils.SetSheet.getRange(setSheet.RangeModeOnOff).getValue()
    return res
  }

  /**
   * Включена ли работа программы
   */
  static get IsProgramOn() {
    const res = Utils.SetSheet.getRange(setSheet.RangeGlobalOff).getValue()
    return res
  }

  /**
  * @typedef {Object} Settings
  * @property {string} adTokWb
  * 
  * @returns {Settings} Описание товаров
  */
  static get Settings() {
    if (!Utils.settings) {
      const adTokWb = Utils.SetSheet.getRange(setSheet.AdTok).getValue()

      Utils.settings = {
        adTokWb
      }
    }

    return Utils.settings
  }

  /**
   * @param {object[][]} rows - массив строк
   * @param {SpreadsheetApp.Spreadsheet} spreadsheet
  */
  static appendRow(spreadsheet, data) {
    var lastRow = spreadsheet.getLastRow();
    if (lastRow > 0) lastRow += 1;

    const colsCount = data[0].length

    const range = spreadsheet.getRange(lastRow, 1, data.length, colsCount)

    range.setValues(data)
  }
}
