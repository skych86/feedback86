import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import Correction from '@/models/Correction';
import User from '@/models/User';
import Submission from '@/models/Submission';

export async function POST(request: NextRequest) {
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
        { error: '선생님만 첨삭을 작성할 수 있습니다.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { studentId, answerId, feedback } = body;

    // 입력 검증
    if (!studentId || !answerId || !feedback) {
      return NextResponse.json(
        { error: '모든 필드를 입력해주세요.' },
        { status: 400 }
      );
    }

    await dbConnect();

    // 학생 존재 확인
    const student = await User.findById(studentId);
    if (!student) {
      return NextResponse.json(
        { error: '존재하지 않는 학생입니다.' },
        { status: 404 }
      );
    }

    // 답안 존재 확인
    const submission = await Submission.findById(answerId);
    if (!submission) {
      return NextResponse.json(
        { error: '존재하지 않는 답안입니다.' },
        { status: 404 }
      );
    }

    // 이미 첨삭이 있는지 확인
    const existingCorrection = await Correction.findOne({
      studentId,
      answerId
    });

    if (existingCorrection) {
      return NextResponse.json(
        { error: '이미 첨삭이 작성된 답안입니다.' },
        { status: 400 }
      );
    }

    // 첨삭 생성
    const correction = new Correction({
      studentId,
      teacherId: session.user.id,
      answerId,
      feedback,
      createdAt: new Date()
    });

    await correction.save();

    return NextResponse.json(
      { 
        success: true, 
        message: '첨삭이 성공적으로 작성되었습니다.',
        data: {
          id: correction.id,
          studentId: correction.studentId,
          teacherId: correction.teacherId,
          answerId: correction.answerId,
          feedback: correction.feedback,
          createdAt: correction.createdAt
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Correction creation error:', error);
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

    await dbConnect();

    // 역할에 따라 다른 쿼리
    let query = {};
    if (session.user.role === 'teacher') {
      query = { teacherId: session.user.id };
    } else if (session.user.role === 'student') {
      query = { studentId: session.user.id };
    }

    const corrections = await Correction.find(query)
      .populate('studentId', 'name email')
      .populate('teacherId', 'name email')
      .populate('answerId', 'content submittedAt status')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(
      { 
        success: true, 
        data: corrections
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Corrections fetch error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 