/**
 * SEED SCRIPT — Run this once to populate your CLIENT PORTAL Firebase
 * with realistic CA compliance dummy data.
 *
 * HOW TO RUN:
 *   1. npm install -g firebase-tools
 *   2. firebase login
 *   3. node seed.js
 *
 * OR paste it into your Firebase console Cloud Functions shell.
 *
 * This creates:
 *  - /clients/{id}  — 3 sample clients
 *  - /tasks/{id}    — ~30 compliance tasks across GST / IT / TDS
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            "AIzaSyBDRjN75nxRw1BFOBy6gesEElRxDLLdEcw",
  authDomain:        "client-tracking-portal-85242.firebaseapp.com",
  projectId:         "client-tracking-portal-85242",
  storageBucket:     "client-tracking-portal-85242.firebasestorage.app",
  messagingSenderId: "229469076962",
  appId:             "1:229469076962:web:6d47b8234ae5443fa44dbb",
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

// ── Helper ──────────────────────────────────────────────────
const ts = (y, m, d) => Timestamp.fromDate(new Date(y, m - 1, d));

// ── Clients ─────────────────────────────────────────────────
const CLIENTS = [
  {
    name:  'Rajesh Sharma',
    email: 'rajesh.sharma@example.com',  // ← change to real client email
    pan:   'ABCPS1234D',
    gstin: '27ABCPS1234D1Z5',
    phone: '9876543210',
    type:  'Individual',
  },
  {
    name:  'Priya Enterprises',
    email: 'priya@priyaenterprises.in',  // ← change to real client email
    pan:   'AACCP5678F',
    gstin: '27AACCP5678F1Z3',
    phone: '9876500001',
    type:  'Partnership',
  },
  {
    name:  'Mehta & Sons Pvt Ltd',
    email: 'accounts@mehtasons.com',     // ← change to real client email
    pan:   'AAFCM4321G',
    gstin: '27AAFCM4321G1ZK',
    phone: '9876500002',
    type:  'Private Limited',
  },
];

// ── Task templates ───────────────────────────────────────────
function makeTasks(clientEmail) {
  return [
    // GST
    { type: 'GST', description: 'GSTR-3B Filing', period: 'Apr 2025', dueDate: ts(2025, 5, 20), filedDate: ts(2025, 5, 18), status: 'completed',   clientEmail },
    { type: 'GST', description: 'GSTR-3B Filing', period: 'May 2025', dueDate: ts(2025, 6, 20), filedDate: ts(2025, 6, 22), status: 'completed',   clientEmail },
    { type: 'GST', description: 'GSTR-3B Filing', period: 'Jun 2025', dueDate: ts(2025, 7, 20), filedDate: null,           status: 'overdue',     clientEmail },
    { type: 'GST', description: 'GSTR-3B Filing', period: 'Jul 2025', dueDate: ts(2025, 8, 20), filedDate: null,           status: 'pending',     clientEmail },
    { type: 'GST', description: 'GSTR-1 Filing',  period: 'Q1 2025',  dueDate: ts(2025, 7, 11), filedDate: ts(2025, 7, 10), status: 'completed',  clientEmail },
    { type: 'GST', description: 'GSTR-1 Filing',  period: 'Q2 2025',  dueDate: ts(2025,10, 11), filedDate: null,            status: 'pending',    clientEmail },
    { type: 'GST', description: 'GSTR-9 Annual',  period: 'FY 24-25', dueDate: ts(2025,12, 31), filedDate: null,            status: 'pending',    clientEmail },

    // Income Tax
    { type: 'IT', description: 'Advance Tax - Q1',      period: 'Q1 FY25',  dueDate: ts(2025, 6, 15), filedDate: ts(2025, 6, 14), status: 'completed', clientEmail },
    { type: 'IT', description: 'Advance Tax - Q2',      period: 'Q2 FY25',  dueDate: ts(2025, 9, 15), filedDate: ts(2025, 9, 20), status: 'completed', clientEmail },
    { type: 'IT', description: 'Advance Tax - Q3',      period: 'Q3 FY25',  dueDate: ts(2025,12, 15), filedDate: null,            status: 'in-progress', clientEmail },
    { type: 'IT', description: 'ITR Filing',            period: 'FY 24-25', dueDate: ts(2025, 7, 31), filedDate: null,            status: 'pending',   clientEmail },
    { type: 'IT', description: 'Tax Audit (Sec 44AB)',  period: 'FY 24-25', dueDate: ts(2025,10, 31), filedDate: null,            status: 'pending',   clientEmail },

    // TDS
    { type: 'TDS', description: 'TDS Return 26Q',  period: 'Q1 FY25',  dueDate: ts(2025, 7, 31), filedDate: ts(2025, 7, 28), status: 'completed',   clientEmail },
    { type: 'TDS', description: 'TDS Return 26Q',  period: 'Q2 FY25',  dueDate: ts(2025,10, 31), filedDate: null,            status: 'in-progress', clientEmail },
    { type: 'TDS', description: 'TDS Challan',     period: 'Jul 2025', dueDate: ts(2025, 8,  7), filedDate: null,            status: 'overdue',     clientEmail },
    { type: 'TDS', description: 'Form 16 Issue',   period: 'FY 24-25', dueDate: ts(2025, 6, 15), filedDate: ts(2025, 6, 12), status: 'completed',   clientEmail },
  ];
}

// ── Run ──────────────────────────────────────────────────────
async function seed() {
  console.log('🌱 Seeding Firebase...\n');

  for (const client of CLIENTS) {
    const cRef = await addDoc(collection(db, 'clients'), client);
    console.log(`✅ Client: ${client.name} (${cRef.id})`);

    const tasks = makeTasks(client.email);
    for (const task of tasks) {
      await addDoc(collection(db, 'tasks'), task);
    }
    console.log(`   ↳ Added ${tasks.length} tasks\n`);
  }

  console.log('✨ Seeding complete!');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
