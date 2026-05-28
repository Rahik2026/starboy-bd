import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json({
    success: false,
    message:
      "This project now uses Firebase Firestore for app data. The admin dashboard initializes Firestore from the browser. Supabase is used only for image storage.",
  });
}
