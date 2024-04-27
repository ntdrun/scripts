
// function _TestTarifsWBAPI() {
//   const priceToc = "eyJhbGciOiJFUzI1NiIsImtpZCI6IjIwMjMxMjI1djEiLCJ0eXAiOiJKV1QifQ.eyJlbnQiOjEsImV4cCI6MTcyMjg4Mjg3MiwiaWQiOiI2YjFhNjFhNC04MmI2LTQxN2YtYWYwOC03NjM5ODEzOTFmYmQiLCJpaWQiOjY4MjY4ODgsIm9pZCI6MzkzMTk1NiwicyI6MTA3Mzc0MTgzMiwic2lkIjoiMjJlOTE1MzUtOTU5ZC00OTc4LTk1ZDAtNDRjOWYwZDkzZDNjIiwidCI6ZmFsc2UsInVpZCI6NjgyNjg4OH0._yyxDk3ikugHaeTEbjVBX7cdFPJp7bbTK7rggMTDWlCG9OM2evQtAnU_fVr9s-yPcLCHf-YEcDWo908uYmNccg"

//   getTarifsWBAPI(Date.now(), priceToc)
// }

function getSheetTest(url) {
  return SpreadsheetApp.openByUrl(url).getRange('A:B').getValues();
}


/**
 * Получить информацию по тарифам на ВБ
 * @param {string} pricesTok - Ключ API (Цены и скидки)
 * @param {number} date - Получить тарифы на нужное число. Date.now() - текущее число
 */
function getTarifsWBAPI(pricesTok, date) {
  if (!pricesTok) throw new Error('Не задан токен')
  const getTarifUrls = (date) => {
    const dateStr = new Date(date).toISOString().split('T')[0];
    var urlTarifBox = `https://common-api.wildberries.ru/api/v1/tariffs/box?date=${dateStr}`;
    var urlTarifPallet = `https://common-api.wildberries.ru/api/v1/tariffs/pallet?date=${dateStr}`;
    //Тарифы на возврат
    var urlTarifReturn = `https://common-api.wildberries.ru/api/v1/tariffs/return?date=${dateStr}`
    return [urlTarifBox, urlTarifPallet, urlTarifReturn]
  }

  var headers = {
    'Authorization': pricesTok,
    'accept': 'application/json'
  };

  var options = {
    'method': 'get',
    'headers': headers
  };

  const reqs = getTarifUrls(date).map(v => {
    return {
      'url': v,
      ...options
    }
  })

  var responses = UrlFetchApp.fetchAll(reqs);

  const objs = responses.map(response =>
    JSON.parse(response.getContentText())
  )

  return {
    date: Date.now(),
    box: objs[0],
    pallet: objs[1],
    treturn: objs[2],
  }
}
