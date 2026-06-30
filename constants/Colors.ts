export const palette = {
  cobalt:  '#2B5AA3',
  indigo:  '#15243B',
  amber:   '#BD8318',
  olive:   '#5E7355',
  cal:     '#FBFAF7',
  white:   '#FFFFFF',
  muted:   '#8A9BB0',
};

export default {
  light: {
    text:             palette.indigo,
    background:       palette.cal,
    tint:             palette.cobalt,
    tabIconDefault:   palette.muted,
    tabIconSelected:  palette.cobalt,
  },
  dark: {
    text:             palette.cal,
    background:       palette.indigo,
    tint:             palette.cobalt,
    tabIconDefault:   palette.muted,
    tabIconSelected:  palette.cobalt,
  },
};
