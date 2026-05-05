class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.score = 0;
        this.level = 1;
        this.gameState = 'start';
        this.lastTime = 0;
        this.winAnimationProgress = 0;
        this.winAnimationComplete = false;
        
        this.cat = {
            x: 100,
            y: 300,
            width: 70,
            height: 70,
            speed: 5,
            direction: 'right',
            vx: 0,
            vy: 0,
            image: null
        };
        
        this.dog = {
            x: 600,
            y: 300,
            width: 65,
            height: 65,
            speed: 3,
            direction: 'left',
            vx: 0,
            vy: 0,
            changeTime: 0,
            changeInterval: 1000,
            image: null
        };
        
        this.projectiles = [];
        this.particles = [];
        this.bubbles = [];
        this.winParticles = [];
        
        this.keys = {};
        this.shootCooldown = 0;
        this.ready = false;
        
        this.audioContext = null;
        
        this.init();
    }
    
    init() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());
        
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'Space' && this.gameState === 'playing') {
                e.preventDefault();
                this.shoot();
            }
            if (e.code === 'Space' && this.gameState === 'win' && this.winAnimationComplete) {
                this.nextLevel();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        this.canvas.addEventListener('click', () => {
            if (this.gameState === 'playing') {
                this.shoot();
            }
            if (this.gameState === 'win' && this.winAnimationComplete) {
                this.nextLevel();
            }
        });
        
        this.loadImages();
        this.generateBubbles();
    }
    
    loadImages() {
        let loadedCount = 0;
        const totalImages = 2;
        
        this.cat.image = new Image();
        this.cat.image.onload = () => {
            loadedCount++;
            this.checkImagesLoaded(loadedCount, totalImages);
        };
        this.cat.image.onerror = () => {
            loadedCount++;
            this.cat.image = null;
            this.checkImagesLoaded(loadedCount, totalImages);
        };
        this.cat.image.src = 'cat.png';
        
        this.dog.image = new Image();
        this.dog.image.onload = () => {
            loadedCount++;
            this.checkImagesLoaded(loadedCount, totalImages);
        };
        this.dog.image.onerror = () => {
            loadedCount++;
            this.dog.image = null;
            this.checkImagesLoaded(loadedCount, totalImages);
        };
        this.dog.image.src = 'dog.png';
    }
    
    checkImagesLoaded(loadedCount, totalImages) {
        if (loadedCount >= totalImages) {
            this.ready = true;
        }
    }
    
    generateBubbles() {
        this.bubbles = [];
        const count = 20 + this.level * 5;
        for (let i = 0; i < count; i++) {
            this.bubbles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: 5 + Math.random() * 25,
                speedY: 0.2 + Math.random() * 0.6,
                speedX: (Math.random() - 0.5) * 0.4,
                alpha: 0.2 + Math.random() * 0.4,
                wobble: Math.random() * Math.PI * 2,
                wobbleSpeed: 0.01 + Math.random() * 0.02,
                shape: Math.random() > 0.5 ? 'heart' : 'circle'
            });
        }
    }
    
    resizeCanvas() {
        const maxWidth = Math.min(window.innerWidth - 20, 800);
        const maxHeight = Math.min(window.innerHeight - 80, 600);
        this.canvas.width = maxWidth;
        this.canvas.height = maxHeight;
        this.generateBubbles();
    }
    
    startGame() {
        if (!this.ready) return;
        
        this.gameState = 'playing';
        this.score = 0;
        this.level = 1;
        this.winAnimationProgress = 0;
        this.winAnimationComplete = false;
        this.projectiles = [];
        this.particles = [];
        this.winParticles = [];
        
        this.cat.speed = 5;
        this.dog.speed = 3;
        this.dog.changeInterval = 1000;
        
        this.cat.x = 100;
        this.cat.y = this.canvas.height / 2;
        this.cat.direction = 'right';
        
        this.dog.x = this.canvas.width - 150;
        this.dog.y = this.canvas.height / 2;
        this.dog.direction = 'left';
        
        document.getElementById('startScreen').classList.add('hidden');
        document.getElementById('gameScreen').classList.remove('hidden');
        document.getElementById('winScreen').classList.add('hidden');
        document.getElementById('level').textContent = this.level;
        
        this.updateScore();
        this.gameLoop();
    }
    
    restartGame() {
        document.getElementById('winScreen').classList.add('hidden');
        this.startGame();
    }
    
    nextLevel() {
        this.level++;
        this.gameState = 'playing';
        this.score = 0;
        this.winAnimationProgress = 0;
        this.winAnimationComplete = false;
        this.projectiles = [];
        this.particles = [];
        this.winParticles = [];
        
        this.cat.speed = Math.min(5 + this.level * 0.3, 8);
        this.dog.speed = Math.min(3 + this.level * 0.4, 6);
        this.dog.changeInterval = Math.max(1000 - this.level * 100, 400);
        
        this.cat.x = 100;
        this.cat.y = this.canvas.height / 2;
        this.cat.direction = 'right';
        
        this.dog.x = this.canvas.width - 150;
        this.dog.y = this.canvas.height / 2;
        this.dog.direction = 'left';
        
        document.getElementById('winScreen').classList.add('hidden');
        document.getElementById('gameScreen').classList.remove('hidden');
        document.getElementById('level').textContent = this.level;
        
        this.generateBubbles();
        this.updateScore();
        this.gameLoop();
    }
    
    gameLoop(currentTime = 0) {
        if (this.gameState === 'start') return;
        
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        if (this.gameState === 'playing') {
            this.update(deltaTime);
        } else if (this.gameState === 'win') {
            this.updateWinAnimation(deltaTime);
        }
        
        this.render();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    update(deltaTime) {
        this.updateCat();
        this.updateDog(deltaTime);
        this.updateProjectiles();
        this.updateParticles();
        this.updateBubbles();
        this.checkCollisions();
        this.shootCooldown = Math.max(0, this.shootCooldown - deltaTime);
    }
    
    updateWinAnimation(deltaTime) {
        if (this.winAnimationProgress < 1) {
            this.winAnimationProgress += deltaTime / 1500;
        } else {
            this.winAnimationComplete = true;
        }
        
        this.updateBubbles();
        this.updateWinParticles();
    }
    
    updateWinParticles() {
        this.winParticles = this.winParticles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1;
            p.life -= 0.01;
            p.size *= 0.99;
            return p.life > 0;
        });
    }
    
    updateCat() {
        this.cat.vx = 0;
        this.cat.vy = 0;
        
        if (this.keys['ArrowUp'] || this.keys['KeyW']) {
            this.cat.vy = -this.cat.speed;
            this.cat.direction = 'up';
        }
        if (this.keys['ArrowDown'] || this.keys['KeyS']) {
            this.cat.vy = this.cat.speed;
            this.cat.direction = 'down';
        }
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
            this.cat.vx = -this.cat.speed;
            this.cat.direction = 'left';
        }
        if (this.keys['ArrowRight'] || this.keys['KeyD']) {
            this.cat.vx = this.cat.speed;
            this.cat.direction = 'right';
        }
        
        if (this.cat.vx !== 0 || this.cat.vy !== 0) {
            this.cat.x += this.cat.vx;
            this.cat.y += this.cat.vy;
            
            this.cat.x = Math.max(this.cat.width / 2, Math.min(this.canvas.width - this.cat.width / 2, this.cat.x));
            this.cat.y = Math.max(this.cat.height / 2, Math.min(this.canvas.height - this.cat.height / 2, this.cat.y));
        }
    }
    
    updateDog(deltaTime) {
        this.dog.changeTime += deltaTime;
        
        if (this.dog.changeTime >= this.dog.changeInterval) {
            this.dog.changeTime = 0;
            this.dog.changeInterval = 600 + Math.random() * 800;
            
            const directions = ['up', 'down', 'left', 'right'];
            this.dog.direction = directions[Math.floor(Math.random() * directions.length)];
        }
        
        switch (this.dog.direction) {
            case 'up':
                this.dog.y -= this.dog.speed;
                break;
            case 'down':
                this.dog.y += this.dog.speed;
                break;
            case 'left':
                this.dog.x -= this.dog.speed;
                break;
            case 'right':
                this.dog.x += this.dog.speed;
                break;
        }
        
        this.dog.x = Math.max(this.dog.width / 2, Math.min(this.canvas.width - this.dog.width / 2, this.dog.x));
        this.dog.y = Math.max(this.dog.height / 2, Math.min(this.canvas.height - this.dog.height / 2, this.dog.y));
        
        if (this.dog.x <= this.dog.width / 2) this.dog.direction = 'right';
        if (this.dog.x >= this.canvas.width - this.dog.width / 2) this.dog.direction = 'left';
        if (this.dog.y <= this.dog.height / 2) this.dog.direction = 'down';
        if (this.dog.y >= this.canvas.height - this.dog.height / 2) this.dog.direction = 'up';
    }
    
    shoot() {
        if (this.shootCooldown > 0) return;
        
        this.shootCooldown = 300;
        
        let vx = 0, vy = 0;
        switch (this.cat.direction) {
            case 'up': vy = -9; break;
            case 'down': vy = 9; break;
            case 'left': vx = -9; break;
            case 'right': vx = 9; break;
        }
        
        const projectile = {
            x: this.cat.x,
            y: this.cat.y,
            vx: vx,
            vy: vy,
            size: 24,
            type: Math.floor(Math.random() * 3),
            rotation: 0
        };
        
        this.projectiles.push(projectile);
    }
    
    updateProjectiles() {
        this.projectiles = this.projectiles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.rotation += 0.15;
            
            return p.x >= -50 && p.x <= this.canvas.width + 50 &&
                   p.y >= -50 && p.y <= this.canvas.height + 50;
        });
    }
    
    updateParticles() {
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.y += 0.1;
            p.life -= 0.025;
            p.size *= 0.97;
            return p.life > 0;
        });
    }
    
    updateBubbles() {
        this.bubbles.forEach(bubble => {
            bubble.y -= bubble.speedY;
            bubble.x += Math.sin(bubble.wobble) * bubble.speedX * 3;
            bubble.wobble += bubble.wobbleSpeed;
            
            if (bubble.y < -bubble.size) {
                bubble.y = this.canvas.height + bubble.size;
                bubble.x = Math.random() * this.canvas.width;
            }
        });
    }
    
    checkCollisions() {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            
            if (this.isColliding(p, this.dog)) {
                this.projectiles.splice(i, 1);
                this.score++;
                this.updateScore();
                this.createHitParticles(p.x, p.y);
                
                if (this.score >= 10) {
                    this.winGame();
                }
                break;
            }
        }
    }
    
    isColliding(obj1, obj2) {
        const padding = 5;
        return obj1.x < obj2.x + obj2.width / 2 + padding &&
               obj1.x > obj2.x - obj2.width / 2 - padding &&
               obj1.y < obj2.y + obj2.height / 2 + padding &&
               obj1.y > obj2.y - obj2.height / 2 - padding;
    }
    
    createHitParticles(x, y) {
        for (let i = 0; i < 15; i++) {
            const angle = (Math.PI * 2 * i) / 15;
            const speed = 2 + Math.random() * 3;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 20,
                life: 1,
                type: Math.floor(Math.random() * 3)
            });
        }
    }
    
    createWinParticles() {
        for (let i = 0; i < 50; i++) {
            const angle = (Math.PI * 2 * i) / 50;
            const speed = 1 + Math.random() * 3;
            this.winParticles.push({
                x: this.canvas.width / 2,
                y: this.canvas.height / 2,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 20 + Math.random() * 15,
                life: 2,
                type: Math.floor(Math.random() * 3)
            });
        }
    }
    
    playWinSound() {
        try {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            const ctx = this.audioContext;
            const notes = [523.25, 659.25, 783.99, 1046.50];
            
            notes.forEach((freq, i) => {
                const oscillator = ctx.createOscillator();
                const gainNode = ctx.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(ctx.destination);
                
                oscillator.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.3);
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.3);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.3 + 0.5);
                
                oscillator.start(ctx.currentTime + i * 0.3);
                oscillator.stop(ctx.currentTime + i * 0.3 + 0.5);
            });
        } catch (e) {
            console.log('Audio not supported');
        }
    }
    
    updateScore() {
        document.getElementById('score').textContent = this.score;
    }
    
    winGame() {
        this.gameState = 'win';
        this.winAnimationProgress = 0;
        this.winAnimationComplete = false;
        this.createWinParticles();
        this.playWinSound();
    }
    
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.renderBackground();
        this.renderBubbles();
        
        if (this.gameState === 'playing') {
            this.renderParticles();
            this.renderDog();
            this.renderCat();
            this.renderProjectiles();
        } else if (this.gameState === 'win') {
            this.renderWinParticles();
            this.renderWinScreen();
        }
    }
    
    renderBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#FFB6C1');
        gradient.addColorStop(0.3, '#FFC0CB');
        gradient.addColorStop(0.7, '#FFD1DC');
        gradient.addColorStop(1, '#FFE4E1');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    renderBubbles() {
        this.bubbles.forEach(bubble => {
            this.ctx.save();
            this.ctx.globalAlpha = bubble.alpha;
            
            if (bubble.shape === 'heart') {
                this.renderHeart(bubble.x, bubble.y, bubble.size * 0.5);
            } else {
                const gradient = this.ctx.createRadialGradient(
                    bubble.x - bubble.size * 0.3, bubble.y - bubble.size * 0.3, 0,
                    bubble.x, bubble.y, bubble.size
                );
                gradient.addColorStop(0, 'rgba(255, 220, 240, 0.7)');
                gradient.addColorStop(0.5, 'rgba(255, 190, 220, 0.4)');
                gradient.addColorStop(1, 'rgba(255, 160, 190, 0.1)');
                
                this.ctx.fillStyle = gradient;
                this.ctx.beginPath();
                this.ctx.arc(bubble.x, bubble.y, bubble.size, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.strokeStyle = 'rgba(255, 200, 230, 0.5)';
                this.ctx.lineWidth = 1;
                this.ctx.stroke();
            }
            
            this.ctx.restore();
        });
    }
    
    renderHeart(x, y, size) {
        this.ctx.fillStyle = 'rgba(255, 180, 210, 0.6)';
        this.ctx.beginPath();
        this.ctx.moveTo(x, y + size);
        this.ctx.bezierCurveTo(x - size, y, x - size, y - size / 2, x, y - size);
        this.ctx.bezierCurveTo(x + size, y - size / 2, x + size, y, x, y + size);
        this.ctx.fill();
    }
    
    renderCat() {
        this.ctx.save();
        this.ctx.translate(this.cat.x, this.cat.y);
        
        let scaleX = 1;
        let rotation = 0;
        
        switch (this.cat.direction) {
            case 'left':
                scaleX = -1;
                break;
            case 'up':
                rotation = -Math.PI / 2;
                break;
            case 'down':
                rotation = Math.PI / 2;
                break;
        }
        
        this.ctx.rotate(rotation);
        this.ctx.scale(scaleX, 1);
        
        if (this.cat.image) {
            this.ctx.drawImage(
                this.cat.image,
                -this.cat.width / 2,
                -this.cat.height / 2,
                this.cat.width,
                this.cat.height
            );
        } else {
            this.renderFallbackCat();
        }
        
        this.ctx.restore();
    }
    
    renderFallbackCat() {
        const w = this.cat.width;
        const h = this.cat.height;
        
        this.ctx.fillStyle = '#FAFAFA';
        this.ctx.beginPath();
        this.ctx.roundRect(-w/2, -h/2, w, h, 25);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#E0E0E0';
        this.ctx.beginPath();
        this.ctx.moveTo(-w/2 + 3, -h/3 - 5);
        this.ctx.lineTo(-w/3, -h * 0.7);
        this.ctx.lineTo(-w/4 + 5, -h/3);
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.moveTo(w/2 - 3, -h/3 - 5);
        this.ctx.lineTo(w/3, -h * 0.7);
        this.ctx.lineTo(w/4 - 5, -h/3);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#FFB6C1';
        this.ctx.beginPath();
        this.ctx.ellipse(-w/4 - 5, -h/6, 12, 8, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.ellipse(w/4 + 5, -h/6, 12, 8, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#1A1A1A';
        this.ctx.beginPath();
        this.ctx.ellipse(-w/4 - 5, -h/6, 10, 9, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.ellipse(w/4 + 5, -h/6, 10, 9, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#FFF';
        this.ctx.beginPath();
        this.ctx.arc(-w/4 - 10, -h/6 - 5, 2.5, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(w/4 - 1, -h/6 - 5, 2.5, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#FFB6C1';
        this.ctx.beginPath();
        this.ctx.ellipse(0, h/6, 6, 4, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#FFB6C1';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(-w/4 + 5, h/4);
        this.ctx.lineTo(0, h/3 + 3);
        this.ctx.lineTo(w/4 - 5, h/4);
        this.ctx.stroke();
    }
    
    renderDog() {
        this.ctx.save();
        this.ctx.translate(this.dog.x, this.dog.y);
        
        let scaleX = 1;
        let rotation = 0;
        
        switch (this.dog.direction) {
            case 'left':
                scaleX = -1;
                break;
            case 'up':
                rotation = -Math.PI / 2;
                break;
            case 'down':
                rotation = Math.PI / 2;
                break;
        }
        
        this.ctx.rotate(rotation);
        this.ctx.scale(scaleX, 1);
        
        if (this.dog.image) {
            this.ctx.drawImage(
                this.dog.image,
                -this.dog.width / 2,
                -this.dog.height / 2,
                this.dog.width,
                this.dog.height
            );
        } else {
            this.renderFallbackDog();
        }
        
        this.ctx.restore();
    }
    
    renderFallbackDog() {
        const w = this.dog.width;
        const h = this.dog.height;
        
        this.ctx.fillStyle = '#D2691E';
        this.ctx.beginPath();
        this.ctx.roundRect(-w/2, -h/2, w, h, 15);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#FFF';
        this.ctx.beginPath();
        this.ctx.moveTo(-w/5, -h/2);
        this.ctx.lineTo(0, -h/2);
        this.ctx.lineTo(0, h/4);
        this.ctx.lineTo(-w/6, h/2);
        this.ctx.lineTo(-w/2, h/2);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.moveTo(w/5, -h/2);
        this.ctx.lineTo(0, -h/2);
        this.ctx.lineTo(0, h/4);
        this.ctx.lineTo(w/6, h/2);
        this.ctx.lineTo(w/2, h/2);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.fillStyle = '#D2691E';
        this.ctx.beginPath();
        this.ctx.moveTo(-w/2 + 2, -h/3);
        this.ctx.lineTo(-w/3 + 3, -h * 0.6);
        this.ctx.lineTo(-w/4 + 5, -h/4);
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.moveTo(w/2 - 2, -h/3);
        this.ctx.lineTo(w/3 - 3, -h * 0.6);
        this.ctx.lineTo(w/4 - 5, -h/4);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.moveTo(-w/4, -h/5 - 5);
        this.ctx.lineTo(-w/4 - 10, -h/5);
        this.ctx.lineTo(-w/4 - 5, -h/5 + 8);
        this.ctx.lineTo(w/6 - 5, -h/5 + 8);
        this.ctx.lineTo(w/6, -h/5);
        this.ctx.lineTo(-w/4 + 5, -h/5 - 5);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.fillStyle = '#FFF';
        this.ctx.beginPath();
        this.ctx.arc(w/6 - 3, -h/5 + 2, 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(0, h/6, 5, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(-w/4, h/3);
        this.ctx.quadraticCurveTo(0, h/2 + 5, w/4, h/3);
        this.ctx.stroke();
    }
    
    renderProjectiles() {
        this.projectiles.forEach(p => {
            this.ctx.save();
            this.ctx.translate(p.x, p.y);
            this.ctx.rotate(p.rotation);
            
            this.drawEmoji(p.type, p.size);
            
            this.ctx.restore();
        });
    }
    
    renderParticles() {
        this.particles.forEach(p => {
            this.ctx.save();
            this.ctx.translate(p.x, p.y);
            this.ctx.globalAlpha = p.life;
            this.ctx.rotate(p.life * Math.PI * 4);
            
            this.drawEmoji(p.type, p.size);
            
            this.ctx.restore();
        });
    }
    
    renderWinParticles() {
        this.winParticles.forEach(p => {
            this.ctx.save();
            this.ctx.translate(p.x, p.y);
            this.ctx.globalAlpha = p.life;
            this.ctx.rotate(p.life * Math.PI * 4);
            
            this.drawEmoji(p.type, p.size);
            
            this.ctx.restore();
        });
    }
    
    renderWinScreen() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        this.ctx.save();
        
        const scale = Math.min(this.winAnimationProgress, 1);
        const alpha = Math.min(this.winAnimationProgress * 2, 1);
        
        this.ctx.globalAlpha = alpha;
        this.ctx.translate(centerX, centerY);
        this.ctx.scale(scale, scale);
        
        this.ctx.font = 'bold 36px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        const gradient = this.ctx.createLinearGradient(-150, 0, 150, 0);
        gradient.addColorStop(0, '#FF69B4');
        gradient.addColorStop(0.5, '#FF1493');
        gradient.addColorStop(1, '#FF69B4');
        this.ctx.fillStyle = gradient;
        
        this.ctx.fillText('💕 恭喜你追爱成功！ 💕', 0, -40);
        
        this.ctx.font = '24px Arial';
        this.ctx.fillStyle = '#FF69B4';
        this.ctx.fillText(`第 ${this.level} 关完成！`, 0, 10);
        
        if (this.winAnimationComplete) {
            this.ctx.font = '20px Arial';
            this.ctx.fillStyle = '#FF1493';
            this.ctx.fillText('点击屏幕或按空格键进入下一关', 0, 60);
        }
        
        this.ctx.restore();
    }
    
    drawEmoji(type, size) {
        this.ctx.font = `${size}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        const emojis = ['💕', '💋', '😍'];
        this.ctx.fillText(emojis[type], 0, 0);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
});