import React, { useState, useRef, useEffect } from 'react';
import { SheetCollection } from '../types';
import { RefreshCw, Sliders, AlertTriangle, CheckCircle, Upload, Download, Eye, Layers } from 'lucide-react';
import { renderRGBToCanvas, renderGrayToCanvas } from '../utils/imageProcessing';
import { parseExcelOrCSVFile } from '../utils/excelHandler';

interface ReconstructionViewProps {
  sheets: SheetCollection;
  onUpdateSheets: (newSheets: SheetCollection) => void;
  isStudentMode?: boolean;
  currentImage?: HTMLImageElement | null;
  initialRenderMode?: 'rgb' | 'gray';
}

export const ReconstructionView: React.FC<ReconstructionViewProps> = ({
  sheets,
  onUpdateSheets,
  isStudentMode = false,
  currentImage,
  initialRenderMode = 'rgb',
}) => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [renderedType, setRenderedType] = useState<'rgb' | 'gray' | null>(null);
  const [zoomScale, setZoomScale] = useState<number>(1); // Default 1x scale as requested
  const fileInputRef = useRef<HTMLInputElement>(null);
  const rgbCanvasRef = useRef<HTMLCanvasElement>(null);

  const hasR = !!sheets.R;
  const hasG = !!sheets.G;
  const hasB = !!sheets.B;
  const hasGray = !!sheets.Gray;

  // Auto-render image based on initialRenderMode or available sheets
  useEffect(() => {
    if (initialRenderMode === 'gray' && sheets.Gray) {
      handleRenderGray();
    } else if (hasR && hasG && hasB && initialRenderMode === 'rgb') {
      handleRenderRGB();
    } else if (hasR && hasG && hasB) {
      handleRenderRGB();
    } else if (sheets.Gray) {
      handleRenderGray();
    }
  }, [sheets.R, sheets.G, sheets.B, sheets.Gray, initialRenderMode]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setErrorMsg(null);
      setSuccessMsg(null);
      const parsedSheets = await parseExcelOrCSVFile(file);

      onUpdateSheets(parsedSheets);
      setSuccessMsg(`파일 "${file.name}"에서 시트 데이터를 성공적으로 읽어왔습니다.`);
    } catch (err) {
      setErrorMsg('엑셀/CSV 파일을 읽는 도중 오류가 발생했습니다. 올바른 파일 형식인지 확인하세요.');
    }
  };

  const handleRenderRGB = () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    // Rule: R, G, B sheets must all exist
    if (!sheets.R || !sheets.G || !sheets.B) {
      const missing: string[] = [];
      if (!sheets.R) missing.push('R');
      if (!sheets.G) missing.push('G');
      if (!sheets.B) missing.push('B');

      setErrorMsg(
        `❌ [오류] R, G, B 시트가 올바르게 존재해야 이미지를 복원할 수 있습니다. (누락된 시트: ${missing.join(
          ', '
        )} 시트)`
      );
      setRenderedType(null);
      return;
    }

    if (rgbCanvasRef.current) {
      renderRGBToCanvas(rgbCanvasRef.current, sheets.R, sheets.G, sheets.B);
      setRenderedType('rgb');
      setSuccessMsg('✅ R, G, B 시트의 픽셀 데이터를 기반으로 RGB 컬러 이미지가 성공적으로 복원되었습니다!');
    }
  };

  const handleRenderGray = () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    // Rule: Gray sheet must exist
    if (!sheets.Gray) {
      setErrorMsg(
        `❌ [오류] 'Gray' 시트가 존재하지 않습니다. 먼저 4단계에서 그레이스케일 수식을 입력하여 Gray 시트를 생성하거나, Gray 시트가 포함된 엑셀 파일을 불러오세요.`
      );
      setRenderedType(null);
      return;
    }

    if (rgbCanvasRef.current) {
      renderGrayToCanvas(rgbCanvasRef.current, sheets.Gray);
      setRenderedType('gray');
      setSuccessMsg('✅ Gray 시트의 휘도 데이터를 기반으로 그레이스케일 이미지가 성공적으로 출력되었습니다!');
    }
  };

  const handleDownloadCanvasImage = () => {
    if (!rgbCanvasRef.current) return;
    const link = document.createElement('a');
    link.download = `reconstructed_${renderedType || 'image'}.png`;
    link.href = rgbCanvasRef.current.toDataURL('image/png');
    link.click();
  };

  const currentWidth = sheets.R?.width || sheets.Gray?.width || 50;
  const currentHeight = sheets.R?.height || sheets.Gray?.height || 50;

  return (
    <div className="space-y-6">
      {/* Student Mode Guidance Header */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-indigo-400" />
              {isStudentMode ? '학생 실습 및 스프레드시트 검증 워크스페이스' : '3단계: 시트 데이터 기반 이미지 복원'}
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              구글 시트나 엑셀 파일(.xlsx)의 R, G, B 및 Gray 시트 데이터를 읽어서 픽셀 화면으로 복원합니다.
            </p>
          </div>

          {/* Upload Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-colors cursor-pointer shrink-0"
          >
            <Upload className="w-4 h-4" />
            <span>수정한 엑셀/CSV 파일 불러오기</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".xlsx, .xls, .csv"
            className="hidden"
          />
        </div>

        {/* Sheet Inspection Badges */}
        <div className="pt-2 border-t border-slate-700/80 flex flex-wrap items-center gap-3 text-xs">
          <span className="text-slate-400 font-semibold">시트 감지 상태:</span>

          {/* R Sheet Badge */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${
              hasR
                ? 'bg-emerald-950/50 text-emerald-300 border-emerald-500/40'
                : 'bg-red-950/40 text-red-400 border-red-500/30'
            }`}
          >
            {hasR ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <AlertTriangle className="w-3.5 h-3.5 text-red-400" />}
            <span>R 시트: {hasR ? `[${sheets.R?.width}×${sheets.R?.height}] 감지됨` : '미감지'}</span>
          </div>

          {/* G Sheet Badge */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${
              hasG
                ? 'bg-emerald-950/50 text-emerald-300 border-emerald-500/40'
                : 'bg-red-950/40 text-red-400 border-red-500/30'
            }`}
          >
            {hasG ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <AlertTriangle className="w-3.5 h-3.5 text-red-400" />}
            <span>G 시트: {hasG ? `[${sheets.G?.width}×${sheets.G?.height}] 감지됨` : '미감지'}</span>
          </div>

          {/* B Sheet Badge */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${
              hasB
                ? 'bg-emerald-950/50 text-emerald-300 border-emerald-500/40'
                : 'bg-red-950/40 text-red-400 border-red-500/30'
            }`}
          >
            {hasB ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <AlertTriangle className="w-3.5 h-3.5 text-red-400" />}
            <span>B 시트: {hasB ? `[${sheets.B?.width}×${sheets.B?.height}] 감지됨` : '미감지'}</span>
          </div>

          {/* Gray Sheet Badge */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${
              hasGray
                ? 'bg-emerald-950/50 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {hasGray ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <span className="w-3.5 h-3.5 text-slate-500">⚪</span>}
            <span>Gray 시트: {hasGray ? `[${sheets.Gray?.width}×${sheets.Gray?.height}] 감지됨` : '없음'}</span>
          </div>
        </div>
      </div>

      {/* Error & Success Notification Alerts */}
      {errorMsg && (
        <div className="bg-red-950/80 border-2 border-red-500/80 text-red-200 p-4 rounded-xl flex items-start gap-3 shadow-lg animate-fade-in">
          <AlertTriangle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-white text-sm">복원 처리 오류</h4>
            <p className="text-xs text-red-200 mt-1 leading-relaxed">{errorMsg}</p>
          </div>
        </div>
      )}

      {successMsg && !errorMsg && (
        <div className="bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 p-3.5 rounded-xl flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-xs font-medium">{successMsg}</p>
        </div>
      )}

      {/* Action Buttons & Canvas Display */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Action Control Box */}
        <div className="lg:col-span-4 bg-slate-800/80 rounded-xl border border-slate-700/80 p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h4 className="font-semibold text-white text-sm">이미지 출력 실행 제어</h4>

            <div className="space-y-3">
              {/* RGB Reconstruction Button */}
              <button
                onClick={handleRenderRGB}
                className="w-full p-4 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-left font-semibold text-sm shadow-md transition-all flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <span className="block text-white text-base font-bold">복원하기 (RGB 이미지 출력)</span>
                  <span className="text-xs text-indigo-200 font-normal">
                    R, G, B 시트 3개의 행렬 값을 조합하여 컬러 그림 복원
                  </span>
                </div>
                <RefreshCw className="w-5 h-5 text-indigo-200 group-hover:rotate-180 transition-transform duration-500 shrink-0 ml-2" />
              </button>

              {/* Grayscale Render Button */}
              <button
                onClick={handleRenderGray}
                className="w-full p-4 rounded-xl bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white text-left font-semibold text-sm shadow-md transition-all flex items-center justify-between group cursor-pointer border border-slate-600"
              >
                <div>
                  <span className="block text-white text-base font-bold">그레이 변환 (Gray 이미지 출력)</span>
                  <span className="text-xs text-slate-300 font-normal">
                    Gray 시트의 0~255 흑백 휘도 수치로 그레이스케일 그림 출력
                  </span>
                </div>
                <Sliders className="w-5 h-5 text-slate-300 group-hover:scale-110 transition-transform shrink-0 ml-2" />
              </button>
            </div>
          </div>

          <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-700/60 text-xs text-slate-400 space-y-1.5">
            <p className="text-slate-300 font-semibold flex items-center gap-1">
              💡 학습 팁:
            </p>
            {!isStudentMode ? (
              <>
                <p>• 오른쪽 뷰포트에서 상단의 <strong>[원본 이미지]</strong>와 하단의 <strong>[복원 이미지]</strong>를 바로 비교할 수 있습니다.</p>
                <p>• 복원 이미지 바로 위에 있는 <strong>배율 버튼(1배, 4배, 8배)</strong>으로 픽셀 입자를 선명하게 관찰해보세요.</p>
              </>
            ) : (
              <>
                <p>• 학생이 완성한 엑셀 데이터의 숫자를 입력 받아 이미지를 복원합니다.</p>
                <p>• <strong>배율 버튼(1배, 4배, 8배)</strong>으로 복원된 픽셀 이미지를 선명하게 관찰해보세요.</p>
              </>
            )}
          </div>
        </div>

        {/* Right Output Display Canvas Viewport */}
        <div className="lg:col-span-8 bg-slate-800/80 rounded-xl border border-slate-700/80 p-5 space-y-6">
          <div className="w-full flex items-center justify-between border-b border-slate-700/80 pb-3">
            <span className="text-sm font-bold text-white flex items-center gap-2">
              <Eye className="w-4 h-4 text-indigo-400" />
              {isStudentMode ? '학생 복원 이미지 뷰포트' : '이미지 비교 뷰포트'} ({currentWidth} × {currentHeight} px)
            </span>
            {renderedType && (
              <span className="text-xs px-3 py-1 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 font-medium">
                {renderedType === 'rgb' ? 'RGB 컬러 복원 중' : '그레이스케일 변환 중'}
              </span>
            )}
          </div>

          {/* TOP: Original Image (Only shown in Teacher/Demonstration mode, NOT in Student mode) */}
          {!isStudentMode && (
            <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-700/70 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
                <span className="flex items-center gap-1.5 text-indigo-300">
                  🖼️ 1. 원본 이미지 (Original Image)
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  크기: {currentWidth} × {currentHeight} px
                </span>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-center min-h-[140px] overflow-auto">
                {currentImage ? (
                  <img
                    src={currentImage.src}
                    alt="Original"
                    className="max-h-[180px] object-contain rounded shadow-md"
                    style={{ imageRendering: 'pixelated' }}
                  />
                ) : (
                  <div className="text-xs text-slate-500 text-center py-6">
                    [원본 이미지 정보가 없거나 엑셀 파일 직접 불러오기 상태입니다]
                  </div>
                )}
              </div>
            </div>
          )}

          {/* BOTTOM: Reconstructed Image with Zoom Bar Directly Above */}
          <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-700/70 space-y-3">
            {/* Scale Selector Directly Above Reconstructed Image */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-800/90 p-2.5 rounded-lg border border-slate-700/80">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                <span className="text-emerald-400">{!isStudentMode ? '✨ 2. 복원 이미지' : '✨ 복원 이미지'}</span>
                <span className="text-slate-400 font-normal">| 픽셀 확대 배율:</span>
              </div>
              <div className="flex items-center gap-2">
                {[
                  { scale: 1, label: '1배 (디폴트)' },
                  { scale: 4, label: '4배' },
                  { scale: 8, label: '8배' },
                ].map(({ scale, label }) => (
                  <button
                    key={scale}
                    onClick={() => setZoomScale(scale)}
                    className={`px-3 py-1 rounded text-xs font-semibold transition-all border ${
                      zoomScale === scale
                        ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm font-bold'
                        : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Reconstructed Canvas Display */}
            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 flex flex-col items-center justify-center min-h-[200px] overflow-auto">
              <canvas
                ref={rgbCanvasRef}
                style={{
                  width: `${currentWidth * zoomScale}px`,
                  height: `${currentHeight * zoomScale}px`,
                  imageRendering: 'pixelated',
                  boxShadow: '0 0 20px rgba(0,0,0,0.8)',
                }}
                className="rounded transition-all duration-300"
              />
            </div>

            {/* Download Canvas PNG */}
            {renderedType && (
              <div className="flex justify-end pt-1">
                <button
                  onClick={handleDownloadCanvasImage}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium border border-slate-600 transition-colors cursor-pointer shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>복원된 이미지 PNG 저장</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
