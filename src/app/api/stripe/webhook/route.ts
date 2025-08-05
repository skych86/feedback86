import { NextRequest, NextResponse } from 'next/server';
import { constructWebhookEvent } from '@/lib/stripe';
import { connectToDatabase } from '@/lib/db';
import { StripeWebhookEvent } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Stripe signature가 없습니다.' },
        { status: 400 }
      );
    }

    // 웹훅 이벤트 검증
    const event: StripeWebhookEvent = constructWebhookEvent(body, signature);

    // 데이터베이스 연결
    const { db } = await connectToDatabase();

    // 이벤트 타입에 따른 처리
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event, db);
        break;
      
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event, db);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event, db);
        break;
      
      default:
        console.log(`처리되지 않은 이벤트 타입: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('웹훅 처리 오류:', error);
    return NextResponse.json(
      { error: '웹훅 처리에 실패했습니다.' },
      { status: 400 }
    );
  }
}

// 체크아웃 세션 완료 처리
async function handleCheckoutSessionCompleted(event: StripeWebhookEvent, db: any) {
  const session = event.data.object;
  const paymentId = session.metadata?.paymentId;

  if (!paymentId) {
    console.error('Payment ID가 없습니다.');
    return;
  }

  // Payment 상태 업데이트
  await db.collection('payments').updateOne(
    { _id: paymentId },
    {
      $set: {
        status: 'paid',
        transactionId: session.payment_intent,
        updatedAt: new Date()
      }
    }
  );

  console.log(`결제 완료: ${paymentId}`);
}

// 결제 성공 처리
async function handlePaymentIntentSucceeded(event: StripeWebhookEvent, db: any) {
  const paymentIntent = event.data.object;
  const paymentId = paymentIntent.metadata?.paymentId;

  if (!paymentId) {
    console.error('Payment ID가 없습니다.');
    return;
  }

  // Payment 상태 업데이트
  await db.collection('payments').updateOne(
    { _id: paymentId },
    {
      $set: {
        status: 'paid',
        transactionId: paymentIntent.id,
        updatedAt: new Date()
      }
    }
  );

  console.log(`결제 성공: ${paymentId}`);
}

// 결제 실패 처리
async function handlePaymentIntentFailed(event: StripeWebhookEvent, db: any) {
  const paymentIntent = event.data.object;
  const paymentId = paymentIntent.metadata?.paymentId;

  if (!paymentId) {
    console.error('Payment ID가 없습니다.');
    return;
  }

  // Payment 상태 업데이트
  await db.collection('payments').updateOne(
    { _id: paymentId },
    {
      $set: {
        status: 'failed',
        transactionId: paymentIntent.id,
        updatedAt: new Date()
      }
    }
  );

  console.log(`결제 실패: ${paymentId}`);
} 