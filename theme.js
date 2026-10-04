const theme = {
  '--bg-color':     '#7a3e1a',
  '--nav-color':    '#E8B987', 
  '--accent-color': '#B4471F',  
  '--text-color':   '#3B2A20',  
};

for (const [prop, value] of Object.entries(theme)) {
  document.documentElement.style.setProperty(prop, value);
}
