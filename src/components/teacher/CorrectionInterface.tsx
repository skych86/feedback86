'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Submission, PDFAnnotation } from '@/types';
import PDFViewer from './PDFViewer';

interface SubmissionWithDetails extends Submission {
  problem?: {
    title: string;
    description: string;
    dueDate: Date;
    price: number;
  };
  student?: {
    name: string;
    email: string;
  };
}

export default function CorrectionInterface() {
  const [submissions, setSubmissions] = useState<SubmissionWithDetails[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionWithDetails | null>(null);
  const [correctionContent, setCorrectionContent] = useState('');
  const [score, setScore] = useState('');
  const [feedback, setFeedback] = useState('');
  const [pdfAnnotations, setPdfAnnotations] = useState<PDFAnnotation[]>([]);
  const [showPDFViewer, setShowPDFViewer] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const response = await fetch('/api/submissions/teacher');
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || '답안 목록을 불러오는데 실패했습니다.');
      } else {
        setSubmissions(data.data || []);
      }
    } catch (error) {
      setError('서버 오류가 발생했습니다.');
    } finally {
      setIsLoadingSubmissions(false);
    }
  };

  const handleSubmissionSelect = (submission: SubmissionWithDetails) => {
    setSelectedSubmission(submission);
    setCorrectionContent(submission.content || '');
    setScore('');
    setFeedback('');
    setPdfAnnotations([]);
    setShowPDFViewer(false);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission) return;

    setIsLoading(true);
    setError('');
    setSuccess('');

    // 입력 검증
    if (!correctionContent.trim() || !score || !feedback.trim()) {
      setError('모든 필드를 입력해주세요.');
      setIsLoading(false);
      return;
    }

    const scoreNum = parseInt(score);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
      setError('점수는 0-100 사이의 숫자여야 합니다.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/corrections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          submissionId: selectedSubmission._id.toString(),
          content: correctionContent,
          score: scoreNum,
          feedback,
          annotations: pdfAnnotations,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || '첨삭 저장 중 오류가 발생했습니다.');
      } else {
        setSuccess('첨삭이 성공적으로 완료되었습니다!');
        // 폼 초기화
        setCorrectionContent('');
        setScore('');
        setFeedback('');
        setSelectedSubmission(null);
        // 답안 목록 새로고침
        fetchSubmissions();
      }
    } catch (error) {
      setError('서버 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (!selectedSubmission) return;

    setIsExporting(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/corrections/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          submissionId: selectedSubmission._id.toString(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'PDF 내보내기 중 오류가 발생했습니다.');
      } else {
        setSuccess('PDF 내보내기가 완료되었습니다!');
        // 실제 구현에서는 PDF 다운로드 링크 제공
        if (data.data?.pdfUrl) {
          window.open(data.data.pdfUrl, '_blank');
        }
      }
    } catch (error) {
      setError('서버 오류가 발생했습니다.');
    } finally {
      setIsExporting(false);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">대기 중</span>;
      case 'reviewing':
        return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">검토 중</span>;
      case 'completed':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">완료</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  if (isLoadingSubmissions) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !submissions.length) {
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
        <p className="text-gray-500 mb-4">첨삭할 답안이 없습니다.</p>
        <p className="text-sm text-gray-400">학생들이 답안을 제출하면 여기에 표시됩니다.</p>
      </div>
    );
  }

  const pendingSubmissions = submissions.filter(s => s.status === 'submitted');

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 답안 목록 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            첨삭 대기 답안 ({pendingSubmissions.length}개)
          </h2>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {submissions.map((submission) => (
              <div
                key={submission._id.toString()}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedSubmission?._id.toString() === submission._id.toString()
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleSubmissionSelect(submission)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-gray-900">
                    {submission.problem?.title || '알 수 없는 문제'}
                  </h3>
                  {getStatusBadge(submission.status)}
                </div>
                
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>학생:</strong> {submission.student?.name || '알 수 없음'}</p>
                  <p><strong>제출일:</strong> {formatDate(submission.submittedAt.toString())}</p>
                  <p><strong>답안 유형:</strong> {submission.content ? '텍스트' : ''} {submission.content && submission.pdfUrl ? '+' : ''} {submission.pdfUrl ? 'PDF' : ''}</p>
                </div>

                {submission.content && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-600">
                    <p className="line-clamp-2">{submission.content}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 첨삭 폼 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {selectedSubmission ? (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                첨삭 작성
              </h2>
              
                             <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                 <h3 className="font-medium text-gray-900 mb-2">선택된 답안</h3>
                 <div className="text-sm text-gray-600 space-y-1">
                   <p><strong>문제:</strong> {selectedSubmission.problem?.title}</p>
                   <p><strong>학생:</strong> {selectedSubmission.student?.name}</p>
                   <p><strong>제출일:</strong> {formatDate(selectedSubmission.submittedAt.toString())}</p>
                   {selectedSubmission.pdfUrl && (
                     <div className="mt-2">
                       <button
                         onClick={() => setShowPDFViewer(!showPDFViewer)}
                         className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                       >
                         {showPDFViewer ? 'PDF 뷰어 숨기기' : 'PDF 뷰어 열기'}
                       </button>
                     </div>
                   )}
                 </div>
               </div>

               {showPDFViewer && selectedSubmission.pdfUrl && (
                 <div className="mb-6">
                   <PDFViewer
                     pdfUrl={selectedSubmission.pdfUrl}
                     submissionId={selectedSubmission._id.toString()}
                     onAnnotationsChange={setPdfAnnotations}
                   />
                 </div>
               )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="correctionContent" className="block text-sm font-medium text-gray-700 mb-2">
                    첨삭된 답안 *
                  </label>
                  <textarea
                    id="correctionContent"
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="학생의 답안을 첨삭하여 작성하세요"
                    value={correctionContent}
                    onChange={(e) => setCorrectionContent(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="score" className="block text-sm font-medium text-gray-700 mb-2">
                    점수 (0-100) *
                  </label>
                  <input
                    type="number"
                    id="score"
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-2">
                    전체 피드백 *
                  </label>
                  <textarea
                    id="feedback"
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="학생에게 전달할 전체적인 피드백을 작성하세요"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    required
                  />
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
                    onClick={handleExportPDF}
                    disabled={isExporting}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isExporting ? '내보내기 중...' : 'PDF 내보내기'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSubmission(null);
                      setCorrectionContent('');
                      setScore('');
                      setFeedback('');
                      setPdfAnnotations([]);
                      setShowPDFViewer(false);
                      setError('');
                      setSuccess('');
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? '저장 중...' : '첨삭 완료'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">첨삭할 답안을 선택하세요</p>
              <p className="text-sm text-gray-400 mt-2">왼쪽 목록에서 답안을 클릭하면 첨삭할 수 있습니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 