import { VercelRequest, VercelResponse } from "@vercel/node";
import { MockDynamoDB } from "@/lib/firebase";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const top10 = await MockDynamoDB.getTop10Users();
    res.json({ leaderboard: top10 });
  } catch (error) {
    console.error("Leaderboard error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
