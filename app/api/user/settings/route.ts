import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/db/client";
import { User } from "@/lib/db/models/User";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const email = session?.user?.email || "demo@medibot.local";

    await connectToDatabase();
    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json({
        email,
        name: session?.user?.name || "Demo User",
        language: "en",
        pincode: "110001",
        disclaimerAckAt: new Date(),
        disclaimerVersion: "v1",
      });
    }

    return NextResponse.json({
      id: user._id,
      email: user.email,
      name: user.name,
      language: user.language || "en",
      pincode: user.pincode || "110001",
      disclaimerAckAt: user.disclaimerAckAt,
      disclaimerVersion: user.disclaimerVersion || "v1",
      createdAt: user.createdAt,
    });
  } catch (error: any) {
    console.error("GET /api/user/settings error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch settings" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const email = session?.user?.email || "demo@medibot.local";

    const body = await req.json();
    const { language, pincode } = body;

    await connectToDatabase();
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        email,
        name: session?.user?.name || "Demo User",
        language: language || "en",
        pincode: pincode || "110001",
        disclaimerAckAt: new Date(),
        disclaimerVersion: "v1",
      });
    } else {
      if (language) user.language = language;
      if (pincode) user.pincode = pincode;
      await user.save();
    }

    return NextResponse.json({
      success: true,
      user: {
        email: user.email,
        name: user.name,
        language: user.language,
        pincode: user.pincode,
        disclaimerAckAt: user.disclaimerAckAt,
      },
    });
  } catch (error: any) {
    console.error("POST /api/user/settings error:", error);
    return NextResponse.json({ error: error.message || "Failed to update settings" }, { status: 500 });
  }
}
