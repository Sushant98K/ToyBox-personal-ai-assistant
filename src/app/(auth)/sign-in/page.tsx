import { Metadata } from "next";
import { AuthPage } from "@/features/auth";
import { siteConfig } from "@/config";

export const metadata: Metadata = {
  title: `Sign In – ${siteConfig.name}`,
  description: `Sign in to your ${siteConfig.name} account to access your executive inbox and autonomous agents.`,
};

export default function SignInPage() {
  return <AuthPage initialMode="sign-in" />;
}
