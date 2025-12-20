const pagesToPreload = ['home.html', 'mhc.html', 'ips.html', 'ccp.html'];

// pageCache stores extracted fragments rather than full HTML to reduce memory
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
        // Don't fail the rest of the preloads
        console.warn('preload failed for', page, err);
    }
}

function schedulePreloads() {
    const work = async () => {
        for (const page of pagesToPreload) {
            if (window.location.pathname.endsWith(page)) continue;
            if (pageCache[page]) continue;
            await preloadPage(page);
            // small gap to avoid pounding the network
            await new Promise(r => setTimeout(r, 120));
        }
    };

    if ('requestIdleCallback' in window) {
        requestIdleCallback(() => work(), { timeout: 2000 });
    } else {
        // Delay slightly so page load isn't impacted
        setTimeout(work, 1500);
    }
}

schedulePreloads();

// Export cache for use in `onepage.js`
window.pageCache = pageCache;