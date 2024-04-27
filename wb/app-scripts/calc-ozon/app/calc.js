
/**
 * Расчитать стоимость последней мили https://docs.ozon.ru/global/commissions/ozon-fees/delivery-expenses/?country=BY
 * @param {number} cost - Цена товара продовца
 * @returns {number} Цена продажи товара.
 * @customfunction
*/
function calcLastMile(cost, inprops = null) {
  const props = inprops || getCalcProps()
  return calcLastMileF(cost, props['LastMilePerc'][calcPropsSheet.idx.val], props['LastMileMin'][calcPropsSheet.idx.val], props['LastMileMax'][calcPropsSheet.idx.val])
}

function calcLastMileF(cost, percent, min, max) {
  if (percent > 1) throw new Error(`percent=${percent} shold be from 0 to 1`)
  const c = cost * percent
  if (c <= min) return min
  if (c > max) return max
  return c
}


/**
 * Расчитать стоимость доставки https://docs.ozon.ru/global/commissions/ozon-fees/delivery-expenses/?country=BY
 * @param {string} scheme - Схема FBO или FBS
 * @returns {number} volume - Объем в литрах
 * @customfunction
*/
function calcOfDeliveryCost(scheme, volume, inprops = null) {
  const props = inprops || getCalcProps()
  return calcOfDeliveryCostF(scheme, volume,
    props['FBSUpTo5'][calcPropsSheet.idx.val],
    props['FBSFrom5UpTo175'][calcPropsSheet.idx.val],
    props['FBSOver175'][calcPropsSheet.idx.val],
    props['FBOUpTo5'][calcPropsSheet.idx.val],
    props['FBOFrom5UpTo175'][calcPropsSheet.idx.val],
    props['FBOOver175'][calcPropsSheet.idx.val]
  )
}

function calcOfDeliveryCostF(scheme, volume, fbsUpTo5, fbsFrom5UpTo175, fbsOver175, fboUpTo5, fboFrom5UpTo175, fboOver175) {
  if (scheme.toLowerCase() === 'fbs') {
    if (volume <= 5) return fbsUpTo5
    if (volume <= 175) return fbsUpTo5 + (Math.ceil(volume) - 5) * fbsFrom5UpTo175
    if (volume > 175) return fbsOver175
  } else {
    if (volume <= 5) return fboUpTo5
    if (volume <= 175) return fboUpTo5 + (Math.ceil(volume) - 5) * fboFrom5UpTo175
    if (volume > 175) return fboOver175
  }
}


/**
 * Расчитать % выкупа https://t.me/FinancialReports_MP_Malitskaya/25
 * @param {number} percByBack - Процент выкупа от 0 до 1
 * @param {number} costDelivery - Полная стоимость доставки с учетом индекса локализации и др
 * @param {number} costDeliveryBack - стоимость доставки
 * @returns {number} Дополнительная стоимсость за счет %выкупа
 * @customfunction
*/
function calcPercByBackRate(percByBack, costDelivery, costDeliveryBack) {
  if (percByBack > 1) throw new Error(`percent=${percent} shold be from 0 to 1`)

  percByBack = percByBack * 100

  const res = ((100 / percByBack) * costDelivery + (100 / percByBack - 1) * costDeliveryBack) - costDelivery
  return res
}

/**
 * Расчитать % выкупа https://t.me/FinancialReports_MP_Malitskaya/25
 * @param {string} scheme - Схема FBO или FBS
 * @param {string} deliveryIndxKey - Индекс доставки
 * @returns {number} Стоимость доставки с учетом идекса
 * @customfunction
*/
function calcDeliveryIndex(scheme, costDelivery=22, deliveryIndxKey="60-64%", inprops = null) {
  if (scheme.toLowerCase() === 'fbs') return costDelivery
  const props = inprops || getCalcProps()
  const c =  props[deliveryIndxKey][calcPropsSheet.idx.val]
  return costDelivery * c
}

/**
 * Расчитать обработку отправлений. Работает только для FBO
 * @param {string} scheme - Схема FBO или FBS
 * @param {number} countSend - Количество отправлений
 * @returns {number}
 * @customfunction
*/
function calcProccessTake(scheme, countSend, inprops = null) {
  if (scheme.toLowerCase() === 'fbo') return 0
  const props = inprops || getCalcProps()
  const c =  props['АПВЗ'][calcPropsSheet.idx.val]
  if (countSend == 0) return c
  return c/countSend
}
