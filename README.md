# 논술 첨삭 시스템

원격 논술 첨삭 플랫폼으로, 학생과 선생님을 위한 온라인 논술 첨삭 서비스입니다.

## 주요 기능

- **학생 기능**
  - 문제 목록 조회 및 선택
  - 답안 작성 및 제출
  - 첨삭 결과 확인

- **선생님 기능**
  - 문제 출제 및 관리
  - 학생 답안 확인
  - 전문 첨삭 작성

## 기술 스택

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB
- **Authentication**: NextAuth.js
- **State Management**: Zustand

## 설치 및 실행

### 1. Node.js 설치

먼저 Node.js를 설치해야 합니다. [Node.js 공식 웹사이트](https://nodejs.org/)에서 LTS 버전을 다운로드하여 설치하세요.

### 2. 의존성 설치

```bash
npm install
```

### 3. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/essay-correction

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key-change-this-in-production

# JWT (if needed for additional functionality)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### 4. MongoDB 설정

MongoDB를 설치하고 실행하세요. 또는 MongoDB Atlas를 사용할 수 있습니다.

### 5. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 애플리케이션을 확인하세요.

## 인증 시스템

이 프로젝트는 NextAuth.js를 사용하여 사용자 인증을 구현합니다:

### 사용자 역할
- **학생 (student)**: 문제를 풀고 답안을 제출할 수 있습니다.
- **선생님 (teacher)**: 문제를 출제하고 학생들의 답안을 첨삭할 수 있습니다.

### 인증 플로우
1. **회원가입**: 사용자는 학생 또는 선생님으로 가입할 수 있습니다.
2. **로그인**: 이메일과 비밀번호로 로그인합니다.
3. **세션 관리**: NextAuth.js가 JWT 기반 세션을 관리합니다.
4. **역할 기반 접근**: 사용자의 역할에 따라 다른 대시보드로 리다이렉트됩니다.

### API 엔드포인트
- `POST /api/auth/register` - 회원가입
- `GET/POST /api/auth/[...nextauth]` - NextAuth.js 핸들러

## 프로젝트 구조

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 인증 관련 페이지
│   │   ├── login/         # 로그인 페이지
│   │   └── register/      # 회원가입 페이지
│   ├── (dashboard)/       # 대시보드 페이지
│   │   ├── dashboard/     # 메인 대시보드 (역할별 리다이렉트)
│   │   ├── student/       # 학생 대시보드
│   │   └── teacher/       # 선생님 대시보드
│   ├── api/               # API 라우트
│   │   ├── auth/          # 인증 API
│   │   │   ├── register/  # 회원가입 API
│   │   │   └── [...nextauth]/ # NextAuth.js 핸들러
│   │   ├── problems/      # 문제 관리 API
│   │   ├── submissions/   # 답안 제출 API
│   │   └── corrections/   # 첨삭 API
│   └── globals.css        # 글로벌 스타일
├── components/             # React 컴포넌트
│   ├── providers/         # Context Providers
│   │   └── SessionProvider.tsx # NextAuth SessionProvider
│   ├── ui/                # UI 컴포넌트
│   ├── auth/              # 인증 컴포넌트
│   ├── student/           # 학생 관련 컴포넌트
│   └── teacher/           # 선생님 관련 컴포넌트
├── lib/                   # 유틸리티 함수
│   ├── db.ts             # 데이터베이스 연결
│   └── auth.ts           # NextAuth 설정
└── types/                 # TypeScript 타입 정의
    ├── index.ts          # 데이터베이스 모델 타입
    └── next-auth.d.ts   # NextAuth 타입 확장
```

## 데이터베이스 모델

### User (사용자)
- 학생과 선생님의 계정 정보
- 이메일, 비밀번호, 이름, 역할 (student/teacher)

### Problem (문제)
- 선생님이 출제하는 논술 문제
- 제목, 내용, 과목, 난이도, 시간 제한

### EssayProblem (논술 문제)
- 선생님이 업로드하는 논술 문제
- 제목, 설명, 마감일, PDF 파일, 가격

### Submission (답안 제출)
- 학생이 제출한 답안
- 문제 ID, 학생 ID, 내용, 제출 시간, 상태

### Correction (첨삭)
- 선생님이 작성한 첨삭
- 제출 ID, 선생님 ID, 첨삭 내용, 점수, 피드백

### Notification (알림)
- 사용자별 알림 정보
- 알림 타입, 제목, 메시지, 읽음 상태

## API 엔드포인트

### 인증
- `POST /api/auth/register` - 회원가입
- `GET/POST /api/auth/[...nextauth]` - NextAuth.js 핸들러

### 문제 관리
- `GET /api/problems` - 문제 목록 조회
- `POST /api/problems` - 문제 생성 (교사만)
- `GET /api/problems/[id]` - 문제 상세 조회
- `PUT /api/problems/[id]` - 문제 수정 (교사만)
- `DELETE /api/problems/[id]` - 문제 삭제 (교사만)

### 논술 문제 관리
- `GET /api/essay-problems` - 논술 문제 목록 조회
- `POST /api/essay-problems` - 논술 문제 업로드 (교사만)

### 답안 제출
- `GET /api/submissions` - 제출 목록 조회 (역할별 필터링)
- `POST /api/submissions` - 답안 제출 (학생만)
- `GET /api/submissions/[id]` - 제출 상세 조회

### 학생용 문제 목록
- `GET /api/essay-problems/student` - 학생용 논술 문제 목록 (제출 상태 포함)

### 첨삭
- `GET /api/corrections` - 첨삭 목록 조회 (역할별 필터링)
- `POST /api/corrections` - 첨삭 작성 (선생님만)
- `GET /api/corrections/[id]` - 첨삭 상세 조회
- `PUT /api/corrections/[id]` - 첨삭 수정

### 선생님용 답안 목록
- `GET /api/submissions/teacher` - 선생님이 첨삭할 답안 목록

### PDF 주석 관리
- `GET /api/annotations` - PDF 주석 조회
- `POST /api/annotations` - PDF 주석 저장

### PDF 내보내기
- `POST /api/corrections/export` - 첨삭된 PDF 내보내기

### 알림 관리
- `GET /api/notifications` - 사용자 알림 조회
- `POST /api/notifications` - 알림 생성
- `PUT /api/notifications/mark-read` - 알림 읽음 처리

## 개발 가이드

### 새로운 컴포넌트 추가
1. `src/components/` 하위에 적절한 폴더에 컴포넌트 생성
2. TypeScript 타입 정의 추가
3. 필요한 경우 스토리북 스토리 작성

### 새로운 API 엔드포인트 추가
1. `src/app/api/` 하위에 적절한 폴더에 라우트 파일 생성
2. HTTP 메서드에 따른 핸들러 함수 작성
3. 데이터베이스 연동 및 에러 처리

### 데이터베이스 스키마 변경
1. `src/types/index.ts`에서 타입 정의 수정
2. 관련 API 엔드포인트 업데이트
3. 프론트엔드 컴포넌트 수정

### 인증 관련 개발
1. `src/lib/auth.ts`에서 NextAuth 설정 수정
2. `src/types/next-auth.d.ts`에서 타입 확장
3. 세션 기반 접근 제어 구현

## 배포

### Vercel 배포
1. GitHub에 코드 푸시
2. Vercel에서 프로젝트 연결
3. 환경 변수 설정
4. MongoDB Atlas 연결

### 환경 변수 설정 (배포 시)
- `MONGODB_URI`: MongoDB 연결 문자열
- `NEXTAUTH_URL`: 배포된 도메인 URL
- `NEXTAUTH_SECRET`: NextAuth 시크릿 키
- `JWT_SECRET`: JWT 시크릿 키 (추가 기능용)
- `EMAIL_USER`: 이메일 전송용 계정
- `EMAIL_PASS`: 이메일 전송용 앱 비밀번호

## 라이선스

MIT License 