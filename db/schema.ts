// Intentionally empty by default.
// Add Drizzle tables here when the site actually needs a database.
// See examples/d1/db/schema.ts for an opt-in example.
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const experiences = sqliteTable('experiences', {
 id: text('id').primaryKey(), owner: text('owner').notNull(), config: text('config').notNull(), updated: text('updated').notNull(),
});
export const experienceLinks = sqliteTable('experience_links', {
 experienceId: text('experience_id').primaryKey().references(()=>experiences.id,{onDelete:'cascade'}),
 slug: text('slug').notNull().unique(),
 enabled: integer('enabled',{mode:'boolean'}).notNull().default(false),
 requireLogin: integer('require_login',{mode:'boolean'}).notNull().default(true),
 username: text('username').notNull().default(''),
 passwordHash: text('password_hash'),
 revision: integer('revision').notNull().default(1),
});
export const viewerSessions = sqliteTable('viewer_sessions', {
 tokenHash: text('token_hash').primaryKey(),
 experienceId: text('experience_id').notNull().references(()=>experiences.id,{onDelete:'cascade'}),
 revision: integer('revision').notNull(),
 expires: integer('expires').notNull(),
});
export const viewerAttempts = sqliteTable('viewer_attempts', {
 key: text('key').primaryKey(), count: integer('count').notNull().default(0),
 started: integer('started').notNull(),
});
export const panelUsers = sqliteTable('panel_users', {
 id: text('id').primaryKey(), username: text('username').notNull().unique(),
 displayName: text('display_name').notNull(), passwordHash: text('password_hash').notNull(),
 role: text('role').notNull().default('member'),
 active: integer('active',{mode:'boolean'}).notNull().default(true),
 revision: integer('revision').notNull().default(1), created: text('created').notNull(),
});
export const panelSessions = sqliteTable('panel_sessions', {
 tokenHash: text('token_hash').primaryKey(), userId: text('user_id').notNull().references(()=>panelUsers.id,{onDelete:'cascade'}),
 revision: integer('revision').notNull(), expires: integer('expires').notNull(),
});
export const panelSetup = sqliteTable('panel_setup', {
 key: text('key').primaryKey(), completed: text('completed').notNull(),
});
