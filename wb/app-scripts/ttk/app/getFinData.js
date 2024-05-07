
function readFin() {
  const spreadsheet = SpreadsheetApp.openByUrl(sh)

  const r = Properties.Read(spreadsheet)

  let currentDate = new Date()
  currentDate.setDate(currentDate.getDate() - 1);

  const fff = WBApi.getSelReportDetailWBApi(r.statTokWB, currentDate, currentDate, 0)
  console.log('dfdsfs')
}
