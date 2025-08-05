'use client';

import { useState } from 'react';
import PaymentButton from '@/components/student/PaymentButton';

export default function PaymentTestPage() {
  const [studentId, setStudentId] = useState('507f1f77bcf86cd799439011'); // 샘플 ObjectId
  const [answerId, setAnswerId] = useState('507f1f77bcf86cd799439012'); // 샘플 ObjectId
  const [amount, setAmount] = useState(50000);

  const handlePaymentSuccess = (paymentId: string) => {
    console.log('Payment successful:', paymentId);
    alert(`결제가 성공적으로 생성되었습니다! 결제 ID: ${paymentId}`);
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
    alert(`결제 오류: ${error}`);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">결제 테스트 페이지</h1>
      
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">학생 ID</label>
          <input
            type="text"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg"
            placeholder="ObjectId 형식으로 입력"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">답안 ID</label>
          <input
            type="text"
            value={answerId}
            onChange={(e) => setAnswerId(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg"
            placeholder="ObjectId 형식으로 입력"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">결제 금액</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full p-2 border border-gray-300 rounded-lg"
            placeholder="금액을 입력하세요"
          />
        </div>
      </div>

      <div className="border-t pt-6">
        <h2 className="text-lg font-semibold mb-4">결제 버튼</h2>
        <PaymentButton
          studentId={studentId}
          answerId={answerId}
          amount={amount}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentError={handlePaymentError}
        />
      </div>

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">사용 방법:</h3>
        <ul className="text-sm space-y-1">
          <li>• 학생 ID와 답안 ID를 ObjectId 형식으로 입력하세요</li>
          <li>• 결제 금액을 설정하세요</li>
          <li>• "결제하기" 버튼을 클릭하여 결제를 생성하세요</li>
          <li>• 생성된 결제 ID가 화면에 표시됩니다</li>
        </ul>
      </div>
    </div>
  );
} 