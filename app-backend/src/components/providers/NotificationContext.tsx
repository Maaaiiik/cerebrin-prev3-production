"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export interface Notification {
    id: string;
    type: "agent_alert" | "hitl_request" | "ticket_update" | "capacity_warning" | "payment_fail";
    title: string;
    body: string;
    workspace?: string;
    severity: "info" | "warning" | "critical";
    created_at: string;
    read: boolean;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    loading: boolean;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // PHI-OS v2: Real-time Telemetry via SSE
        const eventSource = new EventSource("/api/notifications/stream");

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                const newNotification: Notification = {
                    ...data,
                    read: false
                };
                setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep last 50
            } catch (err) {
                console.error("Error parsing SSE notification:", err);
            }
        };

        eventSource.onerror = (err) => {
            console.error("SSE connection failed. Retrying in 10s...", err);
            eventSource.close();
        };

        return () => {
            eventSource.close();
        };
    }, []);

    const markAsRead = async (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const markAllAsRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount: notifications.filter(n => !n.read).length,
            loading,
            markAsRead,
            markAllAsRead
        }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error("useNotifications must be used within a NotificationProvider");
    }
    return context;
}
