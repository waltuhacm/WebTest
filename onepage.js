// Delegated navigation handler so it survives DOM replacements
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
        if (push) window.history.pushState({}, fragments.title || '', url);
        if (!fragments) {
            // fetch full HTML and extract fragments (fallback)
            const res = await fetch(url, { credentials: 'same-origin' });
            const html = await res.text();
            const parser = new DOMParser();
        return { ok: false, error: err };
            fragments = {
                title: doc.title || null,
                header: doc.querySelector('h1') ? doc.querySelector('h1').outerHTML : null,
                content: doc.querySelector('.center-text') ? doc.querySelector('.center-text').innerHTML : null,
                song: doc.querySelector('.song-info') ? doc.querySelector('.song-info').innerHTML : null,
                nav: doc.querySelector('.nav-links') ? doc.querySelector('.nav-links').innerHTML : null,
                bodyClass: doc.body.getAttribute('class') || null,
                // run inline scripts from fetched page (if any)
                inlineScripts: Array.from(doc.querySelectorAll('script')).filter(s => !s.src).map(s => s.textContent)
            };
        }

        // Apply fragments
        if (fragments.header) {
            const currentHeader = document.querySelector('h1');
            if (currentHeader) currentHeader.outerHTML = fragments.header;
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

        // Re-run any inline scripts fetched with the page (best-effort)
        if (fragments.inlineScripts && fragments.inlineScripts.length) {
            fragments.inlineScripts.forEach(code => {
                try {
                    const s = document.createElement('script');
                    s.textContent = code;
                    document.body.appendChild(s);
                    // remove script tag after running to avoid duplicates
                    document.body.removeChild(s);
                } catch (err) {
                    console.warn('Error running inline script from fetched page', err);
                }
            });
        }

        // trigger content animation
        const centerText = document.querySelector('.center-text');
        if (centerText) {
            centerText.classList.remove('fadeIn');
            void centerText.offsetWidth;
            centerText.classList.add('fadeIn');
        }

        if (push) window.history.pushState({}, fragments.title || '', url);
    } catch (err) {
        console.error('Navigation failed', err);
        // fallback to full navigation if something goes wrong
        window.location.href = url;
    }
}

// Handle back/forward
window.addEventListener('popstate', function () {
    navigateTo(location.pathname, false);
});

    // --- Navigation helpers & test harness ---
    function setNavDisabled(state) {
        const nav = document.querySelector('.nav-links');
        if (!nav) return;
        if (state) {
            nav.classList.add('nav-disabled');
            // remove pointer events on links
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

    // Run a simple navigation test over an array of pages (uses cached fragments when available)
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
            // small delay to let DOM settle
            await new Promise(r => setTimeout(r, 150));
            const duration = Math.round(performance.now() - start);

            const actualTitle = document.title;
            const actualHeader = document.querySelector('h1') ? document.querySelector('h1').innerText.trim() : '';

            const okTitle = !expectedTitle || actualTitle === expectedTitle;
            const okHeader = !expectedHeader || actualHeader === expectedHeader;

            const success = okTitle && okHeader && res && res.ok;
            results.push({ page, success, duration, expectedTitle, actualTitle, expectedHeader, actualHeader });
        }

        // show a reporting overlay
        const report = results.map(r => `${r.page}: ${r.success ? 'OK' : 'FAIL'} (${r.duration}ms)`).join('\n');
        showTestReport(report);

        // clear UI state
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

    // expose to console for manual runs
    window.runNavigationTest = runNavigationTest;