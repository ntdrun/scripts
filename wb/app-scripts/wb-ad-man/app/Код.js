function Action(tick = true) {
  if (Utils.IsProgramOn) AdCompany.update()
}

function forceUpdate() {
  AdCompany.forceWriteStatus()
}

function OnEdit(e) {
  var sheet = e.source.getActiveSheet();
  if (sheet.getName() != setSheet.name) return
  const range = e.range;

  if (range.getA1Notation() === setSheet.RangeModeOnOff) {
    Report.writeReport(1, 'sys', '', `Режим авто ${Utils.IsAutoOn ? 'Включен' : 'Выключен'}`)
    Action(false)
  }
  else if (range.getA1Notation() === setSheet.RangeGlobalOff) {
    Report.writeReport(1, 'sys', '', `Состояние программы: ${Utils.IsProgramOn ? 'В работе' : 'Остановлено'}`)
    Action(false)
  }
}