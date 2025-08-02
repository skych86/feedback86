import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import clientPromise from '@/lib/db';
import { CreateNotificationRequest } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const body: CreateNotificationRequest = await request.json();
    const { userId, type, title, message, data } = body;

    if (!userId || !type || !title || !message) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // 알림 생성
    const result = await db.collection('notifications').insertOne({
      userId,
      type,
      title,
      message,
      data: data || {},
      isRead: false,
      createdAt: new Date(),
    });

    return NextResponse.json(
      { 
        success: true, 
        message: '알림이 성공적으로 생성되었습니다.',
        data: {
          id: result.insertedId.toString(),
          userId,
          type,
          title,
          message,
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Notification creation error:', error);
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
    const isRead = searchParams.get('isRead');
    const limit = parseInt(searchParams.get('limit') || '10');

    const client = await clientPromise;
    const db = client.db();

    // 사용자의 알림 조회
    let query: any = { userId: session.user.id };
    
    if (isRead !== null) {
      query.isRead = isRead === 'true';
    }

    const notifications = await db.collection('notifications')
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    return NextResponse.json(
      { 
        success: true, 
        data: notifications
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Notifications fetch error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 