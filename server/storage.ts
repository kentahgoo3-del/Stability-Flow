import { 
  users, products, storageConditions, chambers, testSpecifications,
  stabilityStudies, timePoints, samples, testResults, investigations,
  chamberExcursions, auditLogs, notifications, pullTestCompletions, monthlySignoffs, monthlyReportNotes,
  type User, type InsertUser, type Product, type InsertProduct,
  type StorageCondition, type InsertStorageCondition, type Chamber, type InsertChamber,
  type TestSpecification, type InsertTestSpec, type StabilityStudy, type InsertStudy,
  type TimePoint, type InsertTimePoint, type Sample, type InsertSample,
  type TestResult, type InsertResult, type Investigation, type InsertInvestigation,
  type ChamberExcursion, type InsertExcursion, type AuditLog, type InsertAuditLog,
  type Notification, type InsertNotification
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, and, or, gte, lte, lt, gt, inArray, sql, ne, like } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User>;
  deleteUser(id: string): Promise<void>;
  listUsers(): Promise<User[]>;

  // Storage Conditions
  listStorageConditions(): Promise<StorageCondition[]>;
  createStorageCondition(data: InsertStorageCondition): Promise<StorageCondition>;
  updateStorageCondition(id: string, data: Partial<InsertStorageCondition>): Promise<StorageCondition>;
  deleteStorageCondition(id: string): Promise<void>;

  // Chambers
  listChambers(): Promise<Chamber[]>;
  getChamber(id: string): Promise<Chamber | undefined>;
  createChamber(data: InsertChamber): Promise<Chamber>;
  updateChamber(id: string, data: Partial<InsertChamber>): Promise<Chamber>;
  deleteChamber(id: string): Promise<void>;

  // Products
  listProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(data: InsertProduct): Promise<Product>;
  updateProduct(id: string, data: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: string): Promise<void>;

  // Test Specifications
  listTestSpecifications(productId?: string): Promise<TestSpecification[]>;
  createTestSpecification(data: InsertTestSpec): Promise<TestSpecification>;
  updateTestSpecification(id: string, data: Partial<InsertTestSpec>): Promise<TestSpecification>;
  deleteTestSpecification(id: string): Promise<void>;

  // Stability Studies
  listStudies(): Promise<StabilityStudy[]>;
  getStudy(id: string): Promise<StabilityStudy | undefined>;
  createStudy(data: InsertStudy): Promise<StabilityStudy>;
  updateStudy(id: string, data: Partial<InsertStudy>): Promise<StabilityStudy>;
  deleteStudy(id: string): Promise<void>;

  // Time Points
  listTimePoints(studyId?: string): Promise<TimePoint[]>;
  getTimePoint(id: string): Promise<TimePoint | undefined>;
  createTimePoint(data: InsertTimePoint): Promise<TimePoint>;
  updateTimePoint(id: string, data: Partial<InsertTimePoint>): Promise<TimePoint>;
  deleteTimePoint(id: string): Promise<void>;
  getUpcomingPulls(daysAhead?: number): Promise<TimePoint[]>;
  getOverduePulls(): Promise<TimePoint[]>;

  // Samples
  listSamples(studyId?: string): Promise<Sample[]>;
  getSamplesView(): Promise<any[]>;
  getSample(id: string): Promise<Sample | undefined>;
  createSample(data: InsertSample): Promise<Sample>;
  updateSample(id: string, data: Partial<InsertSample>): Promise<Sample>;
  deleteSample(id: string): Promise<void>;
  bulkCreateProducts(data: any[]): Promise<number>;
  bulkCreateTestSpecs(data: any[]): Promise<number>;
  bulkCreateStudies(data: any[]): Promise<number>;
  bulkCreateSamples(data: any[]): Promise<number>;
  importMasterData(rows: any[]): Promise<{ created: number; updated: number; skipped: number; errors: string[] }>;

  // Test Results
  listResults(studyId?: string, timePointId?: string): Promise<TestResult[]>;
  getResult(id: string): Promise<TestResult | undefined>;
  createResult(data: InsertResult): Promise<TestResult>;
  updateResult(id: string, data: Partial<InsertResult>): Promise<TestResult>;
  evaluateResult(id: string): Promise<{ status: string; flagged: boolean; flagReason?: string }>;

  // Investigations
  listInvestigations(status?: string): Promise<Investigation[]>;
  getInvestigation(id: string): Promise<Investigation | undefined>;
  createInvestigation(data: InsertInvestigation): Promise<Investigation>;
  updateInvestigation(id: string, data: Partial<InsertInvestigation>): Promise<Investigation>;
  deleteInvestigation(id: string): Promise<void>;

  // Chamber Excursions
  listExcursions(): Promise<ChamberExcursion[]>;
  getExcursion(id: string): Promise<ChamberExcursion | undefined>;
  createExcursion(data: InsertExcursion): Promise<ChamberExcursion>;
  updateExcursion(id: string, data: Partial<InsertExcursion>): Promise<ChamberExcursion>;
  deleteExcursion(id: string): Promise<void>;

  // Audit Logs
  listAuditLogs(limit?: number): Promise<AuditLog[]>;
  createAuditLog(data: InsertAuditLog): Promise<AuditLog>;

  // Notifications
  listNotifications(userId: string): Promise<Notification[]>;
  createNotification(data: InsertNotification): Promise<Notification>;
  markNotificationRead(id: string): Promise<void>;
  markAllNotificationsRead(userId: string): Promise<void>;
  deleteNotification(id: string): Promise<void>;
  deleteAllNotifications(userId: string): Promise<void>;
  syncNotifications(userId: string): Promise<void>;

  // ICH Matrix
  getIchMatrixData(): Promise<any[]>;

  // Dashboard Stats
  getDashboardStats(): Promise<any>;
  listOosOotFlags(): Promise<any[]>;

  // Sample Register
  listRegisterItems(): Promise<any[]>;
  createRegisterEntry(data: any): Promise<any>;
  updateRegisterEntry(studyId: string, data: any): Promise<any>;

  // Pull Test Completions
  listTestLog(): Promise<any[]>;
  getTestCompletions(timePointId: string): Promise<any[]>;
  addTestCompletion(data: { timePointId: string; testName: string; completedByName: string; completedById?: string }): Promise<any>;
  updateTestCompletion(id: string, data: { oosOotFlag?: string | null; oosOotNote?: string | null }): Promise<any>;
  removeTestCompletion(id: string): Promise<void>;

  // Monthly Signoffs
  getMonthlySignoffs(year: number, month: number): Promise<any[]>;
  createMonthlySignoff(data: any): Promise<any>;
  getMonthlyReport(year: number, month: number): Promise<any>;

  // Monthly Report Notes
  getMonthlyReportNotes(year: number, month: number): Promise<any>;
  upsertMonthlyReportNotes(year: number, month: number, data: any): Promise<any>;

  // Register Import
  importRegisterData(rows: any[]): Promise<{ created: number; errors: string[] }>;
  bulkUpdateTimePoints(rows: any[]): Promise<{ updated: number; errors: string[] }>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async getUserByUsername(username: string) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  async createUser(data: InsertUser) {
    const [user] = await db.insert(users).values(data).returning();
    return user;
  }
  async updateUser(id: string, data: Partial<InsertUser>) {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user;
  }
  async deleteUser(id: string) {
    await db.delete(users).where(eq(users.id, id));
  }
  async listUsers() {
    return db.select().from(users).orderBy(asc(users.fullName));
  }

  // Storage Conditions
  async listStorageConditions() {
    return db.select().from(storageConditions).orderBy(asc(storageConditions.code));
  }
  async createStorageCondition(data: InsertStorageCondition) {
    const [sc] = await db.insert(storageConditions).values(data).returning();
    return sc;
  }
  async updateStorageCondition(id: string, data: Partial<InsertStorageCondition>) {
    const [sc] = await db.update(storageConditions).set(data).where(eq(storageConditions.id, id)).returning();
    return sc;
  }
  async deleteStorageCondition(id: string) {
    await db.delete(storageConditions).where(eq(storageConditions.id, id));
  }

  // Chambers
  async listChambers() {
    return db.select().from(chambers).orderBy(asc(chambers.name));
  }
  async getChamber(id: string) {
    const [c] = await db.select().from(chambers).where(eq(chambers.id, id));
    return c;
  }
  async createChamber(data: InsertChamber) {
    const [c] = await db.insert(chambers).values(data).returning();
    return c;
  }
  async updateChamber(id: string, data: Partial<InsertChamber>) {
    const [c] = await db.update(chambers).set(data).where(eq(chambers.id, id)).returning();
    return c;
  }
  async deleteChamber(id: string) {
    await db.delete(chambers).where(eq(chambers.id, id));
  }

  // Products
  async listProducts() {
    return db.select().from(products).orderBy(asc(products.name));
  }
  async getProduct(id: string) {
    const [p] = await db.select().from(products).where(eq(products.id, id));
    return p;
  }
  async createProduct(data: InsertProduct) {
    const [p] = await db.insert(products).values(data).returning();
    return p;
  }
  async updateProduct(id: string, data: Partial<InsertProduct>) {
    const [p] = await db.update(products).set(data).where(eq(products.id, id)).returning();
    return p;
  }
  async deleteProduct(id: string) {
    await db.delete(products).where(eq(products.id, id));
  }

  // Test Specifications
  async listTestSpecifications(productId?: string) {
    if (productId) {
      return db.select().from(testSpecifications).where(eq(testSpecifications.productId, productId)).orderBy(asc(testSpecifications.testName));
    }
    return db.select().from(testSpecifications).orderBy(asc(testSpecifications.testName));
  }
  async createTestSpecification(data: InsertTestSpec) {
    const [ts] = await db.insert(testSpecifications).values(data).returning();
    return ts;
  }
  async updateTestSpecification(id: string, data: Partial<InsertTestSpec>) {
    const [ts] = await db.update(testSpecifications).set(data).where(eq(testSpecifications.id, id)).returning();
    return ts;
  }
  async deleteTestSpecification(id: string) {
    await db.delete(testSpecifications).where(eq(testSpecifications.id, id));
  }

  // Stability Studies
  async listStudies() {
    return db.select().from(stabilityStudies).orderBy(desc(stabilityStudies.createdAt));
  }
  async getStudy(id: string) {
    const [s] = await db.select().from(stabilityStudies).where(eq(stabilityStudies.id, id));
    return s;
  }
  async createStudy(data: InsertStudy) {
    const [s] = await db.insert(stabilityStudies).values(data).returning();
    return s;
  }
  async updateStudy(id: string, data: Partial<InsertStudy>) {
    const [s] = await db.update(stabilityStudies).set({ ...data, updatedAt: new Date() }).where(eq(stabilityStudies.id, id)).returning();
    return s;
  }
  async deleteStudy(id: string) {
    await db.delete(samples).where(eq(samples.studyId, id));
    await db.delete(timePoints).where(eq(timePoints.studyId, id));
    await db.delete(stabilityStudies).where(eq(stabilityStudies.id, id));
  }

  // Time Points
  async listTimePoints(studyId?: string) {
    if (studyId) {
      return db.select().from(timePoints).where(eq(timePoints.studyId, studyId)).orderBy(asc(timePoints.intervalMonths));
    }
    return db.select().from(timePoints).orderBy(asc(timePoints.plannedDate));
  }
  async getTimePoint(id: string) {
    const [tp] = await db.select().from(timePoints).where(eq(timePoints.id, id));
    return tp;
  }
  async createTimePoint(data: InsertTimePoint) {
    const [tp] = await db.insert(timePoints).values(data).returning();
    return tp;
  }
  async updateTimePoint(id: string, data: Partial<InsertTimePoint>) {
    // If transitioning to in_progress and the current status is overdue, stamp wasOverdue
    if (data.status === "in_progress") {
      const [current] = await db.select({ status: timePoints.status }).from(timePoints).where(eq(timePoints.id, id));
      if (current?.status === "overdue") {
        data = { ...data, wasOverdue: true };
      }
    }
    const [tp] = await db.update(timePoints).set(data).where(eq(timePoints.id, id)).returning();
    return tp;
  }
  async deleteTimePoint(id: string) {
    await db.delete(timePoints).where(eq(timePoints.id, id));
  }
  async getUpcomingPulls(daysAhead = 30) {
    const now = new Date();
    const future = new Date(now.getTime() + daysAhead * 86400000);
    return db.select().from(timePoints)
      .where(and(
        gte(timePoints.plannedDate, now),
        lte(timePoints.plannedDate, future),
        inArray(timePoints.status, ["pending", "due"])
      ))
      .orderBy(asc(timePoints.plannedDate));
  }
  async getOverduePulls() {
    const now = new Date();
    return db.select().from(timePoints)
      .where(and(
        lt(timePoints.plannedDate, now),
        inArray(timePoints.status, ["pending", "overdue"])
      ))
      .orderBy(asc(timePoints.plannedDate));
  }

  // Samples
  async listSamples(studyId?: string) {
    if (studyId) {
      return db.select().from(samples).where(eq(samples.studyId, studyId)).orderBy(desc(samples.placedAt));
    }
    return db.select().from(samples).orderBy(desc(samples.placedAt));
  }
  async getSamplesView() {
    const rows = await db
      .select({
        // Sample fields
        id: samples.id,
        barcode: samples.barcode,
        shelf: samples.shelf,
        position: samples.position,
        quantityPlaced: samples.quantityPlaced,
        quantityRemaining: samples.quantityRemaining,
        quantityUsed: samples.quantityUsed,
        quantityDestroyed: samples.quantityDestroyed,
        numberOfContainers: samples.numberOfContainers,
        quantityPerContainer: samples.quantityPerContainer,
        manufacturingDate: samples.manufacturingDate,
        expiryDate: samples.expiryDate,
        orientationInChamber: samples.orientationInChamber,
        containerClosureSystem: samples.containerClosureSystem,
        status: samples.status,
        onHold: samples.onHold,
        holdReason: samples.holdReason,
        placedAt: samples.placedAt,
        pulledAt: samples.pulledAt,
        notes: samples.notes,
        // Study fields
        studyId: stabilityStudies.id,
        studyNumber: stabilityStudies.studyNumber,
        batchNumber: stabilityStudies.batchNumber,
        studyType: stabilityStudies.studyType,
        studyStatus: stabilityStudies.status,
        studyStrength: stabilityStudies.strength,
        studyDosageForm: stabilityStudies.dosageForm,
        studyManufacturingDate: stabilityStudies.manufacturingDate,
        studyExpiryDate: stabilityStudies.expiryDate,
        studyStartDate: stabilityStudies.startDate,
        containerType: stabilityStudies.containerType,
        // Product fields
        productName: products.name,
        productCode: products.code,
        productStrength: products.strength,
        productDosageForm: products.dosageForm,
        // Chamber fields
        chamberName: chambers.name,
        chamberLocation: chambers.location,
        // Storage condition fields
        conditionCode: storageConditions.code,
        conditionLabel: storageConditions.label,
        conditionTemp: storageConditions.temperature,
        conditionHumidity: storageConditions.humidity,
        // Time point fields
        timePointLabel: timePoints.label,
        timePointPlannedDate: timePoints.plannedDate,
        timePointActualDate: timePoints.actualDate,
        timePointStatus: timePoints.status,
        timePointIntervalMonths: timePoints.intervalMonths,
      })
      .from(samples)
      .leftJoin(stabilityStudies, eq(samples.studyId, stabilityStudies.id))
      .leftJoin(products, eq(stabilityStudies.productId, products.id))
      .leftJoin(chambers, eq(samples.chamberId, chambers.id))
      .leftJoin(storageConditions, eq(stabilityStudies.conditionId, storageConditions.id))
      .leftJoin(timePoints, eq(samples.timePointId, timePoints.id))
      .orderBy(desc(samples.placedAt));
    return rows;
  }
  async getSample(id: string) {
    const [s] = await db.select().from(samples).where(eq(samples.id, id));
    return s;
  }
  async createSample(data: InsertSample) {
    const [s] = await db.insert(samples).values(data).returning();
    return s;
  }
  async updateSample(id: string, data: Partial<InsertSample>) {
    const [s] = await db.update(samples).set(data).where(eq(samples.id, id)).returning();
    return s;
  }
  async deleteSample(id: string) {
    await db.delete(samples).where(eq(samples.id, id));
  }
  async bulkCreateProducts(data: any[]) {
    if (!data.length) return 0;
    const inserted = await db.insert(products).values(data).onConflictDoNothing().returning();
    return inserted.length;
  }
  async bulkCreateTestSpecs(data: any[]) {
    if (!data.length) return 0;
    const inserted = await db.insert(testSpecifications).values(data).onConflictDoNothing().returning();
    return inserted.length;
  }
  async bulkCreateStudies(data: any[]) {
    if (!data.length) return 0;
    const inserted = await db.insert(stabilityStudies).values(data).onConflictDoNothing().returning();
    return inserted.length;
  }
  async bulkCreateSamples(data: any[]) {
    if (!data.length) return 0;
    const inserted = await db.insert(samples).values(data).onConflictDoNothing().returning();
    return inserted.length;
  }

  // ── Master (unified) import ──────────────────────────────────────────────
  async importMasterData(rows: any[]): Promise<{ created: number; updated: number; skipped: number; errors: string[] }> {
    let created = 0; let updated = 0; let skipped = 0; const errors: string[] = [];

    // Normalize enum values case-insensitively
    const normalizeStudyType = (v: string): string => {
      const map: Record<string, string> = {
        "long_term": "long_term", "long term": "long_term", "longterm": "long_term", "lt": "long_term",
        "accelerated": "accelerated", "acc": "accelerated",
        "intermediate": "intermediate", "int": "intermediate",
        "stress": "stress",
        "photostability": "photostability", "photo": "photostability",
        "freeze_thaw": "freeze_thaw", "freeze thaw": "freeze_thaw",
      };
      return map[(v || "").toLowerCase().trim()] || "long_term";
    };
    const normalizeStudyStatus = (v: string): string => {
      const map: Record<string, string> = {
        "draft": "draft", "active": "active", "on_hold": "on_hold", "on hold": "on_hold",
        "completed": "completed", "complete": "completed", "discontinued": "discontinued",
      };
      return map[(v || "").toLowerCase().trim()] || "active";
    };
    const normalizeSampleStatus = (v: string): string => {
      const map: Record<string, string> = {
        "stored": "stored", "store": "stored", "in storage": "stored",
        "pulled": "pulled", "pull": "pulled",
        "consumed": "consumed",
        "destroyed": "destroyed",
        "lost": "lost",
      };
      return map[(v || "").toLowerCase().trim()] || "stored";
    };
    const normalizeTimePointStatus = (v: string): string => {
      const map: Record<string, string> = {
        "pending": "pending", "due": "due", "overdue": "overdue",
        "in_progress": "in_progress", "in progress": "in_progress", "inprogress": "in_progress",
        "completed": "completed", "complete": "completed", "done": "completed",
        "cancelled": "cancelled", "canceled": "cancelled",
      };
      return map[(v || "").toLowerCase().trim()] || "pending";
    };
    const parseFlexDate = (v: string): Date | null => {
      if (!v || !v.trim()) return null;
      // Try ISO first
      let d = new Date(v.trim());
      if (!isNaN(d.getTime())) return d;
      // Try DD/MM/YYYY
      const dmy = v.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (dmy) { d = new Date(`${dmy[3]}-${dmy[2].padStart(2,"0")}-${dmy[1].padStart(2,"0")}`); if (!isNaN(d.getTime())) return d; }
      // Try MM-DD-YYYY
      const mdy = v.trim().match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
      if (mdy) { d = new Date(`${mdy[3]}-${mdy[1].padStart(2,"0")}-${mdy[2].padStart(2,"0")}`); if (!isNaN(d.getTime())) return d; }
      return null;
    };

    // Column name aliases: maps various user-supplied headers → canonical field names
    const COLUMN_ALIASES: Record<string, string> = {
      "product name": "productName", "product_name": "productName", "name": "productName",
      "product code": "productCode", "product_code": "productCode", "code": "productCode", "sku": "productCode",
      "study number": "studyNumber", "study_number": "studyNumber", "study no": "studyNumber",
      "study type": "studyType", "study_type": "studyType",
      "study status": "studyStatus", "study_status": "studyStatus",
      "study start date": "studyStartDate", "study_start_date": "studyStartDate", "start date": "studyStartDate",
      "batch number": "batchNumber", "batch_number": "batchNumber", "batch no": "batchNumber", "batch": "batchNumber",
      "condition code": "conditionCode", "condition_code": "conditionCode",
      "condition temp": "conditionTemp", "condition_temp": "conditionTemp", "temperature": "conditionTemp",
      "condition humidity": "conditionHumidity", "condition_humidity": "conditionHumidity", "humidity": "conditionHumidity",
      "chamber name": "chamberName", "chamber_name": "chamberName", "chamber": "chamberName",
      "chamber location": "chamberLocation", "chamber_location": "chamberLocation",
      "time point label": "timePointLabel", "time_point_label": "timePointLabel", "timepoint": "timePointLabel", "time point": "timePointLabel",
      "planned pull date": "plannedPullDate", "planned_pull_date": "plannedPullDate", "planned date": "plannedPullDate",
      "actual pull date": "actualPullDate", "actual_pull_date": "actualPullDate", "actual date": "actualPullDate",
      "time point status": "timePointStatus", "time_point_status": "timePointStatus",
      "sample status": "sampleStatus", "sample_status": "sampleStatus", "status": "sampleStatus",
      "on hold": "onHold", "on_hold": "onHold",
      "hold reason": "holdReason", "hold_reason": "holdReason",
      "shelf life months": "shelfLifeMonths", "shelf_life_months": "shelfLifeMonths", "shelf life": "shelfLifeMonths",
      "quantity placed": "quantityPlaced", "quantity_placed": "quantityPlaced",
      "quantity remaining": "quantityRemaining", "quantity_remaining": "quantityRemaining",
      "number of containers": "numberOfContainers", "number_of_containers": "numberOfContainers", "containers": "numberOfContainers",
      "quantity per container": "quantityPerContainer", "quantity_per_container": "quantityPerContainer",
      "manufacturing date": "manufacturingDate", "manufacturing_date": "manufacturingDate", "mfg date": "manufacturingDate",
      "expiry date": "expiryDate", "expiry_date": "expiryDate", "expiry": "expiryDate", "exp date": "expiryDate",
      "placed at": "placedAt", "placed_at": "placedAt", "placement date": "placedAt",
      "container type": "containerType", "container_type": "containerType",
      "package size": "packageSize", "package_size": "packageSize",
      "initial quantity": "initialQuantity", "initial_quantity": "initialQuantity",
      "orientation in chamber": "orientationInChamber", "orientation_in_chamber": "orientationInChamber", "orientation": "orientationInChamber",
      "container closure system": "containerClosureSystem", "container_closure_system": "containerClosureSystem", "closure": "containerClosureSystem",
      "ich zone": "ichZone", "ich_zone": "ichZone",
      "protocol number": "protocolNumber", "protocol_number": "protocolNumber", "protocol": "protocolNumber",
    };

    const normalizeRow = (raw: Record<string, any>): Record<string, any> => {
      const out: Record<string, any> = {};
      for (const [k, v] of Object.entries(raw)) {
        const canonical = COLUMN_ALIASES[k.toLowerCase().trim()] || k;
        out[canonical] = v;
      }
      return out;
    };

    for (const rawRow of rows) {
      const row = normalizeRow(rawRow);
      const rowNum = rows.indexOf(rawRow) + 2;
      try {
        // 1. Resolve / create Product
        let product: any;
        if (row.productCode) {
          [product] = await db.select().from(products).where(eq(products.code, row.productCode));
          if (!product) {
            [product] = await db.insert(products).values({
              name: row.productName || row.productCode,
              code: row.productCode,
              strength: row.strength || null,
              dosageForm: row.dosageForm || null,
              manufacturer: row.manufacturer || null,
              shelfLifeMonths: row.shelfLifeMonths ? parseInt(row.shelfLifeMonths) : null,
              active: true,
            }).returning();
          }
        }

        // 2. Resolve Storage Condition
        let condition: any;
        if (row.conditionCode) {
          [condition] = await db.select().from(storageConditions).where(eq(storageConditions.code, row.conditionCode));
          if (!condition) {
            [condition] = await db.insert(storageConditions).values({
              code: row.conditionCode,
              label: row.conditionLabel || row.conditionCode,
              temperature: row.conditionTemp ? parseFloat(row.conditionTemp) : 25,
              humidity: row.conditionHumidity ? parseFloat(row.conditionHumidity) : null,
              ichZone: row.ichZone || null,
            }).returning();
          }
        }

        // 3. Resolve / create Chamber
        let chamber: any;
        if (row.chamberName) {
          [chamber] = await db.select().from(chambers).where(eq(chambers.name, row.chamberName));
          if (!chamber) {
            [chamber] = await db.insert(chambers).values({
              name: row.chamberName,
              conditionId: condition?.id || null,
              location: row.chamberLocation || null,
              status: "operational",
            }).returning();
          }
        }

        // 4. Resolve / create Study
        let study: any;
        if (row.studyNumber) {
          [study] = await db.select().from(stabilityStudies).where(eq(stabilityStudies.studyNumber, row.studyNumber));
          if (!study) {
            const startDate = parseFlexDate(row.studyStartDate) || new Date();
            [study] = await db.insert(stabilityStudies).values({
              studyNumber: row.studyNumber,
              productId: product?.id || null,
              batchNumber: row.batchNumber || "UNKNOWN",
              studyType: normalizeStudyType(row.studyType) as any,
              status: normalizeStudyStatus(row.studyStatus) as any,
              startDate,
              conditionId: condition?.id || null,
              chamberId: chamber?.id || null,
              protocolNumber: row.protocolNumber || null,
              initialQuantity: row.initialQuantity ? parseInt(row.initialQuantity) : null,
              containerType: row.containerType || null,
              strength: row.strength || null,
              dosageForm: row.dosageForm || null,
              manufacturingDate: parseFlexDate(row.manufacturingDate),
              expiryDate: parseFlexDate(row.expiryDate),
              packageSize: row.packageSize || null,
              notes: row.studyNotes || null,
            }).returning();
          }
        }

        // 5. Resolve / create Time Point
        let timePoint: any;
        if (study && row.timePointLabel) {
          [timePoint] = await db.select().from(timePoints).where(
            and(eq(timePoints.studyId, study.id), eq(timePoints.label, row.timePointLabel))
          );
          if (!timePoint) {
            const intervalMatch = row.timePointLabel.match(/\d+/);
            const intervalMonths = intervalMatch ? parseInt(intervalMatch[0]) : 0;
            // 40°C/75% (accelerated): base = startDate (placed in chamber)
            // All other conditions:   base = manufacturingDate (fallback to startDate)
            const isAccelCondition = condition
              ? condition.temperature >= 38 && condition.temperature <= 42 &&
                (condition.humidity == null || (condition.humidity >= 70 && condition.humidity <= 80))
              : false;
            const baseDate = isAccelCondition
              ? new Date(study.startDate)
              : (study.manufacturingDate ? new Date(study.manufacturingDate) : new Date(study.startDate));
            const autoPlannedDate = new Date(baseDate);
            autoPlannedDate.setMonth(autoPlannedDate.getMonth() + intervalMonths);
            const plannedDate = parseFlexDate(row.plannedPullDate) || autoPlannedDate;
            [timePoint] = await db.insert(timePoints).values({
              studyId: study.id,
              label: row.timePointLabel,
              intervalMonths,
              plannedDate,
              actualDate: parseFlexDate(row.actualPullDate),
              status: normalizeTimePointStatus(row.timePointStatus) as any,
              priority: "medium",
            }).returning();
          }
        }

        // 6. Create or Update Sample — only if there is meaningful sample data
        const sampleBarcode = row.barcode?.trim() || null;
        const hasSampleData = sampleBarcode || row.quantityPlaced || row.shelf || row.position;
        if (!hasSampleData) {
          // Row had only product/study/condition data — still counts as created
          created++;
          continue;
        }

        const sampleValues = {
          studyId: study?.id || null,
          timePointId: timePoint?.id || null,
          chamberId: chamber?.id || null,
          barcode: sampleBarcode,
          shelf: row.shelf || null,
          position: row.position || null,
          quantityPlaced: row.quantityPlaced ? parseInt(row.quantityPlaced) : null,
          quantityRemaining: row.quantityRemaining ? parseInt(row.quantityRemaining) : null,
          numberOfContainers: row.numberOfContainers ? parseInt(row.numberOfContainers) : null,
          quantityPerContainer: row.quantityPerContainer ? parseInt(row.quantityPerContainer) : null,
          manufacturingDate: parseFlexDate(row.manufacturingDate),
          expiryDate: parseFlexDate(row.expiryDate),
          orientationInChamber: row.orientationInChamber || null,
          containerClosureSystem: row.containerClosureSystem || null,
          status: normalizeSampleStatus(row.sampleStatus) as any,
          onHold: row.onHold === "true" || row.onHold === "Yes" || row.onHold === true || row.onHold === "1",
          holdReason: row.holdReason || null,
          placedAt: parseFlexDate(row.placedAt),
          notes: row.sampleNotes || null,
        };

        if (sampleBarcode) {
          const [existing] = await db.select().from(samples).where(eq(samples.barcode, sampleBarcode));
          if (existing) {
            await db.update(samples).set(sampleValues).where(eq(samples.barcode, sampleBarcode));
            updated++;
            continue;
          }
        }
        await db.insert(samples).values(sampleValues);
        created++;
      } catch (e: any) {
        errors.push(`Row ${rowNum}: ${e.message}`);
      }
    }
    return { created, updated, skipped, errors };
  }

  // Test Results
  async listResults(studyId?: string, timePointId?: string) {
    if (studyId && timePointId) {
      return db.select().from(testResults).where(and(eq(testResults.studyId, studyId), eq(testResults.timePointId, timePointId))).orderBy(desc(testResults.enteredAt));
    }
    if (studyId) {
      return db.select().from(testResults).where(eq(testResults.studyId, studyId)).orderBy(desc(testResults.enteredAt));
    }
    return db.select().from(testResults).orderBy(desc(testResults.enteredAt));
  }
  async getResult(id: string) {
    const [r] = await db.select().from(testResults).where(eq(testResults.id, id));
    return r;
  }
  async createResult(data: InsertResult) {
    const [r] = await db.insert(testResults).values(data).returning();
    return r;
  }
  async updateResult(id: string, data: Partial<InsertResult>) {
    const [r] = await db.update(testResults).set(data).where(eq(testResults.id, id)).returning();
    return r;
  }
  async evaluateResult(id: string) {
    const result = await this.getResult(id);
    if (!result || result.value === null || result.value === undefined) {
      return { status: "pending", flagged: false };
    }
    const [spec] = await db.select().from(testSpecifications).where(eq(testSpecifications.id, result.testSpecId!));
    if (!spec) return { status: "entered", flagged: false };

    const value = result.value;
    let status = "passed";
    let flagged = false;
    let flagReason: string | undefined;

    if ((spec.specMin !== null && value < spec.specMin!) || (spec.specMax !== null && value > spec.specMax!)) {
      status = "oos_suspected";
      flagged = true;
      flagReason = `Value ${value} ${spec.unit ?? ""} outside specification limits (${spec.specMin ?? "-"} - ${spec.specMax ?? "-"} ${spec.unit ?? ""})`;
    } else if ((spec.alertMin !== null && value < spec.alertMin!) || (spec.alertMax !== null && value > spec.alertMax!)) {
      status = "oot_suspected";
      flagged = true;
      flagReason = `Value ${value} ${spec.unit ?? ""} outside alert limits (${spec.alertMin ?? "-"} - ${spec.alertMax ?? "-"} ${spec.unit ?? ""})`;
    }

    await this.updateResult(id, { status: status as any, autoFlagged: flagged, flagReason });
    return { status, flagged, flagReason };
  }

  // Investigations
  async listInvestigations(status?: string) {
    if (status) {
      return db.select().from(investigations).where(eq(investigations.status, status as any)).orderBy(desc(investigations.createdAt));
    }
    return db.select().from(investigations).orderBy(desc(investigations.createdAt));
  }
  async getInvestigation(id: string) {
    const [inv] = await db.select().from(investigations).where(eq(investigations.id, id));
    return inv;
  }
  async createInvestigation(data: InsertInvestigation) {
    const [inv] = await db.insert(investigations).values(data).returning();
    return inv;
  }
  async updateInvestigation(id: string, data: Partial<InsertInvestigation>) {
    const [inv] = await db.update(investigations).set({ ...data, updatedAt: new Date() }).where(eq(investigations.id, id)).returning();
    return inv;
  }
  async deleteInvestigation(id: string) {
    await db.delete(investigations).where(eq(investigations.id, id));
  }

  // Chamber Excursions
  async listExcursions() {
    return db.select().from(chamberExcursions).orderBy(desc(chamberExcursions.startTime));
  }
  async getExcursion(id: string) {
    const [e] = await db.select().from(chamberExcursions).where(eq(chamberExcursions.id, id));
    return e;
  }
  async createExcursion(data: InsertExcursion) {
    const [e] = await db.insert(chamberExcursions).values(data).returning();
    return e;
  }
  async updateExcursion(id: string, data: Partial<InsertExcursion>) {
    const [e] = await db.update(chamberExcursions).set(data).where(eq(chamberExcursions.id, id)).returning();
    return e;
  }
  async deleteExcursion(id: string) {
    await db.delete(chamberExcursions).where(eq(chamberExcursions.id, id));
  }

  // Audit Logs
  async listAuditLogs(limit = 100) {
    return db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit);
  }
  async createAuditLog(data: InsertAuditLog) {
    const [log] = await db.insert(auditLogs).values(data).returning();
    return log;
  }

  // Notifications
  async listNotifications(userId: string) {
    return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
  }
  async createNotification(data: InsertNotification) {
    const [n] = await db.insert(notifications).values(data).returning();
    return n;
  }
  async markNotificationRead(id: string) {
    await db.update(notifications).set({ read: true }).where(eq(notifications.id, id));
  }
  async markAllNotificationsRead(userId: string) {
    await db.update(notifications).set({ read: true }).where(eq(notifications.userId, userId));
  }
  async deleteNotification(id: string) {
    await db.delete(notifications).where(eq(notifications.id, id));
  }
  async deleteAllNotifications(userId: string) {
    await db.delete(notifications).where(eq(notifications.userId, userId));
  }
  async syncNotifications(userId: string) {
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 86400000);

    // Fetch existing entityType::entityId pairs to avoid duplicates
    const existing = await db
      .select({ entityType: notifications.entityType, entityId: notifications.entityId })
      .from(notifications)
      .where(eq(notifications.userId, userId));
    const seen = new Set(existing.map(e => `${e.entityType}::${e.entityId}`));

    const toInsert: any[] = [];

    // 1. Overdue time points
    const overdueTps = await db
      .select({ id: timePoints.id, label: timePoints.label, plannedDate: timePoints.plannedDate })
      .from(timePoints)
      .where(and(
        or(eq(timePoints.status, "overdue"), eq(timePoints.status, "due")),
        lt(timePoints.plannedDate, now)
      ));
    for (const tp of overdueTps) {
      const key = `time_point::${tp.id}`;
      if (!seen.has(key)) {
        const daysLate = Math.floor((now.getTime() - new Date(tp.plannedDate).getTime()) / 86400000);
        toInsert.push({
          userId, type: "overdue",
          title: "Overdue Sample Pull",
          message: `Time point ${tp.label} is ${daysLate} day${daysLate !== 1 ? "s" : ""} overdue.`,
          entityType: "time_point", entityId: tp.id, read: false,
        });
        seen.add(key);
      }
    }

    // 2. Upcoming time points (next 7 days, still pending)
    const upcomingTps = await db
      .select({ id: timePoints.id, label: timePoints.label, plannedDate: timePoints.plannedDate })
      .from(timePoints)
      .where(and(
        eq(timePoints.status, "pending"),
        gte(timePoints.plannedDate, now),
        lte(timePoints.plannedDate, in7Days)
      ));
    for (const tp of upcomingTps) {
      const key = `time_point_upcoming::${tp.id}`;
      if (!seen.has(key)) {
        const daysUntil = Math.ceil((new Date(tp.plannedDate).getTime() - now.getTime()) / 86400000);
        toInsert.push({
          userId, type: "upcoming",
          title: "Upcoming Sample Pull",
          message: `Time point ${tp.label} is due in ${daysUntil} day${daysUntil !== 1 ? "s" : ""}.`,
          entityType: "time_point_upcoming", entityId: tp.id, read: false,
        });
        seen.add(key);
      }
    }

    // 3. OOS / OOT completions
    const oosRows = await db
      .select({ id: pullTestCompletions.id, oosOotFlag: pullTestCompletions.oosOotFlag, testName: pullTestCompletions.testName, oosOotNote: pullTestCompletions.oosOotNote })
      .from(pullTestCompletions)
      .where(and(
        sql`${pullTestCompletions.oosOotFlag} IS NOT NULL`,
        ne(pullTestCompletions.oosOotFlag, "")
      ));
    for (const r of oosRows) {
      const key = `oos_oot::${r.id}`;
      if (!seen.has(key)) {
        toInsert.push({
          userId, type: "oos_oot",
          title: `${r.oosOotFlag} Result Detected`,
          message: `${r.testName}: ${r.oosOotNote || "Out-of-specification result logged."}`,
          entityType: "oos_oot", entityId: r.id, read: false,
        });
        seen.add(key);
      }
    }

    if (toInsert.length > 0) {
      await db.insert(notifications).values(toInsert);
    }
  }

  // ICH Matrix
  async getIchMatrixData() {
    const allStudies = await db
      .select({
        studyId: stabilityStudies.id,
        studyNumber: stabilityStudies.studyNumber,
        batchNumber: stabilityStudies.batchNumber,
        studyType: stabilityStudies.studyType,
        studyStatus: stabilityStudies.status,
        startDate: stabilityStudies.startDate,
        plannedEndDate: stabilityStudies.plannedEndDate,
        productId: stabilityStudies.productId,
        productName: products.name,
        productCode: products.code,
        productStrength: products.strength,
        productDosageForm: products.dosageForm,
        conditionId: storageConditions.id,
        conditionCode: storageConditions.code,
        conditionLabel: storageConditions.label,
        conditionTemp: storageConditions.temperature,
        conditionHumidity: storageConditions.humidity,
      })
      .from(stabilityStudies)
      .leftJoin(products, eq(stabilityStudies.productId, products.id))
      .leftJoin(storageConditions, eq(stabilityStudies.conditionId, storageConditions.id))
      .orderBy(asc(products.name), asc(stabilityStudies.startDate));

    const allTps = await db
      .select()
      .from(timePoints)
      .orderBy(asc(timePoints.intervalMonths));

    const tpByStudy = new Map<string, typeof allTps>();
    for (const tp of allTps) {
      if (!tp.studyId) continue;
      if (!tpByStudy.has(tp.studyId)) tpByStudy.set(tp.studyId, []);
      tpByStudy.get(tp.studyId)!.push(tp);
    }

    const byProduct = new Map<string, any>();
    for (const s of allStudies) {
      const pid = s.productId ?? "unknown";
      if (!byProduct.has(pid)) {
        byProduct.set(pid, {
          product: { id: pid, name: s.productName ?? "Unknown", code: s.productCode ?? "", strength: s.productStrength, dosageForm: s.productDosageForm },
          studies: [],
        });
      }
      byProduct.get(pid)!.studies.push({
        id: s.studyId,
        studyNumber: s.studyNumber,
        batchNumber: s.batchNumber,
        studyType: s.studyType,
        status: s.studyStatus,
        startDate: s.startDate,
        plannedEndDate: s.plannedEndDate,
        condition: { id: s.conditionId, code: s.conditionCode, label: s.conditionLabel, temperature: s.conditionTemp, humidity: s.conditionHumidity },
        timePoints: (tpByStudy.get(s.studyId) ?? []).map(tp => ({
          id: tp.id, intervalMonths: tp.intervalMonths, label: tp.label,
          status: tp.status, plannedDate: tp.plannedDate, actualDate: tp.actualDate,
        })),
      });
    }

    return Array.from(byProduct.values()).sort((a, b) => a.product.name.localeCompare(b.product.name));
  }

  // Dashboard Stats
  async getDashboardStats() {
    const now = new Date();
    const thirtyDaysOut = new Date(now.getTime() + 30 * 86400000);
    const sevenDaysOut = new Date(now.getTime() + 7 * 86400000);

    const [activeStudiesCount] = await db.select({ count: sql<number>`count(*)` }).from(stabilityStudies).where(eq(stabilityStudies.status, "active"));
    const [overdueCount] = await db.select({ count: sql<number>`count(*)` }).from(timePoints).where(and(lt(timePoints.plannedDate, now), inArray(timePoints.status, ["pending", "overdue"])));
    const [upcomingCount] = await db.select({ count: sql<number>`count(*)` }).from(timePoints).where(and(gte(timePoints.plannedDate, now), lte(timePoints.plannedDate, thirtyDaysOut), inArray(timePoints.status, ["pending", "due"])));
    const [openInvCount] = await db.select({ count: sql<number>`count(*)` }).from(investigations).where(ne(investigations.status, "closed"));
    const [oosOotFlagCount] = await db.select({ count: sql<number>`count(*)` }).from(pullTestCompletions).where(sql`oos_oot_flag IS NOT NULL`);
    const [activeExcursionCount] = await db.select({ count: sql<number>`count(*)` }).from(chamberExcursions).where(eq(chamberExcursions.status, "active"));
    const [oosCount] = await db.select({ count: sql<number>`count(*)` }).from(testResults).where(eq(testResults.status, "oos_suspected"));
    const [ootCount] = await db.select({ count: sql<number>`count(*)` }).from(testResults).where(eq(testResults.status, "oot_suspected"));

    const recentInvestigations = await db.select().from(investigations).orderBy(desc(investigations.createdAt)).limit(5);
    const urgentPullsRaw = await db
      .select({
        id: timePoints.id,
        studyId: timePoints.studyId,
        label: timePoints.label,
        plannedDate: timePoints.plannedDate,
        actualDate: timePoints.actualDate,
        status: timePoints.status,
        priority: timePoints.priority,
        intervalMonths: timePoints.intervalMonths,
        assignedAnalystId: timePoints.assignedAnalystId,
        productName: products.name,
        productCode: products.code,
        conditionCode: storageConditions.code,
        conditionLabel: storageConditions.label,
        studyNumber: stabilityStudies.studyNumber,
        batchNumber: stabilityStudies.batchNumber,
      })
      .from(timePoints)
      .leftJoin(stabilityStudies, eq(timePoints.studyId, stabilityStudies.id))
      .leftJoin(products, eq(stabilityStudies.productId, products.id))
      .leftJoin(storageConditions, eq(stabilityStudies.conditionId, storageConditions.id))
      .where(and(gte(timePoints.plannedDate, now), lte(timePoints.plannedDate, sevenDaysOut), inArray(timePoints.status, ["pending", "due"])))
      .orderBy(asc(timePoints.plannedDate))
      .limit(8);

    return {
      activeStudies: Number(activeStudiesCount.count),
      overduePulls: Number(overdueCount.count),
      upcomingPulls: Number(upcomingCount.count),
      openInvestigations: Number(openInvCount.count),
      activeExcursions: Number(activeExcursionCount.count),
      oosResults: Number(oosCount.count),
      ootResults: Number(ootCount.count),
      oosOotFlagCount: Number(oosOotFlagCount.count),
      recentInvestigations,
      urgentPulls: urgentPullsRaw,
    };
  }

  async listTestLog() {
    const rows = await db
      .select({
        id: pullTestCompletions.id,
        timePointId: pullTestCompletions.timePointId,
        testName: pullTestCompletions.testName,
        oosOotFlag: pullTestCompletions.oosOotFlag,
        oosOotNote: pullTestCompletions.oosOotNote,
        completedByName: pullTestCompletions.completedByName,
        completedAt: pullTestCompletions.completedAt,
        product: products.name,
        batch: stabilityStudies.batchNumber,
        conditionCode: storageConditions.code,
        timePointLabel: timePoints.label,
        plannedDate: timePoints.plannedDate,
      })
      .from(pullTestCompletions)
      .leftJoin(timePoints, eq(pullTestCompletions.timePointId, timePoints.id))
      .leftJoin(stabilityStudies, eq(timePoints.studyId, stabilityStudies.id))
      .leftJoin(products, eq(stabilityStudies.productId, products.id))
      .leftJoin(storageConditions, eq(stabilityStudies.conditionId, storageConditions.id))
      .orderBy(desc(pullTestCompletions.completedAt));
    return rows;
  }

  async listOosOotFlags() {
    const rows = await db
      .select({
        id: pullTestCompletions.id,
        timePointId: pullTestCompletions.timePointId,
        testName: pullTestCompletions.testName,
        oosOotFlag: pullTestCompletions.oosOotFlag,
        oosOotNote: pullTestCompletions.oosOotNote,
        completedByName: pullTestCompletions.completedByName,
        completedAt: pullTestCompletions.completedAt,
        product: products.name,
        batch: stabilityStudies.batchNumber,
        conditionCode: storageConditions.code,
        timePointLabel: timePoints.label,
        plannedDate: timePoints.plannedDate,
      })
      .from(pullTestCompletions)
      .leftJoin(timePoints, eq(pullTestCompletions.timePointId, timePoints.id))
      .leftJoin(stabilityStudies, eq(timePoints.studyId, stabilityStudies.id))
      .leftJoin(products, eq(stabilityStudies.productId, products.id))
      .leftJoin(storageConditions, eq(stabilityStudies.conditionId, storageConditions.id))
      .where(sql`${pullTestCompletions.oosOotFlag} IS NOT NULL`)
      .orderBy(desc(pullTestCompletions.completedAt));
    return rows;
  }

  // ── Sample Register ──────────────────────────────────────────────────────

  async listRegisterItems() {
    // Pending time points 30+ days past planned date → overdue (never flip in_progress back)
    await db.execute(sql`
      UPDATE time_points
      SET status = 'overdue'
      WHERE status = 'pending'
        AND planned_date < NOW() - INTERVAL '30 days'
    `);

    // Pending time points whose planned date has passed (but within 30 days) → in_progress
    await db.execute(sql`
      UPDATE time_points
      SET status = 'in_progress'
      WHERE status = 'pending'
        AND planned_date <= NOW()
        AND planned_date >= NOW() - INTERVAL '30 days'
    `);

    const rows = await db
      .select({
        timePointId: timePoints.id,
        studyId: stabilityStudies.id,
        studyNumber: stabilityStudies.studyNumber,
        product: products.name,
        batch: stabilityStudies.batchNumber,
        strength: stabilityStudies.strength,
        conditionCode: storageConditions.code,
        conditionLabel: storageConditions.label,
        conditionTemp: storageConditions.temperature,
        conditionHumidity: storageConditions.humidity,
        chamber: chambers.name,
        intervalMonths: timePoints.intervalMonths,
        label: timePoints.label,
        plannedDate: timePoints.plannedDate,
        actualDate: timePoints.actualDate,
        status: timePoints.status,
        container: stabilityStudies.containerType,
        mnfDate: stabilityStudies.manufacturingDate,
        packedDate: stabilityStudies.packedDate,
        packSize: stabilityStudies.packageSize,
        protocolRef: stabilityStudies.protocolNumber,
        testPlan: stabilityStudies.testPlan,
        intervalsMonthsCsv: stabilityStudies.intervalsMonthsCsv,
        startDate: stabilityStudies.startDate,
        notes: stabilityStudies.notes,
        oosOotFlag: timePoints.oosOotFlag,
        oosOotNote: timePoints.oosOotNote,
        wasOverdue: timePoints.wasOverdue,
      })
      .from(timePoints)
      .leftJoin(stabilityStudies, eq(timePoints.studyId, stabilityStudies.id))
      .leftJoin(products, eq(stabilityStudies.productId, products.id))
      .leftJoin(storageConditions, eq(stabilityStudies.conditionId, storageConditions.id))
      .leftJoin(chambers, eq(stabilityStudies.chamberId, chambers.id))
      .orderBy(asc(timePoints.plannedDate));

    // Get completion counts per time point
    const completionCounts = await db
      .select({ timePointId: pullTestCompletions.timePointId, count: sql<number>`count(*)` })
      .from(pullTestCompletions)
      .groupBy(pullTestCompletions.timePointId);

    const countMap = new Map(completionCounts.map(r => [r.timePointId, Number(r.count)]));

    return rows.map(r => {
      const tests = (r.testPlan || "").split(",").map((t: string) => t.trim()).filter(Boolean);
      const completed = countMap.get(r.timePointId) ?? 0;
      return { ...r, testsTotal: tests.length, testsCompleted: completed };
    });
  }

  async createRegisterEntry(data: any) {
    // Resolve or create condition
    let condition: any = null;
    if (data.conditionCode) {
      const found = await db.select().from(storageConditions)
        .where(eq(storageConditions.code, data.conditionCode));
      if (found.length > 0) {
        condition = found[0];
      } else {
        // Parse temperature and humidity from code string e.g. "40°C/75%", "25°C/60%"
        const tempMatch = data.conditionCode.match(/(\d+)\s*°?\s*[Cc]/);
        const humMatch = data.conditionCode.match(/(\d+)\s*%/);
        const parsedTemp = tempMatch ? parseInt(tempMatch[1], 10) : 25;
        const parsedHum = humMatch ? parseInt(humMatch[1], 10) : null;
        const [created] = await db.insert(storageConditions).values({
          code: data.conditionCode,
          label: data.conditionCode,
          temperature: parsedTemp,
          humidity: parsedHum,
        }).returning();
        condition = created;
      }
    }

    // Resolve or create chamber
    let chamber: any = null;
    if (data.chamberName) {
      const found = await db.select().from(chambers).where(eq(chambers.name, data.chamberName));
      if (found.length > 0) {
        chamber = found[0];
      } else {
        const [created] = await db.insert(chambers).values({
          name: data.chamberName,
          conditionId: condition?.id || null,
          status: "operational",
        }).returning();
        chamber = created;
      }
    }

    // Resolve or create product
    let product: any = null;
    if (data.productName) {
      const allProds = await db.select().from(products);
      product = allProds.find((p: any) => p.name.toLowerCase() === data.productName.toLowerCase()) || null;
      if (!product) {
        const code = data.productName.substring(0, 8).toUpperCase().replace(/\s+/g, "-") + "-" + Date.now().toString().slice(-4);
        const [created] = await db.insert(products).values({
          name: data.productName,
          code,
          strength: data.strength || null,
          dosageForm: null,
          active: true,
        }).returning();
        product = created;
      }
    }

    // Generate study number
    const count = await db.select({ c: sql<number>`count(*)` }).from(stabilityStudies);
    const studyNumber = `STAB-${new Date().getFullYear()}-${String(Number(count[0].c) + 1).padStart(3, "0")}`;

    // Parse intervals
    const intervalStrs = (data.intervalsMonthsCsv || "0").split(",").map((s: string) => s.trim()).filter(Boolean);
    const intervals = intervalStrs.map((s: string) => parseInt(s, 10)).filter((n: number) => !isNaN(n));

    // Determine base date for pull calculation
    const startDate = data.startDate ? new Date(data.startDate) : new Date();
    const mnfDate = data.mnfDate ? new Date(data.mnfDate) : null;
    // Detect accelerated via stored temperature OR by parsing the condition code string
    // (code-string fallback handles conditions auto-created with wrong temperature=25)
    const codeStr = (data.conditionCode || condition?.code || "").toLowerCase();
    const codeTemp = (() => { const m = codeStr.match(/(\d+)\s*°?\s*c/); return m ? parseInt(m[1], 10) : null; })();
    const isAccelerated = condition
      ? (condition.temperature >= 38 && condition.temperature <= 42) || (codeTemp !== null && codeTemp >= 38 && codeTemp <= 42)
      : (codeTemp !== null && codeTemp >= 38 && codeTemp <= 42);
    const baseDate = isAccelerated ? startDate : (mnfDate || startDate);

    // Determine study type from condition
    let studyType: any = "long_term";
    if (isAccelerated) studyType = "accelerated";
    else if (condition?.temperature === 30) studyType = "intermediate";

    // Create study
    const [study] = await db.insert(stabilityStudies).values({
      studyNumber,
      productId: product?.id || null,
      batchNumber: data.batch || "UNKNOWN",
      studyType,
      status: "active",
      startDate,
      manufacturingDate: mnfDate,
      packedDate: data.packedDate ? new Date(data.packedDate) : null,
      conditionId: condition?.id || null,
      chamberId: chamber?.id || null,
      protocolNumber: data.protocolRef || null,
      containerType: data.container || null,
      strength: data.strength || null,
      packageSize: data.packSize || null,
      testPlan: data.testPlan || null,
      intervalsMonthsCsv: data.intervalsMonthsCsv || null,
      notes: data.notes || null,
    }).returning();

    // Create time points
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    for (const months of intervals) {
      // Safe month addition that avoids end-of-month overflow
      // e.g. Jan 31 + 1 month → Feb 28, not Mar 3
      const plannedDate = new Date(baseDate);
      const origDay = plannedDate.getDate();
      plannedDate.setDate(1);
      plannedDate.setMonth(plannedDate.getMonth() + months);
      const maxDay = new Date(plannedDate.getFullYear(), plannedDate.getMonth() + 1, 0).getDate();
      plannedDate.setDate(Math.min(origDay, maxDay));

      let status: any = "pending";
      let wasOverdue = false;
      if (plannedDate < thirtyDaysAgo) {
        status = "overdue";
        wasOverdue = true;
      } else if (plannedDate <= now) {
        status = "in_progress";
      }
      await db.insert(timePoints).values({
        studyId: study.id,
        intervalMonths: months,
        label: months === 0 ? "T0 (Initial)" : `T${months}`,
        plannedDate,
        status,
        wasOverdue,
        priority: months === 0 ? "high" : "medium",
      });
    }

    return study;
  }

  async updateRegisterEntry(studyId: string, data: any) {
    const updateData: any = {};
    if (data.productName !== undefined) {
      // find product
      const allProds = await db.select().from(products);
      const product = allProds.find((p: any) => p.name.toLowerCase() === data.productName.toLowerCase());
      if (product) updateData.productId = product.id;
    }
    if (data.batch !== undefined) updateData.batchNumber = data.batch;
    if (data.strength !== undefined) updateData.strength = data.strength;
    if (data.container !== undefined) updateData.containerType = data.container;
    if (data.mnfDate !== undefined) updateData.manufacturingDate = data.mnfDate ? new Date(data.mnfDate) : null;
    if (data.packedDate !== undefined) updateData.packedDate = data.packedDate ? new Date(data.packedDate) : null;
    if (data.packSize !== undefined) updateData.packageSize = data.packSize;
    if (data.protocolRef !== undefined) updateData.protocolNumber = data.protocolRef;
    if (data.testPlan !== undefined) updateData.testPlan = data.testPlan;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.conditionCode !== undefined) {
      const cond = await db.select().from(storageConditions).where(eq(storageConditions.code, data.conditionCode));
      if (cond.length > 0) updateData.conditionId = cond[0].id;
    }
    if (data.chamberName !== undefined) {
      const ch = await db.select().from(chambers).where(eq(chambers.name, data.chamberName));
      if (ch.length > 0) updateData.chamberId = ch[0].id;
    }
    updateData.updatedAt = new Date();
    const [updated] = await db.update(stabilityStudies).set(updateData).where(eq(stabilityStudies.id, studyId)).returning();
    return updated;
  }

  // ── Pull Test Completions ────────────────────────────────────────────────

  async getTestCompletions(timePointId: string) {
    return db.select().from(pullTestCompletions)
      .where(eq(pullTestCompletions.timePointId, timePointId))
      .orderBy(asc(pullTestCompletions.completedAt));
  }

  async addTestCompletion(data: { timePointId: string; testName: string; completedByName: string; completedById?: string }) {
    // Upsert: if already exists just return it
    const existing = await db.select().from(pullTestCompletions)
      .where(and(eq(pullTestCompletions.timePointId, data.timePointId), eq(pullTestCompletions.testName, data.testName)));
    if (existing.length > 0) return existing[0];

    const [completion] = await db.insert(pullTestCompletions).values({
      timePointId: data.timePointId,
      testName: data.testName,
      completedByName: data.completedByName,
      completedById: data.completedById || null,
    }).returning();

    // Write to audit log — store analyst name in oldValue for display
    await db.insert(auditLogs).values({
      entityType: "test",
      entityId: completion.id,
      action: "create" as any,
      description: `Test "${data.testName}" completed by ${data.completedByName || "Unknown"}`,
      oldValue: data.completedByName || "Unknown",
    }).catch(() => {});

    // Check if all tests are done — if so, mark time point completed
    const [tp] = await db.select({ studyId: timePoints.studyId }).from(timePoints).where(eq(timePoints.id, data.timePointId));
    if (tp) {
      const [study] = await db.select({ testPlan: stabilityStudies.testPlan }).from(stabilityStudies).where(eq(stabilityStudies.id, tp.studyId!));
      if (study?.testPlan) {
        const allTests = study.testPlan.split(",").map((t: string) => t.trim()).filter(Boolean);
        const doneTests = await db.select().from(pullTestCompletions).where(eq(pullTestCompletions.timePointId, data.timePointId));
        if (doneTests.length >= allTests.length) {
          await db.update(timePoints).set({ status: "completed", actualDate: new Date() }).where(eq(timePoints.id, data.timePointId));
        }
      }
    }

    return completion;
  }

  async updateTestCompletion(id: string, data: { oosOotFlag?: string | null; oosOotNote?: string | null }) {
    const [updated] = await db.update(pullTestCompletions)
      .set({ oosOotFlag: data.oosOotFlag ?? null, oosOotNote: data.oosOotNote ?? null })
      .where(eq(pullTestCompletions.id, id))
      .returning();

    // Auto-derive worst flag on the parent time point (OOS > OOT > null)
    if (updated) {
      const allCompletions = await db.select({ oosOotFlag: pullTestCompletions.oosOotFlag })
        .from(pullTestCompletions)
        .where(eq(pullTestCompletions.timePointId, updated.timePointId));
      const flags = allCompletions.map(c => c.oosOotFlag).filter(Boolean);
      const worstFlag = flags.includes("OOS") ? "OOS" : flags.includes("OOT") ? "OOT" : null;
      await db.update(timePoints)
        .set({ oosOotFlag: worstFlag })
        .where(eq(timePoints.id, updated.timePointId));
    }
    return updated;
  }

  async removeTestCompletion(id: string) {
    // Get the time point id before deleting
    const [comp] = await db.select().from(pullTestCompletions).where(eq(pullTestCompletions.id, id));
    await db.delete(pullTestCompletions).where(eq(pullTestCompletions.id, id));

    // Revert time point to in_progress if it was completed
    if (comp) {
      const [tp] = await db.select({ status: timePoints.status, plannedDate: timePoints.plannedDate })
        .from(timePoints).where(eq(timePoints.id, comp.timePointId));
      if (tp?.status === "completed") {
        const newStatus = tp.plannedDate <= new Date() ? "in_progress" : "pending";
        await db.update(timePoints).set({ status: newStatus, actualDate: null }).where(eq(timePoints.id, comp.timePointId));
      }
    }
  }

  // ── Monthly Signoffs ─────────────────────────────────────────────────────

  async getMonthlySignoffs(year: number, month: number) {
    return db.select().from(monthlySignoffs)
      .where(and(eq(monthlySignoffs.periodYear, year), eq(monthlySignoffs.periodMonth, month)));
  }

  async createMonthlySignoff(data: any) {
    // Delete existing signoff for same period + role first
    await db.delete(monthlySignoffs).where(
      and(eq(monthlySignoffs.periodYear, data.periodYear),
        eq(monthlySignoffs.periodMonth, data.periodMonth),
        eq(monthlySignoffs.roleLabel, data.roleLabel))
    );
    const [signoff] = await db.insert(monthlySignoffs).values(data).returning();
    return signoff;
  }

  async getMonthlyReport(year: number, month: number) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);

    const items = await db
      .select({
        timePointId: timePoints.id,
        label: timePoints.label,
        plannedDate: timePoints.plannedDate,
        actualDate: timePoints.actualDate,
        status: timePoints.status,
        product: products.name,
        batch: stabilityStudies.batchNumber,
        studyNumber: stabilityStudies.studyNumber,
        conditionCode: storageConditions.code,
        testPlan: stabilityStudies.testPlan,
        wasOverdue: timePoints.wasOverdue,
      })
      .from(timePoints)
      .leftJoin(stabilityStudies, eq(timePoints.studyId, stabilityStudies.id))
      .leftJoin(products, eq(stabilityStudies.productId, products.id))
      .leftJoin(storageConditions, eq(stabilityStudies.conditionId, storageConditions.id))
      .where(and(gte(timePoints.plannedDate, start), lt(timePoints.plannedDate, end)))
      .orderBy(asc(timePoints.plannedDate));

    const completionCounts = await db
      .select({ timePointId: pullTestCompletions.timePointId, count: sql<number>`count(*)` })
      .from(pullTestCompletions)
      .groupBy(pullTestCompletions.timePointId);
    const countMap = new Map(completionCounts.map(r => [r.timePointId, Number(r.count)]));

    // Gather all timepoint IDs in this period for OOS/OOT lookup
    const tpIds = items.map(i => i.timePointId);
    let oosOotItems: any[] = [];
    if (tpIds.length > 0) {
      oosOotItems = await db
        .select({
          id: pullTestCompletions.id,
          timePointId: pullTestCompletions.timePointId,
          testName: pullTestCompletions.testName,
          oosOotFlag: pullTestCompletions.oosOotFlag,
          oosOotNote: pullTestCompletions.oosOotNote,
          completedByName: pullTestCompletions.completedByName,
          completedAt: pullTestCompletions.completedAt,
          product: products.name,
          batch: stabilityStudies.batchNumber,
          studyNumber: stabilityStudies.studyNumber,
          conditionCode: storageConditions.code,
          label: timePoints.label,
          plannedDate: timePoints.plannedDate,
        })
        .from(pullTestCompletions)
        .leftJoin(timePoints, eq(pullTestCompletions.timePointId, timePoints.id))
        .leftJoin(stabilityStudies, eq(timePoints.studyId, stabilityStudies.id))
        .leftJoin(products, eq(stabilityStudies.productId, products.id))
        .leftJoin(storageConditions, eq(stabilityStudies.conditionId, storageConditions.id))
        .where(and(
          inArray(pullTestCompletions.timePointId, tpIds),
          sql`${pullTestCompletions.oosOotFlag} IS NOT NULL`
        ))
        .orderBy(asc(pullTestCompletions.completedAt));
    }

    const signoffs = await this.getMonthlySignoffs(year, month);
    const notes = await this.getMonthlyReportNotes(year, month);

    const enriched = items.map(r => {
      const tests = (r.testPlan || "").split(",").map((t: string) => t.trim()).filter(Boolean);
      return { ...r, testsTotal: tests.length, testsCompleted: countMap.get(r.timePointId) ?? 0 };
    });

    const now = new Date();
    // Include: currently overdue, pending past due, AND items that were overdue when work started (wasOverdue flag)
    const overdueItems = enriched.filter(i =>
      i.status === "overdue" ||
      (i.status === "pending" && new Date(i.plannedDate) < now) ||
      i.wasOverdue === true
    );
    const pulledOnTime = enriched.filter(i => i.status === "completed" && i.actualDate && new Date(i.actualDate) <= new Date(i.plannedDate));

    return {
      year, month,
      items: enriched,
      overdueItems,
      oosOotItems,
      notes,
      summary: {
        total: enriched.length,
        completed: enriched.filter(i => i.status === "completed").length,
        pulledOnTime: pulledOnTime.length,
        inProgress: enriched.filter(i => i.status === "in_progress").length,
        pending: enriched.filter(i => i.status === "pending").length,
        overdue: overdueItems.length,
        oosOotCount: oosOotItems.length,
      },
      signoffs,
    };
  }

  async getMonthlyReportNotes(year: number, month: number) {
    const [row] = await db
      .select()
      .from(monthlyReportNotes)
      .where(and(
        sql`${monthlyReportNotes.periodYear} = ${year}`,
        sql`${monthlyReportNotes.periodMonth} = ${month}`
      ))
      .limit(1);
    return row ?? null;
  }

  async upsertMonthlyReportNotes(year: number, month: number, data: any) {
    const existing = await this.getMonthlyReportNotes(year, month);
    if (existing) {
      const [updated] = await db
        .update(monthlyReportNotes)
        .set({ ...data, updatedAt: new Date() })
        .where(sql`${monthlyReportNotes.id} = ${existing.id}`)
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(monthlyReportNotes)
        .values({ periodYear: year, periodMonth: month, ...data })
        .returning();
      return created;
    }
  }

  // ── Register Import ──────────────────────────────────────────────────────

  async importRegisterData(rows: any[]) {
    let created = 0;
    const errors: string[] = [];

    for (const row of rows) {
      try {
        const productName = (row["Product"] || row["product"] || "").trim();
        const batch = (row["Batch"] || row["batch"] || "").trim();
        const condition = (row["Condition"] || row["condition"] || "").trim();
        if (!productName || !batch || !condition) { errors.push(`Skipped row: missing Product, Batch, or Condition`); continue; }

        const study = await this.createRegisterEntry({
          productName,
          batch,
          strength: (row["Strength"] || row["strength"] || "").trim() || null,
          conditionCode: condition,
          chamberName: (row["Chamber"] || row["chamber"] || "").trim() || null,
          startDate: row["Start Date"] || row["start_date"] || new Date(),
          intervalsMonthsCsv: (row["Intervals (months csv)"] || row["intervals"] || "0,3,6,12,24").trim(),
          container: (row["Container"] || row["container"] || "").trim() || null,
          mnfDate: row["MNF Date"] || row["mnf_date"] || null,
          packedDate: row["Packed Date"] || row["packed_date"] || null,
          packSize: (row["Pack Size"] || row["pack_size"] || "").trim() || null,
          protocolRef: (row["Protocol Ref"] || row["protocol_ref"] || "").trim() || null,
          testPlan: (row["Test Plan"] || row["test_plan"] || "").trim() || null,
        });

        // If "Actual Date Complete" is provided, mark the T0 time point as completed
        // and auto-create test completion records for all tests in the plan
        const actualDateRaw = (row["Actual Date Complete"] || row["actual_date_complete"] || "").toString().trim();
        if (actualDateRaw) {
          const actualDate = new Date(actualDateRaw);
          if (!isNaN(actualDate.getTime())) {
            const [t0] = await db.select().from(timePoints)
              .where(and(eq(timePoints.studyId, study.id), eq(timePoints.intervalMonths, 0)));
            if (t0) {
              // If actual date is on or before planned date, the pull was NOT overdue — clear wasOverdue flag
              const notLate = actualDate <= new Date(t0.plannedDate);
              await db.update(timePoints).set({ status: "completed", actualDate, wasOverdue: notLate ? false : t0.wasOverdue }).where(eq(timePoints.id, t0.id));
              // Auto-create individual test completions for every test in the plan
              const testPlanStr = (row["Test Plan"] || row["test_plan"] || "").toString().trim();
              if (testPlanStr) {
                const testNames = testPlanStr.split(",").map((t: string) => t.trim()).filter(Boolean);
                for (const testName of testNames) {
                  await db.insert(pullTestCompletions).values({
                    timePointId: t0.id,
                    testName,
                    completedByName: "Import",
                  }).returning();
                }
              }
            }
          }
        }
        created++;
      } catch (e: any) {
        errors.push(`Row error: ${e.message}`);
      }
    }

    return { created, errors };
  }
  async bulkUpdateTimePoints(rows: any[]) {
    let updated = 0;
    const errors: string[] = [];

    for (const row of rows) {
      try {
        const studyNumber = (row["Study Number"] || row["study_number"] || "").trim();
        const batch = (row["Batch"] || row["batch"] || "").trim();
        const label = (row["Time Point"] || row["time_point"] || row["label"] || "").trim();
        const status = (row["Status"] || row["status"] || "").trim().toLowerCase();
        const actualDateRaw = row["Actual Date"] || row["actual_date"] || "";
        const oosOotFlag = (row["OOS/OOT Flag"] || row["oos_oot_flag"] || "").trim() || null;
        const oosOotNote = (row["OOS/OOT Note"] || row["oos_oot_note"] || "").trim() || null;

        if (!studyNumber || !label) {
          errors.push(`Skipped row: missing Study Number or Time Point`);
          continue;
        }

        const validStatuses = ["completed", "in_progress", "pending", "overdue"];
        if (status && !validStatuses.includes(status)) {
          errors.push(`Skipped "${studyNumber}/${label}": invalid status "${status}"`);
          continue;
        }

        // Find the study by study number (studyCode) or by batch matching
        const allRegister = await this.listRegisterItems();
        const candidate = allRegister.find(r =>
          (r.studyNumber === studyNumber || r.studyNumber?.startsWith(studyNumber)) &&
          (!batch || r.batch === batch)
        );
        if (!candidate || !candidate.studyId) {
          errors.push(`Study not found: "${studyNumber}"${batch ? ` batch "${batch}"` : ""}`);
          continue;
        }

        // Find the time point by label match
        const [tp] = await db
          .select()
          .from(timePoints)
          .where(and(eq(timePoints.studyId, candidate.studyId!), like(timePoints.label, `%${label}%`)));

        if (!tp) {
          errors.push(`Time point "${label}" not found in study "${studyNumber}"`);
          continue;
        }

        const updateData: any = {};
        if (status) updateData.status = status;
        if (actualDateRaw) {
          const parsed = new Date(actualDateRaw);
          if (!isNaN(parsed.getTime())) updateData.actualDate = parsed;
        }
        if (oosOotFlag !== undefined) updateData.oosOotFlag = oosOotFlag;
        if (oosOotNote !== undefined) updateData.oosOotNote = oosOotNote;

        if (Object.keys(updateData).length > 0) {
          await this.updateTimePoint(tp.id, updateData);
          updated++;
        }
      } catch (e: any) {
        errors.push(`Row error: ${e.message}`);
      }
    }

    return { updated, errors };
  }
}

export const storage = new DatabaseStorage();
