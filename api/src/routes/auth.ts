import { Router } from 'express'
import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import type { Response } from 'express'
import { comparePassword, hashPassword, randomColor, signToken } from '../lib/auth.js'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'

export const authRouter = Router()

function setAuthCookie(res: Response, token: string) {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  })
}

const googleClientId = process.env.GOOGLE_CLIENT_ID
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET
const googleEnabled = !!(googleClientId && googleClientSecret)

if (googleEnabled) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: googleClientId,
        clientSecret: googleClientSecret,
        callbackURL: '/api/auth/google/callback',
      },
      async (_accessToken, _refreshToken, profile, done) => {
        const googleId = profile.id
        const email = profile.emails?.[0]?.value
        const name = profile.displayName || email || 'Google User'
        try {
          let user = await prisma.user.findFirst({ where: { googleId } })
          if (!user) {
            user = await prisma.user.create({
              data: {
                email,
                name,
                googleId,
                color: randomColor(),
                isGuest: false,
              },
            })
          }
          done(null, user)
        } catch (err) {
          done(err as Error)
        }
      },
    ),
  )
}

authRouter.post('/register', async (req, res) => {
  const { email, password, name } = req.body as { email?: string; password?: string; name?: string }
  if (!email || !password || !name) {
    res.status(400).json({ error: 'Email, password, and name are required' })
    return
  }

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
  if (existing) {
    res.status(409).json({ error: 'Email already registered' })
    return
  }

  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      name,
      passwordHash: await hashPassword(password),
      color: randomColor(),
      isGuest: false,
    },
  })

  const token = signToken({ userId: user.id })
  setAuthCookie(res, token)
  res.json({ user: { id: user.id, email: user.email, name: user.name, color: user.color } })
})

authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string }
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' })
    return
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
  if (!user || !user.passwordHash) {
    res.status(401).json({ error: 'Invalid email or password' })
    return
  }

  const valid = await comparePassword(password, user.passwordHash)
  if (!valid) {
    res.status(401).json({ error: 'Invalid email or password' })
    return
  }

  const token = signToken({ userId: user.id })
  setAuthCookie(res, token)
  res.json({ user: { id: user.id, email: user.email, name: user.name, color: user.color } })
})

authRouter.post('/guest', async (req, res) => {
  const { name } = req.body as { name?: string }
  const trimmed = name?.trim().slice(0, 24) || 'Pemain'
  const user = await prisma.user.create({
    data: {
      name: trimmed,
      color: randomColor(),
      isGuest: true,
    },
  })

  const token = signToken({ userId: user.id })
  setAuthCookie(res, token)
  res.json({ user: { id: user.id, name: user.name, color: user.color } })
})

authRouter.post('/logout', (_req, res) => {
  res.clearCookie('token')
  res.json({ ok: true })
})

authRouter.get('/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId! },
    select: { id: true, email: true, name: true, color: true, isGuest: true },
  })
  if (!user) {
    res.status(401).json({ error: 'User not found' })
    return
  }
  res.json({ user })
})

if (googleEnabled) {
  authRouter.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }))

  authRouter.get(
    '/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/login' }),
    (req, res) => {
      const user = req.user as { id: string }
      const token = signToken({ userId: user.id })
      setAuthCookie(res, token)
      res.redirect(process.env.FRONTEND_URL || '/')
    },
  )
} else {
  authRouter.get('/google', (_req, res) => {
    res.status(503).json({ error: 'Google login is not configured' })
  })
  authRouter.get('/google/callback', (_req, res) => {
    res.status(503).json({ error: 'Google login is not configured' })
  })
}
