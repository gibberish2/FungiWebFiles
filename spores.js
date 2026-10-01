
document.addEventListener('DOMContentLoaded', () => {
    let particleCount = parseInt(localStorage.getItem('sporeCount')) || 50;
    let particles = [];
    let lastScrollY = window.scrollY;
    let scrollDelta = 0;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    document.body.appendChild(canvas);

    canvas.style.cssText = "position:fixed; top:0; left:0; width:100vw; height:100vh; z-index:-1; pointer-events:none;";

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

    class Spore {
        constructor() { this.init(true); }

        init(randomY = false) {
            this.x = Math.random() * canvas.width;
            this.y = randomY ? Math.random() * canvas.height : canvas.height + 20;
            this.size = Math.random() * 4; // Small circles
            this.baseSpeedY = Math.random() * 0.8 + 0.3; 
            this.speedX = (Math.random() - 0.5) * 0.5;   
            this.opacity = randomY ? Math.random() : 1;
            this.leafType = Math.floor(Math.random()*3+1);
            /* THIS IS THE START OF SEASON SPORE BACKROUND IMAGES FROM FILES*/
            this.leafimg = document.createElement('img')
            this.leafimg.src = `https://cdn.jsdelivr.net/gh/gibberish2/FungiWebFiles@main/sporeImages/fallLeaf${this.leafimg}.png`
            /*END OF SEASONAL SPORE BACKROUND IMAGES*/
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

