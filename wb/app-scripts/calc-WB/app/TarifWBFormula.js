
const cacheTariffKey = '__tariff'

/**
 * Получить % по тарифу
 * @param {string} nameWH - Имя склада.
 * @param {string} type - box или pallet.
 * @returns {number} % по складу
 * @customfunction
*/
function GetPercTariffWB(nameWH = 'Маркетплейс', type = 'box') {
  if ((type != 'box') && (type != 'pallet')) throw "Не указан корректно тип 'box' | 'pallet'"
  try {
    const val = getTarifsWBAPIWithCache()
    const list = val[type].response.data.warehouseList

    const wh = list.find(v => {
      return v.warehouseName.toLowerCase() === nameWH.toLowerCase()
    })

    if (!wh) return undefined
    const perc = (type === 'box') ? wh.boxDeliveryAndStorageExpr : wh.palletDeliveryExpr


    const res = parseInt(perc) / 100
    return res
  }
  catch (e) {
    console.error(e)
    return -1000
  }
}

//
/**
 * Получить стоимость базовых тарифов
 * @param {string} type - box или pallet.
 * @param {string} retype - delivery или storage.
 * @returns {[[number]]} % по складу
 * @customfunction
*/
function GetPercTariffWBBase(type = 'pallet', retype = 'delivery') {
  if ((type != 'box') && (type != 'pallet')) throw "Не указан корректно тип 'box' | 'pallet'"
  try {
    const val = getTarifsWBAPIWithCache()
    const list = val[type].response.data.warehouseList

    const whFirst = list[0]

    if (type === 'box') {
      const koef = toF(whFirst.boxDeliveryAndStorageExpr) / 100
      if (retype === 'delivery') {
        return [[toF(whFirst.boxDeliveryBase) / koef], [toF(whFirst.boxDeliveryLiter) / koef]]
      }
      else if (retype === 'storage') {
        return [[toF(whFirst.boxStorageBase) / koef], [toF(whFirst.boxStorageLiter) / koef]]
      }
    }
    else {
      if (retype === 'delivery') {
        const koef = toF(whFirst.palletDeliveryExpr) / 100
        return [[toF(whFirst.palletDeliveryValueBase) / koef], [toF(whFirst.palletDeliveryValueLiter) / koef]]
      }
      else if (retype === 'storage') {
        const koef = toF(whFirst.palletStorageExpr) / 100
        return [[toF(whFirst.palletStorageValueExpr) / koef]]
      }

    }
    return -1000
  }
  catch (e) {
    console.error(e)
    return -1000
  }
}


function getTarifsWBAPIWithCache() {
  //CacheService.getUserCache().remove(cacheTariffKey)
  let valstr = CacheService.getUserCache().get(cacheTariffKey)
  let val
  try {
    val = JSON.parse(valstr)
  }
  catch {
    CacheService.getUserCache().remove(cacheTariffKey)
  }

  if ((!val) || (!isSameDateAsToday(new Date(val.date)))) {
    val = WBApi.getTarifsWBAPI(priceTok, Date.now())
    CacheService.getUserCache().put(cacheTariffKey, JSON.stringify(val))
  }
  return val
}

function toF(str) {
  var replacedStr = str.replace(',', '.');
  var floatValue = parseFloat(replacedStr);
  return floatValue;
}

function isSameDateAsToday(date) {
  const today = new Date();
  const someDate = new Date(date);

  return today.getDate() === someDate.getDate() &&
    today.getMonth() === someDate.getMonth() &&
    today.getFullYear() === someDate.getFullYear();
}
