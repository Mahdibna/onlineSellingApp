import { normalizeX, normalizeY } from 'utils/normalize';

const spacingX = {
  _3: normalizeX(3),
  _5: normalizeX(5),
  _7: normalizeX(7),
  _10: normalizeX(10),
  _15: normalizeX(15),
  _20: normalizeX(20),
  _25: normalizeX(25),
  _30: normalizeX(30),
};

const spacingY = {
  _5: normalizeY(5),
  _7: normalizeY(7),
  _10: normalizeY(10),
  _15: normalizeY(15),
  _20: normalizeY(20),
  _40: normalizeY(40),
  _60: normalizeY(60),
};

const height = {
  btn: normalizeY(50),
  input: normalizeY(45),
};

const radius = {
  _3: normalizeY(3),
  _6: normalizeY(6),
  _10: normalizeY(10),
  _12: normalizeY(12),
  _15: normalizeY(15),
  _20: normalizeY(20),
  _30: normalizeY(30),
};

export { spacingX, spacingY, radius, height };
