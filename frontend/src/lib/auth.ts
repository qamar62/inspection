import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { apiClient } from './api-client'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        try {
          // Use server-side API URL for Docker network, fallback to public URL
          const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
          
          console.log('Attempting login to:', `${apiUrl}/token/`)
          
          const response = await fetch(
            `${apiUrl}/token/`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                username: credentials.username,
                password: credentials.password,
              }),
            }
          )

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            console.error('Login failed:', response.status, errorData)
            return null
          }

          const tokens = await response.json()
          console.log('Tokens received, fetching user info...')

          // Get user info
          const userResponse = await fetch(
            `${apiUrl}/users/me/`,
            {
              headers: {
                Authorization: `Bearer ${tokens.access}`,
              },
            }
          )

          if (!userResponse.ok) {
            console.error('Failed to fetch user info:', userResponse.status)
            return null
          }

          const user = await userResponse.json()
          console.log('User authenticated:', user.username)

          return {
            id: user.id.toString(),
            name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username,
            email: user.email,
            role: user.role,
            accessToken: tokens.access,
            refreshToken: tokens.refresh,
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken
        token.refreshToken = user.refreshToken
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      session.user.accessToken = token.accessToken as string
      session.user.refreshToken = token.refreshToken as string
      session.user.role = token.role as string
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
}
