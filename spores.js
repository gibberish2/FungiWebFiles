
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

    (async () => {
        try {
            const details = await getOSDetails();
            const major = parseInt(details.version, 10);

            if (
                details.os === 'iOS' &&
                Number.isFinite(major) &&
                major <= 17
            ) {
                console.log('[Fungi Spores] Disabled on iOS', details.version);
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

            // Insert first, behind normal page content.
            document.body.prepend(canvas);

            const ctx = canvas.getContext('2d', {
                alpha: true,
                desynchronized: true
            });

            if (!ctx) throw new Error('Canvas is not supported');

            // Load the three SVGs only once.
            const images = [1, 2, 3].map(n => {
                const img = new Image();
                img.src =
                    `https://cdn.jsdelivr.net/gh/gibberish2/FungiWebFiles@main/sporeImages/backroundspore${n}.svg`;
                return img;
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
                // Limit pixel density to reduce GPU/CPU work.
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
                    this.imageIndex = Math.floor(Math.random() * images.length);
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
                }

                update(delta) {
                    this.x += this.speedX * delta;
                    this.y += this.speedY * delta;
                    this.opacity -= this.fade * delta;
                    this.rotation += this.rotationSpeed * delta;

                    if (this.y > height + 30 || this.opacity <= 0) {
                        this.reset(false);
                    }

                    // Wrap horizontally instead of leaving particles stuck offscreen.
                    if (this.x < -30) this.x = width + 30;
                    if (this.x > width + 30) this.x = -30;
                }

                draw() {
                    if (this.opacity <= 0) return;

                    const img = images[this.imageIndex];
                    const imageReady = img.complete && img.naturalWidth > 0;

                    ctx.globalAlpha = Math.max(0, Math.min(1, this.opacity));

                    if (imageReady) {
                        const aspect = img.naturalHeight / img.naturalWidth;
                        const w = this.size;
                        const h = w * (Number.isFinite(aspect) && aspect > 0 ? aspect : 1);

                        ctx.save();
                        ctx.translate(this.x, this.y);
                        ctx.rotate(this.rotation);
                        ctx.drawImage(img, -w / 2, -h / 2, w, h);
                        ctx.restore();
                    } else {
                        // Cheap fallback: no shadows or expensive effects.
                        ctx.fillStyle = accent;
                        ctx.beginPath();
                        ctx.ellipse(
                            this.x,
                            this.y,
                            this.size * 0.18,
                            this.size * 0.35,
                            this.rotation,
                            0,
                            Math.PI * 2
                        );
                        ctx.fill();
                    }
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

                // Stop drawing when the tab is hidden.
                if (document.hidden) {
                    lastFrame = 0;
                    return;
                }

                // Cap to 30 FPS for substantially less work.
                if (timestamp - lastFrame < 60) {
                    frameId = requestAnimationFrame(animate);
                    return;
                }

                const delta = lastFrame
                    ? Math.min((timestamp - lastFrame) / 16.67, 2)
                    : 1;

                lastFrame = timestamp;

                ctx.clearRect(0, 0, width, height);

                // Update theme color occasionally, not for every particle.
                if (frameCounter++ % 30 === 0) {
                    accent = getComputedStyle(document.documentElement)
                        .getPropertyValue('--accent-color').trim();
                }

                for (const p of particles) {
                    p.update(delta);
                    p.draw();
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
                if (document.hidden) {
                    stopAnimation();
                } else {
                    startAnimation();
                }
            });

            window.addEventListener('resize', resize);

            window.addEventListener('updateSpores', e => {
                const parsed = parseInt(e.detail, 10);
                count = Number.isFinite(parsed)
                    ? Math.max(0, Math.min(100, parsed))
                    : 50;

                try {
                    localStorage.setItem('sporeCount', count);
                } catch (err) {}

                initParticles();
            });

            resize();
            initParticles();
            startAnimation();

            console.log('[Fungi Spores] Optimized animation started.', {
                os: details.os,
                version: details.version,
                count
            });

        } catch (error) {
            window.__fungiSporesStarted = false;
            console.error('[Fungi Spores] Error:', error);
        }
    })();
}


if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startFungiSpores, {
        once: true
    });
} else {
    startFungiSpores();
}
