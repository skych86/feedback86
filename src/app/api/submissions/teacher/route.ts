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

    if (session.user.role !== 'teacher') {
      return NextResponse.json(
        { error: '선생님만 접근할 수 있습니다.' },
        { status: 403 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // 선생님이 출제한 문제들의 ID 목록 가져오기
    const teacherProblems = await db.collection('essayProblems')
      .find({ teacherId: session.user.id })
      .map(p => p._id.toString())
      .toArray();

    if (teacherProblems.length === 0) {
      return NextResponse.json(
        { 
          success: true, 
          data: []
        },
        { status: 200 }
      );
    }

    // 해당 문제들에 대한 제출 답안들 가져오기
    const submissions = await db.collection('submissions')
      .find({ problemId: { $in: teacherProblems } })
      .sort({ submittedAt: -1 })
      .toArray();

    // 문제 정보와 학생 정보와 함께 반환
    const submissionsWithDetails = await Promise.all(
      submissions.map(async (submission) => {
        const problem = await db.collection('essayProblems').findOne({
          _id: submission.problemId
        });
        
        const student = await db.collection('users').findOne({
          _id: submission.studentId
        });

        return {
          ...submission,
          problem: problem ? {
            title: problem.title,
            description: problem.description,
            dueDate: problem.dueDate,
            price: problem.price,
          } : null,
          student: student ? {
            name: student.name,
            email: student.email,
          } : null,
        };
      })
    );

    return NextResponse.json(
      { 
        success: true, 
        data: submissionsWithDetails
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Teacher submissions fetch error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 