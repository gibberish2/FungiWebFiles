
            const themes = {
                ocean:    { '--bg-color': '#0f172a', '--nav-color': '#1e293b', '--accent-color': '#38bdf8' },
                forest:   { '--bg-color': '#064e3b', '--nav-color': '#065f46', '--accent-color': '#34d399' },
                sunset:   { '--bg-color': '#451a03', '--nav-color': '#78350f', '--accent-color': '#fbbf24' },
                midnight: { '--bg-color': '#000000', '--nav-color': '#111111', '--accent-color': '#a855f7' },
                cherry:   { '--bg-color': '#2d0a0e', '--nav-color': '#4a0e16', '--accent-color': '#ff4b5c' },
                electric: { '--bg-color': '#0a0a0a', '--nav-color': '#343D34', '--accent-color': '#00ff41' },
                noir:     { '--bg-color': '#0b0b0c', '--nav-color': '#1a1a1d', '--accent-color': '#7D7D7D' }
            };
        const saved = localStorage.getItem('userTheme') || 'ocean';
        const root = document.documentElement;
        const theme = themes[saved] || themes.ocean;
        for (let prop in theme) {
          root.style.setProperty(prop, theme[prop])
        }