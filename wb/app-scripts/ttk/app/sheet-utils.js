function testSheetUtils() {
  const sh = "https://docs.google.com/spreadsheets/d/1RGoH_VERn-_xV-Lqtm3m0ebE5sC2A-pLIdOmEQiY3Ro/edit"

  const sheet = SpreadsheetApp.openByUrl(sh).getSheetByName("TTK-test")

  let read = SheetUtils.readRowsFromEnd(sheet, 3, 1, 10, 2, 1)
  let count = 0
  for (let result of read) count++
  if (count !== 1) throw new Error('Ошибка')

  count = 0
  read = SheetUtils.readRowsFromEnd(sheet, 2, 1, 10, 2, 1)
  let len = 0
  for (let result of read) {
    len += result.values.length
    count++
  }
  if ((count !== 1) && (len != 1)) throw new Error('Ошибка')

  count = 0
  len = 0
  read = SheetUtils.readRowsFromEnd(sheet, 1, 1, 10, 2, 1)
  for (let result of read) {
    len += result.values.length
    count++
  }
  if ((count !== 0) && (len != 0)) throw new Error('Ошибка')


  count = 0
  len = 0
  read = SheetUtils.readRowsFromEnd(sheet, 4, 1, 10, 2, 1)
  for (let result of read) {
    len += result.values.length
    count++
  }
  if ((count !== 2) && (len != 3)) throw new Error('Ошибка')
}

class SheetUtils {

  /**
* Получить порцию данных с конца
* @param {SpreadsheetApp.Sheet} sheet - лист
* @param {number} lastIndex - Конечный индекс с которого будут читаться данный от последнего к первому
* @param {number} startCol - С какого номера колонки считыываем данные из Range. Счет с 1
* @param {number} endCol - По какой номер колонки считываем данные из Range. Счет с 1
* @param {number} portion - Количество в порции данных
* @param {number} headerLen - длинна загаловка
*/
  static *readRowsFromEnd(sheet, lastIndex, startCol, endCol, portion, headerLen) {
    while (lastIndex > headerLen) {
      const fromRow = Math.max((lastIndex + 1) - portion, headerLen + 1); // Учитываем заголовок.
      const numRows = (lastIndex + 1) - fromRow; // Рассчитываем количество строк для чтения.
      const numCols = endCol - startCol + 1; // Вычисляем количество колонок для чтения.

      // Получаем данные из листа.
      const values = sheet.getRange(fromRow, startCol, numRows, numCols).getValues();

      // Передаём данные и информацию о том, нужно ли продолжать.
      yield {
        values: values,
      };

      // Устанавливаем индекс последней строки для следующей итерации.
      lastIndex = fromRow - 1;
    }
  }


  /**
     * Получить и сгруппировать данные за определенный период по датам.
     * @param {SpreadsheetApp.Sheet} sheet - лист
     * @param {number} indexOfDate - индекс где расположена дата в массиве
     * @param {Date} startDate - стартовая дата
     * @param {Date} endDate - конечная дата
     * @param {number} startCol - С какого номера колонки считыываем данные из Range. Счет с 1
     * @param {number} endCol - По какой номер колонки считываем данные из Range. Счет с 1
     * @param {number} headerLen - длинна загаловка
     * @param {Function} agregationFunc - Функция агрегации

     */
  static queryAndGroupByDate(sheet, indexOfDate, startDate, endDate, startCol, endCol, headerLen, agregationFunc = null) {
    const generator = SheetUtils.readRowsFromEnd(sheet, sheet.getLastRow(), startCol, endCol, 100, headerLen);
    let groupedData = new Map();

    // Итерация по данным, получаемым из генератора
    for (let { values } of generator) {
      for (let row of values) {
        if (!row[indexOfDate]) continue
        let dateInRow = new Date(row[indexOfDate].setHours(0, 0, 0, 0))
        let dateKey = dateInRow.getTime()

        if (dateInRow >= startDate && dateInRow <= endDate) {
          let arr = groupedData.get(dateKey)
          if (!arr) {
            if (agregationFunc) groupedData.set(dateKey, row)
            else groupedData.set(dateKey, [row])
          }
          else {
            if (agregationFunc) groupedData.set(dateKey, agregationFunc(arr, row))
            else arr.push(row)
          }
        } else if (dateInRow < startDate) {
          // Поскольку данные читаются с конца и идут назад по времени, прерываем цикл, если дата меньше начальной
          return groupedData;
        }
      }
    }

    return groupedData;
  }


  /**
     * Очистить строки с конца списка до даты.
     * @param {SpreadsheetApp.Sheet} sheet - лист
     * @param {number} indexOfDate - индекс где расположена дата в массиве
     * @param {Date} fromDate - До какой даты очищаем
     * @param {number} startCol - С какого номера колонки считыываем данные из Range. Счет с 1
     * @param {number} endCol - По какой номер колонки считываем данные из Range. Счет с 1
     * @param {number} headerLen - длинна загаловка
     */
  static clearFromDate(sheet, indexOfDate, fromDate, startCol, endCol, headerLen) {
    const date = fromDate.setDate(fromDate.getDate() - 1) // Отнимаем один день

    const lastIndex = sheet.getLastRow()
    let fromIndex = lastIndex
    let isbreak = false
    const rows = SheetUtils.readRowsFromEnd(sheet, lastIndex, startCol, endCol, 100, headerLen)
    for (let { values } of rows) {
      for (let i = values.length - 1; i >= 0; i--) {
        const row = values[i]
        const d = row[indexOfDate]
        if (!d) continue
        let dateInRow = d.setHours(0, 0, 0, 0)
        if (date < dateInRow) fromIndex--
        else if (date >= dateInRow) {
          isbreak = true
          break
        }
      }
      if (isbreak) break
    }

    if (fromIndex != lastIndex) {
      sheet.getRange(fromIndex + 1, 1, lastIndex - fromIndex, sheet.getLastColumn()).clearContent();
    }

  }


}