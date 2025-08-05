'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    if (!sessionId) {
      router.push('/student/dashboard');
      return;
    }

    // 결제 세션 정보 확인 (실제로는 서버에서 검증해야 함)
    const checkPaymentStatus = async () => {
      try {
        // 여기서 서버 API를 호출하여 결제 상태를 확인할 수 있습니다
        // const response = await fetch(`/api/payment/verify?session_id=${sessionId}`);
        // const data = await response.json();
        
        // 임시로 성공으로 처리
        setPaymentDetails({
          sessionId: sessionId,
          status: 'success',
          amount: '결제 금액',
          date: new Date().toLocaleDateString('ko-KR')
        });
      } catch (error) {
        console.error('결제 확인 오류:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkPaymentStatus();
  }, [searchParams, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">결제 정보를 확인하고 있습니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          {/* 성공 아이콘 */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            결제가 완료되었습니다!
          </h1>
          
          <p className="text-gray-600 mb-6">
            안전하게 결제가 처리되었습니다. 이제 첨삭 서비스를 이용하실 수 있습니다.
          </p>

          {/* 결제 정보 */}
          {paymentDetails && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">결제 정보</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>결제 상태:</span>
                  <span className="text-green-600 font-medium">성공</span>
                </div>
                <div className="flex justify-between">
                  <span>결제 일시:</span>
                  <span>{paymentDetails.date}</span>
                </div>
                <div className="flex justify-between">
                  <span>세션 ID:</span>
                  <span className="text-xs font-mono">{paymentDetails.sessionId}</span>
                </div>
              </div>
            </div>
          )}

          {/* 버튼들 */}
          <div className="space-y-3">
            <Link
              href="/student/dashboard"
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 block text-center"
            >
              대시보드로 돌아가기
            </Link>
            
            <Link
              href="/student/submissions"
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors duration-200 block text-center"
            >
              제출 내역 보기
            </Link>
          </div>

          <div className="mt-6 text-xs text-gray-500">
            <p>결제 관련 문의사항이 있으시면 고객센터로 연락해 주세요.</p>
          </div>
        </div>
      </div>
    </div>
  );
} 