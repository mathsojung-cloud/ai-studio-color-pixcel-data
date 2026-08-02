import React, { useState } from 'react';
import { ActiveTab, SheetCollection } from './types';
import { Header } from './components/Header';
import { ImageLoader } from './components/ImageLoader';
import { SpreadsheetViewer } from './components/SpreadsheetViewer';
import { ReconstructionView } from './components/ReconstructionView';
import { GrayscalePractice } from './components/GrayscalePractice';
import { HelpModal } from './components/HelpModal';
import { extractRGBMatrices } from './utils/imageProcessing';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('step1_load');
  const [sheets, setSheets] = useState<SheetCollection>({});
  const [currentImage, setCurrentImage] = useState<HTMLImageElement | null>(null);
  const [currentWidth, setCurrentWidth] = useState<number>(50);
  const [currentHeight, setCurrentHeight] = useState<number>(50);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [reconstructRenderMode, setReconstructRenderMode] = useState<'rgb' | 'gray'>('rgb');

  // Called when user clicks "Extract RGB Sheets" in Step 1
  const handleImageExtracted = (img: HTMLImageElement, width: number, height: number) => {
    setCurrentImage(img);
    setCurrentWidth(width);
    setCurrentHeight(height);

    // Extract R, G, B matrices
    const extracted = extractRGBMatrices(img, width, height);

    setSheets({
      R: extracted.R,
      G: extracted.G,
      B: extracted.B,
      fileName: 'pixel_rgb_sheets.xlsx',
    });

    setReconstructRenderMode('rgb');
    // Automatically navigate to Step 2 (Spreadsheet View)
    setActiveTab('step2_data');
  };

  const handleUpdateSheets = (newSheets: SheetCollection) => {
    setSheets(newSheets);
  };

  const handleGoToReconstruct = (mode: 'rgb' | 'gray' = 'rgb') => {
    setReconstructRenderMode(mode);
    setActiveTab('step3_reconstruct');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-indigo-500 selection:text-white flex flex-col">
      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hasMatrices={!!sheets.R && !!sheets.G && !!sheets.B}
        hasGray={!!sheets.Gray}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'step1_load' && (
          <ImageLoader
            onImageExtracted={handleImageExtracted}
            currentImage={currentImage}
            currentWidth={currentWidth}
            currentHeight={currentHeight}
          />
        )}

        {activeTab === 'step2_data' && (
          <SpreadsheetViewer
            sheets={sheets}
            onUpdateSheets={handleUpdateSheets}
            onGoToReconstruct={() => handleGoToReconstruct('rgb')}
            onGoToGrayscale={() => setActiveTab('step4_grayscale')}
          />
        )}

        {activeTab === 'step3_reconstruct' && (
          <ReconstructionView
            sheets={sheets}
            onUpdateSheets={handleUpdateSheets}
            isStudentMode={false}
            currentImage={currentImage}
            initialRenderMode={reconstructRenderMode}
          />
        )}

        {activeTab === 'step4_grayscale' && (
          <GrayscalePractice
            sheets={sheets}
            onUpdateSheets={handleUpdateSheets}
            onGoToReconstruct={(mode: 'rgb' | 'gray' = 'gray') => handleGoToReconstruct(mode)}
          />
        )}

        {activeTab === 'step5_student' && (
          <ReconstructionView
            sheets={sheets}
            onUpdateSheets={handleUpdateSheets}
            isStudentMode={true}
            currentImage={currentImage}
            initialRenderMode={reconstructRenderMode}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/60 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>RGB & Grayscale Pixel Sheet Lab — 정보 교과 디지털 이미지 표현 탐구 실습 도구</span>
          <span>Excel (.xlsx) / CSV 내보내기 & 불러오기 100% 오프라인 호환</span>
        </div>
      </footer>

      {/* Help Modal */}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
}
