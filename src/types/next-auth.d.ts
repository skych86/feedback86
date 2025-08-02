import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: 'student' | 'teacher';
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: 'student' | 'teacher';
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: 'student' | 'teacher';
  }
} 