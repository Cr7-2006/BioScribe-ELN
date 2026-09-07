import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import {
  User,
  Project,
  Experiment,
  ExperimentVersion,
  Observation,
  Formulation,
  Approval,
  AuditLog
} from '../types';

export interface DatabaseState {
  users: User[];
  projects: Project[];
  experiments: Experiment[];
  experimentVersions: ExperimentVersion[];
  observations: Observation[];
  formulations: Formulation[];
  approvals: Approval[];
  auditLogs: AuditLog[];
}

class DatabaseManager {
  private pgPool: Pool | null = null;
  private isPostgresActive = false;
  private localDataPath: string;
  private state: DatabaseState = {
    users: [],
    projects: [],
    experiments: [],
    experimentVersions: [],
    observations: [],
    formulations: [],
    approvals: [],
    auditLogs: []
  };

  constructor() {
    const dataDir = path.resolve(__dirname, '../../data');
    if (!fs.existsSync(dataDir)) {
      try {
        fs.mkdirSync(dataDir, { recursive: true });
      } catch {
        // ignore
      }
    }
    this.localDataPath = path.join(dataDir, 'bioscribe_db.json');
    this.loadLocalData();
  }

  private loadLocalData() {
    if (fs.existsSync(this.localDataPath)) {
      try {
        const raw = fs.readFileSync(this.localDataPath, 'utf8');
        this.state = JSON.parse(raw);
        return;
      } catch (err) {
        console.error('Failed to parse local database file, using empty state:', err);
      }
    }
  }

  public saveLocalData() {
    try {
      fs.writeFileSync(this.localDataPath, JSON.stringify(this.state, null, 2), 'utf8');
    } catch (err) {
      console.error('Failed to write local database file:', err);
    }
  }

  async init(): Promise<void> {
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl) {
      try {
        this.pgPool = new Pool({
          connectionString: dbUrl,
          connectionTimeoutMillis: 3000,
        });

        const client = await this.pgPool.connect();
        await client.query('SELECT NOW()');
        client.release();

        this.isPostgresActive = true;
        console.log('✅ Connected to PostgreSQL database successfully');
        await this.runPgMigrations();
        return;
      } catch (err) {
        console.log('⚠️ PostgreSQL connection failed, switching to Resilient Local Data Store');
        this.isPostgresActive = false;
      }
    } else {
      console.log('ℹ️ No DATABASE_URL specified. Running with Resilient Local Data Store');
    }
  }

  private async runPgMigrations() {
    if (!this.pgPool) return;
    const migrationSql = `
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        role VARCHAR(32) NOT NULL,
        department VARCHAR(255) NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS projects (
        id VARCHAR(64) PRIMARY KEY,
        code VARCHAR(32) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        therapeutic_area VARCHAR(128),
        lead_id VARCHAR(64),
        lead_name VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS experiments (
        id VARCHAR(64) PRIMARY KEY,
        project_code VARCHAR(32) NOT NULL,
        experiment_number VARCHAR(64) UNIQUE NOT NULL,
        title VARCHAR(255) NOT NULL,
        objective TEXT,
        hypothesis TEXT,
        status VARCHAR(32) NOT NULL,
        current_version_id VARCHAR(64),
        current_version_number VARCHAR(32),
        author_id VARCHAR(64) NOT NULL,
        author_name VARCHAR(255) NOT NULL,
        formulation_id VARCHAR(64),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS experiment_versions (
        id VARCHAR(64) PRIMARY KEY,
        experiment_id VARCHAR(64) REFERENCES experiments(id) ON DELETE CASCADE,
        version_number VARCHAR(32) NOT NULL,
        title VARCHAR(255) NOT NULL,
        objective TEXT,
        hypothesis TEXT,
        protocol_steps JSONB NOT NULL DEFAULT '[]',
        conclusion TEXT,
        author_id VARCHAR(64) NOT NULL,
        author_name VARCHAR(255) NOT NULL,
        change_summary TEXT NOT NULL,
        hash_sha256 VARCHAR(64) NOT NULL,
        is_locked BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS observations (
        id VARCHAR(64) PRIMARY KEY,
        experiment_id VARCHAR(64) REFERENCES experiments(id) ON DELETE CASCADE,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        recorded_by_id VARCHAR(64) NOT NULL,
        recorded_by_name VARCHAR(255) NOT NULL,
        category VARCHAR(64) NOT NULL,
        parameter VARCHAR(128) NOT NULL,
        value TEXT NOT NULL,
        unit VARCHAR(32),
        status VARCHAR(32) DEFAULT 'normal',
        notes TEXT,
        raw_data_json JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS formulations (
        id VARCHAR(64) PRIMARY KEY,
        code VARCHAR(32) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        target_batch_size NUMERIC NOT NULL,
        batch_unit VARCHAR(16) NOT NULL,
        theoretical_yield_percentage NUMERIC DEFAULT 100,
        actual_yield_percentage NUMERIC,
        author_id VARCHAR(64) NOT NULL,
        author_name VARCHAR(255) NOT NULL,
        ingredients JSONB NOT NULL DEFAULT '[]',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS approvals (
        id VARCHAR(64) PRIMARY KEY,
        experiment_id VARCHAR(64) REFERENCES experiments(id) ON DELETE CASCADE,
        experiment_title VARCHAR(255) NOT NULL,
        experiment_number VARCHAR(64) NOT NULL,
        version_id VARCHAR(64) NOT NULL,
        version_number VARCHAR(32) NOT NULL,
        requester_id VARCHAR(64) NOT NULL,
        requester_name VARCHAR(255) NOT NULL,
        reviewer_id VARCHAR(64),
        reviewer_name VARCHAR(255),
        role VARCHAR(64) NOT NULL,
        status VARCHAR(32) NOT NULL,
        signature_reason TEXT NOT NULL,
        signature_digest VARCHAR(64),
        comments TEXT,
        signed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(64) PRIMARY KEY,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        user_id VARCHAR(64) NOT NULL,
        user_name VARCHAR(255) NOT NULL,
        user_role VARCHAR(32) NOT NULL,
        action VARCHAR(64) NOT NULL,
        entity_type VARCHAR(64) NOT NULL,
        entity_id VARCHAR(64) NOT NULL,
        details TEXT NOT NULL,
        metadata JSONB,
        checksum VARCHAR(64) NOT NULL
      );
    `;

    try {
      await this.pgPool.query(migrationSql);
      console.log('✅ PostgreSQL migrations executed successfully');
    } catch (e) {
      console.error('PostgreSQL migration error:', e);
    }
  }

  // State accessor
  get db(): DatabaseState {
    return this.state;
  }

  get isPostgres(): boolean {
    return this.isPostgresActive;
  }

  get pool(): Pool | null {
    return this.pgPool;
  }
}

export const dbManager = new DatabaseManager();
