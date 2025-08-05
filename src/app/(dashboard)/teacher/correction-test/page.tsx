'use client';

import { useState } from 'react';

export default function CorrectionTestPage() {
  const [studentId, setStudentId] = useState('');
  const [answerId, setAnswerId] = useState('');
  const [feedback, setFeedback] = useState('');
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateCorrection = async () => {
    if (!studentId || !answerId || !feedback) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/corrections-mongoose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId,
          answerId,
          feedback
        }),
      });

      const result = await response.json();
      setResult(result);

      if (result.success) {
        alert('첨삭이 성공적으로 생성되었습니다!');
      } else {
        alert(`첨삭 생성 실패: ${result.error}`);
      }
    } catch (err) {
      const errorMessage = '네트워크 오류가 발생했습니다.';
      setResult({ success: false, error: errorMessage });
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetCorrections = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/corrections-mongoose', {
        method: 'GET',
      });

      const result = await response.json();
      setResult(result);

      if (result.success) {
        alert(`${result.data.length}개의 첨삭을 조회했습니다.`);
      } else {
        alert(`첨삭 조회 실패: ${result.error}`);
      }
    } catch (err) {
      const errorMessage = '네트워크 오류가 발생했습니다.';
      setResult({ success: false, error: errorMessage });
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Mongoose Correction 모델 테스트</h1>
      
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">학생 ID</label>
          <input
            type="text"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg"
            placeholder="학생의 ObjectId를 입력하세요"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">답안 ID</label>
          <input
            type="text"
            value={answerId}
            onChange={(e) => setAnswerId(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg"
            placeholder="답안의 ObjectId를 입력하세요"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">첨삭 내용</label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg h-32"
            placeholder="첨삭 내용을 입력하세요"
          />
        </div>
      </div>

      <div className="space-x-4">
        <button
          onClick={handleCreateCorrection}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
        >
          {isLoading ? '처리 중...' : '첨삭 생성'}
        </button>

        <button
          onClick={handleGetCorrections}
          disabled={isLoading}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
        >
          {isLoading ? '처리 중...' : '첨삭 조회'}
        </button>
      </div>

      {result && (
        <div className="mt-6 p-4 bg-gray-50 border rounded-lg">
          <h3 className="font-semibold mb-2">응답 결과:</h3>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">사용 방법:</h3>
        <ul className="text-sm space-y-1">
          <li>• 학생 ID와 답안 ID를 ObjectId 형식으로 입력하세요</li>
          <li>• 첨삭 내용을 입력하세요</li>
          <li>• "첨삭 생성" 버튼을 클릭하여 Mongoose 모델로 첨삭을 생성하세요</li>
          <li>• "첨삭 조회" 버튼으로 현재 사용자의 첨삭 목록을 조회하세요</li>
          <li>• 생성된 첨삭은 MongoDB에 저장됩니다</li>
        </ul>
      </div>
    </div>
  );
} 