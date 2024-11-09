const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const gridSize = 50;
const cellSize = canvas.width / gridSize;
const playerSize = cellSize * 2;
const tentSize = cellSize * 2;
let score = 0;
let greenDotsCollected = 0;
let countdown = 30;
let gameOver = false;

const playerSpeed = cellSize;
const vampireSpeed = playerSpeed / 2;
const aggressiveVampireSpeed = playerSpeed;
const chaseDistance = 30;

let difficultyMultiplier = 1;
let intervalID;

// Player start position
let playerX = Math.floor(gridSize / 2) * cellSize;
let playerY = Math.floor(gridSize / 2) * cellSize;

// Arrays for characters (🧍‍♂️ and 🚶🏼‍♀️), obstacles (🕴️), tents (🎪), and takeout boxes (🥡)
let characters = [];
let obstacles = [];
let tents = [];
let takeoutBoxes = [];

// Vampire patrol position
let vampire = { x: 0, y: 0 };

// Joystick setup
const joystick = nipplejs.create({
    zone: document.body,
    mode: 'static',
    position: { left: '50%', bottom: '20%' },
    color: 'gray',
    size: 100
});

// Event listener for joystick movements
joystick.on('move', (evt, data) => {
    if (gameOver) return;

    let dx = 0;
    let dy = 0;

    if (data.direction) {
        switch (data.direction.angle) {
            case 'up':
                dy = -playerSpeed;
                break;
            case 'down':
                dy = playerSpeed;
                break;
            case 'left':
                dx = -playerSpeed;
                break;
            case 'right':
                dx = playerSpeed;
                break;
        }
    }

    movePlayer(dx, dy);
});

function movePlayer(dx, dy) {
    const newX = Math.max(0, Math.min(playerX + dx, canvas.width - playerSize));
    const newY = Math.max(0, Math.min(playerY + dy, canvas.height - playerSize));

    if (!isCollisionWithTent(newX, newY)) {
        playerX = newX;
        playerY = newY;
    }

    checkCollisions();
}

function setupLevel() {
    characters = [];
    obstacles = [];
    tents = [];
    takeoutBoxes = [];
    countdown = Math.max(10, 30 - 5 * (difficultyMultiplier - 1));
    greenDotsCollected = 0;

    for (let i = 0; i < 10; i++) {
        characters.push(generateRandomPosition());
    }
    for (let i = 0; i < 5 * difficultyMultiplier; i++) {
        obstacles.push(generateRandomPosition());
    }
    for (let i = 0; i < 20; i++) {
        let position;
        do {
            position = generateRandomPosition();
        } while (isPositionOccupied(position));
        tents.push(position);
    }
    for (let i = 0; i < 3; i++) {
        let position;
        do {
            position = generateRandomPosition();
        } while (isPositionOccupied(position));
        takeoutBoxes.push(position);
    }

    vampire.x = 0;
    vampire.y = 0;

    clearInterval(intervalID);
    intervalID = setInterval(updateCountdown, 1000);
}

function generateRandomPosition() {
    return {
        x: Math.floor(Math.random() * gridSize) * cellSize,
        y: Math.floor(Math.random() * gridSize) * cellSize
    };
}

function isCollisionWithTent(x, y) {
    return tents.some(tent => 
        x < tent.x + tentSize && x + playerSize > tent.x &&
        y < tent.y + tentSize && y + playerSize > tent.y
    );
}

function isPositionOccupied(position) {
    return characters.some(char => char.x === position.x && char.y === position.y) ||
           obstacles.some(obstacle => obstacle.x === position.x && obstacle.y === position.y) ||
           takeoutBoxes.some(box => box.x === position.x && box.y === position.y);
}

function checkCollisions() {
    characters = characters.filter((char) => {
        if (playerX < char.x + cellSize && playerX + playerSize > char.x &&
            playerY < char.y + cellSize && playerY + playerSize > char.y) {
            score++;
            greenDotsCollected++;
            return false;
        }
        return true;
    });

    for (const obstacle of obstacles) {
        if (playerX < obstacle.x + cellSize && playerX + playerSize > obstacle.x &&
            playerY < obstacle.y + cellSize && playerY + playerSize > obstacle.y) {
            gameOver = true;
            clearInterval(intervalID);
            return;
        }
    }

    takeoutBoxes = takeoutBoxes.filter((box) => {
        if (playerX < box.x + cellSize && playerX + playerSize > box.x &&
            playerY < box.y + cellSize && playerY + playerSize > box.y) {
            countdown += 5;
            return false;
        }
        return true;
    });

    if (playerX < vampire.x + cellSize && playerX + playerSize > vampire.x &&
        playerY < vampire.y + cellSize && playerY + playerSize > vampire.y) {
        gameOver = true;
        clearInterval(intervalID);
    }

    if (characters.length === 0) {
        difficultyMultiplier++;
        setupLevel();
    }
}

function updateCountdown() {
    countdown--;
    if (countdown <= 0) {
        gameOver = true;
        clearInterval(intervalID);
    }
    moveVampire();
}

function moveVampire() {
    const distanceToPlayer = Math.hypot(playerX - vampire.x, playerY - vampire.y);
    let speed = vampireSpeed;

    if (distanceToPlayer <= chaseDistance) {
        speed = aggressiveVampireSpeed;
        const dx = playerX - vampire.x;
        const dy = playerY - vampire.y;
        vampire.x += Math.sign(dx) * speed;
        vampire.y += Math.sign(dy) * speed;
    } else {
        const directions = [
            { x: 0, y: -speed },
            { x: 0, y: speed },
            { x: -speed, y: 0 },
            { x: speed, y: 0 }
        ];
        const randomDirection = directions[Math.floor(Math.random() * directions.length)];
        vampire.x = Math.max(0, Math.min(vampire.x + randomDirection.x, canvas.width - cellSize));
        vampire.y = Math.max(0, Math.min(vampire.y + randomDirection.y, canvas.height - cellSize));
    }
}

function updateGame() {
    if (gameOver) {
        ctx.fillStyle = "black";
        ctx.font = "24px Arial";
        ctx.fillText("Game Over!", canvas.width / 2 - 60, canvas.height / 2);
        ctx.fillText("Score: " + score, canvas.width / 2 - 50, canvas.height / 2 + 30);
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "blue";
    ctx.fillRect(playerX, playerY, playerSize, playerSize);

    ctx.font = "20px Arial";
    characters.forEach((char, index) => {
        const characterEmoji = index % 2 === 0 ? "🧍‍♂️" : "🚶🏼‍♀️";
        ctx.fillText(characterEmoji, char.x + cellSize / 4, char.y + cellSize);
    });

    obstacles.forEach(obstacle => {
        ctx.fillText("🕴️", obstacle.x + cellSize / 4, obstacle.y + cellSize);
    });

    tents.forEach(tent => {
        ctx.fillText("🎪", tent.x + cellSize / 4, tent.y + cellSize);
    });

    takeoutBoxes.forEach(box => {
        ctx.fillText("🥡", box.x + cellSize / 4, box.y + cellSize);
    });

    ctx.fillText("🧛‍♂️", vampire.x + cellSize / 4, vampire.y + cellSize);

    ctx.fillStyle = "black";
    ctx.font = "16px Arial";
    ctx.fillText("Score: " + score, 10, 20);
    ctx.fillText("Captured: " + greenDotsCollected, 10, 40);
    ctx.fillText("Time Left: " + countdown + "s", 10, 60);

    requestAnimationFrame(updateGame);
}

// Initialize game
setupLevel();
updateGame();
