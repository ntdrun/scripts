const sh = "https://docs.google.com/spreadsheets/d/1RGoH_VERn-_xV-Lqtm3m0ebE5sC2A-pLIdOmEQiY3Ro/edit"

function getAnaliticsByPrevDayMain(spreadsheetUrl = sh) {
  getAnaliticsByPrevDay(spreadsheetUrl, 1)
}

//Добавляет следующий день от последнего
function getAnaliticsByNextDayMain(spreadsheetUrl = sh) {
  spreadsheetUrl = sh
  const spreadsheet = SpreadsheetApp.openByUrl(spreadsheetUrl)
  const props = Properties.Read(spreadsheet)
  let days = props.depthRead

  const sheet = spreadsheet.getSheetByName((TTKSh.name))
  const lRow = sheet.getLastRow()
  if (lRow !== TTKSh.headerLen) {
    let values = sheet.getRange(lRow, 1).getValues();
    const differenceInMilliseconds = new Date().getTime() - values[0][TTKSh.idx.Дата - 1].getTime()

    let differenceInDays = Math.round(differenceInMilliseconds / (1000 * 3600 * 24))
    if (differenceInDays <= 1) return
    days = differenceInDays - 1

  }

  getAnaliticsByPrevDay(spreadsheetUrl, days)
}

function getAnaliticsByCurDayMain(spreadsheetUrl = sh) {
  getAnaliticsByPrevDay(spreadsheetUrl, 0)
}

function getAnaliticsByPrevDay(spreadsheetUrl, prevDay) {
  try {
    const spreadsheet = SpreadsheetApp.openByUrl(spreadsheetUrl)
    const props = Properties.Read(spreadsheet)
    const plans = Plans.Read(spreadsheet)

    const adsCost = getAdCostByDay(props, spreadsheet, prevDay)
    const mapTrafPlan = TTK.calcTraficPlan(spreadsheet, plans, prevDay)

    const res = getAnaliticsInfoByDay(props, spreadsheet, prevDay)

    const maxCol = Math.max(...Object.values(TTKSh.idx))


    const date = res[0].Дата
    //Выводим инфу по артикулам
    const vals = new Array(res.length)
    for (let i = 0; i < res.length; i++) {
      vals[i] = new Array(maxCol)
      vals[i][TTKSh.idx.Дата - 1] = WBApi.toDateDD_MM_YYSheet(date)
      vals[i][TTKSh.idx.ТипЗаписи - 1] = TypeOfRecord.sku
      vals[i][TTKSh.idx.ГруппаТоваров - 1] = res[i].ГруппаТоваров
      vals[i][TTKSh.idx.АртикулПрод - 1] = res[i].АртикулПрод
      vals[i][TTKSh.idx.ОстаткиСПшт - 1] = res[i].ОстаткиСПшт
      vals[i][TTKSh.idx.ОстатикиWBшт - 1] = res[i].ОстатикиWBшт
      vals[i][TTKSh.idx.Выручка - 1] = res[i].Выручка
      vals[i][TTKSh.idx.Прибыль - 1] = res[i].Прибыль
      vals[i][TTKSh.idx.Переходов - 1] = res[i].Переходов
      vals[i][TTKSh.idx.РекОтПродажи - 1] = res[i].РекОтПродажи
      vals[i][TTKSh.idx.Корзин - 1] = res[i].Корзина
      vals[i][TTKSh.idx.Заказов - 1] = res[i].Заказов
      vals[i][TTKSh.idx.ЗаказовШт - 1] = res[i].ЗаказовШт
      vals[i][TTKSh.idx.ВыкуповВыручка - 1] = res[i].ВыкуповВыручка
      vals[i][TTKSh.idx.Выкупов - 1] = res[i].Выкупов
    }

    //Сортируем по 2 полям
    vals.sort((a, b) =>
      a[TTKSh.idx.ГруппаТоваров - 1] !== b[TTKSh.idx.ГруппаТоваров - 1] ? a[TTKSh.idx.ГруппаТоваров - 1].localeCompare(b[TTKSh.idx.ГруппаТоваров - 1]) : a[TTKSh.idx.АртикулПрод - 1].localeCompare(b[TTKSh.idx.АртикулПрод - 1])
    );

    //Добавляем инфу по группам
    const groupsName = [...new Set(vals.map(v => v[TTKSh.idx.ГруппаТоваров - 1]))].sort()

    //Выводим инфу по группам
    const valsGroup = new Array(groupsName.length)
    for (let i = 0; i < groupsName.length; i++) {
      const ad = adsCost.get(groupsName[i]) || {}
      const plan = plans.get(groupsName[i])
      valsGroup[i] = new Array(maxCol)
      valsGroup[i][TTKSh.idx.Дата - 1] = WBApi.toDateDD_MM_YYSheet(date)
      valsGroup[i][TTKSh.idx.ТипЗаписи - 1] = TypeOfRecord.group

      valsGroup[i][TTKSh.idx.ГруппаТоваров - 1] = groupsName[i]

      valsGroup[i][TTKSh.idx.ЗаказовПлан - 1] = plan[PlanSh.idx.ПланКвоПродаж - 1]
      valsGroup[i][TTKSh.idx.ВыручкаПлан - 1] = plan[PlanSh.idx.ПланВыручПродаж - 1]
      valsGroup[i][TTKSh.idx.ПереходовПлан - 1] = mapTrafPlan.get(groupsName[i]) || 0

      valsGroup[i][TTKSh.idx.РекIDs - 1] = ad.adIds || ''

      //Считаем количество товара без стока
      let countInGroup = 0, countInGroupWithStock = 0
      vals.forEach(v => {
        if (v[[TTKSh.idx.ГруппаТоваров - 1]] !== groupsName[i]) return
        countInGroup += 1
        const stock = v[TTKSh.idx.ОстатикиWBшт - 1] + v[TTKSh.idx.ОстаткиСПшт - 1]
        if (!stock) return
        countInGroupWithStock += 1
      })
      valsGroup[i][TTKSh.idx.КвоАртикуловВГруппе - 1] = countInGroup
      //Если в группе
      if ((!countInGroupWithStock) && (prevDay > CountDaysNonStock)) countInGroupWithStock = Math.round(countInGroup * 0.7)
      valsGroup[i][TTKSh.idx.КвоАртикуловВГруппеСток - 1] = countInGroupWithStock

      const clicks = ad.clicksOnGroup || 0
      const calcClicks = Utils.calcClicks(clicks, countInGroupWithStock)
      valsGroup[i][TTKSh.idx.РекПерехРасч - 1] = calcClicks

      valsGroup[i][TTKSh.idx.РекCPCРасч - 1] = calcClicks ? (ad.cpcOnGroup || 0) * (clicks / calcClicks) : 0
    }


    //Выводим инфу по рекламе
    const adGroup = []

    adsCost.forEach((adObj, gName) => {
      adObj.adGroup.forEach(ad => {
        const g = new Array(maxCol)
        g[TTKSh.idx.Дата - 1] = WBApi.toDateDD_MM_YYSheet(date)
        g[TTKSh.idx.ТипЗаписи - 1] = TypeOfRecord.ad
        g[TTKSh.idx.ГруппаТоваров - 1] = gName
        g[TTKSh.idx.РекСлили - 1] = ad.sum || 0
        g[TTKSh.idx.РекПросм - 1] = ad.views || 0
        g[TTKSh.idx.РекПерех - 1] = ad.clicks || 0
        g[TTKSh.idx.РекCTR - 1] = ad.ctr || 0
        g[TTKSh.idx.РекCPC - 1] = ad.cpc || 0
        g[TTKSh.idx.РекПозиция - 1] = ad.avg_position || 0
        g[TTKSh.idx.РекID - 1] = ad.adId || ''
        g[TTKSh.idx.РекSKUКво - 1] = ad.countAd || ''
        adGroup.push(g)
      })
    })

    var sheet = spreadsheet.getSheetByName(TTKSh.name);
    var lastRow = sheet.getLastRow();
    if (lastRow > 0) lastRow += 1;

    const range = sheet.getRange(lastRow, 1, vals.length + groupsName.length + adGroup.length, maxCol)

    range.setValues([...vals, ...adGroup, ...valsGroup]);
  }
  catch (e) {
    Utils.showError(e.message)
  }
}


/**
 * Получить рекламную информацию по группе
 * @param {AppProperty} props - Настройки
 * @param {SpreadsheetApp.Spreadsheet} spreadsheet - Рабочая книга
 * @param {number} prevDay - Индекс дня
*/
function getAdCostByDay(props, spreadsheet, prevDay) {
  const shd = Utils.getDataSheet(spreadsheet, AdSh.name, AdSh.rangeRead)
  const values = shd.vals

  //считали ID рекламных компаний по группе
  const allIdAds = []
  values.forEach(v => {
    if (v[AdSh.idx.РК_ID1 - 1]) allIdAds.push(v[AdSh.idx.РК_ID1 - 1])
    if (v[AdSh.idx.РК_ID2 - 1]) allIdAds.push(v[AdSh.idx.РК_ID2 - 1])
    if (v[AdSh.idx.РК_ID3 - 1]) allIdAds.push(v[AdSh.idx.РК_ID3 - 1])
    if (v[AdSh.idx.РК_ID4 - 1]) allIdAds.push(v[AdSh.idx.РК_ID4 - 1])
    if (v[AdSh.idx.РК_ID5 - 1]) allIdAds.push(v[AdSh.idx.РК_ID5 - 1])
  })

  const stat = WBApi.getHistoryAdFullStatByDayWBApi(props.adTokWb, allIdAds, prevDay)

  const res = new Map()

  for (let i = 0; i < values.length; i++) {
    const v = values[i]
    const adInfo = (curStat) => {
      const res = {
        sum: curStat.sum,
        adId: curStat.advertId,
        cpc: curStat.cpc,
        ctr: curStat.ctr,
        views: curStat.views,
        clicks: curStat.clicks,
        countAd: 0,
        avg_position: 0
      }

      const _avg_position = []

      if (curStat.boosterStats) {
        res.countAd += curStat.boosterStats.length
        curStat.boosterStats.forEach(v => _avg_position.push(v.avg_position))
      }

      res.avg_position = _avg_position.length ? _avg_position.reduce((a, v) => a + v, 0) / _avg_position.length : 0
      return res
    }


    const adGroup = []
    //Находим нужные результаты и формируем массив по группе
    for (let n = 0; n < stat.length; n++) {
      if (stat[n].advertId == v[AdSh.idx.РК_ID1 - 1]) adGroup.push(adInfo(stat[n]))
      else if (stat[n].advertId == v[AdSh.idx.РК_ID2 - 1]) adGroup.push(adInfo(stat[n]))
      else if (stat[n].advertId == v[AdSh.idx.РК_ID3 - 1]) adGroup.push(adInfo(stat[n]))
      else if (stat[n].advertId == v[AdSh.idx.РК_ID4 - 1]) adGroup.push(adInfo(stat[n]))
      else if (stat[n].advertId == v[AdSh.idx.РК_ID5 - 1]) adGroup.push(adInfo(stat[n]))
    }

    res.set(v[AdSh.idx.ГруппаТоваров - 1], {
      adGroup,
      name: v[AdSh.idx.ГруппаТоваров - 1],
      clicksOnGroup: adGroup.reduce((accum, v) => accum + v.clicks, 0),
      cpcOnGroup: (adGroup.length) ? adGroup.reduce((accum, v) => accum + v.cpc, 0) / adGroup.length : 0,
      adIds: adGroup.map(v => v.adId).join(';')
    })
  }

  return res
}


/**
 * Получить рекламную информацию по группе
 * @param {AppProperty} props - Настройки
 * @param {SpreadsheetApp.Spreadsheet} spreadsheet - Рабочая книга
 * @param {number} prevDay - Индекс дня
*/
function getAnaliticsInfoByDay(props, spreadsheet, prevDay) {
  const def = (date, nameGroup, sku) => {
    return {
      Дата: date,
      ГруппаТоваров: nameGroup,
      АртикулПрод: sku,
      ОстаткиСПшт: 0,
      ОстатикиWBшт: 0,
      Выручка: 0,
      Прибыль: 0,
      Переходов: 0,
      РекОтПродажи: 0,
      Корзина: 0,
      Заказов: 0,
      ЗаказовШт: 0,
      Заказов: 0,
      ВыкуповВыручка: 0,
      Выкупов: 0
    }
  }

  const goods = Goods.Read(spreadsheet)
  let res = getFunnelDataByDay(props, prevDay)

  const skuData = []

  for (let i = 0; i < res.cards.length; i++) {
    const card = res.cards[i]
    const goodsInfo = goods.mapBySKU.get(card.vendorCode)
    if (!goodsInfo) continue
    const groupInfo = goods.mapByGroup.get(goodsInfo[GoodsSh.idx.Группа - 1])
    const count = goodsInfo[GoodsSh.idx.Кво - 1]

    const g = def(res.date, goodsInfo[GoodsSh.idx.Группа - 1], card.vendorCode)
    g.КвоВГруппе = groupInfo.length
    g.Заказов += card.ordersCount
    g.ЗаказовШт += card.ordersCount * count
    g.Переходов += card.openCardCount
    g.Выручка += card.ordersSumRub
    g.Корзина += card.addToCartCount
    g.ВыкуповВыручка += card.buyoutsSumRub
    g.Выкупов += card.buyoutsCount
    //Остатки в ВБ только текущие
    g.ОстатикиWBшт += card.stocksWb * count
    g.ОстаткиСПшт += card.stocksMp * count
    g.Прибыль += card.ordersCount * goodsInfo[GoodsSh.idx.Прибыль - 1]
    g.РекОтПродажи += card.ordersCount * goodsInfo[GoodsSh.idx.РеклБюджПрод - 1]
    skuData.push(g)

    if (prevDay > CountDaysNonStock) {
      g.ОстатикиWBшт = ''
      g.ОстаткиСПшт = ''
    }
  }


  return skuData

}


/**
 * Получить информацию по воронке продаж
 * @param {AppProperty} props - Настройки
 * @param {number} prevDay - Индекс дня
*/
function getFunnelDataByDay(props, prevDay) {
  const res = WBApi.getSalesFunnelAnaliticsByPrevDaysWBApi(props.analiticsTokWB, prevDay)
  const ocards = res.data.cards
  if ((!ocards) || (ocards.length === 0)) throw new Error('Ошибка запроса')

  const date = WBApi.convertDateToUnixTimestamp(ocards[0].statistics.selectedPeriod.begin)

  const cards = ocards.map(v => {
    return {
      vendorCode: v.vendorCode,
      stocksMp: v.stocks.stocksMp,
      stocksWb: v.stocks.stocksWb,
      openCardCount: v.statistics.selectedPeriod.openCardCount,
      addToCartCount: v.statistics.selectedPeriod.addToCartCount,
      ordersCount: v.statistics.selectedPeriod.ordersCount,
      ordersSumRub: v.statistics.selectedPeriod.ordersSumRub,
      buyoutsCount: v.statistics.selectedPeriod.buyoutsCount,
      buyoutsSumRub: v.statistics.selectedPeriod.buyoutsSumRub,
      cancelCount: v.statistics.selectedPeriod.cancelCount,
      cancelSumRub: v.statistics.selectedPeriod.cancelSumRub,
      avgOrdersCountPerDay: v.statistics.selectedPeriod.avgOrdersCountPerDay,
      avgPriceRub: v.statistics.selectedPeriod.avgPriceRub
    }
  })

  return {
    date,
    cards
  }
}