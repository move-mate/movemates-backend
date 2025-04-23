// lib/customPrismaAdapter.ts
import { PrismaClient } from "@prisma/client";
import type { Adapter } from "next-auth/adapters";

/**
 * Create a custom adapter from scratch without extending PrismaAdapter
 */
export function CustomPrismaAdapter(prisma: PrismaClient): Adapter {
  return {
    // User methods
    async createUser(data) {
      const { role = 'user', ...userData } = data;
      
      const user = await prisma.user.create({
        data: {
          ...userData,
          role,
        },
      });
      
      return {
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
        name: user.name || null,
        role: user.role,
      };
    },
    
    async getUser(id) {
      const user = await prisma.user.findUnique({
        where: { id },
      });
      
      if (!user) return null;
      
      return {
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
        name: user.name || null,
        role: user.role,
      };
    },
    
    async getUserByEmail(email) {
      const user = await prisma.user.findUnique({
        where: { email },
      });
      
      if (!user) return null;
      
      return {
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
        name: user.name || null,
        role: user.role,
      };
    },
    
    async getUserByAccount({ providerAccountId, provider }) {
      const account = await prisma.account.findUnique({
        where: {
          provider_providerAccountId: {
            provider,
            providerAccountId,
          },
        },
        include: { user: true },
      });
      
      if (!account) return null;
      
      return {
        id: account.user.id,
        email: account.user.email,
        emailVerified: account.user.emailVerified,
        name: account.user.name || null,
        role: account.user.role,
      };
    },
    
    async updateUser(userData) {
      const user = await prisma.user.update({
        where: { id: userData.id },
        data: userData,
      });
      
      return {
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
        name: user.name || null,
        role: user.role,
      };
    },
    
    async deleteUser(userId) {
      await prisma.user.delete({
        where: { id: userId },
      });
    },
    
    async linkAccount(accountData) {
      const account = await prisma.account.create({
        data: accountData,
      });
      return account;
    },
    
    async unlinkAccount({ providerAccountId, provider }) {
      await prisma.account.delete({
        where: {
          provider_providerAccountId: {
            provider,
            providerAccountId,
          },
        },
      });
    },
    
    // Session methods
    async createSession({ sessionToken, userId, expires }) {
      const session = await prisma.session.create({
        data: {
          sessionToken,
          userId,
          expires,
        },
      });
      
      return session;
    },
    
    async getSessionAndUser(sessionToken) {
      const sessionAndUser = await prisma.session.findUnique({
        where: { sessionToken },
        include: { user: true },
      });
      
      if (!sessionAndUser) return null;
      
      const { user, ...session } = sessionAndUser;
      
      return {
        session,
        user: {
          id: user.id,
          email: user.email,
          emailVerified: user.emailVerified,
          name: user.name || null,
          role: user.role,
        },
      };
    },
    
    async updateSession({ sessionToken, ...data }) {
      const session = await prisma.session.update({
        where: { sessionToken },
        data,
      });
      
      return session;
    },
    
    async deleteSession(sessionToken) {
      await prisma.session.delete({
        where: { sessionToken },
      });
    },
    
    // Verification Token methods
    async createVerificationToken(data) {
      const verificationToken = await prisma.verificationToken.create({
        data,
      });
      
      return verificationToken;
    },
    
    async useVerificationToken({ identifier, token }) {
      try {
        const verificationToken = await prisma.verificationToken.delete({
          where: {
            identifier_token: {
              identifier,
              token,
            },
          },
        });
        
        return verificationToken;
      } catch {
        return null;
      }
    },
  };
}