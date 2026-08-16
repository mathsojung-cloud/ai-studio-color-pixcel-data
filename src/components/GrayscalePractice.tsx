import React, { useState } from 'react';
import { SheetCollection, GrayscaleFormula, MatrixData } from '../types';
import { Sliders, Sparkles, Check, Play, FileSpreadsheet, Download, RefreshCw, Calculator } from 'lucide-react';
import { generateGrayMatrix, renderGrayToCanvas } from '../utils/imageProcessing';
import { exportToExcel } from '../utils/excelHandler';

interface GrayscalePracticeProps {
  sheets: SheetCollection;
  onUpdateSheets: (newSheets: SheetCollection) => void;
  onGoToReconstruct: (mode?: 'rgb' | 'gray') => void;
}

export const FORMULA_PRESETS: GrayscaleFormula[] = [
  {
    id: 'bt601',
    name: '표준 휘도 가중치 (BT.601)',
    expression: '0.299 * R + 0.587 * G + 0.114 * B',
    description: '사람의 눈이 녹색(G)에 가장 민감하고 파란색(B)에 둔감한 생체 특성을 반영한 국제 표준 수식입니다.',
  },
  {
    id: 'avg',
    name: '단순 산술 평균',
    expression: '(R + G + B) / 3',
    description: 'R, G, B 세 채널의 단순 평균값으로 단순하지만 명암 대비가 왜곡될 수 있습니다.',
  },
  {
    id: 'bt709',
    name: 'HDTV 고화질 표준 (BT.709)',
    expression: '0.2126 * R + 0.7152 * G + 0.0722 * B',
    description: '최신 디지털 모니터 및 HD 방송 규격에 맞춰 녹색 비중을 더 높인 수식입니다.',
  },
  {
    id: 'red_emphasis',
    name: '적색(R) 강조 수식',
    expression: '0.7 * R + 0.2 * G + 0.1 * B',
    description: '빨간색 피셀 영역을 밝게 부각시키고 다른 색상을 어둡게 만드는 가중치 수식입니다.',
  },
  {
    id: 'max_val',
    name: '최대 밝기 추출 (Max)',
    expression: 'Math.max(R, G, B)',
    description: 'R, G, B 중 가장 밝은 수치를 선택하여 가장 밝고 선명한 흑백 이미지를 만듭니다.',
  },
];

export const GrayscalePractice: React.FC<GrayscalePracticeProps> = ({
  sheets,
  onUpdateSheets,
  onGoToReconstruct,
}) => {
  const [formulaInput, setFormulaInput] = useState<string>('0.299 * R + 0.587 * G + 0.114 * B');
  const [noticeMsg, setNoticeMsg] = useState<string | null>(null);
  const [isGenerated, setIsGenerated] = useState<boolean>(!!sheets.Gray);

  const hasRGB = !!sheets.R && !!sheets.G && !!sheets.B;

  const handleGenerateGrayData = (): SheetCollection | null => {
    if (!sheets.R || !sheets.G || !sheets.B) {
      setNoticeMsg('❌ R, G, B 시트가 먼저 존재해야 그레이스케일 데이터를 생성할 수 있습니다.');
      return null;
    }

    const newGrayMatrix = generateGrayMatrix(sheets.R, sheets.G, sheets.B, formulaInput);
    const updatedSheets: SheetCollection = {
      ...sheets,
      Gray: newGrayMatrix,
    };

    onUpdateSheets(updatedSheets);
    setIsGenerated(true);
    setNoticeMsg('🎉 성공! 입력하신 수식으로 계산된 "Gray" 시트 데이터가 스프레드시트에 성공적으로 추가되었습니다.');
    return updatedSheets;
  };

  const handleDownloadExcelWithGray = () => {
    const updated = handleGenerateGrayData();
    if (updated) {
      exportToExcel(updated, updated.fileName || 'pixel_rgb_gray_sheets.xlsx');
      setNoticeMsg('📥 엑셀 파일 다운로드가 시작되었습니다!\n• iOS(아이폰): Safari 주소창 옆 [↓] 아이콘 또는 [파일 앱 → 다운로드] 폴더를 확인하세요.\n• Android(갤럭시): 상단 알림창 또는 [내 파일 → 다운로드] 폴더에 저장됩니다.');
    }
  };

  const handleMoveToReconstruct = () => {
    const updated = handleGenerateGrayData();
    if (updated) {
      onGoToReconstruct('gray');
    }
  };

  // Sample RGB values to show live math test results in table
  const testPixels = [
    { name: '순수 빨강 (Red)', r: 255, g: 0, b: 0 },
    { name: '순수 초록 (Green)', r: 0, g: 255, b: 0 },
    { name: '순수 파랑 (Blue)', r: 0, g: 0, b: 255 },
    { name: '노랑 (Yellow)', r: 255, g: 255, b: 0 },
    { name: '하늘색 (Cyan)', r: 0, g: 200, b: 255 },
    { name: '중간 회색 (Gray)', r: 128, g: 128, b: 128 },
  ];

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-indigo-900/30 border border-indigo-500/30 rounded-xl p-5 text-indigo-200 space-y-2">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-indigo-400" />
          <h3 className="font-bold text-white text-base">4단계: 그레이스케일(Grayscale) 변환 수식 실습</h3>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">
          컬러 이미지의 R, G, B 세가지 색상 값(0~255)을 가중치 수학 수식을 통해 하나의 휘도(Gray, 0~255) 값으로 변환합니다.
          학생들이 수식을 직접 입력하고 수정하면서 이미지의 밝기, 명암 대비, 가중치의 역할을 체득할 수 있습니다.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Formula Editor & Presets */}
        <div className="lg:col-span-7 bg-slate-800/80 rounded-xl border border-slate-700/80 p-5 space-y-5">
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-white">
              그레이스케일 변환 수식 입력 (변수: R, G, B 사용)
            </label>

            <div className="relative">
              <input
                type="text"
                value={formulaInput}
                onChange={(e) => {
                  setFormulaInput(e.target.value);
                  setIsGenerated(false);
                }}
                placeholder="예: 0.299 * R + 0.587 * G + 0.114 * B"
                className="w-full bg-slate-900 border-2 border-indigo-500/80 rounded-xl px-4 py-3 text-white font-mono text-base focus:outline-none focus:border-indigo-400 shadow-inner"
              />
              <span className="absolute right-3 top-3.5 text-xs text-indigo-400 font-mono">Gray 수식</span>
            </div>
            <p className="text-xs text-slate-400">
              💡 이용 가능 변수: <code className="text-indigo-300 font-mono">R</code>,{' '}
              <code className="text-emerald-300 font-mono">G</code>, <code className="text-blue-300 font-mono">B</code> 및 자바스크립트 연산자{' '}
              <code className="text-yellow-300 font-mono">+ - * / Math.max Math.min</code>
            </p>
          </div>

          {/* Preset Formulas List */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-300">추천 프리셋 수식 선택:</span>
            <div className="grid grid-cols-1 gap-2">
              {FORMULA_PRESETS.map((preset) => {
                const isSelected = formulaInput === preset.expression;
                return (
                  <div
                    key={preset.id}
                    onClick={() => {
                      setFormulaInput(preset.expression);
                      setIsGenerated(false);
                    }}
                    className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-950/80 border-indigo-500 text-white shadow-sm'
                        : 'bg-slate-900/40 hover:bg-slate-900/80 border-slate-700/60 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-indigo-300">{preset.name}</span>
                      <code className="text-[11px] font-mono bg-slate-950/80 px-2 py-0.5 rounded text-indigo-200 border border-slate-800">
                        {preset.expression}
                      </code>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-snug">{preset.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Math Simulation Table */}
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/60 space-y-2">
            <h4 className="text-xs font-semibold text-slate-300">수식 실시간 테스트 샘플 계산</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left font-mono">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-800">
                    <th className="py-1.5 px-2">샘플 색상</th>
                    <th className="py-1.5 px-2 text-center">R</th>
                    <th className="py-1.5 px-2 text-center">G</th>
                    <th className="py-1.5 px-2 text-center">B</th>
                    <th className="py-1.5 px-2 text-right text-indigo-300">계산된 Gray 값</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {testPixels.map((p, idx) => {
                    // Safe calculate
                    let grayVal = 0;
                    try {
                      const clean = formulaInput.replace(/R/g, 'r').replace(/G/g, 'g').replace(/B/g, 'b');
                      const fn = new Function('r', 'g', 'b', `return Math.round(${clean});`);
                      grayVal = Math.max(0, Math.min(255, fn(p.r, p.g, p.b)));
                    } catch {
                      grayVal = 0;
                    }

                    return (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        <td className="py-1.5 px-2 font-sans text-slate-200 flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full inline-block border border-white/20"
                            style={{ backgroundColor: `rgb(${p.r},${p.g},${p.b})` }}
                          />
                          {p.name}
                        </td>
                        <td className="py-1.5 px-2 text-center text-red-400">{p.r}</td>
                        <td className="py-1.5 px-2 text-center text-green-400">{p.g}</td>
                        <td className="py-1.5 px-2 text-center text-blue-400">{p.b}</td>
                        <td className="py-1.5 px-2 text-right font-bold text-white">
                          <span
                            className="px-2 py-0.5 rounded text-[11px] inline-block"
                            style={{
                              backgroundColor: `rgb(${grayVal},${grayVal},${grayVal})`,
                              color: grayVal > 128 ? '#000' : '#fff',
                            }}
                          >
                            {grayVal}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Actions & Generation Status */}
        <div className="lg:col-span-5 bg-slate-800/80 rounded-xl border border-slate-700/80 p-5 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <h4 className="font-semibold text-white text-sm">Gray 시트 자동 계산 및 엑셀 내보내기</h4>

            {noticeMsg && (
              <div className="bg-indigo-950/80 border border-indigo-500/50 p-3.5 rounded-xl text-xs text-indigo-200 flex items-start gap-2.5 whitespace-pre-line leading-relaxed">
                <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>{noticeMsg}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleDownloadExcelWithGray}
                disabled={!hasRGB}
                className="w-full py-4 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <Download className="w-5 h-5 text-white" />
                <span>Gray 시트 생성 및 전체 엑셀(.xlsx) 다운로드</span>
              </button>
              <p className="text-xs text-slate-400 leading-relaxed px-1">
                * 위 버튼을 누르면 설정한 수식으로 <strong>Gray 시트가 자동 계산되어 추가</strong>된 엑셀 파일이 즉시 다운로드됩니다.
              </p>
            </div>

            {/* Mobile download guidance box */}
            <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-700/80 text-xs text-slate-300 space-y-1.5">
              <p className="text-indigo-300 font-semibold flex items-center gap-1.5">
                📱 모바일 파일 저장 위치 안내:
              </p>
              <p>• <strong>iPhone/iPad (Safari)</strong>: 주소창 옆 <strong>[↓ 다운로드]</strong> 아이콘 또는 기본 <strong>[파일 앱] → [다운로드]</strong> 폴더</p>
              <p>• <strong>Android (갤럭시 등 Chrome)</strong>: 상단 알림창 또는 기본 <strong>[내 파일] / [파일] 앱 → [다운로드]</strong> 폴더</p>
            </div>
          </div>

          {/* Navigation to Rendering tab */}
          <div className="pt-4 border-t border-slate-700/80 space-y-3">
            <p className="text-xs text-slate-400">
              [3단계 복원하기/그레이 변환] 화면으로 이동하면 계산된 Gray 시트로 흑백 그림을 즉시 출력해볼 수 있습니다.
            </p>

            <button
              onClick={handleMoveToReconstruct}
              className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md transition-colors cursor-pointer"
            >
              <span>Gray 시트 계산 후 이미지 출력 화면으로 이동</span>
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
