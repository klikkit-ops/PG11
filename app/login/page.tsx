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
    <div className="w-full h-full min-h-[calc(100vh-73px)] grid md:grid-cols-2 gap-8 p-8">
      <div className="flex flex-col items-center justify-center">
        <Login host={host} searchParams={searchParams} />
      </div>
      <div className="hidden md:flex items-center justify-center">
        <div className="relative w-full max-w-2xl aspect-square rounded-3xl overflow-hidden shadow-2xl">
          <img
            src="/pets-dance-party.png"
            alt="Pets Dance Party"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-purple-900/80 via-purple-900/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-12 text-white">
            <h2 className="text-3xl font-bold mb-4">Join the Party! 🎵</h2>
            <p className="text-lg text-white/90">
              Turn your pet into a dancing sensation. Create, share, and groove with thousands of other pet lovers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
