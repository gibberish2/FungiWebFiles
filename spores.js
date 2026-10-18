async function getOSDetails() {
    let osName = 'Unknown OS';
    let osVersion = 'Unknown Version';

    const ua = navigator.userAgent || '';
    const platform = navigator.platform || '';

    // 1. Detect iOS first, including iPads using desktop mode
    const isIOS =
        /iPhone|iPad|iPod/i.test(ua) ||
        (platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    if (isIOS) {
        osName = 'iOS';

        const iosMatch = ua.match(/OS ([0-9]+(?:[_\.][0-9]+)*)/i);

        if (iosMatch) {
            osVersion = iosMatch[1].replace(/_/g, '.');
        }

        return { os: osName, version: osVersion };
    }

    // 2. Try the modern User-Agent Client Hints API
    if (navigator.userAgentData) {
        try {
            const highEntropyData =
                await navigator.userAgentData.getHighEntropyValues([
                    'platformVersion'
                ]);

            osName = navigator.userAgentData.platform || osName;
            osVersion = highEntropyData.platformVersion || osVersion;

            // Identify Windows 10 and Windows 11
            if (osName === 'Windows') {
                const majorVersion = parseInt(
                    osVersion.split('.')[0],
                    10
                );

                if (majorVersion >= 13) {
                    osName = 'Windows 11';
                    osVersion = '11';
                } else if (majorVersion > 0) {
                    osVersion = '10';
                }
            }

            if (osName !== 'Unknown OS') {
                return { os: osName, version: osVersion };
            }
        } catch (e) {
            console.warn(
                '[Fungi Spores] OS detection API unavailable; using fallback.'
            );
        }
    }

    // 3. Legacy fallback for browsers without Client Hints

    if (/Android/i.test(ua)) {
        osName = 'Android';

        const androidMatch = ua.match(/Android ([0-9.]+)/i);

        if (androidMatch) {
            osVersion = androidMatch[1];
        }

    } else if (/Windows|Win32|Win64/i.test(platform + ' ' + ua)) {
        osName = 'Windows';

        const winMatch = ua.match(/Windows NT ([0-9.]+)/i);

        if (winMatch) {
            const ntMap = {
                '10.0': '10',
                '6.3': '8.1',
                '6.2': '8',
                '6.1': '7',
                '6.0': 'Vista',
                '5.1': 'XP'
            };

            osVersion = ntMap[winMatch[1]] || winMatch[1];
        }

    } else if (/Macintosh|MacIntel|MacPPC|Mac68K/i.test(
        platform + ' ' + ua
    )) {
        osName = 'Mac OS';

        const macMatch = ua.match(/Mac OS X ([0-9._]+)/i);

        if (macMatch) {
            osVersion = macMatch[1].replace(/_/g, '.');
        }

    } else if (/Linux/i.test(platform + ' ' + ua)) {
        osName = 'Linux';
    }

    return { os: osName, version: osVersion };
}


// ============================================================
// FUNGI SPORE ANIMATION
// ============================================================

function startFungiSpores() {

    // Prevent accidentally starting multiple animation loops
    if (window.__fungiSporesStarted) {
        return;
    }

    window.__fungiSporesStarted = true;

    async function initializeSpores() {

        try {

            // Wait for OS detection
            let details;

            try {
                details = await getOSDetails();
            } catch (error) {
                details = {
                    os: 'Unknown OS',
                    version: 'Unknown Version'
                };
            }

            const majorVersion = parseInt(
                details.version,
                10
            );

            // Only disable spores on iOS 17 and below
            const hideSpores =
                details.os === 'iOS' &&
                Number.isFinite(majorVersion) &&
                majorVersion <= 17;

            // Remove any previous canvas
            const oldCanvas = document.getElementById(
                'fungi-spore-canvas'
            );

            if (oldCanvas) {
                oldCanvas.remove();
            }

            // Stop here ONLY on detected iOS 17 or earlier
            if (hideSpores) {
                console.log(
                    '[Fungi Spores] Disabled on iOS',
                    details.version
                );

                return;
            }

            // ------------------------------------------------
            // Particle settings
            // ------------------------------------------------

            let savedCount = null;

            try {
                savedCount = localStorage.getItem('sporeCount');
            } catch (error) {
                // Local storage may be unavailable
            }

            let particleCount = 50;

            if (savedCount !== null) {
                const parsedCount = parseInt(savedCount, 10);

                if (Number.isFinite(parsedCount)) {
                    particleCount = Math.max(
                        0,
                        Math.min(300, parsedCount)
                    );
                }
            }

            let particles = [];

            // ------------------------------------------------
            // Create the canvas
            // ------------------------------------------------

            const canvas = document.createElement('canvas');

            canvas.id = 'fungi-spore-canvas';
            canvas.setAttribute('aria-hidden', 'true');

            // Important: put the canvas above normal page
            // content so that wrappers cannot hide the spores.
            // pointer-events:none keeps the website clickable.
            canvas.style.setProperty(
                'position',
                'fixed',
                'important'
            );

            canvas.style.setProperty(
                'top',
                '0',
                'important'
            );

            canvas.style.setProperty(
                'left',
                '0',
                'important'
            );

            canvas.style.setProperty(
                'width',
                '100vw',
                'important'
            );

            canvas.style.setProperty(
                'height',
                '100vh',
                'important'
            );

            canvas.style.setProperty(
                'z-index',
                '2147483647',
                'important'
            );

            canvas.style.setProperty(
                'pointer-events',
                'none',
                'important'
            );

            canvas.style.setProperty(
                'display',
                'block',
                'important'
            );

            canvas.style.setProperty(
                'visibility',
                'visible',
                'important'
            );

            canvas.style.setProperty(
                'opacity',
                '1',
                'important'
            );

            // Attach to the body without modifying the position
            // or z-index of the rest of the website.
            document.body.appendChild(canvas);

            const ctx = canvas.getContext('2d');

            if (!ctx) {
                console.error(
                    '[Fungi Spores] Could not create 2D canvas context.'
                );

                canvas.remove();
                return;
            }

            // ------------------------------------------------
            // Canvas resizing
            // ------------------------------------------------

            function resize() {
                const dpr = Math.min(
                    window.devicePixelRatio || 1,
                    2
                );

                canvas.width = Math.round(
                    window.innerWidth * dpr
                );

                canvas.height = Math.round(
                    window.innerHeight * dpr
                );

                ctx.setTransform(
                    dpr,
                    0,
                    0,
                    dpr,
                    0,
                    0
                );
            }

            window.addEventListener('resize', resize);

            resize();

            // ------------------------------------------------
            // Spore image loading
            // ------------------------------------------------

            const warnedImageUrls = new Set();

            class Spore {

                constructor() {
                    // Choose one of the original SVG images
                    this.imgtype =
                        Math.floor(Math.random() * 3) + 1;

                    this.img = new Image();

                    const imageUrl =
                        `https://cdn.jsdelivr.net/gh/gibberish2/FungiWebFiles@main/sporeImages/backroundspore${this.imgtype}.svg`;

                    this.img.onerror = () => {

                        // Warn only once per failed image URL.
                        // The fallback spores still render.
                        if (!warnedImageUrls.has(imageUrl)) {
                            warnedImageUrls.add(imageUrl);

                            console.warn(
                                '[Fungi Spores] SVG unavailable; drawing fallback:',
                                imageUrl
                            );
                        }
                    };

                    this.img.src = imageUrl;

                    this.init(true);
                }

                init(randomY = false) {
                    this.x =
                        Math.random() * window.innerWidth;

                    this.y = randomY
                        ? Math.random() * window.innerHeight
                        : -50;

                    this.size = Math.random() * 4;

                    this.baseSpeedY =
                        Math.random() * 0.8 + 0.3;

                    this.speedX =
                        (Math.random() - 0.5) * 0.5;

                    this.opacity = randomY
                        ? Math.random()
                        : 1;

                    this.fadeSpeed =
                        Math.random() * 0.00003 + 0.0001;

                    this.rotation =
                        Math.random() * Math.PI * 2;

                    this.rotationSpeed =
                        (Math.random() - 0.5) * 0.01;

                    this.parallaxMult = this.size * 0.5;
                }

                update() {
                    this.y += this.baseSpeedY;
                    this.x += this.speedX;

                    this.opacity -= this.fadeSpeed;

                    this.rotation += this.rotationSpeed;

                    // Recycle spores when they fade or leave
                    // the screen.
                    if (
                        this.opacity <= 0 ||
                        this.y > window.innerHeight + 50
                    ) {
                        this.init(false);
                    }
                }

                draw(accent) {

                    const width = 20 + this.size * 8;

                    // Clamp opacity to a valid canvas value
                    const opacity = Math.max(
                        0,
                        Math.min(1, this.opacity)
                    );

                    // ----------------------------------------
                    // Preferred rendering: original SVG
                    // ----------------------------------------

                    if (
                        this.img.complete &&
                        this.img.naturalWidth > 0 &&
                        this.img.naturalHeight > 0
                    ) {

                        const height =
                            width *
                            (
                                this.img.naturalHeight /
                                this.img.naturalWidth
                            );

                        ctx.save();

                        ctx.globalAlpha = opacity;

                        ctx.shadowBlur = 2;
                        ctx.shadowColor = '#D07A04';

                        ctx.translate(this.x, this.y);
                        ctx.rotate(this.rotation);

                        ctx.drawImage(
                            this.img,
                            -width / 2,
                            -height / 2,
                            width,
                            height
                        );

                        ctx.restore();

                        return;
                    }

                    // ----------------------------------------
                    // Fallback rendering: always visible spores
                    // ----------------------------------------

                    // These draw immediately while the images
                    // load, and remain if the images fail.
                    const color = accent || '#D07A04';

                    const height = width * 0.8;

                    ctx.save();

                    ctx.translate(this.x, this.y);
                    ctx.rotate(this.rotation);

                    ctx.globalAlpha = opacity;

                    ctx.shadowBlur = 7;
                    ctx.shadowColor = color;

                    ctx.fillStyle = color;
                    ctx.strokeStyle = color;

                    // Main spore body
                    ctx.beginPath();

                    ctx.ellipse(
                        0,
                        0,
                        width * 0.19,
                        height * 0.36,
                        0,
                        0,
                        Math.PI * 2
                    );

                    ctx.fill();

                    // Small highlight
                    ctx.shadowBlur = 0;

                    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';

                    ctx.beginPath();

                    ctx.ellipse(
                        -width * 0.045,
                        -height * 0.09,
                        width * 0.045,
                        height * 0.09,
                        -0.25,
                        0,
                        Math.PI * 2
                    );

                    ctx.fill();

                    ctx.restore();
                }
            }

            // ------------------------------------------------
            // Initialize the particle array
            // ------------------------------------------------

            function initParticles() {

                if (particles.length > particleCount) {
                    particles.splice(particleCount);

                } else {

                    while (particles.length < particleCount) {
                        particles.push(new Spore());
                    }
                }
            }

            // ------------------------------------------------
            // Support the existing Fungi settings event
            // ------------------------------------------------

            window.addEventListener('updateSpores', (e) => {

                const newCount = parseInt(e.detail, 10);

                particleCount = Number.isFinite(newCount)
                    ? Math.max(0, Math.min(300, newCount))
                    : 50;

                try {
                    localStorage.setItem(
                        'sporeCount',
                        particleCount
                    );
                } catch (error) {
                    // Animation still works without local storage
                }

                initParticles();
            });

            // ------------------------------------------------
            // Animation loop
            // ------------------------------------------------

            let frameCount = 0;

            let accent = getComputedStyle(
                document.documentElement
            ).getPropertyValue('--accent-color').trim()
                || '#D07A04';

            function animate() {

                ctx.clearRect(
                    0,
                    0,
                    window.innerWidth,
                    window.innerHeight
                );

                // Refresh the theme accent periodically
                if (frameCount % 60 === 0) {

                    accent = getComputedStyle(
                        document.documentElement
                    ).getPropertyValue('--accent-color').trim()
                        || '#D07A04';
                }

                frameCount++;

                for (const spore of particles) {
                    spore.update();
                    spore.draw(accent);
                }

                requestAnimationFrame(animate);
            }

            // ------------------------------------------------
            // START
            // ------------------------------------------------

            initParticles();

            animate();

            console.log('[Fungi Spores] Initialization complete.');
            console.log('OS:', details.os);
            console.log('OS version:', details.version);
            console.log('Spores disabled:', hideSpores);
            console.log('Particle count:', particleCount);
            console.log('Canvas:', canvas);
            console.log(
                'Fallback spores enabled: true'
            );

        } catch (error) {

            console.error(
                '[Fungi Spores] Initialization failed:',
                error
            );

            window.__fungiSporesStarted = false;
        }
    }

    initializeSpores();
}



if (document.readyState === 'loading') {

    document.addEventListener(
        'DOMContentLoaded',
        startFungiSpores,
        { once: true }
    );

} else {

    startFungiSpores();
}
