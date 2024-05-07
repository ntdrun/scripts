const sleepAfterPauseAndStart = 3000

const adCompaniesSheet = {
  headerLen:1,
  name: 'РекКомпании',
  RangeAll: 'A2:H',
  RangeStatus: 'B2:B',
  RangeWastedMoney: 'F2:F',
  //Индексы колонок
  idx: {
    OnOff: 1,
    State: 2,
    Name: 3,
    Id: 4,
    SchedulerId: 5,
    WastedMoney: 6,
    Budget: 7
  }
}

const staticsSheet = {
  name: 'Статистика',
  //Уровень детализации статистики 1 - только основное, 3 - все
  detail: 3
}

const schedSheet = {
  name: 'Расписание',
  RangeAll: 'A2:F'
}

const setSheet = {
  name: 'Настройки',
  //Включение программы полностью
  RangeGlobalOff: 'B1',
  //Включение выключение авторежима
  RangeModeOnOff: 'B2',
  //Ключ авторекламы
  AdTok: 'B3',
  //Рэнж для данных по которым будет выводится тек состояние
  RangeAutoModeOnOff: 'A2:F'
}