import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { Database } from "../../types/supabase";
import { Login } from "./components/Login";
import { PetAvatar } from "@/components/PetAvatar"

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { message: string }
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
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <PetAvatar index={3} className="absolute bottom-0 left-10 hidden lg:block" size={250} animate />

      <div className="w-full max-w-5xl glass-panel p-8 md:p-12 relative z-10">
        {/* ... existing content */}
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="w-full max-w-md mx-auto">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                Welcome back
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Sign in to your account to continue
              </p>
            </div>

            <Login host={host} searchParams={searchParams} />
          </div>

          <div className="hidden md:block relative h-full min-h-[400px]">
            <div className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl aspect-square mx-auto max-w-[400px]">
              <img
                src="/hero.png"
                alt="Login visual"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
                <div className="text-white">
                  <h3 className="text-2xl font-bold mb-2">Create Magic</h3>
                  <p className="text-white/90">Turn your pet photos into viral dance videos in seconds.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
