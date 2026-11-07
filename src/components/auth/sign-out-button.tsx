import { signOut } from "@/auth";

export function SignOutButton() {
  return <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}><button type="submit" className="sign-out-button">Sign out</button></form>;
}
