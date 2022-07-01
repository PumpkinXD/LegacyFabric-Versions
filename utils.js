/**
 * @see https://stackoverflow.com/a/48969580
 * @param {string} url
 * @returns {Promise<Document>}
 */
export function getXML(url) {
    return new Promise(function (resolve, reject) {
        let xhr = new XMLHttpRequest();
        xhr.onload = function () {
            if (this.status >= 200 && this.status < 300) {
                let parser = new DOMParser();
                let xml = parser.parseFromString(xhr.responseText, 'text/xml');
                resolve(xml);
            } else {
                console.warn('Something went wrong: ' + this.status);
                reject();
            }
        };
        xhr.onerror = function () {
            console.warn('Something went wrong: ' + this.status);
            reject();
        };

        // get around caching issues
        url += '?t=' + new Date().getTime();

        xhr.open('GET', url, true);
        xhr.send();
    });
}

/**
 * @see https://stackoverflow.com/a/48969580
 * @param {string} url
 * @returns {Promise<*>}
 */
export function getJSON(url) {
    return new Promise(function (resolve, reject) {
        let xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'json';
        xhr.onload = function () {
            if (this.status >= 200 && this.status < 300) {
                resolve(xhr.response);
            } else {
                console.warn('Something went wrong: ' + this.status);
                reject();
            }
        };
        xhr.onerror = function () {
            console.warn('Something went wrong: ' + this.status);
            reject();
        };
        xhr.send();
    });
}
