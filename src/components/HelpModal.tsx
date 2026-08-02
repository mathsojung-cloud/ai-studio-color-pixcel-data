import React from 'react';
import { X, BookOpen, Layers, CheckCircle, FileSpreadsheet, Download, RefreshCw, Calculator } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5 text-indigo-400">
            <BookOpen className="w-5 h-5" />
            <h2 className="text-lg font-bold text-white">정보 수업용 실습 가이드 & 이용 안내</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 space-y-2">
            <h3 className="font-semibold text-white flex items-center gap-2 text-sm">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">1</span>
              이미지 RGB 데이터 추출 및 구글 시트 / 엑셀 변환
            </h3>
            <p className="text-slate-400">
              선택한 이미지를 원하는 규격(예: 50x50)으로 리사이즈한 후, 각 픽셀의 R(적), G(녹), B(청) 0~255 수치를 추출합니다.
              생성된 엑셀 파일(.xlsx)을 다운로드하면 R, G, B 시트별로 매핑된 수치 데이터를 구글 스프레드시트나 엑셀에서 바로 확인할 수 있습니다.
            </p>
          </div>

          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 space-y-2">
            <h3 className="font-semibold text-white flex items-center gap-2 text-sm">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">2</span>
              시트 수치 수정 및 실시간 이미지 복원 탐구
            </h3>
            <p className="text-slate-400">
              스프레드시트에서 특정 셀의 숫자(예: 255 → 0)를 변경하거나 수정된 엑셀/CSV 파일을 웹 앱에 업로드하면,
              [복원하기] 버튼을 통해 시트의 데이터가 변경됨에 따라 그림이 어떻게 변하는지 직관적으로 관찰할 수 있습니다.
            </p>
          </div>

          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 space-y-2">
            <h3 className="font-semibold text-white flex items-center gap-2 text-sm">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">3</span>
              그레이스케일 변환 수식 실습 (0.299*R + 0.587*G + 0.114*B)
            </h3>
            <p className="text-slate-400">
              수식 입력창에 원하는 수학 수식을 입력하여 Gray 시트의 0~255 흑백 휘도 값을 만듭니다.
              [그레이 변환] 버튼을 클릭하면 Gray 시트의 값을 바탕으로 흑백 그림이 생성됩니다.
            </p>
          </div>

          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 space-y-2">
            <h3 className="font-semibold text-white flex items-center gap-2 text-sm">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">4</span>
              학생 실습 및 오류 메세지 확인 규칙
            </h3>
            <ul className="list-disc list-inside text-slate-400 space-y-1 pl-1">
              <li><strong className="text-slate-200">R, G, B 시트 미존재 시:</strong> [복원하기] 클릭 시 오류 안내 메시지 출력</li>
              <li><strong className="text-slate-200">Gray 시트 미존재 시:</strong> [그레이 변환] 클릭 시 오류 안내 메시지 출력</li>
            </ul>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            확인 및 시작하기
          </button>
        </div>
      </div>
    </div>
  );
};
