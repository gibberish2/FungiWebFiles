async function getOSDetails() {
  let osName = 'Unknown OS';
  let osVersion = 'Unknown Version';

  // 1. Try Modern User-Agent Client Hints API (Chromium browsers: Chrome, Edge, Opera)
  if (navigator.userAgentData) {
    osName = navigator.userAgentData.platform;
    
    try {
      // Version requires a separate async check for privacy reasons
      const highEntropyData = await navigator.userAgentData.getHighEntropyValues(['platformVersion']);
      osVersion = highEntropyData.platformVersion;
      
      // Special Fix for Windows: Windows 11 reports version 13.0.0+ while Windows 10 is lower
      if (osName === 'Windows') {
        const majorVersion = parseInt(osVersion.split('.')[0], 10);
        if (majorVersion >= 13) osName = 'Windows 11';
        else if (majorVersion > 0) osName = 'Windows 10';
      }
    } catch (e) {
      // Fallback if version retrieval fails
    }
    
    return { os: osName, version: osVersion };
  }

  // 2. Legacy Fallback (Firefox, Safari, and older browsers)
  const ua = navigator.userAgent;
  const platform = navigator.platform;

  if (/Macintosh|MacIntel|MacPPC|Mac68K/.test(platform)) {
    osName = 'Mac OS';
    const macMatch = ua.match(/Mac OS X ([0-9._]+)/);
    if (macMatch) osVersion = macMatch[1].replace(/_/g, '.');
  } else if (/iPhone|iPad|iPod/.test(platform) || (platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
    osName = 'iOS';
    const iosMatch = ua.match(/OS ([0-9._]+) like Mac OS X/);
    if (iosMatch) osVersion = iosMatch[1].replace(/_/g, '.');
  } else if (/Android/.test(ua)) {
    osName = 'Android';
    const androidMatch = ua.match(/Android ([0-9.]+)/);
    if (androidMatch) osVersion = androidMatch[1];
  } else if (/Win32|Win64|Windows/.test(platform)) {
    osName = 'Windows';
    const winMatch = ua.match(/Windows NT ([0-9.]+)/);
    if (winMatch) {
      // Map legacy NT versions to standard marketing names
      const ntMap = { '10.0': '10', '6.3': '8.1', '6.2': '8', '6.1': '7' };
      osVersion = ntMap[winMatch[1]] || winMatch[1];
    }
  } else if (/Linux/.test(platform)) {
    osName = 'Linux';
  }

  return { os: osName, version: osVersion };
}

// How to use it:
getOSDetails().then(details => {
  console.log(`OS: ${details.os}`);          // e.g., "Windows 11" or "Mac OS"
  console.log(`Version: ${details.version}`); // e.g., "15.0.0" or "10.15.7"
});

    
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
const majorVersion = parseInt(osVersion, 10);

if (osName === "iOS" && majorVersion < 17) {
  particleCount = 3;
}else{
  particleCount = 50;
};

class Spore {
    constructor() {
        this.init(true);
    }

    init(randomY = false) {
        this.x = Math.random() * canvas.width;
        this.y = randomY ? Math.random() * canvas.height : -50;

        this.size = Math.random() * 4;
        this.baseSpeedY = Math.random() * 0.8 + 0.3;
        this.speedX = (Math.random() - 0.5) * 0.5;
        this.opacity = randomY ? Math.random() : 1;
        this.fadeSpeed = Math.random() * 0.00003 + 0.0001;
        this.parallaxMult = this.size * 0.5;

        this.imgtype = Math.floor(Math.random() * 3) + 1;

        this.img = new Image();
        this.img.src = `https://cdn.jsdelivr.net/gh/gibberish2/FungiWebFiles@main/sporeImages/backroundspore${this.imgtype}.svg`; }

    update() {
        this.y += this.baseSpeedY;
        this.x += this.speedX;
        this.opacity -= this.fadeSpeed;

        if (this.opacity <= 0 || this.y > canvas.height + 50) {
            this.init(false);
        }
    }

    draw(accent) {
        if (!this.img.complete || this.img.naturalWidth === 0) {
            return;
        }

        const width = 20 + this.size * 8;
        const height = width * (this.img.naturalHeight / this.img.naturalWidth);

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
/*OG SPORE CIRCLES
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
*/
        
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
        const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim();
        
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

