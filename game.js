(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");

  const scoreEl = document.getElementById("score");
  const highScoreEl = document.getElementById("high-score");
  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlay-title");
  const overlayText = document.getElementById("overlay-text");
  const startBtn = document.getElementById("start-btn");

  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;
  const GROUND_Y = HEIGHT - 40;

  const GRAVITY = 1800;
  const JUMP_VELOCITY = -640;
  const BASE_SPEED = 320;

  const HIGH_SCORE_KEY = "jackal-dash-high-score";

  let jackal, obstacles, speed, score, elapsed, running, spawnTimer, lastTime;

  function loadHighScore() {
    try {
      return Number(localStorage.getItem(HIGH_SCORE_KEY)) || 0;
    } catch {
      return 0;
    }
  }

  function saveHighScore(value) {
    try {
      localStorage.setItem(HIGH_SCORE_KEY, String(value));
    } catch {
      /* localStorage unavailable — ignore */
    }
  }

  let highScore = loadHighScore();
  highScoreEl.textContent = highScore;

  function resetState() {
    jackal = {
      x: 60,
      y: GROUND_Y,
      width: 44,
      height: 34,
      vy: 0,
      onGround: true,
    };
    obstacles = [];
    speed = BASE_SPEED;
    score = 0;
    elapsed = 0;
    spawnTimer = 0;
    running = false;
    lastTime = null;
    scoreEl.textContent = "0";
  }

  function jump() {
    if (!running) return;
    if (jackal.onGround) {
      jackal.vy = JUMP_VELOCITY;
      jackal.onGround = false;
    }
  }

  function spawnObstacle() {
    const height = 28 + Math.random() * 26;
    obstacles.push({
      x: WIDTH + 10,
      width: 22 + Math.random() * 14,
      height,
      y: GROUND_Y + jackal.height - height,
    });
  }

  function rectsOverlap(a, ax, ay, b, bx, by) {
    return ax < bx + b.width && ax + a.width > bx && ay < by + b.height && ay + a.height > by;
  }

  function update(dt) {
    elapsed += dt;
    speed = BASE_SPEED + elapsed * 18;
    score += dt * 10;
    scoreEl.textContent = String(Math.floor(score));

    jackal.vy += GRAVITY * dt;
    jackal.y += jackal.vy * dt;
    if (jackal.y >= GROUND_Y) {
      jackal.y = GROUND_Y;
      jackal.vy = 0;
      jackal.onGround = true;
    }

    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawnObstacle();
      spawnTimer = 1.1 + Math.random() * 0.9 - Math.min(elapsed * 0.01, 0.5);
      spawnTimer = Math.max(spawnTimer, 0.55);
    }

    const jackalTop = jackal.y - jackal.height;
    for (const rock of obstacles) {
      rock.x -= speed * dt;
      if (
        rectsOverlap(
          { width: jackal.width, height: jackal.height },
          jackal.x,
          jackalTop,
          rock,
          rock.x,
          rock.y
        )
      ) {
        gameOver();
        return;
      }
    }
    obstacles = obstacles.filter((rock) => rock.x + rock.width > -10);
  }

  function drawBackground() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    const bob = Math.sin(elapsed * 1.5) * 2;
    ctx.beginPath();
    ctx.ellipse(120, 60 + bob, 40, 14, 0, 0, Math.PI * 2);
    ctx.ellipse(600, 40 + bob, 30, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(58, 35, 18, 0.5)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y + jackal.height);
    ctx.lineTo(WIDTH, GROUND_Y + jackal.height);
    ctx.stroke();
  }

  function drawJackal() {
    const topY = jackal.y - jackal.height;
    ctx.save();
    ctx.translate(jackal.x, topY);

    ctx.fillStyle = "#5a3a22";
    ctx.beginPath();
    ctx.roundRect(0, 6, jackal.width, jackal.height - 6, 8);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(jackal.width - 4, 0);
    ctx.lineTo(jackal.width + 12, 8);
    ctx.lineTo(jackal.width - 4, 16);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#f3e0b8";
    ctx.beginPath();
    ctx.arc(jackal.width + 6, 12, 3.5, 0, Math.PI * 2);
    ctx.fill();

    const legPhase = jackal.onGround ? Math.sin(elapsed * 20) * 6 : 0;
    ctx.fillStyle = "#3d2513";
    ctx.fillRect(6, jackal.height - 4, 8, 8 + legPhase * 0.3);
    ctx.fillRect(jackal.width - 16, jackal.height - 4, 8, 8 - legPhase * 0.3);

    ctx.restore();
  }

  function drawObstacles() {
    ctx.fillStyle = "#7a5233";
    for (const rock of obstacles) {
      ctx.beginPath();
      ctx.roundRect(rock.x, rock.y, rock.width, rock.height, 4);
      ctx.fill();
    }
  }

  function draw() {
    drawBackground();
    drawObstacles();
    drawJackal();
  }

  function loop(timestamp) {
    if (!running) return;
    if (lastTime === null) lastTime = timestamp;
    const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
    lastTime = timestamp;

    update(dt);
    if (!running) return;
    draw();
    requestAnimationFrame(loop);
  }

  function startGame() {
    resetState();
    running = true;
    overlay.hidden = true;
    requestAnimationFrame(loop);
  }

  function gameOver() {
    running = false;
    const finalScore = Math.floor(score);
    if (finalScore > highScore) {
      highScore = finalScore;
      saveHighScore(highScore);
    }
    highScoreEl.textContent = highScore;

    overlayTitle.textContent = "Game Over";
    overlayText.textContent = `You scored ${finalScore}. Best: ${highScore}. Press Space or tap to try again.`;
    startBtn.textContent = "Play Again";
    overlay.hidden = false;
  }

  function handleActivate() {
    if (!running) {
      startGame();
    } else {
      jump();
    }
  }

  startBtn.addEventListener("click", handleActivate);
  canvas.addEventListener("pointerdown", handleActivate);
  window.addEventListener("keydown", (e) => {
    if (e.code === "Space" || e.code === "ArrowUp") {
      e.preventDefault();
      handleActivate();
    }
  });

  resetState();
  draw();
})();
