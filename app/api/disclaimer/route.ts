import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/db/client";
import { User } from "@/lib/db/models/User";
import { DisclaimerAck } from "@/lib/db/models/DisclaimerAck";
import { DISCLAIMER_VERSION } from "@/lib/constants";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const body = await req.json().catch(() => ({}));
    const version = body.version || DISCLAIMER_VERSION;

    await connectToDatabase();

    const ipAddress =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || undefined;

    const ack = await DisclaimerAck.create({
      userId: session?.user?.id || undefined,
      sessionId: session?.user?.email || undefined,
      version,
      ackAt: new Date(),
      ipAddress,
      userAgent,
    });

    if (session?.user?.email) {
      await User.findOneAndUpdate(
        { email: session.user.email.toLowerCase() },
        {
          disclaimerAckAt: new Date(),
          disclaimerVersion: version,
        }
      );
    }

    return NextResponse.json({
      success: true,
      ackId: ack._id,
      version,
      ackAt: ack.ackAt,
    });
  } catch (error: any) {
    console.error("Error acknowledging disclaimer:", error);
    return NextResponse.json(
      { error: "Failed to record disclaimer acknowledgement", details: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ acknowledged: false, version: DISCLAIMER_VERSION });
    }

    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email.toLowerCase() });

    const acknowledged =
      !!user?.disclaimerAckAt && user.disclaimerVersion === DISCLAIMER_VERSION;

    return NextResponse.json({
      acknowledged,
      version: user?.disclaimerVersion || DISCLAIMER_VERSION,
      ackAt: user?.disclaimerAckAt || null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch disclaimer status", details: error.message },
      { status: 500 }
    );
  }
}
