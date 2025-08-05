import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/db';

export async function checkPaymentStatus(answerId: string): Promise<{ isPaid: boolean; error?: string }> {
  try {
    // ObjectId 검증
    if (!ObjectId.isValid(answerId)) {
      return { isPaid: false, error: '잘못된 답안 ID 형식입니다.' };
    }

    const client = await clientPromise;
    const db = client.db();

    // Payment에서 해당 answerId의 paid 상태 확인
    const payment = await db.collection('payments').findOne({
      answerId: new ObjectId(answerId),
      status: 'paid'
    });

    if (!payment) {
      return { isPaid: false, error: '해당 답안에 대한 결제가 완료되지 않았습니다.' };
    }

    return { isPaid: true };

  } catch (error) {
    console.error('Payment status check error:', error);
    return { isPaid: false, error: '결제 상태 확인 중 오류가 발생했습니다.' };
  }
}

export async function paymentMiddleware(request: NextRequest, answerId: string) {
  const paymentCheck = await checkPaymentStatus(answerId);
  
  if (!paymentCheck.isPaid) {
    return NextResponse.json({
      success: false,
      error: paymentCheck.error || '결제가 완료되지 않았습니다.'
    }, { status: 403 });
  }

  return null; // 결제가 완료된 경우 null 반환 (미들웨어 통과)
} 