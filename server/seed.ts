import { db } from "./db";
import {
  users, products, storageConditions, chambers, testSpecifications,
  stabilityStudies, timePoints, samples, testResults, investigations, chamberExcursions,
} from "@shared/schema";

export async function seedDatabase() {
  try {
    const existingUsers = await db.select().from(users).limit(1);
    if (existingUsers.length > 0) {
      console.log("[seed] Already seeded, skipping.");
      return;
    }

    console.log("[seed] Seeding with one sample...");

    // ── Users ──────────────────────────────────────────────────────────────
    const [admin, analyst, reviewer] = await db.insert(users).values([
      { username: "admin", password: "admin123", fullName: "System Administrator", email: "admin@stabilityflow.com", role: "admin", department: "Quality Systems" },
      { username: "analyst1", password: "pass123", fullName: "Dr. Jane Smith", email: "jane.smith@stabilityflow.com", role: "analyst", department: "Analytical Chemistry" },
      { username: "reviewer1", password: "pass123", fullName: "Dr. Sarah Chen", email: "sarah.chen@stabilityflow.com", role: "reviewer", department: "Quality Assurance" },
    ]).returning();

    // ── Storage Conditions ─────────────────────────────────────────────────
    const [cond25, cond40] = await db.insert(storageConditions).values([
      { code: "25C/60RH", label: "25°C / 60% RH (Long-Term)", temperature: 25, humidity: 60, description: "ICH Zone II Long-Term", ichZone: "II" },
      { code: "40C/75RH", label: "40°C / 75% RH (Accelerated)", temperature: 40, humidity: 75, description: "ICH Accelerated", ichZone: "II" },
    ]).returning();

    // ── Chamber ────────────────────────────────────────────────────────────
    const [chamber] = await db.insert(chambers).values([
      { name: "LT-01", conditionId: cond25.id, location: "Lab A, Unit 1", capacity: 200, status: "operational", lastCalibratedAt: new Date("2026-01-15"), nextCalibrationDue: new Date("2026-07-15") },
    ]).returning();

    // ── Product ────────────────────────────────────────────────────────────
    const [product] = await db.insert(products).values([
      { name: "Amoxicillin Trihydrate", code: "AMX-500", strength: "500mg", dosageForm: "Capsule", manufacturer: "PharmaCo Ltd", shelfLifeMonths: 36, reorderPeriodMonths: 24, active: true },
    ]).returning();

    // ── Test Specifications ────────────────────────────────────────────────
    const [spec] = await db.insert(testSpecifications).values([
      { productId: product.id, testName: "Assay", methodNumber: "M-AMX-001", specificationNumber: "SP-AMX-001", unit: "%", specMin: 90, specMax: 110, alertMin: 93, alertMax: 107, ootCriteriaPercent: 5, instrumentType: "HPLC", category: "Chemical" },
    ]).returning();

    // ── Stability Study ────────────────────────────────────────────────────
    const startDate = new Date("2025-03-01");
    const mfgDate = new Date("2025-01-15");

    const [study] = await db.insert(stabilityStudies).values([
      {
        studyNumber: "STAB-2025-001",
        productId: product.id,
        batchNumber: "AMX-B001",
        studyType: "long_term",
        status: "active",
        startDate,
        manufacturingDate: mfgDate,
        plannedEndDate: new Date("2030-03-01"),
        conditionId: cond25.id,
        chamberId: chamber.id,
        protocolNumber: "PROT-LT-001",
        analystId: analyst.id,
        reviewerId: reviewer.id,
        initialQuantity: 120,
        containerType: "HDPE Bottle",
      },
    ]).returning();

    // ── Time Points (T0 completed, T3 in-progress, T6 upcoming) ───────────
    const now = new Date();
    const makeDate = (months: number) => {
      const d = new Date(mfgDate);
      d.setMonth(d.getMonth() + months);
      return d;
    };

    const [tp0, tp3, tp6] = await db.insert(timePoints).values([
      { studyId: study.id, intervalMonths: 0,  label: "T0 (Initial)", plannedDate: makeDate(0),  status: "completed",   priority: "high",   assignedAnalystId: analyst.id, actualDate: makeDate(0) },
      { studyId: study.id, intervalMonths: 3,  label: "T3",           plannedDate: makeDate(3),  status: "completed",   priority: "high",   assignedAnalystId: analyst.id, actualDate: makeDate(3) },
      { studyId: study.id, intervalMonths: 6,  label: "T6",           plannedDate: makeDate(6),  status: "in_progress", priority: "high",   assignedAnalystId: analyst.id },
      { studyId: study.id, intervalMonths: 12, label: "T12",          plannedDate: makeDate(12), status: "pending",     priority: "medium", assignedAnalystId: analyst.id },
      { studyId: study.id, intervalMonths: 24, label: "T24",          plannedDate: makeDate(24), status: "pending",     priority: "medium", assignedAnalystId: analyst.id },
    ]).returning();

    // ── Sample (one, linked to T0) ─────────────────────────────────────────
    const [sample] = await db.insert(samples).values([
      {
        studyId: study.id,
        timePointId: tp0.id,
        chamberId: chamber.id,
        barcode: "AMX-B001-T0-001",
        quantityPlaced: 30,
        quantityRemaining: 24,
        quantityUsed: 6,
        status: "tested",
        placedAt: startDate,
        pulledAt: makeDate(0),
        pulledById: analyst.id,
      },
    ]).returning();

    // ── Test Result (one, for that sample) ────────────────────────────────
    await db.insert(testResults).values([
      {
        sampleId: sample.id,
        testSpecId: spec.id,
        studyId: study.id,
        timePointId: tp0.id,
        analystId: analyst.id,
        value: 101.2,
        status: "passed",
        enteredAt: makeDate(0),
        autoFlagged: false,
      },
    ]);

    console.log("[seed] One-sample seed complete.");
  } catch (error) {
    console.error("[seed] Error seeding database:", error);
  }
}
