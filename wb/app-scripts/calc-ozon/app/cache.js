/**
* Получить значение Кэша
* @param {any[]} args
*/
function getCache(...args) {
  const cache = CacheService.getUserCache();

  const cacheKey = JSON.stringify(args);

  let valstr = cache.getProperty(cacheKey)

  if (valstr) {
    const v = JSON.parse(valstr)
    return v.val
  }
  else return null; // Возвращаем null или новое значение, если кэш был обновлен
}

/**
* Установить значение Кэша
* @param {any} val
* @param {any[]} args
*/
function setCache(val, expirationInSeconds, ...args) {
  const cache = CacheService.getUserCache();
  const cacheKey = JSON.stringify(args);

  cache.put(cacheKey, JSON.stringify({ val }), expirationInSeconds)
}

/**
 * Удалить значение из Кэша
* @param {any[]} args
*/
function removeCache(...args) {
  const cache = CacheService.getUserCache();
  const cacheKey = JSON.stringify(args);
  cache.remove(cacheKey)
}
