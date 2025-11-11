"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { DANCE_STYLES } from "@/lib/dance-styles";
import { Upload, Video, Loader2 } from "lucide-react";
import Image from "next/image";

export default function GenerateVideoPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedDanceStyle, setSelectedDanceStyle] = useState<string>("");
  const [petDescription, setPetDescription] = useState<string>("");
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
          petDescription: petDescription || undefined,
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Create Your Pet's Dancing Video</h1>
        <p className="text-muted-foreground">
          Upload a photo of your pet and choose a dance style to generate an amazing video!
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Image Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle>1. Upload Pet Photo</CardTitle>
            <CardDescription>Choose a clear photo of your pet</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              {imagePreview ? (
                <div className="space-y-4">
                  <div className="relative w-full aspect-square rounded-lg overflow-hidden">
                    <Image
                      src={imagePreview}
                      alt="Pet preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedImage(null);
                      setImagePreview(null);
                    }}
                  >
                    Change Image
                  </Button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <Upload className="w-12 h-12 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Click to upload</p>
                      <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
                    </div>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageSelect}
                  />
                </label>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dance Style Selection */}
        <Card>
          <CardHeader>
            <CardTitle>2. Choose Dance Style</CardTitle>
            <CardDescription>Select how your pet should dance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
              {DANCE_STYLES.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedDanceStyle(style.id)}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    selectedDanceStyle === style.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="text-2xl mb-1">{style.emoji}</div>
                  <div className="font-semibold text-sm">{style.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {style.description}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pet Description (Optional) */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>3. Pet Description (Optional)</CardTitle>
          <CardDescription>
            Help us create a better video by describing your pet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="e.g., Golden retriever, fluffy white cat, small brown dog..."
            value={petDescription}
            onChange={(e) => setPetDescription(e.target.value)}
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Generate Button */}
      <div className="mt-6 flex justify-end">
        <Button
          size="lg"
          onClick={handleGenerate}
          disabled={!selectedImage || !selectedDanceStyle || isGenerating || uploadingImage}
          className="min-w-32"
        >
          {isGenerating || uploadingImage ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {uploadingImage ? "Uploading..." : "Generating..."}
            </>
          ) : (
            <>
              <Video className="mr-2 h-4 w-4" />
              Generate Video
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

