import Link from "next/link";
import { AuthHeader } from "@/components/auth/auth-header";

export const metadata = { title: "Local setup — AI Engineering Academy" };

export default function SetupPage() {
  return <main className="home-shell auth-page"><AuthHeader /><section className="auth-card"><span className="eyebrow">OPTIONAL AI ASSISTANT</span><h1>Configure API<br />access separately.</h1><p>The assistant needs OpenAI API access configured on the server. Google sign-in authenticates your Academy account; API usage is billed separately.</p><ol className="setup-steps"><li>Copy <code>.env.example</code> to <code>.env.local</code>.</li><li>Set <code>OPENAI_API_KEY</code> to a secret key from your OpenAI API dashboard.</li><li>Set <code>OPENAI_MODEL</code> to an API model available in your project.</li><li>Restart <code>npm run dev</code> to load the environment variables.</li></ol><p>Keep API keys out of <code>NEXT_PUBLIC_*</code>, client code, and Git. You can read the curriculum without configuring the assistant.</p><Link className="auth-back" href="/">← Back to learning</Link></section></main>;
}
