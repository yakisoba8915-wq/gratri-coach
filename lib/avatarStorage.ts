"use client";

import { supabase } from "./supabase";

const BUCKET_NAME = "profile-avatars";
const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);

export interface UploadedAvatar {
  url: string;
  path: string;
}

function getFileExtension(fileName: string): string {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

function validateAvatar(file: File): string {
  const extension = getFileExtension(file.name);
  if (!ALLOWED_MIME_TYPES.has(file.type) && !ALLOWED_EXTENSIONS.has(extension)) {
    throw new Error("対応形式は jpg / jpeg / png / webp のみです。");
  }
  if (file.size > MAX_AVATAR_SIZE) {
    throw new Error("画像サイズは最大5MBまでです。");
  }
  return extension === "jpeg" ? "jpg" : extension;
}

export function getAvatarPublicUrl(path: string): string {
  if (!supabase || !path) return "";
  return supabase.storage.from(BUCKET_NAME).getPublicUrl(path).data.publicUrl;
}

export async function uploadAvatar(file: File, userId: string): Promise<UploadedAvatar> {
  if (!supabase) throw new Error("Supabase Storage が未設定です。");
  if (!userId) throw new Error("ログインするとプロフィール画像を設定できます。");

  const extension = validateAvatar(file);
  const path = `${userId}/avatar-${Date.now()}.${extension}`;

  const { error } = await supabase.storage.from(BUCKET_NAME).upload(path, file, {
    cacheControl: "3600",
    contentType: file.type || `image/${extension}`,
    upsert: true,
  });
  if (error) throw error;

  return { path, url: getAvatarPublicUrl(path) };
}

export async function deleteAvatar(path: string): Promise<void> {
  if (!supabase || !path) return;
  const { error } = await supabase.storage.from(BUCKET_NAME).remove([path]);
  if (error) throw error;
}
