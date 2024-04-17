// //Ссылка на закладку группы товаров
// const gtDir = 'ГруппыТоваровСправ'
// const impPrices = 'ИмпортЦены'

// //Индексы cчет с 1
// const impPrices_Артикл = 1
// const impPrices_ЧПриб = 4
// const impPrices_Зрекл = 5

// //Индексы текущей страницы
// const idx = {
//   Дата: 1,
//   ГруппаТоваров: 2,
//   ОстаткиСПшт: 3,
//   ОстатикиWBшт: 4,
//   Выручка: 5,
//   Прибыль: 6,
//   Переходов: 7,
//   РекОтПродажи: 8,
//   РекСлили: 9,
//   РекПросм: 10,
//   РекПерех: 11,
//   РекCTR: 12,
//   РекCPC: 13,
//   Корзин: 14,
//   Заказов: 15,
//   ЗаказовШт: 16,
//   РекПозиция: 17,
//   ПозицияВВыд: 18,
//   РекIDs: 19,
//   РекSKUКво: 20,
//   КвоАртикуловВГруппе: 21
// }

// const strategy = 'Стратегия'
// const idxStrategy = {
//   ГруппаТоваров: 1,
//   РК_ID1: 5,
//   РК_ID2: 7,
//   РК_ID3: 9
// }

// function getAnaliticsByPrevDayMain() {
//   getAnaliticsByPrevDay(1)
// }

// function getAnaliticsByCurDayMain() {
//   getAnaliticsByPrevDay(0)
// }


// function getAnaliticsByPrevDay(prevDay) {
//   try {
//     const adsCost = getAdCostByDay(prevDay)
//     const res = getAnaliticsInfoByDay(prevDay)

//     var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
//     var lastRow = sheet.getLastRow();
//     if (lastRow > 0) lastRow += 1;

//     const maxCol = Math.max(...Object.values(idx))
//     const range = sheet.getRange(lastRow, 1, res.length, maxCol)

//     const vals = new Array(res.length)
//     for (let i = 0; i < res.length; i++) {
//       vals[i] = new Array(maxCol)
//       const ad = adsCost[res[i].ГруппаТоваров] || {}
//       vals[i][idx.Дата - 1] = WBApi.toDateDD_MM_YYSheet(res[i].Дата)
//       vals[i][idx.ГруппаТоваров - 1] = res[i].ГруппаТоваров
//       vals[i][idx.ОстаткиСПшт - 1] = res[i].ОстаткиСПшт
//       vals[i][idx.ОстатикиWBшт - 1] = res[i].ОстатикиWBшт
//       vals[i][idx.Выручка - 1] = res[i].Выручка
//       vals[i][idx.Прибыль - 1] = res[i].Прибыль
//       vals[i][idx.Переходов - 1] = res[i].Переходов
//       vals[i][idx.РекОтПродажи - 1] = res[i].РекОтПродажи
//       vals[i][idx.РекСлили - 1] = ad.sum || 0
//       vals[i][idx.РекПросм - 1] = ad.views || 0
//       vals[i][idx.РекПерех - 1] = ad.clicks || 0
//       vals[i][idx.РекCTR - 1] = ad.ctr || 0
//       vals[i][idx.РекCPC - 1] = ad.cpc || 0
//       vals[i][idx.Корзин - 1] = res[i].Корзина
//       vals[i][idx.Заказов - 1] = res[i].Заказов
//       vals[i][idx.ЗаказовШт - 1] = res[i].ЗаказовШт
//       vals[i][idx.РекПозиция - 1] = ad.avg_position || 0
//       vals[i][idx.РекIDs - 1] = ad.adIds || ''
//       vals[i][idx.РекSKUКво - 1] = ad.countAd || ''
//       vals[i][idx.КвоАртикуловВГруппе - 1] = res[i].КвоВГруппе
//     }


//     range.setValues(vals);

//     console.log(res)
//   }
//   catch (e) {
//     showError(e.message)
//   }
// }


// function getAdCostByDay(prevDay) {
//   let values = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(strategy).getRange('A:AF').getValues();
//   values.splice(0, 1); // Удалили 1 строку
//   values = values.filter(v => (v[0]))

//   //считали ID рекламных компаний по группе
//   const allIdAds = []
//   values.forEach(v => {
//     if (v[idxStrategy.РК_ID1 - 1]) allIdAds.push(v[idxStrategy.РК_ID1 - 1])
//     if (v[idxStrategy.РК_ID2 - 1]) allIdAds.push(v[idxStrategy.РК_ID2 - 1])
//     if (v[idxStrategy.РК_ID2 - 1]) allIdAds.push(v[idxStrategy.РК_ID2 - 1])
//   })

//   const stat = WBApi.getHistoryAdFullStatByDayWBApi(adTok, allIdAds, prevDay)

//   //const ad = WBApi.getHistoryCostAdByPrevDaysWBApi(prevDay)

//   const res = {}

//   for (let i = 0; i < values.length; i++) {
//     const v = values[i]
//     let sum = 0
//     let views = 0
//     let clicks = 0
//     const avg_position = []
//     //К-во рекламируемых SKU
//     let countAd = 0
//     const ctr = []
//     const cpc = []
//     const adIds = []

//     const adInfo = (curStat) => {
//       sum += curStat.sum
//       adIds.push(curStat.advertId)
//       cpc.push(curStat.cpc)
//       ctr.push(curStat.ctr)
//       views += curStat.views
//       clicks += curStat.clicks
//       if (curStat.boosterStats) {
//         countAd += curStat.boosterStats.length
//         curStat.boosterStats.forEach(v => avg_position.push(v.avg_position))
//       }
//     }

//     for (let n = 0; n < stat.length; n++) {
//       if (stat[n].advertId == v[idxStrategy.РК_ID1 - 1]) adInfo(stat[n])
//       else if (stat[n].advertId == v[idxStrategy.РК_ID2 - 1]) adInfo(stat[n])
//       else if (stat[n].advertId == v[idxStrategy.РК_ID3 - 1]) adInfo(stat[n])
//     }
//     res[v[idxStrategy.ГруппаТоваров - 1]] = {
//       sum,
//       views,
//       clicks,
//       countAd,
//       avg_position: avg_position.length ? avg_position.reduce((a, v) => a + v, 0) / avg_position.length : 0,
//       ctr: ctr.length ? ctr.reduce((a, v) => a + v, 0) / ctr.length : 0,
//       cpc: cpc.length ? cpc.reduce((a, v) => a + v, 0) / cpc.length : 0,
//       adIds: adIds.join(';')
//     }
//   }

//   return res
// }

// function getAnaliticsInfoByDay(prevDay) {
//   const def = (date, nameGroup) => {
//     return {
//       Дата: date,
//       ГруппаТоваров: nameGroup,
//       ОстаткиСПшт: 0,
//       ОстатикиWBшт: 0,
//       Выручка: 0,
//       Прибыль: 0,
//       Переходов: 0,
//       РекОтПродажи: 0,
//       Корзина: 0,
//       Заказов: 0,
//       ЗаказовШт: 0,
//       КвоВГруппе: 0
//     }
//   }


//   let res = getByDay(prevDay)
//   res = getGroupOfGoods(res)
//   const priceMap = getPricesAdAndOther()

//   const groups = []

//   for (let i = 0; i < res.groups.length; i++) {
//     const gsrc = res.groups[i]
//     const g = def(res.date, gsrc.group)
//     g.КвоВГруппе = gsrc.item.cards.length

//     for (let n = 0; n < gsrc.item.cards.length; n++) {
//       const card = gsrc.item.cards[n]
//       const count = WBApi.getContFromSetUtils(card.vendorCode)
//       if (!count) throw new Error(`Не смог выделить количество из сета ${card.vendorCode}`)

//       const prices = priceMap.get(card.vendorCode)
//       if (!prices) throw new Error(`Нет соответсвия цены на артикул ${card.vendorCode} в закладке ${impPrices}`)

//       g.Заказов += card.ordersCount
//       g.ЗаказовШт += card.ordersCount * count
//       g.Переходов += card.openCardCount
//       g.Выручка += card.ordersSumRub
//       g.Корзина += card.addToCartCount
//       g.ОстатикиWBшт += card.stocksWb * count
//       g.ОстаткиСПшт += card.stocksMp * count
//       g.Прибыль += card.ordersCount * prices.netProfit
//       g.РекОтПродажи += card.ordersCount * prices.advExpenses
//     }
//     groups.push(g)
//   }

//   return groups

// }


// function getGroupOfGoods(data) {
//   let values = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(gtDir).getRange('A:B').getValues();
//   values.splice(0, 1); // Удалили 1 строку
//   values = values.filter(v => (v[0]))

//   const map = new Map(values.map(v => [v[1], v[0]]))
//   const mapGroup = new Map(values.map(v => [v[0], { cards: [] }]))

//   data.cards.forEach(v => {
//     const group = map.get(v.vendorCode)
//     if (!group) return
//     const val = mapGroup.get(group)
//     if (!val) return
//     val.cards.push(v)
//   })

//   const vs = [...mapGroup.entries()]
//   data.groups = vs.map(v => { return { group: v[0], item: v[1] } })
//   return data
// }

// function getPricesAdAndOther() {
//   var values = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(impPrices).getRange('A:AA').getValues();
//   values.splice(0, 1); // Удалили 1 строку

//   const map = new Map(values.filter(v => (v[impPrices_Артикл - 1])).map(v => [v[impPrices_Артикл - 1], {
//     netProfit: v[impPrices_ЧПриб - 1],
//     advExpenses: v[impPrices_Зрекл - 1]
//   }]))
//   return map
// }


// function getByDay(prevDay) {
//   const res = WBApi.getSalesFunnelAnaliticsByPrevDaysWBApi(analiticsTokWB, prevDay)
//   const ocards = res.data.cards
//   if ((!ocards) || (ocards.length === 0)) throw new Error('Ошибка запроса')

//   const date = WBApi.convertDateToUnixTimestamp(ocards[0].statistics.selectedPeriod.begin)

//   const cards = ocards.map(v => {
//     return {
//       vendorCode: v.vendorCode,
//       stocksMp: v.stocks.stocksMp,
//       stocksWb: v.stocks.stocksWb,
//       openCardCount: v.statistics.selectedPeriod.openCardCount,
//       addToCartCount: v.statistics.selectedPeriod.addToCartCount,
//       ordersCount: v.statistics.selectedPeriod.ordersCount,
//       ordersSumRub: v.statistics.selectedPeriod.ordersSumRub,
//       buyoutsCount: v.statistics.selectedPeriod.buyoutsCount,
//       buyoutsSumRub: v.statistics.selectedPeriod.buyoutsSumRub,
//       cancelCount: v.statistics.selectedPeriod.cancelCount,
//       cancelSumRub: v.statistics.selectedPeriod.cancelSumRub,
//       avgOrdersCountPerDay: v.statistics.selectedPeriod.avgOrdersCountPerDay,
//       avgPriceRub: v.statistics.selectedPeriod.avgPriceRub
//     }
//   })

//   return {
//     date,
//     cards
//   }
// }