import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Flashsport — Camisetas de fútbol";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#faf9f7",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <h1 style={{ fontSize: 64, fontFamily: "sans-serif", color: "#1a1a1a" }}>
          Flashsport
        </h1>
      </div>
    ),
    { ...size },
  );
}
