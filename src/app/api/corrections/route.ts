import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import clientPromise from '@/lib/db';
import { CreateCorrectionRequest } from '@/types';
import { sendCorrectionCompletedEmail } from '@/lib/email';
import { paymentMiddleware } from '@/lib/paymentMiddleware';
import dbConnect from '@/lib/mongoose';
import Correction from '@/models/Correction';

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

    const body: CreateCorrectionRequest = await request.json();
    const { submissionId, content, score, feedback, annotations } = body;

    // 입력 검증
    if (!submissionId || !content || score === undefined || !feedback) {
      return NextResponse.json(
        { error: '모든 필드를 입력해주세요.' },
        { status: 400 }
      );
    }

    if (score < 0 || score > 100) {
      return NextResponse.json(
        { error: '점수는 0-100 사이여야 합니다.' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // 제출 답안 존재 확인
    const submission = await db.collection('submissions').findOne({
      _id: submissionId
    });

    if (!submission) {
      return NextResponse.json(
        { error: '존재하지 않는 제출 답안입니다.' },
        { status: 404 }
      );
    }

    // 결제 상태 확인
    const paymentCheck = await paymentMiddleware(request, submissionId);
    if (paymentCheck) {
      return paymentCheck;
    }

    // 이미 첨삭이 완료된 답안인지 확인
    if (submission.status === 'completed') {
      return NextResponse.json(
        { error: '이미 첨삭이 완료된 답안입니다.' },
        { status: 400 }
      );
    }

    // Mongoose 연결
    await dbConnect();

    // 기존 Correction 모델에서 중복 확인
    const existingCorrection = await Correction.findOne({
      studentId: submission.studentId,
      answerId: submissionId
    });

    if (existingCorrection) {
      return NextResponse.json(
        { error: '이미 해당 답안에 대한 첨삭이 존재합니다.' },
        { status: 409 }
      );
    }

    // 기존 MongoDB collection에 첨삭 생성
    const result = await db.collection('corrections').insertOne({
      submissionId,
      teacherId: session.user.id,
      content,
      score,
      feedback,
      annotations: annotations || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Mongoose Correction 모델에도 동시에 생성
    let mongooseCorrectionId = null;
    try {
      const mongooseCorrection = new Correction({
        studentId: submission.studentId,
        teacherId: session.user.id,
        answerId: submissionId,
        feedback: feedback,
        createdAt: new Date()
      });

      const savedCorrection = await mongooseCorrection.save();
      mongooseCorrectionId = savedCorrection._id.toString();
    } catch (mongooseError) {
      console.error('Mongoose Correction creation error:', mongooseError);
      
      // Mongoose 생성 실패 시 기존 MongoDB collection에서도 롤백
      await db.collection('corrections').deleteOne({ _id: result.insertedId });
      
      return NextResponse.json(
        { error: '첨삭 저장 중 오류가 발생했습니다. 다시 시도해주세요.' },
        { status: 500 }
      );
    }

    // 제출 답안 상태 업데이트
    await db.collection('submissions').updateOne(
      { _id: submissionId },
      { 
        $set: { 
          status: 'completed',
          score,
          feedback,
          reviewedBy: session.user.id,
          reviewedAt: new Date(),
        }
      }
    );

    // 학생 정보 조회
    const student = await db.collection('users').findOne({
      _id: submission.studentId
    });

    // 문제 정보 조회
    const problem = await db.collection('essayProblems').findOne({
      _id: submission.problemId
    });

    // 알림 생성
    if (student) {
      await db.collection('notifications').insertOne({
        userId: student._id,
        type: 'correction_completed',
        title: '첨삭이 완료되었습니다!',
        message: `${problem?.title || '논술 문제'}의 첨삭이 완료되었습니다. 점수: ${score}점`,
        data: {
          submissionId: submissionId,
          correctionId: result.insertedId.toString(),
        },
        isRead: false,
        createdAt: new Date(),
      });

      // 이메일 알림 전송 (비동기로 처리)
      if (student.email && problem) {
        sendCorrectionCompletedEmail(
          student.email,
          student.name,
          problem.title,
          score,
          feedback
        ).catch(error => {
          console.error('Email send error:', error);
        });
      }
    }

    return NextResponse.json(
      { 
        success: true, 
        message: '첨삭이 성공적으로 완료되었습니다.',
        data: {
          id: result.insertedId.toString(),
          mongooseCorrectionId: mongooseCorrectionId,
          submissionId,
          content,
          score,
          feedback,
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Correction error:', error);
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
    if (session.user.role === 'teacher') {
      query = { teacherId: session.user.id };
    }

    const corrections = await db.collection('corrections')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    // 제출 답안 정보와 함께 반환
    const correctionsWithDetails = await Promise.all(
      corrections.map(async (correction) => {
        const submission = await db.collection('submissions').findOne({
          _id: correction.submissionId
        });

        const problem = submission ? await db.collection('essayProblems').findOne({
          _id: submission.problemId
        }) : null;

        const student = submission ? await db.collection('users').findOne({
          _id: submission.studentId
        }) : null;

        return {
          ...correction,
          submission: submission ? {
            content: submission.content,
            pdfUrl: submission.pdfUrl,
            submittedAt: submission.submittedAt,
            status: submission.status,
          } : null,
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
        data: correctionsWithDetails
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