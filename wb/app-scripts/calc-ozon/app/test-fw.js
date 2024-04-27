function eq(func, res) {
  const r = func() === res
  if (!r) throw new Error(`Not eq`)
}

function eqCmp(func, funcCmp) {
  const res = func()
  const r = funcCmp(res)
  if (!r) throw new Error(`Not eq`)
}

function thr(func) {
  try {
    func()
    return false
  } catch (error) {
    return true
  }
}
