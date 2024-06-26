// ==UserScript==
// @name         WB position
// @namespace    http://tampermonkey.net/
// @version      3
// @description  try to take over the world!
// @author       You
// @match        https://www.wildberries.ru/catalog/*/search.aspx*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=wildberries.ru
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @require      https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js
// ==/UserScript==

const limit = 100
const concurrency = 5
const repeatTimeout = 1500
const numRepeat = 5
const searchSuccessDef = 30

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



const wbIdDate = [
    { id: 141493346, date: new Date('2023/01/01') },
    { id: 158515409, date: new Date('2023/07/05') },
    { id: 175622396, date: new Date('2023/09/04') },
    { id: 190895459, date: new Date('2023/10/22') },
    { id: 196330686, date: new Date('2023/12/14') },
    { id: 198425821, date: new Date('2023/12/26') },
    { id: 199432698, date: new Date('2024/01/05') },
    { id: 200281863, date: new Date('2024/01/14') },
    { id: 204996659, date: new Date('2024/01/25') },
    { id: 209748396, date: new Date('2024/02/12') },
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

function showProgressBar() {
    const progressContainer = document.getElementById('progressContainer');
    updateProgressBar(0)
    progressContainer.style.display = 'block'; // Показать блок прогресса
}

function hideProgressBar() {
    const progressContainer = document.getElementById('progressContainer');
    progressContainer.style.display = 'none'; // Скрыть блок прогресса
}

function updateProgressBar(percentage) {
    const progressBar = document.getElementById('progressBar');
    progressBar.style.width = percentage + '%';
    progressBar.setAttribute('aria-valuenow', percentage);
    progressBar.textContent = parseInt(percentage) + '%';
}

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

function createDestinationOptions() {
    return Object.keys(DESTINATIONS).map(key =>
                                         `<option value="${key}">${key}</option>`
    ).join('');
}

const getImageURLWB = (productId, order = 1) => {
    const vol = parseInt(productId / 100000, 10);
    const part = parseInt(productId / 1000, 10);
    const random = Date.now();

    const basket = getBasketNumber(productId);
    const basketWithZero = basket < 10 ? `0${basket}` : basket;

    const URL = `https://basket-${basketWithZero}.wbbasket.ru/vol${vol}/part${part}/${productId}/images/c516x688/${order}.jpg?r=${random}`
    return URL
};

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

const genNewUserID = function () {
    var t = Math.floor((new Date).getTime() / 1e3),
        e = Math.floor(Math.random() * Math.pow(2, 30)).toString() + t.toString();
    return e;
};

const formatCurrentDate = function () {
    const d = new Date();
    const year = d.getFullYear();
    const month = ('0' + (d.getMonth() + 1)).slice(-2); // месяцы начинаются с 0
    const day = ('0' + d.getDate()).slice(-2);
    const hour = ('0' + d.getHours()).slice(-2);
    const minute = ('0' + d.getMinutes()).slice(-2);
    const second = ('0' + d.getSeconds()).slice(-2);
    return `${year}${month}${day}${hour}${minute}${second}`;
};

const getQueryIdForSearch = function () {
    const res = `qid${genNewUserID()}${formatCurrentDate()}`;
    console.log(res)
    return res
};


(function () {
    'use strict';
    var allProductsGlobal = []
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

    // Функция для генерации заголовков
    function getHeaders() {
        return {
            "x-queryid": getQueryIdForSearch()
        }
    }

    function getTotalSaleUrl(ids) {
        return `https://product-order-qnt.wildberries.ru/v2/by-nm/?nm=${ids.join(',')}`;
    }

    function getSearchUrl(sQuery, dest, page, sort) {
        let encodedQuery = encodeURIComponent(sQuery.query);
        if (!sort) sort = 'popular'

        let url = `https://search.wb.ru/exactmatch/ru/common/v4/search?query=${encodedQuery}&resultset=catalog&limit=${limit}&sort=${sort}&lang=ru&dest=${dest.ids.join(',')}&spp=30&curr=rub&suppressSpellcheck=false`
        if (page != 1) url += `&page=${page}`
        //let url = `https://search.wb.ru/exactmatch/ru/common/v4/search?query=${encodedQuery}&resultset=catalog&limit=${limit}&sort=${sort}&page=${page}&appType=1&lang=ru&dest=${dest.ids.join(',')}&spp=29&curr=rub& suppressSpellcheck=false&uclusters=8`

        if (sQuery.urlParams.size > 0) {
            url += `&${sQuery.urlParams.toString()}`
        }

        return {
            headers: {
                referrer: `https://www.wildberries.ru/catalog/0/search.aspx?page=${page}&sort=popular&search=${encodedQuery}`
            },
            url
        }
    }

    function getLikeBrouserPageSearchUrl(query, page, sort) {
        let encodedQuery = encodeURIComponent(query);
        return `https://www.wildberries.ru/catalog/0/search.aspx?page=${page}&sort=${sort}&search=${encodedQuery}`;
    }


    function getTotalUrl(sQuery, dest) {
        let encodedQuery = encodeURIComponent(sQuery.query);
        let url = `https://search.wb.ru/exactmatch/ru/common/v4/search?TestGroup=no_test&TestID=no_test&curr=rub&dest=${dest.ids.join(',')}&filters=xsubject&query=${encodedQuery}&resultset=filters&spp=30&suppressSpellcheck=false`
        if (sQuery.urlParams.size > 0) {
            url += `&${sQuery.urlParams.toString()}`
        }
        return url
    }

    function getSearchQuery(excludes = []) {
        // Разбор URL и извлечение параметра 'search'
        excludes = ['search', 'sort', 'page', ...excludes]
        const urlParams = new URLSearchParams(window.location.search);
        const searchQuery = urlParams.get('search');
        const sort = urlParams.get('sort');

        excludes.forEach(v => urlParams.delete(v))

        // Декодирование строки запроса
        const decodedSearchQuery = decodeURIComponent(searchQuery);
        return { query: decodedSearchQuery, sort, urlParams }
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }


    function fetchDataMK(reqObj) {
        return new Promise((resolve, reject) => {
            let url = ''
            let headers = getHeaders()

            if (typeof reqObj === 'string') {
                url = reqObj
            } else {
                url = reqObj.url
                if (reqObj.headers) {
                    headers = { ...headers, ...reqObj.headers }
                }
            }

            GM_xmlhttpRequest({
                method: "GET",
                url,
                headers,
                onreadystatechange: function (response) {
                    if (response.readyState === 4) {
                        if (response.status >= 200 && response.status < 300) {
                            resolve({
                                ok: true,
                                json: () => (response.RESPONSE_TYPE_JSON === 'json') ? JSON.parse(response.responseText) : {}
                            });
                        } else {
                            reject(new Error('Request failed with status ' + response.status));
                        }
                    }
                },
                referrer: "https://www.wildberries.ru/catalog/0/search.aspx?search=%D0%BE%D0%B1%D0%BE%D0%B8%20%D0%B1%D1%83%D0%BC%D0%B0%D0%B6%D0%BD%D1%8B%D0%B5",
                referrerPolicy: "no-referrer-when-downgrade",
                mode: "cors",
                credentials: "omit"
            });
        });
    }

    async function fetchData(url, requestInit) {
        const resp = await fetch(url, requestInit)
        return resp
    }

    async function fetchWithRetry(url, urlWhenErr = null, checkRepeat = (data) => false, numRetries = numRepeat) {
        for (let i = 0; i < numRepeat; i++) {
            let controller;
            try {
                //                if ((i > 2) && (urlWhenErr)) {
                //                    const resp = await fetchData(urlWhenErr)
                //                    await resp.text();
                //                    await sleep(repeatTimeout);
                //                }
                //                const response = await fetchData, {signal: controller.signal})//, { headers }); // Передаём заголовки в fetch
                const response = await fetchDataMK(url)
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const res = await response.json();
                if (checkRepeat(res)) {
                    throw new Error('Force repeat')
                }
                return res
            } catch (err) {
                console.error(`Attempt ${i + 1}: Error fetching data -`, err.message, url);
                if (i === numRepeat - 1) throw err;
                await sleep(repeatTimeout);
            }
        }
    }

    async function fetchTotalSales(ids) {
        const baseUrl = getTotalSaleUrl(ids)
        let data = [];
        try {
            data = await fetchWithRetry(baseUrl);
            if ((!data) || (!data.length)) return []
            return data
        } catch (error) {
            console.error('Failed to fetch products:', error);
            return [];
        }
    }


    async function fetchProducts(dest, pageObj, sortQuery, fetchTotalCount = false) {
        const q = getSearchQuery(['page', 'limit'])
        const baseUrl = getSearchUrl(q, dest, pageObj.page, sortQuery || q.sort)

        let data = [];
        try {
            //const urlLikeErr = getLikeBrouserPageSearchUrl(q.query, (pageObj.page * limit) / 100, q.sort)
            data = await fetchWithRetry(baseUrl, '', (data) => {
                console.log('length:', data.data.products.length)
                return (pageObj.shouldBe !== 1) && (data.data.products.length === 1)
            }
                                       );
            if ((!data.data)) return [] //Значит завершаем

            if (fetchTotalCount) {
                const totalCounts = await fetchTotalSales(data.data.products.map(v => v.id))
                const map = new Map(totalCounts.map(v => [v.nmId, v.qnt]))

                data.data.products.forEach((v, indx) => {
                    const num = map.get(v.id)
                    if (!num) return
                    data.data.products[indx].totalCount = num
                })
            }

            return data.data.products // Возвращаем только массив продуктов
        } catch (error) {
            console.error('Failed to fetch products:', error);
            return [];
        }
    }

    function createCardHtml(item) {
        const borderStyle = item.isAd ? 'border: 2px solid red;' : '';
        return `
    <div class="col-lg-1 col-md-2 col-sm-3 col-xs-4">
        <div class="card h-100" style="${borderStyle}">
            <a href="${item.url}" target="_blank">
                <img src="${item.img}" class="card-img-top" alt="Фото" style="object-fit: contain; max-height: 150px;">
            </a>
            <div class="card-body text-center" style="padding: 0.1rem;">
               <p class="card-text" style="font-size: 0.7em;">
                    <strong>${item.num}: ${item.pos}${item.isAd ? `←${item.adPos}` : ''}<br>
                    дост:${item.delivHour}ч<br>
                    ${item.raw.salePriceU / 100}₽<br>
                    ${item.adCpm ? `${item.adTp} ${item.adCpm}₽<br>` : ''}
                    прод:${item.raw.totalCount ? `${item.raw.totalCount}<br>` : '0'}
                    </strong>
                    ${findDateRangeById(item.id)}
                  </p>
            </div>
        </div>
    </div>
    `;
    }

    const emptyProd = {
        id: 1
    }

    async function writeResult(allProducts, status, isAdd) {
        const findSel = []

        const f = allProducts.forEach((v, i) => {
            if (isAdd(v)) {
                findSel.push({
                    pos: i + 1,
                    num: findSel.length + 1,
                    isAd: (v.log.position) ? true : false,
                    adCpm: (v.log.cpm) ? v.log.cpm : 0,
                    adPos: (v.log.position) ? v.log.position : 0,
                    adTp: (v.log.tp) ? v.log.tp === 'b' ? 'АР' : 'АУКЦ' : '',
                    delivHour: v.time1 + v.time2,
                    id: v.id,
                    img: getImageURLWB(v.id),
                    url: `https://www.wildberries.ru/catalog/${v.id}/detail.aspx`,
                    raw: v
                })

            }
        })
        let resultList = findSel.map(item => createCardHtml(item)).join('');

        status.innerHTML = `
    <div class="container-fluid mt-3">
        <div class="row row-cols-1 row-cols-md-3 g-4">
            ${resultList}
        </div>
    </div>`;
        return findSel
    }

    // Функция для создания строки TSV из данных
    function createTsvData(items) {
        return items.map(item => `${item.id}\t${item.pos}`).join('\n');
    }

    // Функция для копирования текста в буфер обмена
    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            console.log('Текст скопирован в буфер обмена');
        }).catch(err => {
            console.error('Ошибка при копировании текста: ', err);
        });
    }

    async function getAllProducts(dest, deepRead, status, sortQuery, fetchTotalCount) {
        let allProducts = [];
        status.textContent = '.'

        status.textContent = `Служебный запрос`;
        const totalResp = await fetchWithRetry(getTotalUrl(getSearchQuery(['page', 'limit']), dest))
        const total = Math.min(totalResp.data.total, deepRead)
        console.log(`Total: ${totalResp.data.total}`)
        status.textContent = `Запрос данных`;

        let totalRead = 0
        let exception = null
        const fetchHandler = async (obj, indx) => {
            try {
                const products = await fetchProducts(dest, obj, sortQuery, fetchTotalCount)
                totalRead += products.length
                status.textContent = `${totalRead} из ${total}`;
                updateProgressBar((totalRead / total) * 100)
                return { products, page: obj }
            } catch (error) {
                exception = error
                return { products: [], page: obj.page, breakChain: true }
            }
        }

        const af = new AsyncFetch(concurrency, fetchHandler)
        const pageLen = Math.ceil(total / limit)

        const pages = Array(pageLen).fill().map((_, i) => {
            const shouldBe = i === pageLen - 1 ? total % limit || limit : limit;
            return { page: i + 1, shouldBe };
        });

        const products = await af.fetchAll(pages)
        if (exception !== null) throw exception
        console.log(`Answ:`, products.map(v => v.products.length))

        let codeRes = 'ok'

        products.forEach(v => {
            //Если не получили то заполняем пустышками
            if (v.products.length < v.page.shouldBe) {
                codeRes = 'notfull'
                allProducts.push(...Array(v.page.shouldBe).fill().map(_ => emptyProd))
            }
            else allProducts.push(...v.products)
        })

        return { allProducts, codeRes }
    }


    waitForElement('.catalog-page__searching-results', async (element) => {
        const newDiv = document.createElement('div');
        newDiv.innerHTML = `
            <div class="my-3">
                <div class="row gx-2">
                    <div class="col-sm-1">
                        <input type="text" id="myParameter" class="form-control" placeholder="ид продавца">
                    </div>
                    <div class="col-sm-2">
                        <select id="wbDestinationSelect" class="form-select">
                            ${createDestinationOptions()}
                        </select>
                        </div>
                    <div class="col-sm-1">
                        <input type="number" min="300" max="18000" id="deepRead" class="form-control" placeholder="глубина чтения">
                    </div>
                    <div class="col-sm-1">
                        <button type="button" id="findPositionsButton" class="btn btn-primary">Скан</button>
                    </div>
                    <div class="col-sm-1">
                        <input type="number" min="1" max="1000000" id="searchSuccess"  class="form-control" placeholder="КолПродУсп" value="${searchSuccessDef}">
                    </div>
                    <div class="col-sm-1">
                        <button type="button" id="findNewSuccSellersButton" class="btn btn-primary">НовУсп</button>
                    </div>
                    <div class="col-sm-1">
                        <button type="button" id="copyButton" class="btn btn-secondary" style="display: none;">
                           <i class="fa fa-copy"></i>
                        </button>
                    </div>
                    <div  class="col-sm-2">
                        <span id="status"></span> <!-- Добавлен элемент для отображения статуса -->
                    </div>
                </div>
            </div>
            <div class="row" style="display: none;" id="progressContainer">
               <div class="progress">
                  <div id="progressBar" class="progress-bar" role="progressbar" style="width: 0%;" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">0%</div>
               </div>
            </div>
            <div class="row">
               <div id="outBG" class="container mt-3"></div>
            </div>
        `;

        const input = newDiv.querySelector('#myParameter');
        const deepRead = newDiv.querySelector('#deepRead');
        const destinationSelect = newDiv.querySelector('#wbDestinationSelect');
        const findPositionsButton = newDiv.querySelector('#findPositionsButton');
        const searchSuccess = newDiv.querySelector('#searchSuccess');
        const findNewSuccSellersButton = newDiv.querySelector('#findNewSuccSellersButton');
        const statusSpan = newDiv.querySelector('#status');
        const outBG = newDiv.querySelector('#outBG');
        const copyButton = newDiv.querySelector('#copyButton');
        const disElem = [input, destinationSelect, findPositionsButton, deepRead]

        copyButton.addEventListener('click', () => {
            const tsvData = createTsvData(allProductsGlobal);
            copyToClipboard(tsvData);
        });

        // Загрузка сохраненного значения при инициализации
        input.value = localStorage.getItem('myParameter') || '';
        input.addEventListener('blur', () => { localStorage.setItem('myParameter', input.value) });

        searchSuccess.value = localStorage.getItem('searchSuccess') || searchSuccessDef;
        searchSuccess.addEventListener('blur', () => { localStorage.setItem('searchSuccess', searchSuccess.value) });

        deepRead.value = localStorage.getItem('deepRead') || '';
        const deepReadCheck = () => {
            if (deepRead.value < 300) deepRead.value = 300
            if (deepRead.value > 18000) deepRead.value = 18000
            return deepRead.value
        }
        deepReadCheck()
        deepRead.addEventListener('blur', () => {
            deepReadCheck()
            localStorage.setItem('deepRead', deepRead.value)
        });

        destinationSelect.value = localStorage.getItem('wbDestination') || 'MOSCOW'
        // Обработка изменения select для сохранения
        destinationSelect.addEventListener('change', () => {
            localStorage.setItem('wbDestination', destinationSelect.value);
        });

        const beginFetch = () => {
            disElem.forEach(v => { v.disabled = true })
            copyButton.style.display = 'none'
            statusSpan.style.color = 'black';
            showProgressBar()
        }

        const endFetch = () => {
            hideProgressBar()
            disElem.forEach(v => { v.disabled = false })
            if (allProductsGlobal.length > 0) copyButton.style.display = 'block'; // Показать кнопку после загрузки данных
        }

        findNewSuccSellersButton.addEventListener('click', async () => {
            beginFetch()
            try {
                const prod = await getAllProducts(DESTINATIONS[destinationSelect.value], parseInt(deepRead.value), statusSpan, 'newly', true)
                allProductsGlobal = await writeResult(prod.allProducts, outBG, (v) => searchSuccess.value <= v.totalCount)
                statusSpan.textContent = prod.codeRes
            }
            catch (e) {
                statusSpan.style.color = 'red';
                statusSpan.textContent = 'Ошибка чтения!. Повторите еще'
            }
            endFetch()
        });


        // Обработчик клика для вашей кнопки "Найти позиции"
        findPositionsButton.addEventListener('click', async () => {
            beginFetch()

            try {
                const prod = await getAllProducts(DESTINATIONS[destinationSelect.value], parseInt(deepRead.value), statusSpan, '', true)
                const supplierId = parseInt(input.value)
                allProductsGlobal = await writeResult(prod.allProducts, outBG, (v) => supplierId === v.supplierId)
                statusSpan.textContent = prod.codeRes
            }
            catch (e) {
                statusSpan.style.color = 'red';
                statusSpan.textContent = 'Ошибка чтения!. Повторите еще'
            }
            endFetch()
        });

        newDiv.style.marginBottom = '20px';
        newDiv.style.marginLeft = '10px';
        element.parentNode.insertBefore(newDiv, element.nextSibling);
    })
})();
