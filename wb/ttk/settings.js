//Сколько дней от текущего можно применять текущий сток. Это сделано тк вб не хранит сток.
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
