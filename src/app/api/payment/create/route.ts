import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/db';
import { CreatePaymentRequest, ApiResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: CreatePaymentRequest = await request.json();
    const { studentId, answerId, amount, method } = body;

    // 필수 필드 검증
    if (!studentId || !answerId || !amount || !method) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '필수 필드가 누락되었습니다.'
      }, { status: 400 });
    }

    // ObjectId 검증
    if (!ObjectId.isValid(studentId) || !ObjectId.isValid(answerId)) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '잘못된 ID 형식입니다.'
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    // Payment 문서 생성
    const payment = {
      studentId: new ObjectId(studentId),
      answerId: new ObjectId(answerId),
      amount,
      status: 'pending' as const,
      method,
      transactionId: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('payments').insertOne(payment);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        paymentId: result.insertedId.toString(),
        ...payment,
        _id: result.insertedId
      },
      message: '결제가 성공적으로 생성되었습니다.'
    });

  } catch (error) {
    console.error('Payment creation error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: '결제 생성 중 오류가 발생했습니다.'
    }, { status: 500 });
  }
} 