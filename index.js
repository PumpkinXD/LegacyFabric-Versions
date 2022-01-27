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
        let url = new URL(window.location.href);
        url.searchParams.set('version', versionSelection.value);
        window.location.href = url;
    };
}

async function loadData() {
    const mcVersion = versionSelection.value;

    /** @type {{
     * loader: {name: string, separator: string, build: number, maven: string, version: string, stable: boolean},
     * mappings: {gameVersion: string, name: string, separator: string, build: number, maven: string, version: string, stable: boolean}
     * }[]} */
    let data = await getJSON(`https://meta.legacyfabric.net/v1/versions/loader/${mcVersion}`);

    let latest = data[0];
    let codeBlocks = document.getElementsByName('code');
    for (let block of codeBlocks) {
        block.innerHTML = block.innerHTML.replaceAll('{minecraft_version}', latest.mappings.gameVersion);
        block.innerHTML = block.innerHTML.replaceAll('{yarn_version}', latest.mappings.version);
        block.innerHTML = block.innerHTML.replaceAll('{loader_version}', latest.loader.version);
    }

    const versionUrl = 'https://maven.legacyfabric.net/net/legacyfabric/legacy-fabric-api/legacy-fabric-api/maven-metadata.xml';
    const mavenStr = 'net.legacyfabric.legacy-fabric-api:legacy-fabric-api:';

    let apiData = await getXML(versionUrl);
    let apiVersions = Object.entries(apiData.querySelectorAll('version'))
        .map(([key, value]) => value.innerHTML)
        .filter((v) => v.split('+')?.[1] == mcVersion);
    let apiLatest = apiVersions.at(-1);

    for (let block of codeBlocks) {
        block.innerHTML = block.innerHTML.replaceAll('{fabric_version}', apiLatest);
        block.innerHTML = block.innerHTML.replaceAll('{fabric_maven}', mavenStr);
    }
}

/**
 * @see https://stackoverflow.com/a/48969580
 * @param {string} url
 * @returns {Promise<Document>}
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
                reject();
            }
        };
        xhr.onerror = function () {
            console.log('Something went wrong: ' + this.status);
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
                reject();
            }
        };
        xhr.onerror = function () {
            console.log('Something went wrong: ' + this.status);
            reject();
        };
        xhr.send();
    });
}
