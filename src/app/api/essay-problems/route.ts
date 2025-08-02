import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import clientPromise from '@/lib/db';
import { CreateEssayProblemRequest } from '@/types';

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
        { error: '선생님만 문제를 업로드할 수 있습니다.' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const dueDate = formData.get('dueDate') as string;
    const price = parseInt(formData.get('price') as string);
    const pdfFile = formData.get('pdfFile') as File | null;

    // 입력 검증
    if (!title || !description || !dueDate || !price) {
      return NextResponse.json(
        { error: '모든 필드를 입력해주세요.' },
        { status: 400 }
      );
    }

    if (price < 0) {
      return NextResponse.json(
        { error: '가격은 0원 이상이어야 합니다.' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // PDF 파일 처리 (실제 구현에서는 클라우드 스토리지 사용)
    let pdfUrl = null;
    if (pdfFile) {
      // 여기서는 간단히 파일명만 저장 (실제로는 S3, Cloudinary 등 사용)
      pdfUrl = `/uploads/${Date.now()}_${pdfFile.name}`;
    }

    // 논술 문제 생성
    const result = await db.collection('essayProblems').insertOne({
      title,
      description,
      dueDate: new Date(dueDate),
      pdfUrl,
      price,
      teacherId: session.user.id,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json(
      { 
        success: true, 
        message: '논술 문제가 성공적으로 업로드되었습니다.',
        data: {
          id: result.insertedId.toString(),
          title,
          description,
          dueDate,
          price,
          pdfUrl,
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Essay problem upload error:', error);
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
    let query = { isActive: true };
    if (session.user.role === 'teacher') {
      query = { ...query, teacherId: session.user.id };
    }

    const essayProblems = await db.collection('essayProblems')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(
      { 
        success: true, 
        data: essayProblems
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Essay problems fetch error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 