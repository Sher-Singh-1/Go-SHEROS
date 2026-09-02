import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/current-user";
import { buildProvisioningQrCode } from "@/lib/auth/totp";
import { TotpSetupView } from "./totp-setup-view";

export default async function SetupTotpPage() {
  const user = await requireUser();

  if (user.totpEnabled) {
    redirect(user.profile?.onboardedAt ? "/dashboard" : "/onboarding");
  }
  if (!user.totpSecret) {
    // Shouldn't happen — signup and login both provision a secret before
    // routing here — but fail safe rather than crash on a null QR.
    redirect("/login");
  }

  const { qrDataUrl } = await buildProvisioningQrCode(user.email, user.totpSecret);
  const manualKey = user.totpSecret.match(/.{1,4}/g)?.join(" ") ?? user.totpSecret;

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-8 shadow-[0_1px_2px_rgba(19,32,30,0.04),0_8px_24px_-12px_rgba(19,32,30,0.14)]">
        <TotpSetupView qrDataUrl={qrDataUrl} manualKey={manualKey} />
      </div>
    </div>
  );
}
