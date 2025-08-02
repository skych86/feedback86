'use client';

import { useState, useEffect, useRef } from 'react';
import { PDFAnnotation } from '@/types';

interface PDFViewerProps {
  pdfUrl: string;
  submissionId: string;
  onAnnotationsChange: (annotations: PDFAnnotation[]) => void;
}

export default function PDFViewer({ pdfUrl, submissionId, onAnnotationsChange }: PDFViewerProps) {
  const [annotations, setAnnotations] = useState<PDFAnnotation[]>([]);
  const [currentTool, setCurrentTool] = useState<'highlight' | 'comment' | 'underline'>('highlight');
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfRef = useRef<any>(null);

  // 주석 로드
  useEffect(() => {
    loadAnnotations();
  }, [submissionId]);

  const loadAnnotations = async () => {
    try {
      const response = await fetch(`/api/annotations?submissionId=${submissionId}`);
      const data = await response.json();
      
      if (response.ok && data.data?.annotations) {
        setAnnotations(data.data.annotations);
        onAnnotationsChange(data.data.annotations);
      }
    } catch (error) {
      console.error('주석 로드 실패:', error);
    }
  };

  // 주석 저장
  const saveAnnotations = async () => {
    try {
      const response = await fetch('/api/annotations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          submissionId,
          annotations,
        }),
      });

      if (!response.ok) {
        throw new Error('주석 저장 실패');
      }
    } catch (error) {
      console.error('주석 저장 오류:', error);
    }
  };

  // 새 주석 추가
  const addAnnotation = (annotation: Omit<PDFAnnotation, 'id' | 'createdAt' | 'createdBy'>) => {
    const newAnnotation: PDFAnnotation = {
      ...annotation,
      id: `annotation_${Date.now()}_${Math.random()}`,
      createdAt: new Date(),
      createdBy: '', // 서버에서 설정
    };

    const updatedAnnotations = [...annotations, newAnnotation];
    setAnnotations(updatedAnnotations);
    onAnnotationsChange(updatedAnnotations);
    saveAnnotations();
  };

  // 주석 삭제
  const removeAnnotation = (annotationId: string) => {
    const updatedAnnotations = annotations.filter(a => a.id !== annotationId);
    setAnnotations(updatedAnnotations);
    onAnnotationsChange(updatedAnnotations);
    saveAnnotations();
  };

  // 마우스 이벤트 핸들러
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setStartPoint({ x, y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 실시간 드로잉 (간단한 구현)
    drawAnnotation(startPoint.x, startPoint.y, x - startPoint.x, y - startPoint.y);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const width = Math.abs(x - startPoint.x);
    const height = Math.abs(y - startPoint.y);

    if (width > 5 && height > 5) {
      addAnnotation({
        type: currentTool,
        page: currentPage,
        x: Math.min(startPoint.x, x),
        y: Math.min(startPoint.y, y),
        width,
        height,
        color: getToolColor(currentTool),
        content: currentTool === 'comment' ? prompt('주석 내용을 입력하세요:') : undefined,
      });
    }

    setIsDrawing(false);
  };

  // 도구별 색상
  const getToolColor = (tool: string) => {
    switch (tool) {
      case 'highlight':
        return '#ffff00';
      case 'underline':
        return '#ff0000';
      case 'comment':
        return '#00ff00';
      default:
        return '#ffff00';
    }
  };

  // 주석 그리기
  const drawAnnotation = (x: number, y: number, width: number, height: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = getToolColor(currentTool);
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);

    if (currentTool === 'highlight') {
      ctx.fillStyle = getToolColor(currentTool);
      ctx.globalAlpha = 0.3;
      ctx.fillRect(x, y, width, height);
      ctx.globalAlpha = 1;
    }
  };

  // 모든 주석 다시 그리기
  const redrawAnnotations = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 캔버스 클리어
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 현재 페이지의 주석만 그리기
    const pageAnnotations = annotations.filter(a => a.page === currentPage);
    
    pageAnnotations.forEach(annotation => {
      ctx.strokeStyle = annotation.color;
      ctx.lineWidth = 2;
      ctx.strokeRect(annotation.x, annotation.y, annotation.width, annotation.height);

      if (annotation.type === 'highlight') {
        ctx.fillStyle = annotation.color;
        ctx.globalAlpha = 0.3;
        ctx.fillRect(annotation.x, annotation.y, annotation.width, annotation.height);
        ctx.globalAlpha = 1;
      }
    });
  };

  useEffect(() => {
    redrawAnnotations();
  }, [annotations, currentPage]);

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">PDF 뷰어</h3>
        
        {/* 도구 선택 */}
        <div className="flex space-x-2 mb-4">
          <button
            onClick={() => setCurrentTool('highlight')}
            className={`px-3 py-1 rounded text-sm ${
              currentTool === 'highlight' 
                ? 'bg-yellow-500 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            하이라이트
          </button>
          <button
            onClick={() => setCurrentTool('underline')}
            className={`px-3 py-1 rounded text-sm ${
              currentTool === 'underline' 
                ? 'bg-red-500 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            밑줄
          </button>
          <button
            onClick={() => setCurrentTool('comment')}
            className={`px-3 py-1 rounded text-sm ${
              currentTool === 'comment' 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            주석
          </button>
        </div>

        {/* 페이지 네비게이션 */}
        <div className="flex items-center space-x-2 mb-4">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50"
          >
            이전
          </button>
          <span className="text-sm text-gray-600">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
            className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50"
          >
            다음
          </button>
        </div>
      </div>

      {/* PDF 뷰어 영역 */}
      <div className="border border-gray-300 rounded-lg overflow-hidden">
        {pdfUrl ? (
          <div className="relative">
            {/* PDF 표시 (실제 구현에서는 PDF.js 사용) */}
            <div className="bg-gray-100 p-8 text-center">
              <p className="text-gray-600">PDF 파일: {pdfUrl}</p>
              <p className="text-sm text-gray-500 mt-2">
                실제 구현에서는 PDF.js를 사용하여 PDF를 렌더링합니다.
              </p>
            </div>
            
            {/* 주석 캔버스 */}
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full pointer-events-auto"
              width={800}
              height={600}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
            />
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            PDF 파일이 없습니다.
          </div>
        )}
      </div>

      {/* 주석 목록 */}
      <div className="mt-4">
        <h4 className="font-medium text-gray-900 mb-2">주석 목록</h4>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {annotations
            .filter(a => a.page === currentPage)
            .map((annotation) => (
              <div
                key={annotation.id}
                className="flex items-center justify-between p-2 bg-gray-50 rounded"
              >
                <div className="flex items-center space-x-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: annotation.color }}
                  />
                  <span className="text-sm text-gray-700">
                    {annotation.type === 'comment' && annotation.content
                      ? annotation.content
                      : `${annotation.type} (${annotation.x}, ${annotation.y})`
                    }
                  </span>
                </div>
                <button
                  onClick={() => removeAnnotation(annotation.id)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  삭제
                </button>
              </div>
            ))}
          {annotations.filter(a => a.page === currentPage).length === 0 && (
            <p className="text-sm text-gray-500 text-center py-2">
              이 페이지에 주석이 없습니다.
            </p>
          )}
        </div>
      </div>
    </div>
  );
} 