import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import clientPromise from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { submissionId } = body;

    if (!submissionId) {
      return NextResponse.json(
        { error: '제출 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // 제출 답안과 첨삭 정보 조회
    const submission = await db.collection('submissions').findOne({
      _id: submissionId
    });

    if (!submission) {
      return NextResponse.json(
        { error: '존재하지 않는 제출 답안입니다.' },
        { status: 404 }
      );
    }

    const correction = await db.collection('corrections').findOne({
      submissionId
    });

    if (!correction) {
      return NextResponse.json(
        { error: '첨삭 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // PDF 주석 레이어 조회
    const annotationLayer = await db.collection('pdfAnnotations').findOne({
      submissionId
    });

    // 문제 정보 조회
    const problem = await db.collection('essayProblems').findOne({
      _id: submission.problemId
    });

    const student = await db.collection('users').findOne({
      _id: submission.studentId
    });

    // PDF 생성 데이터 준비
    const pdfData = {
      submission: {
        content: submission.content,
        pdfUrl: submission.pdfUrl,
        submittedAt: submission.submittedAt,
      },
      correction: {
        content: correction.content,
        score: correction.score,
        feedback: correction.feedback,
        annotations: correction.annotations || [],
      },
      problem: problem ? {
        title: problem.title,
        description: problem.description,
      } : null,
      student: student ? {
        name: student.name,
        email: student.email,
      } : null,
      annotations: annotationLayer?.annotations || [],
    };

    // 실제 구현에서는 PDF.js나 다른 PDF 라이브러리를 사용하여 PDF 생성
    // 여기서는 PDF 생성 시뮬레이션
    const pdfUrl = `/api/corrections/export/${submissionId}/pdf`;

    return NextResponse.json(
      { 
        success: true, 
        message: 'PDF 내보내기가 완료되었습니다.',
        data: {
          pdfUrl,
          pdfData,
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('PDF export error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 