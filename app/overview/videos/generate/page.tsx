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
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-8">
            {/* Step 1: Upload Your Pet's Photo */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-yellow-400">1. Upload Your Pet's Photo</h2>
              <label className="block">
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-12 cursor-pointer hover:border-gray-500 transition-colors bg-gray-900/50">
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
                        onClick={(e) => {
                          e.preventDefault();
                          setSelectedImage(null);
                          setImagePreview(null);
                        }}
                        className="w-full"
                      >
                        Change Image
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center space-y-4 text-center">
                      <Upload className="w-16 h-16 text-gray-400" />
                      <div>
                        <p className="text-lg font-medium text-white">Click to upload an image</p>
                        <p className="text-sm text-gray-400 mt-2">PNG, JPG, WEBP</p>
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

            {/* Step 2: Choose a Dance */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-yellow-400">2. Choose a Dance</h2>
              <Select value={selectedDanceStyle} onValueChange={setSelectedDanceStyle}>
                <SelectTrigger className="w-full h-12 border-purple-500/50 bg-gray-900/50 text-white">
                  <SelectValue>
                    {selectedStyle ? (
                      <span className="flex items-center gap-2">
                        <span>{selectedStyle.emoji}</span>
                        <span>The {selectedStyle.name}</span>
                      </span>
                    ) : (
                      "Select a dance style"
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  {DANCE_STYLES.map((style) => (
                    <SelectItem
                      key={style.id}
                      value={style.id}
                      className="text-white hover:bg-gray-800"
                    >
                      <span className="flex items-center gap-2">
                        <span>{style.emoji}</span>
                        <span>The {style.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleGenerate}
                disabled={!selectedImage || !selectedDanceStyle || isGenerating || uploadingImage}
                className="w-full h-12 text-white font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating || uploadingImage ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {uploadingImage ? "Uploading..." : "Generating..."}
                  </>
                ) : (
                  "Generate Video (1 Credit)"
                )}
              </Button>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-yellow-400">3. Watch The Magic!</h2>
            <div className="bg-black rounded-lg aspect-video flex items-center justify-center border-2 border-gray-800">
              {imagePreview && !isGenerating ? (
                <div className="text-center space-y-4 p-8">
                  <Film className="w-16 h-16 text-gray-600 mx-auto" />
                  <p className="text-gray-400 text-lg">Your generated video will appear here</p>
                </div>
              ) : isGenerating || uploadingImage ? (
                <div className="text-center space-y-4 p-8">
                  <Loader2 className="w-16 h-16 text-purple-500 mx-auto animate-spin" />
                  <p className="text-gray-400 text-lg">
                    {uploadingImage ? "Uploading image..." : "Generating your video..."}
                  </p>
                </div>
              ) : (
                <div className="text-center space-y-4 p-8">
                  <Film className="w-16 h-16 text-gray-600 mx-auto" />
                  <p className="text-gray-400 text-lg">Your generated video will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

