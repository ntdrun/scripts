/**
 * @typedef {Object} AppProperty
 * @property {string} adTokWb
 * @property {string} analiticsTokWB
 * @property {string} qqTokWB
 * @property {string} version
 * @property {number} depthRead
 * @property {boolean} progIsOn - Программа работает
 */

class Properties {
  /**
   * @param {SpreadsheetApp.Spreadsheet} spreadsheet - Рабочая книга
   * @returns {AppProperty} Свойства приложения
   */
  static Read(spreadsheet) {
    const { vals } = Utils.getDataSheet(spreadsheet, AppSh.name, AppSh.rangeRead)
    const map = new Map(vals.map(v => [v[0], [v[1], v[2]]]))

    return {
      adTokWb: map.get(AppSh.key.adTokWb)[0],
      analiticsTokWB: map.get(AppSh.key.analiticsTokWB)[0],
      qqTokWB: map.has(AppSh.key.qqTokWB) ? map.get(AppSh.key.qqTokWB) : '',
      version: map.get(AppSh.key.version)[0],
      depthRead: map.get(AppSh.key.depthRead)[0],
      progIsOn: map.get(AppSh.key.progIsOn)[0],
    }
  }
}