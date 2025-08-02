import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            논술 첨삭 시스템
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            원격 논술 첨삭 플랫폼으로 더 나은 논술 실력을 키워보세요
          </p>
          
          <div className="flex justify-center space-x-4 mb-12">
            <Link
              href="/login"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              로그인
            </Link>
            <Link
              href="/register"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg border border-blue-600 hover:bg-blue-50 transition-colors"
            >
              회원가입
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-blue-600 text-3xl mb-4">📝</div>
              <h3 className="text-lg font-semibold mb-2">문제 풀이</h3>
              <p className="text-gray-600">
                다양한 과목의 논술 문제를 풀어보고 실력을 향상시키세요
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-blue-600 text-3xl mb-4">✏️</div>
              <h3 className="text-lg font-semibold mb-2">전문 첨삭</h3>
              <p className="text-gray-600">
                경험 많은 선생님들의 전문적인 첨삭을 받아보세요
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-blue-600 text-3xl mb-4">📊</div>
              <h3 className="text-lg font-semibold mb-2">성과 분석</h3>
              <p className="text-gray-600">
                첨삭 결과를 통해 개선점을 파악하고 발전해보세요
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 