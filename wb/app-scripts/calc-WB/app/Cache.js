/**
* @param {any[]} args
*/
function getCache(...args) {
  const cache = CacheService.getUserCache();

  const cacheKey = JSON.stringify(args);

  let valstr = cache.get(cacheKey)

  if (valstr) {
    const v = JSON.parse(valstr)
    return v.val
  }
  else return null; // Возвращаем null или новое значение, если кэш был обновлен
}


/**
* @param {any} val
* @param {any[]} args
*/
function setCache(val, ...args) {
  const cache = CacheService.getUserCache();
  const cacheKey = JSON.stringify(args);

  cache.put(cacheKey, JSON.stringify({ val }))
}

/**
* @param {any[]} args
*/
function remove(...args) {
  const cache = CacheService.getUserCache();
  const cacheKey = JSON.stringify(args);
  cache.remove(cacheKey)
}
