'use strict';

const urlParams = new URLSearchParams(window.location.search);
const versionSelection = document.getElementById('versions');

/** @type {{version: string, stable: boolean}[]} */
var mcVersions = [];

(async () => {
    //Taken from https://stackoverflow.com/questions/1144783/how-to-replace-all-occurrences-of-a-string-in-javascript
    String.prototype.replaceAll = function (search, replacement) {
        return this.replace(new RegExp(search, 'g'), replacement);
    };

    mcVersions = await getJSON('https://meta.legacyfabric.net/v1/versions/game');
    await initVersionSelect();
    await loadData();
})();

function initVersionSelect() {
    for (let version of mcVersions) {
        let option = document.createElement('option');
        option.text = version.version;
        versionSelection.add(option);
    }

    if (urlParams.has('version')) {
        versionSelection.value = urlParams.get('version');
    } else {
        versionSelection.value = '1.8.9';
    }

    versionSelection.onchange = () => {
        var url = new URL(window.location.href);
        url.searchParams.set('version', versionSelection.value);
        window.location.href = url;
    };
}

async function loadData() {
    const version = versionSelection.value;

    /** @type {{
     * loader: {name: string, separator: string, build: number, maven: string, version: string, stable: boolean},
     * mappings: {gameVersion: string, name: string, separator: string, build: number, maven: string, version: string, stable: boolean}
     * }[]} */
    let data = await getJSON(`https://meta.legacyfabric.net/v1/versions/loader/${version}`);

    var meta = data[0];
    var codeBlocks = document.getElementsByName('code');
    for (let block of codeBlocks) {
        block.innerHTML = block.innerHTML.replaceAll('{minecraft_version}', meta.mappings.gameVersion);
        block.innerHTML = block.innerHTML.replaceAll('{yarn_version}', meta.mappings.version);
        block.innerHTML = block.innerHTML.replaceAll('{loader_version}', meta.loader.version);
    }

    /* // TODO: fix api version
    var versionUrl = 'https://maven.legacyfabric.net/net/legacyfabric/legacy-fabric-api/legacy-fabric-api/maven-metadata.xml';

    let daata = await getXML(versionUrl);
    console.log(daata);

    findVersion(versionUrl, "", (version) => {
        var codeBlocks = document.getElementsByName('code');
        for (let block of codeBlocks) {
            block.innerHTML = block.innerHTML.replaceAll('{fabric_version}', version);
            block.innerHTML = block.innerHTML.replaceAll('{fabric_maven}', mavenStr);
        }
    });*/
}

/**
 * @see https://stackoverflow.com/a/48969580
 * @param {string} url
 * @returns {Promise<*>}
 */
function getXML(url) {
    return new Promise(function (resolve, reject) {
        let xhr = new XMLHttpRequest();
        xhr.onload = function () {
            if (this.status >= 200 && this.status < 300) {
                let parser = new DOMParser();
                let xml = parser.parseFromString(xhr.responseText, 'text/xml');
                resolve(xml);
            } else {
                console.log('Something went wrong: ' + this.status);
                reject({
                    status: this.status,
                    statusText: xhr.statusText
                });
            }
        };
        xhr.onerror = function () {
            console.log('Something went wrong: ' + this.status);
            reject({
                status: this.status,
                statusText: xhr.statusText
            });
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
function getJSON(url) {
    return new Promise(function (resolve, reject) {
        let xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'json';
        xhr.onload = function () {
            if (this.status >= 200 && this.status < 300) {
                resolve(xhr.response);
            } else {
                console.log('Something went wrong: ' + this.status);
                reject({
                    status: this.status,
                    statusText: xhr.statusText
                });
            }
        };
        xhr.onerror = function () {
            console.log('Something went wrong: ' + this.status);
            reject({
                status: this.status,
                statusText: xhr.statusText
            });
        };
        xhr.send();
    });
}
