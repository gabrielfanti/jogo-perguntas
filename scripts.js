let questions = [];
let currentQuestionIndex = 0;
let playerName = '';
let score = 0;
let gameStarted = false;
const maxQuestions = 20;
let socket;

document.getElementById('csvFileInput').addEventListener('change', handleFileSelect);
document.getElementById('submitAnswer').addEventListener('click', checkAnswer);
document.getElementById('nextQuestion').addEventListener('click', showNextQuestion);
document.getElementById('startGame').addEventListener('click', startGame);

function handleFileSelect(event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function(e) {
        const text = e.target.result;
        parseCSV(text);
        if (!gameStarted && questions.length > 0) {
            gameStarted = true;
            startGame();
            showNextQuestion(); // Mostra a primeira pergunta automaticamente
        }
    };

    reader.readAsText(file);
}

function parseCSV(text) {
    const lines = text.split('\n');
    questions = [];
    for (let line of lines) {
        const [question, answer] = line.split(',');
        questions.push({ question, answer: answer.trim() });
    }
    questions = questions.slice(0, maxQuestions);
}

function showNextQuestion() {
    const questionContainer = document.getElementById('question-container');
    if (currentQuestionIndex < questions.length) {
        const questionObj = questions[currentQuestionIndex];
        questionContainer.style.display = 'block';
        document.getElementById('question').textContent = questionObj.question;
        document.getElementById('answer').value = '';
        document.getElementById('result').textContent = '';
        currentQuestionIndex++;
    } else {
        endGame();
    }
}

function checkAnswer() {
    const userAnswer = document.getElementById('answer').value.trim();
    const correctAnswer = questions[currentQuestionIndex - 1].answer;

    if (userAnswer === correctAnswer) {
        document.getElementById('result').textContent = 'Correto! Boa resposta! 😊';
        score += 100;
        document.getElementById('currentScore').textContent = score;
        updateScore();
    } else {
        document.getElementById('result').textContent = 'Errado. Tente novamente! 😅';
    }
}

function startGame() {
    playerName = document.getElementById('playerName').value.trim();
    if (playerName === '') {
        alert('Por favor, insira seu nome.');
        return;
    }

    document.getElementById('currentPlayer').textContent = playerName;
    document.getElementById('nameModal').style.display = 'none';

    socket = new WebSocket('ws://localhost:8080');

    socket.onopen = function() {
        socket.send(JSON.stringify({ type: 'join', name: playerName }));
    };

    socket.onmessage = function(event) {
        const data = JSON.parse(event.data);
        if (data.type === 'scoreboard') {
            updateScoreboard(data.scoreboard);
        }
    };
}

function updateScore() {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'updateScore', name: playerName, score: score }));
    }
}

function updateScoreboard(scoreboard) {
    const scoreboardList = document.getElementById('scoreboardList');
    scoreboardList.innerHTML = '';

    scoreboard.forEach((player, index) => {
        const listItem = document.createElement('li');
        listItem.textContent = `${index + 1}. ${player.name}: ${player.score} pontos`;
        scoreboardList.appendChild(listItem);
    });
}

function endGame() {
    if (socket) {
        socket.close();
    }
    displayPodium();
}

function displayPodium() {
    const podiumModal = document.getElementById('podiumModal');
    const podiumList = document.getElementById('podiumList');
    const scoreboard = JSON.parse(localStorage.getItem('scoreboard')) || [];

    podiumList.innerHTML = '';
    scoreboard.slice(0, 3).forEach((player, index) => {
        const listItem = document.createElement('li');
        listItem.textContent = `${index + 1}. ${player.name}: ${player.score} pontos`;
        podiumList.appendChild(listItem);
    });

    podiumModal.style.display = 'flex';
}

window.onload = function() {
    document.getElementById('nameModal').style.display = 'flex';
};