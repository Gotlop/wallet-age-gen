import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createCanvas, loadImage, registerFont } from "canvas";
import path from "path";
import { getTokenActivityBy, getOldestWalletAge } from "../utils/fetchAge";

type BaseParams = {
  address: `0x${string}`;
  data?: string;
  network?: "ethereum" | "base";
  useOldest?: string;
};

//wallet age image generator
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const {
      address,
      network = "ethereum",
      useOldest = "false",
    } = req.query as BaseParams;

    if (!address) {
      return res
        .status(400)
        .json({ error: "Valid Ethereum address is required" });
    }

    // Register custom font
    const fontPath = path.join(process.cwd(), "public", "satoshi.ttf");
    registerFont(fontPath, { family: "satoshi" });

    // Load template image
    const templatePath = path.join(process.cwd(), "public", "template.png");
    const templateImage = await loadImage(templatePath);

    // Get wallet age
    const walletActivity =
      useOldest === "true"
        ? await getOldestWalletAge(address)
        : await getTokenActivityBy(address, network as "ethereum" | "base");

    // Create canvas with template dimensions
    const canvas = createCanvas(templateImage.width, templateImage.height);
    const ctx = canvas.getContext("2d");

    // Draw template image as background
    ctx.drawImage(templateImage, 0, 0);

    // Set text properties
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Add shadow for text
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    // Display wallet age (main text) - positioned in top right
    ctx.fillStyle = "black";
    ctx.font = `bold 100px satoshi`;

    // Save current context state
    ctx.save();

    // Apply rotation for tilted text
    ctx.translate(canvas.width - 400, 210);
    ctx.rotate(0.165); // Tilt text slightly in opposite direction (about 5.7 degrees)

    const { years, months } = walletActivity.wallet_age;

    // Check if we have both years and months
    if (years > 0 && months > 0) {
      // Display on two lines
      const yearText = `${years} year${years > 1 ? "s" : ""}`;
      const monthText = `${months} month${months > 1 ? "s" : ""}`;

      // Draw years on first line
      ctx.fillText(yearText, 0, -60);

      // Draw months on second line
      ctx.fillText(monthText, 0, 60);
    } else if (years > 0) {
      // Only years
      const yearText = `${years} year${years > 1 ? "s" : ""}`;
      ctx.fillText(yearText, 0, 0);
    } else {
      // Only months
      const monthText = `${months} month${months > 1 ? "s" : ""}`;
      ctx.fillText(monthText, 0, 0);
    }

    // Restore context state
    ctx.restore();
    // Convert to PNG and send response
    const buffer = canvas.toBuffer("image/png");
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=300"); // Cache for 5 minutes
    res.send(buffer);
  } catch (error) {
    console.error("Error processing request:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
