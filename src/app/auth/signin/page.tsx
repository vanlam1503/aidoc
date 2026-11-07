import Link from "next/link";
import { signIn } from "@/auth";
import { isDatabaseConfigured, isGoogleOAuthConfigured } from "@/features/authentication/config";
import { AuthHeader } from "@/components/auth/auth-header";

export const metadata = { title: "Sign in — AI Engineering Academy" };
export const dynamic = "force-dynamic";

export default function SignInPage() {
  const ready = isDatabaseConfigured() && isGoogleOAuthConfigured();
  return <main className="auth-page"><AuthHeader /><section className="auth-card"><span className="eyebrow">YOUR LEARNING SPACE</span><h1>Sign in to save<br />your progress.</h1><p>Lessons are open to everyone. Sign in to save your progress, bookmark lessons, and use the AI learning assistant.</p>{ready ? <form action={async () => { "use server"; await signIn("google", { redirectTo: "/dashboard" }); }}><button className="button-primary auth-google" type="submit"><span aria-hidden="true">G</span> Continue with Google</button></form> : <div className="auth-config"><strong>Google sign-in is not configured</strong><span>Follow the README to set AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET, AUTH_SECRET, and DATABASE_URL, then apply the database migrations.</span></div>}<Link className="auth-back" href="/">← Continue reading lessons</Link></section><p className="auth-footnote">Google sign-in authenticates your Academy account. OpenAI API access is configured and billed separately.</p></main>;
}
