import Link from "next/link";
import { PreferencesControl } from "@/components/preferences-control";
import { ThemeToggle } from "@/components/theme-toggle";

export function UtilityHeader() {
  return <header className="utility-topbar"><Link href="/" className="brand"><span className="brand-mark">A</span><span>AI Engineering <b>Academy</b></span></Link><div><PreferencesControl /><ThemeToggle /></div></header>;
}
