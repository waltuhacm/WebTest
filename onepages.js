document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', function (e) {
        e.preventDefault();
        const url = this.getAttribute('href');
        const useCache = window.pageCache && window.pageCache[url];
        const getPage = useCache
            ? Promise.resolve(window.pageCache[url])
            : fetch(url).then(response => response.text());
        getPage.then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const newHeader = doc.querySelector('h1');
            const newContent = doc.querySelector('.center-text');
            const newSong = doc.querySelector('.song-info');
            const newNav = doc.querySelector('.nav-links');
            const newBodyClass = doc.body.getAttribute('class');
            if (newHeader && newContent && newSong && newNav) {
                document.querySelector('h1').outerHTML = newHeader.outerHTML;
                document.querySelector('.center-text').innerHTML = newContent.innerHTML;
                document.querySelector('.song-info').innerHTML = newSong.innerHTML;
                document.querySelector('.nav-links').innerHTML = newNav.innerHTML;
                if (newBodyClass !== null) {
                    document.body.setAttribute('class', newBodyClass);
                }
                // Re-trigger animation
                const centerText = document.querySelector('.center-text');
                centerText.classList.remove('fadeIn');
                void centerText.offsetWidth; // Force reflow
                centerText.classList.add('fadeIn');
            }
            window.history.pushState({}, '', url);
        });
    });
});

// Handle browser navigation (back/forward)
window.addEventListener('popstate', function () {
    fetch(location.pathname)
        .then(response => response.text())
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const newHeader = doc.querySelector('h1');
            const newContent = doc.querySelector('.center-text');
            const newSong = doc.querySelector('.song-info');
            const newNav = doc.querySelector('.nav-links');
            const newBodyClass = doc.body.getAttribute('class');
            if (newHeader && newContent && newSong && newNav) {
                document.querySelector('h1').outerHTML = newHeader.outerHTML;
                document.querySelector('.center-text').innerHTML = newContent.innerHTML;
                document.querySelector('.song-info').innerHTML = newSong.innerHTML;
                document.querySelector('.nav-links').innerHTML = newNav.innerHTML;
                if (newBodyClass !== null) {
                    document.body.setAttribute('class', newBodyClass);
                }
                // Re-trigger animation
                const centerText = document.querySelector('.center-text');
                centerText.classList.remove('fadeIn');
                void centerText.offsetWidth; // Force reflow
                centerText.classList.add('fadeIn');
            }
        });
});