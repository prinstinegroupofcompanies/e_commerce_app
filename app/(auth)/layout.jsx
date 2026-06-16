import { createSectionMetadata } from "@/lib/site-metadata";

export const metadata = createSectionMetadata("Sign in", "Sign in or create your Markay Hall account");

export default function AuthLayout({ children }) {
  return children;
}
