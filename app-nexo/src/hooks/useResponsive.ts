"use client";

import { useEffect, useState } from 'react';

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

export function useResponsive() {
    const [breakpoint, setBreakpoint] = useState<Breakpoint>(() => {
        if (typeof window === 'undefined') return 'desktop';
        const w = window.innerWidth;
        if (w < 768) return 'mobile';
        if (w < 1024) return 'tablet';
        return 'desktop';
    });

    useEffect(() => {
        const handleResize = () => {
            const w = window.innerWidth;
            if (w < 768) setBreakpoint('mobile');
            else if (w < 1024) setBreakpoint('tablet');
            else setBreakpoint('desktop');
        };

        window.addEventListener('resize', handleResize);
        // Trigger once on mount to ensure correct state after hydration
        handleResize();

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return {
        breakpoint,
        isMobile: breakpoint === 'mobile',
        isTablet: breakpoint === 'tablet',
        isDesktop: breakpoint === 'desktop',
        isMobileOrTablet: breakpoint !== 'desktop',
    };
}
