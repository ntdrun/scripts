// ==UserScript==
// @name         WB real count
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://www.wildberries.ru/catalog/*/detail.aspx*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=wildberries.ru
// @run-at       document-idle
// @grant        none
// @require      https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js

// ==/UserScript==

const DESTINATIONS = {
    MINSK: {
        ids: [-59257]
    },
    KRASNODAR: {
        ids: [12358062],
    },
    MOSCOW: {
        ids: [-1257786],
    },
    KAZAHSTAN: {
        ids: [85, -3479876, 12358412, 12358388],
    },
    HABAROVSK: {
        ids: [-1221185, -151223, -1782064, -1785054],
    },
    NOVOSIBIRSK: {
        ids: [-1221148, -140294, -1751445, -364763],
    },
    EKATERINBURG: {
        ids: [-1113276, -79379, -1104258, -5803327],
    }
}

const concurrency = 5
const repeatTimeout = 1000
const detailRegions = [DESTINATIONS.MOSCOW, DESTINATIONS.MINSK]//, DESTINATIONS.KRASNODAR]
const detailRegionsStr = ['Мoсква', 'Минск']//, 'Краснодар']

const wbIdDate = [
    { id: 141493346, date: new Date('2023/01/01') },
    { id: 158515409, date: new Date('2023/07/05') },
    { id: 175622396, date: new Date('2023/09/04') },
    { id: 190895459, date: new Date('2023/10/22') },
    { id: 196330686, date: new Date('2023/12/14') },
    { id: 198425821, date: new Date('2023/12/26') },
    { id: 199432698, date: new Date('2024/01/05') },
    { id: 200281863, date: new Date('2024/01/14') },
    { id: 204996659, date: new Date('2024/01/25') }, // Исправлена дата
    { id: 209748396, date: new Date('2024/02/12') }, // Исправлена дата
];


function findDateRangeById(searchId) {
    // Сортировка массива по ID, на случай если он не отсортирован
    wbIdDate.sort((a, b) => a.id - b.id);

    for (let i = 0; i < wbIdDate.length; i++) {
        if (searchId < wbIdDate[i].id) {
            if (i === 0) {
                return `до ${wbIdDate[i].date.toLocaleDateString()}`;
            } else {
                const idRange = wbIdDate[i].id - wbIdDate[i - 1].id;
                const idProgress = searchId - wbIdDate[i - 1].id;
                const dayRange = (wbIdDate[i].date - wbIdDate[i - 1].date) / (24 * 3600 * 1000);
                const daysToAdd = Math.round((idProgress / idRange) * dayRange);
                const exactDate = new Date(wbIdDate[i - 1].date);
                exactDate.setDate(exactDate.getDate() + daysToAdd);
                return exactDate.toLocaleDateString();
            }
        }
    }

    return `после ${wbIdDate[wbIdDate.length - 1].date.toLocaleDateString()}`;
}


//function findDateRangeById(searchId) {
//  // Сортировка массива по дате, на случай если он не отсортирован
//  wbIdDate.sort((a, b) => a.date - b.date);
//
//  for (let i = 0; i < wbIdDate.length; i++) {
//      if (searchId < wbIdDate[i].id) {
//          if (i === 0) {
//              return `до ${wbIdDate[i].date.toLocaleDateString()}`;
//          } else {
//              return `между ${wbIdDate[i - 1].date.toLocaleDateString()} и ${wbIdDate[i].date.toLocaleDateString()}`;
//          }
//      }
//  }
//
//  return `после ${wbIdDate[wbIdDate.length - 1].date.toLocaleDateString()}`;
//}



// Добавляем Bootstrap CSS динамически
const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css';
document.head.appendChild(link);

// Добавляем FontAwesome CSS динамически
const faLink = document.createElement('link');
faLink.rel = 'stylesheet';
faLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css';
document.head.appendChild(faLink);

class AsyncFetch {
    constructor(concurrency, fetchHandler) {
        this.concurrency = concurrency
        this.fetchHandler = fetchHandler
        this.breakChain = false
    }

    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }


    async fetchAll(listOfArguments) {
        this.breakChain = false
        try {
            const argsCopy = [].concat(
                listOfArguments.map((val, ind) => ({ val, ind }))
            );
            const result = new Array(listOfArguments.length);
            const promises = new Array(this.concurrency).fill(Promise.resolve());

            const fetchHandler = this.fetchHandler

            //breakChain - прервать цикл. Прерывает все что мы должны выполнить
            const chainNext = (p) => {
                if (argsCopy.length) {
                    const arg = argsCopy.shift();
                    return p.then(() => {
                        if (this.breakChain) {
                            result[arg.ind] = {}
                            return Promise.resolve({})
                        }
                        console.log(arg.val)

                        const operationPromise = fetchHandler(arg.val, arg.ind).then((r) => {
                            if (r !== null) {
                                result[arg.ind] = r;
                                if (r && (r.breakChain)) this.breakChain = true
                            }
                        });
                        return chainNext(operationPromise);
                    });
                }
                return p;
            }
            await Promise.all(promises.map(chainNext));
            return result;
        } catch (e) {
            console.log("Error: ", e);
        }
    }
}

function getTotalSaleUrl(ids) {
    return `https://product-order-qnt.wildberries.ru/v2/by-nm/?nm=${ids.join(',')}`;
}

function getReviewUrl(query, dest) {
    return `https://search.wb.ru/exactmatch/ru/common/v4/search?query=${query}&resultset=filters&dest=${dest.ids.join(',')}&curr=rub`;
}

const getImageURLWB = (productId, order = 1) => {
    const p = calcPartWB(productId)
    const random = Date.now();

    const url = `https://basket-${p.basketWithZero}.wb.ru/vol${p.vol}/part${p.part}/${productId}/images/c516x688/${order}.jpg?r=${random}`
    return url
};

const getCardURLWB = (productId) => {
    const p = calcPartWB(productId)
    const url = `https://basket-${p.basketWithZero}.wbbasket.ru/vol${p.vol}/part${p.part}/${productId}/info/ru/card.json`
    return url
};

const getWHsURLWB = () => {
    //const p = calcPartWB(productId)
    //const url = `https://static-basket-${p.basketWithZero}.wbbasket.ru/vol${p.vol}/data/stores-data.json`
    return `https://static-basket-01.wbbasket.ru/vol0/data/stores-data.json`
};

const getDetailCardURLWB = (productId, dest) => {
    const p = calcPartWB(productId)
    const url = `https://card.wb.ru/cards/v1/detail?appType=1&curr=rub&dest=${dest.ids.join(',')}&spp=30&nm=${productId}`
    return url
};

function getFeedbacksUrl(imt_id) {
    const numToUint8Array = function (r) {
        const t = new Uint8Array(8);
        for (let n = 0; n < 8; n++) {
            (t[n] = r % 256);
            (r = Math.floor(r / 256));
        }
        return t;
    };

    const crc16Arc = function (r) {
        const t = numToUint8Array(r);
        let n = 0;
        for (let r = 0; r < t.length; r++) {
            n ^= t[r];
            for (let r = 0; r < 8; r++) {
                (1 & n) > 0 ? (n = (n >> 1) ^ 40961) : (n >>= 1);
            }
        }
        return n;
    };

    let newFeedbacks = [];

    const partition_id = crc16Arc(imt_id) % 100 >= 50 ? "2" : "1";

    const url = `https://feedbacks${partition_id}.wb.ru/feedbacks/v1/${imt_id}`

    return url;
}


const calcPartWB = (productId) => {
    const vol = Math.floor(productId / 100000);
    const part = Math.floor(productId / 1000)

    const basket = getBasketNumber(productId);
    const basketWithZero = basket < 10 ? `0${basket}` : basket;
    return {
        vol,
        part,
        basketWithZero
    }
}


const BASKETS = [
    [0, 143],
    [144, 287],
    [288, 431],
    [432, 719],
    [720, 1007],
    [1008, 1061],
    [1062, 1115],
    [1116, 1169],
    [1170, 1313],
    [1314, 1601],
    [1602, 1655],
    [1656, 1919],
    [1920, 2045],
    [2046, 2189],
    [2190, 2405],
    [2406, 2621]
];

const getBasketNumber = (productId) => {
    const vol = parseInt(productId / 100000, 10);
    const basket = BASKETS.reduce((accumulator, current, index) => {
        if (vol >= current[0] && vol <= current[1]) {
            return index + 1;
        }
        return accumulator;
    }, 1);
    return basket;
};

function getQuery() {
    const url = window.location.href

    var regex = /catalog\/(\d+)\/detail\.aspx/;
    var match = url.match(regex);

    return { id: match[1] }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, numRetries = 7) {
    for (let i = 0; i < numRetries; i++) {
        try {
            const response = await fetch(url)//, { headers }); // Передаём заголовки в fetch
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        } catch (err) {
            console.error(`Attempt ${i + 1}: Error fetching data -`, err.message);
            if (i === numRetries - 1) throw err;
            await sleep(repeatTimeout);
        }
    }
}

async function getWHs() {
    const q = getQuery()
    let data = [];
    try {
        data = await fetchWithRetry(getWHsURLWB());
        if ((!data) || (!data.length)) return data

        return new Map(data.map(v => [v.id, v]))
    } catch (error) {
        console.error('Failed to fetch products:', error);
        return [];
    }
}

async function getTotalSales() {
    const q = getQuery()
    const baseUrl = getTotalSaleUrl([q.id])
    let data = [];
    try {
        data = await fetchWithRetry(baseUrl);
        if ((!data) || (!data.length)) return 0
        return data[0].qnt
    } catch (error) {
        console.error('Failed to fetch products:', error);
        return 0;
    }
}

async function getCard() {
    const q = getQuery()
    const url = getCardURLWB(q.id)
    let data = [];
    try {
        data = await fetchWithRetry(url);
        if (!data) return undefined
        return data
    } catch (error) {
        console.error('Failed to fetch products:', error);
        return undefined;
    }
}

async function getDetailCards(dest) {
    const q = getQuery()

    const url = getDetailCardURLWB(q.id, dest)
    let data = [];
    try {
        data = await fetchWithRetry(url);
        if (!data) return undefined
        return data
    } catch (error) {
        console.error('Failed to fetch products:', error);
        return undefined;
    }
}


async function getFeedbacks(imt_id) {
    const url = getFeedbacksUrl(imt_id)
    let data = [];
    try {
        data = await fetchWithRetry(url);
        if (!data) return undefined
        return data
    } catch (error) {
        console.error('Failed to fetch products:', error);
        return undefined;
    }
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Date(dateString).toLocaleDateString('ru-RU', options);
}

// Функция для копирования текста в буфер обмена
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        console.log('Текст скопирован в буфер обмена');
    }).catch(err => {
        console.error('Ошибка при копировании текста: ', err);
    });
}

function countDatesByMonths(dates, monthsAgo) {
    // Получаем текущую дату
    const today = new Date();

    // Функция для получения начала месяца
    const getStartOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);

    // Массив для хранения подсчетов
    let counts = new Array(monthsAgo + 1).fill(0);

    // Получаем начало месяца для заданного количества месяцев назад
    const startDate = getStartOfMonth(new Date(today.getFullYear(), today.getMonth() - monthsAgo, 1));

    // Получаем начало следующего месяца (для учета текущего месяца до текущей даты)
    const startOfNextMonth = getStartOfMonth(new Date(today.getFullYear(), today.getMonth() + 1, 1));

    // Перебираем даты и увеличиваем соответствующий счетчик
    dates.forEach(dateStr => {
        const date = new Date(dateStr);
        if (date >= startDate && date < startOfNextMonth) {
            // Вычисляем индекс на основе разницы месяцев
            const monthDiff = today.getMonth() - date.getMonth() + (today.getFullYear() - date.getFullYear()) * 12;
            if (monthDiff >= 0 && monthDiff <= monthsAgo) {
                counts[monthDiff]++;
            }
        }
    });

    return counts
}

function daysBetween(date1, date2) {
    const diff = Math.abs(new Date(date2) - new Date(date1));
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}


(function () {
    'use strict';
    function waitForElement(selector, callback, multiple = false) {
        const targetNode = document.body;
        const config = { attributes: false, childList: true, subtree: true };

        const observer = new MutationObserver((mutationsList, observer) => {
            if (multiple) {
                const elements = document.querySelectorAll(selector);
                if (elements.length > 0) {
                    console.log('Элементы найдены!', elements);
                    callback(elements);
                    observer.disconnect();
                }
            } else {
                const element = document.querySelector(selector);
                if (element) {
                    callback(element);
                    observer.disconnect();
                }
            }
        });

        observer.observe(targetNode, config);
    }


    const calcStock = (detailCard, whsMap) => {
        let res = 0
        let wbCount = 0
        let spCount = 0

        let whsIds = []
        if ((!detailCard.data) || (!detailCard.data.products) || (!detailCard.data.products.length)) return { qty: 0, whs: '' }
        if (!detailCard.data.products[0].sizes) return { qty: 0, whs: '' }

        if (!detailCard.data.products[0].sizes[0].stocks) return { qty: 0, whs: '' }
        detailCard.data.products[0].sizes[0].stocks.forEach(v => {
            res += v.qty

            const wh = whsMap.get(v.wh)
            if (wh.name.indexOf('WB') >= 0) wbCount += v.qty
            else spCount += v.qty
            whsIds.push(v)
        })

        return {
            totalQty: res,
            wbCount,
            spCount,
            whsIds,
        }
    }

    const rnameStock = (name) => {
        return name.replace('склад продавца', 'СП')
    }

    waitForElement('.product-page__aside-sticky', async (element) => {
        const newDiv = document.createElement('div');
        newDiv.style.margin = "0px 0px 20px";

        const promises = [getCard(), getTotalSales(), getWHs(), ...detailRegions.map(dest => getDetailCards(dest))];
        const [card, totalSales, whsMap, ...destCards] = await Promise.all(promises);

        const feedbacks = (await getFeedbacks(card.imt_id)).feedbacks || []
        let onlyFB = feedbacks.filter(v => v.nmId == card.nm_id)

        const dates = onlyFB.map(v => new Date(v.createdDate))

        const res = countDatesByMonths(dates, 3)

        let date = ''
        onlyFB = onlyFB.sort((a, b) => {
            try {
                let dateA = new Date(a.createdDate);
                let dateB = new Date(b.createdDate);
                return dateA - dateB;
            }
            catch (e) {
                return 0
            }
        });

        if (onlyFB.length > 0) {
            date = onlyFB[0].createdDate
        }


        const toFB = (fbCount) => {
            let countOnOneFeedbacks = 0
            if (onlyFB.length) {
                countOnOneFeedbacks = totalSales / onlyFB.length
            }
            const res = Math.floor(fbCount * countOnOneFeedbacks)
            return res
        }

        const daysTotal = date ? daysBetween(Date.now(), new Date(date)) : ''

        let unitPrice = 0;
        try {
            unitPrice = destCards[0].data.products[0].salePriceU / 100
        }
        catch {
        }

        let text = `Реальных продаж: ${totalSales}+<br>`
        text += `Выручка: ${totalSales * unitPrice}₽+<br>`
        text += `Отзывов: ${onlyFB.length}<br>`
        text += `Создан ${findDateRangeById(card.nm_id)}<br>`
        text += `Продавец id: ${card.selling.supplier_id}<br>`
        text += `Артикул прод: ${card.vendor_code}<br>`
        text += `Кол-во: ${detailRegionsStr.map((v, i) => {
            const cs = calcStock(destCards[i], whsMap)
            return `${v}: ${cs.totalQty}(${cs.wbCount})`
        }).join(', ')}<br>`

        text += `Склады: ${detailRegionsStr.map((v, i) => {
            const lwhs = calcStock(destCards[i], whsMap)
            return `${v}:[${lwhs.whsIds.map(n => {
                return `${rnameStock(whsMap.get(n.wh).name)}: ${n.qty}`
            }).join(', ')}]`
        }).join(', ')}<br>`

        if (daysTotal) {
            text += `Дата 1 отзыва: ${date ? formatDate(date) : ''}<br>`
            text += `Отзывов по мес: ${res[0]}, ${res[1]}, ${res[2]}, ${res[3]} <br>`
            text += `К-во по мес: ${toFB(res[0])}, ${toFB(res[1])}, ${toFB(res[2])}, ${toFB(res[3])} <br>`
            text += `Ср. продаж в мес: ${Math.floor((totalSales / daysTotal) * 30)}<br>`
            text += `Мес. в продаже: ${Math.floor(daysTotal / 30)}<br>`
        }
        debugger
        text += `Категория: ${card.subj_name}<br>`
        text += `Вариаций: ${card.colors.length}<br>`
        text += `Root: ${destCards[0].data.products[0].root}<br>`
        text += `<a href="https://www.wildberries.by/product?card=${card.nm_id}" target="_blank">РБ</a>, <a href="https://global.wildberries.ru/product?card=${card.nm_id}" target="_blank">Global</a><br>`

        text += `<button type="button" id="copyButton" class="btn btn-secondary">
                    <i class="fa fa-copy"></i>
                 </button>`

        newDiv.innerHTML = text;
        const copyButton = newDiv.querySelector('#copyButton');
        debugger
        copyButton.addEventListener('click', () => {
            copyButton.disabled = true;

            const row = [
                //Категория
                card.subj_name,
                //Артикул
                card.nm_id,
                //Артикул продавца
                card.vendor_code,
                //Дата создания
                findDateRangeById(card.nm_id),
                //Дата 1 отзыва
                date ? formatDate(date) : '',
                //Всего продаж
                totalSales,
                //Цена за 1 шт
                unitPrice,
                //Выручка
                totalSales * unitPrice,
                //К-во на складах WB
                calcStock(destCards[0], whsMap).wbCount,
                //К-во на складах СП
                calcStock(destCards[0], whsMap).spCount,
                //Отзывов
                onlyFB.length,
                //ID продовца
                card.selling.supplier_id,
                //Имя бренда
                card.selling.brand_name,
                //Количество вариаций
                card.colors.length,
                //root вариации
                destCards[0].data.products[0].root

            ]
            copyToClipboard(row.join('\t'));

            setTimeout(() => {
                copyButton.disabled = false;
            }, 2000);
        });


        if (element.firstChild) {
            element.insertBefore(newDiv, element.firstChild);
        } else {
            element.appendChild(newDiv);
        }
    });
})();
