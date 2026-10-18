```js
async function getOSDetails() {
    let osName = 'Unknown OS';
    let osVersion = 'Unknown Version';

    const ua = navigator.userAgent;
    const platform = navigator.platform;

    // 1. Detect iOS FIRST, including iPads using desktop mode
    if (
        /iPhone|iPad|iPod/i.test(ua) ||
        (platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    ) {
        osName = 'iOS';

        const iosMatch = ua.match(/OS ([0-9._]+) like Mac OS X/);

        if (iosMatch) {
            osVersion = iosMatch[1].replace(/_/g, '.');
        }

        return { os: osName, version: osVersion };
    }

    // 2. Modern User-Agent Client Hints API
    if (navigator.userAgentData) {
        osName = navigator.userAgentData.platform;

        try {
            const highEntropyData =
                await navigator.userAgentData.getHighEntropyValues([
                    'platformVersion'
                ]);

            osVersion = highEntropyData.platformVersion;

            // Windows version detection
            if (osName === 'Windows') {
                const majorVersion = parseInt(osVersion.split('.')[0], 10);

                if (majorVersion >= 13) {
                    osName = 'Windows 11';
                } else if (majorVersion > 0) {
                    osName = 'Windows 10';
                }
            }
        } catch (e) {
            // Continue with whatever information is available
        }

        return { os: osName, version: osVersion };
    }

    // 3. Legacy fallback for other operating systems

    if (/Macintosh|MacIntel|MacPPC|Mac68K/.test(platform)) {
        osName = 'Mac OS';

        const macMatch = ua.match(/Mac OS X ([0-9._]+)/);

        if (macMatch) {
            osVersion = macMatch[1].replace(/_/g, '.');
        }

    } else if (/Android/i.test(ua)) {
        osName = 'Android';

        const androidMatch = ua.match(/Android ([0-9.]+)/);

        if (androidMatch) {
            osVersion = androidMatch[1];
        }

    } else if (/Win32|Win64|Windows/i.test(platform)) {
        osName = 'Windows';

        const winMatch = ua.match(/Windows NT ([0-9.]+)/);

        if (winMatch) {
            const ntMap = {
                '10.0': '10',
                '6.3': '8.1',
                '6.2': '8',
                '6.1': '7'
            };

            osVersion = ntMap[winMatch[1]] || winMatch[1];
        }

    } else if (/Linux/i.test(platform)) {
        osName = 'Linux';
    }

    return { os: osName, version: osVersion };
}


// Log the detected operating system
getOSDetails().then(details => {
    console.log(`OS: ${details.os}`);
    console.log(`Version: ${details.version}`);
});


// SPORE ANIMATION
document.addEventListener('DOMContentLoaded', async () => {

    // Wait for operating system detection
    const details = await getOSDetails();

    const majorVersion = parseInt(details.version, 10);

    // Hide spores only on detected iOS 17 and below
    const hideSpores =
        details.os === 'iOS' &&
        Number.isFinite(majorVersion) &&
        majorVersion <= 17;

    // Use saved spore count on supported devices
    let particleCount = hideSpores
        ? 0
        : (parseInt(localStorage.getItem('sporeCount'), 10) || 50);

    let particles = [];
    let lastScrollY = window.scrollY;
    let scrollDelta = 0;

    // Create canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    document.body.appendChild(canvas);

    canvas.style.cssText =
        'position:fixed; top:0; left:0; width:100vw; height:100vh; z-index:-1; pointer-events:none;';

    // Update spore count from settings
    window.addEventListener('updateSpores', (e) => {
        // Never allow the settings menu to enable spores on older iOS
        if (hideSpores) return;

        const newCount = parseInt(e.detail, 10);

        particleCount = Number.isFinite(newCount)
            ? Math.max(0, newCount)
            : 50;

        initParticles();
    });

    // Track scrolling
    window.addEventListener('scroll', () => {
        scrollDelta = window.scrollY - lastScrollY;
        lastScrollY = window.scrollY;
    }, { passive: true });

    // Resize canvas
    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    window.addEventListener('resize', resize);
    resize();


    // SPORE CLASS
    class Spore {
        constructor() {
            this.init(true);
        }

        init(randomY = false) {
            this.x = Math.random() * canvas.width;
            this.y = randomY
                ? Math.random() * canvas.height
                : -50;

            this.size = Math.random() * 4;

            this.baseSpeedY = Math.random() * 0.8 + 0.3;
            this.speedX = (Math.random() - 0.5) * 0.5;

            this.opacity = randomY ? Math.random() : 1;
            this.fadeSpeed = Math.random() * 0.00003 + 0.0001;

            this.parallaxMult = this.size * 0.5;

            this.imgtype = Math.floor(Math.random() * 3) + 1;

            this.img = new Image();

            this.img.src =
                `https://cdn.jsdelivr.net/gh/gibberish2/FungiWebFiles@main/sporeImages/backroundspore${this.imgtype}.svg`;
        }

        update() {
            this.y += this.baseSpeedY;
            this.x += this.speedX;
            this.opacity -= this.fadeSpeed;

            if (
                this.opacity <= 0 ||
                this.y > canvas.height + 50
            ) {
                this.init(false);
            }
        }

        draw(accent) {
            if (
                !this.img.complete ||
                this.img.naturalWidth === 0
            ) {
                return;
            }

            const width = 20 + this.size * 8;

            const height =
                width *
                (this.img.naturalHeight / this.img.naturalWidth);

            ctx.globalAlpha = this.opacity;

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


    /*
    ORIGINAL SPORE CIRCLES

    draw(accent) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = accent;
        ctx.globalAlpha = this.opacity;
        ctx.shadowBlur = 8;
        ctx.shadowColor = accent;
        ctx.fill();
    }
    */


    // Initialize or remove particles as needed
    function initParticles() {
        if (particles.length > particleCount) {
            particles.splice(particleCount);
        } else {
            while (particles.length < particleCount) {
                particles.push(new Spore());
            }
        }
    }


    // Animation loop
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const accent = getComputedStyle(
            document.documentElement
        ).getPropertyValue('--accent-color').trim();

        particles.forEach(p => {
            p.update();
            p.draw(accent);
        });

        scrollDelta *= 0.9;

        requestAnimationFrame(animate);
    }


    // Start animation
    initParticles();
    animate();

    console.log(
        hideSpores
            ? 'Spores disabled: iOS 17 or below.'
            : `Spores enabled: ${particleCount} particles.`
    );
});
```
