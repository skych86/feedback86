import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import clientPromise from '@/lib/db';
import { CreateSubmissionRequest } from '@/types';

export async function POST(request: NextRequest) {
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
        { error: '학생만 답안을 제출할 수 있습니다.' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const problemId = formData.get('problemId') as string;
    const content = formData.get('content') as string;
    const pdfFile = formData.get('pdfFile') as File | null;

    // 입력 검증
    if (!problemId) {
      return NextResponse.json(
        { error: '문제를 선택해주세요.' },
        { status: 400 }
      );
    }

    if (!content && !pdfFile) {
      return NextResponse.json(
        { error: '답안을 작성하거나 PDF를 업로드해주세요.' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // 문제 존재 확인
    const problem = await db.collection('essayProblems').findOne({
      _id: problemId,
      isActive: true
    });

    if (!problem) {
      return NextResponse.json(
        { error: '존재하지 않는 문제입니다.' },
        { status: 404 }
      );
    }

    // 마감일 확인
    const now = new Date();
    const dueDate = new Date(problem.dueDate);
    if (now > dueDate) {
      return NextResponse.json(
        { error: '제출 마감일이 지났습니다.' },
        { status: 400 }
      );
    }

    // 이미 제출한 답안이 있는지 확인
    const existingSubmission = await db.collection('submissions').findOne({
      problemId,
      studentId: session.user.id,
    });

    if (existingSubmission) {
      return NextResponse.json(
        { error: '이미 이 문제에 답안을 제출했습니다.' },
        { status: 400 }
      );
    }

    // PDF 파일 처리
    let pdfUrl = null;
    if (pdfFile) {
      // 여기서는 간단히 파일명만 저장 (실제로는 S3, Cloudinary 등 사용)
      pdfUrl = `/uploads/submissions/${Date.now()}_${pdfFile.name}`;
    }

    // 답안 제출 생성
    const result = await db.collection('submissions').insertOne({
      problemId,
      studentId: session.user.id,
      content: content || '',
      pdfUrl,
      submittedAt: new Date(),
      status: 'submitted',
    });

    return NextResponse.json(
      { 
        success: true, 
        message: '답안이 성공적으로 제출되었습니다.',
        data: {
          id: result.insertedId.toString(),
          problemId,
          content: content || '',
          pdfUrl,
          submittedAt: new Date(),
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Submission error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // 역할에 따라 다른 쿼리
    let query = {};
    if (session.user.role === 'student') {
      query = { studentId: session.user.id };
    } else if (session.user.role === 'teacher') {
      // 선생님은 자신이 출제한 문제의 답안들을 볼 수 있음
      const teacherProblems = await db.collection('essayProblems')
        .find({ teacherId: session.user.id })
        .map(p => p._id.toString())
        .toArray();
      
      query = { problemId: { $in: teacherProblems } };
    }

    const submissions = await db.collection('submissions')
      .find(query)
      .sort({ submittedAt: -1 })
      .toArray();

    // 문제 정보와 함께 반환
    const submissionsWithProblems = await Promise.all(
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
        data: submissionsWithProblems
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Submissions fetch error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 