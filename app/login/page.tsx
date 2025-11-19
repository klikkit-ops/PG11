import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { Database } from "../../types/supabase";
import { Login } from "./components/Login";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const supabase = createServerComponentClient<Database>({ cookies });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/");
  }

  const headersList = headers();
  const host = headersList.get("host");

  return (
    <div className="w-full h-full min-h-[calc(100vh-73px)] flex items-center justify-center p-8">
      <div className="glass-panel w-full max-w-6xl grid md:grid-cols-2 gap-0 overflow-hidden p-0">
        <div className="flex flex-col items-center justify-center p-12">
          <Login host={host} searchParams={searchParams} />
        </div>
        <div className="hidden md:flex items-center justify-center relative bg-gradient-to-br from-purple-600/20 to-pink-600/20 p-8">
          <div className="relative w-full aspect-square rounded-2xl overflow-hidden shadow-xl">
            <img
              src="/pets-dance-party.png"
              alt="Pets Dance Party"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-purple-900/80 via-purple-900/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
              <h2 className="text-2xl font-bold mb-3">Join the Party! 🎵</h2>
              <p className="text-sm text-white/90">
                Turn your pet into a dancing sensation. Create, share, and groove with thousands of other pet lovers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
