'use client';

import Link from 'next/link';

export default function PaymentCancelPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          {/* 취소 아이콘 */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-6">
            <svg className="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            결제가 취소되었습니다
          </h1>
          
          <p className="text-gray-600 mb-6">
            결제가 취소되었습니다. 언제든지 다시 결제하실 수 있습니다.
          </p>

          {/* 안내 정보 */}
          <div className="bg-yellow-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-yellow-800 mb-2">안내사항</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• 결제가 완료되지 않았습니다.</li>
              <li>• 카드 정보는 저장되지 않습니다.</li>
              <li>• 언제든지 다시 결제하실 수 있습니다.</li>
            </ul>
          </div>

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