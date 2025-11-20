import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Database } from "@/types/supabase";
import { PetAvatar } from "@/components/ui/pet-avatar";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Video, Plus, Download, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import Image from "next/image";
import { getDanceStyleById } from "@/lib/dance-styles";

export const dynamic = "force-dynamic";

export default async function VideosPage() {
  const supabase = createServerComponentClient<Database>({ cookies });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user's videos
  const { data: videos, error } = await supabase
    .from("videos")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching videos:", error);
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "succeeded":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "processing":
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case "queued":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "succeeded":
        return "Ready";
      case "failed":
        return "Failed";
      case "processing":
        return "Processing";
      case "queued":
        return "Queued";
      default:
        return status;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 relative">
      {/* Decorative pet avatars in side margins */}
      <PetAvatar petId={5} size="lg" style={{ position: 'fixed', bottom: '6rem', right: '1rem' }} className="hidden 2xl:block" />
      <PetAvatar petId={3} size="md" style={{ position: 'fixed', top: '10rem', left: '1rem' }} className="hidden 2xl:block" />

      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">Your Pet Videos</h1>
          <p className="text-muted-foreground text-lg">
            View and manage your pet's dancing videos
          </p>
        </div>
        <Link href="/overview/videos/generate" className="mt-4 md:mt-0">
          <Button size="lg" variant="gradient" className="rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <Plus className="mr-2 h-5 w-5" />
            Create New Video
          </Button>
        </Link>
      </div>

      {!videos || videos.length === 0 ? (
        <div className="glass-panel p-12 text-center">
          <div className="flex flex-col items-center justify-center">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <Video className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-2xl font-bold mb-2">No videos yet</h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Transform your pet into a dancing star! Upload a photo and let our AI work its magic.
            </p>
            <Link href="/overview/videos/generate">
              <Button size="lg" variant="gradient" className="rounded-full">
                <Plus className="mr-2 h-5 w-5" />
                Create Your First Video
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {videos.map((video) => {
            const danceStyle = getDanceStyleById(video.dance_style);
            return (
              <div key={video.id} className="glass-panel overflow-hidden group hover:border-primary/50 transition-all duration-300">
                <div className="relative w-full aspect-video bg-black/5">
                  {video.video_url && video.status === "succeeded" ? (
                    <video
                      src={video.video_url}
                      className="w-full h-full object-cover"
                      controls
                    />
                  ) : video.input_image_url ? (
                    <Image
                      src={video.input_image_url}
                      alt="Pet"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Video className="w-12 h-12 text-muted-foreground/30" />
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    <div className="bg-black/60 backdrop-blur-md rounded-full px-3 py-1 flex items-center gap-2 border border-white/10">
                      {getStatusIcon(video.status)}
                      <span className="text-xs font-medium text-white capitalize">
                        {getStatusText(video.status)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold flex items-center gap-2">
                        <span className="text-2xl">{danceStyle?.emoji}</span>
                        {danceStyle?.name || video.dance_style}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(video.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {video.error_message && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-xs text-destructive">
                      <p className="font-semibold mb-1">Generation Failed</p>
                      <p className="line-clamp-2 opacity-80">
                        {video.error_message.includes("{") ? "An error occurred during generation." : video.error_message}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <Link href={`/overview/videos/${video.id}`} className="flex-1">
                      <Button variant="outline" className="w-full rounded-full border-primary/20 hover:bg-primary/5 hover:text-primary">
                        View Details
                      </Button>
                    </Link>
                    {video.video_url && video.status === "succeeded" && (
                      <a href={video.video_url} download>
                        <Button variant="outline" size="icon" className="rounded-full border-primary/20 hover:bg-primary/5 hover:text-primary">
                          <Download className="h-4 w-4" />
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

