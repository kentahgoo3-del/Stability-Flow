import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum("user_role", ["admin", "analyst", "reviewer", "section_head", "manager"]);
export const studyTypeEnum = pgEnum("study_type", ["long_term", "accelerated", "intermediate", "stress", "photostability", "freeze_thaw"]);
export const studyStatusEnum = pgEnum("study_status", ["draft", "active", "on_hold", "completed", "discontinued"]);
export const timePointStatusEnum = pgEnum("time_point_status", ["pending", "due", "overdue", "in_progress", "completed", "cancelled"]);
export const sampleStatusEnum = pgEnum("sample_status", ["stored", "in_testing", "tested", "destroyed", "lost"]);
export const resultStatusEnum = pgEnum("result_status", ["pending", "entered", "oos_suspected", "oot_suspected", "passed", "failed", "voided"]);
export const investigationTypeEnum = pgEnum("investigation_type", ["oos", "oot", "critical_trend"]);
export const investigationStatusEnum = pgEnum("investigation_status", ["open", "phase1", "phase2", "closed", "invalidated"]);
export const chamberStatusEnum = pgEnum("chamber_status", ["operational", "excursion", "maintenance", "offline"]);
export const excursionStatusEnum = pgEnum("excursion_status", ["active", "resolved", "under_review"]);
export const auditActionEnum = pgEnum("audit_action", ["create", "update", "delete", "approve", "reject", "login", "logout"]);
export const priorityEnum = pgEnum("priority", ["low", "medium", "high", "critical"]);

// Users
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  role: userRoleEnum("role").notNull().default("analyst"),
  department: text("department"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Storage Conditions (25°C/60%RH, 40°C/75%RH, etc.)
export const storageConditions = pgTable("storage_conditions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  label: text("label").notNull(),
  temperature: real("temperature").notNull(),
  humidity: real("humidity"),
  description: text("description"),
  ichZone: text("ich_zone"),
});

// Chambers / Storage Units
export const chambers = pgTable("chambers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  conditionId: varchar("condition_id").references(() => storageConditions.id),
  location: text("location"),
  capacity: integer("capacity"),
  status: chamberStatusEnum("status").notNull().default("operational"),
  lastCalibratedAt: timestamp("last_calibrated_at"),
  nextCalibrationDue: timestamp("next_calibration_due"),
  notes: text("notes"),
});

// Products
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  strength: text("strength"),
  dosageForm: text("dosage_form"),
  manufacturer: text("manufacturer"),
  shelfLifeMonths: integer("shelf_life_months"),
  reorderPeriodMonths: integer("reorder_period_months"),
  active: boolean("active").notNull().default(true),
  notes: text("notes"),
});

// Test Specifications
export const testSpecifications = pgTable("test_specifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").references(() => products.id),
  testName: text("test_name").notNull(),
  methodNumber: text("method_number"),
  specificationNumber: text("specification_number"),
  unit: text("unit"),
  specMin: real("spec_min"),
  specMax: real("spec_max"),
  alertMin: real("alert_min"),
  alertMax: real("alert_max"),
  ootCriteriaPercent: real("oot_criteria_percent"),
  instrumentType: text("instrument_type"),
  category: text("category"),
});

// Stability Studies
export const stabilityStudies = pgTable("stability_studies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studyNumber: text("study_number").notNull().unique(),
  productId: varchar("product_id").references(() => products.id),
  batchNumber: text("batch_number").notNull(),
  studyType: studyTypeEnum("study_type").notNull(),
  status: studyStatusEnum("status").notNull().default("draft"),
  startDate: timestamp("start_date").notNull(),
  plannedEndDate: timestamp("planned_end_date"),
  conditionId: varchar("condition_id").references(() => storageConditions.id),
  chamberId: varchar("chamber_id").references(() => chambers.id),
  protocolNumber: text("protocol_number"),
  analystId: varchar("analyst_id").references(() => users.id),
  reviewerId: varchar("reviewer_id").references(() => users.id),
  initialQuantity: integer("initial_quantity"),
  containerType: text("container_type"),
  manufacturingDate: timestamp("manufacturing_date"),
  packedDate: timestamp("packed_date"),
  expiryDate: timestamp("expiry_date"),
  strength: text("strength"),
  dosageForm: text("dosage_form"),
  packageSize: text("package_size"),
  testPlan: text("test_plan"),
  intervalsMonthsCsv: text("intervals_months_csv"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Time Points (T0, T3, T6, T9, T12, T18, T24, T36...)
export const timePoints = pgTable("time_points", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studyId: varchar("study_id").references(() => stabilityStudies.id),
  intervalMonths: integer("interval_months").notNull(),
  label: text("label").notNull(),
  plannedDate: timestamp("planned_date").notNull(),
  actualDate: timestamp("actual_date"),
  status: timePointStatusEnum("status").notNull().default("pending"),
  priority: priorityEnum("priority").notNull().default("medium"),
  assignedAnalystId: varchar("assigned_analyst_id").references(() => users.id),
  notes: text("notes"),
  oosOotFlag: text("oos_oot_flag"), // 'OOS' | 'OOT' | null
  oosOotNote: text("oos_oot_note"),
  wasOverdue: boolean("was_overdue").default(false),
});

// Samples
export const samples = pgTable("samples", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studyId: varchar("study_id").references(() => stabilityStudies.id),
  timePointId: varchar("time_point_id").references(() => timePoints.id),
  chamberId: varchar("chamber_id").references(() => chambers.id),
  barcode: text("barcode").unique(),
  // Location tracking
  shelf: text("shelf"),
  position: text("position"),
  // Quantity tracking
  quantityPlaced: integer("quantity_placed"),
  quantityRemaining: integer("quantity_remaining"),
  quantityUsed: integer("quantity_used").default(0),
  quantityDestroyed: integer("quantity_destroyed").default(0),
  numberOfContainers: integer("number_of_containers"),
  quantityPerContainer: integer("quantity_per_container"),
  // Sample details
  manufacturingDate: timestamp("manufacturing_date"),
  expiryDate: timestamp("expiry_date"),
  orientationInChamber: text("orientation_in_chamber"),
  containerClosureSystem: text("container_closure_system"),
  // Status & workflow
  status: sampleStatusEnum("status").notNull().default("stored"),
  onHold: boolean("on_hold").default(false),
  holdReason: text("hold_reason"),
  placedAt: timestamp("placed_at"),
  pulledAt: timestamp("pulled_at"),
  pulledById: varchar("pulled_by_id").references(() => users.id),
  witnessId: varchar("witness_id").references(() => users.id),
  notes: text("notes"),
});

// Test Results
export const testResults = pgTable("test_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sampleId: varchar("sample_id").references(() => samples.id),
  testSpecId: varchar("test_spec_id").references(() => testSpecifications.id),
  studyId: varchar("study_id").references(() => stabilityStudies.id),
  timePointId: varchar("time_point_id").references(() => timePoints.id),
  analystId: varchar("analyst_id").references(() => users.id),
  value: real("value"),
  valueText: text("value_text"),
  status: resultStatusEnum("status").notNull().default("pending"),
  enteredAt: timestamp("entered_at"),
  reviewedAt: timestamp("reviewed_at"),
  reviewedById: varchar("reviewed_by_id").references(() => users.id),
  instrumentId: text("instrument_id"),
  notes: text("notes"),
  autoFlagged: boolean("auto_flagged").default(false),
  flagReason: text("flag_reason"),
});

// OOS/OOT Investigations
export const investigations = pgTable("investigations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  investigationNumber: text("investigation_number").notNull().unique(),
  type: investigationTypeEnum("type").notNull(),
  status: investigationStatusEnum("status").notNull().default("open"),
  resultId: varchar("result_id").references(() => testResults.id),
  studyId: varchar("study_id").references(() => stabilityStudies.id),
  productId: varchar("product_id").references(() => products.id),
  batchNumber: text("batch_number"),
  testName: text("test_name"),
  condition: text("condition"),
  timePoint: text("time_point"),
  value: real("value"),
  specLimit: text("spec_limit"),
  assignedToId: varchar("assigned_to_id").references(() => users.id),
  createdById: varchar("created_by_id").references(() => users.id),
  description: text("description"),
  phase1Conclusion: text("phase1_conclusion"),
  phase2Conclusion: text("phase2_conclusion"),
  rootCause: text("root_cause"),
  capaReference: text("capa_reference"),
  closedAt: timestamp("closed_at"),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chamber Excursions
export const chamberExcursions = pgTable("chamber_excursions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  excursionNumber: text("excursion_number").notNull().unique(),
  chamberId: varchar("chamber_id").references(() => chambers.id),
  status: excursionStatusEnum("status").notNull().default("active"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  minTemp: real("min_temp"),
  maxTemp: real("max_temp"),
  minHumidity: real("min_humidity"),
  maxHumidity: real("max_humidity"),
  affectedStudiesCount: integer("affected_studies_count").default(0),
  reportedById: varchar("reported_by_id").references(() => users.id),
  reviewedById: varchar("reviewed_by_id").references(() => users.id),
  impactAssessment: text("impact_assessment"),
  correctedAction: text("corrected_action"),
  placeSamplesOnHold: boolean("place_samples_on_hold").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Pull Test Completions — tracks which tests are ticked off per time point
export const pullTestCompletions = pgTable("pull_test_completions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  timePointId: varchar("time_point_id").notNull().references(() => timePoints.id, { onDelete: "cascade" }),
  testName: text("test_name").notNull(),
  completedByName: text("completed_by_name"),
  completedById: varchar("completed_by_id").references(() => users.id),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
  oosOotFlag: text("oos_oot_flag"), // 'OOS' | 'OOT' | null
  oosOotNote: text("oos_oot_note"),
});

// Monthly Sign-offs — Section Head and Manager review each month
export const monthlySignoffs = pgTable("monthly_signoffs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  periodYear: integer("period_year").notNull(),
  periodMonth: integer("period_month").notNull(),
  roleLabel: text("role_label").notNull(),
  signedByName: text("signed_by_name").notNull(),
  signedById: varchar("signed_by_id").references(() => users.id),
  signedAt: timestamp("signed_at").defaultNow().notNull(),
  comment: text("comment"),
});

// Monthly Report Notes — editable narrative sections per period
export const monthlyReportNotes = pgTable("monthly_report_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  periodYear: integer("period_year").notNull(),
  periodMonth: integer("period_month").notNull(),
  objective: text("objective"),
  scope: text("scope"),
  deviations: text("deviations"),
  discussion: text("discussion"),
  conclusion: text("conclusion"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Audit Logs
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  action: auditActionEnum("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: varchar("entity_id"),
  description: text("description").notNull(),
  oldValue: text("old_value"),
  newValue: text("new_value"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notifications
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull().default("info"),
  read: boolean("read").notNull().default(false),
  entityType: text("entity_type"),
  entityId: varchar("entity_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertStorageConditionSchema = createInsertSchema(storageConditions).omit({ id: true });
export const insertChamberSchema = createInsertSchema(chambers).omit({ id: true });
export const insertProductSchema = createInsertSchema(products).omit({ id: true });
export const insertTestSpecSchema = createInsertSchema(testSpecifications).omit({ id: true });
export const insertStudySchema = createInsertSchema(stabilityStudies).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTimePointSchema = createInsertSchema(timePoints).omit({ id: true });
export const insertSampleSchema = createInsertSchema(samples).omit({ id: true });
export const insertResultSchema = createInsertSchema(testResults).omit({ id: true });
export const insertInvestigationSchema = createInsertSchema(investigations).omit({ id: true, createdAt: true, updatedAt: true });
export const insertExcursionSchema = createInsertSchema(chamberExcursions).omit({ id: true, createdAt: true });
export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true, createdAt: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });
export const insertPullTestCompletionSchema = createInsertSchema(pullTestCompletions).omit({ id: true, completedAt: true });
export const insertMonthlySignoffSchema = createInsertSchema(monthlySignoffs).omit({ id: true, signedAt: true });

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type StorageCondition = typeof storageConditions.$inferSelect;
export type InsertStorageCondition = z.infer<typeof insertStorageConditionSchema>;
export type Chamber = typeof chambers.$inferSelect;
export type InsertChamber = z.infer<typeof insertChamberSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type TestSpecification = typeof testSpecifications.$inferSelect;
export type InsertTestSpec = z.infer<typeof insertTestSpecSchema>;
export type StabilityStudy = typeof stabilityStudies.$inferSelect;
export type InsertStudy = z.infer<typeof insertStudySchema>;
export type TimePoint = typeof timePoints.$inferSelect;
export type InsertTimePoint = z.infer<typeof insertTimePointSchema>;
export type Sample = typeof samples.$inferSelect;
export type InsertSample = z.infer<typeof insertSampleSchema>;
export type TestResult = typeof testResults.$inferSelect;
export type InsertResult = z.infer<typeof insertResultSchema>;
export type Investigation = typeof investigations.$inferSelect;
export type InsertInvestigation = z.infer<typeof insertInvestigationSchema>;
export type ChamberExcursion = typeof chamberExcursions.$inferSelect;
export type InsertExcursion = z.infer<typeof insertExcursionSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type PullTestCompletion = typeof pullTestCompletions.$inferSelect;
export type InsertPullTestCompletion = z.infer<typeof insertPullTestCompletionSchema>;
export type MonthlySignoff = typeof monthlySignoffs.$inferSelect;
export type InsertMonthlySignoff = z.infer<typeof insertMonthlySignoffSchema>;
export type MonthlyReportNotes = typeof monthlyReportNotes.$inferSelect;
