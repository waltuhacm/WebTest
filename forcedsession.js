if (!window.location.pathname.endsWith('start.html')) {
    if (!sessionStorage.getItem('sessionStarted')) {
        window.location.href = 'start.html';
    }
} else {
    sessionStorage.setItem('sessionStarted', 'true');
}