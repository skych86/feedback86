import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import clientPromise from '@/lib/db';
import { PDFAnnotation, PDFAnnotationLayer } from '@/types';

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
        { error: '선생님만 주석을 추가할 수 있습니다.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { submissionId, annotations } = body;

    if (!submissionId || !annotations) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
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

    // 주석 레이어 생성 또는 업데이트
    const annotationLayer: PDFAnnotationLayer = {
      submissionId,
      annotations: annotations.map((annotation: PDFAnnotation) => ({
        ...annotation,
        createdBy: session.user.id,
        createdAt: new Date(),
      })),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // 기존 주석 레이어가 있는지 확인
    const existingLayer = await db.collection('pdfAnnotations').findOne({
      submissionId
    });

    if (existingLayer) {
      // 기존 레이어 업데이트
      await db.collection('pdfAnnotations').updateOne(
        { submissionId },
        { 
          $set: { 
            annotations: annotationLayer.annotations,
            updatedAt: new Date(),
          }
        }
      );
    } else {
      // 새 레이어 생성
      await db.collection('pdfAnnotations').insertOne(annotationLayer);
    }

    return NextResponse.json(
      { 
        success: true, 
        message: '주석이 성공적으로 저장되었습니다.',
        data: annotationLayer
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Annotation save error:', error);
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

    const { searchParams } = new URL(request.url);
    const submissionId = searchParams.get('submissionId');

    if (!submissionId) {
      return NextResponse.json(
        { error: '제출 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // 주석 레이어 조회
    const annotationLayer = await db.collection('pdfAnnotations').findOne({
      submissionId
    });

    if (!annotationLayer) {
      return NextResponse.json(
        { 
          success: true, 
          data: { annotations: [] }
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { 
        success: true, 
        data: annotationLayer
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Annotation fetch error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 