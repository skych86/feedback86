'use client';

import { useState } from 'react';
import CorrectionHistory from '@/components/CorrectionHistory';

export default function CorrectionHistoryTestPage() {
  const [userType, setUserType] = useState<'student' | 'teacher'>('student');
  const [userId, setUserId] = useState('507f1f77bcf86cd799439011'); // 샘플 ObjectId

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">첨삭 히스토리 테스트</h1>
      
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">설정</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">사용자 타입</label>
            <select
              value={userType}
              onChange={(e) => setUserType(e.target.value as 'student' | 'teacher')}
              className="w-full p-2 border border-gray-300 rounded-lg"
            >
              <option value="student">학생</option>
              <option value="teacher">선생님</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">사용자 ID</label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
              placeholder="ObjectId 형식으로 입력하세요"
            />
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">
          {userType === 'student' ? '학생' : '선생님'} 첨삭 히스토리
        </h2>
        <CorrectionHistory userType={userType} userId={userId} />
      </div>

             <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
         <h3 className="font-semibold mb-2">사용 방법:</h3>
         <ul className="text-sm space-y-1">
           <li>• 사용자 타입을 선택하세요 (학생/선생님)</li>
           <li>• 사용자 ID를 ObjectId 형식으로 입력하세요</li>
           <li>• 해당 사용자의 첨삭 히스토리가 테이블로 표시됩니다</li>
           <li>• 검색, 날짜, 이름 필터를 사용하여 원하는 첨삭을 찾을 수 있습니다</li>
           <li>• 페이징 기능으로 많은 데이터를 효율적으로 볼 수 있습니다</li>
           <li>• '더보기' 버튼을 클릭하면 모달로 전체 첨삭 내용을 확인할 수 있습니다</li>
           <li>• 모바일에서는 카드 형태로 표시되어 더 편리하게 볼 수 있습니다</li>
         </ul>
       </div>
    </div>
  );
} 