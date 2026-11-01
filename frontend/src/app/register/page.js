"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, User, Mail, Hash, Lock, AlertCircle, CheckCircle2, Sparkles } from "lucide-react";
import api from "@/lib/api";

export default function RegisterPage() {
    const router = useRouter();
    const [data_form, setDataForm] = useState({
        nama: "",
        nim: "",
        email: "",
        kata_sandi: "",
        konfirmasi_kata_sandi: ""
    });
    const [kesalahan, setKesalahan] = useState(null);
    const [sedang_memuat, setSedangMemuat] = useState(false);
    const [pesan_sukses, setPesanSukses] = useState(null);

    const tanganiPerubahan = (e) => {
        setDataForm({ ...data_form, [e.target.name]: e.target.value });
    };

    const tanganiKirim = async (e) => {
        e.preventDefault();
        setSedangMemuat(true);
        setKesalahan(null);

        if (data_form.kata_sandi !== data_form.konfirmasi_kata_sandi) {
            setKesalahan("Kata sandi tidak cocok. Silakan periksa kembali.");
            setSedangMemuat(false);
            return;
        }

        try {
            const res = await api.post("/auth/register", {
                nama: data_form.nama,
                nim: data_form.nim,
                email: data_form.email,
                kata_sandi: data_form.kata_sandi
            });

            setPesanSukses("Pendaftaran berhasil! Mengalihkan ke halaman login...");
            setTimeout(() => {
                router.push('/login');
            }, 2000);
        } catch (kesalahan) {
            setKesalahan(kesalahan.response?.data?.error || "Gagal mendaftar. NIM atau Email mungkin sudah terdaftar.");
        } finally {
            setSedangMemuat(false);
        }
    };

    const fields = [
        { id: "nama", label: "Nama Lengkap", type: "text", placeholder: "Masukkan nama lengkap", icon: User },
        { id: "nim", label: "NIM", type: "text", placeholder: "Nomor Induk Mahasiswa", icon: Hash },
        { id: "email", label: "Email", type: "email", placeholder: "Alamat email aktif", icon: Mail },
        { id: "kata_sandi", label: "Kata Sandi", type: "password", placeholder: "Minimal 6 karakter", icon: Lock },
        { id: "konfirmasi_kata_sandi", label: "Konfirmasi Kata Sandi", type: "password", placeholder: "Ulangi kata sandi", icon: Lock },
    ];

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 relative">
            <div className="w-full max-w-md animate-fade-in-up">
                {/* Logo & Header */}
                <div className="flex flex-col items-center mb-8">
                    <div className="relative">
                        <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                            <UserPlus className="h-10 w-10 text-white" />
                        </div>
                        <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                            <Sparkles className="h-3 w-3 text-white" />
                        </div>
                    </div>
                    <h1 className="mt-6 text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                        Buat Akun Baru
                    </h1>
                    <p className="mt-2 text-sm text-slate-400">
                        Khusus untuk Mahasiswa
                    </p>
                </div>

                {/* Card */}
                <div className="glass-card p-8">
                    <form onSubmit={tanganiKirim} className="space-y-5">
                        {kesalahan && (
                            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 animate-slide-in">
                                <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                                <p className="text-sm text-red-300">{kesalahan}</p>
                            </div>
                        )}

                        {pesan_sukses && (
                            <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 animate-slide-in">
                                <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                                <p className="text-sm text-emerald-300">{pesan_sukses}</p>
                            </div>
                        )}

                        <div className="space-y-4">
                            {fields.map((field) => (
                                <div key={field.id}>
                                    <label htmlFor={field.id} className="block text-sm font-medium text-slate-300 mb-2">
                                        {field.label}
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <field.icon className="h-4 w-4 text-slate-500" />
                                        </div>
                                        <input
                                            id={field.id}
                                            name={field.id}
                                            type={field.type}
                                            required
                                            className="input-premium pl-11"
                                            placeholder={field.placeholder}
                                            value={data_form[field.id]}
                                            onChange={tanganiPerubahan}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            type="submit"
                            disabled={sedang_memuat}
                            className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
                            style={{ background: "linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)" }}
                        >
                            <UserPlus className="h-5 w-5" />
                            {sedang_memuat ? "Sedang mendaftar..." : "Daftar Sekarang"}
                        </button>

                        <div className="text-center pt-2">
                            <p className="text-sm text-slate-500">
                                Sudah punya akun?{" "}
                                <a href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                                    Masuk di sini
                                </a>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
