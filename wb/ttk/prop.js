/**
 * @typedef {Object} AppProperty
 * @property {string} adTokWb
 * @property {string} analiticsTokWB
 * @property {string} version
 * @property {number} depthRead
 */

class Properties {
  /**
   * @param {SpreadsheetApp.Spreadsheet} spreadsheet - Рабочая книга
   * @returns {AppProperty} Свойства приложения
   */
  static Read(spreadsheet) {
    const {vals} = Utils.getDataSheet(spreadsheet, AppSh.name, AppSh.rangeRead)
    const map = new Map(vals.map(v=> [v[0], [v[1], v[2]]]))

    return {
      adTokWb: map.get(AppSh.key.adTokWb)[0],
      analiticsTokWB: map.get(AppSh.key.analiticsTokWB)[0],
      version: map.get(AppSh.key.version)[0],
      depthRead: map.get(AppSh.key.depthRead)[0]
    }
  }
}