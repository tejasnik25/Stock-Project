import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { loginUser } from '@/db/dbService';

const adminUser = {
  id: 'admin123',
  name: 'Admin User',
  email: 'admin@example.com',
  password: '$2b$12$CNEH75BtbiEtjc76Kdvv6.67nJ/aF4uAEc5znGg3CN.lH3JN6nGXq',
  role: 'ADMIN',
};

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        isAdminLogin: { label: 'Is Admin Login', type: 'checkbox', optional: true },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        if (credentials.email === adminUser.email) {
          const passwordMatch = await bcrypt.compare(credentials.password, adminUser.password);
          if (passwordMatch) {
            return {
              id: adminUser.id,
              name: adminUser.name,
              email: adminUser.email,
              role: adminUser.role,
            } as unknown as { id: string; name: string; email: string; role: string };
          }
        }

        const result = await loginUser(credentials.email, credentials.password);
        if (!result.success || !result.user) {
          return null;
        }

        return {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: (result.user as unknown as { role?: string }).role || 'USER',
        } as { id: string; email: string; name: string; role: string };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        (token as unknown as { id: string }).id = (user as unknown as { id: string }).id;
        (token as unknown as { role: string }).role = (user as unknown as { role: string }).role;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if ((token as unknown as { id?: string; role?: string }) && session.user) {
        (session.user as unknown as { id?: string }).id = (token as unknown as { id?: string }).id as string;
        (session.user as unknown as { role?: string }).role = (token as unknown as { role?: string }).role as string;
        session.user.name = (token as unknown as { name?: string }).name as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    signOut: '/',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET || 'your-secret-key',
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
};