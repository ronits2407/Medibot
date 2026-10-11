import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/db/client";
import { User } from "@/lib/db/models/User";
import { Chat } from "@/lib/db/models/Chat";
import { Message } from "@/lib/db/models/Message";
import { MyMedicine } from "@/lib/db/models/MyMedicine";
import { DisclaimerAck } from "@/lib/db/models/DisclaimerAck";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    const email = session?.user?.email;

    if (!userId && !email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    // 1. Delete all user chats & messages
    const userChats = await Chat.find({
      $or: [{ userId: userId }, { userId: email }],
    });
    const chatIds = userChats.map((c) => c._id);

    if (chatIds.length > 0) {
      await Message.deleteMany({ chatId: { $in: chatIds } });
      await Chat.deleteMany({ _id: { $in: chatIds } });
    }

    // 2. Delete all saved medicines
    await MyMedicine.deleteMany({
      $or: [{ userId: userId }, { userId: email }],
    });

    // 3. Delete disclaimer acks
    await DisclaimerAck.deleteMany({
      $or: [{ userId: userId }, { userId: email }],
    });

    // 4. Delete user record if not demo user
    if (email !== "demo@medibot.local") {
      await User.deleteOne({
        $or: [{ _id: userId }, { email: email?.toLowerCase() }],
      });
    }

    return NextResponse.json({
      success: true,
      message: "All personal health records, chats, medicines, and audit records have been permanently expunged.",
    });
  } catch (error: any) {
    console.error("POST /api/user/delete error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete user data" }, { status: 500 });
  }
}
