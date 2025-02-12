"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();

  useEffect(() => {
    // fetch the current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });

    // listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => authListener.subscription.unsubscribe();
  }, [supabase.auth]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    // reload page to update UI
    window.location.reload();
  };

  return (
    <nav className="p-4  flex justify-between items-center">
      <Link href="/">
        <div className="font-bold">Dots and Dashes</div>
      </Link>
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <span className="mr-2">Welcome, {user.email}</span>
            <Button onClick={handleSignOut}>Sign Out</Button>
          </>
        ) : (
          <>
            <Link href="/auth/login">
              <Button>Login</Button>
            </Link>
            <Link href="/auth/signup">
              <Button>Register</Button>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
