'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import StripePaymentButton from '@/components/student/StripePaymentButton';

export default function StripePaymentTestPage() {
  const { data: session } = useSession();
  const [testAmount, setTestAmount] = useState(5000);
  const [testAnswerId, setTestAnswerId] = useState('test-answer-123');
  const [message, setMessage] = useState('');

  const handleSuccess = () => {
    setMessage('결제가 성공적으로 처리되었습니다!');
  };

  const handleError = (error: string) => {
    setMessage(`결제 오류: ${error}`);
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">로그인이 필요합니다</h1>
          <p className="text-gray-600">결제 테스트를 위해 로그인해 주세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center mb-8">
            Stripe 결제 테스트
          </h1>

          {/* 사용자 정보 */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h2 className="font-semibold text-blue-900 mb-2">사용자 정보</h2>
            <div className="text-sm text-blue-800">
              <p><strong>이름:</strong> {session.user.name}</p>
              <p><strong>이메일:</strong> {session.user.email}</p>
              <p><strong>역할:</strong> {session.user.role}</p>
            </div>
          </div>

          {/* 테스트 설정 */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h2 className="font-semibold text-gray-900 mb-4">테스트 설정</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  결제 금액 (원)
                </label>
                <input
                  type="number"
                  value={testAmount}
                  onChange={(e) => setTestAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1000"
                  step="1000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  테스트 답안 ID
                </label>
                <input
                  type="text"
                  value={testAnswerId}
                  onChange={(e) => setTestAnswerId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* 결제 버튼 */}
          <div className="mb-6">
            <h2 className="font-semibold text-gray-900 mb-4">결제 테스트</h2>
            <StripePaymentButton
              answerId={testAnswerId}
              amount={testAmount}
              onSuccess={handleSuccess}
              onError={handleError}
            />
          </div>

          {/* 메시지 표시 */}
          {message && (
            <div className={`p-4 rounded-lg ${
              message.includes('성공') 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              <p className="font-medium">{message}</p>
            </div>
          )}

          {/* 안내사항 */}
          <div className="mt-8 bg-yellow-50 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-800 mb-2">테스트 안내사항</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• 이 페이지는 Stripe 결제 기능을 테스트하기 위한 페이지입니다.</li>
              <li>• 실제 결제가 발생하지 않습니다 (테스트 모드).</li>
              <li>• Stripe 테스트 카드 번호: 4242 4242 4242 4242</li>
              <li>• 만료일: 미래의 아무 날짜 (예: 12/25)</li>
              <li>• CVC: 아무 3자리 숫자 (예: 123)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 