// types/next-auth.d.ts
import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string
      role: string
    }
  }

  interface User {
    id: string
    email: string
    name?: string
    role: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    email: string
    role: string
  }
}

// Add this to fix adapter user type
declare module "next-auth/adapters" {
    interface AdapterUser {
      id: string
      email: string
      emailVerified?: Date | null
      name?: string | null
      role: string
    }
  }