// This file/function exists to send the client back to the start page if the tab is accessing the website for the first time.

if (!window.location.pathname.endsWith('start.html')) {
    if (!sessionStorage.getItem('sessionStarted')) {
        window.location.href = 'start.html';
    }
} else {
    sessionStorage.setItem('sessionStarted', 'true');
}