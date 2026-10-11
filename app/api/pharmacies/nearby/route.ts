import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pincode = searchParams.get("pincode")?.trim() || "110001";
    let lat = parseFloat(searchParams.get("lat") || "");
    let lng = parseFloat(searchParams.get("lng") || "");

    // Approximate fallback coordinates based on PIN code prefix if lat/lng not provided
    if (isNaN(lat) || isNaN(lng)) {
      if (pincode.startsWith("78")) {
        // Assam / North East (e.g. 781335 Nalbari, 781039 Guwahati)
        lat = 26.445;
        lng = 91.435;
      } else if (pincode.startsWith("11")) {
        // Delhi
        lat = 28.6139;
        lng = 77.209;
      } else if (pincode.startsWith("40")) {
        // Mumbai
        lat = 18.9388;
        lng = 72.8354;
      } else if (pincode.startsWith("56")) {
        // Bengaluru
        lat = 12.9716;
        lng = 77.5946;
      } else if (pincode.startsWith("60")) {
        // Chennai
        lat = 13.0827;
        lng = 80.2707;
      } else if (pincode.startsWith("70")) {
        // Kolkata
        lat = 22.5726;
        lng = 88.3639;
      } else {
        lat = 28.6139;
        lng = 77.209;
      }
    }

    const nearbyPharmacies = [
      {
        id: "p-janaushadhi",
        name: "PMBJP Jan Aushadhi Kendra",
        brand: "Jan Aushadhi",
        tag: "Govt Subsidized • Up to 70% Off",
        badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
        address: `Govt Community Health Complex, Near Main Station Road, PIN ${pincode}`,
        distanceKm: 0.8,
        isOpen24Hours: false,
        timing: "08:30 AM - 09:30 PM",
        slaText: "Same-Day Collection / 24h Delivery",
        lat: lat + 0.0042,
        lng: lng + 0.0035,
        rating: 4.8,
        reviewsCount: 342,
        googleMapsQuery: `Jan+Aushadhi+Kendra+${pincode}`,
      },
      {
        id: "p-apollo",
        name: "Apollo Pharmacy 24|7",
        brand: "Apollo",
        tag: "24/7 Service • Express Delivery",
        badgeColor: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
        address: `Shop 14-16, City Centre Avenue, PIN ${pincode}`,
        distanceKm: 1.4,
        isOpen24Hours: true,
        timing: "Open 24 Hours",
        slaText: "2-Hour Express Delivery Available",
        lat: lat - 0.0055,
        lng: lng + 0.0068,
        rating: 4.6,
        reviewsCount: 820,
        googleMapsQuery: `Apollo+Pharmacy+${pincode}`,
      },
      {
        id: "p-1mg",
        name: "Tata 1mg Healthcare Hub",
        brand: "1mg",
        tag: "Certified Partner • Lab & Rx Support",
        badgeColor: "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300",
        address: `Fulfillment Center #4, Metro Link Road, PIN ${pincode}`,
        distanceKm: 2.1,
        isOpen24Hours: false,
        timing: "08:00 AM - 10:00 PM",
        slaText: "4-Hour Fast Delivery",
        lat: lat + 0.0095,
        lng: lng - 0.0072,
        rating: 4.7,
        reviewsCount: 512,
        googleMapsQuery: `1mg+Pharmacy+${pincode}`,
      },
      {
        id: "p-pharmeasy",
        name: "PharmEasy Local Delivery Hub",
        brand: "PharmEasy",
        tag: "Bulk Discounts • Verified Stock",
        badgeColor: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
        address: `Block B, Industrial Distribution Yard, PIN ${pincode}`,
        distanceKm: 3.3,
        isOpen24Hours: false,
        timing: "09:00 AM - 08:30 PM",
        slaText: "Standard Delivery (6 Hours)",
        lat: lat - 0.0125,
        lng: lng - 0.011,
        rating: 4.5,
        reviewsCount: 290,
        googleMapsQuery: `PharmEasy+hub+${pincode}`,
      },
      {
        id: "p-medplus",
        name: "MedPlus Chemist & Superstore",
        brand: "MedPlus",
        tag: "Locally Stocked • Genuine Meds",
        badgeColor: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
        address: `Near Market Circle, Ground Floor, PIN ${pincode}`,
        distanceKm: 3.9,
        isOpen24Hours: false,
        timing: "08:00 AM - 11:00 PM",
        slaText: "Walk-in & Local Courier",
        lat: lat + 0.0145,
        lng: lng + 0.0135,
        rating: 4.4,
        reviewsCount: 175,
        googleMapsQuery: `MedPlus+Pharmacy+${pincode}`,
      },
    ];

    return NextResponse.json({
      success: true,
      userLocation: {
        pincode,
        lat,
        lng,
      },
      pharmacies: nearbyPharmacies,
    });
  } catch (error: any) {
    console.error("GET /api/pharmacies/nearby error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to locate nearby pharmacies" },
      { status: 500 }
    );
  }
}
