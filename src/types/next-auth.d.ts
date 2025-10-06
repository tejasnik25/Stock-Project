import { DefaultSession, DefaultUser } from 'next-auth';


declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
      walletBalance?: number;
      stockAnalysisAccess?: boolean;
      analysisCount?: number;
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    role: string;
    walletBalance?: number;
    stockAnalysisAccess?: boolean;
    analysisCount?: number;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
  }
}