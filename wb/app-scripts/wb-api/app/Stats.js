/**
 * Отчет о продажах по реализации. Детализация к еженедельному отчёту реализации. 
 * В отчёте доступны данные за последние 3 месяца. Максимум 1 запрос в минуту.
 * @param {string} statTok - Ключ API (Статистика)
 * @param {Date} dateFrom - начальная дата
 * @param {Date} dateTo - конечная дата
 * @param {number} rrdid - Уникальный идентификатор строки отчета. Необходим для получения отчета частями. Загрузку отчета нужно начинать с  rrdid = 0 и при последующих вызовах API передавать в запросе значение rrd_id из последней строки, полученной в результате предыдущего вызова. Таким образом для загрузки одного отчета может понадобиться вызывать API до тех пор, пока количество возвращаемых строк не станет равным нулю. 
 */
function getSelReportDetailWBApi(statTok, dateFrom, dateTo, rrdid) {
 // statTok = "eyJhbGciOiJFUzI1NiIsImtpZCI6IjIwMjQwMjI2djEiLCJ0eXAiOiJKV1QifQ.eyJlbnQiOjEsImV4cCI6MTczMDQxNTIxMSwiaWQiOiI0MGRkODk0OC03MzQ4LTRhNWUtODA5Zi0wZTQ1Y2ZjODlkNDYiLCJpaWQiOjY4MjY4ODgsIm9pZCI6MzkzMTk1NiwicyI6MTA3Mzc0MTg1Niwic2lkIjoiMjJlOTE1MzUtOTU5ZC00OTc4LTk1ZDAtNDRjOWYwZDkzZDNjIiwidCI6ZmFsc2UsInVpZCI6NjgyNjg4OH0.bDlFHuDCXhmSL_tjGWfDgxuzPbEyXh5XAE3fDY9TCyWUio4IeEt0C5JQGdEpIEeucTjptE-qeHhWF7o0ix6FUQ"


   dateFrom = new Date()
   dateTo = new Date()
  dateFrom.setDate(dateFrom.getDate() - 3);
  dateTo = dateTo.setDate(dateTo.getDate() - 2);
  rrdid = 0


  const formatDate = (date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${('0' + (d.getMonth() + 1)).slice(-2)}-${('0' + d.getDate()).slice(-2)}`;
  };

  //	quantity 1 - товар с ненулевым остатком, 0 - товар с любым остатком
  var url = `https://statistics-api.wildberries.ru/api/v5/supplier/reportDetailByPeriod?dateFrom=${formatDate(dateFrom)}&dateTo=${formatDate(dateTo)}&rrdid=${rrdid}`

  const adSet = {
    headers: {
      'Authorization': statTok,
      'accept': 'application/json'
    }
  }

  const options = {
    'method': 'get',
    'muteHttpExceptions': true,
    'headers': adSet.headers,
  };

  const response = UrlFetchApp.fetch(url, options);
  const code = response.getResponseCode()
  const ddd = response.getContentText()
  return JSON.parse(response.getContentText());
}
