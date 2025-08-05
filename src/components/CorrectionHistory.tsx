'use client';

import { useState, useEffect } from 'react';

interface CorrectionHistoryProps {
  userType: 'student' | 'teacher';
  userId: string;
}

interface CorrectionItem {
  id: string;
  title: string;
  feedback: string;
  feedbackPreview: string;
  date: string;
  teacherName?: string;
  teacherEmail?: string;
  studentName?: string;
  studentEmail?: string;
  submissionContent: string;
  problemTitle: string;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  feedback: string;
  title: string;
  opponentName: string;
  date: string;
}

function FeedbackModal({ isOpen, onClose, feedback, title, opponentName, date }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1 pr-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 break-words">{title}</h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                {opponentName} • {new Date(date).toLocaleDateString('ko-KR')}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl font-bold flex-shrink-0"
            >
              ×
            </button>
          </div>
          
          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">첨삭 내용</h4>
            <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
              <p className="text-gray-800 whitespace-pre-wrap text-sm sm:text-base leading-relaxed">{feedback}</p>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-3 sm:px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm sm:text-base"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CorrectionHistory({ userType, userId }: CorrectionHistoryProps) {
  const [corrections, setCorrections] = useState<CorrectionItem[]>([]);
  const [filteredCorrections, setFilteredCorrections] = useState<CorrectionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 검색 및 필터 상태
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [nameFilter, setNameFilter] = useState('');
  
  // 페이징 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // 모달 상태
  const [selectedCorrection, setSelectedCorrection] = useState<CorrectionItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchCorrections = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/corrections/${userType}/${userId}`);
        const result = await response.json();

        if (result.success) {
          setCorrections(result.data);
          setFilteredCorrections(result.data);
        } else {
          setError(result.error || '첨삭 히스토리를 불러오는데 실패했습니다.');
        }
      } catch (err) {
        setError('네트워크 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchCorrections();
    }
  }, [userType, userId]);

  // 필터링 로직
  useEffect(() => {
    let filtered = corrections;

    // 검색어 필터
    if (searchTerm) {
      filtered = filtered.filter(correction =>
        correction.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        correction.feedback.toLowerCase().includes(searchTerm.toLowerCase()) ||
        correction.problemTitle.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 날짜 필터
    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      filtered = filtered.filter(correction => {
        const correctionDate = new Date(correction.date);
        return correctionDate.toDateString() === filterDate.toDateString();
      });
    }

    // 이름 필터
    if (nameFilter) {
      filtered = filtered.filter(correction => {
        const opponentName = userType === 'student' 
          ? correction.teacherName 
          : correction.studentName;
        return opponentName?.toLowerCase().includes(nameFilter.toLowerCase());
      });
    }

    setFilteredCorrections(filtered);
    setCurrentPage(1); // 필터 변경 시 첫 페이지로 이동
  }, [corrections, searchTerm, dateFilter, nameFilter, userType]);

  // 페이징 계산
  const totalPages = Math.ceil(filteredCorrections.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCorrections = filteredCorrections.slice(startIndex, endIndex);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleShowFullFeedback = (correction: CorrectionItem) => {
    setSelectedCorrection(correction);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCorrection(null);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDateFilter('');
    setNameFilter('');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">첨삭 히스토리를 불러오는 중...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800 font-medium">오류</p>
        <p className="text-red-600 text-sm mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 검색 및 필터 섹션 */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* 검색어 */}
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              검색
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="제목, 내용, 문제명으로 검색"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 날짜 필터 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              날짜
            </label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 이름 필터 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {userType === 'student' ? '선생님' : '학생'} 이름
            </label>
            <input
              type="text"
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              placeholder={`${userType === 'student' ? '선생님' : '학생'} 이름으로 검색`}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 필터 초기화 */}
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors text-sm"
            >
              필터 초기화
            </button>
          </div>
        </div>

        {/* 결과 개수 표시 */}
        <div className="mt-4 text-sm text-gray-600">
          총 {filteredCorrections.length}개의 첨삭을 찾았습니다.
        </div>
      </div>

      {filteredCorrections.length === 0 ? (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-gray-600 text-center">검색 조건에 맞는 첨삭이 없습니다.</p>
        </div>
      ) : (
        <>
          {/* 테이블 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* 데스크톱 테이블 */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                      제목
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                      첨삭 내용
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                      {userType === 'student' ? '선생님' : '학생'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                      날짜
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentCorrections.map((correction) => (
                    <tr key={correction.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {correction.title}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {correction.problemTitle}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs">
                          {correction.feedbackPreview}
                        </div>
                        {correction.feedback.length > 100 && (
                          <button 
                            className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                            onClick={() => handleShowFullFeedback(correction)}
                          >
                            더보기
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {userType === 'student' ? correction.teacherName : correction.studentName}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {userType === 'student' ? correction.teacherEmail : correction.studentEmail}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(correction.date)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 모바일 카드 뷰 */}
            <div className="md:hidden">
              {currentCorrections.map((correction) => (
                <div key={correction.id} className="p-4 border-b border-gray-200 last:border-b-0">
                  <div className="space-y-3">
                    {/* 제목 */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        {correction.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {correction.problemTitle}
                      </p>
                    </div>

                                         {/* 첨삭 내용 */}
                     <div>
                       <p className="text-sm text-gray-800 line-clamp-3 break-words">
                         {correction.feedbackPreview}
                       </p>
                       {correction.feedback.length > 100 && (
                         <button 
                           className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                           onClick={() => handleShowFullFeedback(correction)}
                         >
                           더보기
                         </button>
                       )}
                     </div>

                    {/* 상대방 정보 */}
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {userType === 'student' ? correction.teacherName : correction.studentName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {userType === 'student' ? correction.teacherEmail : correction.studentEmail}
                        </p>
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(correction.date)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 페이징 */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-2">
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  이전
                </button>
                
                {/* 페이지 번호 (모바일에서는 일부만 표시) */}
                <div className="hidden sm:flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 text-sm rounded-md ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                
                {/* 모바일 페이지 표시 */}
                <div className="sm:hidden flex items-center space-x-1">
                  <span className="px-3 py-2 text-sm text-gray-600">
                    {currentPage} / {totalPages}
                  </span>
                </div>
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  다음
                </button>
              </div>
              
              {/* 페이지 정보 */}
              <div className="text-sm text-gray-600">
                {startIndex + 1}-{Math.min(endIndex, filteredCorrections.length)} / {filteredCorrections.length}
              </div>
            </div>
          )}
        </>
      )}

      {/* 모달 */}
      {selectedCorrection && (
        <FeedbackModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          feedback={selectedCorrection.feedback}
          title={selectedCorrection.title}
          opponentName={userType === 'student' 
            ? selectedCorrection.teacherName || '알 수 없는 선생님'
            : selectedCorrection.studentName || '알 수 없는 학생'
          }
          date={selectedCorrection.date}
        />
      )}
    </div>
  );
} 