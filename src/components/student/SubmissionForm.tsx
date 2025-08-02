'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { EssayProblem } from '@/types';

interface ProblemWithStatus extends EssayProblem {
  isSubmitted: boolean;
  canSubmit: boolean;
}

export default function SubmissionForm() {
  const [problems, setProblems] = useState<ProblemWithStatus[]>([]);
  const [selectedProblem, setSelectedProblem] = useState<string>('');
  const [content, setContent] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoadingProblems, setIsLoadingProblems] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchProblems();
  }, []);

  const fetchProblems = async () => {
    try {
      const response = await fetch('/api/essay-problems/student');
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || '문제 목록을 불러오는데 실패했습니다.');
      } else {
        setProblems(data.data || []);
      }
    } catch (error) {
      setError('서버 오류가 발생했습니다.');
    } finally {
      setIsLoadingProblems(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
    } else if (file) {
      setError('PDF 파일만 업로드 가능합니다.');
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    // 입력 검증
    if (!selectedProblem) {
      setError('문제를 선택해주세요.');
      setIsLoading(false);
      return;
    }

    if (!content && !pdfFile) {
      setError('답안을 작성하거나 PDF를 업로드해주세요.');
      setIsLoading(false);
      return;
    }

    try {
      const submitData = new FormData();
      submitData.append('problemId', selectedProblem);
      if (content) {
        submitData.append('content', content);
      }
      if (pdfFile) {
        submitData.append('pdfFile', pdfFile);
      }

      const response = await fetch('/api/submissions', {
        method: 'POST',
        body: submitData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || '답안 제출 중 오류가 발생했습니다.');
      } else {
        setSuccess('답안이 성공적으로 제출되었습니다!');
        // 폼 초기화
        setSelectedProblem('');
        setContent('');
        setPdfFile(null);
        // 파일 입력 초기화
        const fileInput = document.getElementById('pdfFile') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        // 문제 목록 새로고침
        fetchProblems();
      }
    } catch (error) {
      setError('서버 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price);
  };

  if (isLoadingProblems) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !problems.length) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchProblems}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (problems.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">풀 수 있는 논술 문제가 없습니다.</p>
        <p className="text-sm text-gray-400">선생님이 새로운 문제를 업로드할 때까지 기다려주세요.</p>
      </div>
    );
  }

  const availableProblems = problems.filter(p => !p.isSubmitted && p.canSubmit);

  if (availableProblems.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">제출할 수 있는 문제가 없습니다.</p>
        <p className="text-sm text-gray-400">모든 문제를 제출했거나 마감일이 지났습니다.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        답안 제출
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="problemId" className="block text-sm font-medium text-gray-700 mb-2">
            문제 선택 *
          </label>
          <select
            id="problemId"
            name="problemId"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={selectedProblem}
            onChange={(e) => setSelectedProblem(e.target.value)}
          >
            <option value="">문제를 선택하세요</option>
            {availableProblems.map((problem) => (
              <option key={problem._id.toString()} value={problem._id.toString()}>
                {problem.title} - {formatPrice(problem.price)}원 (마감: {formatDate(problem.dueDate.toString())})
              </option>
            ))}
          </select>
        </div>

        {selectedProblem && (
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="font-medium text-gray-900 mb-2">선택한 문제</h3>
            {(() => {
              const problem = problems.find(p => p._id.toString() === selectedProblem);
              if (!problem) return null;
              
              return (
                <div className="space-y-2 text-sm text-gray-600">
                  <p><strong>제목:</strong> {problem.title}</p>
                  <p><strong>설명:</strong> {problem.description}</p>
                  <p><strong>가격:</strong> {formatPrice(problem.price)}원</p>
                  <p><strong>마감일:</strong> {formatDate(problem.dueDate.toString())}</p>
                  {problem.pdfUrl && (
                    <p><strong>PDF:</strong> <span className="text-blue-600">첨부됨</span></p>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
            답안 작성 (선택사항)
          </label>
          <textarea
            id="content"
            name="content"
            rows={10}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="답안을 텍스트로 작성하거나 PDF 파일을 업로드하세요"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="pdfFile" className="block text-sm font-medium text-gray-700 mb-2">
            PDF 파일 업로드 (선택사항)
          </label>
          <input
            type="file"
            id="pdfFile"
            name="pdfFile"
            accept=".pdf"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            onChange={handleFileChange}
          />
          <p className="text-sm text-gray-500 mt-1">
            텍스트로 답안을 작성하거나 PDF 파일을 업로드하세요. 둘 중 하나는 반드시 입력해야 합니다.
          </p>
        </div>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="text-green-600 text-sm bg-green-50 p-3 rounded-md">
            {success}
          </div>
        )}

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '제출 중...' : '답안 제출'}
          </button>
        </div>
      </form>
    </div>
  );
} 