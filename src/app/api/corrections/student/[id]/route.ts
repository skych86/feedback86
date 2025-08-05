import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import clientPromise from '@/lib/db';
import { ObjectId } from 'mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const studentId = params.id;

    // ObjectId 검증
    if (!ObjectId.isValid(studentId)) {
      return NextResponse.json(
        { error: '잘못된 학생 ID 형식입니다.' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // 해당 학생의 첨삭 목록 조회
    const corrections = await db.collection('corrections')
      .find({ studentId: new ObjectId(studentId) })
      .sort({ createdAt: -1 })
      .toArray();

    // 첨삭 정보와 함께 상세 정보 조회
    const correctionsWithDetails = await Promise.all(
      corrections.map(async (correction) => {
        // 선생님 정보 조회
        const teacher = await db.collection('users').findOne({
          _id: correction.teacherId
        });

        // 답안 정보 조회
        const submission = await db.collection('submissions').findOne({
          _id: correction.answerId
        });

        // 문제 정보 조회
        const problem = submission ? await db.collection('essayProblems').findOne({
          _id: submission.problemId
        }) : null;

        return {
          id: correction._id.toString(),
          title: problem?.title || '알 수 없는 문제',
          feedback: correction.feedback,
          feedbackPreview: correction.feedback.substring(0, 100) + (correction.feedback.length > 100 ? '...' : ''),
          date: correction.createdAt,
          teacherName: teacher?.name || '알 수 없는 선생님',
          teacherEmail: teacher?.email || '',
          submissionContent: submission?.content || '',
          problemTitle: problem?.title || ''
        };
      })
    );

    return NextResponse.json(
      { 
        success: true, 
        data: correctionsWithDetails
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Student corrections fetch error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 