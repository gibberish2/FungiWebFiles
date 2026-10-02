
            const themes = {
                ocean:    {   --bg-color: #FFFBEB;  --nav-color: #FDE68A; --accent-color: #9A3412; --text-color: #292524;  }; },

            };
        const saved = localStorage.getItem('userTheme') || 'ocean';
        const root = document.documentElement;
        const theme = themes[saved] || themes.ocean;
        for (let prop in theme) {
          root.style.setProperty(prop, theme[prop])
        }
