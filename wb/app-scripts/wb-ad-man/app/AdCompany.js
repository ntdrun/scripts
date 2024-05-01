class AdCompany {
  static getRangeFromSheet() {
    let vals = Utils.AdCompaniesSheet.getRange(adCompaniesSheet.RangeAll).getValues()
    vals = vals.filter(v => (v[adCompaniesSheet.idx.Id - 1]))
    return vals
  }

  static readAdCompanies() {
    const vals = AdCompany.getRangeFromSheet()
    return vals.map(v => {
      return {
        onOff: v[adCompaniesSheet.idx.OnOff - 1],
        state: v[adCompaniesSheet.idx.State - 1],
        name: v[adCompaniesSheet.idx.Name - 1],
        id: v[adCompaniesSheet.idx.Id - 1],
        schedulerId: v[adCompaniesSheet.idx.SchedulerId - 1],
        budget: v[adCompaniesSheet.idx.Budget - 1],
      }
    })
  }

  static readAdCompaniesWBInfo() {
    const adInfos = WBApi.getInfoAdCompanyWBApi(adTok, idAds)
    return adInfos
  }

  /**
   * Остановить компанию
   * @param {object} companyAd - Значение из readAdCompanies()
   * @returns {boolean} true - Успешно примененина
   */

  static startAdCompanyWB(companyAd) {
    try {
      const res = WBApi.startAdCompanyWBApi(adTok, companyAd.id)
      if (res === 200) Report.writeReport(1, 'start-ok', companyAd.id, `Компания '${companyAd.name}' успешно запущена`)
      else Report.writeReport(1, 'start-err', companyAd.id, `Ошибка запуска компании '${companyAd.name}'. Код ${res}`)
      return res === 200
    }
    catch (e) {
      if (e.message.toLowerCase().indexOf('бюджет') >= 0)
        Report.writeReport(1, 'start-err', companyAd.id, `Ошибка запуска компании '${companyAd.name}'. Пополните бюджет`)
      else Report.writeReport(1, 'start-critical-err', companyAd.id, `Критическа ошибка запуска компании '${companyAd.name}'. ${e.message}`)
    }
    return false
  }

  static pauseAdCompanyWB(companyAd) {
    try {
      const res = WBApi.pauseAdCompanyWBApi(adTok, companyAd.id)
      if (res === 200) Report.writeReport(1, 'pause-ok', companyAd.id, `Компания '${companyAd.name}' успешно приостановлена`)
      else Report.writeReport(1, 'pause-err', companyAd.id, `Ошибка приостановки компании '${companyAd.name}'. Код ${res}`)
      return res === 200
    }
    catch (e) {
      Report.writeReport(1, 'pause-critical-err', companyAd.id, `Критическа ошибка паузы компании '${companyAd.name}'. ${e.message}`)
    }
    return false
  }

  /**
   * Вывести информацию о статусах в таблицу
     * @param {object} companies - результата метода readAdCompanies()
     * @param {object} adInfos - результата метода readAdCompaniesWBInfo()
   */
  static writeStatus(companies, adInfos) {
    const idAds = companies.map(v => v.id)

    const infoArr = idAds.map(v => {
      const comp = adInfos.find(n => n.advertId === v)
      //1 - кампания в процессе удаления new, 4 - готова к запуску, 7 - Кампания завершена, 8 - отказался, 
      //9 - идут показы, 11 - Кампания на паузе
      if (!comp) return ['Не определен']
      if (comp.status === 9) return ['Активна']
      else if (comp.status === 11) return ['Пауза']
      return [`Код ${comp.status}`]
    })

    const rangeA1 = adCompaniesSheet.RangeStatus + (adCompaniesSheet.headerLen + companies.length)
    const range = Utils.AdCompaniesSheet.getRange(rangeA1)
    range.setValues(infoArr)
  }

  static forceWriteStatus() {
    const companies = AdCompany.readAdCompanies()
    const idAds = companies.map(v => v.id)
    let adInfos = WBApi.getInfoAdCompanyWBApi(adTok, idAds)
    AdCompany.writeStatus(companies, adInfos)
  }

  //Метод который запускает проверку что надо включить и выключить а также обновляет статусы текущих состояний
  static update() {
    const companies = AdCompany.readAdCompanies()
    const idAds = companies.map(v => v.id)
    let adInfos = WBApi.getInfoAdCompanyWBApi(adTok, idAds)
    //  const stat = WBApi.getHistoryAdFullStatByDayWBApi(props.adTokWb, allIdAds, prevDay)


    if (Utils.IsAutoOn) {
      const schedGroup = Scheduler.getScheduler(Scheduler.getRangeSchedulerFromSheet())

      for (let i = 0; i < companies.length; i++) {
        const v = companies[i]
        if (!v.onOff) continue

        const wbInfo = adInfos.find(n => n.advertId === v.id)
        if (!wbInfo) continue

        const isRunWb = wbInfo.status === 9

        //true - значит должно быть включена
        const isRunShould = Scheduler.isActive(v.schedulerId, schedGroup, new Date())

        if (isRunShould !== isRunWb) {
          if (isRunShould) AdCompany.startAdCompanyWB(v)
          else AdCompany.pauseAdCompanyWB(v)
        }
      }

      Utilities.sleep(sleepAfterPauseAndStart)
      adInfos = WBApi.getInfoAdCompanyWBApi(adTok, idAds)
      AdCompany.writeStatus(companies, adInfos)
    } else {
      AdCompany.writeStatus(companies, adInfos)
    }
  }

}

function a() {
  //const schedGroup = Scheduler.getScheduler(Scheduler.getRangeSchedulerFromSheet())

  //Scheduler.test()
  AdCompany.update()

}
