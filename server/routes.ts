import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateReportHTML } from "./report-html";
import { 
  insertUserSchema, insertProductSchema, insertStorageConditionSchema, insertChamberSchema,
  insertTestSpecSchema, insertStudySchema, insertTimePointSchema, insertSampleSchema,
  insertResultSchema, insertInvestigationSchema, insertExcursionSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {

  // Temporary one-time reset endpoint — removes all data except Kent's user
  app.post("/api/admin/reset-db-kent-only", async (req, res) => {
    try {
      const { db } = await import("./db");
      const { sql } = await import("drizzle-orm");
      await db.execute(sql`
        TRUNCATE TABLE pull_test_completions, test_results, investigations,
          chamber_excursions, samples, time_points, stability_studies,
          audit_logs, notifications, monthly_report_notes, monthly_signoffs,
          test_specifications, chambers, storage_conditions, products
        RESTART IDENTITY CASCADE
      `);
      await db.execute(sql`
        DELETE FROM users WHERE username NOT IN ('kent.ah.goo.4195', 'Kent')
      `);
      res.json({ ok: true, message: "Database cleared — only Kent's user remains." });
    } catch (e: any) {
      res.status(500).json({ ok: false, message: e.message });
    }
  });

  // ── Admin Scrub Endpoints ─────────────────────────────────────────────────
  app.post("/api/admin/scrub", async (req, res) => {
    try {
      const { module } = req.body as { module: string };
      const { db } = await import("./db");
      const { sql } = await import("drizzle-orm");

      switch (module) {
        case "studies":
          await db.execute(sql`TRUNCATE TABLE pull_test_completions, test_results, investigations, samples, time_points, stability_studies RESTART IDENTITY CASCADE`);
          break;
        case "investigations":
          await db.execute(sql`TRUNCATE TABLE investigations RESTART IDENTITY CASCADE`);
          break;
        case "excursions":
          await db.execute(sql`TRUNCATE TABLE chamber_excursions RESTART IDENTITY CASCADE`);
          await db.execute(sql`UPDATE chambers SET status = 'active' WHERE status = 'excursion'`);
          break;
        case "audit_logs":
          await db.execute(sql`TRUNCATE TABLE audit_logs RESTART IDENTITY CASCADE`);
          break;
        case "notifications":
          await db.execute(sql`TRUNCATE TABLE notifications RESTART IDENTITY CASCADE`);
          break;
        case "test_log":
          await db.execute(sql`TRUNCATE TABLE pull_test_completions RESTART IDENTITY CASCADE`);
          break;
        case "monthly_reports":
          await db.execute(sql`TRUNCATE TABLE monthly_report_notes, monthly_signoffs RESTART IDENTITY CASCADE`);
          break;
        default:
          return res.status(400).json({ ok: false, message: `Unknown module: ${module}` });
      }

      res.json({ ok: true, message: `${module} cleared successfully.` });
    } catch (e: any) {
      res.status(500).json({ ok: false, message: e.message });
    }
  });

  // Auth (simple for now)
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      (req as any).session = (req as any).session || {};
      (req as any).session.userId = user.id;
      res.json({ user: { ...user, password: undefined } });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // Dashboard
  app.get("/api/dashboard/stats", async (_req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // Users
  app.get("/api/users", async (_req, res) => {
    try {
      const result = await storage.listUsers();
      res.json(result.map(u => ({ ...u, password: undefined })));
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });
  app.post("/api/users", async (req, res) => {
    try {
      const body = { ...req.body };
      if (!body.email || body.email.trim() === "") {
        body.email = `${body.username}@stabilityflow.local`;
      }
      const data = insertUserSchema.parse(body);
      const user = await storage.createUser(data);
      res.json({ ...user, password: undefined });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });
  app.patch("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.updateUser(req.params.id, req.body);
      res.json({ ...user, password: undefined });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });
  app.delete("/api/users/:id", async (req, res) => {
    try {
      await storage.deleteUser(req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  // Storage Conditions
  app.get("/api/storage-conditions", async (_req, res) => {
    try {
      res.json(await storage.listStorageConditions());
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });
  app.post("/api/storage-conditions", async (req, res) => {
    try {
      const data = insertStorageConditionSchema.parse(req.body);
      res.json(await storage.createStorageCondition(data));
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });
  app.patch("/api/storage-conditions/:id", async (req, res) => {
    try {
      res.json(await storage.updateStorageCondition(req.params.id, req.body));
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });
  app.delete("/api/storage-conditions/:id", async (req, res) => {
    try {
      await storage.deleteStorageCondition(req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  // Chambers
  app.get("/api/chambers", async (_req, res) => {
    try {
      res.json(await storage.listChambers());
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });
  app.get("/api/chambers/:id", async (req, res) => {
    try {
      const c = await storage.getChamber(req.params.id);
      if (!c) return res.status(404).json({ message: "Not found" });
      res.json(c);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });
  app.post("/api/chambers", async (req, res) => {
    try {
      const data = insertChamberSchema.parse(req.body);
      res.json(await storage.createChamber(data));
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });
  app.patch("/api/chambers/:id", async (req, res) => {
    try {
      res.json(await storage.updateChamber(req.params.id, req.body));
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });
  app.delete("/api/chambers/:id", async (req, res) => {
    try {
      await storage.deleteChamber(req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  // Products
  app.get("/api/products", async (_req, res) => {
    try {
      res.json(await storage.listProducts());
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });
  app.get("/api/products/:id", async (req, res) => {
    try {
      const p = await storage.getProduct(req.params.id);
      if (!p) return res.status(404).json({ message: "Not found" });
      res.json(p);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });
  app.post("/api/products", async (req, res) => {
    try {
      const data = insertProductSchema.parse(req.body);
      res.json(await storage.createProduct(data));
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });
  app.patch("/api/products/:id", async (req, res) => {
    try {
      res.json(await storage.updateProduct(req.params.id, req.body));
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });
  app.delete("/api/products/:id", async (req, res) => {
    try {
      await storage.deleteProduct(req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  // Test Specifications
  app.get("/api/test-specifications", async (req, res) => {
    try {
      const { productId } = req.query;
      res.json(await storage.listTestSpecifications(productId as string | undefined));
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });
  app.post("/api/test-specifications", async (req, res) => {
    try {
      const data = insertTestSpecSchema.parse(req.body);
      res.json(await storage.createTestSpecification(data));
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });
  app.patch("/api/test-specifications/:id", async (req, res) => {
    try {
      res.json(await storage.updateTestSpecification(req.params.id, req.body));
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });
  app.delete("/api/test-specifications/:id", async (req, res) => {
    try {
      await storage.deleteTestSpecification(req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  // ICH Matrix
  app.get("/api/ich-matrix", async (_req, res) => {
    try {
      res.json(await storage.getIchMatrixData());
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // Studies
  app.get("/api/studies", async (_req, res) => {
    try {
      res.json(await storage.listStudies());
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });
  app.get("/api/studies/:id", async (req, res) => {
    try {
      const s = await storage.getStudy(req.params.id);
      if (!s) return res.status(404).json({ message: "Not found" });
      res.json(s);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });
  app.post("/api/studies", async (req, res) => {
    try {
      const data = insertStudySchema.parse(req.body);
      const study = await storage.createStudy(data);
      // Auto-generate time points based on study type
      const intervals = getIntervalsForStudyType(study.studyType);
      const startDate = new Date(study.startDate);

      // Determine base date for pull date calculation:
      // 40°C/75% accelerated condition → base date = startDate (date placed in chamber)
      // All other conditions            → base date = manufacturingDate (fallback to startDate)
      const allConditions = await storage.listStorageConditions();
      const studyCondition = allConditions.find(c => c.id === study.conditionId);
      const isAccelerated = studyCondition
        ? studyCondition.temperature >= 38 && studyCondition.temperature <= 42 &&
          (studyCondition.humidity == null || (studyCondition.humidity >= 70 && studyCondition.humidity <= 80))
        : false;
      const baseDate = isAccelerated
        ? startDate
        : (study.manufacturingDate ? new Date(study.manufacturingDate) : startDate);

      for (const months of intervals) {
        const plannedDate = new Date(baseDate);
        plannedDate.setMonth(plannedDate.getMonth() + months);
        const now = new Date();
        let status: "pending" | "due" | "overdue" = "pending";
        if (plannedDate <= now) status = "overdue";
        else if (plannedDate <= new Date(now.getTime() + 7 * 86400000)) status = "due";
        await storage.createTimePoint({
          studyId: study.id,
          intervalMonths: months,
          label: months === 0 ? "T0 (Initial)" : `T${months}`,
          plannedDate,
          status,
          priority: months === 0 ? "high" : "medium",
        });
      }
      await storage.createAuditLog({
        entityType: "study",
        entityId: study.id,
        action: "create",
        description: `Created stability study ${study.studyNumber}`,
      });
      res.json(study);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });
  app.patch("/api/studies/:id", async (req, res) => {
    try {
      res.json(await storage.updateStudy(req.params.id, req.body));
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });
  app.delete("/api/studies/:id", async (req, res) => {
    try {
      await storage.deleteStudy(req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  // Time Points
  app.get("/api/time-points", async (req, res) => {
    try {
      const { studyId } = req.query;
      res.json(await storage.listTimePoints(studyId as string | undefined));
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });
  app.get("/api/time-points/upcoming", async (req, res) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      res.json(await storage.getUpcomingPulls(days));
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });
  app.get("/api/time-points/overdue", async (_req, res) => {
    try {
      res.json(await storage.getOverduePulls());
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });
  app.post("/api/time-points", async (req, res) => {
    try {
      const data = insertTimePointSchema.parse(req.body);
      res.json(await storage.createTimePoint(data));
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });
  app.patch("/api/time-points/:id", async (req, res) => {
    try {
      // Enforce: cannot set in_progress before the planned pull date
      if (req.body.status === "in_progress") {
        const tp = await storage.getTimePoint(req.params.id);
        if (!tp) return res.status(404).json({ message: "Time point not found" });
        const plannedDate = new Date(tp.plannedDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (plannedDate > today) {
          return res.status(400).json({
            message: `Cannot start pull before the planned date (${plannedDate.toISOString().slice(0, 10)}). Pull is not due until that date.`,
          });
        }
      }
      const body = { ...req.body };
      if (body.actualDate) body.actualDate = new Date(body.actualDate);
      if (body.plannedDate) body.plannedDate = new Date(body.plannedDate);
      res.json(await storage.updateTimePoint(req.params.id, body));
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });
  app.delete("/api/time-points/:id", async (req, res) => {
    try {
      await storage.deleteTimePoint(req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  // Samples
  app.get("/api/samples/view", async (_req, res) => {
    try {
      res.json(await storage.getSamplesView());
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });
  app.get("/api/samples", async (req, res) => {
    try {
      const { studyId } = req.query;
      res.json(await storage.listSamples(studyId as string | undefined));
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });
  app.post("/api/samples", async (req, res) => {
    try {
      const data = insertSampleSchema.parse(req.body);
      res.json(await storage.createSample(data));
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });
  app.patch("/api/samples/:id", async (req, res) => {
    try {
      res.json(await storage.updateSample(req.params.id, req.body));
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });
  app.delete("/api/samples/:id", async (req, res) => {
    try {
      await storage.deleteSample(req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  // Test Results
  app.get("/api/results", async (req, res) => {
    try {
      const { studyId, timePointId } = req.query;
      res.json(await storage.listResults(studyId as string, timePointId as string));
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });
  app.post("/api/results", async (req, res) => {
    try {
      const data = insertResultSchema.parse(req.body);
      const result = await storage.createResult({ ...data, enteredAt: new Date() });
      // Auto-evaluate
      const evaluation = await storage.evaluateResult(result.id);
      // OOS/OOT auto-investigation removed — flag samples directly in Sample Register
      const updated = await storage.getResult(result.id);
      res.json(updated);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });
  app.patch("/api/results/:id", async (req, res) => {
    try {
      const result = await storage.updateResult(req.params.id, req.body);
      if (req.body.value !== undefined) {
        await storage.evaluateResult(req.params.id);
        return res.json(await storage.getResult(req.params.id));
      }
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  // Investigations module removed — OOS/OOT flagging done via Sample Register

  // Chamber Excursions
  app.get("/api/excursions", async (_req, res) => {
    try {
      res.json(await storage.listExcursions());
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });
  app.get("/api/excursions/:id", async (req, res) => {
    try {
      const e = await storage.getExcursion(req.params.id);
      if (!e) return res.status(404).json({ message: "Not found" });
      res.json(e);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });
  app.post("/api/excursions", async (req, res) => {
    try {
      const data = insertExcursionSchema.parse(req.body);
      const excursion = await storage.createExcursion(data);
      // Flag chamber as in excursion
      if (data.chamberId) {
        await storage.updateChamber(data.chamberId, { status: "excursion" });
      }
      res.json(excursion);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });
  app.patch("/api/excursions/:id", async (req, res) => {
    try {
      const excursion = await storage.updateExcursion(req.params.id, req.body);
      // If resolved, restore chamber
      if (req.body.status === "resolved" && excursion.chamberId) {
        await storage.updateChamber(excursion.chamberId, { status: "operational" });
      }
      res.json(excursion);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });
  app.delete("/api/excursions/:id", async (req, res) => {
    try {
      await storage.deleteExcursion(req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  // Audit Logs
  app.get("/api/audit-logs", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      res.json(await storage.listAuditLogs(limit));
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // Notifications
  app.get("/api/notifications/:userId", async (req, res) => {
    try {
      res.json(await storage.listNotifications(req.params.userId));
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });
  app.post("/api/notifications/sync/:userId", async (req, res) => {
    try {
      await storage.syncNotifications(req.params.userId);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });
  app.patch("/api/notifications/:id/read", async (req, res) => {
    try {
      await storage.markNotificationRead(req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });
  app.patch("/api/notifications/user/:userId/read-all", async (req, res) => {
    try {
      await storage.markAllNotificationsRead(req.params.userId);
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });
  app.delete("/api/notifications/:id", async (req, res) => {
    try {
      await storage.deleteNotification(req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });
  app.delete("/api/notifications/user/:userId/all", async (req, res) => {
    try {
      await storage.deleteAllNotifications(req.params.userId);
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  // Master (unified) Import
  app.post("/api/import/master", async (req, res) => {
    try {
      const rows = req.body as any[];
      if (!Array.isArray(rows) || !rows.length) return res.status(400).json({ message: "Expected non-empty array of records" });
      const result = await storage.importMasterData(rows);
      if (result.errors.length > 0) {
        console.error(`[import/master] ${result.errors.length} errors. First 5:`);
        result.errors.slice(0, 5).forEach(e => console.error(" ", e));
      }
      res.json(result);
    } catch (e: any) {
      console.error("[import/master] fatal:", e.message);
      res.status(400).json({ message: e.message });
    }
  });

  // Bulk Import Routes
  app.post("/api/import/products", async (req, res) => {
    try {
      const rows = req.body as any[];
      if (!Array.isArray(rows)) return res.status(400).json({ message: "Expected array of records" });
      const count = await storage.bulkCreateProducts(rows);
      res.json({ imported: count, total: rows.length });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });
  app.post("/api/import/test-specifications", async (req, res) => {
    try {
      const rows = req.body as any[];
      if (!Array.isArray(rows)) return res.status(400).json({ message: "Expected array of records" });
      const count = await storage.bulkCreateTestSpecs(rows);
      res.json({ imported: count, total: rows.length });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });
  app.post("/api/import/studies", async (req, res) => {
    try {
      const rows = req.body as any[];
      if (!Array.isArray(rows)) return res.status(400).json({ message: "Expected array of records" });
      const count = await storage.bulkCreateStudies(rows);
      res.json({ imported: count, total: rows.length });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });
  app.post("/api/import/samples", async (req, res) => {
    try {
      const rows = req.body as any[];
      if (!Array.isArray(rows)) return res.status(400).json({ message: "Expected array of records" });
      const count = await storage.bulkCreateSamples(rows);
      res.json({ imported: count, total: rows.length });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  // Export Routes (returns JSON — frontend converts to CSV)
  app.get("/api/export/products", async (_req, res) => {
    try { res.json(await storage.listProducts()); } catch (e: any) { res.status(500).json({ message: e.message }); }
  });
  app.get("/api/export/test-specifications", async (_req, res) => {
    try { res.json(await storage.listTestSpecifications()); } catch (e: any) { res.status(500).json({ message: e.message }); }
  });
  // ── Sample Register ────────────────────────────────────────────────────────
  app.get("/api/register", async (_req, res) => {
    try { res.json(await storage.listRegisterItems()); }
    catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.post("/api/register", async (req, res) => {
    try { res.json(await storage.createRegisterEntry(req.body)); }
    catch (e: any) { res.status(400).json({ message: e.message }); }
  });

  app.patch("/api/register/:studyId", async (req, res) => {
    try { res.json(await storage.updateRegisterEntry(req.params.studyId, req.body)); }
    catch (e: any) { res.status(400).json({ message: e.message }); }
  });

  // Register Excel export
  app.get("/api/register/export", async (_req, res) => {
    try {
      const XLSX = await import("xlsx");
      const items = await storage.listRegisterItems();
      const data = items.map((r: any) => ({
        Product: r.product || "",
        Batch: r.batch || "",
        Strength: r.strength || "",
        Condition: r.conditionCode || "",
        Chamber: r.chamber || "",
        "Start Date": r.startDate ? new Date(r.startDate).toISOString().slice(0, 10) : "",
        "Intervals (months csv)": r.intervalsMonthsCsv || String(r.intervalMonths),
        Container: r.container || "",
        "MNF Date": r.mnfDate ? new Date(r.mnfDate).toISOString().slice(0, 10) : "",
        "Packed Date": r.packedDate ? new Date(r.packedDate).toISOString().slice(0, 10) : "",
        "Pack Size": r.packSize || "",
        "Protocol Ref": r.protocolRef || "",
        "Test Plan": r.testPlan || "",
        "Time Point": r.label || "",
        "Planned Date": r.plannedDate ? new Date(r.plannedDate).toISOString().slice(0, 10) : "",
        Status: r.status || "",
      }));
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, "Register");
      const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="stability-register-${Date.now()}.xlsx"`);
      res.send(buf);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // Register Excel export template
  app.get("/api/register/template", async (_req, res) => {
    try {
      const XLSX = await import("xlsx");
      const headers = ["Product","Batch","Strength","Condition","Chamber","Start Date","Intervals (months csv)","Container","MNF Date","Packed Date","Pack Size","Protocol Ref","Test Plan","Actual Date Complete"];
      const example = [{
        Product: "Paracetamol 500mg Tabs", Batch: "B12345", Strength: "500mg",
        Condition: "40°C/75%", Chamber: "ACC-01",
        "Start Date": new Date().toISOString().slice(0, 10),
        "Intervals (months csv)": "0,3,6,9,12,18,24",
        Container: "Blister", "MNF Date": new Date(Date.now() - 30*86400000).toISOString().slice(0, 10),
        "Packed Date": new Date(Date.now() - 20*86400000).toISOString().slice(0, 10),
        "Pack Size": "30 tabs", "Protocol Ref": "STAB/PROT/2025-001",
        "Test Plan": "Assay,Dissolution,Related Substances,Appearance",
        "Actual Date Complete": "",
      }];
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(example, { header: headers });
      XLSX.utils.book_append_sheet(wb, ws, "StabilityImport");
      const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", 'attachment; filename="stability-import-template.xlsx"');
      res.send(buf);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // Register Excel import
  const multer = (await import("multer")).default;
  const upload = multer({ storage: multer.memoryStorage() });
  app.post("/api/register/import", upload.single("file"), async (req: any, res) => {
    try {
      const XLSX = await import("xlsx");
      const buf = req.file?.buffer;
      if (!buf) return res.status(400).json({ message: "No file uploaded" });
      const wb = XLSX.read(buf, { type: "buffer", cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { raw: false });
      const result = await storage.importRegisterData(rows);
      res.json(result);
    } catch (e: any) { res.status(400).json({ message: e.message }); }
  });

  // Bulk time-point status update import
  app.post("/api/register/import-timepoints", async (req, res) => {
    try {
      const { rows } = req.body;
      if (!Array.isArray(rows) || rows.length === 0) return res.status(400).json({ message: "No rows provided" });
      const result = await storage.bulkUpdateTimePoints(rows);
      res.json(result);
    } catch (e: any) { res.status(400).json({ message: e.message }); }
  });

  // Time-point update template download
  app.get("/api/register/timepoints-template", async (_req, res) => {
    try {
      const XLSX = await import("xlsx");
      const example = [{
        "Study Number": "STAB-2024-001",
        "Batch": "B12345",
        "Time Point": "T3 (3 months)",
        "Status": "completed",
        "Actual Date": "2024-03-15",
        "OOS/OOT Flag": "",
        "OOS/OOT Note": "",
      }];
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(example);
      XLSX.utils.book_append_sheet(wb, ws, "TimePointUpdate");
      const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", 'attachment; filename="timepoint-update-template.xlsx"');
      res.send(buf);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // ── OOS/OOT Flags ───────────────────────────────────────────────────────
  app.get("/api/oos-oot-flags", async (_req, res) => {
    try { res.json(await storage.listOosOotFlags()); }
    catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // ── Pull Test Completions ────────────────────────────────────────────────
  app.get("/api/test-log", async (_req, res) => {
    try { res.json(await storage.listTestLog()); }
    catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.get("/api/test-completions/:timePointId", async (req, res) => {
    try { res.json(await storage.getTestCompletions(req.params.timePointId)); }
    catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.post("/api/test-completions", async (req, res) => {
    try { res.json(await storage.addTestCompletion(req.body)); }
    catch (e: any) { res.status(400).json({ message: e.message }); }
  });

  app.patch("/api/test-completions/:id", async (req, res) => {
    try { res.json(await storage.updateTestCompletion(req.params.id, req.body)); }
    catch (e: any) { res.status(400).json({ message: e.message }); }
  });

  app.delete("/api/test-completions/:id", async (req, res) => {
    try { await storage.removeTestCompletion(req.params.id); res.json({ success: true }); }
    catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // ── PDF print page ────────────────────────────────────────────────────────
  app.get("/api/report-print", async (req, res) => {
    try {
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
      const data = await storage.getMonthlyReport(year, month);
      const html = generateReportHTML(data, year, month);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(html);
    } catch (e: any) { res.status(500).send(`<pre>Error: ${e.message}</pre>`); }
  });

  // ── Monthly Reports & Sign-offs ─────────────────────────────────────────
  app.get("/api/monthly-report", async (req, res) => {
    try {
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
      res.json(await storage.getMonthlyReport(year, month));
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.get("/api/monthly-report-notes", async (req, res) => {
    try {
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
      res.json(await storage.getMonthlyReportNotes(year, month));
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.put("/api/monthly-report-notes", async (req, res) => {
    try {
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
      res.json(await storage.upsertMonthlyReportNotes(year, month, req.body));
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.get("/api/monthly-signoffs", async (req, res) => {
    try {
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
      res.json(await storage.getMonthlySignoffs(year, month));
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.post("/api/monthly-signoffs", async (req, res) => {
    try { res.json(await storage.createMonthlySignoff(req.body)); }
    catch (e: any) { res.status(400).json({ message: e.message }); }
  });

  app.get("/api/export/studies", async (_req, res) => {
    try { res.json(await storage.listStudies()); } catch (e: any) { res.status(500).json({ message: e.message }); }
  });
  app.get("/api/export/samples", async (_req, res) => {
    try { res.json(await storage.getSamplesView()); } catch (e: any) { res.status(500).json({ message: e.message }); }
  });
  app.get("/api/export/conditions", async (_req, res) => {
    try { res.json(await storage.listStorageConditions()); } catch (e: any) { res.status(500).json({ message: e.message }); }
  });
  app.get("/api/export/chambers", async (_req, res) => {
    try { res.json(await storage.listChambers()); } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  return httpServer;
}

function getIntervalsForStudyType(studyType: string): number[] {
  switch (studyType) {
    case "long_term":
      return [0, 3, 6, 9, 12, 18, 24, 36, 48, 60];
    case "accelerated":
      return [0, 1, 2, 3, 6];
    case "intermediate":
      return [0, 3, 6, 9, 12];
    case "stress":
      return [0, 1, 2, 4, 8];
    case "photostability":
      return [0, 1];
    case "freeze_thaw":
      return [0, 1, 2, 3, 5];
    default:
      return [0, 3, 6, 12, 24];
  }
}
