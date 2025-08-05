import mongoose, { Schema, Document } from 'mongoose';

export interface ISubmission extends Document {
  problemId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  content: string;
  submittedAt: Date;
  status: 'submitted' | 'reviewing' | 'completed';
  score?: number;
  feedback?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
}

const SubmissionSchema = new Schema<ISubmission>({
  problemId: {
    type: Schema.Types.ObjectId,
    ref: 'EssayProblem',
    required: true,
    index: true
  },
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  submittedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  status: {
    type: String,
    enum: ['submitted', 'reviewing', 'completed'],
    default: 'submitted',
    index: true
  },
  score: {
    type: Number,
    min: 0,
    max: 100
  },
  feedback: {
    type: String,
    trim: true
  },
  reviewedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  }
});

// 복합 인덱스 생성
SubmissionSchema.index({ studentId: 1, status: 1 });
SubmissionSchema.index({ problemId: 1, submittedAt: -1 });

// 가상 필드 추가
SubmissionSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// JSON 변환 시 가상 필드 포함
SubmissionSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const Submission = mongoose.models.Submission || mongoose.model<ISubmission>('Submission', SubmissionSchema);

export default Submission; 