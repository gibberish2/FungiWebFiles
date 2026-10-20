
async function getOSDetails() {
    const ua = navigator.userAgent || '';
    const platform = navigator.platform || '';

    if (
        /iPhone|iPad|iPod/i.test(ua) ||
        (platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    ) {
        const match = ua.match(/OS ([0-9._]+) like Mac OS X/);

        return {
            os: 'iOS',
            version: match ? match[1].replace(/_/g, '.') : 'Unknown Version'
        };
    }

    if (navigator.userAgentData) {
        try {
            const data = await navigator.userAgentData.getHighEntropyValues([
                'platformVersion'
            ]);

            let os = navigator.userAgentData.platform || 'Unknown OS';
            let version = data.platformVersion || 'Unknown Version';

            if (os === 'Windows') {
                const major = parseInt(version.split('.')[0], 10);

                if (major >= 13) {
                    os = 'Windows 11';
                    version = '11';
                } else if (major > 0) {
                    version = '10';
                }
            }

            return { os, version };
        } catch (e) {
            // Use legacy detection below.
        }
    }

    if (/Android/i.test(ua)) {
        const m = ua.match(/Android ([0-9.]+)/i);
        return { os: 'Android', version: m ? m[1] : 'Unknown Version' };
    }

    if (/Windows|Win32|Win64/i.test(platform + ' ' + ua)) {
        const m = ua.match(/Windows NT ([0-9.]+)/i);
        const map = {
            '10.0': '10',
            '6.3': '8.1',
            '6.2': '8',
            '6.1': '7'
        };

        return {
            os: 'Windows',
            version: m ? (map[m[1]] || m[1]) : 'Unknown Version'
        };
    }

    if (/Macintosh|MacIntel|MacPPC|Mac68K/i.test(platform + ' ' + ua)) {
        const m = ua.match(/Mac OS X ([0-9._]+)/i);
        return {
            os: 'Mac OS',
            version: m ? m[1].replace(/_/g, '.') : 'Unknown Version'
        };
    }

    if (/Linux/i.test(platform + ' ' + ua)) {
        return { os: 'Linux', version: 'Unknown Version' };
    }

    return { os: 'Unknown OS', version: 'Unknown Version' };
}


function startFungiSpores() {
    if (window.__fungiSporesStarted) return;
    window.__fungiSporesStarted = true;

    // Quick synchronous OS/iOS check to avoid async blocking
    const ua = navigator.userAgent || '';
    const isOldIOS = /iPhone|iPad|iPod/i.test(ua) && /OS [0-9]?[0-9]_[0-9]/i.test(ua) && !/OS 1[8-9]|OS [2-9][0-9]/i.test(ua);
    
    if (isOldIOS) {
        console.log('[Fungi Spores] Disabled on older iOS version.');
        return;
    }

    const oldCanvas = document.getElementById('fungi-spore-canvas');
    if (oldCanvas) oldCanvas.remove();

    const canvas = document.createElement('canvas');
    canvas.id = 'fungi-spore-canvas';

    Object.assign(canvas.style, {
        position: 'fixed',
        inset: '0',
        width: '100%',
        height: '100%',
        zIndex: '0',
        pointerEvents: 'none'
    });

    document.body.prepend(canvas);

    const ctx = canvas.getContext('2d', {
        alpha: true,
        desynchronized: true
    });

    if (!ctx) return;

    // Pre-load images and convert to ImageBitmaps for massive GPU performance gains
    let bitmaps = [];
    let imagesLoaded = 0;

    const imagePromises = [1, 2, 3].map(n => {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = `https://cdn.jsdelivr.net/gh/gibberish2/FungiWebFiles@main/sporeImages/backroundspore${n}.svg`;
            img.onload = async () => {
                try {
                    // Convert SVG to an optimized bitmap cache
                    const bitmap = await createImageBitmap(img);
                    resolve(bitmap);
                } catch (e) {
                    resolve(img); // Fallback to raw image if bitmap fails
                }
            };
            img.onerror = () => resolve(null);
        });
    });

    Promise.all(imagePromises).then(results => {
        bitmaps = results.filter(Boolean);
        imagesLoaded = bitmaps.length;
    });

    let count = 50;
    try {
        const saved = localStorage.getItem('sporeCount');
        if (saved !== null && saved.trim() !== '') {
            const parsed = parseInt(saved, 10);
            if (Number.isFinite(parsed)) {
                count = Math.max(0, Math.min(100, parsed));
            }
        }
    } catch (e) {}

    let particles = [];
    let width = 0;
    let height = 0;
    let frameId = 0;
    let lastFrame = 0;
    let accent = '#D07A04';
    let frameCounter = 0;

    function resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        width = window.innerWidth;
        height = window.innerHeight;

        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    class Spore {
        constructor(randomY = true) {
            this.reset(randomY);
            this.imageIndex = 0;
        }

        reset(randomY = false) {
            this.x = Math.random() * width;
            this.y = randomY ? Math.random() * height : -20;
            this.size = 16 + Math.random() * 24;
            this.speedY = 0.3 + Math.random() * 0.65;
            this.speedX = (Math.random() - 0.5) * 0.3;
            this.opacity = randomY ? 0.35 + Math.random() * 0.55 : 0.8;
            this.fade = 0.00004 + Math.random() * 0.00008;
            this.rotation = Math.random() * Math.PI * 2;
            this.rotationSpeed = (Math.random() - 0.5) * 0.004;
            if (imagesLoaded > 0) {
                this.imageIndex = Math.floor(Math.random() * imagesLoaded);
            }
        }

        update(delta) {
            this.x += this.speedX * delta;
            this.y += this.speedY * delta;
            this.opacity -= this.fade * delta;
            this.rotation += this.rotationSpeed * delta;

            if (this.y > height + 30 || this.opacity <= 0) {
                this.reset(false);
            }

            if (this.x < -30) this.x = width + 30;
            if (this.x > width + 30) this.x = -30;
        }

        draw() {
            if (this.opacity <= 0) return;

            ctx.globalAlpha = Math.max(0, Math.min(1, this.opacity));

            if (imagesLoaded > 0) {
                const asset = bitmaps[this.imageIndex];
                if (asset) {
                    const w = this.size;
                    const h = w * (asset.height && asset.width ? asset.height / asset.width : 1);

                    ctx.save();
                    ctx.translate(this.x, this.y);
                    ctx.rotate(this.rotation);
                    ctx.drawImage(asset, -w / 2, -h / 2, w, h);
                    ctx.restore();
                    return;
                }
            }

            // Fallback shape if images aren't ready
            ctx.fillStyle = accent;
            ctx.beginPath();
            ctx.ellipse(this.x, this.y, this.size * 0.18, this.size * 0.35, this.rotation, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function initParticles() {
        if (particles.length > count) {
            particles.length = count;
        }
        while (particles.length < count) {
            particles.push(new Spore());
        }
    }

    function animate(timestamp) {
        frameId = 0;

        if (document.hidden) {
            lastFrame = 0;
            return;
        }

        // Throttle to ~30 FPS (33ms) to save CPU/battery without looking choppy
        if (lastFrame && timestamp - lastFrame < 32) {
            frameId = requestAnimationFrame(animate);
            return;
        }

        const delta = lastFrame ? Math.min((timestamp - lastFrame) / 16.67, 2) : 1;
        lastFrame = timestamp;

        ctx.clearRect(0, 0, width, height);

        // Fetch CSS variable less frequently to avoid layout thrashing
        if (frameCounter++ % 60 === 0) {
            const computedAccent = getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim();
            if (computedAccent) accent = computedAccent;
        }

        for (let i = 0; i < particles.length; i++) {
            particles[i].update(delta);
            particles[i].draw();
        }

        ctx.globalAlpha = 1;
        frameId = requestAnimationFrame(animate);
    }

    function startAnimation() {
        if (!frameId && !document.hidden) {
            lastFrame = 0;
            frameId = requestAnimationFrame(animate);
        }
    }

    function stopAnimation() {
        if (frameId) cancelAnimationFrame(frameId);
        frameId = 0;
    }

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) stopAnimation();
        else startAnimation();
    });

    window.addEventListener('resize', resize);
    Object.assign(canvas.style, {
        position: 'fixed',
        inset: '0',
        width: '100%',
        height: '100%',
        zIndex: '-1',           // Pushes it behind the document body and normal flow
        pointerEvents: 'none',  // Ensures mouse clicks pass straight through to elements underneath
        background: 'transparent' // Prevents it from blocking underlying background colors
    });
    window.addEventListener('updateSpores', e => {
        const parsed = parseInt(e.detail, 10);
        count = Number.isFinite(parsed) ? Math.max(0, Math.min(100, parsed)) : 50;
        try {
            localStorage.setItem('sporeCount', count);
        } catch (err) {}
        initParticles();
    });

    resize();
    initParticles();
    startAnimation();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startFungiSpores, { once: true });
} else {
    startFungiSpores();
}
