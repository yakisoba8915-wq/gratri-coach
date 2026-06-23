"use client";

import { getCurrentUser } from "./auth";
import { supabase } from "./supabase";
import type { PracticeVideo } from "./types";

const BUCKET_NAME = "practice-videos";
const SIGNED_URL_EXPIRES_IN = 60 * 60;
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["video/mp4", "video/quicktime", "video/webm"]);
const ALLOWED_EXTENSIONS = new Set(["mp4", "mov", "webm"]);

interface PracticeVideoRow {
  id: string;
  user_id: string;
  practice_log_id: string;
  trick_id: string;
  file_url: string;
  file_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  created_at: string;
}

interface UploadPracticeVideoParams {
  file: File;
  practiceLogId: string;
  trickId: string;
}

const fromVideoRow = (row: PracticeVideoRow): PracticeVideo => ({
  id: row.id,
  userId: row.user_id,
  practiceLogId: row.practice_log_id,
  trickId: row.trick_id,
  fileUrl: row.file_url,
  filePath: row.file_path,
  fileName: row.file_name,
  fileSize: row.file_size,
  mimeType: row.mime_type,
  createdAt: row.created_at,
});

function getFileExtension(fileName: string): string {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

function validateVideoFile(file: File): void {
  const extension = getFileExtension(file.name);
  if (!ALLOWED_MIME_TYPES.has(file.type) && !ALLOWED_EXTENSIONS.has(extension)) {
    throw new Error("対応形式は mp4 / mov / webm のみです。");
  }
  if (file.size > MAX_VIDEO_SIZE) {
    throw new Error("動画サイズは最大100MBまでです。");
  }
}

async function requireVideoUser(): Promise<string> {
  if (!supabase) throw new Error("Supabase Storage が未設定です。");
  const user = await getCurrentUser();
  if (!user) throw new Error("ログインすると動画を保存できます。");
  return user.id;
}

async function withSignedFileUrl(video: PracticeVideo): Promise<PracticeVideo> {
  if (!supabase) return video;
  const { data, error } = await supabase.storage.from(BUCKET_NAME).createSignedUrl(video.filePath, SIGNED_URL_EXPIRES_IN);
  if (error || !data?.signedUrl) return video;
  return { ...video, fileUrl: data.signedUrl };
}

export async function uploadPracticeVideo({ file, practiceLogId, trickId }: UploadPracticeVideoParams): Promise<PracticeVideo> {
  validateVideoFile(file);
  const userId = await requireVideoUser();
  if (!supabase) throw new Error("Supabase Storage が未設定です。");

  const extension = getFileExtension(file.name);
  const safeName = file.name.replace(/[^\w.\-]+/g, "_");
  const filePath = `${userId}/${practiceLogId}/${Date.now()}-${safeName || `practice-video.${extension}`}`;

  const { error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(filePath, file, {
    cacheControl: "3600",
    contentType: file.type || undefined,
    upsert: false,
  });
  if (uploadError) throw uploadError;

  const { data: signedUrlData } = await supabase.storage.from(BUCKET_NAME).createSignedUrl(filePath, SIGNED_URL_EXPIRES_IN);
  const fileUrl = signedUrlData?.signedUrl ?? "";

  const { data, error } = await supabase
    .from("practice_videos")
    .insert({
      user_id: userId,
      practice_log_id: practiceLogId,
      trick_id: trickId,
      file_url: fileUrl,
      file_path: filePath,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type || `video/${extension}`,
    })
    .select("*")
    .single();

  if (error) {
    await supabase.storage.from(BUCKET_NAME).remove([filePath]);
    throw error;
  }

  return withSignedFileUrl(fromVideoRow(data as PracticeVideoRow));
}

export async function getPracticeVideosByLogId(practiceLogId: string): Promise<PracticeVideo[]> {
  if (!supabase) return [];
  const user = await getCurrentUser();
  if (!user) return [];

  const { data, error } = await supabase.from("practice_videos").select("*").eq("user_id", user.id).eq("practice_log_id", practiceLogId).order("created_at", { ascending: true });
  if (error) {
    console.warn("[Gratri Coach] Failed to load practice videos.", error);
    return [];
  }

  return Promise.all((data as PracticeVideoRow[]).map((row) => withSignedFileUrl(fromVideoRow(row))));
}

export async function getPracticeVideosForCurrentUser(): Promise<PracticeVideo[]> {
  if (!supabase) return [];
  const user = await getCurrentUser();
  if (!user) return [];

  const { data, error } = await supabase.from("practice_videos").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
  if (error) {
    console.warn("[Gratri Coach] Failed to load practice videos.", error);
    return [];
  }

  return Promise.all((data as PracticeVideoRow[]).map((row) => withSignedFileUrl(fromVideoRow(row))));
}

export async function deletePracticeVideo(video: PracticeVideo): Promise<void> {
  const userId = await requireVideoUser();
  if (!supabase) throw new Error("Supabase Storage が未設定です。");

  const { error: deleteRowError } = await supabase.from("practice_videos").delete().eq("id", video.id).eq("user_id", userId);
  if (deleteRowError) throw deleteRowError;

  const { error: deleteFileError } = await supabase.storage.from(BUCKET_NAME).remove([video.filePath]);
  if (deleteFileError) console.warn("[Gratri Coach] Failed to remove video file from Storage.", deleteFileError);
}
