import React from 'react';
import { ActiveTab } from '../types';
import { Image, Table, RefreshCw, Sliders, GraduationCap, FileSpreadsheet, HelpCircle } from 'lucide-react';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  hasMatrices: boolean;
  hasGray: boolean;
  onOpenHelp: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  hasMatrices,
  hasGray,
  onOpenHelp,
}) => {
  const tabs = [
    { id: 'step1_load', label: '1. 이미지 불러오기', icon: Image, badge: null },
    { id: 'step2_data', label: '2. R/G/B 시트 데이터', icon: Table, badge: hasMatrices ? '데이터 준비됨' : null },
    { id: 'step3_reconstruct', label: '3. RGB 복원하기', icon: RefreshCw, badge: null },
    { id: 'step4_grayscale', label: '4. 그레이스케일 수식 실습', icon: Sliders, badge: hasGray ? 'Gray 시트 생성됨' : null },
    { id: 'step5_student', label: '5. 학생 연습 & 검증', icon: GraduationCap, badge: null },
  ] as const;

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 rounded-lg shadow-inner">
              <FileSpreadsheet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight flex items-center gap-2">
                RGB & Grayscale Pixel Sheet Lab
                <span className="text-xs font-normal px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  정보 수업용
                </span>
              </h1>
              <p className="text-xs text-slate-400">디지털 이미지 Pixel Data ↔ Excel/시트 분리 & 복원 탐구실습</p>
            </div>
          </div>

          <button
            onClick={onOpenHelp}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
          >
            <HelpCircle className="w-4 h-4 text-indigo-400" />
            실습 가이드
          </button>
        </div>

        {/* Tab Bar */}
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto pb-2 pt-1 no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all border ${
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                    : 'bg-slate-800/60 text-slate-300 border-slate-700/50 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
