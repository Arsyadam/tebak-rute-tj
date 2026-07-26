import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me'

export function hashPassword(password: string) {
  return bcrypt.hash(password, 10)
}

export function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}

export function signToken(payload: { userId: string }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET) as { userId: string }
}

export function randomColor() {
  const colors = ['#3b82f6', '#2563eb', '#0ea5e9', '#06b6d4', '#6366f1', '#8b5cf6', '#ef4444', '#f59e0b']
  return colors[Math.floor(Math.random() * colors.length)]!
}
