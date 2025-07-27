// Polyfill for edge environments that don’t provide Error.captureStackTrace
// Drizzle calls this internally.
if (typeof (Error as any).captureStackTrace !== "function") {
  ;(Error as any).captureStackTrace = () => {}
}

import { drizzle } from "drizzle-orm/neon-http"
import { neon } from "@neondatabase/serverless"
import * as schema from "./schema"

const sql = neon(process.env.DATABASE_URL!)
export const db = drizzle(sql, { schema })
