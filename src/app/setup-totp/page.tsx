import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/current-user";
import { buildProvisioningQrCode, ensureTotpSecret } from "@/lib/auth/totp";
import { TotpSetupView } from "./totp-setup-view";

export default async function SetupTotpPage() {
  const user = await requireUser();

  if (user.totpEnabled) {
    redirect(user.profile?.onboardedAt ? "/dashboard" : "/onboarding");
  }

  // Two-factor is optional and this page is revisitable at any time (from
  // signup, or later from Settings), so provision a secret on the fly if one
  // isn't already sitting on the account.
  const secret = await ensureTotpSecret(user.id, user.totpSecret);

  const { qrDataUrl } = await buildProvisioningQrCode(user.email, secret);
  const manualKey = secret.match(/.{1,4}/g)?.join(" ") ?? secret;

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-8 shadow-[0_1px_2px_rgba(19,32,30,0.04),0_8px_24px_-12px_rgba(19,32,30,0.14)]">
        <TotpSetupView qrDataUrl={qrDataUrl} manualKey={manualKey} />
      </div>
    </div>
  );
}
