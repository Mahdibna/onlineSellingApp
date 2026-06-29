// src/styles/theme.js

const colors = {
  background: '#FFFFFF', // main app background
  surface: '#FFFFFF',
  primaryButton: '#F5C518', // yellow used for buttons (slightly darker than pure gold)
  primaryButtonContrast: '#000000',
  bannerBackground: 'rgba(245,197,24,0.12)', // yellow with transparency for banners
  textPrimaryStart: '#000000', // gradient start for headings
  textPrimaryEnd: '#333333', // gradient end for body text
  muted: '#6b6b6b',
  border: '#E6E6E6',
  white: '#FFFFFF',
};

const spacing = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
};

const typography = {
  heading: { fontSize: 18, fontWeight: '700' },
  subheading: { fontSize: 16, fontWeight: '600' },
  body: { fontSize: 14, fontWeight: '400' },
  button: { fontSize: 15, fontWeight: '700' },
};

const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 6,
  },
};

export default { colors, spacing, typography, shadows };
