// This file and the functions within it exist to try and help with preload.js by handling the actual the navigation and content swapping when going between pages. The end goal is to avoid having the whole site refresh fully with each click.
document.addEventListener('click', function (e) {
    const anchor = e.target.closest('.nav-links a');
    if (!anchor) return;
    e.preventDefault();
    navigateTo(anchor.getAttribute('href'));
});

async function navigateTo(url, push = true) {
    try {
        const cache = window.pageCache && window.pageCache[url];
        let fragments = cache;
        if (!fragments) {
            const res = await fetch(url, { credentials: 'same-origin' });
            const html = await res.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            fragments = {
                title: doc.title || null,
                header: doc.querySelector('h1') ? doc.querySelector('h1').outerHTML : null,
                content: doc.querySelector('.center-text') ? doc.querySelector('.center-text').innerHTML : null,
                song: doc.querySelector('.song-info') ? doc.querySelector('.song-info').innerHTML : null,
                nav: doc.querySelector('.nav-links') ? doc.querySelector('.nav-links').innerHTML : null,
                layout: doc.querySelector('.content-layout') ? doc.querySelector('.content-layout').outerHTML : null,
                bodyClass: doc.body.getAttribute('class') || null,
                inlineScripts: Array.from(doc.querySelectorAll('script')).filter(s => !s.src).map(s => s.textContent)
            };
        }

        if (fragments.header) {
            const currentHeader = document.querySelector('h1');
            if (currentHeader) currentHeader.outerHTML = fragments.header;
        }

        if (fragments.layout !== undefined) {
            const currentLayout = document.querySelector('.content-layout');
            if (fragments.layout) {
                if (currentLayout) {
                    currentLayout.outerHTML = fragments.layout;
                } else {
                    const oldCenterText = document.querySelector('.center-text');
                    if (oldCenterText && !oldCenterText.closest('.content-layout')) {
                        oldCenterText.remove();
                    }
                    const currentNav = document.querySelector('.nav-links');
                    if (currentNav) {
                        currentNav.insertAdjacentHTML('afterend', fragments.layout);
                    }
                }
            } else if (currentLayout) {
                currentLayout.remove();
                if (!document.querySelector('.center-text')) {
                    const placeholder = document.createElement('div');
                    placeholder.className = 'center-text';
                    const currentNav = document.querySelector('.nav-links');
                    if (currentNav) currentNav.insertAdjacentElement('afterend', placeholder);
                }
            }
        }

        if (fragments.content) {
            const currentContent = document.querySelector('.center-text');
            if (currentContent) currentContent.innerHTML = fragments.content;
        }

        if (fragments.song) {
            const currentSong = document.querySelector('.song-info');
            if (currentSong) currentSong.innerHTML = fragments.song;
        }

        if (fragments.nav) {
            const currentNav = document.querySelector('.nav-links');
            if (currentNav) currentNav.innerHTML = fragments.nav;
        }

        if (fragments.bodyClass !== null) {
            document.body.setAttribute('class', fragments.bodyClass);
        }

        if (fragments.title) {
            document.title = fragments.title;
        }

        if (fragments.inlineScripts && fragments.inlineScripts.length) {
            fragments.inlineScripts.forEach(code => {
                try {
                    const s = document.createElement('script');
                    s.textContent = code;
                    document.body.appendChild(s);
                    document.body.removeChild(s);
                } catch (err) {
                    console.warn('Error running inline script from fetched page', err);
                }
            });
        }

        const centerText = document.querySelector('.center-text');
        if (centerText) {
            centerText.classList.remove('fadeIn');
            void centerText.offsetWidth;
            centerText.classList.add('fadeIn');
        }

        const contentLayout = document.querySelector('.content-layout');
        if (contentLayout) {
            contentLayout.classList.remove('fadeIn');
            void contentLayout.offsetWidth;
            contentLayout.classList.add('fadeIn');
        }

        const centerContainer = document.querySelector('.center-container');
        if (centerContainer) {
            centerContainer.classList.remove('fadeIn');
            void centerContainer.offsetWidth;
            centerContainer.classList.add('fadeIn');
        }

        if (push) window.history.pushState({}, fragments.title || '', url);
        return { ok: true };
    } catch (err) {
        console.error('Navigation failed', err);
        window.location.href = url;
    }
}

window.addEventListener('popstate', function () {
    navigateTo(location.pathname, false);
});

function setNavDisabled(state) {
    const nav = document.querySelector('.nav-links');
    if (!nav) return;
    if (state) {
        nav.classList.add('nav-disabled');
        nav.querySelectorAll('a').forEach(a => a.setAttribute('aria-disabled', 'true'));
    } else {
        nav.classList.remove('nav-disabled');
        nav.querySelectorAll('a').forEach(a => a.removeAttribute('aria-disabled'));
    }
}

function showLoading(on) {
    let overlay = document.getElementById('nav-loading-overlay');
    if (on) {
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'nav-loading-overlay';
            overlay.style.position = 'fixed';
            overlay.style.top = '12px';
            overlay.style.right = '12px';
            overlay.style.padding = '8px 12px';
            overlay.style.background = 'rgba(0,0,0,0.7)';
            overlay.style.color = '#fff';
            overlay.style.borderRadius = '6px';
            overlay.style.zIndex = 9999;
            overlay.textContent = 'Loading...';
            document.body.appendChild(overlay);
        }
        overlay.style.display = 'block';
    } else if (overlay) {
        overlay.style.display = 'none';
    }
}

function stripTags(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html || '';
    return tmp.textContent || tmp.innerText || '';
}

async function runNavigationTest(pages = null) {
    const toTest = pages || Object.keys(window.pageCache || {}).filter(p => !!window.pageCache[p]);
    if (!toTest.length) {
        console.warn('No pages available in cache to test. Call after preloads complete.');
        return { total: 0, results: [] };
    }

    const results = [];
    for (const page of toTest) {
        const expected = window.pageCache && window.pageCache[page];
        const expectedTitle = expected && expected.title;
        const expectedHeader = expected && stripTags(expected.header);

        const start = performance.now();
        const res = await navigateTo(page, false);
        await new Promise(r => setTimeout(r, 150));
        const duration = Math.round(performance.now() - start);

        const actualTitle = document.title;
        const actualHeader = document.querySelector('h1') ? document.querySelector('h1').innerText.trim() : '';

        const okTitle = !expectedTitle || actualTitle === expectedTitle;
        const okHeader = !expectedHeader || actualHeader === expectedHeader;

        const success = okTitle && okHeader && res && res.ok;
        results.push({ page, success, duration, expectedTitle, actualTitle, expectedHeader, actualHeader });
    }

    const report = results.map(r => `${r.page}: ${r.success ? 'OK' : 'FAIL'} (${r.duration}ms)`).join('\n');
    showTestReport(report);

    showLoading(false);
    setNavDisabled(false);

    console.table(results);
    return { total: results.length, results };
}

function showTestReport(text) {
    let out = document.getElementById('nav-test-report');
    if (!out) {
        out = document.createElement('pre');
        out.id = 'nav-test-report';
        out.style.position = 'fixed';
        out.style.bottom = '12px';
        out.style.right = '12px';
        out.style.padding = '12px';
        out.style.background = 'rgba(0,0,0,0.8)';
        out.style.color = '#fff';
        out.style.borderRadius = '6px';
        out.style.zIndex = 9999;
        out.style.maxWidth = '320px';
        out.style.whiteSpace = 'pre-wrap';
        document.body.appendChild(out);
    }
    out.textContent = text;
    setTimeout(() => { if (out) out.remove(); }, 6000);
}

window.runNavigationTest = runNavigationTest;