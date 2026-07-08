// This file and the functions within it exist to load all pages of the entire while at start.html. This the end goal is to have all pages load significantly faster, especially when there is no cache.

const pagesToPreload = ['home.html', 'mhc.html', 'ips.html', 'pro.html'];

const pageCache = {};

function extractFragments(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    return {
        title: doc.title || null,
        header: doc.querySelector('h1') ? doc.querySelector('h1').outerHTML : null,
        content: doc.querySelector('.center-text') ? doc.querySelector('.center-text').innerHTML : null,
        song: doc.querySelector('.song-info') ? doc.querySelector('.song-info').innerHTML : null,
        nav: doc.querySelector('.nav-links') ? doc.querySelector('.nav-links').innerHTML : null,
        layout: doc.querySelector('.content-layout') ? doc.querySelector('.content-layout').outerHTML : null,
        bodyClass: doc.body.getAttribute('class') || null
    };
}

async function preloadPage(page) {
    try {
        const res = await fetch(page, { credentials: 'same-origin' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const html = await res.text();
        pageCache[page] = extractFragments(html);
    } catch (err) {
        console.warn('preload failed for', page, err);
    }
}

function schedulePreloads() {
    const work = async () => {
        for (const page of pagesToPreload) {
            if (window.location.pathname.endsWith(page)) continue;
            if (pageCache[page]) continue;
            await preloadPage(page);
            await new Promise(r => setTimeout(r, 120));
        }
    };

    if ('requestIdleCallback' in window) {
        requestIdleCallback(() => work(), { timeout: 2000 });
    } else {
        setTimeout(work, 1500);
    }
}

schedulePreloads();

window.pageCache = pageCache;