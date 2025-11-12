import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { Database } from "@/types/supabase";
import { put } from "@vercel/blob";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/upload
 * Upload an image file to Vercel Blob storage
 */
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload an image." },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    // Get Vercel Blob token from environment variables
    // Note: @vercel/blob should automatically read from BLOB_READ_WRITE_TOKEN env var
    // But we can also pass it explicitly if needed
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    
    if (!blobToken) {
      console.error("BLOB_READ_WRITE_TOKEN is not set in environment variables");
      return NextResponse.json(
        { error: "Blob storage not configured. Please set BLOB_READ_WRITE_TOKEN in Vercel environment variables." },
        { status: 500 }
      );
    }

    // Upload to Vercel Blob
    // The token parameter is optional - @vercel/blob will use BLOB_READ_WRITE_TOKEN from env if not provided
    // But we pass it explicitly to ensure it's used
    const blob = await put(`${user.id}/${Date.now()}-${file.name}`, file, {
      access: "public",
      token: blobToken,
    });

    return NextResponse.json({
      url: blob.url,
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    
    // Provide more helpful error messages
    if (error instanceof Error) {
      if (error.message.includes("Access denied") || error.message.includes("token")) {
        return NextResponse.json(
          { 
            error: "Blob storage authentication failed. Please ensure BLOB_READ_WRITE_TOKEN is set in Vercel environment variables.",
            details: error.message 
          },
          { status: 500 }
        );
      }
      return NextResponse.json(
        { 
          error: "Failed to upload file",
          details: error.message 
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}

