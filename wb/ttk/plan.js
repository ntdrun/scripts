class Plans {
  /**
   * Получить информацию из справочника товаров
   * @param {SpreadsheetApp.Spreadsheet} spreadsheet - Рабочая книга
   * @returns {Map} Планы по группе, ключ группа 
   */
  static Read(spreadsheet) {
    const { vals } = Utils.getDataSheet(spreadsheet, PlanSh.name, PlanSh.rangeRead)
    const map = new Map(vals.map(v => [v[PlanSh.idx.ГруппаТоваров - 1], v]))
    if (vals.length !== map.size) throw new Error(`В таблице ${PlanSh.name} есть повторяющаяся Группа товаров. Она должена быть уникальным`)

    return map
  }
}