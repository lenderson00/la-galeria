import { cookies } from "next/headers"
import { db } from "./db"
import { users } from "./db/schema"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"

/**
 * Returns the currently logged-in user (or null).
 */
export async function getUser() {
  const cookieStore = cookies()
  const userId = cookieStore.get("userId")?.value
  if (!userId) return null

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  return user ?? null
}

/**
 * Verifies credentials and sets a signed cookie on success.
 */
export async function login(username: string, password: string) {
  const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1)
  if (!user) return null

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) return null

  const cookieStore = cookies()
  cookieStore.set("userId", user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
  })

  return user
}

/**
 * Clears the auth cookie.
 */
export async function logout() {
  const cookieStore = cookies()
  cookieStore.delete("userId")
}

export default getUser
