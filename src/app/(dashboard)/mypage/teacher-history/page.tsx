'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import CorrectionHistory from '@/components/CorrectionHistory';

export default function TeacherHistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);

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

    // 세션에서 사용자 ID 설정
    setUserId(session.user.id);
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">로딩 중...</span>
      </div>
    );
  }

  if (!session || session.user.role !== 'teacher') {
    return null; // 리다이렉트 중
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">내 첨삭 히스토리</h1>
        <p className="text-gray-600 mt-2">
          {session.user.name}님이 작성한 첨삭 히스토리입니다.
        </p>
      </div>

      {userId && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">첨삭 내역</h2>
            <p className="text-sm text-gray-600 mt-1">
              학생들에게 작성한 첨삭들을 확인할 수 있습니다.
            </p>
          </div>
          <div className="p-6">
            <CorrectionHistory userType="teacher" userId={userId} />
          </div>
        </div>
      )}

      {!userId && (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">사용자 정보를 불러오는 중...</span>
        </div>
      )}
    </div>
  );
} 