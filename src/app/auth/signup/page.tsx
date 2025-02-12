"use client";
import { use, useState } from "react";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/client";

// export default function SignupPage({ searchParams }: { searchParams?: { error?: string } }) {
export default function SignupPage({
  params,
}: {
  params: Promise<{ searchParams?: { error?: string } }>;
}) {

  const supabase = createClient();
  const {searchParams} = use(params);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(searchParams?.error || "");

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setError(error.message);
    } else {
      redirect("/");
    }
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100 bg-dotted-pattern">
      <Card className="w-80">
        <CardHeader>
          <CardTitle className="text-center">Register</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="flex flex-col gap-4">
            <Input
              name="email"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              name="password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <p className="text-red-500 text-center">{error}</p>}
            <Button type="submit">Register</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
