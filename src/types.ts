export type ChannelType = 'R' | 'G' | 'B' | 'Gray';

export interface MatrixData {
  width: number;
  height: number;
  data: number[][]; // [row][col] 0-255
}

export interface SheetCollection {
  R?: MatrixData;
  G?: MatrixData;
  B?: MatrixData;
  Gray?: MatrixData;
  fileName?: string;
}

export interface GrayscaleFormula {
  id: string;
  name: string;
  expression: string;
  description: string;
}

export type ActiveTab = 'step1_load' | 'step2_data' | 'step3_reconstruct' | 'step4_grayscale' | 'step5_student';
