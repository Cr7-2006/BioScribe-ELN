import http from 'http';
import { dbManager } from '../config/db';
import { seedDatabase } from '../models/seed';
import express from 'express';
import cors from 'cors';
import apiRouter from '../routes/api';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', apiRouter);

async function runTests() {
  console.log('🧪 Starting BioScribe ELN Automated Verification Test Suite...\n');

  await dbManager.init();
  await seedDatabase();

  const server = http.createServer(app);
  const testPort = 5999;

  await new Promise<void>((resolve) => {
    server.listen(testPort, () => {
      console.log(`📡 Test server running on http://localhost:${testPort}`);
      resolve();
    });
  });

  const baseUrl = `http://localhost:${testPort}/api`;
  let authToken = '';

  try {
    // 1. Auth Test
    console.log('1️⃣  Testing Authentication & JWT issuance...');
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'kamalesh@bioscribe.io', password: 'Password123!' }),
    });
    const loginData = await loginRes.json();
    if (!loginRes.ok || !loginData.token) throw new Error('Auth failed: ' + JSON.stringify(loginData));
    authToken = loginData.token;
    console.log(`   ✅ Logged in as: ${loginData.user.name} (${loginData.user.role})`);

    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    };

    // 2. Metrics Test
    console.log('2️⃣  Testing System Telemetry & Regulatory Compliance Metrics...');
    const statsRes = await fetch(`${baseUrl}/stats`, { headers: authHeaders });
    const statsData = await statsRes.json();
    if (!statsRes.ok) throw new Error('Stats endpoint failed');
    console.log(`   ✅ Metrics verified. Experiments: ${statsData.metrics.totalExperiments}, Standard: ${statsData.system.complianceStandard}`);

    // 3. Experiment Creation Test
    console.log('3️⃣  Testing Experiment Registration with SHA-256 Version 1.0...');
    const createExpRes = await fetch(`${baseUrl}/experiments`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        projectCode: 'PRJ-ONC-01',
        title: 'Automated Test: Binding Kinetics of BSC-900',
        objective: 'Measure nanomolar binding affinity via automated testing harness',
        hypothesis: 'Apparent KD is within target threshold < 10 nM',
        protocolSteps: [
          {
            stepNumber: 1,
            title: 'Chip Sensor Equilibration',
            instruction: 'Equilibrate with running buffer at 25°C for 20 minutes',
            durationMinutes: 20,
            temperatureCelsius: 25,
            criticalQualityAttribute: true,
          },
        ],
      }),
    });
    const expData = await createExpRes.json();
    if (!createExpRes.ok) throw new Error('Create experiment failed: ' + JSON.stringify(expData));
    const testExpId = expData.experiment.id;
    console.log(`   ✅ Experiment created: ${expData.experiment.experimentNumber} (v${expData.currentVersion.versionNumber})`);
    console.log(`   ✅ SHA-256 Fingerprint: ${expData.currentVersion.hashSha256}`);

    // 4. Revision Commit Test
    console.log('4️⃣  Testing Protocol Revision Commitment (v1.1)...');
    const commitRes = await fetch(`${baseUrl}/experiments/${testExpId}/versions`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        bumpType: 'minor',
        changeSummary: 'Added Step 2 analyte dissociation phase and flow calibration',
        protocolSteps: [
          {
            stepNumber: 1,
            title: 'Chip Sensor Equilibration',
            instruction: 'Equilibrate with running buffer at 25°C for 20 minutes',
            durationMinutes: 20,
            temperatureCelsius: 25,
            criticalQualityAttribute: true,
          },
          {
            stepNumber: 2,
            title: 'Dissociation Monitoring',
            instruction: 'Wash surface for 600s with buffer at 30 µL/min',
            durationMinutes: 10,
            temperatureCelsius: 25,
            criticalQualityAttribute: false,
          },
        ],
        conclusion: 'Dissociation curve verified linear with negligible baseline drift.',
      }),
    });
    const commitData = await commitRes.json();
    if (!commitRes.ok) throw new Error('Commit revision failed: ' + JSON.stringify(commitData));
    console.log(`   ✅ Revision committed: Version ${commitData.version.versionNumber}`);
    console.log(`   ✅ New SHA-256 Hash: ${commitData.version.hashSha256}`);

    // 5. Version Diff Test
    console.log('5️⃣  Testing Version Diff Inspector...');
    const diffRes = await fetch(
      `${baseUrl}/experiments/${testExpId}/diff?v1=${expData.currentVersion.id}&v2=${commitData.version.id}`,
      { headers: authHeaders }
    );
    const diffData = await diffRes.json();
    if (!diffRes.ok || !diffData.stepsDiff) throw new Error('Diff failed: ' + JSON.stringify(diffData));
    console.log(`   ✅ Diff computed: Found ${diffData.stepsDiff.length} steps in comparison. Step 2 status: ${diffData.stepsDiff[1]?.status}`);

    // 6. Observations Test
    console.log('6️⃣  Testing Real-Time Observation Logging...');
    const obsRes = await fetch(`${baseUrl}/experiments/${testExpId}/observations`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        category: 'spectroscopy',
        parameter: 'Equilibrium Dissociation Constant (KD)',
        value: 4.85,
        unit: 'nM',
        status: 'normal',
        notes: 'High affinity confirmed by Langmuir 1:1 fitting.',
      }),
    });
    const obsData = await obsRes.json();
    if (!obsRes.ok) throw new Error('Log observation failed: ' + JSON.stringify(obsData));
    console.log(`   ✅ Observation logged: ${obsData.observation.parameter} = ${obsData.observation.value} ${obsData.observation.unit}`);

    // 7. Formulations Stoichiometry & Batch Scaling Test
    console.log('7️⃣  Testing Stoichiometry & Batch Scaling Calculator...');
    const scaleRes = await fetch(`${baseUrl}/formulations/calculate`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        currentBatchSize: 1000,
        newBatchSize: 5000,
        batchUnit: 'mL',
        ingredients: [
          {
            id: 'ing-test-1',
            name: 'Tris Base',
            casNumber: '77-86-1',
            lotNumber: 'LOT-T1',
            molecularWeight: 121.14,
            purityPercentage: 99.8,
            targetQuantity: 6.057,
            unit: 'g',
            role: 'buffer',
            hazards: [],
          },
        ],
      }),
    });
    const scaleData = await scaleRes.json();
    if (!scaleRes.ok) throw new Error('Batch scale calculation failed');
    console.log(`   ✅ Scaling verified: Scaled to ${scaleData.scaledBatchSize} mL. Scaled quantity: ${scaleData.ingredients[0].targetQuantity} g (Molarity: ${scaleData.ingredients[0].calculatedConcentration})`);

    // 8. Formulation Input Validation Edge Cases
    console.log('8️⃣  Testing Formulation Input Validation (Negative Batch Size Rejection)...');
    const invalidScaleRes = await fetch(`${baseUrl}/formulations/calculate`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        currentBatchSize: 1000,
        newBatchSize: -500,
        batchUnit: 'mL',
        ingredients: [],
      }),
    });
    if (invalidScaleRes.status !== 400) {
      throw new Error(`Expected status 400 for negative batch size, got ${invalidScaleRes.status}`);
    }
    console.log('   ✅ Input validation confirmed: Negative batch size correctly rejected with HTTP 400.');

    // 9. Request QA Release Approval Routed to Dr. Subbu
    console.log('9️⃣  Testing QA Release Approval Routing to Dr. Subbu...');
    const reqApprovalRes = await fetch(`${baseUrl}/approvals/request`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        experimentId: testExpId,
        reviewerId: 'usr-sarah', // Dr. Subbu
        role: 'qa_compliance',
        reason: 'Automated release testing sign-off for QA release.',
      }),
    });
    const approvalReqData = await reqApprovalRes.json();
    if (!reqApprovalRes.ok) throw new Error('Request approval failed: ' + JSON.stringify(approvalReqData));
    const approvalId = approvalReqData.approval.id;
    console.log(`   ✅ Approval request routed: ID ${approvalId} [Role: ${approvalReqData.approval.role}]`);

    // 10. RBAC Segregation of Duties Enforcement (Dr. Kamalesh cannot sign QA release)
    console.log('🔟 Testing RBAC Segregation of Duties (Researcher cannot sign QA release)...');
    const unauthorizedSignRes = await fetch(`${baseUrl}/approvals/${approvalId}/sign`, {
      method: 'POST',
      headers: authHeaders, // Dr. Kamalesh (researcher)
      body: JSON.stringify({
        password: 'Password123!',
        decision: 'approve',
        signatureReason: 'Researcher attempting to sign QA release without QA credentials.',
      }),
    });
    if (unauthorizedSignRes.status !== 403) {
      throw new Error(`Expected HTTP 403 Forbidden for unauthorized QA sign-off, got ${unauthorizedSignRes.status}`);
    }
    console.log('   ✅ RBAC segregation enforced: Researcher attempt to execute QA release rejected with HTTP 403.');

    // 11. 21 CFR Part 11 Electronic Signature Invalid Password Challenge
    console.log('1️⃣1️⃣ Testing 21 CFR Part 11 Electronic Signature Password Challenge...');
    const qaLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'subbu@bioscribe.io', password: 'Password123!' }),
    });
    const qaLoginData = await qaLoginRes.json();
    if (!qaLoginRes.ok || !qaLoginData.token) throw new Error('QA login failed: ' + JSON.stringify(qaLoginData));
    const qaAuthHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${qaLoginData.token}`,
    };

    const badPasswordSignRes = await fetch(`${baseUrl}/approvals/${approvalId}/sign`, {
      method: 'POST',
      headers: qaAuthHeaders,
      body: JSON.stringify({
        password: 'WrongPassword!',
        decision: 'approve',
        signatureReason: 'Formal verification of GLP compliance.',
      }),
    });
    if (badPasswordSignRes.status !== 401) {
      throw new Error(`Expected HTTP 401 for incorrect signature password, got ${badPasswordSignRes.status}`);
    }
    console.log('   ✅ 21 CFR Part 11 Challenge verified: Incorrect signature password strictly rejected with HTTP 401.');

    // 12. 21 CFR Part 11 Legitimate Electronic Signature Execution
    console.log('1️⃣2️⃣ Testing Legitimate 21 CFR Part 11 Electronic Signature Ceremony...');
    const validSignRes = await fetch(`${baseUrl}/approvals/${approvalId}/sign`, {
      method: 'POST',
      headers: qaAuthHeaders,
      body: JSON.stringify({
        password: 'Password123!',
        decision: 'approve',
        signatureReason: 'Formal verification of GLP compliance and data integrity.',
        comments: 'Certified and released by Head of QA.',
      }),
    });
    const validSignData = await validSignRes.json();
    if (!validSignRes.ok || !validSignData.approval.signatureDigest) {
      throw new Error('Electronic signature failed: ' + JSON.stringify(validSignData));
    }
    console.log('   ✅ 21 CFR Part 11 Ceremony Successful!');
    console.log(`   ✅ Signer: ${validSignData.approval.reviewerName} | Digest: ${validSignData.approval.signatureDigest}`);
    console.log(`   ✅ Record State: Experiment status updated to "${validSignData.experiment.status}"`);

    // 13. Immutable Record Locking Verification
    console.log('1️⃣3️⃣ Testing Immutable Record Locking (Modifying locked experiment rejected)...');
    const mutateLockedRes = await fetch(`${baseUrl}/experiments/${testExpId}/versions`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        bumpType: 'minor',
        changeSummary: 'Attempting illegal modification to an approved record.',
        protocolSteps: [],
      }),
    });
    if (mutateLockedRes.status !== 400) {
      throw new Error(`Expected HTTP 400 for modifying approved experiment, got ${mutateLockedRes.status}`);
    }
    console.log('   ✅ Immutable Lock confirmed: Post-approval revision rejected with HTTP 400.');

    // 14. Tamper-Evident Regulatory Audit Trail Integrity Test
    console.log('1️⃣4️⃣ Testing Immutable Regulatory Audit Trail SHA-256 Checksums...');
    const auditRes = await fetch(`${baseUrl}/audit-trail`, { headers: authHeaders });
    const auditData = await auditRes.json();
    if (!auditRes.ok || !auditData.allIntegrityValid) {
      throw new Error('Audit trail integrity check failed! Total logs: ' + auditData.totalCount);
    }
    console.log(`   ✅ Audit trail verified: All ${auditData.totalCount} events verified with 100% valid SHA-256 checksums!`);

    console.log('\n===============================================================');
    console.log('🎉 ALL 14 FULL-SPECTRUM QA VERIFICATION TESTS PASSED (100%)! 🎉');
    console.log('===============================================================\n');
  } finally {
    server.close();
  }
}

runTests()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Verification test failed:', err);
    process.exit(1);
  });
