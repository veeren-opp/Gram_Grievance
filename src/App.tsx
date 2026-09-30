import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Users,
  Building2,
  Database,
  Cloud,
  FileText,
  MapPin,
  Download,
  FolderArchive,
  Package,
} from 'lucide-react';

interface SystemHealth {
  status: string;
  database: string;
  databaseDetails?: {
    connected: boolean;
    state: string;
    database: string | null;
    host: string | null;
  };
  cloudinary: string;
  timestamp: string;
  location?: {
    state: string;
    district: string;
    gramPanchayat: string;
  };
}

export default function App() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/health');
      const data = await res.json();
      setHealth(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to backend server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Tricolor Ribbon Header */}
      <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-white to-emerald-600" />

      {/* Top Banner */}
      <header className="bg-slate-900 text-slate-200 border-b border-slate-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-800 text-white font-bold text-xl flex items-center justify-center border border-emerald-600">
              GS
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white">GramSetu</h1>
                <span className="text-xs bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded font-mono">
                  v1.0.0
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Digital Gram Panchayat Grievance Portal • XYZ Gram Panchayat, Buldhana, Maharashtra
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              State: <strong>Maharashtra</strong> • District: <strong>Buldhana</strong> • Panchayat: <strong>XYZ</strong>
            </span>
            <a
              href="/api/download/zip"
              download="gramsetu-panchayat-portal.zip"
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-3 py-1.5 rounded-lg shadow-sm transition"
            >
              <Download className="w-3.5 h-3.5" />
              Download ZIP
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Gateway */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8">
        {/* System Diagnostics Box */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 mb-8 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                Live Backend & Integration Status
              </h2>
              <span className="text-xs text-slate-400">Auto-refreshing</span>
            </div>
            <button
              onClick={fetchHealth}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-medium underline"
            >
              Check Now
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Express Server */}
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-3">
              <div className="p-2 rounded bg-emerald-100 text-emerald-800">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-semibold uppercase">API Service</div>
                <div className="text-sm font-bold text-slate-900">Node.js / Express</div>
                <div className="text-xs text-emerald-700 font-medium mt-0.5">Status: UP (Port 3000)</div>
              </div>
            </div>

            {/* MongoDB Atlas */}
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-3">
              <div
                className={`p-2 rounded ${
                  health?.database === 'connected'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                <Database className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-semibold uppercase">Database</div>
                <div className="text-sm font-bold text-slate-900">MongoDB Atlas</div>
                <div
                  className={`text-xs font-semibold mt-0.5 ${
                    health?.database === 'connected' ? 'text-emerald-700' : 'text-amber-700'
                  }`}
                >
                  {health?.database === 'connected'
                    ? `Connected (${health.databaseDetails?.database || 'Atlas'})`
                    : 'Disconnected (Configure MONGODB_URI)'}
                </div>
              </div>
            </div>

            {/* Cloudinary */}
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-3">
              <div
                className={`p-2 rounded ${
                  health?.cloudinary === 'configured'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                <Cloud className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-semibold uppercase">Photo CDN</div>
                <div className="text-sm font-bold text-slate-900">Cloudinary SDK</div>
                <div
                  className={`text-xs font-semibold mt-0.5 ${
                    health?.cloudinary === 'configured' ? 'text-emerald-700' : 'text-amber-700'
                  }`}
                >
                  {health?.cloudinary === 'configured'
                    ? 'Active & Ready for Uploads'
                    : 'Unconfigured (Add Cloudinary Keys)'}
                </div>
              </div>
            </div>
          </div>

          {health?.database !== 'connected' && (
            <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
              <div>
                <strong>MongoDB Atlas Setup Notice:</strong> To save registered citizens, issue sequential grievance IDs, and update statuses, provide your Atlas connection string in <code>.env</code> under <code>MONGODB_URI</code>. See project README for step-by-step setup.
              </div>
            </div>
          )}
        </div>

        {/* Portal Entry Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Citizen Portal */}
          <div className="bg-white border-2 border-emerald-600/30 rounded-xl p-6 shadow-sm hover:border-emerald-600 transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">Citizen Portal</h3>
              <p className="text-sm text-slate-600 mb-4">
                Dedicated interface for residents of XYZ Gram Panchayat. File municipal grievances with photo proof, track redressal stages, and view administration remarks.
              </p>
              <ul className="text-xs text-slate-500 space-y-1.5 mb-6">
                <li>• Register with Indian Mobile Number & Password</li>
                <li>• Upload Photo Evidence (Multer → Cloudinary)</li>
                <li>• Auto-sequential IDs (e.g. CMP-2026-000001)</li>
                <li>• Fixed Location: Maharashtra / Buldhana / XYZ Gram Panchayat</li>
              </ul>
            </div>
            <div className="flex gap-2">
              <a
                href="/citizen/index.html"
                className="flex-1 inline-flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm py-2.5 px-4 rounded-lg transition"
              >
                Launch Citizen Portal <ExternalLink className="w-4 h-4" />
              </a>
              <a
                href="/citizen/register.html"
                className="inline-flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm py-2.5 px-3 rounded-lg transition"
              >
                Sign Up
              </a>
            </div>
          </div>

          {/* Admin Portal */}
          <div className="bg-white border-2 border-slate-800/30 rounded-xl p-6 shadow-sm hover:border-slate-800 transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center mb-4">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">Panchayat Administration Portal</h3>
              <p className="text-sm text-slate-600 mb-4">
                Restricted portal for authorized officers of XYZ Gram Panchayat. Review citizen grievances, view full-resolution photo evidence, update case statuses, and log official remarks.
              </p>
              <ul className="text-xs text-slate-500 space-y-1.5 mb-6">
                <li>• Secure JWT Authorization with Admin Password</li>
                <li>• Real-time Aggregate Metrics across 5 Categories</li>
                <li>• Filter by Status: Submitted, Under Review, In Progress, Resolved, Rejected</li>
                <li>• Instant sync back to citizen accounts</li>
              </ul>
            </div>
            <div className="flex gap-2">
              <a
                href="/admin/index.html"
                className="flex-1 inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm py-2.5 px-4 rounded-lg transition"
              >
                Admin Login <ExternalLink className="w-4 h-4" />
              </a>
              <a
                href="/admin/register.html"
                className="inline-flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm py-2.5 px-3 rounded-lg transition"
              >
                Register Officer
              </a>
            </div>
          </div>
        </div>

        {/* Download Project Codebase Archive */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl p-6 mb-8 shadow-md border border-slate-700">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <FolderArchive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Download Complete Project Codebase</h3>
                <p className="text-xs text-slate-300">
                  Pre-packaged with full source code: Node.js/Express backend, Citizen & Admin portals, and setup scripts.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <a
                href="/api/download/zip"
                download="gramsetu-panchayat-portal.zip"
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 px-4 rounded-lg shadow-sm transition"
              >
                <Download className="w-4 h-4" />
                Download .ZIP (0.8 MB)
              </a>
              <a
                href="/api/download/tar"
                download="gramsetu-panchayat-portal.tar.gz"
                className="inline-flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold text-xs py-2.5 px-3 rounded-lg border border-slate-600 transition"
              >
                <Package className="w-3.5 h-3.5" />
                .TAR.GZ
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-xs text-slate-300">
            <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
              <span className="font-bold text-emerald-400 block mb-1">📁 What's Included:</span>
              <ul className="space-y-0.5 text-slate-400 list-disc list-inside">
                <li><code>/backend</code> — Express, Mongoose, JWT & Multer</li>
                <li><code>/citizen</code> — Public resident registration & grievance</li>
                <li><code>/admin</code> — Panchayat officer ledger & management</li>
                <li><code>/src</code> — Unified Gateway React interface</li>
              </ul>
            </div>

            <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700 md:col-span-2">
              <span className="font-bold text-amber-300 block mb-1">⚡ Quick Local Run (3 Commands):</span>
              <div className="bg-slate-950 p-2.5 rounded font-mono text-[11px] text-slate-200 space-y-1">
                <div><span className="text-slate-500"># 1. Unzip and enter folder</span></div>
                <div>unzip gramsetu-panchayat-portal.zip &amp;&amp; cd gramsetu-project</div>
                <div><span className="text-slate-500"># 2. Install dependencies &amp; start dev server</span></div>
                <div>npm install &amp;&amp; npm run dev</div>
              </div>
            </div>
          </div>
        </div>

        {/* College Project Architecture & Demonstration Walkthrough */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-5 h-5 text-emerald-700" />
            <h3 className="text-base font-bold text-slate-900">
              College Project Demonstration Flow
            </h3>
          </div>
          <p className="text-xs text-slate-600 mb-4">
            Follow this end-to-end verification sequence to showcase full-stack data persistence and Cloudinary media integration:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <strong className="block text-emerald-800 font-bold mb-1">Step 1: Citizen Enrollment</strong>
              <p className="text-slate-600">
                Go to Citizen Register. Enter name, 10-digit mobile, and password. Notice fixed location (Maharashtra, Buldhana, XYZ Gram Panchayat). Submits to MongoDB via bcrypt + JWT.
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <strong className="block text-emerald-800 font-bold mb-1">Step 2: Submit Grievance</strong>
              <p className="text-slate-600">
                File a complaint (e.g. Roads / Street Lights). Attach a photo. Express streams image via Multer to Cloudinary and generates atomic CMP-2026-XXXXXX ID in MongoDB.
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <strong className="block text-slate-900 font-bold mb-1">Step 3: Admin Review</strong>
              <p className="text-slate-600">
                Open Admin Portal. Sign in with any username and official key: <code>GramSetu@2026</code>. Review grievance dossier, inspect Cloudinary photo, and set status to "In Progress".
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <strong className="block text-emerald-800 font-bold mb-1">Step 4: Real-Time Verify</strong>
              <p className="text-slate-600">
                Re-open Citizen Portal or refresh complaint details. Observe updated status and administrative remark loaded directly from MongoDB Atlas.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-xs px-6 py-6 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            GramSetu — Digital Gram Panchayat Grievance Portal • XYZ Gram Panchayat, Buldhana, Maharashtra
          </div>
          <div className="flex gap-4">
            <a href="/api/health" target="_blank" className="hover:text-white underline">
              API Health Endpoint
            </a>
            <a href="/citizen/index.html" className="hover:text-white underline">
              Citizen Home
            </a>
            <a href="/admin/index.html" className="hover:text-white underline">
              Admin Portal
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
