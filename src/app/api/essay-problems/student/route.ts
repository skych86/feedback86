import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import clientPromise from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'student') {
      return NextResponse.json(
        { error: '학생만 접근할 수 있습니다.' },
        { status: 403 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // 활성화된 모든 논술 문제 조회
    const essayProblems = await db.collection('essayProblems')
      .find({ isActive: true })
      .sort({ createdAt: -1 })
      .toArray();

    // 학생이 이미 제출한 문제들 확인
    const studentSubmissions = await db.collection('submissions')
      .find({ studentId: session.user.id })
      .toArray();

    const submittedProblemIds = studentSubmissions.map(s => s.problemId);

    // 문제 목록에 제출 상태 추가
    const problemsWithSubmissionStatus = essayProblems.map(problem => ({
      ...problem,
      isSubmitted: submittedProblemIds.includes(problem._id.toString()),
      canSubmit: new Date() <= new Date(problem.dueDate),
    }));

    return NextResponse.json(
      { 
        success: true, 
        data: problemsWithSubmissionStatus
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Student essay problems fetch error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 