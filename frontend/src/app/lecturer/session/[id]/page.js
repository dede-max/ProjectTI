"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { io } from "socket.io-client";
import { Users, Clock, ArrowLeft, Download, AlertTriangle, CheckCircle, Zap, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export default function SessionDetail() {
    const { id } = useParams();
    const { pengguna } = useAuth();
    const router = useRouter();

    const [qrBase64, setQrBase64] = useState("");
    const [expiresAt, setExpiresAt] = useState(null);
    const [qrDuration, setQrDuration] = useState(60);
    const [attendance, setAttendance] = useState([]);
    const [timeLeft, setTimeLeft] = useState(0);
    const [latestScan, setLatestScan] = useState(null);

    const socketRef = useRef(null);
    const isInitialLoadRef = useRef(true);

    useEffect(() => {
        if (!pengguna || pengguna.peran !== "dosen") {
            router.push("/login"); return;
        }

        fetchAttendance();
        fetchQr();

        // Setup Socket.IO
        socketRef.current = io(process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace('/api', '') : undefined, {
            withCredentials: true,
            path: '/socket.io'
        });

        socketRef.current.on('connect', () => {
            socketRef.current.emit('join_session', id);
        });

        socketRef.current.on('attendance_update', (newRecord) => {
            setAttendance(prev => {
                if (prev.some(p => p.nim === newRecord.nim)) return prev;
                return [newRecord, ...prev];
            });
            setLatestScan(newRecord);
            setTimeout(() => {
                setLatestScan(curr => (curr?.nim === newRecord.nim && curr?.scanned_at === newRecord.scanned_at) ? null : curr);
            }, 5000);
        });

        const pollInterval = window.setInterval(() => {
            fetchAttendance();
        }, 3000);

        return () => {
            socketRef.current?.disconnect();
            window.clearInterval(pollInterval);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, pengguna]);

    useEffect(() => {
        if (!expiresAt) return;

        const intv = setInterval(() => {
            const now = new Date();
            const diff = Math.floor((expiresAt - now) / 1000);

            if (diff <= 0) {
                setTimeLeft(0);
                clearInterval(intv);
                setTimeout(() => {
                    fetchQr();
                }, 500);
            } else {
                setTimeLeft(diff);
            }
        }, 1000);

        const diffInitial = Math.floor((expiresAt - new Date()) / 1000);
        setTimeLeft(diffInitial > 0 ? diffInitial : 0);

        return () => clearInterval(intv);
    }, [expiresAt]);

    const fetchAttendance = async () => {
        try {
            const res = await api.get(`/session/${id}/attendance`);
            const newAttendanceData = res.data.attendance;
            
            setAttendance(prev => {
                if (!isInitialLoadRef.current && newAttendanceData.length > prev.length) {
                    const newRecord = newAttendanceData[0];
                    const existsInPrev = prev.some(p => p.nim === newRecord?.nim);
                    
                    if (!existsInPrev && newRecord) {
                        setLatestScan(newRecord);
                        setTimeout(() => {
                            setLatestScan(curr => (curr?.nim === newRecord.nim && curr?.scanned_at === newRecord.scanned_at) ? null : curr);
                        }, 5000);
                    }
                }
                isInitialLoadRef.current = false;
                return newAttendanceData;
            });
        } catch (e) {
            if (e.response?.status === 404) {
                router.push('/lecturer/sessions');
            } else {
                console.error(e);
            }
        }
    };

    const fetchQr = async () => {
        try {
            const res = await api.get(`/session/${id}/qr`);
            setQrBase64(res.data.qr_payload);
            const newExpiresAt = new Date(res.data.expires_at);
            const duration = Math.round((newExpiresAt - new Date()) / 1000);
            setQrDuration(duration > 0 ? duration : 60);
            setExpiresAt(newExpiresAt);
        } catch (e) {
            if (e.response?.status === 404) {
                router.push('/lecturer/sessions');
                return;
            }
            if (e.response?.status === 400 && e.response?.data?.error === 'Session has already ended') {
                setQrBase64(null);
                setExpiresAt(null);
            } else {
                console.error("Session ended or not found", e);
            }
        }
    };

    const exportCSV = () => {
        let csvContent = "data:text/csv;charset=utf-8,NIM,Name,Scanned At,Status\n";
        attendance.forEach(row => {
            csvContent += `${row.nim},${row.name},${new Date(row.scanned_at).toISOString()},${row.status}\n`;
        });
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `attendance_session_${id}.csv`);
        document.body.appendChild(link);
        link.click();
    };

    const scanUrl = typeof window !== "undefined" && qrBase64
        ? `${window.location.origin}/student/scan?payload=${encodeURIComponent(qrBase64)}`
        : "";

    const timerPercent = expiresAt ? Math.max(0, Math.min(100, (timeLeft / qrDuration) * 100)) : 0;

    return (
        <div className="min-h-screen flex flex-col">
            {/* Nav */}
            <nav className="glass-nav sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.push('/lecturer/sessions')} className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all">
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <div>
                            <h1 className="text-lg font-bold text-white flex items-center gap-2">
                                <Zap className="h-4 w-4 text-indigo-400" />
                                Sesi Langsung #{id}
                            </h1>
                        </div>
                    </div>
                    <button onClick={exportCSV} className="btn-success text-sm flex items-center gap-2 py-2 px-4">
                        <Download className="h-4 w-4" /> Ekspor CSV
                    </button>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6 w-full animate-fade-in-up">
                {/* QR Column */}
                <div className="lg:col-span-1 glass-card p-8 flex flex-col items-center">
                    <div className="flex items-center gap-2 mb-2">
                        <QrCode className="h-5 w-5 text-indigo-400" />
                        <h2 className="text-lg font-bold text-white">Pindai untuk bergabung</h2>
                    </div>
                    <p className="text-sm text-slate-400 mb-6 text-center">Kode QR berganti setiap 60 detik</p>

                    {qrBase64 ? (
                        <div className="relative p-1 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-6 animate-pulse-glow">
                            <div className="bg-white p-4 rounded-xl">
                                <QRCodeSVG
                                    value={scanUrl}
                                    size={230}
                                    level={"H"}
                                    includeMargin={true}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="w-[262px] h-[262px] rounded-2xl mb-6 flex items-center justify-center bg-slate-800/50 border border-white/5">
                            <span className="text-slate-500 text-sm">Memuat... / Selesai</span>
                        </div>
                    )}

                    {/* Circular timer */}
                    <div className="w-full rounded-xl bg-indigo-500/10 border border-indigo-500/20 p-4 flex items-center justify-center gap-3">
                        <div className="relative h-10 w-10">
                            <svg className="h-10 w-10 -rotate-90" viewBox="0 0 40 40">
                                <circle cx="20" cy="20" r="17" fill="none" stroke="rgba(99,102,241,0.15)" strokeWidth="3" />
                                <circle cx="20" cy="20" r="17" fill="none" stroke="#6366f1" strokeWidth="3"
                                    strokeDasharray={`${2 * Math.PI * 17}`}
                                    strokeDashoffset={`${2 * Math.PI * 17 * (1 - timerPercent / 100)}`}
                                    strokeLinecap="round"
                                    style={{ transition: 'stroke-dashoffset 1s linear' }}
                                />
                            </svg>
                            <Clock className="h-4 w-4 text-indigo-400 absolute inset-0 m-auto" />
                        </div>
                        <div>
                            <p className="text-indigo-300 font-bold text-lg">{timeLeft}s</p>
                            <p className="text-indigo-400/60 text-xs">Menyegarkan</p>
                        </div>
                    </div>
                </div>

                {/* Attendance Column */}
                <div className="lg:col-span-2 glass-card overflow-hidden flex flex-col">
                    <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center">
                        <div className="flex items-center gap-2 font-bold text-white">
                            <Users className="h-5 w-5 text-indigo-400" />
                            <span>Mahasiswa Hadir ({attendance.length})</span>
                        </div>
                    </div>

                    {/* Notification Banner */}
                    {latestScan && (
                        <div className="mx-6 mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 animate-slide-in">
                            <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                <CheckCircle className="h-5 w-5 text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-emerald-300">Mahasiswa Berhasil Hadir!</p>
                                <p className="text-sm text-emerald-400 font-bold">{latestScan.name} ({latestScan.nim})</p>
                            </div>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto max-h-[600px] mt-2">
                        {attendance.map((row, idx) => (
                            <div key={row.nim + row.scanned_at} className={`px-6 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors stagger-item ${idx > 0 ? 'border-t border-white/5' : ''}`}>
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold text-sm">
                                        {row.name?.charAt(0)?.toUpperCase() || '?'}
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-white">{row.name}</h4>
                                        <p className="text-sm text-slate-500">{row.nim}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span className={`badge ${row.status === 'flagged' ? 'badge-flagged' : 'badge-present'}`}>
                                        {row.status === 'flagged' && <AlertTriangle className="h-3 w-3 mr-1" />}
                                        {row.status === 'present' ? 'HADIR' : 'DITANDAI'}
                                    </span>
                                    <span className="text-xs text-slate-500">{new Date(row.scanned_at).toLocaleTimeString()}</span>
                                </div>
                            </div>
                        ))}
                        {attendance.length === 0 && (
                            <div className="py-16 text-center">
                                <div className="spinner mx-auto mb-4"></div>
                                <p className="text-slate-400">Menunggu mahasiswa memindai...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
