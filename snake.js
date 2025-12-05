const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Adapter la taille du canvas à la fenêtre
let TILE_SIZE = 0;
let GRID_WIDTH = 0;
let GRID_HEIGHT = 0;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  // Recalculer TILE_SIZE et les dimensions de grille après redimensionnement
  const GRID_SIZE = 22;
  TILE_SIZE = Math.floor(
    Math.min(canvas.width, canvas.height) / GRID_SIZE
  );
  GRID_WIDTH = Math.floor(canvas.width / TILE_SIZE);
  GRID_HEIGHT = Math.floor(canvas.height / TILE_SIZE);
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// Configuration pour une vitesse rapide
const GRID_SIZE = 22;

let snake = [
  { x: Math.floor(GRID_SIZE / 2), y: Math.floor(GRID_SIZE / 2) },
  { x: Math.floor(GRID_SIZE / 2) - 1, y: Math.floor(GRID_SIZE / 2) },
  { x: Math.floor(GRID_SIZE / 2) - 2, y: Math.floor(GRID_SIZE / 2) },
];

// MODIFICATION: Enlever Facebook et Canva de la liste des logos
const logosSrc = [
  "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg",
  "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg",
  "https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg",
  "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg",
   "https://upload.wikimedia.org/wikipedia/commons/9/91/Octicons-mark-github.svg",
  "https://upload.wikimedia.org/wikipedia/commons/3/33/Figma-logo.svg",
  "https://upload.wikimedia.org/wikipedia/commons/6/6f/Logo_of_Twitter.svg",
];

const logoNames = [
  "GOOGLE",
  "AMAZON",
  "MICROSOFT",
  "APPLE",
  "GITHUB",
  "FIGMA",
  "TWITTER",
];

const logoPoints = [25, 18, 20, 30, 35, 32, 16];

// Couleurs pour le serpent (cycle de couleurs)
const snakeColors = [
  // MODIFICATION: Commencer par le bleu au lieu du rouge
  { head: "#0000ff", body: "#0080ff", name: "BLUE" }, // Bleu
  { head: "#00ff00", body: "#80ff80", name: "GREEN" }, // Vert (anciennement rouge/orange)
  { head: "#ffff00", body: "#ffcc00", name: "YELLOW" }, // Jaune
  { head: "#ff00ff", body: "#cc00cc", name: "PURPLE" }, // Violet
  { head: "#00ffff", body: "#00cccc", name: "CYAN" }, // Cyan
  { head: "#ff6600", body: "#ff9900", name: "ORANGE" }, // Orange vif
  { head: "#9900ff", body: "#cc66ff", name: "MAGENTA" }, // Magenta
  { head: "#00ff99", body: "#00cc99", name: "TURQUOISE" }, // Turquoise
  { head: "#ff0066", body: "#ff3399", name: "PINK" }, // Rose
  { head: "#00ff00", body: "#00cc00", name: "NEON GREEN" }, // Vert néon
];

// Charger les images des logos
const logos = [];
let logosLoaded = 0;
const totalLogos = logosSrc.length;

function loadLogos() {
  logosSrc.forEach((src, index) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      logosLoaded++;
      if (logosLoaded === totalLogos) {
        console.log("Tous les logos sont chargés");
        food = generateFood();
        draw();
      }
    };
    img.onerror = () => {
      console.error("Erreur de chargement du logo:", src);
      logosLoaded++;
      const fallbackImg = new Image();
      // MODIFICATION: Utiliser la couleur bleue pour les logos de secours
      fallbackImg.src =
        "data:image/svg+xml;base64," +
        btoa(`
              <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
                <rect width="100" height="100" fill="#0000ff"/>
                <text x="50" y="50" font-family="Arial" font-size="30" fill="#000" text-anchor="middle" dy=".3em">${logoNames[
                  index
                ].charAt(0)}</text>
              </svg>
            `);
      logos.push({
        img: fallbackImg,
        name: logoNames[index],
        points: logoPoints[index],
      });
      if (logosLoaded === totalLogos) {
        food = generateFood();
        draw();
      }
    };
    img.src = src;
    logos.push({
      img: img,
      name: logoNames[index],
      points: logoPoints[index],
    });
  });
}

let food = null;

let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };
let score = 0;
// MODIFICATION: Supprimer la variable bestScore
let level = 1;
let gameRunning = false;
let gamePaused = false;
let gameSpeed = 35;
let frameCount = 0;
let logosEaten = 0;
let speedMultiplier = 3.0;
// MODIFICATION: Commencer avec l'index 0 qui est maintenant le bleu
let currentColorIndex = 0;
let currentColors = snakeColors[0];

// MODIFICATION: Supprimer l'affichage du best score
document.getElementById("logosEaten").textContent = logosEaten;
updateSpeedDisplay();
updateColorDisplay();

function updateSpeedDisplay() {
  let speedText = "ULTRA FAST";
  if (speedMultiplier > 4.0) speedText = "EXTREME";
  if (speedMultiplier > 5.0) speedText = "INSANE";
  if (speedMultiplier > 6.0) speedText = "ULTRA";
  if (speedMultiplier > 7.0) speedText = "GODLIKE";
  if (speedMultiplier > 8.0) speedText = "LIGHTNING";
  if (speedMultiplier > 9.0) speedText = "IMPOSSIBLE";
  document.getElementById(
    "speedDisplay"
  ).textContent = `SPEED: ${speedText}`;
}

function updateColorDisplay() {
  document.getElementById(
    "colorDisplay"
  ).textContent = `COLOR: ${currentColors.name}`;
  document.getElementById("colorDisplay").style.color =
    currentColors.head;
  document.getElementById(
    "colorDisplay"
  ).style.textShadow = `0 0 8px ${currentColors.head}`;
}

// Fonctions pour les effets sonores
function playEatSound() {
  const sound = document.getElementById("eatSound");
  sound.currentTime = 0;
  sound.volume = 0.3;
  sound.play().catch((e) => console.log("Audio error:", e));
}

function playMoveSound() {
  const sound = document.getElementById("moveSound");
  sound.currentTime = 0;
  sound.volume = 0.1;
  sound.play().catch((e) => console.log("Audio error:", e));
}

function playGameOverSound() {
  const sound = document.getElementById("gameOverSound");
  sound.currentTime = 0;
  sound.volume = 0.4;
  sound.play().catch((e) => console.log("Audio error:", e));
}

function playFlameSound() {
  const sound = document.getElementById("flameSound");
  sound.currentTime = 0;
  sound.volume = 0.3;
  sound.play().catch((e) => console.log("Audio error:", e));
}

function playColorChangeSound() {
  const sound = document.getElementById("colorChangeSound");
  sound.currentTime = 0;
  sound.volume = 0.4;
  sound.play().catch((e) => console.log("Audio error:", e));
}

// Fonction pour afficher le message d'autonomie
function showAutonomyMessage() {
  const message = document.getElementById("autonomyMessage");
  message.style.color = currentColors.head;
  message.style.borderColor = currentColors.head;
  message.style.boxShadow = `0 0 40px ${currentColors.head},
          inset 0 0 30px ${currentColors.body}`;
  message.style.animation = "none";
  void message.offsetWidth;
  message.style.animation = "autonomyMessage 1.5s ease forwards";
}

// Fonction pour créer des effets de flamme
function createFlameEffect(x, y) {
  playFlameSound();

  // Effet de flamme principal
  const flame = document.createElement("div");
  flame.className = "flame-effect";
  flame.style.background = `radial-gradient(circle, ${currentColors.head}, ${currentColors.body}, #b3ffb3, transparent 80%)`;
  flame.style.left = `${x - 75}px`;
  flame.style.top = `${y - 75}px`;
  document.body.appendChild(flame);

  // Particules de flamme
  for (let i = 0; i < 20; i++) {
    setTimeout(() => {
      const particle = document.createElement("div");
      particle.className = "flame-particle";
      particle.style.left = `${x}px`;
      particle.style.top = `${y}px`;
      particle.style.backgroundColor =
        i % 3 === 0
          ? currentColors.head
          : i % 3 === 1
          ? currentColors.body
          : "#b3ffb3";
      particle.style.setProperty(
        "--tx",
        `${(Math.random() - 0.5) * 200}px`
      );
      particle.style.setProperty(
        "--ty",
        `${(Math.random() - 0.5) * 200}px`
      );
      document.body.appendChild(particle);

      setTimeout(() => {
        if (particle.parentNode)
          particle.parentNode.removeChild(particle);
      }, 1000);
    }, i * 20);
  }

  setTimeout(() => {
    if (flame.parentNode) flame.parentNode.removeChild(flame);
  }, 800);
}

// Fonction pour créer un effet de changement de couleur
function createColorChangeEffect(x, y) {
  playColorChangeSound();

  const colorEffect = document.createElement("div");
  colorEffect.className = "color-change-effect";
  colorEffect.style.background = `radial-gradient(circle, ${currentColors.head}, ${currentColors.body}, transparent 70%)`;
  colorEffect.style.left = `${x - 100}px`;
  colorEffect.style.top = `${y - 100}px`;
  document.body.appendChild(colorEffect);

  setTimeout(() => {
    if (colorEffect.parentNode)
      colorEffect.parentNode.removeChild(colorEffect);
  }, 2000);
}

// Fonction pour changer la couleur du serpent
function changeSnakeColor() {
  currentColorIndex = (currentColorIndex + 1) % snakeColors.length;
  currentColors = snakeColors[currentColorIndex];
  updateColorDisplay();
}

// Couleurs de base
const colors = {
  background: "rgba(10, 30, 10, 0.4)", // Changé à vert
  grid: "rgba(0, 255, 0, 0.2)", // Changé à vert
};

function generateFood() {
  if (logos.length === 0) return null;

  let newFood;
  let collision = true;
  while (collision) {
    const logoIndex = Math.floor(Math.random() * logos.length);
    newFood = {
      x: Math.floor(Math.random() * GRID_WIDTH),
      y: Math.floor(Math.random() * GRID_HEIGHT),
      logo: logos[logoIndex],
      logoIndex: logoIndex,
    };
    collision = snake.some(
      (segment) => segment.x === newFood.x && segment.y === newFood.y
    );
  }

  // Mettre à jour l'affichage du nom du logo courant
  if (newFood && newFood.logo && newFood.logo.name) {
    document.getElementById("currentLogoName").textContent =
      newFood.logo.name;
  }

  return newFood;
}

function drawRetroGrid() {
  ctx.strokeStyle = colors.grid;
  ctx.lineWidth = 1;
  for (let x = 0; x < canvas.width; x += TILE_SIZE) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += TILE_SIZE) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
}

function drawPlatformLogo(x, y, logoData) {
  if (!logoData || !logoData.img) return;

  const centerX = x * TILE_SIZE + TILE_SIZE / 2;
  const centerY = y * TILE_SIZE + TILE_SIZE / 2;
  // MODIFICATION: Augmenter la taille des logos (de 1.0 à 1.4)
  const size = TILE_SIZE * 1.4;

  // MODIFICATION: Augmenter l'animation pour les logos plus grands
  const scale = 0.9 + 0.3 * Math.sin(food.frame * 0.12);
  const offsetY = 10 * Math.sin(food.frame * 0.1);
  const rotation = food.frame * 0.03;

  ctx.save();
  ctx.translate(centerX, centerY + offsetY);
  ctx.scale(scale, scale);
  ctx.rotate(rotation);

  // MODIFICATION: Agrandir l'ombre du logo
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.beginPath();
  ctx.arc(0, 0, size / 2 + 4, 0, Math.PI * 2);
  ctx.fill();

  try {
    // MODIFICATION: Agrandir le logo
    ctx.drawImage(logoData.img, -size / 2, -size / 2, size, size);
  } catch (e) {
    ctx.fillStyle = currentColors.head;
    ctx.beginPath();
    ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#000";
    // MODIFICATION: Agrandir la police pour les logos de secours
    ctx.font = `bold ${size / 2.2}px "Press Start 2P"`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const shortName = logoData.name.substring(0, 3);
    ctx.fillText(shortName, 0, 0);
  }

  ctx.restore();

  if (food && food.frame % 10 < 6) {
    ctx.shadowColor = currentColors.head;
    ctx.shadowBlur = 30; // MODIFICATION: Augmenter le flou de l'ombre
    ctx.strokeStyle = currentColors.body;
    ctx.lineWidth = 5; // MODIFICATION: Augmenter l'épaisseur du contour
    ctx.beginPath();
    // MODIFICATION: Agrandir le contour lumineux
    ctx.arc(centerX, centerY + offsetY, size / 2 + 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
}

function draw() {
  ctx.fillStyle = colors.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawRetroGrid();

  snake.forEach((segment, index) => {
    if (index === 0) {
      const gradient = ctx.createLinearGradient(
        segment.x * TILE_SIZE,
        segment.y * TILE_SIZE,
        segment.x * TILE_SIZE + TILE_SIZE,
        segment.y * TILE_SIZE + TILE_SIZE
      );
      gradient.addColorStop(0, currentColors.head);
      gradient.addColorStop(0.5, currentColors.body);
      gradient.addColorStop(1, currentColors.head);

      ctx.fillStyle = gradient;
      ctx.shadowColor = currentColors.head;
      ctx.shadowBlur = 30;
      ctx.fillRect(
        segment.x * TILE_SIZE,
        segment.y * TILE_SIZE,
        TILE_SIZE,
        TILE_SIZE
      );

      ctx.fillStyle = "#000";
      const eyeSize = TILE_SIZE / 3;
      if (direction.x === 1) {
        ctx.fillRect(
          segment.x * TILE_SIZE + TILE_SIZE - eyeSize - 3,
          segment.y * TILE_SIZE + TILE_SIZE / 3,
          eyeSize,
          eyeSize
        );
        ctx.fillRect(
          segment.x * TILE_SIZE + TILE_SIZE - eyeSize - 3,
          segment.y * TILE_SIZE + TILE_SIZE - eyeSize - TILE_SIZE / 3,
          eyeSize,
          eyeSize
        );
      } else if (direction.x === -1) {
        ctx.fillRect(
          segment.x * TILE_SIZE + 3,
          segment.y * TILE_SIZE + TILE_SIZE / 3,
          eyeSize,
          eyeSize
        );
        ctx.fillRect(
          segment.x * TILE_SIZE + 3,
          segment.y * TILE_SIZE + TILE_SIZE - eyeSize - TILE_SIZE / 3,
          eyeSize,
          eyeSize
        );
      } else if (direction.y === -1) {
        ctx.fillRect(
          segment.x * TILE_SIZE + TILE_SIZE / 3,
          segment.y * TILE_SIZE + 3,
          eyeSize,
          eyeSize
        );
        ctx.fillRect(
          segment.x * TILE_SIZE + TILE_SIZE - eyeSize - TILE_SIZE / 3,
          segment.y * TILE_SIZE + 3,
          eyeSize,
          eyeSize
        );
      } else {
        ctx.fillRect(
          segment.x * TILE_SIZE + TILE_SIZE / 3,
          segment.y * TILE_SIZE + TILE_SIZE - eyeSize - 3,
          eyeSize,
          eyeSize
        );
        ctx.fillRect(
          segment.x * TILE_SIZE + TILE_SIZE - eyeSize - TILE_SIZE / 3,
          segment.y * TILE_SIZE + TILE_SIZE - eyeSize - 3,
          eyeSize,
          eyeSize
        );
      }
    } else {
      const gradient = ctx.createLinearGradient(
        segment.x * TILE_SIZE,
        segment.y * TILE_SIZE,
        segment.x * TILE_SIZE + TILE_SIZE,
        segment.y * TILE_SIZE + TILE_SIZE
      );
      if (index % 2 === 0) {
        gradient.addColorStop(0, currentColors.body);
        gradient.addColorStop(1, currentColors.head);
      } else {
        gradient.addColorStop(0, currentColors.head);
        gradient.addColorStop(1, currentColors.body);
      }

      ctx.fillStyle = gradient;
      ctx.shadowColor = currentColors.body;
      ctx.shadowBlur = 20;
      ctx.fillRect(
        segment.x * TILE_SIZE,
        segment.y * TILE_SIZE,
        TILE_SIZE,
        TILE_SIZE
      );

      ctx.strokeStyle = "#000";
      ctx.lineWidth = 1;
      ctx.strokeRect(
        segment.x * TILE_SIZE + 2,
        segment.y * TILE_SIZE + 2,
        TILE_SIZE - 4,
        TILE_SIZE - 4
      );
    }
  });

  ctx.shadowBlur = 0;

  if (food) {
    food.frame = (food.frame || 0) + 1;
    drawPlatformLogo(food.x, food.y, food.logo);
  }
}

function update() {
  if (!gameRunning || gamePaused || !food) return;

  frameCount++;
  const speedThreshold = Math.max(1, gameSpeed / speedMultiplier);
  if (frameCount < speedThreshold) return;

  if (frameCount % 5 === 0) {
    playMoveSound();
  }

  frameCount = 0;

  direction = nextDirection;

  const head = {
    x: (snake[0].x + direction.x + GRID_WIDTH) % GRID_WIDTH,
    y: (snake[0].y + direction.y + GRID_HEIGHT) % GRID_HEIGHT,
  };

  if (
    snake.some((segment) => segment.x === head.x && segment.y === head.y)
  ) {
    endGame();
    return;
  }

  snake.unshift(head);

  if (food && head.x === food.x && head.y === food.y) {
    score += food.logo.points * level;
    logosEaten++;

    document.getElementById("score").textContent = score;
    document.getElementById("logosEaten").textContent = logosEaten;

    // Effets sonores et visuels
    playEatSound();
    showAutonomyMessage();
    createFlameEffect(
      head.x * TILE_SIZE + TILE_SIZE / 2,
      head.y * TILE_SIZE + TILE_SIZE / 2
    );

    // Changement de couleur à chaque fois qu'un logo est mangé
    changeSnakeColor();
    createColorChangeEffect(
      head.x * TILE_SIZE + TILE_SIZE / 2,
      head.y * TILE_SIZE + TILE_SIZE / 2
    );

    // Augmenter la vitesse
    if (logosEaten % 1 === 0) {
      speedMultiplier += 0.5;
      updateSpeedDisplay();
    }

    // NOUVELLE CONDITION: Si 10 logos sont mangés, aller vers la page de félicitations
    if (logosEaten >= 10) {
      victory();
      return; // Arrêter l'update pour éviter les conflits
    }

    // MODIFICATION: Supprimer l'incrémentation du level
    food = generateFood();
  } else {
    snake.pop();
  }
}

// NOUVELLE FONCTION: Victoire
function victory() {
  gameRunning = false;
  gamePaused = false;
  
  // Jouer un son de victoire
  playEatSound(); // Réutiliser le son de manger pour l'instant
  
  // Afficher un message de victoire temporaire
  const message = document.getElementById("autonomyMessage");
  message.textContent = "VICTOIRE! 10 LOGOS MANGÉS!";
  message.style.color = "#00ff00";
  message.style.borderColor = "#00ff00";
  message.style.animation = "none";
  void message.offsetWidth;
  message.style.animation = "autonomyMessage 2s ease forwards";
  
  // Rediriger vers la page de félicitations après un délai
  setTimeout(() => {
    window.location.href = "felecitation.html"; // Note: le fichier s'appelle "felecitation.html"
  }, 2000); // 2 secondes pour voir le message
}
function endGame() {
  gameRunning = false;
  gamePaused = false;
  document.getElementById("pauseBtn").textContent = "Pause";

  // MODIFICATION: Supprimer la logique de best score
  document.getElementById("finalScore").textContent = score;
  // MODIFICATION: Supprimer l'affichage du level final
  document.getElementById("finalLogos").textContent = logosEaten;
  document.getElementById("finalSpeed").textContent = document
    .getElementById("speedDisplay")
    .textContent.replace("SPEED: ", "");
  document.getElementById("finalColor").textContent = currentColors.name;
  document.getElementById("finalColor").style.color = currentColors.head;

  playGameOverSound();

  // MODIFICATION: Rediriger simplement vers fail.html après un délai
  setTimeout(() => {
    window.location.href = "fail.html";
  }, 1500); // 1.5 secondes de délai pour voir l'écran de game over
}

// ... (le reste du code reste inchangé) ...
function startGame() {
  if (gameRunning && !gamePaused) return;

  if (!gameRunning) {
    snake = [
      { x: Math.floor(GRID_SIZE / 2), y: Math.floor(GRID_SIZE / 2) },
      { x: Math.floor(GRID_SIZE / 2) - 1, y: Math.floor(GRID_SIZE / 2) },
      { x: Math.floor(GRID_SIZE / 2) - 2, y: Math.floor(GRID_SIZE / 2) },
    ];
    food = generateFood();
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    score = 0;
    level = 1;
    gameSpeed = 35;
    speedMultiplier = 3.0;
    logosEaten = 0;
    currentColorIndex = 0;
    currentColors = snakeColors[0];

    document.getElementById("score").textContent = "0";
    document.getElementById("logosEaten").textContent = "0";
    updateSpeedDisplay();
    updateColorDisplay();
  }

  gameRunning = true;
  gamePaused = false;
  document.getElementById("overlay").classList.remove("active");
  document.getElementById("gameOverModal").style.display = "none";
  document.getElementById("pauseBtn").textContent = "Pause";
  gameLoop();
}

function pauseGame() {
  if (!gameRunning) return;
  gamePaused = !gamePaused;
  document.getElementById("pauseBtn").textContent = gamePaused
    ? "Resume"
    : "Pause";
}

function resetGame() {
  gameRunning = false;
  gamePaused = false;
  document.getElementById("overlay").classList.remove("active");
  document.getElementById("gameOverModal").style.display = "none";
  document.getElementById("pauseBtn").textContent = "Pause";
  document.getElementById("score").textContent = "0";
  document.getElementById("logosEaten").textContent = "0";
  speedMultiplier = 3.0;
  currentColorIndex = 0;
  currentColors = snakeColors[0];
  updateSpeedDisplay();
  updateColorDisplay();

  snake = [
    { x: Math.floor(GRID_SIZE / 2), y: Math.floor(GRID_SIZE / 2) },
    { x: Math.floor(GRID_SIZE / 2) - 1, y: Math.floor(GRID_SIZE / 2) },
    { x: Math.floor(GRID_SIZE / 2) - 2, y: Math.floor(GRID_SIZE / 2) },
  ];
  food = generateFood();
  score = 0;
  level = 1;
  gameSpeed = 35;
  logosEaten = 0;
}

document.getElementById("startBtn").addEventListener("click", startGame);
document.getElementById("pauseBtn").addEventListener("click", pauseGame);
document.getElementById("resetBtn").addEventListener("click", resetGame);

document.addEventListener("keydown", (e) => {
  if (!gameRunning) return;

  const key = e.key.toLowerCase();

  if (e.key === "ArrowUp" || key === "w") {
    if (direction.y === 0) nextDirection = { x: 0, y: -1 };
    e.preventDefault();
  } else if (e.key === "ArrowDown" || key === "s") {
    if (direction.y === 0) nextDirection = { x: 0, y: 1 };
    e.preventDefault();
  } else if (e.key === "ArrowLeft" || key === "a") {
    if (direction.x === 0) nextDirection = { x: -1, y: 0 };
    e.preventDefault();
  } else if (e.key === "ArrowRight" || key === "d") {
    if (direction.x === 0) nextDirection = { x: 1, y: 0 };
    e.preventDefault();
  }
});

function gameLoop() {
  update();
  draw();
  if (gameRunning) {
    requestAnimationFrame(gameLoop);
  }
}

loadLogos();
draw();