import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import clientPromise from '@/lib/db';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: '관리자만 접근할 수 있습니다.' },
        { status: 403 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // URL 파라미터에서 페이지네이션 정보 가져오기
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const teacherId = searchParams.get('teacherId');
    const studentId = searchParams.get('studentId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // 필터 조건 구성
    let filter: any = {};
    
    if (teacherId) {
      filter.teacherId = new ObjectId(teacherId);
    }
    
    if (studentId) {
      filter.studentId = new ObjectId(studentId);
    }
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate + 'T23:59:59.999Z');
      }
    }

    // 총 개수 조회
    const totalCount = await db.collection('corrections').countDocuments(filter);

    // 첨삭 내역 조회
    const corrections = await db.collection('corrections')
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    // 사용자 정보와 함께 반환
    const correctionsWithDetails = await Promise.all(
      corrections.map(async (correction) => {
        const teacher = await db.collection('users').findOne({
          _id: correction.teacherId
        });

        const student = await db.collection('users').findOne({
          _id: correction.studentId
        });

        const submission = await db.collection('submissions').findOne({
          _id: correction.submissionId
        });

        const problem = submission ? await db.collection('essayProblems').findOne({
          _id: submission.problemId
        }) : null;

        return {
          ...correction,
          teacher: teacher ? {
            name: teacher.name,
            email: teacher.email
          } : null,
          student: student ? {
            name: student.name,
            email: student.email
          } : null,
          submission: submission ? {
            content: submission.content.substring(0, 100) + '...',
            submittedAt: submission.submittedAt
          } : null,
          problem: problem ? {
            title: problem.title,
            price: problem.price
          } : null
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: correctionsWithDetails,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        limit
      }
    });
  } catch (error) {
    console.error('Admin corrections fetch error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 