import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Accedi",
  description:
    "Accedi al tuo dossier Armocromia. Login senza password tramite codice OTP via email.",
  robots: { index: false, follow: false },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
