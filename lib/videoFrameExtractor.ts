"use client";

import { getCurrentUser } from "./auth";
import { supabase } from "./supabase";
import type { PracticeVideoFrame } from "./types";

const FRAME_BUCKET_NAME = "practice-video-frames";
const SIGNED_URL_EXPIRES_IN = 60 * 60;
const CAPTURE_PERCENTS = [25, 50, 75] as const;

export interface ExtractedVideoFrame {
  frameIndex: number;
  capturedAtPercent: number;
  blob: Blob;
  previewUrl: string;
}

interface UploadVideoFrameParams {
  frame: ExtractedVideoFrame;
  practiceVideoId: string;
  practiceLogId: string;
}

interface SaveVideoFrameMetadataParams {
  practiceVideoId: string;
  practiceLogId: string;
  frameUrl: string;
  framePath: string;
  frameIndex: number;
  capturedAtPercent: number;
}

interface PracticeVideoFrameRow {
  id: string;
  user_id: string;
  practice_video_id: string;
  practice_log_id: string;
  frame_url: string;
  frame_path: string;
  frame_index: number;
  captured_at_percent: number;
  created_at: string;
}

const fromFrameRow = (row: PracticeVideoFrameRow): PracticeVideoFrame => ({
  id: row.id,
  userId: row.user_id,
  practiceVideoId: row.practice_video_id,
  practiceLogId: row.practice_log_id,
  frameUrl: row.frame_url,
  framePath: row.frame_path,
  frameIndex: row.frame_index,
  capturedAtPercent: row.captured_at_percent,
  createdAt: row.created_at,
});

function waitForEvent(target: HTMLMediaElement, eventName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const cleanup = (): void => {
      target.removeEventListener(eventName, handleEvent);
      target.removeEventListener("error", handleError);
    };
    const handleEvent = (): void => {
      cleanup();
      resolve();
    };
    const handleError = (): void => {
      cleanup();
      reject(new Error("動画の読み込みに失敗しました。"));
    };
    target.addEventListener(eventName, handleEvent, { once: true });
    target.addEventListener("error", handleError, { once: true });
  });
}

function canvasToJpegBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("フレーム画像の生成に失敗しました。"));
          return;
        }
        resolve(blob);
      },
      "image/jpeg",
      0.86,
    );
  });
}

async function requireFrameUser(): Promise<string> {
  if (!supabase) throw new Error("Supabase Storage が未設定です。");
  const user = await getCurrentUser();
  if (!user) throw new Error("ログインするとAI動画解析を利用できます。");
  return user.id;
}

export async function extractFramesFromVideo(videoUrl: string): Promise<ExtractedVideoFrame[]> {
  if (typeof document === "undefined") {
    throw new Error("フレーム抽出はブラウザ上でのみ実行できます。");
  }

  const video = document.createElement("video");
  video.crossOrigin = "anonymous";
  video.muted = true;
  video.playsInline = true;
  video.preload = "metadata";
  video.src = videoUrl;

  await waitForEvent(video, "loadedmetadata");

  if (!Number.isFinite(video.duration) || video.duration <= 0 || video.videoWidth === 0 || video.videoHeight === 0) {
    throw new Error("動画の長さまたはサイズを取得できませんでした。");
  }

  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvasを初期化できませんでした。");

  const frames: ExtractedVideoFrame[] = [];

  for (const [index, percent] of CAPTURE_PERCENTS.entries()) {
    video.currentTime = Math.max(0, Math.min(video.duration - 0.05, video.duration * (percent / 100)));
    await waitForEvent(video, "seeked");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await canvasToJpegBlob(canvas);
    frames.push({
      frameIndex: index + 1,
      capturedAtPercent: percent,
      blob,
      previewUrl: URL.createObjectURL(blob),
    });
  }

  video.removeAttribute("src");
  video.load();

  return frames;
}

export async function uploadVideoFrame({ frame, practiceVideoId }: UploadVideoFrameParams): Promise<{ frameUrl: string; framePath: string }> {
  const userId = await requireFrameUser();
  if (!supabase) throw new Error("Supabase Storage が未設定です。");

  const framePath = `${userId}/${practiceVideoId}/frame-${frame.frameIndex}.jpg`;
  const { error: uploadError } = await supabase.storage.from(FRAME_BUCKET_NAME).upload(framePath, frame.blob, {
    cacheControl: "3600",
    contentType: "image/jpeg",
    upsert: true,
  });
  if (uploadError) throw uploadError;

  const { data } = await supabase.storage.from(FRAME_BUCKET_NAME).createSignedUrl(framePath, SIGNED_URL_EXPIRES_IN);
  return { frameUrl: data?.signedUrl ?? "", framePath };
}

export async function saveVideoFrameMetadata(params: SaveVideoFrameMetadataParams): Promise<PracticeVideoFrame> {
  const userId = await requireFrameUser();
  if (!supabase) throw new Error("Supabase が未設定です。");

  const { data, error } = await supabase
    .from("practice_video_frames")
    .insert({
      user_id: userId,
      practice_video_id: params.practiceVideoId,
      practice_log_id: params.practiceLogId,
      frame_url: params.frameUrl,
      frame_path: params.framePath,
      frame_index: params.frameIndex,
      captured_at_percent: params.capturedAtPercent,
    })
    .select("*")
    .single();

  if (error) throw error;
  return fromFrameRow(data as PracticeVideoFrameRow);
}
