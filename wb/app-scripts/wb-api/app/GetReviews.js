
//  'https://feedbacks-api.wildberries.ru/api/v1/feedbacks?isAnswered=false&take=5000&skip=0&order=dateAsc&dateFrom=1&dateTo=7777777



/**
 * Получить воронка продаж по одному из предыдущих дней
 * @param {string} qqTok - Ключ API (Вопросы и отзывы)
 * @param {number} prevDay - Список skus по остаткам.
 */
function getHistoryAllReviewsByPrevDaysWBApi(qqTok, prevDay = 1) {
  qqTok = 'eyJhbGciOiJFUzI1NiIsImtpZCI6IjIwMjQwMjI2djEiLCJ0eXAiOiJKV1QifQ.eyJlbnQiOjEsImV4cCI6MTcyOTU3NzYyOCwiaWQiOiIzNTM3MTg1Yy0xZGIwLTQ0MzgtYWVmOC0wNWVjYzRmZTFkMjMiLCJpaWQiOjY4MjY4ODgsIm9pZCI6MzkzMTk1NiwicyI6MTA3Mzc0MTk1Miwic2lkIjoiMjJlOTE1MzUtOTU5ZC00OTc4LTk1ZDAtNDRjOWYwZDkzZDNjIiwidCI6ZmFsc2UsInVpZCI6NjgyNjg4OH0.9sqx2BVIa0x4-l-rhDkLJKton1SLarHpvvEinaTRD6zGVMTbR3QNF3Lb8OcqQUJFbksWn-O9kYPuGH6Ig1Sosg'

  const { from, to } = getDateFromTo(prevDay)
  return getHistoryAllReviewsWBApi(qqTok, from, to);
}


/**
 * Получить отзывы по нему не возможно получить оценки
 * @param {string} qqTok - Ключ API (Вопросы и отзывы)
 * @param {Date} dateBegin - начальная дата
 * @param {Date} dateEnd - конечная дата
 */
function getHistoryAllReviewsWBApi(qqTok, dateBegin, dateEnd) {
  if (!qqTok) throw new Error('Не задан токен')
  const pageSize = 5000
  let page = 0


  //isAnswered - Обработанные отзывы (true) или необработанные отзывы(false)
  const getUrl = (isAnswered, page) => {
    let r = `https://feedbacks-api.wildberries.ru/api/v1/feedbacks?isAnswered=${isAnswered}&take=${pageSize}&skip=${page}&order=dateAsc`
    r += `&dateFrom=${convertDateToUnixTimestampSec(dateBegin)}&dateTo=${convertDateToUnixTimestampSec(dateEnd)}`
    return r
  }

  const urlProcReviews = getUrl(true, 0)
  const urlNotProcReviews = getUrl(false, 0)

  const options = {
    'method': 'get',
    'headers': {
      'Authorization': qqTok,
      'accept': 'application/json'
    }
  };


  const reqs = [{
    'url': urlProcReviews,
    ...options

  }, {
    'url': urlNotProcReviews,
    ...options
  }]

  const responses = UrlFetchApp.fetchAll(reqs);

  const objs = responses.map(response =>
    JSON.parse(response.getContentText())
  )

  return res
}
