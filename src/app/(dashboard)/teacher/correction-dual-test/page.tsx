'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function CorrectionDualTestPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [formData, setFormData] = useState({
    submissionId: '',
    content: '이 답안은 논술의 구조가 잘 잡혀있습니다. 하지만 더 구체적인 예시를 추가하면 좋겠습니다.',
    score: 85,
    feedback: '전반적으로 좋은 답안입니다. 논리적 구조가 명확하고 주장이 잘 드러나 있습니다. 다만 구체적인 사례나 데이터를 활용하면 더욱 설득력 있는 답안이 될 것입니다.'
  });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/login');
      return;
    }

    if (session.user.role !== 'teacher') {
      router.push('/dashboard');
      return;
    }
  }, [session, status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/corrections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || '첨삭 생성 중 오류가 발생했습니다.');
      }
    } catch (err) {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'score' ? parseInt(value) || 0 : value
    }));
  };

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">로딩 중...</span>
      </div>
    );
  }

  if (!session || session.user.role !== 'teacher') {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">첨삭 이중 생성 테스트</h1>
      <p className="text-gray-600 mb-6">
        기존 MongoDB collection과 Mongoose Correction 모델에 동시에 첨삭을 생성하는 테스트입니다.
      </p>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">첨삭 생성</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">제출 답안 ID</label>
            <input
              type="text"
              name="submissionId"
              value={formData.submissionId}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-lg"
              placeholder="ObjectId 형식으로 입력하세요"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">첨삭 내용</label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              rows={4}
              className="w-full p-2 border border-gray-300 rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">점수 (0-100)</label>
            <input
              type="number"
              name="score"
              value={formData.score}
              onChange={handleInputChange}
              min="0"
              max="100"
              className="w-full p-2 border border-gray-300 rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">피드백</label>
            <textarea
              name="feedback"
              value={formData.feedback}
              onChange={handleInputChange}
              rows={4}
              className="w-full p-2 border border-gray-300 rounded-lg"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '처리 중...' : '첨삭 생성'}
          </button>
        </form>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h3 className="text-red-800 font-medium">오류</h3>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      )}

      {result && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-green-800 font-medium">성공!</h3>
          <div className="mt-2 space-y-2">
            <p className="text-green-600 text-sm">
              <strong>메시지:</strong> {result.message}
            </p>
            <p className="text-green-600 text-sm">
              <strong>기존 MongoDB ID:</strong> {result.data.id}
            </p>
            <p className="text-green-600 text-sm">
              <strong>Mongoose Correction ID:</strong> {result.data.mongooseCorrectionId || 'N/A'}
            </p>
            <p className="text-green-600 text-sm">
              <strong>제출 답안 ID:</strong> {result.data.submissionId}
            </p>
            <p className="text-green-600 text-sm">
              <strong>점수:</strong> {result.data.score}점
            </p>
          </div>
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold mb-2">테스트 방법:</h3>
        <ul className="text-sm space-y-1">
          <li>• 유효한 제출 답안 ID를 입력하세요</li>
          <li>• 첨삭 내용과 점수, 피드백을 입력하세요</li>
          <li>• "첨삭 생성" 버튼을 클릭하세요</li>
          <li>• 기존 MongoDB collection과 Mongoose Correction 모델에 모두 생성되는지 확인하세요</li>
          <li>• 같은 studentId와 answerId 조합으로 중복 생성 시도 시 409 오류가 발생하는지 확인하세요</li>
        </ul>
      </div>
    </div>
  );
} 