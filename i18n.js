const I18N = {
    es: {
        score: 'PUNTUACIÓN',
        level: 'NIVEL',
        next: 'SIGUIENTE',
        play: 'JUGAR',
        playAgain: 'JUGAR DE NUEVO',
        gameOver: 'GAME OVER',
        startMessage: 'Presiona Jugar para empezar',
        scoreMessage: 'Puntuación: ',
        controls: 'Flechas para mover • ↑ Rotar • Espacio Caída rápida'
    },
    en: {
        score: 'SCORE',
        level: 'LEVEL',
        next: 'NEXT',
        play: 'PLAY',
        playAgain: 'PLAY AGAIN',
        gameOver: 'GAME OVER',
        startMessage: 'Press Play to start',
        scoreMessage: 'Score: ',
        controls: 'Arrows to move • ↑ Rotate • Space Hard drop'
    }
};

let currentLang = navigator.language.startsWith('es') ? 'es' : 'en';
const TEXTS = I18N[currentLang];

function updateTexts() {
    document.getElementById('lbl-score').textContent = TEXTS.score;
    document.getElementById('lbl-level').textContent = TEXTS.level;
    document.getElementById('lbl-next').textContent = TEXTS.next;
    document.getElementById('start-btn').textContent = TEXTS.play;
    document.getElementById('overlay-message').textContent = TEXTS.startMessage;
    document.getElementById('controls-hint').textContent = TEXTS.controls;
}
