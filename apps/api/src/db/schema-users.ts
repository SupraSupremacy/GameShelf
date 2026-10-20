import { pgTable, text, boolean, timestamp } from 'drizzle-orm/pg-core'

/** Usuario de la app. En modo demo no hay contrasena real. */
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  displayName: text('display_name').notNull(),
  avatarColor: text('avatar_color').notNull(),
  isDemo: boolean('is_demo').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
