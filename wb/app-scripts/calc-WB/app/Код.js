function calc() {
  // Пример вызова функции
  let breakevenPrice = calculatePoint(6, 1.8, 0.1, 0.19, 0.5, 0.03, 0.06, 25);
  console.log("Цена безубыточности: ", breakevenPrice);
}

/**
 * @param {number} purchasePrice - Цена покупки товара.
 * @param {number} deliveryCosts - Затраты на доставку.
 * @param {number} advertisingPercent - Процент от цены продажи, идущий на рекламу.
 * @param {number} marketplaceCommissionPercent - Процент комиссии маркетплейса от цены продажи.
 * @param {number} marketplaceLogisticCosts - Стоимость логистики маркетплейса.
 * @param {number} unaccountedCostsPercent - Процент неучтенных затрат от цены продажи.
 * @param {number} rROI - Желаемая ROI.
 * @returns {Object} Цена продажи товара.
 * @customfunction
*/
function calculatePoint(purchasePrice, deliveryCosts, advertisingPercent, marketplaceCommissionPercent, marketplaceLogisticCosts, unaccountedCostsPercent, rROI) {
  const valCache = getCache('calculatePoint', purchasePrice, deliveryCosts, advertisingPercent, marketplaceCommissionPercent, marketplaceLogisticCosts, unaccountedCostsPercent, rROI)
  if (valCache !== null) return valCache

  let correct = false

  let salePrice = purchasePrice
  for (let i = 0; i < 100000; i++) {
    const res = calculateFinancialsUSN(salePrice, purchasePrice, deliveryCosts, advertisingPercent, marketplaceCommissionPercent, marketplaceLogisticCosts, unaccountedCostsPercent)
    if (Math.round(res.ROI) >= Math.round(rROI * 100)) {
      correct = true
      break
    }
    salePrice += 0.01
  }

  if (!correct) return 'MaxItems'
  setCache(salePrice, 'calculatePoint', purchasePrice, deliveryCosts, advertisingPercent, marketplaceCommissionPercent, marketplaceLogisticCosts, unaccountedCostsPercent, rROI)

  return salePrice
}

/**
* @customfunction
*/
function calculatePointCommon(purchasePrice, deliveryCosts, advertisingPercent, marketplaceCommissionPercent, marketplaceLogisticCosts, unaccountedCostsPercent, rROI) {
  const valCache = getCache('calculatePointCommon', purchasePrice, deliveryCosts, advertisingPercent, marketplaceCommissionPercent, marketplaceLogisticCosts, unaccountedCostsPercent, rROI)
  if (valCache !== null) return valCache

  let correct = false

  let salePrice = purchasePrice
  for (let i = 0; i < 100000; i++) {
    const res = calculateFinancialsCommon(salePrice, purchasePrice, deliveryCosts, advertisingPercent, marketplaceCommissionPercent, marketplaceLogisticCosts, unaccountedCostsPercent)
    if (Math.round(res.ROI) >= Math.round(rROI * 100)) {
      correct = true
      break
    }
    salePrice += 0.01
  }
  if (!correct) return 'MaxItems'
  setCache(salePrice, 'calculatePointCommon', purchasePrice, deliveryCosts, advertisingPercent, marketplaceCommissionPercent, marketplaceLogisticCosts, unaccountedCostsPercent, rROI)

  return salePrice
}


function calculateFinancialsUSN(salePrice, purchasePrice, deliveryCosts, advertisingPercent, marketplaceCommissionPercent, marketplaceLogisticCosts, unaccountedCostsPercent) {
  // Расчет затрат
  //deliveryCosts
  const advertisingCosts = salePrice * advertisingPercent;
  const marketplaceCommission = salePrice * marketplaceCommissionPercent;
  const unaccountedCosts = salePrice * unaccountedCostsPercent;
  const totalCostsBeforeTax = advertisingCosts // + marketplaceCommission + marketplaceLogisticCosts;
  const tax = (salePrice - totalCostsBeforeTax) * 0.06;

  const allZatr = purchasePrice + deliveryCosts + advertisingCosts + marketplaceCommission
    + marketplaceLogisticCosts + unaccountedCosts + tax

  // Расчет чистой прибыли и ROI
  const netProfit = salePrice - allZatr;
  const ROI = (netProfit / purchasePrice) * 100;

  // Возвращаем результат
  return {
    netProfit: netProfit,
    ROI: ROI
  };
}

function calculateFinancialsCommon(salePrice, purchasePrice, deliveryCosts, advertisingPercent, marketplaceCommissionPercent, marketplaceLogisticCosts, unaccountedCostsPercent) {
  // Расчет затрат
  //deliveryCosts
  const advertisingCosts = salePrice * advertisingPercent;
  const marketplaceCommission = salePrice * marketplaceCommissionPercent;
  const unaccountedCosts = salePrice * unaccountedCostsPercent;


  const totalCostsBeforeTax = purchasePrice + deliveryCosts + advertisingCosts + marketplaceCommission + marketplaceLogisticCosts + unaccountedCosts;
  const tax = (salePrice - totalCostsBeforeTax) * 0.2;

  const allZatr = totalCostsBeforeTax + tax

  // Расчет чистой прибыли и ROI
  const netProfit = salePrice - allZatr;
  const ROI = (netProfit / purchasePrice) * 100;

  // Возвращаем результат
  return {
    netProfit: netProfit,
    ROI: ROI
  };
}


function toFloat(val) {
  if (typeof val === "string") {
    val = val.replace(",", ".");
    val = parseFloat(val)
  }
  return val
}

/**
 * @param {number} volume - Объем.
 * @param {number} price2 - Цена за 2 литра.
 * @param {number} priceN - Цена за дополнительный литр.
 * @returns {Object} Цена логистики.

* @customfunction
*/
function calculateLogisticWB(volume, price2, priceN) {
  price2 = toFloat(price2);
  priceN = toFloat(priceN);

  if (volume > 2) {
    return (price2) + ((volume - 2) * priceN)
  } else {
    return price2
  }
}



