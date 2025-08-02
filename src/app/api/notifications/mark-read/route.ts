import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import clientPromise from '@/lib/db';

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { notificationId } = body;

    if (!notificationId) {
      return NextResponse.json(
        { error: '알림 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // 알림 읽음 처리
    const result = await db.collection('notifications').updateOne(
      { 
        _id: notificationId,
        userId: session.user.id // 본인의 알림만 수정 가능
      },
      { 
        $set: { 
          isRead: true,
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: '알림을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        success: true, 
        message: '알림이 읽음 처리되었습니다.'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Mark notification read error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 