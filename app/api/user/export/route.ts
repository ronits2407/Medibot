import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/db/client";
import { User } from "@/lib/db/models/User";
import { Chat } from "@/lib/db/models/Chat";
import { Message } from "@/lib/db/models/Message";
import { MyMedicine } from "@/lib/db/models/MyMedicine";
import { DisclaimerAck } from "@/lib/db/models/DisclaimerAck";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    const email = session?.user?.email;

    if (!userId && !email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const user = await User.findOne({
      $or: [{ _id: userId }, { email: email?.toLowerCase() }],
    }).lean();

    const chats = await Chat.find({
      $or: [{ userId: userId }, { userId: email }],
    }).lean();

    const chatIds = chats.map((c) => c._id);
    const messages = await Message.find({ chatId: { $in: chatIds } }).lean();

    const medicines = await MyMedicine.find({
      $or: [{ userId: userId }, { userId: email }],
    }).lean();

    const acks = await DisclaimerAck.find({
      $or: [{ userId: userId }, { userId: email }],
    }).lean();

    const exportData = {
      exportedAt: new Date().toISOString(),
      user: user ? { email: user.email, name: user.name, language: user.language, pincode: user.pincode } : null,
      medicines,
      chats,
      messages,
      disclaimerAcknowledgements: acks,
      complianceNote: "Exported in accordance with DPDP (Digital Personal Data Protection) Act standards.",
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": 'attachment; filename="medibot-export.json"',
      },
    });
  } catch (error: any) {
    console.error("GET /api/user/export error:", error);
    return NextResponse.json({ error: error.message || "Failed to export data" }, { status: 500 });
  }
}
