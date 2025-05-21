document.addEventListener('DOMContentLoaded', function() {
    const audioElements = {
        homepage1: document.getElementById('audio-homepage1'),
        homepage2: document.getElementById('audio-homepage2'),
        homepage3: document.getElementById('audio-homepage3')
    };

    const playAudio = (homepage) => {
        Object.values(audioElements).forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
        });
        audioElements[homepage].play();
    };

    // Check which homepage is being accessed and play the corresponding audio
    if (window.location.pathname.includes('homepage1.html')) {
        playAudio('homepage1');
    } else if (window.location.pathname.includes('homepage2.html')) {
        playAudio('homepage2');
    } else if (window.location.pathname.includes('homepage3.html')) {
        playAudio('homepage3');
    }
});