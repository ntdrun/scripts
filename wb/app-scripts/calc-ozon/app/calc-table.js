function calc() {
  // Пример вызова функции
  //let breakevenPrice = calculateFinancialsCommon(getCalcProps(), 5680, 3408, 14, 0.03, 0.04, 0.18, 28.41, 3.39, "FBS", "60-64%", 5, 0.9, 0.0125)

   let breakevenPrice = calculateFinancialsCommon(getCalcProps(), 5681, 3408, 14, 0.03, 0.04, 0.18, 28.41, 3.39, "FBO", "60-64%", 5, 0.9, 0.0125)

  let res = calculatePointCommon(0, 1, 0.0755, 3409, 14, 0.03, 0.04, 0.18, 28.41, 3.39,
    "FBO", "60-64%", 5, 0.9, 0.0125)
  console.log("Цена безубыточности: ", breakevenPrice);
}

/**
 * Расчет по общей системе налогооблажения
 * 
 * @param {number} horizOut - Вывод в гугл шит горизонтальный: 0, вертикальный: 1
 * @param {number} curs - Курс российского рубля к бел.рублю (28,4064). Если посчитать в РФ просто ставим 1
 * @param {number} rROI - Желаемая ROI.
 * @param {number} purchasePrice - Цена покупки товара BYN.
 * @param {number} upakovkaCosts - Затраты на упаковку BYN.
 * @param {number} advertisingPercent - Процент от цены продажи, идущий на рекламу.
 * @param {number} unaccountedCostsPercent - Процент неучтенных затрат от цены продажи.
 * @param {number} marketplaceCommissionPercent - Процент комиссии маркетплейса от цены продажи.
 * @param {number} ourDeliveryCosts - Наши затраты доставки до маркетплэйса BYN.
 * @param {number} volumeLitr - Объем в литрах
 * @param {string} scheme - Схема FBO или FBS
 * @param {string} indexLogistic - Индекс логистики
 * @param {number} countOtpravl -  Количество отправлений при отправке по FBO
 * @param {number} percByBack -  Выкуп %
 * @param {number} percEkvairing -  Эквайринг %
 * @returns {Object} Цена продажи товара.
 * @customfunction
*/
function calculatePointCommon(horizOut, curs, rROI, purchasePrice, upakovkaCosts, advertisingPercent,
  unaccountedCostsPercent, marketplaceCommissionPercent, ourDeliveryCosts,
  volumeLitr, scheme, indexLogistic, countOtpravl, percByBack, percEkvairing) {
    console.info(arguments)
  //const valCache = getCache('calculatePointCommon', arguments)
  //if (valCache !== null) return valCache

  const props = getCalcProps()

  let salePrice = (purchasePrice + 
    (purchasePrice * marketplaceCommissionPercent) +
    (purchasePrice * advertisingPercent)
    )  * curs

  let res
  let correct = false

  for (let i = 0; i < 100000; i++) {
    res = calculateFinancialsCommon(props, salePrice, purchasePrice * curs, upakovkaCosts * curs, advertisingPercent, unaccountedCostsPercent, marketplaceCommissionPercent,
      ourDeliveryCosts * curs, volumeLitr, scheme, indexLogistic, countOtpravl,
      percByBack, percEkvairing
    )

    if (Math.round(res.ROI * 100) >= Math.round(rROI * 10000)) {
      correct = true
      break
    }
    salePrice += 1
  }

  if (!correct) return 'MaxItems'
  //setCache(salePrice, 'calculatePointCommon', arguments)

  if (horizOut === 0) return [[salePrice, res.advertisingCosts, res.netProfit, res.deliveryAll]]
  else return [[salePrice], [res.advertisingCosts], [res.netProfit], [res.deliveryAll]]
}


function calculateFinancialsCommon(props, salePrice, purchasePrice, upakovkaCosts, advertisingPercent,
  unaccountedCostsPercent, marketplaceCommissionPercent, ourDeliveryCosts,
  volumeLitr, scheme, indexLogistic, countOtpravl, percByBack, percEkvairing) {

  const advertisingCosts = salePrice * advertisingPercent
  const unaccountedCosts = salePrice * unaccountedCostsPercent;
  const marketplaceCommission = salePrice * marketplaceCommissionPercent;

  //Тариф логистики
  const tarifLogistic = calcOfDeliveryCost(scheme, volumeLitr, props)

  const logisticWithIndex = calcDeliveryIndex(scheme, tarifLogistic, indexLogistic, props)
  const costOtprav = calcProccessTake(scheme, countOtpravl, props)
  const vikupCost = calcPercByBackRate(percByBack, logisticWithIndex, tarifLogistic)
  const ekvairingCost = salePrice * percEkvairing
  const lastMileCost = calcLastMile(salePrice, props)

  const deliveryAll = ourDeliveryCosts + logisticWithIndex + costOtprav + vikupCost + lastMileCost

  const totalCostsBeforeTax = purchasePrice + upakovkaCosts + advertisingCosts + unaccountedCosts + marketplaceCommission + ourDeliveryCosts + ekvairingCost + deliveryAll;

  const tax = (salePrice - totalCostsBeforeTax) * 0.18;

  const allZatr = totalCostsBeforeTax + tax

  // Расчет чистой прибыли и ROI
  const netProfit = salePrice - allZatr;
  const ROI = (netProfit / purchasePrice) * 100;

  // Возвращаем результат
  return {
    salePrice,
    advertisingCosts,
    netProfit,
    ROI,
    allZatr,
    deliveryAll
  };
}



