import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/db';
import { UpdatePaymentStatusRequest, ApiResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: UpdatePaymentStatusRequest = await request.json();
    const { paymentId, status, transactionId } = body;

    // 필수 필드 검증
    if (!paymentId || !status) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '필수 필드가 누락되었습니다.'
      }, { status: 400 });
    }

    // ObjectId 검증
    if (!ObjectId.isValid(paymentId)) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '잘못된 결제 ID 형식입니다.'
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    // 업데이트할 데이터 준비
    const updateData: any = {
      status,
      updatedAt: new Date()
    };

    if (transactionId) {
      updateData.transactionId = transactionId;
    }

    // Payment 문서 업데이트
    const result = await db.collection('payments').updateOne(
      { _id: new ObjectId(paymentId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '해당 결제를 찾을 수 없습니다.'
      }, { status: 404 });
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        paymentId,
        status,
        transactionId,
        updatedAt: updateData.updatedAt
      },
      message: '결제 상태가 성공적으로 업데이트되었습니다.'
    });

  } catch (error) {
    console.error('Payment status update error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: '결제 상태 업데이트 중 오류가 발생했습니다.'
    }, { status: 500 });
  }
} 