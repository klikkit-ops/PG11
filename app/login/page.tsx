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
      <div className="w-full max-w-5xl relative">
        {/* Decorative Avatar */}
        <div className="absolute -bottom-8 -left-8 md:-left-16 w-32 md:w-48 rotate-[-10deg] pointer-events-none z-20 hidden md:block">
          <img src="/avatars/dog-tuxedo.png" alt="Dapper Dog" className="w-full h-auto drop-shadow-2xl" />
        </div>

        <div className="glass-panel grid md:grid-cols-2 overflow-hidden relative z-10">
          <div className="p-12 flex items-center justify-center bg-white/40 backdrop-blur-md">
            <Login host={host} searchParams={searchParams} />
          </div>
          <div className="relative hidden md:block bg-gradient-to-br from-primary/20 to-secondary/20 p-8">
            <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />
            <div className="relative h-full w-full flex flex-col items-center justify-center text-center space-y-6">
              <div className="relative w-full aspect-square max-w-md rounded-3xl overflow-hidden shadow-2xl rotate-3 hover:rotate-0 transition-all duration-500">
                <img
                  src="/pets-dance-party.png"
                  alt="Pets Dance Party"
                  className="object-cover w-full h-full"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h2 className="text-2xl font-bold mb-2">Join the Party! 🎵</h2>
                  <p className="text-white/90 text-sm">
                    Turn your pet into a dancing sensation in seconds.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
