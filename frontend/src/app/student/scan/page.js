"use client";

import { useEffect, useState, Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { useRouter, useSearchParams } from "next/navigation";
import { Html5Qrcode } from "html5-qrcode";
import { History, CheckCircle, XCircle, RotateCcw, ScanLine, Camera } from "lucide-react";

function ScanContent() {
    const { pengguna } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const payloadParam = searchParams.get('payload');

    const [scanResult, setScanResult] = useState(null);
    const [scanning, setScanning] = useState(!payloadParam);
    const [isAutoSubmitting, setIsAutoSubmitting] = useState(!!payloadParam);
    const [facingMode, setFacingMode] = useState("environment");
    const [cameraError, setCameraError] = useState(null);

    useEffect(() => {
        if (!pengguna || pengguna.peran !== "mahasiswa") {
            router.push("/login"); return;
        }
    }, [pengguna]);

    // Auto submit if payload from URL
    useEffect(() => {
        if (payloadParam && scanResult === null && isAutoSubmitting) {
            submitAttendance(payloadParam);
            setIsAutoSubmitting(false);
        }
    }, [payloadParam, scanResult, isAutoSubmitting]);

    useEffect(() => {
        if (!scanning) return;

        let html5QrCode;
        let isStarted = false;
        let isMounted = true;

        const initScanner = async () => {
            if (!isMounted) return;

            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                if (isMounted) {
                    setCameraError("Kamera tidak didukung. Pastikan Anda mengakses aplikasi melalui HTTPS (atau localhost).");
                }
                return;
            }

            html5QrCode = new Html5Qrcode("reader");

            const onScanSuccess = (decodedText) => {
                let actualPayload = decodedText;
                try {
                    const url = new URL(decodedText);
                    if (url.searchParams.has('payload')) {
                        actualPayload = url.searchParams.get('payload');
                    }
                } catch (e) {
                    // Not a URL, use raw text
                }

                if (isMounted) {
                    setScanning(false);
                    if (isStarted && html5QrCode && html5QrCode.getState() === 2) {
                        try {
                            html5QrCode.stop().then(() => html5QrCode.clear()).catch(e => console.error("Error stopping", e));
                        } catch (stopErr) {
                            console.error("Synchronous error stopping scanner", stopErr);
                        }
                    }
                    submitAttendance(actualPayload);
                }
            };

            try {
                await html5QrCode.start(
                    { facingMode: facingMode },
                    { fps: 10, qrbox: { width: 250, height: 250 } },
                    onScanSuccess,
                    (errorMessage) => { /* Ignore standard scan errors */ }
                );
                isStarted = true;
            } catch (err) {
                console.warn(`${facingMode} camera failed or not found, falling back to any available camera...`, err);
                if (!isMounted) return;

                try {
                    const devices = await Html5Qrcode.getCameras();
                    if (devices && devices.length > 0) {
                        const backCamera = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('rear')) || devices[devices.length - 1];
                        const targetDeviceId = facingMode === "user" ? devices[0].id : backCamera.id;

                        await html5QrCode.start(
                            targetDeviceId,
                            { fps: 10, qrbox: { width: 250, height: 250 } },
                            onScanSuccess,
                            (errorMessage) => { /* Ignore standard scan errors */ }
                        );
                        isStarted = true;
                    } else {
                        throw new Error("No cameras found on the device");
                    }
                } catch (fallbackErr) {
                    console.error("Failed to start fallback camera", fallbackErr);
                    if (isMounted) {
                        setCameraError("Gagal mengakses kamera: " + (fallbackErr.message || fallbackErr));
                    }
                }
            }
        };

        const timer = setTimeout(() => {
            initScanner();
        }, 300);

        return () => {
            isMounted = false;
            clearTimeout(timer);
            if (html5QrCode && isStarted && html5QrCode.getState() === 2) {
                try {
                    html5QrCode.stop()
                        .then(() => html5QrCode.clear())
                        .catch(e => { });
                } catch (stopErr) {
                    // Ignore noisy synchronous error
                }
            }
        };
    }, [scanning, facingMode]);

    const submitAttendance = async (qrPayload) => {
        try {
            const deviceInfo = navigator.userAgent;

            const reqBody = {
                qr_payload: qrPayload,
                device_info: deviceInfo
            };

            const res = await api.post("/attendance/scan", reqBody);
            setScanResult({ success: true, message: res.data.message });

            if (payloadParam && typeof window !== 'undefined') {
                window.history.replaceState({}, '', '/student/scan');
            }
        } catch (err) {
            setScanResult({
                success: false,
                message: err.response?.data?.message || "Verifikasi Gagal"
            });

            if (payloadParam && typeof window !== 'undefined') {
                window.history.replaceState({}, '', '/student/scan');
            }
        }
    };

    const toggleCamera = () => {
        setFacingMode(prev => prev === "environment" ? "user" : "environment");
    };

    return (
        <div className="min-h-screen flex flex-col">
            {/* Nav */}
            <nav className="glass-nav sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                            <ScanLine className="h-5 w-5 text-white" />
                        </div>
                        <h1 className="text-lg font-bold text-white">Pindai QR</h1>
                    </div>
                    <button onClick={() => router.push('/student/history')} className="btn-ghost text-sm flex items-center gap-2 py-2 px-4">
                        <History className="h-4 w-4" /> Riwayat
                    </button>
                </div>
            </nav>

            <main className="flex-1 max-w-lg w-full mx-auto py-12 px-6 flex flex-col items-center animate-fade-in-up">

                {isAutoSubmitting ? (
                    <div className="glass-card p-10 w-full text-center">
                        <div className="spinner mx-auto mb-6"></div>
                        <h2 className="text-xl font-bold text-white">Memproses Kehadiran...</h2>
                        <p className="text-slate-400 mt-2">Sedang memverifikasi kode QR Anda</p>
                    </div>
                ) : scanning ? (
                    <div className="glass-card p-6 w-full overflow-hidden">
                        {cameraError && (
                            <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-300">
                                {cameraError}
                            </div>
                        )}
                        <div id="reader" className="w-full relative min-h-[300px] flex items-center justify-center rounded-xl overflow-hidden" style={{ background: 'rgba(0,0,0,0.3)' }}>
                            {!cameraError && (
                                <div className="text-center">
                                    <Camera className="h-8 w-8 text-slate-500 mx-auto mb-2" />
                                    <span className="text-slate-500 text-sm">Memuat Kamera...</span>
                                </div>
                            )}
                        </div>
                        <p className="text-center text-sm text-slate-400 mt-4">Arahkan kamera Anda ke kode QR Dosen</p>
                        <button
                            onClick={toggleCamera}
                            className="btn-ghost w-full mt-4 flex items-center justify-center gap-2 py-3"
                        >
                            <RotateCcw className="h-4 w-4" /> Balik Kamera ({facingMode === "environment" ? "Belakang" : "Depan"})
                        </button>
                    </div>
                ) : (
                    <div className={`glass-card p-10 w-full text-center ${scanResult?.success ? '' : ''}`}
                        style={scanResult?.success ? { borderColor: 'rgba(16,185,129,0.3)' } : { borderColor: 'rgba(239,68,68,0.3)' }}>
                        {scanResult?.success ? (
                            <>
                                <div className="h-20 w-20 rounded-2xl bg-emerald-500/15 flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle className="h-12 w-12 text-emerald-400" />
                                </div>
                                <h2 className="text-3xl font-bold text-emerald-300 mb-2">Berhasil Hadir!</h2>
                                <p className="text-emerald-400/70">{scanResult.message}</p>
                            </>
                        ) : (
                            <>
                                <div className="h-20 w-20 rounded-2xl bg-red-500/15 flex items-center justify-center mx-auto mb-6">
                                    <XCircle className="h-12 w-12 text-red-400" />
                                </div>
                                <h2 className="text-3xl font-bold text-red-300 mb-2">Gagal</h2>
                                <p className="text-red-400/70">{scanResult?.message}</p>
                            </>
                        )}

                        <button
                            onClick={() => { setScanResult(null); setScanning(true); }}
                            className="btn-ghost mt-8 inline-flex items-center gap-2"
                        >
                            Pindai Kode Lain
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}

export default function StudentScan() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="spinner"></div>
            </div>
        }>
            <ScanContent />
        </Suspense>
    );
}
