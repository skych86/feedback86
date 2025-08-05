'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { loadStripe } from '@stripe/stripe-js';
import { CreateStripePaymentRequest, StripePaymentSessionResponse } from '@/types';

// Stripe 로드 (클라이언트 사이드에서만)
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface StripePaymentButtonProps {
  answerId: string;
  amount: number;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export default function StripePaymentButton({
  answerId,
  amount,
  onSuccess,
  onError
}: StripePaymentButtonProps) {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  const handlePayment = async () => {
    if (!session?.user) {
      onError?.('로그인이 필요합니다.');
      return;
    }

    setIsLoading(true);

    try {
      // 결제 세션 생성 요청
      const response = await fetch('/api/stripe/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: session.user.id,
          answerId: answerId,
          amount: amount,
          successUrl: `${window.location.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/payment/cancel`,
        } as CreateStripePaymentRequest),
      });

      const data: StripePaymentSessionResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || '결제 세션 생성에 실패했습니다.');
      }

      // Stripe Checkout으로 리다이렉트
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe를 로드할 수 없습니다.');
      }

      const { error } = await stripe.redirectToCheckout({
        sessionId: data.data!.sessionId,
      });

      if (error) {
        throw new Error(error.message);
      }

      onSuccess?.();

    } catch (error) {
      console.error('결제 오류:', error);
      onError?.(error instanceof Error ? error.message : '결제에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <button
        onClick={handlePayment}
        disabled={isLoading}
        className={`
          w-full px-6 py-3 text-white font-medium rounded-lg
          transition-colors duration-200
          ${isLoading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
          }
        `}
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            결제 처리 중...
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" />
            </svg>
            {amount.toLocaleString()}원 결제하기
          </div>
        )}
      </button>
      
      <div className="mt-4 text-sm text-gray-600 text-center">
        <p>안전한 결제를 위해 Stripe를 사용합니다.</p>
        <p className="mt-1">결제 후 첨삭 서비스를 이용하실 수 있습니다.</p>
      </div>
    </div>
  );
} 