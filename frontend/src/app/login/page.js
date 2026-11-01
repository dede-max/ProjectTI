"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { QrCode, LogIn, AlertCircle, Sparkles } from "lucide-react";

export default function LoginPage() {
    const [nama_pengguna, setNamaPengguna] = useState("");
    const [kata_sandi, setKataSandi] = useState("");
    const [kesalahan, setKesalahan] = useState(null);
    const [sedang_memuat, setSedangMemuat] = useState(false);
    const { masuk } = useAuth();

    const tanganiKirim = async (e) => {
        e.preventDefault();
        setSedangMemuat(true);
        setKesalahan(null);

        const hasil = await masuk(nama_pengguna, kata_sandi);
        if (!hasil.success) {
            setKesalahan(hasil.error);
        }
        setSedangMemuat(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 relative">
            <div className="w-full max-w-md animate-fade-in-up">
                {/* Logo & Header */}
                <div className="flex flex-col items-center mb-10">
                    <div className="relative">
                        <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                            <QrCode className="h-10 w-10 text-white" />
                        </div>
                        <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                            <Sparkles className="h-3 w-3 text-white" />
                        </div>
                    </div>
                    <h1 className="mt-6 text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                        Absensi QR
                    </h1>
                    <p className="mt-2 text-sm text-slate-400">
                        Masuk untuk mulai memindai atau mengelola sesi
                    </p>
                </div>

                {/* Card */}
                <div className="glass-card p-8">
                    <form onSubmit={tanganiKirim} className="space-y-6">
                        {kesalahan && (
                            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 animate-slide-in">
                                <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                                <p className="text-sm text-red-300">{kesalahan}</p>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label htmlFor="nama_pengguna" className="block text-sm font-medium text-slate-300 mb-2">
                                    NIM atau Email
                                </label>
                                <input
                                    id="nama_pengguna"
                                    name="nama_pengguna"
                                    type="text"
                                    required
                                    className="input-premium"
                                    placeholder="Masukkan NIM atau email"
                                    value={nama_pengguna}
                                    onChange={(e) => setNamaPengguna(e.target.value)}
                                />
                            </div>
                            <div>
                                <label htmlFor="kata_sandi" className="block text-sm font-medium text-slate-300 mb-2">
                                    Kata Sandi
                                </label>
                                <input
                                    id="kata_sandi"
                                    name="kata_sandi"
                                    type="password"
                                    required
                                    className="input-premium"
                                    placeholder="Masukkan kata sandi"
                                    value={kata_sandi}
                                    onChange={(e) => setKataSandi(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={sedang_memuat}
                            className="btn-primary w-full flex items-center justify-center gap-2"
                        >
                            <LogIn className="h-5 w-5" />
                            {sedang_memuat ? "Sedang masuk..." : "Masuk"}
                        </button>

                        <div className="text-center pt-2">
                            <p className="text-sm text-slate-500">
                                Belum punya akun?{" "}
                                <a href="/register" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                                    Daftar sekarang
                                </a>
                            </p>
                        </div>
                    </form>
                </div>

                {/* Footer hint */}
                <p className="text-center text-xs text-slate-600 mt-6">
                    Dilindungi dengan enkripsi end-to-end
                </p>
            </div>
        </div>
    );
}
