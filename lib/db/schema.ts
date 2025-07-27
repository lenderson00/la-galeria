import { pgTable, text, timestamp, uuid, integer } from "drizzle-orm/pg-core"

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
})

export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  coverImageId: uuid("cover_image_id").references(() => images.id),
  createdAt: timestamp("created_at").defaultNow(),
})

export const images = pgTable("images", {
  id: uuid("id").defaultRandom().primaryKey(),
  url: text("url").notNull(),
  projectId: uuid("project_id")
    .references(() => projects.id)
    .notNull(),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
})

export type User = typeof users.$inferSelect
export type Project = typeof projects.$inferSelect
export type Image = typeof images.$inferSelect
