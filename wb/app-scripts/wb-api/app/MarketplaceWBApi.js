/**
 * Получить список всех остатков продовца на всех складах
 * @param {string} marketplaceTok - Ключ API (Маркетплейс)
 * @param {number} idWh - Идентефикатор склада
 * @param {string[]} skus - Список skus по остаткам.
 * @returns {number[]} % по складу
 */
function getStocksWhMarketplaceWBApi(marketplaceTok, warehouseId = 865647, skus = ["2039598303758"]) {
  const mplaceSet = {
    headers: {
      'Authorization': marketplaceTok,
      'accept': 'application/json'
    }
  }

  const getUrl = (warehouseId) => `https://suppliers-api.wildberries.ru/api/v3/stocks/${warehouseId}`

  const url = getUrl(warehouseId, skus)

  const options = {
    'method': 'post',
    'headers': mplaceSet.headers,
    'contentType': 'application/json',
    'payload': JSON.stringify({
      "skus": skus
    })
  };

  var response = UrlFetchApp.fetch(url, options);
  const res = JSON.parse(response.getContentText());
  return res
}

/**
 * Получить список складов продовца
 * @param {string} marketplaceTok - Ключ API (Маркетплейс)
 */
function getListWhMarketplaceWBApi(marketplaceTok) {
  const mplaceSet = {
    headers: {
      'Authorization': marketplaceTok,
      'accept': 'application/json'
    }
  }

  var url = 'https://suppliers-api.wildberries.ru/api/v3/warehouses';

  var options = {
    'method': 'get',
    'headers': mplaceSet.headers
  };

  var response = UrlFetchApp.fetch(url, options);
  return JSON.parse(response.getContentText());
}







