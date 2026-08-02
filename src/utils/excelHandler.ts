import * as XLSX from 'xlsx';
import { MatrixData, SheetCollection } from '../types';

/**
 * Downloads a multi-sheet Excel file (.xlsx) containing R, G, B (and optional Gray) worksheets.
 */
export function exportToExcel(
  sheets: { R?: MatrixData; G?: MatrixData; B?: MatrixData; Gray?: MatrixData },
  filename = 'pixel_rgb_sheets.xlsx'
): void {
  const workbook = XLSX.utils.book_new();

  // Helper to append a matrix worksheet
  const appendMatrixSheet = (sheetName: string, matrix: MatrixData) => {
    // Convert 2D array of numbers directly to a worksheet
    const ws = XLSX.utils.aoa_to_sheet(matrix.data);
    XLSX.utils.book_append_sheet(workbook, ws, sheetName);
  };

  if (sheets.R) appendMatrixSheet('R', sheets.R);
  if (sheets.G) appendMatrixSheet('G', sheets.G);
  if (sheets.B) appendMatrixSheet('B', sheets.B);
  if (sheets.Gray) appendMatrixSheet('Gray', sheets.Gray);

  // Trigger download
  XLSX.writeFile(workbook, filename);
}

/**
 * Downloads a single channel as a CSV file
 */
export function exportToCSV(matrix: MatrixData, sheetName: string, filename?: string): void {
  const ws = XLSX.utils.aoa_to_sheet(matrix.data);
  const csvStr = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename || `pixel_${sheetName}_sheet.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Parses a 2D array from XLSX sheet raw data into a MatrixData
 */
function parseRawSheetToMatrix(rawAoA: any[][]): MatrixData | null {
  if (!rawAoA || rawAoA.length === 0) return null;

  const height = rawAoA.length;
  let maxWidth = 0;

  for (let r = 0; r < height; r++) {
    if (rawAoA[r] && rawAoA[r].length > maxWidth) {
      maxWidth = rawAoA[r].length;
    }
  }

  if (maxWidth === 0) return null;

  const data: number[][] = [];
  for (let y = 0; y < height; y++) {
    const row: number[] = [];
    const rawRow = rawAoA[y] || [];
    for (let x = 0; x < maxWidth; x++) {
      const cellVal = rawRow[x];
      let num = typeof cellVal === 'number' ? cellVal : parseFloat(cellVal);
      if (isNaN(num)) num = 0;
      row.push(Math.max(0, Math.min(255, Math.round(num))));
    }
    data.push(row);
  }

  return { width: maxWidth, height, data };
}

/**
 * Parses an Excel (.xlsx/.xls) or CSV file uploaded by student or teacher
 */
export async function parseExcelOrCSVFile(file: File): Promise<SheetCollection> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });

  const result: SheetCollection = {
    fileName: file.name,
  };

  const sheetNames = workbook.SheetNames;

  for (const sheetName of sheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) continue;

    const rawAoA = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    const matrix = parseRawSheetToMatrix(rawAoA);

    if (!matrix) continue;

    const upperName = sheetName.trim().toUpperCase();

    if (upperName === 'R' || upperName === 'RED') {
      result.R = matrix;
    } else if (upperName === 'G' || upperName === 'GREEN') {
      result.G = matrix;
    } else if (upperName === 'B' || upperName === 'BLUE') {
      result.B = matrix;
    } else if (upperName === 'GRAY' || upperName === 'GREY' || upperName === 'G_GRAY' || upperName === 'GRAYSCALE') {
      result.Gray = matrix;
    }
  }

  // If it's a single CSV file named e.g. "R.csv", set accordingly
  if (!result.R && !result.G && !result.B && !result.Gray && sheetNames.length === 1) {
    const rawAoA = XLSX.utils.sheet_to_json(workbook.Sheets[sheetNames[0]], { header: 1 }) as any[][];
    const matrix = parseRawSheetToMatrix(rawAoA);
    if (matrix) {
      const lowerFile = file.name.toLowerCase();
      if (lowerFile.includes('r')) result.R = matrix;
      else if (lowerFile.includes('g') && !lowerFile.includes('gray')) result.G = matrix;
      else if (lowerFile.includes('b')) result.B = matrix;
      else if (lowerFile.includes('gray')) result.Gray = matrix;
      else result.R = matrix; // Default single sheet
    }
  }

  return result;
}
