import { ObjectId } from 'mongodb';

// User Model (사용자)
export interface User {
  _id: ObjectId;
  email: string;
  password: string; // hashed
  name: string;
  role: 'student' | 'teacher';
  createdAt: Date;
  updatedAt: Date;
}

// Problem Model (문제)
export interface Problem {
  _id: ObjectId;
  title: string;
  content: string;
  subject: string; // 과목 (국어, 수학, 영어 등)
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit: number; // 분 단위
  teacherId: ObjectId; // 출제 교사
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// EssayProblem Model (논술 문제)
export interface EssayProblem {
  _id: ObjectId;
  title: string;
  description: string;
  dueDate: Date;
  pdfUrl?: string; // PDF 파일 URL
  price: number; // 가격 (원)
  teacherId: ObjectId; // 출제 교사
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Submission Model (답안 제출)
export interface Submission {
  _id: ObjectId;
  problemId: ObjectId;
  studentId: ObjectId;
  content: string;
  submittedAt: Date;
  status: 'submitted' | 'reviewing' | 'completed';
  score?: number;
  feedback?: string;
  reviewedBy?: ObjectId; // 첨삭 교사
  reviewedAt?: Date;
}

// Correction Model (첨삭)
export interface Correction {
  _id: ObjectId;
  submissionId: ObjectId;
  teacherId: ObjectId;
  content: string; // 첨삭 내용
  score: number;
  feedback: string;
  createdAt: Date;
  updatedAt: Date;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role: 'student' | 'teacher';
}

// Problem Types
export interface CreateProblemRequest {
  title: string;
  content: string;
  subject: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit: number;
}

// EssayProblem Types
export interface CreateEssayProblemRequest {
  title: string;
  description: string;
  dueDate: string; // ISO date string
  price: number;
  pdfFile?: File;
}

// Submission Types
export interface CreateSubmissionRequest {
  problemId: string;
  content: string;
}

// Correction Types
export interface CreateCorrectionRequest {
  submissionId: string;
  content: string;
  score: number;
  feedback: string;
  annotations?: PDFAnnotation[];
}

// PDF Annotation Types
export interface PDFAnnotation {
  id: string;
  type: 'highlight' | 'comment' | 'underline';
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  content?: string; // for comments
  createdAt: Date;
  createdBy: string; // teacher ID
}

export interface PDFAnnotationLayer {
  submissionId: string;
  annotations: PDFAnnotation[];
  createdAt: Date;
  updatedAt: Date;
}

// Notification Types
export interface Notification {
  _id: ObjectId;
  userId: ObjectId;
  type: 'correction_completed' | 'new_problem' | 'due_date_reminder';
  title: string;
  message: string;
  data?: {
    submissionId?: string;
    problemId?: string;
    correctionId?: string;
  };
  isRead: boolean;
  createdAt: Date;
}

export interface CreateNotificationRequest {
  userId: string;
  type: 'correction_completed' | 'new_problem' | 'due_date_reminder';
  title: string;
  message: string;
  data?: {
    submissionId?: string;
    problemId?: string;
    correctionId?: string;
  };
} 