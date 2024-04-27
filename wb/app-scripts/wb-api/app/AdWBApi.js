

/**
 * Получить воронка продаж по одному из предыдущих дней
 * @param {string} adTok - Ключ API (Продвижение)
 * @param {number} prevDay - Список skus по остаткам.
 */
function getHistoryCostAdByPrevDaysWBApi(adTok, prevDay = 0) {
  const { from, to } = getDateFromTo(prevDay)
  return getHistoryCostAdWBApi(adTok, from, to);
}


/**
 * Получить историю затрат
 * @param {string} adTok - Ключ API (Продвижение)
 * @param {Date} from - начальная дата
 * @param {Date} to - конечная дата
 */
function getHistoryCostAdWBApi(adTok, from, to) {
  const formatDate = (date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${('0' + (d.getMonth() + 1)).slice(-2)}-${('0' + d.getDate()).slice(-2)}`;
  };

  //	quantity 1 - товар с ненулевым остатком, 0 - товар с любым остатком
  var url = `https://advert-api.wb.ru/adv/v1/upd?from=${formatDate(from)}&to=${formatDate(to)}`; //2024-02-28&to=2024-02-28

  const adSet = {
    headers: {
      'Authorization': adTok,
      'accept': 'application/json'
    }
  }

  var options = {
    'method': 'get',
    'headers': adSet.headers
  };

  var response = UrlFetchApp.fetch(url, options);
  return JSON.parse(response.getContentText());
}


/**
 * Получить статистику по рекламным компаниям предыдущих дней
 * @param {string} adTok - Ключ API (Продвижение)
 * @param {number[]} idAds - Идентификаторы рекламных компаний
 * @param {number} prevDay - Список skus по остаткам.
 */
function getHistoryAdFullStatByDayWBApi(adTok, idAds = [11892459, 14229862], prevDay = 0) {
  const { from, to } = getDateFromTo(prevDay)
  return getHistoryAdFullStatWBApi(adTok, idAds, from, to);
}

/**
 * Получить статистику по рекламным компаниям
 * @param {string} adTok - Ключ API (Продвижение)
 * @param {number[]} idAds - Идентификаторы рекламных компаний
 * @param {Date} dateBegin - начальная дата
 * @param {Date} dateEnd - конечная дата
 */
function getHistoryAdFullStatWBApi(adTok, idAds, from, to) {
  const formatDate = (date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${('0' + (d.getMonth() + 1)).slice(-2)}-${('0' + d.getDate()).slice(-2)}`;
  };

  const url = `https://advert-api.wb.ru/adv/v2/fullstats`

  const adSet = {
    headers: {
      'Authorization': adTok,
      'accept': 'application/json'
    }
  }

  const options = {
    'method': 'post',
    'headers': adSet.headers,
    'contentType': 'application/json',
    'payload': JSON.stringify(idAds.map(v => {
      return {
        id: v,
        dates: [formatDate(from), formatDate(to)]
      }
    }))
  };

  const response = UrlFetchApp.fetch(url, options);
  const res = JSON.parse(response.getContentText());
  return res
}


/**
 * Метод позволяет получать информацию о кампаниях по query параметрам, либо по списку id кампаний. new Допускается 5 запросов в секунду.
 * @param {string} adTok - Ключ API (Продвижение)
 * @param {number[]} idAds - Идентификаторы рекламных компаний
 */
function getInfoAdCompanyWBApi(adTok, idAds) {
  const url = `https://advert-api.wb.ru/adv/v1/promotion/adverts`

  const adSet = {
    headers: {
      'Authorization': adTok,
      'accept': 'application/json'
    }
  }

  const options = {
    'method': 'post',
    'headers': adSet.headers,
    'contentType': 'application/json',
    'payload': JSON.stringify(idAds)
  };

  const response = UrlFetchApp.fetch(url, options);
  const res = JSON.parse(response.getContentText());
  return res
}


/**
 * Поставить рекламу на паузу
 * @param {string} adTok - Ключ API (Продвижение RW)
 * @param {number} idAd - Идентификатор рекламной компании
 * @returns {number} ResponseCode = 200 - Ok, 400,422 - Error
 */
function pauseAdCompanyWBApi(adTok, idAd) {
  var url = `https://advert-api.wb.ru/adv/v0/pause?id=${idAd}`

  const adSet = {
    headers: {
      'Authorization': adTok,
      'accept': 'application/json'
    }
  }

  var options = {
    'method': 'get',
    'headers': adSet.headers
  };

  var response = UrlFetchApp.fetch(url, options);
  return response.getResponseCode()
}

/**
 * Включить рекламу с паузы
 * @param {string} adTok - Ключ API (Продвижение RW)
 * @param {number} idAd - Идентификатор рекламной компании
 * @returns {number} ResponseCode = 200 - Ok, 400,422 - Error
 */
function startAdCompanyWBApi(adTok, idAd) {
  var url = `https://advert-api.wb.ru/adv/v0/start?id=${idAd}`

  const adSet = {
    headers: {
      'Authorization': adTok,
      'accept': 'application/json'
    }
  }

  var options = {
    'method': 'get',
    'headers': adSet.headers
  };

  var response = UrlFetchApp.fetch(url, options);
  return response.getResponseCode()
}
