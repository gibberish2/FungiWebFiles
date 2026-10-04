const theme = {
  '--bg-color':     '#FFFBEB',
  '--nav-color':    '#FDE68A',
  '--accent-color': '#9A3412',
  '--text-color':   '#292524',
};

for (const [prop, value] of Object.entries(theme)) {
  document.documentElement.style.setProperty(prop, value);
}
