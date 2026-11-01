"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { QrCode, LogOut, CalendarCheck, MapPin, BookOpen, Clock } from "lucide-react";

export default function StudentHistory() {
    const { pengguna, keluar } = useAuth();
    const router = useRouter();
    const [history, setHistory] = useState([]);

    useEffect(() => {
        if (!pengguna || pengguna.peran !== "mahasiswa") {
            router.push("/login"); return;
        }
        fetchHistory();
    }, [pengguna]);

    const fetchHistory = async () => {
        try {
            const res = await api.get("/attendance/history");
            setHistory(res.data.history || res.data.riwayat || []);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="min-h-screen flex flex-col">
            {/* Nav */}
            <nav className="glass-nav sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-lg font-bold text-white">Kehadiranku</h1>
                        <p className="text-xs text-slate-400">Riwayat absensi Anda</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => router.push('/student/scan')} className="btn-primary text-sm py-2.5 px-4 flex items-center gap-2">
                            <QrCode className="h-4 w-4" /> Pindai
                        </button>
                        <button onClick={keluar} className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-red-400 transition-all">
                            <LogOut className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </nav>

            <main className="flex-1 max-w-4xl w-full mx-auto py-8 px-6 animate-fade-in-up">
                {/* Stats bar */}
                <div className="glass-card p-5 mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                            <Clock className="h-5 w-5 text-indigo-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">Total Sesi Diikuti</p>
                            <p className="text-xl font-bold text-white">{history.length}</p>
                        </div>
                    </div>
                    <span className="badge badge-active text-sm">{history.length} Sesi</span>
                </div>

                {/* History List */}
                <div className="glass-card overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/5">
                        <h2 className="text-lg font-bold text-white">Log Riwayat</h2>
                    </div>

                    <div>
                        {history.map((record, idx) => (
                            <div key={record.id} className={`p-6 hover:bg-white/[0.02] transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center stagger-item ${idx > 0 ? 'border-t border-white/5' : ''}`}>
                                <div className="flex items-start gap-4 mb-4 sm:mb-0">
                                    <div className="h-12 w-12 rounded-xl bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                                        <CalendarCheck className="h-6 w-6 text-cyan-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-lg">{record.course_name}</h3>
                                        <p className="text-slate-400 text-sm flex items-center mt-1 gap-1">
                                            <Clock className="h-3 w-3" />
                                            {new Date(record.scanned_at).toLocaleString()}
                                        </p>
                                        {(record.lat && record.lon) && (
                                            <p className="text-xs text-emerald-400/60 mt-1 flex items-center gap-1">
                                                <MapPin className="h-3 w-3" /> GPS Terverifikasi
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <span className={`badge ${record.status === 'present' ? 'badge-present' : 'badge-flagged'} ml-16 sm:ml-0`}>
                                    {record.status === 'present' ? 'HADIR' : 'DITANDAI'}
                                </span>
                            </div>
                        ))}

                        {history.length === 0 && (
                            <div className="p-16 text-center">
                                <div className="h-16 w-16 rounded-2xl bg-slate-700/30 flex items-center justify-center mx-auto mb-4">
                                    <CalendarCheck className="h-8 w-8 text-slate-500" />
                                </div>
                                <p className="text-slate-400 text-lg font-medium">Belum ada riwayat</p>
                                <p className="text-slate-500 text-sm mt-1">Pindai kode QR untuk mulai mencatat kehadiran</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
