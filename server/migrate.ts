import { db } from "./db";
import { sql } from "drizzle-orm";

export async function runMigrations() {
  try {
    await db.execute(sql`
      -- Enums (safe to run repeatedly)
      DO $$ BEGIN
        CREATE TYPE user_role AS ENUM ('admin','analyst','reviewer','section_head','manager');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
      DO $$ BEGIN
        CREATE TYPE study_type AS ENUM ('long_term','accelerated','intermediate','stress','photostability','freeze_thaw');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
      DO $$ BEGIN
        CREATE TYPE study_status AS ENUM ('draft','active','on_hold','completed','discontinued');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
      DO $$ BEGIN
        CREATE TYPE time_point_status AS ENUM ('pending','due','overdue','in_progress','completed','cancelled');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
      DO $$ BEGIN
        CREATE TYPE sample_status AS ENUM ('stored','in_testing','tested','destroyed','lost');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
      DO $$ BEGIN
        CREATE TYPE result_status AS ENUM ('pending','entered','oos_suspected','oot_suspected','passed','failed','voided');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
      DO $$ BEGIN
        CREATE TYPE investigation_type AS ENUM ('oos','oot','critical_trend');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
      DO $$ BEGIN
        CREATE TYPE investigation_status AS ENUM ('open','phase1','phase2','closed','invalidated');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
      DO $$ BEGIN
        CREATE TYPE chamber_status AS ENUM ('operational','excursion','maintenance','offline');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
      DO $$ BEGIN
        CREATE TYPE excursion_status AS ENUM ('active','resolved','under_review');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
      DO $$ BEGIN
        CREATE TYPE audit_action AS ENUM ('create','update','delete','approve','reject','login','logout');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
      DO $$ BEGIN
        CREATE TYPE priority AS ENUM ('low','medium','high','critical');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;

      -- Base tables
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        full_name TEXT NOT NULL,
        email TEXT NOT NULL,
        role user_role NOT NULL DEFAULT 'analyst',
        department TEXT,
        active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS storage_conditions (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        code TEXT NOT NULL UNIQUE,
        label TEXT NOT NULL,
        temperature REAL NOT NULL,
        humidity REAL,
        description TEXT,
        ich_zone TEXT
      );

      CREATE TABLE IF NOT EXISTS chambers (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        condition_id VARCHAR REFERENCES storage_conditions(id),
        location TEXT,
        capacity INTEGER,
        status chamber_status NOT NULL DEFAULT 'operational',
        last_calibrated_at TIMESTAMP,
        next_calibration_due TIMESTAMP,
        notes TEXT
      );

      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        code TEXT NOT NULL UNIQUE,
        strength TEXT,
        dosage_form TEXT,
        manufacturer TEXT,
        shelf_life_months INTEGER,
        reorder_period_months INTEGER,
        active BOOLEAN NOT NULL DEFAULT true,
        notes TEXT
      );

      CREATE TABLE IF NOT EXISTS test_specifications (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id VARCHAR REFERENCES products(id),
        test_name TEXT NOT NULL,
        method_number TEXT,
        specification_number TEXT,
        unit TEXT,
        spec_min REAL,
        spec_max REAL,
        alert_min REAL,
        alert_max REAL,
        oot_criteria_percent REAL,
        instrument_type TEXT,
        category TEXT
      );

      CREATE TABLE IF NOT EXISTS stability_studies (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        study_number TEXT NOT NULL UNIQUE,
        product_id VARCHAR REFERENCES products(id),
        batch_number TEXT NOT NULL,
        study_type study_type NOT NULL,
        status study_status NOT NULL DEFAULT 'draft',
        start_date TIMESTAMP NOT NULL,
        planned_end_date TIMESTAMP,
        condition_id VARCHAR REFERENCES storage_conditions(id),
        chamber_id VARCHAR REFERENCES chambers(id),
        protocol_number TEXT,
        analyst_id VARCHAR REFERENCES users(id),
        reviewer_id VARCHAR REFERENCES users(id),
        initial_quantity INTEGER,
        container_type TEXT,
        manufacturing_date TIMESTAMP,
        packed_date TIMESTAMP,
        expiry_date TIMESTAMP,
        strength TEXT,
        dosage_form TEXT,
        package_size TEXT,
        test_plan TEXT,
        intervals_months_csv TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS time_points (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        study_id VARCHAR REFERENCES stability_studies(id),
        interval_months INTEGER NOT NULL,
        label TEXT NOT NULL,
        planned_date TIMESTAMP NOT NULL,
        actual_date TIMESTAMP,
        status time_point_status NOT NULL DEFAULT 'pending',
        priority priority NOT NULL DEFAULT 'medium',
        assigned_analyst_id VARCHAR REFERENCES users(id),
        notes TEXT,
        oos_oot_flag TEXT,
        oos_oot_note TEXT,
        was_overdue BOOLEAN DEFAULT false
      );

      CREATE TABLE IF NOT EXISTS samples (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        study_id VARCHAR REFERENCES stability_studies(id),
        time_point_id VARCHAR REFERENCES time_points(id),
        chamber_id VARCHAR REFERENCES chambers(id),
        barcode TEXT UNIQUE,
        shelf TEXT,
        position TEXT,
        quantity_placed INTEGER,
        quantity_remaining INTEGER,
        quantity_used INTEGER DEFAULT 0,
        quantity_destroyed INTEGER DEFAULT 0,
        number_of_containers INTEGER,
        quantity_per_container INTEGER,
        manufacturing_date TIMESTAMP,
        expiry_date TIMESTAMP,
        orientation_in_chamber TEXT,
        container_closure_system TEXT,
        status sample_status NOT NULL DEFAULT 'stored',
        on_hold BOOLEAN DEFAULT false,
        hold_reason TEXT,
        placed_at TIMESTAMP,
        pulled_at TIMESTAMP,
        pulled_by_id VARCHAR REFERENCES users(id),
        witness_id VARCHAR REFERENCES users(id),
        notes TEXT
      );

      CREATE TABLE IF NOT EXISTS test_results (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        sample_id VARCHAR REFERENCES samples(id),
        test_spec_id VARCHAR REFERENCES test_specifications(id),
        study_id VARCHAR REFERENCES stability_studies(id),
        time_point_id VARCHAR REFERENCES time_points(id),
        analyst_id VARCHAR REFERENCES users(id),
        value REAL,
        value_text TEXT,
        status result_status NOT NULL DEFAULT 'pending',
        entered_at TIMESTAMP,
        reviewed_at TIMESTAMP,
        reviewed_by_id VARCHAR REFERENCES users(id),
        instrument_id TEXT,
        notes TEXT,
        auto_flagged BOOLEAN DEFAULT false,
        flag_reason TEXT
      );

      CREATE TABLE IF NOT EXISTS investigations (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        investigation_number TEXT NOT NULL UNIQUE,
        type investigation_type NOT NULL,
        status investigation_status NOT NULL DEFAULT 'open',
        result_id VARCHAR REFERENCES test_results(id),
        study_id VARCHAR REFERENCES stability_studies(id),
        product_id VARCHAR REFERENCES products(id),
        batch_number TEXT,
        test_name TEXT,
        condition TEXT,
        time_point TEXT,
        value REAL,
        spec_limit TEXT,
        assigned_to_id VARCHAR REFERENCES users(id),
        created_by_id VARCHAR REFERENCES users(id),
        description TEXT,
        phase1_conclusion TEXT,
        phase2_conclusion TEXT,
        root_cause TEXT,
        capa_reference TEXT,
        closed_at TIMESTAMP,
        due_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS chamber_excursions (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        excursion_number TEXT NOT NULL UNIQUE,
        chamber_id VARCHAR REFERENCES chambers(id),
        status excursion_status NOT NULL DEFAULT 'active',
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP,
        min_temp REAL,
        max_temp REAL,
        min_humidity REAL,
        max_humidity REAL,
        affected_studies_count INTEGER DEFAULT 0,
        reported_by_id VARCHAR REFERENCES users(id),
        reviewed_by_id VARCHAR REFERENCES users(id),
        impact_assessment TEXT,
        corrected_action TEXT,
        place_samples_on_hold BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        entity_type TEXT NOT NULL,
        entity_id TEXT,
        action audit_action NOT NULL,
        user_id VARCHAR REFERENCES users(id),
        description TEXT,
        old_value TEXT,
        new_value TEXT,
        ip_address TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR REFERENCES users(id),
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT,
        read BOOLEAN DEFAULT false,
        entity_type TEXT,
        entity_id TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS pull_test_completions (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        time_point_id VARCHAR NOT NULL REFERENCES time_points(id) ON DELETE CASCADE,
        test_name TEXT NOT NULL,
        completed_by_name TEXT,
        completed_by_id VARCHAR REFERENCES users(id),
        completed_at TIMESTAMP NOT NULL DEFAULT NOW(),
        oos_oot_flag TEXT,
        oos_oot_note TEXT
      );

      CREATE TABLE IF NOT EXISTS monthly_signoffs (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        period_year INTEGER NOT NULL,
        period_month INTEGER NOT NULL,
        role_label TEXT NOT NULL,
        signed_by_name TEXT NOT NULL,
        signed_by_id VARCHAR REFERENCES users(id),
        signed_at TIMESTAMP NOT NULL DEFAULT NOW(),
        comment TEXT
      );

      CREATE TABLE IF NOT EXISTS monthly_report_notes (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        period_year INTEGER NOT NULL,
        period_month INTEGER NOT NULL,
        content TEXT,
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Safe column additions for existing databases
      ALTER TABLE stability_studies ADD COLUMN IF NOT EXISTS test_plan TEXT;
      ALTER TABLE stability_studies ADD COLUMN IF NOT EXISTS intervals_months_csv TEXT;
      ALTER TABLE stability_studies ADD COLUMN IF NOT EXISTS packed_date TIMESTAMP;
      ALTER TABLE time_points ADD COLUMN IF NOT EXISTS oos_oot_flag TEXT;
      ALTER TABLE time_points ADD COLUMN IF NOT EXISTS oos_oot_note TEXT;
      ALTER TABLE time_points ADD COLUMN IF NOT EXISTS was_overdue BOOLEAN DEFAULT false;
      ALTER TABLE pull_test_completions ADD COLUMN IF NOT EXISTS oos_oot_flag TEXT;
      ALTER TABLE pull_test_completions ADD COLUMN IF NOT EXISTS oos_oot_note TEXT;
    `);
    console.log("[migrate] Migrations applied.");
  } catch (err) {
    console.error("[migrate] Migration error:", err);
  }
}
