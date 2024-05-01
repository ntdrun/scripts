class Report {
  /**
   * @param {string} msg - Строка сообщения
   * @param {'start' | 'stop' | 'sys'} typeOfMsg - Тип сообщения
   * @param {number} idAd - Идентификатор рекламной компании
   * @param {number} detail - Уровень детализации от 1-3
  */
  static writeReport(detail, typeOfMsg, idAd, msg) {
    if (staticsSheet.detail < detail) return

    const data = [[
      Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd.MM.yy HH:mm"),
      typeOfMsg,
      idAd,
      msg
    ]]

    Utils.appendRow(Utils.Spreadsheet.getSheetByName(staticsSheet.name), data)
  }
}
