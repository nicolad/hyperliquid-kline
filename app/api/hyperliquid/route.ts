import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log("🔄 [API PROXY] Forwarding request to Hyperliquid:", body);

    const response = await fetch("https://api.hyperliquid.xyz/info", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "No error details");
      console.error(
        `❌ [API PROXY] Hyperliquid API error: ${response.status} ${response.statusText}`
      );
      console.error(`❌ [API PROXY] Error details:`, errorText);

      return NextResponse.json(
        {
          error: `Hyperliquid API error: ${response.status} ${response.statusText}`,
          details: errorText,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(
      `✅ [API PROXY] Successfully fetched data, records:`,
      Array.isArray(data) ? data.length : "N/A"
    );

    return NextResponse.json(data);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ [API PROXY] Unexpected error:", errorMessage);
    console.error("❌ [API PROXY] Error stack:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch data from Hyperliquid",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
