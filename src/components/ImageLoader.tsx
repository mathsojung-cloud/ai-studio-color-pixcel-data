import React, { useState, useRef, useEffect } from 'react';
import { Upload, Sparkles, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { createSampleImage } from '../utils/imageProcessing';

interface ImageLoaderProps {
  onImageExtracted: (img: HTMLImageElement, width: number, height: number) => void;
  currentImage: HTMLImageElement | null;
  currentWidth: number;
  currentHeight: number;
}

export const ImageLoader: React.FC<ImageLoaderProps> = ({
  onImageExtracted,
  currentImage,
  currentWidth,
  currentHeight,
}) => {
  const [targetWidth, setTargetWidth] = useState<number>(currentWidth || 50);
  const [targetHeight, setTargetHeight] = useState<number>(currentHeight || 50);
  const [loadedImg, setLoadedImg] = useState<HTMLImageElement | null>(currentImage);
  const [origDimensions, setOrigDimensions] = useState<{ width: number; height: number } | null>(
    currentImage ? { width: currentImage.naturalWidth, height: currentImage.naturalHeight } : null
  );
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [showGridOverlay, setShowGridOverlay] = useState<boolean>(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Load default sample image if none loaded
  useEffect(() => {
    if (!loadedImg) {
      handleLoadSample('cat');
    }
  }, []);

  // Update preview canvas when image or resolution changes
  useEffect(() => {
    if (!loadedImg || !previewCanvasRef.current) return;
    const canvas = previewCanvasRef.current;
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(loadedImg, 0, 0, targetWidth, targetHeight);
    }
  }, [loadedImg, targetWidth, targetHeight]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setLoadedImg(img);
        setOrigDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleLoadSample = (sampleType: 'cat' | 'dog' | 'lizard') => {
    const dataUrl = createSampleImage(sampleType);
    const img = new Image();
    img.onload = () => {
      setLoadedImg(img);
      setOrigDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = dataUrl;
  };

  const handleExtractClick = () => {
    if (!loadedImg) return;
    setIsExtracting(true);
    setTimeout(() => {
      onImageExtracted(loadedImg, targetWidth, targetHeight);
      setIsExtracting(false);
    }, 100);
  };

  return (
    <div className="space-y-6">
      {/* Banner Notice */}
      <div className="bg-indigo-900/30 border border-indigo-500/30 rounded-xl p-4 text-indigo-200 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-indigo-400 mt-0.5 shrink-0" />
        <div className="text-sm">
          <h3 className="font-semibold text-white">1단계: 이미지 불러오기 및 원하는 해상도 설정</h3>
          <p className="mt-1 text-slate-300">
            고해상도 이미지(예: 1920x1080)를 스프레드시트 각 셀(R, G, B)에 1:1로 매핑하기 위해 원하는 크기(예: 50x50)로 변환합니다.
            입력된 해상도 크기만큼 R, G, B 시트 행렬 데이터가 생성됩니다.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Image Selector & Sample Buttons */}
        <div className="lg:col-span-6 bg-slate-800/80 rounded-xl border border-slate-700/80 p-5 space-y-4">
          <h3 className="font-medium text-slate-200 text-sm flex items-center justify-between">
            <span>이미지 선택</span>
            {origDimensions && (
              <span className="text-xs text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/50">
                원본 크기: {origDimensions.width} × {origDimensions.height} px
              </span>
            )}
          </h3>

          {/* Upload Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-600 hover:border-indigo-500 bg-slate-900/50 hover:bg-slate-900/80 rounded-xl p-6 text-center cursor-pointer transition-all group"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />
            <div className="mx-auto w-12 h-12 rounded-full bg-slate-800 group-hover:bg-indigo-950/80 flex items-center justify-center text-slate-400 group-hover:text-indigo-400 transition-colors">
              <Upload className="w-6 h-6" />
            </div>
            <p className="mt-3 text-sm font-medium text-slate-200">
              이미지 파일 업로드 (클릭 또는 드래그)
            </p>
            <p className="mt-1 text-xs text-slate-400">JPG, PNG, GIF, WEBP 지원</p>
          </div>

          {/* Preset Sample Images */}
          <div>
            <p className="text-xs text-slate-400 mb-2">또는 정보수업용 샘플 이미지 선택:</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'cat', label: '🐱 고양이' },
                { id: 'dog', label: '🐶 개' },
                { id: 'lizard', label: '🦎 도마뱀' },
              ].map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => handleLoadSample(sample.id as any)}
                  className="px-3 py-2 rounded-lg text-xs font-semibold bg-slate-700/60 hover:bg-indigo-600 hover:text-white text-slate-200 border border-slate-600/50 transition-colors text-center shadow-sm flex items-center justify-center gap-1.5"
                >
                  {sample.label}
                </button>
              ))}
            </div>
          </div>

          {/* Source Image Canvas Preview */}
          {loadedImg && (
            <div className="pt-2">
              <p className="text-xs text-slate-400 mb-2">선택한 원본 이미지 프리뷰:</p>
              <div className="relative aspect-video rounded-lg overflow-hidden bg-black/40 border border-slate-700 flex items-center justify-center">
                <img
                  src={loadedImg.src}
                  alt="Original Preview"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Size Config & Sampled Output Preview */}
        <div className="lg:col-span-6 bg-slate-800/80 rounded-xl border border-slate-700/80 p-5 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-medium text-slate-200 text-sm">리사이즈 변환 규격 설정 (시트 셀 개수)</h3>

            {/* Dimension Inputs */}
            <div className="grid grid-cols-2 gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-700/50">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  가로 크기 (너비 / 열 개수)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={5}
                    max={120}
                    value={targetWidth}
                    onChange={(e) => setTargetWidth(Math.max(5, Math.min(150, parseInt(e.target.value) || 50)))}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-indigo-500"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400">px</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  세로 크기 (높이 / 행 개수)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={5}
                    max={120}
                    value={targetHeight}
                    onChange={(e) => setTargetHeight(Math.max(5, Math.min(150, parseInt(e.target.value) || 50)))}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-indigo-500"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400">px</span>
                </div>
              </div>
            </div>

            {/* Quick resolution presets */}
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>빠른 선택:</span>
              {[
                { w: 20, h: 20, label: '20×20 (초간단)' },
                { w: 50, h: 50, label: '50×50 (기본)' },
                { w: 80, h: 80, label: '80×80 (고해상도)' },
              ].map((preset) => (
                <button
                  key={`${preset.w}-${preset.h}`}
                  onClick={() => {
                    setTargetWidth(preset.w);
                    setTargetHeight(preset.h);
                  }}
                  className={`px-2 py-1 rounded text-xs transition-colors border ${
                    targetWidth === preset.w && targetHeight === preset.h
                      ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500'
                      : 'bg-slate-700/40 hover:bg-slate-700 text-slate-300 border-slate-600/40'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Calculation details */}
            <div className="bg-slate-900/40 rounded-lg p-3 text-xs text-slate-300 border border-slate-700/40 space-y-1">
              <div className="flex justify-between">
                <span>총 시트 셀 개수:</span>
                <span className="font-mono text-indigo-300 font-bold">
                  {(targetWidth * targetHeight).toLocaleString()} 개 (각 R, G, B 시트당)
                </span>
              </div>
              <div className="flex justify-between">
                <span>R, G, B 전체 피셀 값:</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {(targetWidth * targetHeight * 3).toLocaleString()} 개의 숫자 값 (0~255)
                </span>
              </div>
            </div>

            {/* Downsampled Live Preview Canvas */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>다운샘플링 샘플링 변환 결과 ({targetWidth} × {targetHeight} px)</span>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showGridOverlay}
                    onChange={(e) => setShowGridOverlay(e.target.checked)}
                    className="rounded border-slate-600 bg-slate-800 text-indigo-600 focus:ring-0"
                  />
                  <span>픽셀 격자 가이드 표시</span>
                </label>
              </div>

              <div className="relative aspect-square max-w-[240px] mx-auto rounded-lg overflow-hidden bg-slate-950 border border-slate-700 flex items-center justify-center p-2 shadow-inner">
                <canvas
                  ref={previewCanvasRef}
                  className={`max-w-full max-h-full object-contain ${
                    showGridOverlay ? 'rendering-pixelated' : ''
                  }`}
                  style={{
                    imageRendering: 'pixelated',
                    boxShadow: '0 0 0 1px rgba(255,255,255,0.1)',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <button
            onClick={handleExtractClick}
            disabled={!loadedImg || isExtracting}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white font-semibold text-sm shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {isExtracting ? (
              <span>R/G/B 데이터 추출 중...</span>
            ) : (
              <>
                <span>데이터 생성하기 (R, G, B 시트 데이터 추출)</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
