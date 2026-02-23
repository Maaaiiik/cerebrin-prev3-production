import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
    color?: "indigo" | "emerald" | "blue" | "orange" | "purple" | "pink";
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction, color = "indigo" }: EmptyStateProps) {
    const colors = {
        indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
        emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        orange: "bg-orange-500/10 text-orange-400 border-orange-500/20",
        purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
        pink: "bg-pink-500/10 text-pink-400 border-pink-500/20",
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`flex flex-col items-center justify-center p-12 text-center rounded-3xl border-2 border-dashed ${colors[color].replace("text-", "border-").split(" ")[2]} bg-slate-900/30`}
        >
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-lg backdrop-blur-sm ${colors[color]}`}>
                <Icon size={40} />
            </div>
            <h3 className="text-xl font-bold text-slate-200 mb-2">{title}</h3>
            <p className="text-slate-400 max-w-sm mb-8 leading-relaxed">
                {description}
            </p>
            {actionLabel && onAction && (
                <button
                    onClick={onAction}
                    className="px-6 py-3 bg-slate-100 text-slate-900 font-bold rounded-xl hover:bg-white hover:scale-105 transition-all shadow-lg shadow-white/10"
                >
                    {actionLabel}
                </button>
            )}
        </motion.div>
    );
}
