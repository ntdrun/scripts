
function getApiPrice() {
  const sellerSKU = "A:A" //Источник артикулов селлера для проверки уникальности
  const srcSKU = "L2:O" //Источник артикулов
  const destSKU = "H2:K" //Ячейки куда вставляем данные
  const destColIndx = 8 // G Номер колонки куда мы вставляем цены с ВБ в 
  const destColPriceIndx = 17

  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  const sheet = spreadsheet.getActiveSheet();

  //Проверяем чтобы не повторялись значения
  const valsSS = sheet.getRange(sellerSKU).getValues();
  const hSS = new Map()
  for (let i = 0; i < valsSS.length; i++) {
    const v = valsSS[i][0]
    if (!v) continue
    if (hSS.has(v)) {
      spreadsheet.toast(`Артикул поставщика ${v} дублируется. Уберите дубль`, 'ОШИБКА', 25)
      return
    }
    hSS.set(v, v)
  }

  const range = sheet.getRange(srcSKU); // предположим, что данные начинаются с первой строки
  const vals = range.getValues();

  // Укажите диапазон для очистки
  const rangeClear = sheet.getRange(destSKU + sheet.getLastRow());
  rangeClear.clearContent();

  const answ = WBApi.getGoodsWithPricesWBApi(priceTok)
  const wbPrices = answ.data.listGoods

  const nms = []

  for (let i = 0; i < vals.length; i++) {
    for (let n = 0; n < vals[i].length; n++) {
      if (!vals[i][n]) continue
      nms.push({
        row: i,
        col: n,
        nm: vals[i][n]
      })
    }

  }

  const chunks = Array.from({ length: Math.ceil(nms.length / 180) }, (v, i) =>
    nms.slice(i * 180, i * 180 + 180));
  const chunksReq = []


  chunks.forEach(nmcChank => {
    const nmsStr = nmcChank.map(v => v.nm).join(';')
    const url = `https://card.wb.ru/cards/v1/detail?appType=1&dest=-1257786&curr=rub&spp=30&nm=${nmsStr}`
    chunksReq.push({
      url,
      method: "get"
    })
  })


  const prods = []

  const responses = UrlFetchApp.fetchAll(chunksReq)
  for (let i = 0; i < responses.length; i++) {
    const data = JSON.parse(responses[i].getContentText() || { data: { products: [] } }) // получаем содержимое ответа
    if (!data.data.products.length) {
      spreadsheet.toast('Ошибка данные', 'Ошибка', 20);
      return
    }

    prods.push(...data.data.products)
  }

  for (let i = 0; i < nms.length; i++) {
    const o = prods.find(v => v.id == nms[i].nm)
    if (!o) continue
    if (!o.salePriceU) o.salePriceU = 0
    const price = o.salePriceU / 100
    const cell2 = sheet.getRange(nms[i].row + 2, nms[i].col + destColIndx);
    cell2.setValue(price);

    //0 индекс значит наша
    if (nms[i].col === 0) {
      const rp = wbPrices.find(v => v.nmID == nms[i].nm)
      const rp_price = rp.sizes[0].price
      const rp_discount = rp.discount
      const realPrice = Math.floor(rp_price * ((100 - rp_discount) / 100))

      sheet.getRange(nms[i].row + 2, destColPriceIndx).setValue(rp_price)
      sheet.getRange(nms[i].row + 2, destColPriceIndx + 1).setValue(rp_discount)

      const cell1 = sheet.getRange(nms[i].row + 2, destColIndx - 1);
      cell1.setValue(realPrice);
    }
  }
  spreadsheet.toast(`Данные успешно обновлены`, 'ОК', 5)
}

