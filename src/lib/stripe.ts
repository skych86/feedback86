import Stripe from 'stripe';

// Stripe 인스턴스 생성
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// 결제 세션 생성
export async function createPaymentSession(
  amount: number,
  paymentId: string,
  successUrl: string,
  cancelUrl: string
) {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'krw',
            product_data: {
              name: '첨삭 서비스',
              description: '논술 문제 첨삭 서비스',
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        paymentId: paymentId,
      },
    });

    return session;
  } catch (error) {
    console.error('Stripe 세션 생성 오류:', error);
    throw error;
  }
}

// 웹훅 이벤트 검증
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
) {
  try {
    return stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.error('웹훅 검증 오류:', error);
    throw error;
  }
}

// 결제 상태 확인
export async function getPaymentStatus(paymentIntentId: string) {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent.status;
  } catch (error) {
    console.error('결제 상태 확인 오류:', error);
    throw error;
  }
} 