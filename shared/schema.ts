import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users Table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  bio: text("bio").default("Exploring new opportunities and personal growth!"),
  personalityType: text("personality_type"),
  quizResults: jsonb("quiz_results"),
});

// Interests Table
export const interests = pgTable("interests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  category: text("category").notNull(),
  subcategories: text("subcategories"),
});

// Experiences Table
export const experiences = pgTable("experiences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  company: text("company").notNull(),
  period: text("period").notNull(),
  description: text("description"),
});

// Locations Table
export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // home, work, favorite
  address: text("address").notNull(),
});

// Financial Items Table
export const financialItems = pgTable("financial_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  category: text("category").notNull(),
  amount: integer("amount").notNull(),
  type: text("type").notNull(), // income, expense
});

// Messages Table
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").references(() => users.id).notNull(),
  recipientId: integer("recipient_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  timestamp: text("timestamp").notNull(),
  isRead: boolean("is_read").default(false),
});

// Notifications Table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  time: text("time").notNull(),
  isRead: boolean("is_read").default(false),
  type: text("type").notNull(), // message, reminder, update, alert
});

// Subscription Plans Table
export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  priceMonthly: integer("price_monthly").notNull(),
  priceYearly: integer("price_yearly").notNull(),
  features: jsonb("features").notNull(),
});

// User Subscriptions Table
export const userSubscriptions = pgTable("user_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  planId: integer("plan_id").references(() => subscriptionPlans.id).notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date"),
  isActive: boolean("is_active").default(true),
  billingPeriod: text("billing_period").notNull(), // monthly, yearly
});

// Schema validation for user creation
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Interest = typeof interests.$inferSelect;
export type Experience = typeof experiences.$inferSelect;
export type Location = typeof locations.$inferSelect;
export type FinancialItem = typeof financialItems.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type UserSubscription = typeof userSubscriptions.$inferSelect;
