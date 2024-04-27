


/**
 * Получить воронка продаж по одному из предыдущих дней
 * @param {string} analiticsTok - Ключ API (Аналитика)
 * @param {number} prevDay - Список skus по остаткам.
 */
function getSalesFunnelAnaliticsByPrevDaysWBApi(analiticsTok, prevDay = 0) {
  const { from, to } = getDateFromTo(prevDay)
  return getSalesFunnelAnaliticsWBApi(analiticsTok, from, to);
}

/**
 * Получить воронка продаж
 * @param {string} analiticsTok - Ключ API (Аналитика)
 * @param {Date} dateBegin - начальная дата
 * @param {Date} dateEnd - конечная дата
 */
function getSalesFunnelAnaliticsWBApi(analiticsTok, dateBegin, dateEnd) {
  const formatDate = (date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${('0' + (d.getMonth() + 1)).slice(-2)}-${('0' + d.getDate()).slice(-2)} ${('0' + d.getHours()).slice(-2)}:${('0' + d.getMinutes()).slice(-2)}:${('0' + d.getSeconds()).slice(-2)}`;
  };

  //const url = `https://suppliers-api.wildberries.ru/content/v1/analytics/nm-report/detail`
  const url = 'https://seller-analytics-api.wildberries.ru/api/v2/nm-report/detail'

  const analiticsSet = {
    headers: {
      'Authorization': analiticsTok,
      'accept': 'application/json'
    }
  }

  const options = {
    'method': 'post',
    'headers': analiticsSet.headers,
    'contentType': 'application/json',
    'payload': JSON.stringify(
      {
        "brandNames": [
        ],
        "objectIDs": [
        ],
        "tagIDs": [
        ],
        "nmIDs": [
        ],
        "timezone": "Europe/Moscow",
        "period": {
          "begin": formatDate(dateBegin), //"2024-02-24 00:00:00",
          "end": formatDate(dateEnd) //"2024-02-24 23:59:59"
        },
        "orderBy": {
          "field": "ordersSumRub",
          "mode": "asc"
        },
        "page": 1
      })
  };

  const response = UrlFetchApp.fetch(url, options);
  const res = JSON.parse(response.getContentText());
  return res
}