'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { EssayProblem } from '@/types';

export default function EssayProblemList() {
  const [problems, setProblems] = useState<EssayProblem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProblems();
  }, []);

  const fetchProblems = async () => {
    try {
      const response = await fetch('/api/essay-problems');
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || '문제 목록을 불러오는데 실패했습니다.');
      } else {
        setProblems(data.data || []);
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
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
        <p className="text-gray-500 mb-4">업로드된 논술 문제가 없습니다.</p>
        <Link
          href="/teacher/problems/upload"
          className="inline-block px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          첫 번째 문제 업로드하기
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">
          업로드된 논술 문제 ({problems.length}개)
        </h2>
        <Link
          href="/teacher/problems/upload"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          새 문제 업로드
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {problems.map((problem) => (
          <div
            key={problem._id.toString()}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                  {problem.title}
                </h3>
                <span className="text-lg font-bold text-blue-600">
                  {formatPrice(problem.price)}원
                </span>
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                {problem.description}
              </p>

              <div className="space-y-2 text-sm text-gray-500">
                <div className="flex items-center">
                  <span className="font-medium">마감일:</span>
                  <span className="ml-2">
                    {formatDate(problem.dueDate.toString())}
                  </span>
                </div>
                
                <div className="flex items-center">
                  <span className="font-medium">업로드일:</span>
                  <span className="ml-2">
                    {formatDate(problem.createdAt.toString())}
                  </span>
                </div>

                {problem.pdfUrl && (
                  <div className="flex items-center">
                    <span className="font-medium">PDF:</span>
                    <span className="ml-2 text-blue-600">첨부됨</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    problem.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {problem.isActive ? '활성' : '비활성'}
                  </span>
                  
                  <div className="space-x-2">
                    <button className="text-sm text-blue-600 hover:text-blue-800">
                      수정
                    </button>
                    <button className="text-sm text-red-600 hover:text-red-800">
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 