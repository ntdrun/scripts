const calcPropsSheet = {
  headerLen: 1,
  name: 'calc-props',
  rangeAll: 'A2:C',
  //Индексы колонок
  idx: {
    key: 0,
    val: 1,
    valEx: 2,
  }
}

var props = null

function getCalcProps() {
  let props = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(calcPropsSheet.name).getRange(calcPropsSheet.rangeAll).getValues()
  props = props.filter(v => (v[calcPropsSheet.idx.key]))

  val = {}
  props.forEach(item => {
    val[item[0]] = item;
  });

  return val
}
