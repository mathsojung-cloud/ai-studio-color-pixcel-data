import React, { useState, useEffect } from 'react';
import { SheetCollection, ChannelType, MatrixData } from '../types';
import { Download, FileSpreadsheet, Layers, Edit3, ArrowUpRight, Check, Eye } from 'lucide-react';
import { exportToExcel, exportToCSV } from '../utils/excelHandler';
import { renderRGBToCanvas, renderGrayToCanvas } from '../utils/imageProcessing';

interface SpreadsheetViewerProps {
  sheets: SheetCollection;
  onUpdateSheets: (newSheets: SheetCollection) => void;
  onGoToReconstruct: () => void;
  onGoToGrayscale: () => void;
}

export const SpreadsheetViewer: React.FC<SpreadsheetViewerProps> = ({
  sheets,
  onUpdateSheets,
  onGoToReconstruct,
  onGoToGrayscale,
}) => {
  const [activeChannel, setActiveChannel] = useState<ChannelType>('R');
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [editVal, setEditVal] = useState<string>('');

  const activeMatrix: MatrixData | undefined =
    activeChannel === 'R'
      ? sheets.R
      : activeChannel === 'G'
      ? sheets.G
      : activeChannel === 'B'
      ? sheets.B
      : sheets.Gray;

  // Sync active channel to available sheets if active one is missing
  useEffect(() => {
    if (activeChannel === 'R' && !sheets.R && sheets.G) setActiveChannel('G');
    if (activeChannel === 'Gray' && !sheets.Gray && sheets.R) setActiveChannel('R');
  }, [sheets]);

  if (!sheets.R && !sheets.G && !sheets.B && !sheets.Gray) {
    return (
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-12 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-slate-700/50 flex items-center justify-center mx-auto text-slate-400">
          <FileSpreadsheet className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-semibold text-white">생성된 시트 데이터가 없습니다.</h3>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
          1단계에서 이미지를 선택하고 [데이터 생성하기] 버튼을 눌러 R, G, B 시트 데이터를 추출하세요.
        </p>
      </div>
    );
  }

  const handleCellClick = (row: number, col: number, currentVal: number) => {
    setEditingCell({ row, col });
    setEditVal(currentVal.toString());
  };

  const handleCellSave = () => {
    if (!editingCell || !activeMatrix) return;
    let num = parseInt(editVal, 10);
    if (isNaN(num)) num = 0;
    num = Math.max(0, Math.min(255, num));

    // Deep clone data
    const newMatrixData = activeMatrix.data.map((r) => [...r]);
    newMatrixData[editingCell.row][editingCell.col] = num;

    const updatedMatrix: MatrixData = {
      ...activeMatrix,
      data: newMatrixData,
    };

    const newSheets: SheetCollection = {
      ...sheets,
      [activeChannel]: updatedMatrix,
    };

    onUpdateSheets(newSheets);
    setEditingCell(null);
  };

  // Cell background color generator based on channel and value (0..255)
  const getCellBgColor = (val: number, channel: ChannelType) => {
    const intensity = Math.min(1, Math.max(0, val / 255));
    if (channel === 'R') {
      return `rgba(239, 68, 68, ${0.15 + intensity * 0.55})`;
    } else if (channel === 'G') {
      return `rgba(34, 197, 94, ${0.15 + intensity * 0.55})`;
    } else if (channel === 'B') {
      return `rgba(59, 130, 246, ${0.15 + intensity * 0.55})`;
    } else {
      return `rgba(148, 163, 184, ${0.15 + intensity * 0.55})`;
    }
  };

  const matrixWidth = activeMatrix?.width || 0;
  const matrixHeight = activeMatrix?.height || 0;

  const startRow = 0;
  const endRow = matrixHeight;
  const startCol = 0;
  const endCol = matrixWidth;

  return (
    <div className="space-y-6">
      {/* Action Bar & Sheet Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-800/90 p-4 rounded-xl border border-slate-700">
        {/* Sheet Tabs */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-2">시트 탭:</span>
          {(['R', 'G', 'B', 'Gray'] as const).map((channel) => {
            const exists = !!sheets[channel];
            const isSelected = activeChannel === channel;
            let channelColor = 'text-red-400 border-red-500/30 bg-red-950/40';
            if (channel === 'G') channelColor = 'text-green-400 border-green-500/30 bg-green-950/40';
            if (channel === 'B') channelColor = 'text-blue-400 border-blue-500/30 bg-blue-950/40';
            if (channel === 'Gray') channelColor = 'text-slate-300 border-slate-500/30 bg-slate-800';

            return (
              <button
                key={channel}
                disabled={!exists}
                onClick={() => {
                  setActiveChannel(channel);
                  setEditingCell(null);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                    : exists
                    ? `${channelColor} hover:opacity-90`
                    : 'bg-slate-900/40 text-slate-600 border-slate-800 cursor-not-allowed opacity-50'
                }`}
              >
                <span>{channel} 시트</span>
                {exists ? (
                  <span className="text-[10px] font-mono opacity-80">
                    ({sheets[channel]?.width}x{sheets[channel]?.height})
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-600">(없음)</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Download Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToExcel(sheets, sheets.fileName || 'pixel_rgb_sheets.xlsx')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-sm transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>구글시트/엑셀 파일 다운로드 (.xlsx)</span>
          </button>

          {activeMatrix && (
            <button
              onClick={() => exportToCSV(activeMatrix, activeChannel)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium text-xs border border-slate-600 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{activeChannel} CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid View */}
      {activeMatrix && (
        <div className="bg-slate-800/80 rounded-xl border border-slate-700/80 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/80 pb-3">
            <div>
              <h3 className="font-semibold text-white text-base flex items-center gap-2">
                <span
                  className={`w-3 h-3 rounded-full ${
                    activeChannel === 'R'
                      ? 'bg-red-500'
                      : activeChannel === 'G'
                      ? 'bg-green-500'
                      : activeChannel === 'B'
                      ? 'bg-blue-500'
                      : 'bg-slate-400'
                  }`}
                />
                {activeChannel} 채널 스프레드시트 데이터 (0~255)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                각 셀은 이미지의 (행, 열) 위치에서의 {activeChannel} 색상 농도 수치입니다. 클릭하여 셀 값을 변경할 수 있습니다.
              </p>
            </div>

            {/* Matrix Size Badge */}
            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-indigo-300 bg-indigo-950/60 px-3 py-1.5 rounded-lg border border-indigo-800/60 shrink-0">
              <span>고정 전체 크기: {matrixHeight}행 × {matrixWidth}열 ({matrixHeight * matrixWidth} 셀)</span>
            </div>
          </div>

          {/* Table Spreadsheet View */}
          <div className="overflow-auto max-h-[600px] rounded-lg border border-slate-700 bg-slate-950 shadow-inner">
            <table className="w-full text-center border-collapse text-xs font-mono">
              <thead>
                <tr className="bg-slate-900 text-slate-400 border-b border-slate-800">
                  <th className="p-2 border-r border-slate-800 bg-slate-900/80 font-bold w-12 sticky left-0 z-10 text-[11px]">
                    행\열
                  </th>
                  {Array.from({ length: endCol - startCol }).map((_, i) => {
                    const colIdx = startCol + i;
                    return (
                      <th key={colIdx} className="p-2 border-r border-slate-800 min-w-[44px] font-medium text-slate-300">
                        {colIdx + 1}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: endRow - startRow }).map((_, r) => {
                  const rowIdx = startRow + r;
                  return (
                    <tr key={rowIdx} className="border-b border-slate-800/80 hover:bg-slate-900/30">
                      {/* Row index header */}
                      <td className="p-2 border-r border-slate-800 font-bold bg-slate-900/90 text-slate-400 sticky left-0 z-10 text-[11px]">
                        {rowIdx + 1}
                      </td>

                      {/* Cell Data */}
                      {Array.from({ length: endCol - startCol }).map((_, c) => {
                        const colIdx = startCol + c;
                        const cellValue = activeMatrix.data[rowIdx]?.[colIdx] ?? 0;
                        const isEditing = editingCell?.row === rowIdx && editingCell?.col === colIdx;

                        return (
                          <td
                            key={colIdx}
                            onClick={() => handleCellClick(rowIdx, colIdx, cellValue)}
                            style={{ backgroundColor: getCellBgColor(cellValue, activeChannel) }}
                            className={`p-1.5 border-r border-slate-800/50 cursor-pointer font-semibold text-slate-900 transition-all hover:scale-105 hover:z-10 hover:shadow-md relative group ${
                              isEditing ? 'ring-2 ring-indigo-400 z-20 bg-white' : ''
                            }`}
                          >
                            {isEditing ? (
                              <div className="flex items-center">
                                <input
                                  type="number"
                                  min={0}
                                  max={255}
                                  autoFocus
                                  value={editVal}
                                  onChange={(e) => setEditVal(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleCellSave();
                                    if (e.key === 'Escape') setEditingCell(null);
                                  }}
                                  onBlur={handleCellSave}
                                  className="w-12 text-center text-slate-900 font-bold bg-white text-xs outline-none"
                                />
                              </div>
                            ) : (
                              <span>{cellValue}</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Quick Nav Buttons to Next Steps */}
          <div className="pt-2 flex flex-col sm:flex-row justify-end gap-3">
            <button
              onClick={onGoToGrayscale}
              className="px-4 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-600"
            >
              <span>4단계: 그레이스케일 수식 실습하기</span>
            </button>
            <button
              onClick={onGoToReconstruct}
              className="px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md"
            >
              <span>3단계: 시트 데이터로 RGB 이미지 복원하기</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
