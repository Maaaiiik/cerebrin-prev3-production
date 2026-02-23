"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SheetProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    side?: "left" | "bottom";
    className?: string;
}

export function Sheet({ isOpen, onClose, children, side = "left", className }: SheetProps) {
    const isLeft = side === "left";

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[90]"
                    />
                    <motion.div
                        initial={isLeft ? { x: "-100%" } : { y: "100%" }}
                        animate={isLeft ? { x: 0 } : { y: 0 }}
                        exit={isLeft ? { x: "-100%" } : { y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className={cn(
                            "fixed bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 z-[100] shadow-2xl flex flex-col",
                            isLeft ? "left-0 top-0 bottom-0 w-72 border-r" : "left-0 right-0 bottom-0 h-[80vh] rounded-t-[2rem] border-t",
                            className
                        )}
                    >
                        <div className="absolute right-4 top-4 z-10">
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl transition-all"
                            >
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>
                        {children}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
