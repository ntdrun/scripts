function testTTK() {
  const sh = "https://docs.google.com/spreadsheets/d/1RGoH_VERn-_xV-Lqtm3m0ebE5sC2A-pLIdOmEQiY3Ro/edit"

  const spreadsheet = SpreadsheetApp.openByUrl(sh)
  const sheet = spreadsheet.getSheetByName("TTK-test")
  const plans = Plans.Read(spreadsheet)

  const l = TTK.calcTraficPlan(spreadsheet, plans, 1000)

}


class TTK {
  /**
 * Получить информацию за последнии N дней
 * @param {SpreadsheetApp.Spreadsheet} spreadsheet - Рабочая книга
 * @param {number} countPrevDays - Количество дней от вчерашней даты. 1 это будет за вчера, 2 за вчера и позовчера...
 * @param {number} fromPrevDays - От каких пред дней вести осчет
*/
  static getRowsFromDate(spreadsheet, fromPrevDays, countPrevDays) {
    const dayDate = 24 * 60 * 60 * 1000
    const endDate = new Date(new Date().setHours(0, 0, 0, 0) - (fromPrevDays+1) * dayDate); // Установка времени на 00:00:00:000
    const startDate = new Date(endDate.getTime() - (countPrevDays - 1) * dayDate);

    const maxCol = Math.max(...Object.values(TTKSh.idx))
    const res = SheetUtils.queryAndGroupByDate(spreadsheet.getSheetByName(TTKSh.name), TTKSh.idx.Дата - 1, startDate, endDate, 1, maxCol, TTKSh.headerLen)

    return res
  }


  /**
 * Получить плановый трафик
 * @param {SpreadsheetApp.Spreadsheet} spreadsheet - Рабочая книга
 * @param {Map} plans - Результат Plans.Read
 * @param {number} fromPrevDays - От каких пред дней вести осчет
*/
  static calcTraficPlan(spreadsheet, plans, fromPrevDays, days = 31) {
    const rowsByDateGroup = TTK.getRowsFromDate(spreadsheet, fromPrevDays, days)

    const mapGroup = new Map()

    rowsByDateGroup.forEach((val, key) => {
      val.forEach(arr => {
        const g = arr[TTKSh.idx.ГруппаТоваров - 1]

        let v = mapGroup.get(g)
        if (!v) {
          v = { перех: 0, выруч: 0, заказ: 0, заказШт: 0 }
          mapGroup.set(g, v)
        }
        v.перех += arr[TTKSh.idx.Переходов - 1] || 0
        v.выруч += arr[TTKSh.idx.Выручка - 1] || 0
        v.заказ += arr[TTKSh.idx.Заказов - 1] || 0
        v.заказШт += arr[TTKSh.idx.ЗаказовШт - 1] || 0
      })
    })

    const res = new Map()
    mapGroup.forEach((val, key) => {
      const vg = plans.get(key)
      if (!vg) return
      const plan = vg[PlanSh.idx.ПланВыручПродаж - 1]
      const vv = (val.перех) ? val.выруч / val.перех : 0
      let planTraf = (vv) ? plan / vv : 0
      if ((val.перех < 300) || (val.заказ < 10)) planTraf = 0
      res.set(key, Math.round(planTraf))
    })
    return res
  }

}
