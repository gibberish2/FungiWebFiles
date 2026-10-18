```js
async function getOSDetails() {
    const ua = navigator.userAgent;
    const platform = navigator.platform;

    let osName = 'Unknown OS';
    let osVersion = 'Unknown Version';

    // Detect iOS, including iPads in desktop mode
    if (
        /iPhone|iPad|iPod/i.test(ua) ||
        (platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    ) {
        osName = 'iOS';

        const match = ua.match(/OS ([0-9_]+) like Mac OS X/);
        if (match) osVersion = match[1].replace(/_/g, '.');

        return { os: osName, version: osVersion };
    }

    // Modern browser OS detection
    if (navigator.userAgentData) {
        try {
            const data = await navigator.userAgentData.getHighEntropyValues([
                'platformVersion'
            ]);

            osName = navigator.userAgentData.platform;
            osVersion = data.platformVersion || 'Unknown Version';

            if (osName === 'Windows') {
                const major = parseInt(osVersion, 10);
                osName = major >= 13 ? 'Windows 11' : 'Windows';
                if (major > 0 && major < 13) osVersion = '10';
            }

            return { os: osName, version: osVersion };
        } catch (e) {
            osName = navigator.userAgentData.platform;
        }
    }

    // Legacy fallback
    if (/Windows/i.test(ua)) {
        osName = 'Windows';
        osVersion = /Windows NT 10/.test(ua) ? '10' : 'Unknown Version';
    } else if (/Android/i.test(ua)) {
        osName = 'Android';
        osVersion = ua.match(/Android ([0-9.]+)/)?.[1] || 'Unknown Version';
    } else if (/Macintosh|Mac OS X/i.test(ua)) {
        osName = 'Mac OS';
        osVersion = ua.match(/Mac OS X ([0-9._]+)/)?.[1]?.replace(/_/g, '.') || 'Unknown Version';
    } else if (/Linux/i.test(ua)) {
        osName = 'Linux';
    }

    return { os: osName, version: osVersion };
}


document.addEventListener('DOMContentLoaded', async () => {
    const details = await getOSDetails();
    const majorVersion = parseInt(details.version, 10);

    const hideSpores =
        details.os === 'iOS' &&
        Number.isFinite(majorVersion) &&
        majorVersion <= 17;

    let particleCount = hideSpores
        ? 0
        : Math.max(0, parseInt(localStorage.getItem('sporeCount'), 10) || 50);

    let particles = [];

    // Create the canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.id = 'fungi-spore-canvas';

    Object.assign(canvas.style, {
        position: 'fixed',
        inset: '0',
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: '0'
    });

    document.body.appendChild(canvas);

    // Keep the canvas above the page background
    // but below normal page content.
    if (getComputedStyle(document.body).position === 'static') {
        document.body.style.position = 'relative';
    }

    function resize() {
        const dpr = window.devicePixelRatio || 1;

        canvas.width = Math.floor(window.innerWidth * dpr);
        canvas.height = Math.floor(window.innerHeight * dpr);

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    window.addEventListener('resize', resize);
    resize();

    class Spore {
        constructor() {
            this.init(true);
        }

        init(randomY = false) {
            this.x = Math.random() * window.innerWidth;
            this.y = randomY
                ? Math.random() * window.innerHeight
                : -50;

            this.size = Math.random() * 4;
            this.baseSpeedY = Math.random() * 0.8 + 0.3;
            this.speedX = (Math.random() - 0.5) * 0.5;
            this.opacity = randomY ? Math.random() : 1;
            this.fadeSpeed = Math.random() * 0.00003 + 0.0001;

            this.imgtype = Math.floor(Math.random() * 3) + 1;
            this.img = new Image();

            this.img.src =
                `https://cdn.jsdelivr.net/gh/gibberish2/FungiWebFiles@main/sporeImages/backroundspore${this.imgtype}.svg`;

            this.img.onerror = () => {
                console.error('Failed to load spore:', this.img.src);
            };
        }

        update() {
            this.y += this.baseSpeedY;
            this.x += this.speedX;
            this.opacity -= this.fadeSpeed;

            if (
                this.opacity <= 0 ||
                this.y > window.innerHeight + 50
            ) {
                this.init(false);
            }
        }

        draw() {
            if (!this.img.complete || !this.img.naturalWidth) return;

            const width = 20 + this.size * 8;
            const height =
                width * (this.img.naturalHeight / this.img.naturalWidth);

            ctx.globalAlpha = Math.max(0, this.opacity);
            ctx.shadowBlur = 2;
            ctx.shadowColor = '#D07A04';

            ctx.drawImage(
                this.img,
                this.x - width / 2,
                this.y - height / 2,
                width,
                height
            );

            ctx.globalAlpha = 1;
            ctx.shadowBlur = 0;
        }
    }

    function initParticles() {
        if (particles.length > particleCount) {
            particles.length = particleCount;
        }

        while (particles.length < particleCount) {
            particles.push(new Spore());
        }
    }

    window.addEventListener('updateSpores', (e) => {
        if (hideSpores) return;

        const count = parseInt(e.detail, 10);

        particleCount = Number.isFinite(count)
            ? Math.max(0, count)
            : 50;

        localStorage.setItem('sporeCount', particleCount);
        initParticles();
    });

    function animate() {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

        particles.forEach(spore => {
            spore.update();
            spore.draw();
        });

        requestAnimationFrame(animate);
    }

    initParticles();
    animate();

    console.log('Detected OS:', details.os);
    console.log('Detected version:', details.version);
    console.log('Spores hidden:', hideSpores);
    console.log('Initial particle count:', particleCount);
});
```
