import nodemailer from 'nodemailer';

// 이메일 전송 설정 (실제 구현에서는 환경변수 사용)
const transporter = nodemailer.createTransporter({
  service: 'gmail', // 또는 다른 이메일 서비스
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password',
  },
});

export interface EmailData {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async (emailData: EmailData) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error };
  }
};

// 첨삭 완료 이메일 템플릿
export const sendCorrectionCompletedEmail = async (
  studentEmail: string,
  studentName: string,
  problemTitle: string,
  score: number,
  feedback: string
) => {
  const subject = '🎉 첨삭이 완료되었습니다!';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #4F46E5; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">논술 첨삭 시스템</h1>
      </div>
      
      <div style="padding: 20px; background-color: #f9fafb;">
        <h2 style="color: #1F2937; margin-bottom: 20px;">안녕하세요, ${studentName}님!</h2>
        
        <p style="color: #374151; line-height: 1.6;">
          제출하신 답안의 첨삭이 완료되었습니다. 
          아래 정보를 확인해보세요.
        </p>
        
        <div style="background-color: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <h3 style="color: #1F2937; margin-top: 0;">📝 문제 정보</h3>
          <p style="color: #374151; margin: 10px 0;"><strong>문제:</strong> ${problemTitle}</p>
          
          <h3 style="color: #1F2937; margin-top: 20px;">📊 첨삭 결과</h3>
          <p style="color: #374151; margin: 10px 0;"><strong>점수:</strong> ${score}점</p>
          
          <h3 style="color: #1F2937; margin-top: 20px;">💬 선생님 피드백</h3>
          <p style="color: #374151; line-height: 1.6; background-color: #f3f4f6; padding: 15px; border-radius: 4px;">
            ${feedback}
          </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXTAUTH_URL}/student/submissions" 
             style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            첨삭 결과 확인하기
          </a>
        </div>
        
        <p style="color: #6B7280; font-size: 14px; text-align: center; margin-top: 30px;">
          더 궁금한 점이 있으시면 언제든 문의해주세요.
        </p>
      </div>
      
      <div style="background-color: #F3F4F6; padding: 20px; text-align: center; color: #6B7280; font-size: 12px;">
        <p>© 2024 논술 첨삭 시스템. All rights reserved.</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: studentEmail,
    subject,
    html,
  });
};

// 새 문제 등록 알림 이메일 템플릿
export const sendNewProblemEmail = async (
  studentEmail: string,
  studentName: string,
  problemTitle: string,
  dueDate: string
) => {
  const subject = '📚 새로운 논술 문제가 등록되었습니다!';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #059669; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">논술 첨삭 시스템</h1>
      </div>
      
      <div style="padding: 20px; background-color: #f9fafb;">
        <h2 style="color: #1F2937; margin-bottom: 20px;">안녕하세요, ${studentName}님!</h2>
        
        <p style="color: #374151; line-height: 1.6;">
          새로운 논술 문제가 등록되었습니다. 
          마감일을 확인하고 답안을 제출해보세요.
        </p>
        
        <div style="background-color: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <h3 style="color: #1F2937; margin-top: 0;">📝 문제 정보</h3>
          <p style="color: #374151; margin: 10px 0;"><strong>문제:</strong> ${problemTitle}</p>
          <p style="color: #374151; margin: 10px 0;"><strong>마감일:</strong> ${dueDate}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXTAUTH_URL}/student/submit" 
             style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            답안 제출하기
          </a>
        </div>
        
        <p style="color: #6B7280; font-size: 14px; text-align: center; margin-top: 30px;">
          궁금한 점이 있으시면 언제든 문의해주세요.
        </p>
      </div>
      
      <div style="background-color: #F3F4F6; padding: 20px; text-align: center; color: #6B7280; font-size: 12px;">
        <p>© 2024 논술 첨삭 시스템. All rights reserved.</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: studentEmail,
    subject,
    html,
  });
}; 