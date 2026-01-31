import os
import json
import random
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)
LEADERBOARD_FILE = 'leaderboard.json'

def load_leaderboard():
    if not os.path.exists(LEADERBOARD_FILE):
        return []
    with open(LEADERBOARD_FILE, 'r') as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return []

def save_leaderboard(data):
    with open(LEADERBOARD_FILE, 'w') as f:
        json.dump(data, f, indent=4)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/leaderboard')
def get_leaderboard():
    data = load_leaderboard()
    # Sort by score descending
    data.sort(key=lambda x: x['score'], reverse=True)
    return jsonify(data[:10]) # Return top 10

@app.route('/play', methods=['POST'])
def play():
    data = request.json
    player_move = data.get('move')
    
    moves = ['rock', 'paper', 'scissors']
    bot_move = random.choice(moves)
    
    winner = 'draw'
    if player_move == bot_move:
        winner = 'draw'
    elif (player_move == 'rock' and bot_move == 'scissors') or \
         (player_move == 'paper' and bot_move == 'rock') or \
         (player_move == 'scissors' and bot_move == 'paper'):
        winner = 'player'
    else:
        winner = 'bot'
        
    return jsonify({
        'bot_move': bot_move,
        'winner': winner
    })

@app.route('/submit_score', methods=['POST'])
def submit_score():
    data = request.json
    name = data.get('name')
    score = data.get('score')
    
    if not name or score is None:
        return jsonify({'error': 'Invalid data'}), 400
        
    leaderboard = load_leaderboard()
    leaderboard.append({'name': name, 'score': score})
    # Keep it clean, maybe limit size? For now just save all.
    save_leaderboard(leaderboard)
    
    return jsonify({'success': True})

if __name__ == '__main__':
    app.run(debug=True)
