function testCalc() {
  testCalcPercByBackRate()
  testCalcMile()
}


function testCalcMile() {
  thr(() => calcLastMileF(200, 0.5, 10, 20))
  eq(() => calcLastMileF(200, 0.5, 10, 20), 20)
  eq(() => calcLastMileF(2, 0.5, 10, 20), 10)
}

function testCalcPercByBackRate() {
  eqCmp(() => calcPercByBackRate(0.90, 100, 50), (c) => c.toFixed(1) == 16.7)
}
