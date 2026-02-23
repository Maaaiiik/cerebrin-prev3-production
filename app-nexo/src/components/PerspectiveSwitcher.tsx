"use client";

import React, { useState } from "react";
import { useUserPerspective } from "@/context/UserPerspectiveContext";
import { cn } from "@/lib/utils";
import { Eye, Crown, Target, Sliders, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function PerspectiveSwitcher() {
    const { mode, setMode } = useUserPerspective();
    const [isOpen, setIsOpen] = useState(false);

    const options = [
        { id: "director", label: "Vista Director", icon: Crown },
        { id: "focus", label: "Vista Focus", icon: Target },
    ];

    const activeOption = options.find(o => o.id === mode) || options[1];

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-200 shadow-sm hover:border-indigo-500 transition-all"
            >
                <activeOption.icon size={16} className="text-indigo-500" />
                <span className="hidden md:inline">{activeOption.label}</span>
                <ChevronDown size={14} className={cn("transition-transform text-slate-400", isOpen && "rotate-180")} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden z-50 p-1.5"
                        >
                            <div className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                Perspectiva de Usuario
                            </div>

                            {options.map((option) => (
                                <button
                                    key={option.id}
                                    onClick={() => {
                                        setMode(option.id as any);
                                        setIsOpen(false);
                                    }}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-left",
                                        mode === option.id
                                            ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold"
                                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                                    )}
                                >
                                    <option.icon size={18} />
                                    {option.label}
                                </button>
                            ))}

                            <div className="h-px bg-slate-100 dark:bg-slate-800 my-1.5" />

                            <button
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-500 hover:text-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-left"
                            >
                                <Sliders size={18} />
                                Personalizar Vista
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
