import Link from "next/link";
import { UtilityHeader } from "@/components/utility-header";

export const metadata = { title: "Local setup — AI Engineering Academy" };

export default function SetupPage() {
  return <main className="home-shell setup-page"><UtilityHeader /><section className="setup-card"><span className="eyebrow">OPTIONAL AI ASSISTANT</span><h1>Configure API<br />access separately.</h1><p>The assistant needs Google Gemini API access configured on the server. No account or sign-in is needed for local study.</p><ol className="setup-steps"><li>Copy <code>.env.example</code> to <code>.env</code>.</li><li>Set <code>GEMINI_API_KEY</code> to a key from <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">Google AI Studio</a>.</li><li>Optionally set <code>GEMINI_MODEL</code> to a model available in your Google project (default: <code>gemini-3.5-flash-lite</code>).</li><li>Restart <code>npm run dev</code> to load the environment variables.</li></ol><p>Keep API keys out of <code>NEXT_PUBLIC_*</code>, client code, and Git. You can read the curriculum without configuring the assistant.</p><Link className="setup-back" href="/">← Back to learning</Link></section></main>;
}
