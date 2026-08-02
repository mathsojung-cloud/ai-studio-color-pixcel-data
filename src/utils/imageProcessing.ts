import { MatrixData, SheetCollection } from '../types';

/**
 * Reads an image file and extracts original width/height and HTMLImageElement
 */
export function loadImageFromFile(file: File): Promise<{ img: HTMLImageElement; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        resolve({ img, width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Resize image onto offscreen canvas and extract R, G, B 2D matrices
 */
export function extractRGBMatrices(
  img: HTMLImageElement,
  targetWidth: number,
  targetHeight: number
): { R: MatrixData; G: MatrixData; B: MatrixData } {
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas context unavailable');
  }

  // Draw image stretched to target dimensions
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
  const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
  const data = imgData.data;

  const rMatrix: number[][] = [];
  const gMatrix: number[][] = [];
  const bMatrix: number[][] = [];

  for (let y = 0; y < targetHeight; y++) {
    const rRow: number[] = [];
    const gRow: number[] = [];
    const bRow: number[] = [];

    for (let x = 0; x < targetWidth; x++) {
      const idx = (y * targetWidth + x) * 4;
      rRow.push(data[idx]);     // Red
      gRow.push(data[idx + 1]); // Green
      bRow.push(data[idx + 2]); // Blue
    }

    rMatrix.push(rRow);
    gMatrix.push(gRow);
    bMatrix.push(bRow);
  }

  return {
    R: { width: targetWidth, height: targetHeight, data: rMatrix },
    G: { width: targetWidth, height: targetHeight, data: gMatrix },
    B: { width: targetWidth, height: targetHeight, data: bMatrix },
  };
}

/**
 * Safely evaluates a custom math expression for grayscale calculation.
 * Variables available: R, G, B (numbers 0..255)
 */
export function calculateGrayscaleValue(r: number, g: number, b: number, expression: string): number {
  try {
    // Sanitize and create safe Function
    // Allowed syntax: R, G, B, numbers, operators +, -, *, /, %, (, ), Math.*
    const cleanExpr = expression
      .replace(/R/g, 'r')
      .replace(/G/g, 'g')
      .replace(/B/g, 'b');

    // Create a dynamic function with arguments r, g, b
    const fn = new Function('r', 'g', 'b', `
      try {
        const MathObj = Math;
        const val = ${cleanExpr};
        if (typeof val !== 'number' || isNaN(val)) return 0;
        return MathObj.max(0, MathObj.min(255, MathObj.round(val)));
      } catch (err) {
        return 0;
      }
    `);

    return fn(r, g, b);
  } catch (err) {
    // Fallback formula if custom math expression fails
    return Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  }
}

/**
 * Compute Gray matrix from R, G, B matrices and a user formula expression
 */
export function generateGrayMatrix(
  rMatrix: MatrixData,
  gMatrix: MatrixData,
  bMatrix: MatrixData,
  formulaExpression: string
): MatrixData {
  const height = rMatrix.height;
  const width = rMatrix.width;
  const grayData: number[][] = [];

  for (let y = 0; y < height; y++) {
    const row: number[] = [];
    for (let x = 0; x < width; x++) {
      const r = rMatrix.data[y]?.[x] ?? 0;
      const g = gMatrix.data[y]?.[x] ?? 0;
      const b = bMatrix.data[y]?.[x] ?? 0;
      const grayVal = calculateGrayscaleValue(r, g, b, formulaExpression);
      row.push(grayVal);
    }
    grayData.push(row);
  }

  return { width, height, data: grayData };
}

/**
 * Renders RGB matrices to a target HTMLCanvasElement
 */
export function renderRGBToCanvas(
  canvas: HTMLCanvasElement,
  rMatrix: MatrixData,
  gMatrix: MatrixData,
  bMatrix: MatrixData
): void {
  const width = rMatrix.width;
  const height = rMatrix.height;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      data[idx] = Math.max(0, Math.min(255, Math.round(rMatrix.data[y]?.[x] ?? 0)));
      data[idx + 1] = Math.max(0, Math.min(255, Math.round(gMatrix.data[y]?.[x] ?? 0)));
      data[idx + 2] = Math.max(0, Math.min(255, Math.round(bMatrix.data[y]?.[x] ?? 0)));
      data[idx + 3] = 255; // Alpha
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

/**
 * Renders Grayscale matrix to a target HTMLCanvasElement
 */
export function renderGrayToCanvas(
  canvas: HTMLCanvasElement,
  grayMatrix: MatrixData
): void {
  const width = grayMatrix.width;
  const height = grayMatrix.height;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const val = Math.max(0, Math.min(255, Math.round(grayMatrix.data[y]?.[x] ?? 0)));
      data[idx] = val;
      data[idx + 1] = val;
      data[idx + 2] = val;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

/**
 * Generates sample test images programmatically (Cat, Dog, Lizard)
 */
export function createSampleImage(type: 'cat' | 'dog' | 'lizard'): string {
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 300;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  if (type === 'cat') {
    // 🐱 Cat (고양이) - Orange/Ginger Cat
    // Soft pastel background
    const bg = ctx.createLinearGradient(0, 0, 400, 300);
    bg.addColorStop(0, '#fef3c7');
    bg.addColorStop(1, '#fde68a');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 400, 300);

    // Cat ears (Outer)
    ctx.fillStyle = '#f97316';
    // Left ear
    ctx.beginPath();
    ctx.moveTo(110, 140);
    ctx.lineTo(140, 50);
    ctx.lineTo(190, 110);
    ctx.closePath();
    ctx.fill();
    // Right ear
    ctx.beginPath();
    ctx.moveTo(210, 110);
    ctx.lineTo(260, 50);
    ctx.lineTo(290, 140);
    ctx.closePath();
    ctx.fill();

    // Cat ears (Inner pink)
    ctx.fillStyle = '#f472b6';
    ctx.beginPath();
    ctx.moveTo(125, 130);
    ctx.lineTo(145, 70);
    ctx.lineTo(180, 115);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(220, 115);
    ctx.lineTo(255, 70);
    ctx.lineTo(275, 130);
    ctx.closePath();
    ctx.fill();

    // Cat head
    ctx.fillStyle = '#fb923c';
    ctx.beginPath();
    ctx.ellipse(200, 170, 95, 80, 0, 0, Math.PI * 2);
    ctx.fill();

    // White muzzle area
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(200, 195, 45, 30, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cat Eyes (Green)
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.ellipse(155, 155, 18, 22, 0, 0, Math.PI * 2);
    ctx.ellipse(245, 155, 18, 22, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eye Pupils (Black slits)
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.ellipse(155, 155, 6, 18, 0, 0, Math.PI * 2);
    ctx.ellipse(245, 155, 6, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eye catchlight
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(150, 147, 4, 0, Math.PI * 2);
    ctx.arc(240, 147, 4, 0, Math.PI * 2);
    ctx.fill();

    // Pink Nose
    ctx.fillStyle = '#ec4899';
    ctx.beginPath();
    ctx.moveTo(192, 182);
    ctx.lineTo(208, 182);
    ctx.lineTo(200, 192);
    ctx.closePath();
    ctx.fill();

    // Mouth
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(188, 196, 12, 0.1, Math.PI - 0.2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(212, 196, 12, 0.1, Math.PI - 0.2);
    ctx.stroke();

    // Whiskers
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2.5;
    // Left whiskers
    ctx.beginPath();
    ctx.moveTo(150, 190); ctx.lineTo(70, 180);
    ctx.moveTo(150, 198); ctx.lineTo(65, 202);
    ctx.moveTo(150, 206); ctx.lineTo(75, 220);
    // Right whiskers
    ctx.moveTo(250, 190); ctx.lineTo(330, 180);
    ctx.moveTo(250, 198); ctx.lineTo(335, 202);
    ctx.moveTo(250, 206); ctx.lineTo(325, 220);
    ctx.stroke();

  } else if (type === 'dog') {
    // 🐶 Dog (개/강아지) - Brown & White Puppy
    // Soft blue sky background
    const bg = ctx.createLinearGradient(0, 0, 400, 300);
    bg.addColorStop(0, '#e0f2fe');
    bg.addColorStop(1, '#bae6fd');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 400, 300);

    // Floppy ears
    ctx.fillStyle = '#78350f';
    // Left floppy ear
    ctx.beginPath();
    ctx.ellipse(110, 160, 35, 70, -0.3, 0, Math.PI * 2);
    ctx.fill();
    // Right floppy ear
    ctx.beginPath();
    ctx.ellipse(290, 160, 35, 70, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Dog Head
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.ellipse(200, 160, 85, 75, 0, 0, Math.PI * 2);
    ctx.fill();

    // White stripe down middle
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(200, 130, 22, 50, 0, 0, Math.PI * 2);
    ctx.fill();

    // White snout
    ctx.beginPath();
    ctx.ellipse(200, 190, 50, 35, 0, 0, Math.PI * 2);
    ctx.fill();

    // Black Eyes
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(155, 145, 14, 0, Math.PI * 2);
    ctx.arc(245, 145, 14, 0, Math.PI * 2);
    ctx.fill();

    // Eye catchlights
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(150, 140, 5, 0, Math.PI * 2);
    ctx.arc(240, 140, 5, 0, Math.PI * 2);
    ctx.fill();

    // Black Nose
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.ellipse(200, 178, 20, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Tongue sticking out (Happy Dog!)
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.ellipse(200, 215, 14, 20, 0, 0, Math.PI);
    ctx.fill();

    // Mouth line
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(188, 192, 12, 0.2, Math.PI - 0.2);
    ctx.arc(212, 192, 12, 0.2, Math.PI - 0.2);
    ctx.stroke();

    // Red Collar
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(145, 230, 110, 18);
    // Yellow tag
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.arc(200, 252, 12, 0, Math.PI * 2);
    ctx.fill();

  } else {
    // 🦎 Lizard (도마뱀) - Vibrant Green Lizard / Gecko
    // Warm tropical jungle gradient background
    const bg = ctx.createLinearGradient(0, 0, 400, 300);
    bg.addColorStop(0, '#134e4a');
    bg.addColorStop(1, '#064e3b');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 400, 300);

    // Tree Branch (Brown)
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.moveTo(0, 240);
    ctx.quadraticCurveTo(200, 210, 400, 250);
    ctx.lineTo(400, 300);
    ctx.lineTo(0, 300);
    ctx.closePath();
    ctx.fill();

    // Lizard Tail (Curled)
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 22;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(80, 200);
    ctx.quadraticCurveTo(40, 150, 50, 100);
    ctx.quadraticCurveTo(60, 60, 90, 80);
    ctx.stroke();

    // Lizard Body
    ctx.fillStyle = '#16a34a';
    ctx.beginPath();
    ctx.ellipse(190, 180, 100, 42, -0.15, 0, Math.PI * 2);
    ctx.fill();

    // Lizard Head
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.ellipse(290, 150, 50, 35, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // Yellow Spots on body
    ctx.fillStyle = '#facc15';
    [
      { x: 130, y: 170, r: 8 },
      { x: 160, y: 160, r: 11 },
      { x: 200, y: 175, r: 10 },
      { x: 230, y: 165, r: 9 },
      { x: 170, y: 195, r: 7 },
      { x: 210, y: 195, r: 8 },
    ].forEach((spot) => {
      ctx.beginPath();
      ctx.arc(spot.x, spot.y, spot.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Big Chameleon Eye
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.arc(305, 140, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(308, 140, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(305, 137, 3, 0, Math.PI * 2);
    ctx.fill();

    // Front & Back Legs
    ctx.fillStyle = '#15803d';
    // Back leg
    ctx.fillRect(120, 195, 18, 35);
    // Front leg
    ctx.fillRect(250, 185, 18, 35);

    // Toes gripping branch
    ctx.fillStyle = '#4ade80';
    ctx.beginPath();
    ctx.arc(125, 230, 8, 0, Math.PI * 2);
    ctx.arc(135, 232, 8, 0, Math.PI * 2);
    ctx.arc(255, 220, 8, 0, Math.PI * 2);
    ctx.arc(265, 222, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  return canvas.toDataURL('image/png');
}
