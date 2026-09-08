


/*heart spores code

document.addEventListener('DOMContentLoaded', () => {
    // 1. DATA INITIALIZATION
    let particleCount = parseInt(localStorage.getItem('sporeCount')) || 50;
    let particles = [];
    let lastScrollY = window.scrollY;
    let scrollDelta = 0;

    // 2. CANVAS SETUP
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    document.body.appendChild(canvas);

    // Style to keep it in the background
    canvas.style.cssText = "position:fixed; top:0; left:0; width:100vw; height:100vh; z-index:-1; pointer-events:none;";

    // 3. LISTENERS
    window.addEventListener('updateSpores', (e) => {
        particleCount = parseInt(e.detail);
        initParticles(); 
    });

    window.addEventListener('scroll', () => {
        scrollDelta = window.scrollY - lastScrollY;
        lastScrollY = window.scrollY;
    }, { passive: true });

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    // 4. CIRCLE SPORE LOGIC
    class Spore {
        constructor() { this.init(true); }

        init(randomY = false) {
            this.x = Math.random() * canvas.width;
            this.y = randomY ? Math.random() * canvas.height : canvas.height + 20;
            this.size = Math.random() * 3 + 1; 
            this.baseSpeedY = Math.random() * 0.8 + 0.3; 
            this.speedX = (Math.random() - 0.5) * 0.5;   
            this.opacity = randomY ? Math.random() : 1;
            this.fadeSpeed = Math.random() * 0.003 + 0.001;
            this.parallaxMult = this.size * 0.5; 
        }

        update() {
            this.y -= (this.baseSpeedY + (scrollDelta * 0.1 * this.parallaxMult));
            this.x += this.speedX;
            this.opacity -= this.fadeSpeed;

            if (this.opacity <= 0 || this.y < -50 || this.y > canvas.height + 100) {
                this.init(false);
            }
        }

    draw(accent) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.beginPath();
        const s = this.size;
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(-s * 0.8, -s * 1.2, -s * 2.2, -s * 0.5, -s * 1.5, s * 0.8);
        ctx.bezierCurveTo(-s * 1.5, s * 1.8, 0, s * 2.5, 0, s * 4.0);
        ctx.bezierCurveTo(0, s * 2.5, s * 1.5, s * 1.8, s * 1.5, s * 0.8);
        ctx.bezierCurveTo(s * 2.2, -s * 0.5, s * 0.8, -s * 1.2, 0, 0);
        ctx.fillStyle = accent;
        ctx.globalAlpha = this.opacity;
        ctx.shadowBlur = 18;
        ctx.shadowColor = accent;
        ctx.fill();
        ctx.restore();
    }
}

    // 5. ENGINE
    function initParticles() {
        if (particles.length > particleCount) {
            particles.splice(particleCount);
        } else {
            while (particles.length < particleCount) {
                particles.push(new Spore());
            }
        }
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Defaults to light blue if --accent-color isn't in your CSS
        const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim() || '#38bdf8';
        
        particles.forEach(p => {
            p.update();
            p.draw(accent);
        });

        scrollDelta *= 0.9; 
        requestAnimationFrame(animate);
    }

    initParticles();
    animate();
});
*/

document.addEventListener('DOMContentLoaded', () => {
    // 1. DATA INITIALIZATION
    let particleCount = parseInt(localStorage.getItem('sporeCount')) || 50;
    let particles = [];
    let lastScrollY = window.scrollY;
    let scrollDelta = 0;

    // 2. CANVAS SETUP
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    document.body.appendChild(canvas);

    canvas.style.cssText = "position:fixed; top:0; left:0; width:100vw; height:100vh; z-index:-1; pointer-events:none;";

    // 3. LISTENERS
    window.addEventListener('updateSpores', (e) => {
        particleCount = parseInt(e.detail);
        initParticles(); 
    });

    window.addEventListener('scroll', () => {
        scrollDelta = window.scrollY - lastScrollY;
        lastScrollY = window.scrollY;
    }, { passive: true });

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    // 4. CIRCLE LOGIC
    class Spore {
        constructor() { this.init(true); }

        init(randomY = false) {
            this.x = Math.random() * canvas.width;
            this.y = randomY ? Math.random() * canvas.height : canvas.height + 20;
            this.size = Math.random() * 4; // Small circles
            this.baseSpeedY = Math.random() * 0.8 + 0.3; 
            this.speedX = (Math.random() - 0.5) * 0.5;   
            this.opacity = randomY ? Math.random() : 1;
            this.fadeSpeed = Math.random() * 0.003 + 0.001;
            this.parallaxMult = this.size * 0.5; 
        }

        update() {
            this.y -= (this.baseSpeedY + (scrollDelta * 0.1 * this.parallaxMult));
            this.x += this.speedX;
            this.opacity -= this.fadeSpeed;

            if (this.opacity <= 0 || this.y < -50 || this.y > canvas.height + 100) {
                this.init(false);
            }
        }

        draw(accent) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = accent;
            ctx.globalAlpha = this.opacity;
            ctx.shadowBlur = 8;
            ctx.shadowColor = accent;
            ctx.fill();
        }
    }

    // 5. ENGINE
    function initParticles() {
        if (particles.length > particleCount) {
            particles.splice(particleCount);
        } else {
            while (particles.length < particleCount) {
                particles.push(new Spore());
            }
        }
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim() || '#38bdf8';
        
        particles.forEach(p => {
            p.update();
            p.draw(accent);
        });

        scrollDelta *= 0.9; 
        requestAnimationFrame(animate);
    }

    initParticles();
    animate();
});

/*
document.addEventListener('DOMContentLoaded', () => {
    // 1. DATA INITIALIZATION
    let particleCount = parseInt(localStorage.getItem('sporeCount')) || 75; // Increased default for snow density
    let particles = [];
    let lastScrollY = window.scrollY;
    let scrollDelta = 0;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    document.body.appendChild(canvas);
    canvas.style.cssText = "position:fixed; top:0; left:0; width:100vw; height:100vh; z-index:-1; pointer-events:none;";

    // 2. LISTENERS
    window.addEventListener('scroll', () => {
        scrollDelta = window.scrollY - lastScrollY;
        lastScrollY = window.scrollY;
    }, { passive: true });

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    // 3. SNOW LOGIC
    class Snowflake {
        constructor() { this.init(true); }

        init(randomY = false) {
            this.x = Math.random() * canvas.width;
            // randomY=true on start to fill screen; false spawns new flakes at the top
            this.y = randomY ? Math.random() * canvas.height : -20; 
            this.size = Math.random() * 3 + 1; 
            
            // Snow falls DOWN (Positive Y)
            this.baseSpeedY = Math.random() * 1 + 0.5; 
            // Gentle horizontal drift
            this.speedX = (Math.random() - 0.5) * 0.8;   
            this.opacity = Math.random() * 0.5 + 0.3; // Snow is rarely 100% opaque
            this.parallaxMult = this.size * 0.2; 
        }

        update() {
            // Apply gravity + scroll influence
            this.y += this.baseSpeedY + (scrollDelta * 0.1 * this.parallaxMult);
            this.x += this.speedX + Math.sin(this.y / 50) * 0.5; // Adds a slight "wobble"

            // Reset if flake goes off screen
            if (this.y > canvas.height + 20) {
                this.init(false);
            }
            if (this.x > canvas.width) this.x = 0;
            if (this.x < 0) this.x = canvas.width;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
            // Removed shadowBlur/glow for a cleaner, crisper snow look
            ctx.fill();
        }
    }

    // 4. ENGINE
    function initParticles() {
        particles = [];
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Snowflake());
        }
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach(p => {
            p.update();
            p.draw();
        });

        scrollDelta *= 0.9; 
        requestAnimationFrame(animate);
    }

    initParticles();
    animate();
});
*/