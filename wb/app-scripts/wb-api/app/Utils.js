/**
 * Конвертируем дату в формат временной метки Unix
 * @param {string} inputDate - Дата в формате, который корректно обрабатывается конструктором Date
 * @returns {number} Количество миллисекунд с полуночи 1 января 1970 года, GMT+0
 */
function convertDateToUnixTimestamp(inputDate) {
  return Date.parse(inputDate);
}

/**
 * Конвертируем дату в формат временной метки Unix timestamp это количестов секунда
 * @param {Date} inputDate - Дата в формате, который корректно обрабатывается конструктором Date
 * @returns {number} Количество СЕКУНД с полуночи 1 января 1970 года, GMT+0
 */
function convertDateToUnixTimestampSec(inputDate) {
  return Math.floor(inputDate.getTime() / 1000);
}


/**
 * Конвертируем дату в формат dd.mm.yy
 * @param {number} timestamp 
 */
function toDateDD_MM_YYSheet(timestamp) {
  // Создаем объект Date из временной метки
  const date = new Date(timestamp);

  // Получаем день, месяц и год
  let day = date.getDate();
  let month = date.getMonth() + 1; // Месяцы начинаются с 0
  const year = date.getFullYear().toString().slice(-2); // Получаем последние две цифры года

  // Добавляем ведущие нули к дню и месяцу, если это необходимо
  day = day < 10 ? '0' + day : day;
  month = month < 10 ? '0' + month : month;

  // Формируем итоговую строку
  return `${day}.${month}.${year}`;
}

/**
 * Конвертируем дату в формат 23:10:00 23.04.24
 * @param {number} timestamp 
 * @param {number} issec - выводить ли секунды
 */
function toDateDD_MM_YY_HH_MM_SSSheet(timestamp, issec = false) {
  // Создаем объект Date из временной метки
  const date = new Date(timestamp);

  let hours = date.getHours();
  let minutes = date.getMinutes();
  let seconds = date.getSeconds();
  let day = date.getDate();
  let month = date.getMonth() + 1; // Месяцы начинаются с 0
  let year = date.getFullYear().toString().slice(2); // Получаем последние две цифры года

  // Добавляем ведущий ноль, если число меньше 10
  hours = hours < 10 ? '0' + hours : hours;
  minutes = minutes < 10 ? '0' + minutes : minutes;
  seconds = seconds < 10 ? '0' + seconds : seconds;
  day = day < 10 ? '0' + day : day;
  month = month < 10 ? '0' + month : month;

  return `${day}.${month}.${year} ${hours}:${minutes}${issec ? ':' + seconds : ''} `;
}

/**
 * Получить количество из sku ГО-Гермес11-53см-с1
 * @param {string} sku Артикул продовца
 */
function getContFromSetUtils(sku) {
  // Используем регулярное выражение для поиска последнего вхождения "с" с числом после него
  const match = sku.match(/-.+(\d+)$/);

  // Если соответствие найдено, возвращаем число, иначе null
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Получить воронка продаж по одному из предыдущих дней
 * @param {number} prevDay - Список skus по остаткам.
 * @returns {from,to} данные как линукс время
 */
function getDateFromTo(prevDay = 0) {
  const today = new Date();
  const previousDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - prevDay);

  const dateBegin = new Date(previousDate);
  dateBegin.setHours(0, 0, 0, 0); // Начало суток

  let dateEnd;

  // Если prevDay равен 0, используем текущие часы, минуты и секунды для dateEnd
  if (prevDay === 0) {
    dateEnd = new Date(); // Просто текущее время, без изменений
  } else {
    dateEnd = new Date(previousDate);
    dateEnd.setHours(23, 59, 59, 999); // Конец суток
  }
  // Since both dateBegin and dateEnd are now Date objects, we can pass them directly
  return { from: dateBegin, to: dateEnd }
}

