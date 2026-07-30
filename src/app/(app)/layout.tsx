import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth/get-profile";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Toaster } from "@/components/ui/sonner";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfile();
  if (!profile) redirect("/login");

  return (
    <>
      <Header profile={profile} />
      <main className="mx-auto w-full max-w-5xl flex-1 bg-background px-4 py-6 pb-24 md:pb-8 has-[[data-system-panel]]:mx-0 has-[[data-system-panel]]:max-w-none has-[[data-system-panel]]:px-0 has-[[data-system-panel]]:py-0 has-[[data-system-panel]]:pb-24 md:has-[[data-system-panel]]:pb-0">
        {children}
      </main>
      <MobileNav profile={profile} />
      <Toaster position="top-center" richColors />
    </>
  );
}
