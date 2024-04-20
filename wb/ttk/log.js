const LogType = {
    Err: 'Ошибка',
    Success: 'Успех',
    Warn: 'Предупреждение',
  }

class Log {

  /**
   * Записать лог
   * @param {SpreadsheetApp.Spreadsheet} spreadsheet - Рабочая книга
   * @param {LogType} type - Тип события 
   * @param {string} msg - Сообщение
   */
  static write(spreadsheet, type, msg) {
    const sheet = spreadsheet.getSheetByName(LogSh.name)


    const maxCol = Math.max(...Object.values(LogSh.idx))
    const vals = new Array(maxCol)
    vals[LogSh.idx.Время - 1] = new Date()
    vals[LogSh.idx.ТипСобытия - 1] = type
    vals[LogSh.idx.Сообщение - 1] = msg


    const lRow = sheet.getLastRow()+1

    sheet.getRange(lRow, 1, 1, maxCol).setValues([vals])
  }
}