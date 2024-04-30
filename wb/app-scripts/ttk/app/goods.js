/**
 * @typedef {Object} GoodsObj
 * @property {Map} mapBySKU
 * @property {Map} mapByGroup
 * @property {Function} getCatByGroupName
 */
class Goods {
  static waitNumber(spreadsheet, getValues) {
    const checks = (vals) => {
      for (let i = 0; i < vals.length; i++) {
        if (typeof vals[0] === 'string') {
          if (vals[0].indexOf('%') > 0) continue
          else return false
        }
        if (!Utils.isNumber(vals[i])) return false
      }
      return true
    }

    let attempts = 0;
    const attemptsCount = 5
    let values = getValues()

    while (!checks(values) && attempts < attemptsCount) {
      Utilities.sleep(5000);
      Log.write(spreadsheet, 1, 'Info', `Повтор ${attempts + 1} из ${attemptsCount}`)
      values = getValues();
      attempts++;
    }
  }
  /**
   * Получить информацию из справочника товаров
   * @param {SpreadsheetApp.Spreadsheet} spreadsheet - Рабочая книга
   * @returns {GoodsObj} Описание товаров
   */
  static Read(spreadsheet) {
    let res

    //Надо проверить используется ли тут формула и если будет % то надо выйти
    Goods.waitNumber(spreadsheet, () => {
      res = Utils.getDataSheet(spreadsheet, GoodsSh.name, GoodsSh.rangeRead)
      return [res.vals[0][GoodsSh.idx.РеклБюджПрод - 1], res.vals[0][GoodsSh.idx.Прибыль - 1]]
    })

    const vals = res.vals

    const mapBySKU = new Map(vals.map(v => [`${v[GoodsSh.idx.АртикулПрод - 1]}`.trim(), v]))
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
      mapByGroup,
      getCatByGroupName: (nameGroup) => {
        const vals = mapByGroup.get(nameGroup)
        if (!vals) return ""
        if (!vals.length) return ""
        return vals[0][GoodsSh.idx.Категория - 1]
      }
    }
  }
}