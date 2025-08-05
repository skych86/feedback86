import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import clientPromise from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: '관리자만 접근할 수 있습니다.' },
        { status: 403 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // URL 파라미터에서 기간 정보 가져오기
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month'; // month, week, year

    // 기간 계산
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // 월별 통계 계산
    const monthlyStats = await db.collection('payments').aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]).toArray();

    // 월별 첨삭 통계
    const monthlyCorrections = await db.collection('corrections').aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]).toArray();

    // 전체 통계
    const totalUsers = await db.collection('users').countDocuments();
    const totalStudents = await db.collection('users').countDocuments({ role: 'student' });
    const totalTeachers = await db.collection('users').countDocuments({ role: 'teacher' });
    const totalPayments = await db.collection('payments').countDocuments();
    const totalCorrections = await db.collection('corrections').countDocuments();
    const totalProblems = await db.collection('essayProblems').countDocuments();

    // 결제 상태별 통계
    const paymentStatusStats = await db.collection('payments').aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]).toArray();

    // 역할별 사용자 통계
    const roleStats = await db.collection('users').aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]).toArray();

    // 최근 활동 (최근 7일)
    const recentDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentPayments = await db.collection('payments').countDocuments({
      createdAt: { $gte: recentDate }
    });
    const recentCorrections = await db.collection('corrections').countDocuments({
      createdAt: { $gte: recentDate }
    });

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalStudents,
          totalTeachers,
          totalPayments,
          totalCorrections,
          totalProblems,
          recentPayments,
          recentCorrections
        },
        monthlyStats: monthlyStats.map(stat => ({
          period: `${stat._id.year}-${String(stat._id.month).padStart(2, '0')}`,
          payments: stat.count,
          amount: stat.totalAmount
        })),
        monthlyCorrections: monthlyCorrections.map(stat => ({
          period: `${stat._id.year}-${String(stat._id.month).padStart(2, '0')}`,
          corrections: stat.count
        })),
        paymentStatusStats,
        roleStats
      }
    });
  } catch (error) {
    console.error('Admin stats fetch error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 