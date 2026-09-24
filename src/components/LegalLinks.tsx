import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const LegalLinks = ({ className, showDelete = false }: { className?: string; showDelete?: boolean }) => (
  <p className={cn("text-xs text-muted-foreground text-center", className)}>
    <Link to="/privacy-policy" className="underline hover:text-foreground">Privacy Policy</Link>
    {" · "}
    <Link to="/terms" className="underline hover:text-foreground">Terms</Link>
    {showDelete && (
      <>
        {" · "}
        <Link to="/delete-account" className="underline hover:text-foreground">Delete account</Link>
      </>
    )}
  </p>
);

export default LegalLinks;
