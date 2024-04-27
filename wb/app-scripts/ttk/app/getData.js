const sh = "https://docs.google.com/spreadsheets/d/1RGoH_VERn-_xV-Lqtm3m0ebE5sC2A-pLIdOmEQiY3Ro/edit"

function autoRead() {
  const spreadsheetUrl = sh
  autoReadImpl(spreadsheetUrl)
}


function autoReadImpl(spreadsheetUrl) {
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


function readByDay(spreadsheetUrl = sh, days = 0) {
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
    console.log(`writeTTKDataDayNext read ${Perform.___end_perfom('writeTTKDataDayNext')} ms`)

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

    const anal = getAnaliticsInfoByDay(props, goods, spreadsheet, prevDay)
    const adsCost = getAdCostByDay(props, spreadsheet, prevDay)

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
      vals[i][TTKSh.idx.ОстаткиСП - 1] = anal[i].ОстаткиСП
      vals[i][TTKSh.idx.ОстатикиWB - 1] = anal[i].ОстатикиWB
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
      vals[i][TTKSh.idx.Модель - 1] = anal[i].Модель
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
      if (!plan) {
        Log.write(spreadsheet, 1, LogType.Err, `Не заполнен план для группы: '${groupsName[i]}'`)
      }
      valsGroup[i] = new Array(maxCol)
      valsGroup[i][TTKSh.idx.Дата - 1] = date
      valsGroup[i][TTKSh.idx.ДатаВремяСчит - 1] = now
      valsGroup[i][TTKSh.idx.ТипЗаписи - 1] = TypeOfRecord.group
      valsGroup[i][TTKSh.idx.Категория - 1] = goods.getCatByGroupName(groupsName[i])

      valsGroup[i][TTKSh.idx.ГруппаТоваров - 1] = groupsName[i]

      //valsGroup[i][TTKSh.idx.ЗаказовПлан - 1] = plan[PlanSh.idx.ПланКвоПродаж - 1]
      valsGroup[i][TTKSh.idx.ВыручкаПлан - 1] = plan ? plan[PlanSh.idx.ПланВыручПродаж - 1] : 0
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

  const def = (date, nameGroup, sku, skuWB, cat, model) => {
    return {
      Дата: date,
      ГруппаТоваров: nameGroup,
      Категория: cat,
      АртикулWB: skuWB,
      Модель: model,
      АртикулПрод: sku,
      ОстаткиСПшт: 0,
      ОстатикиWBшт: 0,
      ОстаткиСП: 0,
      ОстатикиWB: 0,
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
      Отмен: 0,
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

    const g = def(res.date, goodsInfo[GoodsSh.idx.Группа - 1], card.vendorCode, goodsInfo[GoodsSh.idx.АртикулWB - 1],
      goodsInfo[GoodsSh.idx.Категория - 1], goodsInfo[GoodsSh.idx.Модель - 1])
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
    g.ОстатикиWB += card.stocksWb
    g.ОстаткиСП += card.stocksMp
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
}