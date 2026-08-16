import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Stories — Naga Sai Teja",
  description: "Read my latest stories, thoughts, and writings.",
};

export default function StoriesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
