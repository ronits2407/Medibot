import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/db/client";
import { MyMedicine } from "@/lib/db/models/MyMedicine";
import { Medicine } from "@/lib/db/models/Medicine";

// In-memory chronic medicines fallback
let inMemorySavedMeds = [
  {
    _id: "demo-med-1",
    userId: "demo-user",
    medicineName: "Dolo 650 Tablet",
    dosage: "650mg",
    frequency: "As needed for fever/pain",
    refillEveryDays: 30,
    lastRefill: new Date().toISOString(),
    reminderChannel: "email",
    activeIngredients: [{ saltName: "Paracetamol", strength: "650mg" }],
  },
  {
    _id: "demo-med-2",
    userId: "demo-user",
    medicineName: "Allegra 120mg Tablet",
    dosage: "120mg",
    frequency: "Once daily evening",
    refillEveryDays: 30,
    lastRefill: new Date(Date.now() - 15 * 86400000).toISOString(),
    reminderChannel: "in_app",
    activeIngredients: [{ saltName: "Fexofenadine", strength: "120mg" }],
  },
];

export async function GET(req: NextRequest) {
  try {
    const session = await auth().catch(() => null);
    const userId = session?.user?.id || session?.user?.email || "demo-user";

    try {
      await connectToDatabase();
      const medicines = await MyMedicine.find({ userId }).sort({ createdAt: -1 });
      if (medicines && medicines.length > 0) {
        return NextResponse.json({ medicines });
      }
    } catch {}

    return NextResponse.json({ medicines: inMemorySavedMeds });
  } catch (error: any) {
    return NextResponse.json({ medicines: inMemorySavedMeds });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth().catch(() => null);
    const userId = session?.user?.id || session?.user?.email || "demo-user";

    const body = await req.json();
    const { medicineName, dosage, frequency, refillEveryDays, reminderChannel, lastRefill } = body;

    if (!medicineName) {
      return NextResponse.json({ error: "Medicine name is required" }, { status: 400 });
    }

    try {
      await connectToDatabase();
      const matched = await Medicine.findOne({
        name: { $regex: new RegExp(`^${medicineName.trim()}$`, "i") },
      });

      const newMed = await MyMedicine.create({
        userId,
        medicineName: matched ? matched.name : medicineName.trim(),
        medicineId: matched?._id,
        dosage: dosage || "Standard",
        activeIngredients: (matched?.composition || []).map((c: any) => ({
          saltName: c.salt,
          strength: `${c.strength || ""}${c.unit || ""}`.trim(),
        })),
        compositionHash: matched?.compositionHash,
        frequency: frequency || "Once daily",
        refillEveryDays: Number(refillEveryDays) || 30,
        lastRefill: lastRefill ? new Date(lastRefill) : new Date(),
        reminderChannel: reminderChannel || "in_app",
      });

      return NextResponse.json({ success: true, medicine: newMed });
    } catch {
      // In-memory fallback
      const fallbackMed = {
        _id: `mem-${Date.now()}`,
        userId,
        medicineName: medicineName.trim(),
        dosage: dosage || "Standard",
        frequency: frequency || "Once daily",
        refillEveryDays: Number(refillEveryDays) || 30,
        lastRefill: lastRefill || new Date().toISOString(),
        reminderChannel: reminderChannel || "in_app",
        activeIngredients: [{ saltName: medicineName.trim(), strength: dosage || "" }],
      };
      inMemorySavedMeds.unshift(fallbackMed);
      return NextResponse.json({ success: true, medicine: fallbackMed });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
