/**
 * @typedef {Object} GoodsObj
 * @property {Map} mapBySKU
  * @property {Map} mapByGroup
 */

class Goods {
  /**
   * Получить информацию из справочника товаров
   * @param {SpreadsheetApp.Spreadsheet} spreadsheet - Рабочая книга
   * @returns {GoodsObj} Описание товаров
   */
  static Read(spreadsheet) {
    const { vals } = Utils.getDataSheet(spreadsheet, GoodsSh.name, GoodsSh.rangeRead)
    const mapBySKU = new Map(vals.map(v => [v[GoodsSh.idx.АртикулПрод - 1], v]))
    if (vals.length !== mapBySKU.size) throw new Error(`В таблице ${GoodsSh.name} есть повторяющийся АртикулПрод. Он должен быть уникальным`)

    const mapByGroup = new Map()
    const gvals = vals.map(v => [v[GoodsSh.idx.Группа - 1], v])
    gvals.forEach(v => {
      let m = mapByGroup.get(v[0]) || []
      if (m.length === 0) {
        mapByGroup.set(v[0], m)
      }
      m.push(v[1])
    })

    return {
      mapBySKU,
      mapByGroup
    }
  }
}