import { Metadata } from "next";
import { AuthPage } from "@/features/auth";
import { siteConfig } from "@/config";

export const metadata: Metadata = {
  title: `Sign Up – ${siteConfig.name}`,
  description: `Create your ${siteConfig.name} account to distill multi-platform communication into executive briefs.`,
};

export default function SignUpPage() {
  return <AuthPage initialMode="sign-up" />;
}
