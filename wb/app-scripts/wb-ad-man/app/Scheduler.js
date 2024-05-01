class Scheduler {
  static getRangeSchedulerFromSheet() {
    let vals = Utils.SchedSheet.getRange(schedSheet.RangeAll).getValues()
    vals = vals.filter(v => (v[0]))
    return vals
  }


  static getScheduler(vals) {
    const toMin = (h, m) => {
      const mins = h * 60 + m
      return mins
    }

    const map = new Map()
    vals.forEach((v, i) => {
      const arr = map.get(v[0]) || []
      if (arr.length === 0) map.set(v[0], arr)
      const a = {
        idGriup: v[0],
        dayOfWeek: v[1],
        timeOn: toMin(v[2], v[3]),
        timeOff: toMin(v[4], v[5])
      }

      arr.push(a)
      if (a.timeOn > a.timeOff) throw new Error(`Время включение не может быть больше времени выключения. Строка ${i + 1} в закладке ${Utils.SchedSheet.getSheetName()}`)
    })

    return map
  }

  /**
   * Метод для проверки активности группы на основе текущего времени и дня недели
   * @param {string} groupId - идентификатор группы 
   * @param {Map} mapScheduler - Хэш таблица полученная от полученный от Scheduler.getScheduler
   * @param {Date} time - Время которое проверяем. Или текущее new Date() или передаем
   * @returns {boolean} true - Активно
   */
  static isActive(groupId, mapScheduler, time) {
    const schedule = mapScheduler.get(groupId);
    if (!schedule) return false;

    const currentDay = time.getDay(); // В JS воскресенье - 0, понедельник - 1, ..., суббота - 6
    const dayOfWeek = currentDay === 0 ? 7 : currentDay; // Переводим в формат 1 (понедельник) ... 7 (воскресенье)
    const currentTimeInMinutes = time.getHours() * 60 + time.getMinutes();
    // Проверяем активность группы
    for (let i = 0; i < schedule.length; i++) {
      const entry = schedule[i];
      if (entry.dayOfWeek === dayOfWeek) {
        if (currentTimeInMinutes >= entry.timeOn && currentTimeInMinutes <= entry.timeOff) {
          return true;
        }
      }
    }

    return false;
  }


  static test() {
    const _ = (result, func) => {
      const res = func()
      if (res !== result) throw `Тест. Ожидали ${result} а получили ${res}`
    }

    const d = (dayOfWeek, time) => {
      if (dayOfWeek == 1) return new Date('2024.03.04 ' + time)
      else if (dayOfWeek == 2) return new Date('2024.03.05 ' + time)
      else if (dayOfWeek == 3) return new Date('2024.03.06 ' + time)
      else if (dayOfWeek == 4) return new Date('2024.03.07 ' + time)
      else if (dayOfWeek == 5) return new Date('2024.03.08 ' + time)
      else if (dayOfWeek == 6) return new Date('2024.03.09 ' + time)
      else if (dayOfWeek == 7) return new Date('2024.03.10 ' + time)
    }


    const mapScheduler = [
      ["group1", 1, 23, 0, 23, 59],
      ["group1", 1, 10, 25, 13, 10],
      ["group1", 1, 23, 0, 23, 59],
      ["group1", 7, 22, 0, 22, 30],
    ];

    const dd = Scheduler.getScheduler(mapScheduler)

    _(false, () => Scheduler.isActive("group1", dd, d(1, '15:00')))
    _(true, () => Scheduler.isActive("group1", dd, d(1, '23:00')))
    _(true, () => Scheduler.isActive("group1", dd, d(1, '23:59')))
    _(false, () => Scheduler.isActive("groupzz", dd, d(1, '23:59')))
    _(false, () => Scheduler.isActive("group1", dd, d(3, '23:59')))
    _(true, () => Scheduler.isActive("group1", dd, d(7, '22:01')))
    _(true, () => Scheduler.isActive("group1", dd, d(7, '22:30')))
    _(false, () => Scheduler.isActive("group1", dd, d(7, '22:31')))

  }
}
