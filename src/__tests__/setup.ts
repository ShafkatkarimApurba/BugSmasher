import { vi, beforeEach } from 'vitest';

// Mock Firebase modules globally
vi.mock('../lib/firebase', () => ({
  auth: {
    currentUser: null,
    onAuthStateChanged: vi.fn((cb) => {
      cb(null);
      return vi.fn();
    }),
  },
  db: {},
  googleProvider: {},
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => ({})),
  getDoc: vi.fn(() => ({ exists: () => false })),
  setDoc: vi.fn(() => Promise.resolve()),
  onSnapshot: vi.fn(() => vi.fn()),
  query: vi.fn(),
  collection: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  getDocs: vi.fn(() => Promise.resolve({ docs: [] })),
  serverTimestamp: vi.fn(() => new Date()),
  increment: vi.fn((n) => n),
}));

// Mock HTMLCanvasElement.prototype.getContext for jsdom
HTMLCanvasElement.prototype.getContext = function (type: string) {
  if (type === '2d') {
    return {
      fillRect: vi.fn(),
      clearRect: vi.fn(),
      getImageData: vi.fn((x, y, w, h) => ({
        data: new Uint8ClampedArray(w * h * 4),
        width: w,
        height: h
      })),
      putImageData: vi.fn(),
      createImageData: vi.fn((w, h) => ({
        data: new Uint8ClampedArray(w * h * 4),
        width: w,
        height: h
      })),
      setTransform: vi.fn(),
      drawImage: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      quadraticCurveTo: vi.fn(),
      bezierCurveTo: vi.fn(),
      closePath: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      arc: vi.fn(),
      ellipse: vi.fn(),
      arcTo: vi.fn(),
      createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
      createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
      createPattern: vi.fn(() => ({})),
      translate: vi.fn(),
      scale: vi.fn(),
      rotate: vi.fn(),
      fillText: vi.fn(),
      measureText: vi.fn(() => ({ width: 0 })),
      transform: vi.fn(),
      rect: vi.fn(),
      clip: vi.fn(),
      setLineDash: vi.fn(),
      getLineDash: vi.fn(() => []),
      canvas: this,
      shadowColor: '',
      shadowBlur: 0,
      shadowOffsetX: 0,
      shadowOffsetY: 0,
      globalAlpha: 1,
      globalCompositeOperation: 'source-over',
      lineCap: 'butt',
      lineJoin: 'miter',
      lineWidth: 1,
      miterLimit: 10
    } as any;
  }
  return null;
} as any;

beforeEach(() => {
  localStorage.clear();
});
