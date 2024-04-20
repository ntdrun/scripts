var env_prf = new Map();

/**
 * Начать измерение производительности для заданного идентификатора
 * @param {string} id Идентификатор измерения
 */
function ___begin_perfom(id) {
  env_prf.set(id, new Date().getTime());
}

/**
 * Закончить измерение производительности и возвращать продолжительность в миллисекундах
 * @param {string} id Идентификатор измерения
 * @param {Object.<string, number>} speed Объект для хранения измерений
 * @returns {number} Время выполнения в миллисекундах
 */
function ___end_perfom(id, speed = {}) {
  const t0 = env_prf.get(id);
  env_prf.delete(id);
  if (!t0) throw new Error(`Error key ${id}`);
  const t1 = new Date().getTime();

  speed[id] = t1 - t0;
  return t1 - t0;
}

/**
 * Суммировать значения времени выполнения и выводить их, если это указано
 * @param {Object.<string, number>} speed Объект со значениями времени
 * @param {boolean} display Флаг для вывода результата
 * @returns {Object.<string, number>} Объект с суммарным временем
 */
function ___sum(speed) {
  let sum = 0;
  Object.entries(speed).forEach(([key, value]) => sum += value);
  speed['sum'] = sum;
  return speed;
}
