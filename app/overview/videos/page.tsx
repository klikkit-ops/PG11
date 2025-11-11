import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Database } from "@/types/supabase";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Your Pet Videos</h1>
          <p className="text-muted-foreground">
            View and manage your pet's dancing videos
          </p>
        </div>
        <Link href="/overview/videos/generate">
          <Button size="lg">
            <Plus className="mr-2 h-4 w-4" />
            Create New Video
          </Button>
        </Link>
      </div>

      {!videos || videos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Video className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No videos yet</h3>
            <p className="text-muted-foreground mb-6 text-center">
              Create your first pet dancing video to get started!
            </p>
            <Link href="/overview/videos/generate">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Video
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {videos.map((video) => {
            const danceStyle = getDanceStyleById(video.dance_style);
            return (
              <Card key={video.id} className="overflow-hidden">
                <div className="relative w-full aspect-video bg-muted">
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
                      <Video className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    {getStatusIcon(video.status)}
                  </div>
                </div>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {danceStyle?.emoji} {danceStyle?.name || video.dance_style}
                      </CardTitle>
                      <CardDescription>
                        {getStatusText(video.status)}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Link href={`/overview/videos/${video.id}`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        View Details
                      </Button>
                    </Link>
                    {video.video_url && video.status === "succeeded" && (
                      <a href={video.video_url} download>
                        <Button variant="outline" size="icon">
                          <Download className="h-4 w-4" />
                        </Button>
                      </a>
                    )}
                  </div>
                  {video.error_message && (
                    <p className="text-sm text-red-500 mt-2">
                      {video.error_message}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

