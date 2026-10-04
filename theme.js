const theme = {
  '--bg-color':     '#6B4429',  
  '--nav-color':    '#8A5A36',  
  '--accent-color': '#F2A65A',  
  '--text-color':   '#FFFFFF',  
};

for (const [prop, value] of Object.entries(theme)) {
  document.documentElement.style.setProperty(prop, value);
}
