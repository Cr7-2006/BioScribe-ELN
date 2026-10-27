import mongoose from 'mongoose';
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
  AuditLog,
} from '../types';
import {
  UserModel,
  ProjectModel,
  ExperimentModel,
  ExperimentVersionModel,
  ObservationModel,
  FormulationModel,
  ApprovalModel,
  AuditLogModel,
} from '../models';

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
  private isMongoConnected = false;
  private localDataPath: string;
  private state: DatabaseState = {
    users: [],
    projects: [],
    experiments: [],
    experimentVersions: [],
    observations: [],
    formulations: [],
    approvals: [],
    auditLogs: [],
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
      // If MongoDB is connected, also mirror state to MongoDB in background
      if (this.isMongoConnected) {
        this.syncStateToMongo().catch((e) => {
          console.error('Background MongoDB sync error:', e);
        });
      }
    } catch (err) {
      console.error('Failed to write local database file:', err);
    }
  }

  async init(): Promise<void> {
    const mongoUri =
      process.env.MONGODB_URI ||
      process.env.MONGO_URL ||
      'mongodb://127.0.0.1:27017/bioscribe_eln';

    try {
      console.log(`🔌 Attempting connection to MongoDB at: ${mongoUri.replace(/:([^:@]+)@/, ':****@')}`);
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 3000,
        connectTimeoutMS: 3000,
      });

      this.isMongoConnected = true;
      console.log('✅ Connected to MongoDB database successfully (MERN Stack: MongoDB 7.0 + Mongoose)');

      // Synchronize database records between MongoDB and memory state
      await this.syncWithMongoOnStartup();
    } catch (err: any) {
      this.isMongoConnected = false;
      console.log('⚠️ MongoDB connection could not be established:', err.message || err);
      console.log('🔄 Running in Resilient Local Store Mode (Full offline MERN compatibility)');
    }
  }

  private async syncWithMongoOnStartup() {
    if (!this.isMongoConnected) return;

    try {
      const userCount = await UserModel.countDocuments();
      if (userCount > 0) {
        // MongoDB has records; populate in-memory state from MongoDB collections
        console.log(`📦 Loading initial state from MongoDB (${userCount} users found)...`);
        await this.syncMongoToState();
      } else if (this.state.users && this.state.users.length > 0) {
        // MongoDB is brand new; migrate pre-existing local data into MongoDB
        console.log('📤 Migrating pre-existing local dataset into MongoDB collections...');
        await this.syncStateToMongo();
      }
    } catch (error) {
      console.error('Error during startup MongoDB state synchronization:', error);
    }
  }

  public async syncMongoToState(): Promise<void> {
    if (!this.isMongoConnected) return;

    const [users, projects, experiments, experimentVersions, observations, formulations, approvals, auditLogs] =
      await Promise.all([
        UserModel.find().lean(),
        ProjectModel.find().lean(),
        ExperimentModel.find().lean(),
        ExperimentVersionModel.find().lean(),
        ObservationModel.find().lean(),
        FormulationModel.find().lean(),
        ApprovalModel.find().lean(),
        AuditLogModel.find().lean(),
      ]);

    this.state.users = (users as any[]).map(this.cleanDoc);
    this.state.projects = (projects as any[]).map(this.cleanDoc);
    this.state.experiments = (experiments as any[]).map(this.cleanDoc);
    this.state.experimentVersions = (experimentVersions as any[]).map(this.cleanDoc);
    this.state.observations = (observations as any[]).map(this.cleanDoc);
    this.state.formulations = (formulations as any[]).map(this.cleanDoc);
    this.state.approvals = (approvals as any[]).map(this.cleanDoc);
    this.state.auditLogs = (auditLogs as any[]).map(this.cleanDoc);
  }

  public async syncStateToMongo(): Promise<void> {
    if (!this.isMongoConnected) return;

    try {
      const ops = [
        ...this.state.users.map((u) => UserModel.updateOne({ id: u.id }, { $set: u }, { upsert: true })),
        ...this.state.projects.map((p) => ProjectModel.updateOne({ id: p.id }, { $set: p }, { upsert: true })),
        ...this.state.experiments.map((e) => ExperimentModel.updateOne({ id: e.id }, { $set: e }, { upsert: true })),
        ...this.state.experimentVersions.map((v) =>
          ExperimentVersionModel.updateOne({ id: v.id }, { $set: v }, { upsert: true })
        ),
        ...this.state.observations.map((o) =>
          ObservationModel.updateOne({ id: o.id }, { $set: o }, { upsert: true })
        ),
        ...this.state.formulations.map((f) =>
          FormulationModel.updateOne({ id: f.id }, { $set: f }, { upsert: true })
        ),
        ...this.state.approvals.map((a) => ApprovalModel.updateOne({ id: a.id }, { $set: a }, { upsert: true })),
        ...this.state.auditLogs.map((l) => AuditLogModel.updateOne({ id: l.id }, { $set: l }, { upsert: true })),
      ];

      await Promise.all(ops);
    } catch (err) {
      console.error('Failed to sync state to MongoDB:', err);
    }
  }

  private cleanDoc(doc: any): any {
    if (!doc) return doc;
    const { _id, __v, ...rest } = doc;
    return rest;
  }

  // Accessors
  get db(): DatabaseState {
    return this.state;
  }

  get isMongo(): boolean {
    return this.isMongoConnected;
  }

  get isPostgres(): boolean {
    // Kept as backward compatibility getter
    return false;
  }

  get mongoose() {
    return mongoose;
  }
}

export const dbManager = new DatabaseManager();
