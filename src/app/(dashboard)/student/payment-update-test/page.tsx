'use client';

import { useState } from 'react';
import { UpdatePaymentStatusRequest } from '@/types';

export default function PaymentUpdateTestPage() {
  const [paymentId, setPaymentId] = useState('');
  const [status, setStatus] = useState<'pending' | 'paid' | 'failed'>('paid');
  const [transactionId, setTransactionId] = useState('');
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdateStatus = async () => {
    if (!paymentId) {
      alert('결제 ID를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const updateData: UpdatePaymentStatusRequest = {
        paymentId,
        status,
        transactionId: transactionId || undefined
      };

      const response = await fetch('/api/payment/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();
      setResult(result);

      if (result.success) {
        alert('결제 상태가 성공적으로 업데이트되었습니다!');
      } else {
        alert(`업데이트 실패: ${result.error}`);
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
      <h1 className="text-2xl font-bold mb-6">결제 상태 업데이트 테스트</h1>
      
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">결제 ID</label>
          <input
            type="text"
            value={paymentId}
            onChange={(e) => setPaymentId(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg"
            placeholder="업데이트할 결제 ID를 입력하세요"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">상태</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as 'pending' | 'paid' | 'failed')}
            className="w-full p-2 border border-gray-300 rounded-lg"
          >
            <option value="pending">pending</option>
            <option value="paid">paid</option>
            <option value="failed">failed</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">거래 ID (선택사항)</label>
          <input
            type="text"
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg"
            placeholder="거래 ID를 입력하세요"
          />
        </div>
      </div>

      <div className="border-t pt-6">
        <button
          onClick={handleUpdateStatus}
          disabled={isLoading}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
        >
          {isLoading ? '업데이트 중...' : '상태 업데이트'}
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
          <li>• 먼저 결제 생성 페이지에서 결제를 생성하세요</li>
          <li>• 생성된 결제 ID를 여기에 입력하세요</li>
          <li>• 원하는 상태로 변경하세요 (pending/paid/failed)</li>
          <li>• 거래 ID는 선택사항입니다</li>
          <li>• "상태 업데이트" 버튼을 클릭하세요</li>
        </ul>
      </div>
    </div>
  );
} 