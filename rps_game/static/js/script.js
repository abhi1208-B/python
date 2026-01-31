document.addEventListener('DOMContentLoaded', () => {
    // State
    let currentStreak = 0;
    let bestStreak = 0;
    let isPlaying = false;
    let currentScore = 0; // For leaderboard (simple streak-based score for now)

    // DOM Elements
    const streakDisplay = document.getElementById('current-streak');
    const bestDisplay = document.getElementById('best-streak');
    const resultMessage = document.getElementById('result-message');
    const botDisplay = document.getElementById('bot-display');
    const choiceButtons = document.querySelectorAll('.choice-card');
    const leaderboardList = document.getElementById('leaderboard-list');
    const saveScoreBtn = document.getElementById('save-score-btn');
    const saveModal = document.getElementById('save-modal');
    const cancelSaveBtn = document.getElementById('cancel-save');
    const confirmSaveBtn = document.getElementById('confirm-save');
    const playerNameInput = document.getElementById('player-name');

    // Mappings
    const icons = {
        'rock': '🪨',
        'paper': '📄',
        'scissors': '✂️'
    };

    // Initialize
    fetchLeaderboard();

    // Event Listeners
    choiceButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (isPlaying) return;
            const move = btn.dataset.move;
            playRound(move, btn);
        });
    });

    saveScoreBtn.addEventListener('click', () => {
        if (currentStreak > 0) {
            saveModal.classList.remove('hidden');
        } else {
            alert("Score at least 1 point to save!");
        }
    });

    cancelSaveBtn.addEventListener('click', () => {
        saveModal.classList.add('hidden');
    });

    confirmSaveBtn.addEventListener('click', submitScore);

    // Functions
    async function fetchLeaderboard() {
        try {
            const res = await fetch('/leaderboard');
            const data = await res.json();
            leaderboardList.innerHTML = data.map((entry, index) => `
                <li>
                    <span>#${index + 1} ${entry.name}</span>
                    <span>${entry.score}</span>
                </li>
            `).join('');
        } catch (e) {
            console.error('Failed to fetch leaderboard', e);
        }
    }

    function playRound(playerMove, btnElement) {
        isPlaying = true;

        // UI updates
        choiceButtons.forEach(b => b.classList.remove('selected'));
        btnElement.classList.add('selected');
        resultMessage.textContent = "BATTLE IN PROGRESS...";
        resultMessage.style.color = "#fff";

        // Bot Animation
        botDisplay.innerHTML = '<div class="icon">?</div>';
        botDisplay.className = 'bot-display anim-shake';
        botDisplay.style.borderColor = 'var(--neon-pink)';

        // API Call
        fetch('/play', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ move: playerMove })
        })
            .then(res => res.json())
            .then(data => {
                setTimeout(() => {
                    resolveRound(playerMove, data.bot_move, data.winner);
                }, 800); // Delay for dramatic effect
            })
            .catch(err => {
                console.error(err);
                isPlaying = false;
            });
    }

    function resolveRound(playerMove, botMove, winner) {
        // Stop animation
        botDisplay.classList.remove('anim-shake');

        // Show Bot Choice
        botDisplay.innerHTML = `<div class="icon">${icons[botMove]}</div>`;

        // Determine Result
        if (winner === 'player') {
            resultMessage.textContent = "VICTORY";
            resultMessage.style.color = "var(--neon-green)";
            botDisplay.classList.add('lose-glow');
            currentStreak++;
            currentScore += 10; // 10 points per win
            playWinEffect();
        } else if (winner === 'bot') {
            resultMessage.textContent = "DEFEAT";
            resultMessage.style.color = "#ff3333";
            botDisplay.classList.add('win-glow');
            currentStreak = 0;
            currentScore = Math.max(0, currentScore - 5); // Lose points on defeat? Or just reset streak? 
            // Implementation choice: Just reset streak for clarity, but keep score cumulative per session until refresh?
            // Let's make score = steak * 10 for simplicity in this version, or simple accumulation.
            // Let's stick to currentScore tracking wins in this session.
        } else {
            resultMessage.textContent = "DRAW";
            resultMessage.style.color = "#ffff00";
        }

        // Update Stats
        streakDisplay.textContent = currentStreak;
        if (currentStreak > bestStreak) {
            bestStreak = currentStreak;
            bestDisplay.textContent = bestStreak;
        }

        isPlaying = false;
    }

    function playWinEffect() {
        // Optional: Add screen shake or flash here
        document.body.style.boxShadow = "inset 0 0 50px var(--neon-green)";
        setTimeout(() => {
            document.body.style.boxShadow = "none";
        }, 300);
    }

    function submitScore() {
        const name = playerNameInput.value.trim();
        if (!name) return;

        // Use best streak or current score? Let's use Current Streak as the score metric for the leaderboard as it's more "roguelike"
        // actually let's use the 'currentScore' value which we increment on wins.
        const scoreToSubmit = currentScore;

        fetch('/submit_score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name, score: scoreToSubmit })
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    saveModal.classList.add('hidden');
                    fetchLeaderboard();
                    alert("Score Submitted!");
                }
            });
    }
});
