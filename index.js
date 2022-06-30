'use strict';

import { getXML, getJSON } from './utils.js';

const urlParams = new URLSearchParams(window.location.search);
const pageInfoDiv = document.getElementById('page-info');
const versionSelection = document.getElementById('versions');

/** @type {{version: string, stable: boolean}[]} */
var mcVersions = [];

(async () => {
    // taken from https://stackoverflow.com/a/1144788
    String.prototype.replaceAll = function (search, replacement) {
        return this.replace(new RegExp(search, 'g'), replacement);
    };

    if (urlParams.has('theme')) {
        if (urlParams.get('theme') == 'legacy') {
            pageInfoDiv.style.display = 'none';
            document.body.setAttribute('data-theme', 'dark');
        } else if (urlParams.get('theme') == 'dark') {
            document.body.setAttribute('data-theme', 'dark');
        }
    } else {
        let theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        document.body.setAttribute('data-theme', theme);
    }

    let link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    if (document.body.getAttribute('data-theme') == 'dark') {
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.5.0/styles/github-dark-dimmed.min.css';
    } else {
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.5.0/styles/default.min.css';
    }
    document.head.appendChild(link);

    console.log('Loading game version data...');
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

    console.log('Loading loader version data...');
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

    console.log('Loading api version data...');
    let apiData = await getXML(versionUrl);
    let apiVersions = Object.entries(apiData.querySelectorAll('version'))
        .map(([key, value]) => value.innerHTML)
        .filter((v) => v.split('+')?.[1] == mcVersion);
    let apiLatest = apiVersions[apiVersions.length - 1];

    for (let block of codeBlocks) {
        block.innerHTML = block.innerHTML.replaceAll('{fabric_version}', apiLatest);
        block.innerHTML = block.innerHTML.replaceAll('{fabric_maven}', mavenStr);
    }
}
