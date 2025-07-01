const pagesToPreload = [
    'home.html',
    'mhc.html',
    'ips.html',
    'ccp.html'
];

const pageCache = {};

pagesToPreload.forEach(page => {
    if (!window.location.pathname.endsWith(page)) {
        fetch(page)
            .then(res => res.text())
            .then(html => {
                pageCache[page] = html;
            });
    }
});

// // Export cache for use in onepage.js
// window.pageCache = pageCache;