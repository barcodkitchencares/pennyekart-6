import { ReactNode, useEffect } from "react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";
import LegalLinks from "@/components/LegalLinks";
import { LEGAL } from "@/lib/legal";

export const ContactBlock = () => (
  <div className="text-sm text-muted-foreground space-y-1">
    {LEGAL.privacyEmail ? (
      <p>Email: <a className="underline" href={`mailto:${LEGAL.privacyEmail}`}>{LEGAL.privacyEmail}</a></p>
    ) : (
      <p>Privacy contact email: to be published.</p>
    )}
    {LEGAL.businessAddress && <p>Address: {LEGAL.businessAddress}</p>}
    <p>Website: <a className="underline" href={LEGAL.website}>{LEGAL.website}</a></p>
  </div>
);

const LegalPageLayout = ({ title, description, children }: { title: string; description: string; children: ReactNode }) => {
  useEffect(() => {
    document.title = `${title} | Pennyekart`;
    document.querySelector('meta[name="description"]')?.setAttribute("content", description);
  }, [title, description]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container max-w-3xl py-4">
          <Link to="/"><img src={logo} alt="Pennyekart" className="h-8" /></Link>
        </div>
      </header>
      <main className="container max-w-3xl py-8 space-y-6 [&_h2]:font-heading [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-6 [&_p]:text-sm [&_li]:text-sm [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ul]:text-muted-foreground">
        <div>
          <h1 className="font-heading text-2xl font-bold">{title}</h1>
          <p className="text-xs text-muted-foreground">Last updated: {LEGAL.lastUpdated}</p>
        </div>
        {children}
        <LegalLinks showDelete className="pt-6 border-t" />
      </main>
    </div>
  );
};

export default LegalPageLayout;
