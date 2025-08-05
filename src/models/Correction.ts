import mongoose, { Schema, Document } from 'mongoose';

export interface ICorrection extends Document {
  studentId: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  answerId: mongoose.Types.ObjectId;
  feedback: string;
  createdAt: Date;
}

const CorrectionSchema = new Schema<ICorrection>({
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  teacherId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  answerId: {
    type: Schema.Types.ObjectId,
    ref: 'Submission',
    required: true,
    index: true
  },
  feedback: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// 복합 인덱스 생성
CorrectionSchema.index({ studentId: 1, answerId: 1 });
CorrectionSchema.index({ teacherId: 1, createdAt: -1 });

// 가상 필드 추가 (선택사항)
CorrectionSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// JSON 변환 시 가상 필드 포함
CorrectionSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

// 모델이 이미 존재하는지 확인하고, 없으면 생성
const Correction = mongoose.models.Correction || mongoose.model<ICorrection>('Correction', CorrectionSchema);

export default Correction; 