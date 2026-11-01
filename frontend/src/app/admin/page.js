"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { ShieldAlert, LogOut, FileText, AlertTriangle, Shield, Activity } from "lucide-react";

export default function AdminDashboard() {
    const { pengguna, keluar } = useAuth();
    const router = useRouter();

    const [kejanggalan, setKejanggalan] = useState([]);
    const [log, setLog] = useState([]);
    const [tab_aktif, setTabAktif] = useState('anomalies');

    useEffect(() => {
        if (!pengguna || pengguna.peran !== "admin") {
            router.push("/login"); return;
        }
        ambilData();
    }, [pengguna]);

    const ambilData = async () => {
        try {
            const [res_anomali, res_log] = await Promise.all([
                api.get("/admin/anomalies"),
                api.get("/admin/audits")
            ]);
            setKejanggalan(res_anomali.data.kejanggalan || []);
            setLog(res_log.data.log || []);
        } catch (kesalahan) {
            console.error(kesalahan);
        }
    };

    return (
        <div className="min-h-screen flex flex-col">
            {/* Nav */}
            <nav className="glass-nav sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/20">
                            <Shield className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-white">Administrator</h1>
                            <p className="text-xs text-slate-400">Panel Kontrol Sistem</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-slate-400 hidden sm:block">{pengguna?.nama}</span>
                        <button onClick={keluar} className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-red-400 transition-all">
                            <LogOut className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </nav>

            <main className="flex-1 max-w-7xl w-full mx-auto py-8 px-6 animate-fade-in-up">
                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                    <div className="glass-card p-6 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                            <AlertTriangle className="h-6 w-6 text-red-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{kejanggalan.length}</p>
                            <p className="text-sm text-slate-400">Anomali Terdeteksi</p>
                        </div>
                    </div>
                    <div className="glass-card p-6 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                            <Activity className="h-6 w-6 text-indigo-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{log.length}</p>
                            <p className="text-sm text-slate-400">Log Audit</p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-3 mb-6">
                    <button
                        onClick={() => setTabAktif('anomalies')}
                        className={`tab-btn ${tab_aktif === 'anomalies' ? 'active tab-btn-danger' : ''}`}
                    >
                        <span className="flex items-center gap-2">
                            <ShieldAlert className="h-4 w-4" />
                            Anomali ({kejanggalan.length})
                        </span>
                    </button>
                    <button
                        onClick={() => setTabAktif('logs')}
                        className={`tab-btn ${tab_aktif === 'logs' ? 'active' : ''}`}
                    >
                        <span className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Log Audit
                        </span>
                    </button>
                </div>

                {/* Content */}
                <div className="glass-card overflow-hidden">
                    {tab_aktif === 'anomalies' && (
                        <div>
                            {kejanggalan.length === 0 ? (
                                <div className="p-16 text-center">
                                    <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                                        <Shield className="h-8 w-8 text-emerald-400" />
                                    </div>
                                    <p className="text-slate-400 text-lg font-medium">Sistem Bersih</p>
                                    <p className="text-slate-500 text-sm mt-1">Tidak ada anomali terdeteksi</p>
                                </div>
                            ) : kejanggalan.map((a, idx) => {
                                let tambahan = {};
                                try { tambahan = JSON.parse(a.tambahan) || {}; } catch (e) { }
                                return (
                                    <div key={a.id} className={`p-6 hover:bg-white/[0.02] transition-colors stagger-item ${idx > 0 ? 'border-t border-white/5' : ''}`}>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                                                    <AlertTriangle className="h-5 w-5 text-red-400" />
                                                    {a.nama} ({a.nim})
                                                </h3>
                                                <p className="text-sm text-indigo-300 font-medium mt-1">Mata Kuliah: {a.nama_mata_kuliah}</p>
                                                <div className="text-sm text-slate-400 grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                                                    <div><span className="text-slate-300 font-medium">Waktu:</span> {new Date(a.dipindai_pada).toLocaleString()}</div>
                                                    <div><span className="text-slate-300 font-medium">IP:</span> {a.alamat_ip}</div>
                                                    <div className="sm:col-span-2"><span className="text-slate-300 font-medium">Perangkat:</span> {a.hash_perangkat || 'Tidak diketahui'}</div>
                                                </div>
                                            </div>
                                            <span className="badge badge-danger">DITANDAI</span>
                                        </div>
                                        {tambahan.alasan && (
                                            <div className="mt-4 bg-red-500/5 p-4 rounded-xl border border-red-500/10">
                                                <strong className="text-red-300 text-sm">Alasan:</strong>
                                                <ul className="list-disc pl-5 mt-1 text-sm text-red-300/80 space-y-1">
                                                    {tambahan.alasan.map((r, i) => <li key={i}>{r}</li>)}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {tab_aktif === 'logs' && (
                        <div className="overflow-x-auto">
                            <table className="table-premium">
                                <thead>
                                    <tr>
                                        <th>Waktu</th>
                                        <th>Aksi</th>
                                        <th>Pengguna</th>
                                        <th>Metadata</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {log.map((l, idx) => (
                                        <tr key={l.id} className="stagger-item">
                                            <td className="whitespace-nowrap">{new Date(l.dibuat_pada).toLocaleString()}</td>
                                            <td className="font-medium text-white">{l.aksi}</td>
                                            <td>{l.nama || 'Sistem'} ({l.nim || 'N/A'})</td>
                                            <td className="font-mono text-xs max-w-xs truncate">{l.metadata}</td>
                                        </tr>
                                    ))}
                                    {log.length === 0 && (
                                        <tr><td colSpan="4" className="text-center py-16 text-slate-500">Belum ada log yang dihasilkan.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
