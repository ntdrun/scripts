/**
 * Получить информацию по всем товарам и ценам на ВБ
 * @param {string} pricesTok - Ключ API (Цены и скидки)
 * @param {number?} Сколько элементов вывести на одной странице (пагинация). Максимум 1 000 элементов
 * @param {number?} offset -  Сколько элементов пропустить
 * @param {number?} filterNmID - Артикул Wildberries, по которому искать товар
 */
function getGoodsWithPricesWBApi(pricesTok, limit, offset, filterNmID) {
  if (!limit) limit = 1000
  if (!offset) offset = 0

  //	quantity 1 - товар с ненулевым остатком, 0 - товар с любым остатком
  var url = `https://discounts-prices-api.wb.ru/api/v2/list/goods/filter?limit=${limit}&offset=${offset}`;
  if (filterNmID) url += `&filterNmID=${filterNmID}`

  var headers = {
    'Authorization': pricesTok,
    'accept': 'application/json'
  };

  var options = {
    'method': 'get',
    'headers': headers
  };

  var response = UrlFetchApp.fetch(url, options);
  return JSON.parse(response.getContentText());
}
