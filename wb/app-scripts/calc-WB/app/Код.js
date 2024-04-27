function calc() {
  // Пример вызова функции
  let breakevenPrice = calculatePoint(6, 1.8, 0.1, 0.19, 0.5, 0.03, 0.06, 25);
  console.log("Цена безубыточности: ", breakevenPrice);
}

/**
* @customfunction
* @param {number} purchasePrice - Цена покупки товара.
* @param {number} deliveryCosts - Затраты на доставку.
* @param {number} advertisingPercent - Процент от цены продажи, идущий на рекламу.
* @param {number} marketplaceCommissionPercent - Процент комиссии маркетплейса от цены продажи.
* @param {number} marketplaceLogisticCosts - Стоимость логистики маркетплейса.
* @param {number} unaccountedCostsPercent - Процент неучтенных затрат от цены продажи.
* @param {number} rROI - Желаемая ROI.
* @returns {Object} Цена продажи товара.
*/
function calculatePoint(purchasePrice, deliveryCosts, advertisingPercent, marketplaceCommissionPercent, marketplaceLogisticCosts, unaccountedCostsPercent, rROI) {
  // Условие для бинарного поиска
  const condition = (mid) => {
    const res = calculateFinancialsUSN(mid, purchasePrice, deliveryCosts, advertisingPercent, marketplaceCommissionPercent, marketplaceLogisticCosts, unaccountedCostsPercent);
    return Math.round(res.ROI) >= Math.round(rROI * 100);
  };

  // Выполнение бинарного поиска
  const result = binarySearch(purchasePrice, purchasePrice * 10, condition, 0.01, 1000);

  if (result === 'Not found') {
    return 'MaxItems';
  }

  return result;
}

/**
 * Выполняет бинарный поиск для нахождения значения, удовлетворяющего условию.
 * @param {number} low Нижняя граница поиска.
 * @param {number} high Верхняя граница поиска.
 * @param {Function} conditionFunc Функция, принимающая текущее значение и возвращающая true, если условие выполнено.
 * @param {number} precision Точность, с которой нужно найти значение.
 * @param {number} maxIterations Максимальное количество итераций для предотвращения зацикливания.
 * @returns {number|string} Найденное значение или сообщение о превышении количества итераций.
 */
function binarySearch(low, high, conditionFunc, precision, maxIterations) {
  let iteration = 0;
  let correctValue = 'Not found';
  while (low <= high && iteration < maxIterations) {
    const mid = (low + high) / 2;
    if (conditionFunc(mid)) {
      high = mid - precision;
      correctValue = mid;
    } else {
      low = mid + precision;
    }
    iteration++;
  }
  return correctValue;
}

/**
* @customfunction
*/
function calculatePointCommon(purchasePrice, deliveryCosts, advertisingPercent, marketplaceCommissionPercent, marketplaceLogisticCosts, unaccountedCostsPercent, rROI) {
  // Условие для бинарного поиска
  const condition = (mid)=> {
    const res = calculateFinancialsCommon(mid, purchasePrice, deliveryCosts, advertisingPercent, marketplaceCommissionPercent, marketplaceLogisticCosts, unaccountedCostsPercent);
    return Math.round(res.ROI) >= Math.round(rROI * 100);
  }

  // Выполнение бинарного поиска
  const salePrice = binarySearch(purchasePrice, purchasePrice * 10, condition, 0.1, 1000);

  if (salePrice === 'Not found') return 'MaxItems';
  return salePrice;
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



