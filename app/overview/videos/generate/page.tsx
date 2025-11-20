"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { DANCE_STYLES, getDanceStyleById } from "@/lib/dance-styles";
import { Upload, Loader2, ChevronDown, Film } from "lucide-react";
import Image from "next/image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function GenerateVideoPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedDanceStyle, setSelectedDanceStyle] = useState<string>("robot");
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload an image smaller than 10MB",
          variant: "destructive",
        });
        return;
      }

      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    setUploadingImage(true);
    try {
      // Upload to Vercel Blob or Supabase Storage
      // For now, we'll use a FormData approach
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload image");
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedImage) {
      toast({
        title: "No image selected",
        description: "Please upload an image of your pet",
        variant: "destructive",
      });
      return;
    }

    if (!selectedDanceStyle) {
      toast({
        title: "No dance style selected",
        description: "Please select a dance style",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Upload image first
      const imageUrl = await uploadImage(selectedImage);

      // Generate video
      const response = await fetch("/api/videos/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl,
          danceStyle: selectedDanceStyle,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate video");
      }

      toast({
        title: "Video generation started!",
        description: "Your pet's dancing video is being created. This may take a few minutes.",
      });

      // Redirect to video status page
      router.push(`/overview/videos/${data.videoId}`);
    } catch (error) {
      console.error("Error generating video:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate video",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const selectedStyle = getDanceStyleById(selectedDanceStyle);

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            Create Your Pet's Dance Video
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Upload a photo of your pet, choose a dance style, and watch the AI magic happen!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Step 1: Upload */}
          <div className="glass-panel p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-lg">
                1
              </div>
              <h2 className="text-2xl font-bold">Upload Photo</h2>
            </div>

            <label className="block cursor-pointer">
              <div className="border-2 border-dashed border-primary/30 rounded-2xl p-8 hover:border-primary/60 hover:bg-primary/5 transition-all duration-300">
                {imagePreview ? (
                  <div className="space-y-4">
                    <div className="relative w-full aspect-square rounded-xl overflow-hidden ring-2 ring-primary/20">
                      <Image
                        src={imagePreview}
                        alt="Pet preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <Button
                      variant="outline"
                      onClick={(e) => {
                        e.preventDefault();
                        setSelectedImage(null);
                        setImagePreview(null);
                      }}
                      className="w-full rounded-full"
                    >
                      Change Image
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-4 text-center py-8">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <Upload className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold">Click to upload</p>
                      <p className="text-sm text-muted-foreground mt-1">PNG, JPG, WEBP (max 10MB)</p>
                    </div>
                  </div>
                )}
                <input
                  type="file"
                  className="hidden"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleImageSelect}
                />
              </div>
            </label>
          </div>

          {/* Step 2: Choose Dance */}
          <div className="glass-panel p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-lg">
                2
              </div>
              <h2 className="text-2xl font-bold">Choose Dance</h2>
            </div>

            <div className="space-y-4">
              <Select value={selectedDanceStyle} onValueChange={setSelectedDanceStyle}>
                <SelectTrigger className="w-full h-14 rounded-full border-primary/20 hover:border-primary/40 transition-colors">
                  <SelectValue>
                    {selectedStyle ? (
                      <span className="flex items-center gap-3 text-base">
                        <span className="text-2xl">{selectedStyle.emoji}</span>
                        <span className="font-medium">The {selectedStyle.name}</span>
                      </span>
                    ) : (
                      "Select a dance style"
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {DANCE_STYLES.map((style) => (
                    <SelectItem
                      key={style.id}
                      value={style.id}
                      className="cursor-pointer"
                    >
                      <span className="flex items-center gap-3">
                        <span className="text-xl">{style.emoji}</span>
                        <span>The {style.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedStyle && (
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                  <p className="text-sm text-muted-foreground">{selectedStyle.description}</p>
                </div>
              )}

              <Button
                onClick={handleGenerate}
                disabled={!selectedImage || !selectedDanceStyle || isGenerating || uploadingImage}
                variant="gradient"
                className="w-full h-14 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:hover:scale-100"
              >
                {isGenerating || uploadingImage ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {uploadingImage ? "Uploading..." : "Generating..."}
                  </>
                ) : (
                  <>
                    <Film className="mr-2 h-5 w-5" />
                    Generate Video (1 Credit)
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Step 3: Preview */}
          <div className="glass-panel p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-lg">
                3
              </div>
              <h2 className="text-2xl font-bold">Watch Magic!</h2>
            </div>

            <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center border-2 border-primary/20">
              {isGenerating || uploadingImage ? (
                <div className="text-center space-y-4 p-8">
                  <div className="relative">
                    <Loader2 className="w-16 h-16 text-primary mx-auto animate-spin" />
                    <div className="absolute inset-0 blur-xl bg-primary/20 animate-pulse" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">
                      {uploadingImage ? "Uploading image..." : "Creating magic..."}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">This may take a few moments</p>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-4 p-8">
                  <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <Film className="w-10 h-10 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">Your video will appear here</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {imagePreview ? "Ready to generate!" : "Upload a photo to get started"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tips Section */}
        <div className="glass-panel p-8 relative overflow-hidden">
          {/* Decorative Avatar */}
          <div className="absolute -bottom-4 -right-4 w-24 md:w-32 -rotate-12 pointer-events-none opacity-80 hidden md:block">
            <img src="/avatars/dog-tutu.png" alt="Ballerina Dog" className="w-full h-auto drop-shadow-lg" />
          </div>

          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <span className="text-3xl">💡</span> Tips for Best Results
          </h2>
          <div className="grid md:grid-cols-3 gap-6 relative z-10">
            {[
              {
                title: "Clear Full Body",
                desc: "Ensure your pet's full body is visible and not cut off.",
                emoji: "📸"
              },
              {
                title: "Good Lighting",
                desc: "Bright, natural lighting works best. Avoid dark shadows.",
                emoji: "☀️"
              },
              {
                title: "Simple Background",
                desc: "A plain or uncluttered background helps the AI focus.",
                emoji: "🎨"
              }
            ].map((tip, i) => (
              <div key={i} className="bg-white/40 backdrop-blur-sm p-4 rounded-2xl border border-white/20">
                <div className="text-3xl mb-2">{tip.emoji}</div>
                <h3 className="font-bold mb-1">{tip.title}</h3>
                <p className="text-sm text-muted-foreground">{tip.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

