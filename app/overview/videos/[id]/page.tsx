import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Database } from "@/types/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, ArrowLeft, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getDanceStyleById } from "@/lib/dance-styles";
import VideoPlayer from "@/components/VideoPlayer";
import { VideoStatusPolling } from "./client";
import { AnimatedPaws } from "@/components/AnimatedPaws";

export const dynamic = "force-dynamic";

interface PageProps {
  params: {
    id: string;
  };
}

export default async function VideoDetailPage({ params }: PageProps) {
  const supabase = createServerComponentClient<Database>({ cookies });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get video
  const { data: video, error } = await supabase
    .from("videos")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (error || !video) {
    redirect("/overview/videos");
  }

  const danceStyle = getDanceStyleById(video.dance_style);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "succeeded":
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case "failed":
        return <XCircle className="w-6 h-6 text-red-500" />;
      case "processing":
        return <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />;
      case "queued":
        return <Clock className="w-6 h-6 text-yellow-500" />;
      default:
        return <Clock className="w-6 h-6 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "succeeded":
        return "Ready";
      case "failed":
        return "Failed";
      case "processing":
        return "Processing - This may take a few minutes";
      case "queued":
        return "Queued - Your video is in the queue";
      default:
        return status;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link href="/overview/videos">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Videos
        </Button>
      </Link>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Video Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Video</CardTitle>
            <CardDescription>{getStatusText(video.status)}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative w-full aspect-video bg-gradient-to-br from-primary/10 via-secondary/10 to-primary/10 rounded-lg overflow-hidden">
              {video.video_url && video.status === "succeeded" ? (
                <video
                  src={video.video_url}
                  className="w-full h-full object-cover"
                  controls
                  autoPlay
                />
              ) : video.input_image_url ? (
                <div className="relative w-full h-full">
                  <Image
                    src={video.input_image_url}
                    alt="Pet"
                    fill
                    className="object-cover"
                  />
                  {(video.status === "processing" || video.status === "queued") && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-primary/20 via-secondary/20 to-primary/20 backdrop-blur-sm">
                      <AnimatedPaws />
                      <p className="mt-4 text-sm font-medium text-foreground/80">
                        {video.status === "queued" ? "Queued..." : "Processing..."}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <AnimatedPaws />
                  <p className="mt-4 text-sm font-medium text-foreground/80">
                    {video.status === "queued" ? "Queued..." : "Processing..."}
                  </p>
                </div>
              )}
            </div>
            {video.video_url && video.status === "succeeded" && (
              <div className="mt-4">
                <a href={video.video_url} download>
                  <Button className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Download Video
                  </Button>
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Video Details */}
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Dance Style
              </label>
              <p className="text-lg font-semibold">
                {danceStyle?.emoji} {danceStyle?.name || video.dance_style}
              </p>
              {danceStyle?.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {danceStyle.description}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Status
              </label>
              <div className="flex items-center gap-2 mt-1">
                {getStatusIcon(video.status)}
                <p className="font-medium">{getStatusText(video.status)}</p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Created
              </label>
              <p className="text-sm">
                {new Date(video.created_at).toLocaleString()}
              </p>
            </div>

            {video.updated_at && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Updated
                </label>
                <p className="text-sm">
                  {new Date(video.updated_at).toLocaleString()}
                </p>
              </div>
            )}

            {video.error_message && (
              <div>
                <label className="text-sm font-medium text-red-500">
                  Error
                </label>
                <p className="text-sm text-red-500">{video.error_message}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Auto-refresh if processing */}
      {video.status === "processing" || video.status === "queued" ? (
        <>
          <VideoStatusPolling videoId={video.id} initialStatus={video.status} />
          <div className="mt-6">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground text-center">
                  This page will automatically refresh when your video is ready.
                  Video generation typically takes 2-5 minutes.
                </p>
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}

