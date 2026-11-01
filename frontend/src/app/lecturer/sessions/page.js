"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { PlusCircle, LogOut, Users, BookOpen, Trash2, GraduationCap, Zap } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LecturerDashboard() {
    const { pengguna, keluar } = useAuth();
    const [sessions, setSessions] = useState([]);
    const [courses, setCourses] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newSession, setNewSession] = useState({ course_id: "", duration_min: 90 });
    const router = useRouter();

    useEffect(() => {
        if (!pengguna || pengguna.peran !== "dosen") {
            router.push("/login");
            return;
        }
        fetchData();
    }, [pengguna]);

    const fetchData = async () => {
        try {
            const [sessRes, courseRes] = await Promise.all([
                api.get("/session"),
                api.get("/session/courses")
            ]);
            setSessions(sessRes.data.sessions);
            setCourses(courseRes.data.courses);
            if (courseRes.data.courses.length > 0) {
                setNewSession({ ...newSession, course_id: courseRes.data.courses[0].id });
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreateSession = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post("/session/create", newSession);
            setIsModalOpen(false);
            router.push(`/lecturer/session/${res.data.session_id}`);
        } catch (err) {
            alert("Gagal membuat sesi");
        }
    };

    const handleDeleteSession = async (e, sessionId) => {
        e.stopPropagation();
        if (confirm("Apakah Anda yakin ingin menghapus sesi ini? Semua data absensi di sesi ini akan ikut terhapus.")) {
            try {
                await api.delete(`/session/${sessionId}`);
                fetchData();
            } catch (err) {
                console.error("Gagal menghapus sesi:", err);
                alert("Gagal menghapus sesi");
            }
        }
    };

    return (
        <div className="min-h-screen flex flex-col">
            {/* Nav */}
            <nav className="glass-nav sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-lg font-bold text-white">Dasbor Dosen</h1>
                        <p className="text-xs text-slate-400">Kelola sesi & kehadiran</p>
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
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Sesi Terbaru</h2>
                        <p className="text-sm text-slate-400 mt-1">{sessions.length} sesi ditemukan</p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="btn-primary flex items-center gap-2 text-sm py-3 px-5"
                    >
                        <PlusCircle className="h-5 w-5" />
                        Sesi Baru
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {sessions.map((sess, idx) => {
                        const isActive = new Date() < new Date(sess.end_ts);
                        return (
                            <div
                                key={sess.id}
                                className="glass-card p-6 flex flex-col cursor-pointer relative group stagger-item"
                                onClick={() => router.push(`/lecturer/session/${sess.id}`)}
                            >
                                {!isActive && (
                                    <button
                                        onClick={(e) => handleDeleteSession(e, sess.id)}
                                        className="absolute top-4 right-4 p-2 rounded-xl bg-red-500/10 text-red-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/20"
                                        title="Hapus Sesi"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                )}

                                <div className="flex justify-between items-start mb-4">
                                    <div className="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                                        <BookOpen className="text-indigo-400 h-6 w-6" />
                                    </div>
                                    <span className={`badge ${isActive ? 'badge-active' : 'badge-ended'} ${!isActive ? 'mr-8' : ''}`}>
                                        {isActive && <Zap className="h-3 w-3 mr-1" />}
                                        {isActive ? 'Aktif' : 'Berakhir'}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-white line-clamp-2 pr-8">{sess.course_name}</h3>
                                <p className="text-sm text-slate-400 mt-2">{new Date(sess.start_ts).toLocaleString()}</p>

                                <div className="mt-auto pt-4 border-t border-white/5 flex justify-between items-center">
                                    <div className="flex items-center text-slate-400 gap-2">
                                        <Users className="h-4 w-4" />
                                        <span className="font-medium text-sm">{Number(sess.attendance_count) || 0} Hadir</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {sessions.length === 0 && (
                        <div className="col-span-full glass-card p-16 text-center">
                            <div className="h-16 w-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-4">
                                <BookOpen className="h-8 w-8 text-indigo-400" />
                            </div>
                            <p className="text-slate-400 text-lg font-medium">Belum ada sesi</p>
                            <p className="text-slate-500 text-sm mt-1">Buat sesi baru untuk mulai melacak kehadiran</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Modal */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="glass-card w-full max-w-md p-8 mx-4" style={{transform: 'none'}}>
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <Zap className="h-5 w-5 text-indigo-400" />
                            Mulai Sesi Baru
                        </h3>
                        <form onSubmit={handleCreateSession} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Pilih Mata Kuliah</label>
                                <select
                                    className="select-premium"
                                    value={newSession.course_id}
                                    onChange={(e) => setNewSession({ ...newSession, course_id: e.target.value })}
                                >
                                    {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Durasi Kode QR (Menit)</label>
                                <input
                                    type="number"
                                    required
                                    min="10"
                                    max="240"
                                    className="input-premium"
                                    value={newSession.duration_min}
                                    onChange={(e) => setNewSession({ ...newSession, duration_min: parseInt(e.target.value) })}
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-ghost">Batal</button>
                                <button type="submit" className="btn-primary text-sm py-3 px-6">Buat Sesi</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
