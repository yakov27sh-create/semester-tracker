function make3dBoxShadow(hslColor: string, x: number, y: number) {
  return `${x}px ${y}px 0px 0px ${darkenHsl(hslColor)}`;
}

function darkenHsl(hslString: string, amount = 10) {
  const regex = /hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/;
  const matches = hslString.match(regex);

  if (!matches) {
    return hslString;
  }

  const hue = matches[1]; // "320"
  const saturation = matches[2]; // "65"
  const lightness = parseInt(matches[3]); // 80 (as a number)

  const newLightness = Math.max(0, lightness - amount);

  return `hsl(${hue}, ${saturation}%, ${newLightness}%)`;
}
export { make3dBoxShadow, darkenHsl };
