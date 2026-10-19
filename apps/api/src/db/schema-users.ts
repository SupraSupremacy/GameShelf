import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

/** Usuario de la app. En modo demo no hay contrasena real. */
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  displayName: text('display_name').notNull(),
  avatarColor: text('avatar_color').notNull(),
  isDemo: integer('is_demo', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})