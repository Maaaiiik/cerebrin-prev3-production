/**
 * useResponsive — Hook para detección de breakpoints
 * 
 * Detecta el breakpoint actual y expone helpers para responsive design.
 * Basado en Tailwind v4 breakpoints.
 */

import { useEffect, useState } from "react";

export type Breakpoint = "mobile" | "tablet" | "desktop";

export interface ResponsiveState {
  breakpoint: Breakpoint;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isMobileOrTablet: boolean;
  width: number;
}

export function useResponsive(): ResponsiveState {
  const [state, setState] = useState<ResponsiveState>(() => {
    if (typeof window === "undefined") {
      return {
        breakpoint: "desktop",
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isMobileOrTablet: false,
        width: 1024,
      };
    }

    const w = window.innerWidth;
    const breakpoint: Breakpoint = w < 768 ? "mobile" : w < 1024 ? "tablet" : "desktop";

    return {
      breakpoint,
      isMobile: breakpoint === "mobile",
      isTablet: breakpoint === "tablet",
      isDesktop: breakpoint === "desktop",
      isMobileOrTablet: breakpoint !== "desktop",
      width: w,
    };
  });

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      const breakpoint: Breakpoint = w < 768 ? "mobile" : w < 1024 ? "tablet" : "desktop";

      setState({
        breakpoint,
        isMobile: breakpoint === "mobile",
        isTablet: breakpoint === "tablet",
        isDesktop: breakpoint === "desktop",
        isMobileOrTablet: breakpoint !== "desktop",
        width: w,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return state;
}
