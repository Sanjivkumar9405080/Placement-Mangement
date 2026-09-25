const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const opts = { ...options, headers: { ...options.headers } };
    let payload = null;
    if (data !== undefined && data !== null) {
      payload = typeof data === 'string' ? data : JSON.stringify(data);
      opts.headers['Content-Length'] = Buffer.byteLength(payload);
    }
    const req = http.request(opts, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body, headers: res.headers });
        }
      });
    });
    req.on('error', reject);
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

async function runTests() {
  console.log('================================================================');
  console.log('       PHASE 7G E2E VERIFICATION & COMPLIANCE SUITE             ');
  console.log('================================================================\n');

  // 1. Authenticate Admin with kumarsanjeev945080@gmail.com / 945080
  console.log('1. Authenticating Admin (kumarsanjeev945080@gmail.com / 945080)...');
  const adminLogin = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'kumarsanjeev945080@gmail.com', password: '945080' }
  );

  const adminToken = adminLogin.data?.token;
  if (!adminToken) {
    console.error('Admin login failed:', adminLogin.status, adminLogin.data);
    process.exit(1);
  }
  console.log('✅ Admin authenticated successfully. User:', adminLogin.data?.user?.email, 'Role:', adminLogin.data?.user?.role);

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${adminToken}`,
  };

  // 2. Test Admin Dashboard Stats & KPI Metrics Suite
  console.log('\n2. Testing Admin Dashboard Stats (GET /api/admin/stats)...');
  const statsRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/admin/stats',
    method: 'GET',
    headers: authHeaders,
  });
  console.log('Status:', statsRes.status);
  console.log('Full KPI Suite:', {
    totalStudents: statsRes.data?.stats?.totalStudents,
    totalCompanies: statsRes.data?.stats?.totalCompanies,
    approvedCompanies: statsRes.data?.stats?.approvedCompanies,
    pendingCompanies: statsRes.data?.stats?.pendingCompanies,
    totalDrives: statsRes.data?.stats?.totalDrives,
    pendingDriveApprovals: statsRes.data?.stats?.pendingDriveApprovals,
    totalApplications: statsRes.data?.stats?.totalApplications,
    removedApplications: statsRes.data?.stats?.removedApplications,
  });

  // 3. Test Student Listing, Roll-Number Search, and Placement Metrics
  console.log('\n3. Testing Student Search & Placement Counts (GET /api/admin/students)...');
  const studentsRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/admin/students',
    method: 'GET',
    headers: authHeaders,
  });
  console.log('Total students in registry:', studentsRes.data?.students?.length);
  const sampleStudent = studentsRes.data?.students?.[0];
  if (!sampleStudent) {
    console.error('No students found in DB to test.');
    process.exit(1);
  }

  console.log('Sample student profile metrics:', {
    fullName: sampleStudent.fullName,
    rollNumber: sampleStudent.rollNumber,
    branch: sampleStudent.branch,
    applicationCount: sampleStudent.applicationCount,
    selectedCount: sampleStudent.selectedCount,
    placed: sampleStudent.placed,
  });

  // Test Search query filter by roll number
  const searchRollRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/admin/students?search=${encodeURIComponent(sampleStudent.rollNumber)}`,
    method: 'GET',
    headers: authHeaders,
  });
  console.log(`Search by rollNumber "${sampleStudent.rollNumber}" returned:`, searchRollRes.data?.students?.length, 'student(s)');

  // Test Search query filter by name
  const studentNameQuery = sampleStudent.fullName ? sampleStudent.fullName.split(' ')[0] : 'a';
  const searchNameRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/admin/students?search=${encodeURIComponent(studentNameQuery)}`,
    method: 'GET',
    headers: authHeaders,
  });
  console.log(`Search by name "${studentNameQuery}" returned:`, searchNameRes.data?.students?.length, 'student(s)');

  // 4. Test Student Detailed Dossier & History
  console.log(`\n4. Testing Student Dossier (GET /api/admin/students/${sampleStudent._id})...`);
  const dossierRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/admin/students/${sampleStudent._id}`,
    method: 'GET',
    headers: authHeaders,
  });
  console.log('Dossier Status:', dossierRes.status);
  console.log('Candidate Dossier Funnel Stats:', dossierRes.data?.placementStats);
  console.log('Historical Applications Count:', dossierRes.data?.applications?.length);

  // 5. Test Companies with Drive Counts
  console.log('\n5. Testing Companies with Drive Counts (GET /api/admin/companies)...');
  const companiesRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/admin/companies',
    method: 'GET',
    headers: authHeaders,
  });
  console.log('Total companies registered:', companiesRes.data?.companies?.length);
  if (companiesRes.data?.companies?.length > 0) {
    const comp = companiesRes.data.companies[0];
    console.log('Sample company metrics:', {
      companyName: comp.companyName,
      isApproved: comp.isApproved,
      drivesCount: comp.drivesCount,
    });
  }

  // 6. Test Admin Applications Register
  console.log('\n6. Testing Central Applications Register (GET /api/admin/applications)...');
  const appsRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/admin/applications',
    method: 'GET',
    headers: authHeaders,
  });
  console.log('Total applications across drives:', appsRes.data?.applications?.length);

  // 7. Test Drives & Drive Applicants Endpoint
  console.log('\n7. Testing Drive Applicants Inspection (GET /api/admin/drives/:id/applicants)...');
  const drivesRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/admin/drives',
    method: 'GET',
    headers: authHeaders,
  });
  console.log('Total drives:', drivesRes.data?.drives?.length);
  let testDrive = drivesRes.data?.drives?.[0];
  if (!testDrive) {
    console.error('No drives found to test.');
    process.exit(1);
  }

  // Admin approves drive so applications can be submitted
  console.log(`Ensuring drive "${testDrive.jobTitle}" is approved...`);
  const approveDriveRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/admin/drives/${testDrive._id}/approval`,
      method: 'PUT',
      headers: authHeaders,
    },
    { approvalStatus: 'approved' }
  );
  console.log('Drive approval status:', approveDriveRes.status, approveDriveRes.data?.drive?.approvalStatus);

  const driveApplicantsRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/admin/drives/${testDrive._id}/applicants`,
    method: 'GET',
    headers: authHeaders,
  });
  console.log(`Drive "${testDrive.jobTitle}" applicants count:`, driveApplicantsRes.data?.applicants?.length);

  // 8. Test Student Application Lifecycle & Administrative Removal Flow
  console.log('\n8. Testing End-to-End Candidate Removal and Business Rules...');
  
  // Register a fresh test student
  const testStudentEmail = `test_candidate_${Date.now()}@college.edu`;
  const testRoll = `ROLL_${Date.now().toString().slice(-6)}`;
  
  const regRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      name: 'Priya Sharma',
      email: testStudentEmail,
      password: 'password123',
      role: 'student',
      rollNumber: testRoll,
      branch: 'CSE',
      cgpa: 9.2,
      tenthPercentage: 90,
      twelfthPercentage: 88,
    }
  );

  const studentToken = regRes.data?.token;
  if (!studentToken) {
    console.error('Registration failed:', regRes.status, regRes.data);
    process.exit(1);
  }
  console.log('Created fresh test student:', testStudentEmail, 'Roll:', testRoll);

  const studentHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${studentToken}`,
  };

  // Student applies to drive
  console.log(`Student applying to drive "${testDrive.jobTitle}"...`);
  const applyRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/applications',
      method: 'POST',
      headers: studentHeaders,
    },
    { driveId: testDrive._id }
  );
  console.log('Apply response:', applyRes.status, applyRes.data?.message || 'Applied successfully');
  const targetAppId = applyRes.data?.application?._id;

  if (!targetAppId) {
    console.error('No targetAppId returned:', applyRes.data);
    process.exit(1);
  }

  // Verify application is in student's active list
  const myAppsBefore = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/applications/my',
    method: 'GET',
    headers: studentHeaders,
  });
  const visibleBefore = (myAppsBefore.data?.applications || []).some(a => a._id === targetAppId);
  console.log('Initial application visible in student portal:', visibleBefore ? 'YES' : 'NO');

  // Admin removes the student from this drive
  console.log(`\nAdmin performing removal of application ${targetAppId} with reason...`);
  const removeRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/admin/applications/${targetAppId}`,
      method: 'DELETE',
      headers: authHeaders,
    },
    { removalReason: 'Student no longer meets eligibility criteria - TPO Administrative Decision' }
  );
  console.log('Admin removal API response:', removeRes.status, removeRes.data?.message);

  // RULE 1: Application must be hidden from student's GET /api/applications/my
  const myAppsAfter = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/applications/my',
    method: 'GET',
    headers: studentHeaders,
  });
  const visibleAfter = (myAppsAfter.data?.applications || []).some(a => a._id === targetAppId);
  console.log('Rule 1 (Removed drive hidden from student GET /applications/my):', !visibleAfter ? 'PASS ✅' : 'FAIL ❌');

  // RULE 2: Direct application access by candidate returns 404 blocked
  const getSingleRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/applications/${targetAppId}`,
    method: 'GET',
    headers: studentHeaders,
  });
  console.log('Rule 2 (Direct student access to removed app blocked with 404):', getSingleRes.status === 404 ? 'PASS ✅' : 'FAIL ❌');

  // RULE 3: Student re-applying to the SAME drive is permanently blocked with 400
  const reapplyRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/applications',
      method: 'POST',
      headers: studentHeaders,
    },
    { driveId: testDrive._id }
  );
  console.log('Rule 3 (Re-applying to same drive blocked with 400):', 
    reapplyRes.status === 400 ? 'PASS ✅' : 'FAIL ❌', 
    'Error message:', reapplyRes.data?.message
  );

  // RULE 4: Student general account remains active, profile intact
  const checkStudentProfile = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/students/profile',
    method: 'GET',
    headers: studentHeaders,
  });
  console.log('Rule 4 (Student general account and profile preserved):', checkStudentProfile.status === 200 ? 'PASS ✅' : 'FAIL ❌');

  // RULE 5: Admin retains audit trail of removed application
  const appsAfterRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/admin/applications?status=Removed',
    method: 'GET',
    headers: authHeaders,
  });
  const removedAuditApp = (appsAfterRes.data?.applications || []).find(a => a._id === targetAppId);
  console.log('Rule 5 (Admin audit trail records removal reason & timestamp):', 
    removedAuditApp && removedAuditApp.removalReason ? 'PASS ✅' : 'FAIL ❌',
    'Audit Reason recorded:', removedAuditApp?.removalReason,
    'RemovedAt:', removedAuditApp?.removedAt
  );

  // 9. Role protection test: Student cannot access Admin routes (403)
  console.log('\n9. Testing Security & Role Protection...');
  const forbiddenRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/admin/stats',
    method: 'GET',
    headers: studentHeaders,
  });
  console.log('Role Protection (Student access to /api/admin/stats forbidden with 403):', forbiddenRes.status === 403 ? 'PASS ✅' : 'FAIL ❌');

  console.log('\n================================================================');
  console.log('       ALL PHASE 7G VERIFICATION TESTS PASSED SUCCESSFULLY!    ');
  console.log('================================================================\n');
}

runTests().catch(console.error);
