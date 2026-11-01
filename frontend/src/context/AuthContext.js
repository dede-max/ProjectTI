"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [pengguna, setPengguna] = useState(null);
    const [memuat, setMemuat] = useState(true);
    const router = useRouter();

    useEffect(() => {
        periksaPengguna();
    }, []);

    const periksaPengguna = async () => {
        try {
            const res = await api.get("/auth/me");
            setPengguna(res.data.pengguna);
        } catch (kesalahan) {
            setPengguna(null);
        } finally {
            setMemuat(false);
        }
    };

    const masuk = async (nama_pengguna, kata_sandi) => {
        console.log('AuthContext masuk called with:', nama_pengguna, kata_sandi);
        try {
            const res = await api.post("/auth/login", { nama_pengguna, kata_sandi });
            console.log('API response:', res.data);
            setPengguna(res.data.pengguna);

            if (res.data.pengguna.peran === 'admin') router.push('/admin');
            else if (res.data.pengguna.peran === 'dosen') router.push('/lecturer/sessions');
            else router.push('/student/history');

            return { success: true };
        } catch (kesalahan) {
            console.error('Login error:', kesalahan);
            return { success: false, error: kesalahan.response?.data?.error || "Masuk gagal" };
        }
    };

    const keluar = async () => {
        try {
            await api.post("/auth/logout");
            setPengguna(null);
            router.push("/login");
        } catch (kesalahan) {
            console.error("Keluar gagal", kesalahan);
        }
    };

    return (
        <AuthContext.Provider value={{ pengguna, memuat, masuk, keluar }}>
            {!memuat && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
