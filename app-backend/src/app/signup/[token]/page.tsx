"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabase";
import { Loader2, Lock, Mail, Users, CheckCircle2, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function SignupPage() {
    const { token } = useParams();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [inviteInfo, setInviteInfo] = useState<any>(null);

    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (token) validateToken();
    }, [token]);

    const validateToken = async () => {
        try {
            const res = await fetch(`/api/invitations/validate?token=${token}`);
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Invitación inválida.");
            }

            setInviteInfo(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setVerifying(false);
            setLoading(false);
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // 1. Sign up user in Auth
            const { data: authData, error: authError } = await supabaseClient.auth.signUp({
                email: inviteInfo.email,
                password,
                options: {
                    data: {
                        full_name: name
                    }
                }
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error("No se pudo crear el usuario.");

            // 2. Accept Invitation (Backend function via API or direct call if allowed)
            // Using RPC for better atomicity
            const { data: acceptData, error: acceptError } = await supabaseClient.rpc('accept_invitation', {
                invite_token: token,
                target_user_id: authData.user.id
            });

            if (acceptError) throw acceptError;

            setSuccess(true);
            setTimeout(() => {
                router.push("/global");
            }, 3000);

        } catch (err: any) {
            console.error("Signup error:", err);
            setError(err.message || "Error al completar el registro.");
        } finally {
            setLoading(false);
        }
    };

    if (verifying) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
                <p className="text-slate-400 font-medium">Verificando invitación...</p>
            </div>
        );
    }

    if (error && !success) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-slate-900/50 border border-red-500/20 rounded-2xl p-8 text-center text-slate-200">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Lock className="text-red-400W" size={32} />
                    </div>
                    <h2 className="text-xl font-bold mb-2">Acceso No Autorizado</h2>
                    <p className="text-slate-400 text-sm mb-6">{error}</p>
                    <button
                        onClick={() => router.push("/login")}
                        className="text-indigo-400 hover:underline text-sm font-bold"
                    >
                        Volver al Inicio
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Abstract background */}
            <div className="absolute top-0 left-0 w-full h-full">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-600/10 blur-[120px] rounded-full" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full relative z-10"
            >
                <div className="bg-slate-900/50 backdrop-blur-2xl border border-slate-800 rounded-3xl p-8 shadow-2xl">
                    <AnimatePresence mode="wait">
                        {success ? (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-center py-8"
                            >
                                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-400">
                                    <CheckCircle2 size={48} className="animate-in zoom-in duration-500" />
                                </div>
                                <h1 className="text-2xl font-bold text-white mb-2">¡Bienvenido a Cerebrin!</h1>
                                <p className="text-slate-400">Tu cuenta ha sido vinculada con éxito. Redirigiendo...</p>
                            </motion.div>
                        ) : (
                            <motion.div key="form">
                                <header className="text-center mb-10">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 rounded-full border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-widest mb-4">
                                        <Users size={12} /> Invitación Especial
                                    </div>
                                    <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Completa tu Perfil</h1>
                                    <p className="text-slate-400 text-sm">Has sido invitado a unirte a <span className="text-indigo-400 font-bold">{inviteInfo.workspace_name}</span></p>
                                </header>

                                <form onSubmit={handleSignup} className="space-y-5">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Email (Confirmado)</label>
                                        <div className="relative group">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                                            <input
                                                disabled
                                                value={inviteInfo.email}
                                                className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 text-slate-500 cursor-not-allowed text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Tu Nombre Completo</label>
                                        <div className="relative group">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors" size={18} />
                                            <input
                                                required
                                                placeholder="Ej: Juan Pérez"
                                                value={name}
                                                onChange={e => setName(e.target.value)}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 text-white outline-none focus:border-indigo-500 transition-all text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Establecer Contraseña</label>
                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors" size={18} />
                                            <input
                                                required
                                                type="password"
                                                placeholder="••••••••"
                                                value={password}
                                                onChange={e => setPassword(e.target.value)}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 text-white outline-none focus:border-indigo-500 transition-all text-sm"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2 group disabled:opacity-50 mt-4"
                                    >
                                        {loading ? <Loader2 className="animate-spin" size={20} /> : (
                                            <>Unirme al Equipo <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
                                        )}
                                    </button>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <p className="text-center text-[10px] text-slate-600 mt-8 uppercase tracking-[0.2em]">
                    Powered by Cerebrin Intelligence
                </p>
            </motion.div>
        </div>
    );
}

function User(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    )
}
