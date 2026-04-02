"use client";

import { ConvexReactClient, ConvexProvider } from "convex/react";
import { ReactNode } from "react";

// Placeholder URL for development - replace with actual URL after running `npx convex dev`
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "https://placeholder.convex.cloud";

const convex = new ConvexReactClient(convexUrl);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
