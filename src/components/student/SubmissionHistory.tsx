'use client';

import { useState, useEffect } from 'react';
import { Submission } from '@/types';

interface SubmissionWithDetails extends Submission {
  problem?: {
    title: string;
    description: string;
    dueDate: Date;
    price: number;
  };
}

export default function SubmissionHistory() {
  const [submissions, setSubmissions] = useState<SubmissionWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const response = await fetch('/api/submissions');
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || '제출 내역을 불러오는데 실패했습니다.');
      } else {
        setSubmissions(data.data || []);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">제출됨</span>;
      case 'reviewing':
        return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">검토 중</span>;
      case 'completed':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">완료</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
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
          onClick={fetchSubmissions}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">제출한 답안이 없습니다.</p>
        <p className="text-sm text-gray-400">첫 번째 답안을 제출해보세요!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">
          제출 내역 ({submissions.length}개)
        </h2>
      </div>

      <div className="space-y-4">
        {submissions.map((submission) => (
          <div
            key={submission._id.toString()}
            className="bg-white rounded-lg shadow-md overflow-hidden"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {submission.problem?.title || '알 수 없는 문제'}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">
                    {submission.problem?.description || '설명 없음'}
                  </p>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  {getStatusBadge(submission.status)}
                  <span className="text-lg font-bold text-blue-600">
                    {submission.problem?.price ? formatPrice(submission.problem.price) + '원' : ''}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
                <div>
                  <span className="font-medium">제출일:</span>
                  <span className="ml-2">{formatDate(submission.submittedAt.toString())}</span>
                </div>
                
                {submission.problem?.dueDate && (
                  <div>
                    <span className="font-medium">마감일:</span>
                    <span className="ml-2">{formatDate(submission.problem.dueDate.toString())}</span>
                  </div>
                )}

                <div>
                  <span className="font-medium">답안 유형:</span>
                  <span className="ml-2">
                    {submission.content ? '텍스트' : ''}
                    {submission.content && submission.pdfUrl ? ' + ' : ''}
                    {submission.pdfUrl ? 'PDF' : ''}
                  </span>
                </div>

                {submission.score !== undefined && (
                  <div>
                    <span className="font-medium">점수:</span>
                    <span className="ml-2 font-bold text-green-600">{submission.score}점</span>
                  </div>
                )}
              </div>

              {submission.content && (
                <div className="mt-4 p-3 bg-gray-50 rounded-md">
                  <h4 className="font-medium text-gray-900 mb-2">답안 내용</h4>
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {submission.content}
                  </p>
                </div>
              )}

              {submission.feedback && (
                <div className="mt-4 p-3 bg-blue-50 rounded-md">
                  <h4 className="font-medium text-blue-900 mb-2">첨삭 피드백</h4>
                  <p className="text-sm text-blue-700">
                    {submission.feedback}
                  </p>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <div className="flex space-x-2">
                    {submission.pdfUrl && (
                      <button className="text-sm text-blue-600 hover:text-blue-800">
                        PDF 보기
                      </button>
                    )}
                    <button className="text-sm text-gray-600 hover:text-gray-800">
                      상세 보기
                    </button>
                  </div>
                  
                  {submission.status === 'completed' && (
                    <span className="text-sm text-green-600 font-medium">
                      첨삭 완료
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 