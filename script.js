// variables
let gameframes = 0,
    nextEnemyframe = 50,
    gameStart = false,
    gamePause = false,
    gameEnd = false,
    score = 0

// sonud 
let GOSound = new Audio("./sonud/gsmeStart.mp3"),
    ShSound = new Audio("./sonud/buble.mp3"),
    GSSound = new Audio("./sonud/gsmeStart.mp3");

// elements
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const dialog = document.querySelector('[dialog]');
const dialogScore = document.querySelector('[dialog-score]');
const dialogBestScore = document.querySelector('[dialog-description] span');
const dialogBtn = document.querySelector('[dialog-btn]');
const pauseBtn = document.querySelector('.pause');

// settings
if(!localStorage.getItem('best-score')) localStorage.setItem('best-score', '0');
let CANVAS_WIDTH = canvas.width = innerWidth;
let CANVAS_HEIGHT = canvas.height = innerHeight;

// classes
class Player {
  constructor(x, y, radius = 30){
    this.alive = true;
    this.x = x;
    this.y = y;
    this.color = 'whitesmoke';
    this.radius = radius;
  }
  
  draw() {
    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

class Projectile {
  constructor(x, y, ex, ey, radius = 5, color = 'snow'){
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    
    // velocity calculation
    const dx = x - ex;
    const dy = y - ey;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const speed = 5;
    const ratio = speed / distance;
    const vx = (dx * ratio)*-1;
    const vy = (dy * ratio)*-1;
    this.velocity = {
      x: vx,
      y: vy
    }
  }
  
  draw() {
    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  
  update() {
    this.draw();
    
    this.x += this.velocity.x;
    this.y += this.velocity.y;
  }
}

class Enemy {
  constructor(player){
    this.target = player;
    this.radius = Math.floor(Math.random() * (30 - 5)) + 5;
    this.decreaseRadius = 0;
    this.frameToDecreaseRadius = 10;
    this.radiusframe = this.frameToDecreaseRadius;
    this.color = `hsl(${Math.floor(Math.random() * 360)} 100% 50%)`;
    
    // random x and y
    if(Math.random() > 0.5) {
      this.x = -this.radius;
      this.y = -this.radius;
      if(Math.random() > 0.5) this.x += Math.random() * CANVAS_WIDTH;
      else this.y += Math.random() * CANVAS_HEIGHT;
    }else {
      this.x = CANVAS_WIDTH + this.radius;
      this.y = CANVAS_HEIGHT + this.radius;
      if(Math.random() > 0.5) this.x -= Math.random() * CANVAS_WIDTH;
      else this.y -= Math.random() * CANVAS_HEIGHT;
    }
    
    
    // velocity calculation
    const dx = this.x - player.x;
    const dy = this.y - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const speed = Math.min(60 / this.radius, 10);
    const ratio = (speed/5) / distance;
    const vx = (dx * ratio)*-1;
    const vy = (dy * ratio)*-1;
    this.velocity = {
      x: vx,
      y: vy
    }
  }
  
  draw() {
    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  
  update() {
    this.draw();
    
    if(this.frameToDecreaseRadius > this.radiusframe) {
      this.radius -= this.decreaseRadius/this.frameToDecreaseRadius;
      this.radiusframe++;
    }else {
      this.decreaseRadius = 0;
      // this.radiusframe = 0;
    }
    this.radius = Math.max(this.radius, 0);
    this.radius = Math.max(this.radius, 0);
    
    if (this.target.alive) {
      this.x += this.velocity.x;
      this.y += this.velocity.y;
    }
  }
}

class Particle {
  constructor(x, y, enemyRadius = 10, color = 'snow'){
    this.x = x;
    this.y = y;
    this.color = color;
    this.radius = Math.random() * enemyRadius*.35 + enemyRadius*.05;
    this.frameToDispir = 25;
    this.velocity = {
      x: Math.random() * 3 - 1.5,
      y: Math.random() * 3 - 1.5
    }
  }
  
  draw() {
    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  
  update() {
    this.draw();
    
    this.x += this.velocity.x;
    this.y += this.velocity.y;
    this.radius -= this.radius/this.frameToDispir;
  }
}

class Gift {
  constructor(x, y, giftIndex, time = 3000){
    this.x = x;
    this.y = y;
    this.time = time;
    switch (giftIndex) {
      case 1:
        this.type = 'bomb';
        break;
      case 2:
        this.type = 'double shutter';
        break;
      case 3:
        this.type = 'score';
        break;
      case 4:
        this.type = 'speed shutter';
        break;
      
      default:
        this.type = 'bomb';
    }
  }
}

// create objects 
let player = new Player(CANVAS_WIDTH/2, CANVAS_HEIGHT/2, 18);
let projectiles = [];
let particles = [];
let enemys = [];

// functions
function frame() {
  gameframes++;
  gameStart = true;
  
  // create enemys
  if(gameframes % nextEnemyframe === 0) enemys.push(new Enemy(player));
  
  ctx.fillStyle = '#15151530';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // draw player
  player.draw();
  
  // update Projectelies
  projectiles.forEach((projectile, projectileIndex) => {
    if(projectile.x + projectile.radius < 0 ||
    projectile.x - projectile.radius > CANVAS_WIDTH ||
    projectile.y + projectile.radius < 0 ||
    projectile.y - projectile.radius > CANVAS_HEIGHT) {
      // remove projectiles not in game
      projectiles.splice(projectileIndex, 1);
    }else {
      projectile.update();
      
      enemys.forEach((enemy, enemyIndex) => {
        
        // remove enemy an projectile when collision
        if(detectCollisionCircle(projectile, enemy)) {
          // create particles
          for (let i = 0; i < Math.random() * 4 + 6; i++) {
            particles.push(new Particle(projectile.x, projectile.y, enemy.radius, enemy.color))
          }
          
          // remove
          projectiles.splice(projectileIndex, 1);
          if(enemy.radius - 5 >= 10) {enemy.radiusframe -= enemy.frameToDecreaseRadius; enemy.decreaseRadius+=5; score+=5;}
          else {enemys.splice(enemyIndex, 1); score+=10;}
        }
      });
    }
  });
  
  // update enemys 
  enemys.forEach((enemy) => {
    enemy.update();
    
    // end the game when enemy touch player
    if (detectCollisionCircle(enemy, player)) {
      player.alive = false;
      player.radius = 0;
      for (let i = 0; i < Math.random() * 100 + 25; i++) {
        particles.push(new Particle(player.x, player.y, 80, player.color));
      }
      setTimeout(() => gameOver(), 2000);
    }
  });
  
  // update particles 
  particles.forEach((particle, particleIndex) => {
    // remove particle can't see
    if(Math.floor(particle.radius) <= 0) particles.splice(particleIndex, 1);
    else particle.update();
  });
  
  // update score
  if(Number(localStorage.getItem('best-score')) < score){
    localStorage.setItem('best-score', String(score));
  }
  ctx.font = '30px monospace';
  ctx.fillStyle = 'snow';
  ctx.fillText(score, CANVAS_WIDTH/20, CANVAS_HEIGHT/20);
  
  if(!gameEnd && !gamePause) requestAnimationFrame(frame);
}

function detectCollisionCircle(circle1, circle2) {
  const dx = circle1.x - circle2.x;
  const dy = circle1.y - circle2.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < circle1.radius + circle2.radius;
}

function reset() {
  GSSound.play();
  CANVAS_WIDTH = canvas.width = innerWidth;
  CANVAS_HEIGHT = canvas.height = innerHeight;
  gameframes = 0;
  score = 0;
  gameEnd = false;
  player = new Player(CANVAS_WIDTH/2, CANVAS_HEIGHT/2, 18);
  projectiles = [];
  particles = [];
  enemys = [];
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  frame();
}

function showDialog() {
  let duration = 300;
  dialog.style.transition = `${duration}ms`;
  dialogScore.textContent = String(score);
  dialogBestScore.textContent = localStorage.getItem('best-score');
  dialogBtn.onclick = () => {
    dialog.style.scale = '0 0';
    setTimeout(() => {
      dialog.close();
      reset();
    }, duration);
  }
  dialog.show();
  dialog.style.scale = '1 1';
}

function gameOver() {
  GOSound.play();
  gameStart = false;
  gamePause = false;
  gameEnd = true;
  
  pasue(false);
  showDialog();
}

function pasue(condition) {
  if (gameStart && !gameEnd) {
    gamePause = condition;
    if (!condition) {
      pauseBtn.textContent = "▐▐";
      frame();
    } else {
      pauseBtn.textContent = "►";
    }
  }
}

function click(e) {
  let event = e.touches ? e.touches[e.touches.length-1] : e;
  if(!gameEnd && !gamePause && player.alive){
    ShSound.currentTime = 0;
    ShSound.play();
    projectiles.push(new Projectile(player.x, player.y, event.clientX, event.clientY));
  }
}

// control
addEventListener("resize", () => {
  CANVAS_WIDTH = canvas.width = innerWidth;
  CANVAS_HEIGHT = canvas.height = innerHeight;
  player.x = CANVAS_WIDTH/2;
  player.y = CANVAS_HEIGHT/2;
});


addEventListener("click", click);
addEventListener("touchstart", click);

addEventListener("keydown", (e) => {
  console.log(e.key)
  switch (e.key) {
    case 'Escape':
      pasue(!gamePause);
      break;
  }
})

pauseBtn.addEventListener("click", () => pasue(!gamePause));


// game start
showDialog();