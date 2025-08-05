'use client';

import { useState } from 'react';
import { CreatePaymentRequest } from '@/types';

interface PaymentButtonProps {
  studentId: string;
  answerId: string;
  amount: number;
  onPaymentSuccess?: (paymentId: string) => void;
  onPaymentError?: (error: string) => void;
}

export default function PaymentButton({
  studentId,
  answerId,
  amount,
  onPaymentSuccess,
  onPaymentError
}: PaymentButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const paymentData: CreatePaymentRequest = {
        studentId,
        answerId,
        amount,
        method: 'card' // 기본값으로 카드 결제 설정
      };

      const response = await fetch('/api/payment/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      const result = await response.json();

      if (result.success) {
        const newPaymentId = result.data.paymentId;
        setPaymentId(newPaymentId);
        onPaymentSuccess?.(newPaymentId);
      } else {
        const errorMessage = result.error || '결제 생성 중 오류가 발생했습니다.';
        setError(errorMessage);
        onPaymentError?.(errorMessage);
      }
    } catch (err) {
      const errorMessage = '네트워크 오류가 발생했습니다.';
      setError(errorMessage);
      onPaymentError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={handlePayment}
        disabled={isLoading}
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
      >
        {isLoading ? '결제 처리 중...' : `${amount.toLocaleString()}원 결제하기`}
      </button>

      {paymentId && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 font-medium">결제가 성공적으로 생성되었습니다!</p>
          <p className="text-green-600 text-sm mt-1">결제 ID: {paymentId}</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 font-medium">결제 오류</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      )}
    </div>
  );
} 