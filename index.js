'use strict';

import { getHtml, getJson } from './request.js';

const urlParams = new URLSearchParams(window.location.search);
const pageInfoDiv = document.getElementById('page-info');
const versionSelection = document.getElementById('versions');

/** @type {{version: string, stable: boolean}[]} */
var mcVersions = [];

(async () => {
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
    mcVersions = await getJson('https://meta.legacyfabric.net/v1/versions/game');
    await initVersionSelection();
    await loadData();
})();

function initVersionSelection() {
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
    let data = await getJson(`https://meta.legacyfabric.net/v1/versions/loader/${mcVersion}`);

    let latest = data[0];
    let codeBlocks = document.getElementsByName('code');
    for (let block of codeBlocks) {
        block.innerHTML = block.innerHTML.replace('{minecraft_version}', latest.mappings.gameVersion);
        block.innerHTML = block.innerHTML.replace('{yarn_version}', latest.mappings.version);
        block.innerHTML = block.innerHTML.replace('{loader_version}', latest.loader.version);
    }

    const versionUrl = 'https://maven.legacyfabric.net/net/legacyfabric/legacy-fabric-api/legacy-fabric-api/';
    const mavenStr = 'net.legacyfabric.legacy-fabric-api:legacy-fabric-api:';
    let apiLatest = undefined;

    console.log('Loading api version data...');
    try {
        let apiData = await getHtml(versionUrl);
        let apiVersions = Object.entries(apiData.querySelectorAll('a'))
            .map(([key, value]) => value.innerHTML.slice(0, -1))
            .filter((v) => v.split('+')?.[1] == mcVersion);
        apiLatest = apiVersions[apiVersions.length - 1];
    } catch (error) {
        // fallback if maven request fails
        console.warn('Failed to load latest api version, using hardcoded fallback!');
        if (['1.12.2', '1.11.2', '1.10.2', '1.9.4', '1.8.9', '1.8', '1.7.10'].includes(mcVersion)) {
            apiLatest = `1.7.0+${mcVersion}`;
        }
    }

    for (let block of codeBlocks) {
        block.innerHTML = block.innerHTML.replace('{fabric_version}', apiLatest);
        block.innerHTML = block.innerHTML.replace('{fabric_maven}', mavenStr);
    }
}
