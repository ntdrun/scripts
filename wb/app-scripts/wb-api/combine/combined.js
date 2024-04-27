const sh = "https://docs.google.com/spreadsheets/d/1RGoH_VERn-_xV-Lqtm3m0ebE5sC2A-pLIdOmEQiY3Ro/edit"

function autoRead() {
  const spreadsheetUrl = sh
  autoReadImpl(spreadsheetUrl)
}


function autoReadImpl(spreadsheetUrl = sh) {
  try {
    const spreadsheet = SpreadsheetApp.openByUrl(spreadsheetUrl)
    const props = Properties.Read(spreadsheet)

    if (!props.progIsOn) return

    //Если прочитали часовые то следущие будем читать в следующий раз за сутки это сделать успеем
    //это делается тк есть лимит запросов к WB Api
    if (writeTTKDataHourNext(spreadsheet, spreadsheetUrl)) return

    writeTTKDataDayNext(spreadsheet, props, spreadsheetUrl)
  }
  catch (e) {
    Log.write(spreadsheet, 1, LogType.Err, "autoReadImpl - " + e.message)
  }
}


function readByDay(spreadsheetUrl = sh, days = 1) {
  const ap = readAllDataFromApi(spreadsheetUrl, days)
  writeTTKDataImpl(ap, days, TTKSh.name, true)
}

/**
 * Добавляет следующий день от последнего
 * @param {AppProperty} props - Настройки
 * @param {SpreadsheetApp.Spreadsheet} spreadsheet - Рабочая книга
 * returns {boolean}
 */
function writeTTKDataHourNext(spreadsheet, spreadsheetUrl) {
  try {
    Perform.___begin_perfom('writeTTKDataHourNext')

    spreadsheet = spreadsheet || SpreadsheetApp.openByUrl(spreadsheetUrl)
    Utils.throwCheckSetting(spreadsheet)

    const getHourRead = () => {
      const sheet = spreadsheet.getSheetByName((TTKHourSh.name))
      const maxCol = Math.max(...Object.values(TTKHourSh.idx))
      const lRow = sheet.getLastRow()

      if (lRow === TTKHourSh.headerLen) return { action: 'req' }

      let values = sheet.getRange(lRow, 1, 1, maxCol).getValues();

      let lastDayDate = values[0][TTKSh.idx.Дата - 1]
      if (!(lastDayDate instanceof Date && !isNaN(lastDayDate.getTime()))) {
        throw new Error(`Последняя строчка не является валидной. Нельзя в  отчете ${TTKHourSh.name} вносить изменения вручную`)
      }
      const now = new Date() //new Date('2024-04-20T00:20:30') //проверка перехода на сутки
      const nowRound = new Date(now.setMinutes(0, 0, 0))
      const isFirstHour = ((nowRound.getHours() === 0) && (nowRound.getMinutes() === 0)) ? true : false

      const diffHours = Utils.diffHour(nowRound, lastDayDate)
      if ((diffHours > 0) && (new Date().getMinutes() > ReadAfterMinutes)) return { action: 'req', days: isFirstHour ? 1 : 0 }
      else return { action: 'none' }
    }

    const res = getHourRead()
    if (res.action === 'none') return false
    const r = readAllDataFromApi(spreadsheetUrl, res.days)
    writeTTKDataImpl(r, res.days, TTKHourSh.name, false)

    console.log(`writeTTKDataHourNext read ${Perform.___end_perfom('writeTTKDataHourNext')}ms`)

    return true
  }
  catch (e) {
    Log.write(spreadsheet, 1, LogType.Err, e.message)
  }
}

/**
 * @typedef {Object} WriteTTKDataNext
 * @property {'none' | 'repeat' | 'req'} action - 'none' - ничего, 'repeat' - обычно после удаления данных, 'req' - необходим запрос
 * @property {number} days - день который надо читать 0 текущиий, 1 предыдущий
 * @property {ResultAllFromApi?} resApi
*/

/**
 * Добавляет следующий день от последнего
 * @param {AppProperty} props - Настройки
 * @param {SpreadsheetApp.Spreadsheet} spreadsheet - Рабочая книга
 * @property {ResultAllFromApi} resApi
 * @returns {void}
 */
function writeTTKDataDayNext(spreadsheet, props, spreadsheetUrl, resApi = null) {
  try {
    Perform.___begin_perfom('writeTTKDataDayNext')

    spreadsheet = spreadsheet || SpreadsheetApp.openByUrl(spreadsheetUrl)
    Utils.throwCheckSetting(spreadsheet)
    props = props || Properties.Read(spreadsheet)


    const sheet = spreadsheet.getSheetByName((TTKSh.name))
    const maxCol = Math.max(...Object.values(TTKSh.idx))

    const removeByDayRows = (date) => {
      SheetUtils.clearFromDate(sheet, TTKSh.idx.Дата - 1, date, 1, maxCol, TTKSh.headerLen)
      Utilities.sleep(100)
    }

    //Не нужно считывать
    const getDayRead = () => {
      const lRow = sheet.getLastRow()

      if (lRow === TTKSh.headerLen) return { days: props.depthRead, action: 'req' }

      let values = sheet.getRange(lRow, 1, 1, maxCol).getValues();

      let lastDayDate = values[0][TTKSh.idx.Дата - 1]
      if (!(lastDayDate instanceof Date && !isNaN(lastDayDate.getTime()))) {
        const s = `Последняя строчка не является валидной. Нельзя в  отчет ${TTKSh.name} вносить изменения вручную`
        console.log(s)
        throw new Error(s)
      }

      const now = new Date(new Date().setHours(0, 0, 0, 0))
      lastDayDate = new Date(lastDayDate.setHours(0, 0, 0, 0))

      const lastRead = new Date(values[0][TTKSh.idx.ДатаВремяСчит - 1] || 0)

      let differenceInDays = Utils.diffDays(now, lastDayDate)
      let differenceInLastReadDays = Utils.diffDays(now, new Date(lastRead.setHours(0, 0, 0, 0)))


      //1. Если надо считать  дату за предыдущий день (в нормальном режиме) то ее считываем только после  ReadAfterHour часа
      if ((differenceInDays === 2) && (new Date().getHours() < ReadAfterHour)) return { action: 'none' }

      //2. Проверяем есть ли текущие данные это когда Дата == ДатаВремяСчит
      //Это говорит что они были считаны в один и тотже день для архивныех данных данные должны быть считаны на след день
      if (((differenceInDays >= 1)) && (differenceInDays === differenceInLastReadDays)) {
        removeByDayRows(lastDayDate)
        return { action: 'repeat' }
      }

      //3. Если текущий день и есть текущие данные это мы определяем по differenceInDays === differenceInLastReadDays то тоже их удаляем
      if (((differenceInDays === 0)) && (differenceInDays === differenceInLastReadDays)) {
        removeByDayRows(lastDayDate)
        return { action: 'repeat' }
      }

      return {
        days: differenceInDays - 1,
        action: 'req'
      }
    }

    let res = getDayRead()
    if (res.action === 'none') return
    if (res.action === 'repeat') res = getDayRead()
    if (res.action === 'req') {
      resApi = resApi || readAllDataFromApi(spreadsheetUrl, res.days)
      writeTTKDataImpl(resApi, res.days, TTKSh.name, true)
      res.resApi = resApi
    }
    console.log(`writeTTKDataDayNext read ${Perform.___end_perfom('writeTTKDataDayNext')}ms`)

  }
  catch (e) {
    Log.write(spreadsheet, 1, LogType.Err, e.message)
  }
}

/**
 * @typedef {Object} ResultAllFromApi
 * @property {SpreadsheetApp.Spreadsheet} spreadsheet
 * @property {AppProperty} props
 * @property {GoodsObj} goods
 * @property {AdCostMap} adsCost
 * @property {AnaliticsInfo[]} anal

 * @param {string} spreadsheetUrl - URL рабочей книги
 * @returns {ResultAllFromApi} 
 */
function readAllDataFromApi(spreadsheetUrl, prevDay) {
  try {
    const spreadsheet = SpreadsheetApp.openByUrl(spreadsheetUrl)

    const props = Properties.Read(spreadsheet)
    const plans = Plans.Read(spreadsheet)
    const goods = Goods.Read(spreadsheet)

    const adsCost = getAdCostByDay(props, spreadsheet, prevDay)
    const anal = getAnaliticsInfoByDay(props, goods, spreadsheet, prevDay)

    return {
      spreadsheet,
      props,
      plans,
      goods,
      adsCost,
      anal
    }
  }
  catch (e) {
    throw e
  }
}

/**
 * Записать данные в лист
 * @property {ResultAllFromApi} resApi
 * @property {number} prevDay
 * @property {string} nameSheet
 * 
 */
function writeTTKDataImpl(resApi, prevDay, nameSheet, forDay = true) {
  try {
    /** @type {ResultAllFromApi} */
    const { spreadsheet, props, plans, goods, adsCost, anal } = resApi
    const mapTrafPlan = TTK.calcTraficPlan(spreadsheet, plans, prevDay)

    const maxCol = Math.max(...Object.values(TTKSh.idx))

    const now = Date.now()
    const date = forDay ? WBApi.toDateDD_MM_YYSheet(anal[0].Дата) : WBApi.toDateDD_MM_YY_HH_MM_SSSheet(new Date(now).setMinutes(0, 0, 0))

    //Выводим инфу по артикулам
    const vals = new Array(anal.length)
    for (let i = 0; i < anal.length; i++) {
      vals[i] = new Array(maxCol)
      vals[i][TTKSh.idx.Дата - 1] = date
      vals[i][TTKSh.idx.ДатаВремяСчит - 1] = now
      vals[i][TTKSh.idx.ТипЗаписи - 1] = TypeOfRecord.sku
      vals[i][TTKSh.idx.ГруппаТоваров - 1] = anal[i].ГруппаТоваров
      vals[i][TTKSh.idx.Категория - 1] = anal[i].Категория
      vals[i][TTKSh.idx.АртикулWB - 1] = anal[i].АртикулWB
      vals[i][TTKSh.idx.АртикулПрод - 1] = anal[i].АртикулПрод
      vals[i][TTKSh.idx.ОстаткиСПшт - 1] = anal[i].ОстаткиСПшт
      vals[i][TTKSh.idx.ОстатикиWBшт - 1] = anal[i].ОстатикиWBшт
      vals[i][TTKSh.idx.Выручка - 1] = anal[i].Выручка
      vals[i][TTKSh.idx.Прибыль - 1] = anal[i].Прибыль
      vals[i][TTKSh.idx.Переходов - 1] = anal[i].Переходов
      vals[i][TTKSh.idx.РекОтПродажи - 1] = anal[i].РекОтПродажи
      vals[i][TTKSh.idx.Корзин - 1] = anal[i].Корзина
      vals[i][TTKSh.idx.Заказов - 1] = anal[i].Заказов
      vals[i][TTKSh.idx.ЗаказовШт - 1] = anal[i].ЗаказовШт
      vals[i][TTKSh.idx.ВыкуповВыручка - 1] = anal[i].ВыкуповВыручка
      vals[i][TTKSh.idx.Выкупов - 1] = anal[i].Выкупов
      vals[i][TTKSh.idx.ОтменВыручка - 1] = anal[i].ОтменВыручка
      vals[i][TTKSh.idx.Отмен - 1] = anal[i].Отмен
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
      if (!plan) throw new Error(`Не заполнен план для группы ${groupsName[i]}`)
      valsGroup[i] = new Array(maxCol)
      valsGroup[i][TTKSh.idx.Дата - 1] = date
      valsGroup[i][TTKSh.idx.ДатаВремяСчит - 1] = now
      valsGroup[i][TTKSh.idx.ТипЗаписи - 1] = TypeOfRecord.group
      valsGroup[i][TTKSh.idx.Категория - 1] = goods.getCatByGroupName(groupsName[i])

      valsGroup[i][TTKSh.idx.ГруппаТоваров - 1] = groupsName[i]

      //valsGroup[i][TTKSh.idx.ЗаказовПлан - 1] = plan[PlanSh.idx.ПланКвоПродаж - 1]
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
        g[TTKSh.idx.Дата - 1] = date
        g[TTKSh.idx.ДатаВремяСчит - 1] = now
        g[TTKSh.idx.ТипЗаписи - 1] = TypeOfRecord.ad
        g[TTKSh.idx.ГруппаТоваров - 1] = gName
        g[TTKSh.idx.Категория - 1] = goods.getCatByGroupName(gName)
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

    var sheet = spreadsheet.getSheetByName(nameSheet);
    var lastRow = sheet.getLastRow();
    if (lastRow > 0) lastRow += 1;

    const range = sheet.getRange(lastRow, 1, vals.length + groupsName.length + adGroup.length, maxCol)

    range.setValues([...vals, ...adGroup, ...valsGroup]);
  }
  catch (e) {
    throw e
  }
}


/**
 * @typedef {Object} AdGroupItem
 * @property {string} sum - Сумма в рублях
 * @property {string} adId - идентификатор рекламы
 * @property {string} cpc
 * @property {number} ctr
 * @property {boolean} views
 * @property {boolean} clicks
 * @property {boolean} countAd - Количество рекламируемых артикулов
 * @property {boolean} avg_position

 * @typedef {Object} AdCostByDay
 * @property {AdGroupItem[]} adGroup
 * @property {string} name
 * @property {number} clicksOnGroup
 * @property {number} cpcOnGroup
 * @property {string} adIds
 * 
 * @typedef {Map<string, AdCostByDay>} AdCostMap

 * Получить рекламную информацию по группе
 * @param {AppProperty} props - Настройки
 * @param {SpreadsheetApp.Spreadsheet} spreadsheet - Рабочая книга
 * @param {number} prevDay - Индекс дня
 * @returns {AdCostMap}
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
      /** @type {AdGroupItem} */
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
 * @typedef {Object} AnaliticsInfo
 * @property {string} Дата - Сумма в рублях
 * @property {string} ГруппаТоваров - идентификатор рекламы
 * @property {string} АртикулWB
 * @property {number} АртикулПрод
 * @property {boolean} ОстаткиСПшт
 * @property {boolean} ОстатикиWBшт
 * @property {boolean} Выручка
 * @property {boolean} Прибыль
 * @property {boolean} Переходов
 * @property {boolean} РекОтПродажи
 * @property {boolean} Корзина
 * @property {boolean} Заказов
 * @property {boolean} ЗаказовШт
 * @property {boolean} ВыкуповВыручка
 * @property {boolean} Выкупов
 * @property {boolean} ОтменВыручка
 * @property {boolean} Отмен


 * Получить рекламную информацию по группе
 * @param {AppProperty} props - Настройки
 * @param {SpreadsheetApp.Spreadsheet} spreadsheet - Рабочая книга
 * @param {number} prevDay - Индекс дня
 * @returns {AnaliticsInfo[]}
*/
function getAnaliticsInfoByDay(props, goods, spreadsheet, prevDay) {
  //Значение прибыли или рекламы может быть задано в %. Если в % то высчитываем в зависимости от выручки
  const calcFromPerc = (revenue, profitOrAdBudget, count) => {
    //Google sheet может сама преобразовать %
    if ((typeof profitOrAdBudget === "number") && (profitOrAdBudget < 1.5)) {
      calc = revenue * profitOrAdBudget
      return calc
    }
    if (typeof profitOrAdBudget === "string") {
      if (profitOrAdBudget.indexOf('%') > 0) {
        const perc = parseInt((profitOrAdBudget.match(/\d+/) || [])[0], 10)
        const calc = (perc / 100) * revenue
        return calc
      }
    }
    return profitOrAdBudget * count //Если задан бюджет за продажу 1 еденицы то отталкиваемся от количества
  }

  const def = (date, nameGroup, sku, skuWB, cat) => {
    return {
      Дата: date,
      ГруппаТоваров: nameGroup,
      Категория: cat,
      АртикулWB: skuWB,
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
      ВыкуповВыручка: 0,
      Выкупов: 0,
      ОтменВыручка: 0,
      Отмен: 0
    }
  }

  let res = getFunnelDataByDay(props, prevDay)

  const skuData = []

  for (let i = 0; i < res.cards.length; i++) {
    const card = res.cards[i]
    const goodsInfo = goods.mapBySKU.get(card.vendorCode)
    if (!goodsInfo) continue
    const groupInfo = goods.mapByGroup.get(goodsInfo[GoodsSh.idx.Группа - 1])
    const count = goodsInfo[GoodsSh.idx.Кво - 1]

    const g = def(res.date, goodsInfo[GoodsSh.idx.Группа - 1], card.vendorCode, goodsInfo[GoodsSh.idx.АртикулWB - 1], goodsInfo[GoodsSh.idx.Категория - 1])
    g.КвоВГруппе = groupInfo.length
    g.Заказов += card.ordersCount
    g.ЗаказовШт += card.ordersCount * count
    g.Переходов += card.openCardCount
    g.Выручка += card.ordersSumRub
    g.Корзина += card.addToCartCount
    g.ВыкуповВыручка += card.buyoutsSumRub
    g.Выкупов += card.buyoutsCount
    g.ОтменВыручка += card.cancelSumRub
    g.Отмен += card.cancelCount
    //Остатки в ВБ только текущие
    g.ОстатикиWBшт += card.stocksWb * count
    g.ОстаткиСПшт += card.stocksMp * count
    g.Прибыль += calcFromPerc(card.ordersSumRub, goodsInfo[GoodsSh.idx.Прибыль - 1], card.ordersCount)
    g.РекОтПродажи += calcFromPerc(card.ordersSumRub, goodsInfo[GoodsSh.idx.РеклБюджПрод - 1], card.ordersCount)
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
}/**
 * @typedef {Object} GoodsObj
 * @property {Map} mapBySKU
 * @property {Map} mapByGroup
 * @property {Function} getCatByGroupName
 */
class Goods {
  /**
   * Получить информацию из справочника товаров
   * @param {SpreadsheetApp.Spreadsheet} spreadsheet - Рабочая книга
   * @returns {GoodsObj} Описание товаров
   */
  static Read(spreadsheet) {
    const { vals } = Utils.getDataSheet(spreadsheet, GoodsSh.name, GoodsSh.rangeRead)
    const mapBySKU = new Map(vals.map(v => [v[GoodsSh.idx.АртикулПрод - 1], v]))
    if (vals.length !== mapBySKU.size) throw new Error(`В таблице ${GoodsSh.name} есть повторяющийся АртикулПрод. Он должен быть уникальным`)

    const mapByGroup = new Map()
    const gvals = vals.map(v => [v[GoodsSh.idx.Группа - 1], v])
    gvals.forEach(v => {
      let m = mapByGroup.get(v[0]) || []
      if (m.length === 0) {
        mapByGroup.set(v[0], m)
      }
      m.push(v[1])
    })

    return {
      mapBySKU,
      mapByGroup,
      getCatByGroupName: (nameGroup) => {
        const vals = mapByGroup.get(nameGroup)
        if (!vals) return ""
        if (!vals.length) return ""
        return vals[0][GoodsSh.idx.Категория - 1]
      }
    }
  }
}const LogType = {
    Err: 'Ошибка',
    Success: 'Успех',
    Warn: 'Предупреждение',
  }

class Log {

  /**
   * Записать лог
   * @param {SpreadsheetApp.Spreadsheet} spreadsheet - Рабочая книга
   * @param {number} level - Уровень детализации лога 1-3
   * @param {LogType} type - Тип события 
   * @param {string} msg - Сообщение
   */
  static write(spreadsheet, level,  type, msg) {
    const sheet = spreadsheet.getSheetByName(LogSh.name)


    const maxCol = Math.max(...Object.values(LogSh.idx))
    const vals = new Array(maxCol)
    vals[LogSh.idx.Время - 1] = new Date()
    vals[LogSh.idx.ТипСобытия - 1] = type
    vals[LogSh.idx.Сообщение - 1] = msg


    const lRow = sheet.getLastRow()+1

    sheet.getRange(lRow, 1, 1, maxCol).setValues([vals])
  }
}const env_prf = new Map();

class Perform {
  /**
   * Начать измерение производительности для заданного идентификатора
   * @param {string} id Идентификатор измерения
   */
  static ___begin_perfom(id) {
    env_prf.set(id, new Date().getTime());
  }

  /**
   * Закончить измерение производительности и возвращать продолжительность в миллисекундах
   * @param {string} id Идентификатор измерения
   * @param {Object.<string, number>} speed Объект для хранения измерений
   * @returns {number} Время выполнения в миллисекундах
   */
  static ___end_perfom(id, speed = {}) {
    const t0 = env_prf.get(id);
    env_prf.delete(id);
    if (!t0) throw new Error(`Error key ___end_perfom ${id}`);
    const t1 = new Date().getTime();

    speed[id] = t1 - t0;
    return t1 - t0;
  }

  /**
   * Суммировать значения времени выполнения и выводить их, если это указано
   * @param {Object.<string, number>} speed Объект со значениями времени
   * @param {boolean} display Флаг для вывода результата
   * @returns {Object.<string, number>} Объект с суммарным временем
   */
  static ___sum(speed) {
    let sum = 0;
    Object.entries(speed).forEach(([key, value]) => sum += value);
    speed['sum'] = sum;
    return speed;
  }

}
class Plans {
  /**
   * Получить информацию из справочника товаров
   * @param {SpreadsheetApp.Spreadsheet} spreadsheet - Рабочая книга
   * @returns {Map} Планы по группе, ключ группа 
   */
  static Read(spreadsheet) {
    const { vals } = Utils.getDataSheet(spreadsheet, PlanSh.name, PlanSh.rangeRead)
    const map = new Map(vals.map(v => [v[PlanSh.idx.ГруппаТоваров - 1], v]))
    if (vals.length !== map.size) throw new Error(`В таблице ${PlanSh.name} есть повторяющаяся Группа товаров. Она должена быть уникальным`)

    return map
  }
}/**
 * @typedef {Object} AppProperty
 * @property {string} adTokWb
 * @property {string} analiticsTokWB
 * @property {string} version
 * @property {number} depthRead
 * @property {boolean} progIsOn - Программа работает
 */

class Properties {
  /**
   * @param {SpreadsheetApp.Spreadsheet} spreadsheet - Рабочая книга
   * @returns {AppProperty} Свойства приложения
   */
  static Read(spreadsheet) {
    const {vals} = Utils.getDataSheet(spreadsheet, AppSh.name, AppSh.rangeRead)
    const map = new Map(vals.map(v=> [v[0], [v[1], v[2]]]))

    return {
      adTokWb: map.get(AppSh.key.adTokWb)[0],
      analiticsTokWB: map.get(AppSh.key.analiticsTokWB)[0],
      version: map.get(AppSh.key.version)[0],
      depthRead: map.get(AppSh.key.depthRead)[0],
      progIsOn: map.get(AppSh.key.progIsOn)[0],
    }
  }
}//Сколько дней от текущего можно применять текущий сток. Это сделано тк вб не хранит сток.
const CountDaysNonStock = 2

//После какого часа считать данные за пред день.
const ReadAfterHour = 1

//После какой минуты считывать частовые значения
const ReadAfterMinutes = 5


//Типы записи
const TypeOfRecord = {
  sku: 'Артикул',
  group: 'Группа',
  ad: "Рекл"
}


const LogSh = {
  name: 'Журнал (auto)',
  idx: {
    Время: 1,
    ТипСобытия: 2,
    Сообщение: 3,
  }
}


const PlanSh = {
  name: 'План',
  rangeRead: 'A1:E',
  idx: {
    ГруппаТоваров: 1,
    ПланВыручПродаж: 2,
  }
}


const GoodsSh = {
  name: 'СправТовары',
  rangeRead: 'A1:AF',
  idx: {
    Категория: 1,
    Группа: 2,
    АртикулПрод: 3,
    АртикулWB: 4,
    Кво: 5,
    Прибыль: 6,
    РеклБюджПрод: 7
  }
}

const AppSh = {
  name: 'СправПрил',
  rangeRead: 'A1:E',
  key: {
    version: "Version",
    analiticsTokWB: "WBApiKeyAnalitics",
    adTokWb: "WBApiKeyAd",
    depthRead: "КвоДнейСчитывания",
    progIsOn: "ПрограммаЗапущ"
  }
}

const AdSh = {
  name: 'СправРекл',
  rangeRead: 'A1:H',
  idx: {
    ГруппаТоваров: 1,
    РК_ID1: 2,
    РК_ID2: 3,
    РК_ID3: 4,
    РК_ID4: 5,
    РК_ID5: 6
  }

}

const TTKSh = {
  name: 'ТТКСут (auto)',
  headerLen: 1,
  idx: {
    Дата: 1,
    ДатаВремяСчит: 2,
    ТипЗаписи: 3,
    ГруппаТоваров: 4,
    Категория: 5,
    АртикулWB: 6,
    АртикулПрод: 7,
    ОстаткиСПшт: 8,
    ОстатикиWBшт: 9,
    Выручка: 10,
    ВыручкаПлан: 11,
    Прибыль: 12,
    Переходов: 13,
    ПереходовПлан: 14,
    РекОтПродажи: 15,
    РекСлили: 16,
    РекПросм: 17,
    РекПерех: 18,
    РекПерехРасч: 19,
    РекCTR: 20,
    РекCPC: 21,
    РекCPCРасч: 22,
    Корзин: 23,
    Заказов: 24,
    ЗаказовПлан: 25,
    ЗаказовШт: 26,
    ВыкуповВыручка: 27,
    Выкупов: 28,
    ОтменВыручка: 29,
    Отмен: 30,
    РекПозиция: 31,
    ПозицияВВыд: 32,
    РекID: 33,
    РекIDs: 34,
    РекSKUКво: 35,
    КвоАртикуловВГруппе: 36,
    КвоАртикуловВГруппеСток: 37
  }
}

const TTKHourSh = {
  ...TTKSh,
  name: 'ТТКчас (auto)'

}
function testSheetUtils() {
  const sh = "https://docs.google.com/spreadsheets/d/1RGoH_VERn-_xV-Lqtm3m0ebE5sC2A-pLIdOmEQiY3Ro/edit"

  const sheet = SpreadsheetApp.openByUrl(sh).getSheetByName("TTK-test")

  let read = SheetUtils.readRowsFromEnd(sheet, 3, 1, 10, 2, 1)
  let count = 0
  for (let result of read) count++
  if (count !== 1) throw new Error('Ошибка')

  count = 0
  read = SheetUtils.readRowsFromEnd(sheet, 2, 1, 10, 2, 1)
  let len = 0
  for (let result of read) {
    len += result.values.length
    count++
  }
  if ((count !== 1) && (len != 1)) throw new Error('Ошибка')

  count = 0
  len = 0
  read = SheetUtils.readRowsFromEnd(sheet, 1, 1, 10, 2, 1)
  for (let result of read) {
    len += result.values.length
    count++
  }
  if ((count !== 0) && (len != 0)) throw new Error('Ошибка')


  count = 0
  len = 0
  read = SheetUtils.readRowsFromEnd(sheet, 4, 1, 10, 2, 1)
  for (let result of read) {
    len += result.values.length
    count++
  }
  if ((count !== 2) && (len != 3)) throw new Error('Ошибка')
}

class SheetUtils {

  /**
* Получить порцию данных с конца
* @param {SpreadsheetApp.Sheet} sheet - лист
* @param {number} lastIndex - Конечный индекс с которого будут читаться данный от последнего к первому
* @param {number} startCol - С какого номера колонки считыываем данные из Range. Счет с 1
* @param {number} endCol - По какой номер колонки считываем данные из Range. Счет с 1
* @param {number} portion - Количество в порции данных
* @param {number} headerLen - длинна загаловка
*/
  static *readRowsFromEnd(sheet, lastIndex, startCol, endCol, portion, headerLen) {
    while (lastIndex > headerLen) {
      const fromRow = Math.max((lastIndex + 1) - portion, headerLen + 1); // Учитываем заголовок.
      const numRows = (lastIndex + 1) - fromRow; // Рассчитываем количество строк для чтения.
      const numCols = endCol - startCol + 1; // Вычисляем количество колонок для чтения.

      // Получаем данные из листа.
      const values = sheet.getRange(fromRow, startCol, numRows, numCols).getValues();

      // Передаём данные и информацию о том, нужно ли продолжать.
      yield {
        values: values,
      };

      // Устанавливаем индекс последней строки для следующей итерации.
      lastIndex = fromRow - 1;
    }
  }


  /**
     * Получить и сгруппировать данные за определенный период по датам.
     * @param {SpreadsheetApp.Sheet} sheet - лист
     * @param {number} indexOfDate - индекс где расположена дата в массиве
     * @param {Date} startDate - стартовая дата
     * @param {Date} endDate - конечная дата
     * @param {number} startCol - С какого номера колонки считыываем данные из Range. Счет с 1
     * @param {number} endCol - По какой номер колонки считываем данные из Range. Счет с 1
     * @param {number} headerLen - длинна загаловка
     * @param {Function} agregationFunc - Функция агрегации

     */
  static queryAndGroupByDate(sheet, indexOfDate, startDate, endDate, startCol, endCol, headerLen, agregationFunc = null) {
    const generator = SheetUtils.readRowsFromEnd(sheet, sheet.getLastRow(), startCol, endCol, 100, headerLen);
    let groupedData = new Map();

    // Итерация по данным, получаемым из генератора
    for (let { values } of generator) {
      for (let row of values) {
        if (!row[indexOfDate]) continue
        let dateInRow = new Date(row[indexOfDate].setHours(0, 0, 0, 0))
        let dateKey = dateInRow.getTime()

        if (dateInRow >= startDate && dateInRow <= endDate) {
          let arr = groupedData.get(dateKey)
          if (!arr) {
            if (agregationFunc) groupedData.set(dateKey, row)
            else groupedData.set(dateKey, [row])
          }
          else {
            if (agregationFunc) groupedData.set(dateKey, agregationFunc(arr, row))
            else arr.push(row)
          }
        } else if (dateInRow < startDate) {
          // Поскольку данные читаются с конца и идут назад по времени, прерываем цикл, если дата меньше начальной
          return groupedData;
        }
      }
    }

    return groupedData;
  }


  /**
     * Очистить строки с конца списка до даты.
     * @param {SpreadsheetApp.Sheet} sheet - лист
     * @param {number} indexOfDate - индекс где расположена дата в массиве
     * @param {Date} fromDate - До какой даты очищаем
     * @param {number} startCol - С какого номера колонки считыываем данные из Range. Счет с 1
     * @param {number} endCol - По какой номер колонки считываем данные из Range. Счет с 1
     * @param {number} headerLen - длинна загаловка
     */
  static clearFromDate(sheet, indexOfDate, fromDate, startCol, endCol, headerLen) {
    const date = fromDate.setDate(fromDate.getDate() - 1) // Отнимаем один день

    const lastIndex = sheet.getLastRow()
    let fromIndex = lastIndex
    let isbreak = false
    const rows = SheetUtils.readRowsFromEnd(sheet, lastIndex, startCol, endCol, 100, headerLen)
    for (let { values } of rows) {
      for (let i = values.length - 1; i >= 0; i--) {
        const row = values[i]
        const d = row[indexOfDate]
        if (!d) continue
        let dateInRow = d.setHours(0, 0, 0, 0)
        if (date < dateInRow) fromIndex--
        else if (date >= dateInRow) {
          isbreak = true
          break
        }
      }
      if (isbreak) break
    }

    if (fromIndex != lastIndex) {
      sheet.getRange(fromIndex + 1, 1, lastIndex - fromIndex, sheet.getLastColumn()).clearContent();
    }

  }


}const testTTK = ()=> {
  const sh = "https://docs.google.com/spreadsheets/d/1RGoH_VERn-_xV-Lqtm3m0ebE5sC2A-pLIdOmEQiY3Ro/edit"

  const spreadsheet = SpreadsheetApp.openByUrl(sh)
  const sheet = spreadsheet.getSheetByName("TTK-test")
  const plans = Plans.Read(spreadsheet)

  const l = TTK.calcTraficPlan(spreadsheet, plans, 1000)

}


class TTK {
  /**
 * Получить информацию за последнии N дней
 * @param {SpreadsheetApp.Spreadsheet} spreadsheet - Рабочая книга
 * @param {number} countPrevDays - Количество дней от вчерашней даты. 1 это будет за вчера, 2 за вчера и позовчера...
 * @param {number} fromPrevDays - От каких пред дней вести осчет
*/
  static getRowsFromDate(spreadsheet, fromPrevDays, countPrevDays) {
    const dayDate = 24 * 60 * 60 * 1000
    const endDate = new Date(new Date().setHours(0, 0, 0, 0) - (fromPrevDays+1) * dayDate); // Установка времени на 00:00:00:000
    const startDate = new Date(endDate.getTime() - (countPrevDays - 1) * dayDate);

    const maxCol = Math.max(...Object.values(TTKSh.idx))
    const res = SheetUtils.queryAndGroupByDate(spreadsheet.getSheetByName(TTKSh.name), TTKSh.idx.Дата - 1, startDate, endDate, 1, maxCol, TTKSh.headerLen)

    return res
  }


  /**
 * Получить плановый трафик
 * @param {SpreadsheetApp.Spreadsheet} spreadsheet - Рабочая книга
 * @param {Map} plans - Результат Plans.Read
 * @param {number} fromPrevDays - От каких пред дней вести осчет
*/
  static calcTraficPlan(spreadsheet, plans, fromPrevDays, days = 31) {
    const rowsByDateGroup = TTK.getRowsFromDate(spreadsheet, fromPrevDays, days)

    const mapGroup = new Map()

    rowsByDateGroup.forEach((val, key) => {
      val.forEach(arr => {
        const g = arr[TTKSh.idx.ГруппаТоваров - 1]

        let v = mapGroup.get(g)
        if (!v) {
          v = { перех: 0, выруч: 0, заказ: 0, заказШт: 0 }
          mapGroup.set(g, v)
        }
        v.перех += arr[TTKSh.idx.Переходов - 1] || 0
        v.выруч += arr[TTKSh.idx.Выручка - 1] || 0
        v.заказ += arr[TTKSh.idx.Заказов - 1] || 0
        v.заказШт += arr[TTKSh.idx.ЗаказовШт - 1] || 0
      })
    })

    const res = new Map()
    mapGroup.forEach((val, key) => {
      const vg = plans.get(key)
      if (!vg) return
      const plan = vg[PlanSh.idx.ПланВыручПродаж - 1]
      const vv = (val.перех) ? val.выруч / val.перех : 0
      let planTraf = (vv) ? plan / vv : 0
      if ((val.перех < 300) || (val.заказ < 10)) planTraf = 0
      res.set(key, Math.round(planTraf))
    })
    return res
  }

}
/**
 * @typedef {Object} DataSheet
 * @property {SpreadsheetApp.Sheet} sheet
 * @property {Object[][]} vals
 */



class Utils {

  /**
  * Посчитать количество дней между двумя датами
  * @param {Date} freshDate - Дата из которой будет вычитаться
  * @param {Date} olderDate - Диапазон листа
  * @returns {number} Количество дней
  */
  static diffDays(freshDate, olderDate) {
    const differenceInMilliseconds = freshDate.getTime() - olderDate.getTime()
    let differenceInDays = Math.round(differenceInMilliseconds / (1000 * 3600 * 24))
    return differenceInDays
  }

  /**
  * Посчитать количество часов между двумя датами
  * @param {Date} freshDate - Дата из которой будет вычитаться
  * @param {Date} olderDate - Диапазон листа
  * @returns {number} Количество дней
  */
  static diffHour(freshDate, olderDate) {
    const differenceInMilliseconds = freshDate.getTime() - olderDate.getTime()
    let differenceInHours = Math.round(differenceInMilliseconds / (1000 * 3600))
    return differenceInHours
  }

  /**
  * @param {SpreadsheetApp.Spreadsheet} spreadsheet - Рабочая книга
  * @param {string} name - Имя листа
  * @param {string} range - Диапазон листа
  * @param {bool} delFirstRow - Удалить первую колонку
  * @returns {DataSheet} Свойства приложения
  */
  static getDataSheet(spreadsheet, name, range, delFirstRow = true) {
    const sheet = spreadsheet.getSheetByName((name))
    const lRow = sheet.getLastRow()
    let values = sheet.getRange(range + lRow).getValues();
    if (delFirstRow) values.splice(0, 1); // Удалили 1 строку
    return { sheet, vals: values.filter(v => (v[0])) }
  }

  static getRandomInRange(min, max) {
    return min + Math.random() * (max - min);
  }

  //Расчитать количество переходов
  static calcClicks(clicksCalc, countInGroupWithStock) {
    //Рек. Перех+(Рек. Перех*(К-во артикулов в группе*0.4))
    const res = clicksCalc + (clicksCalc * (countInGroupWithStock) * Utils.getRandomInRange(0.35, 0.45))
    return Math.round(res)
  }

  static showError(errorMessage) {
    // Получаем пользовательский интерфейс активной таблицы
    var ui = SpreadsheetApp.getUi(); // Правильно: Получаем UI через SpreadsheetApp

    // Показываем диалоговое окно с сообщением об ошибке
    ui.alert('Произошла ошибка', errorMessage, ui.ButtonSet.OK);
  }


  /**
   * Проверяет правильность настроек Google Sheet листа
  * @param {SpreadsheetApp.Spreadsheet} spreadsheet - Рабочая книга
  */
  static throwCheckSetting(spreadsheet) {
    const loclZone = spreadsheet.getSpreadsheetTimeZone()

    if ((loclZone !== 'Europe/Minsk') && (loclZone !== 'Europe/Moscow'))
      throw new Error(`Необходимо задать временную зону в настройках книги на Москву или на Минск`)
  }
}
