import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import { createPaymentSession } from '@/lib/stripe';
import { CreateStripePaymentRequest, StripePaymentSessionResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    // 세션 확인
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 요청 데이터 파싱
    const body: CreateStripePaymentRequest = await request.json();
    const { studentId, answerId, amount, successUrl, cancelUrl } = body;

    // 필수 필드 검증
    if (!studentId || !answerId || !amount || !successUrl || !cancelUrl) {
      return NextResponse.json(
        { success: false, error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 데이터베이스 연결
    const { db } = await connectToDatabase();

    // 기존 결제 확인 (중복 방지)
    const existingPayment = await db.collection('payments').findOne({
      studentId: studentId,
      answerId: answerId,
      status: { $in: ['pending', 'paid'] }
    });

    if (existingPayment) {
      return NextResponse.json(
        { success: false, error: '이미 결제가 진행 중이거나 완료된 답안입니다.' },
        { status: 400 }
      );
    }

    // Payment 문서 생성
    const payment = {
      studentId: studentId,
      answerId: answerId,
      amount: amount,
      status: 'pending' as const,
      method: 'stripe',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('payments').insertOne(payment);
    const paymentId = result.insertedId.toString();

    // Stripe 결제 세션 생성
    const session = await createPaymentSession(
      amount,
      paymentId,
      successUrl,
      cancelUrl
    );

    const response: StripePaymentSessionResponse = {
      success: true,
      data: {
        sessionId: session.id,
        paymentId: paymentId
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Stripe 세션 생성 오류:', error);
    return NextResponse.json(
      { success: false, error: '결제 세션 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
} 