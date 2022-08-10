function getResponse(url) {
    return new Promise(function (resolve, reject) {
        let xhr = new XMLHttpRequest();
        xhr.onload = function () {
            if (this.status >= 200 && this.status < 300) {
                resolve(xhr.responseText);
            } else {
                console.warn('Something went wrong: ' + this.status);
                reject();
            }
        };
        xhr.onerror = function () {
            console.warn('Something went wrong: ' + this.status);
            reject();
        };

        xhr.open('GET', url, true);
        xhr.send();
    });
}

/**
 * @param {string} url
 * @returns {Document}
 */
export async function getXml(url) {
    let response = await getResponse(url);
    let parser = new DOMParser();
    return parser.parseFromString(response, 'application/xml');
}

/**
 * @param {string} url
 * @returns {Document}
 */
export async function getHtml(url) {
    let response = await getResponse(url);
    let parser = new DOMParser();
    return parser.parseFromString(response, 'text/html');
}

/**
 * @param {string} url
 * @returns {any}
 */
export async function getJson(url) {
    let response = await getResponse(url);
    return JSON.parse(response);
}
