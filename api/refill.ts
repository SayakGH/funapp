import { VercelRequest, VercelResponse } from "@vercel/node";
import { MockDynamoDB } from "@/lib/firebase";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ error: "Missing username" });
    }

    const user = await MockDynamoDB.getUser(username);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.pollars >= 1000) {
      return res
        .status(400)
        .json({ error: "Can only refill if below 1000 pollars" });
    }

    const updatedUser = await MockDynamoDB.updateUser(username, {
      pollars: user.pollars + 10000,
      rebirths: user.rebirths + 1,
    });

    if (!updatedUser) {
      return res.status(500).json({ error: "Failed to update user" });
    }

    res.json({
      user: {
        username: updatedUser.username,
        pollars: updatedUser.pollars,
        rebirths: updatedUser.rebirths,
        id: updatedUser.id,
      },
    });
  } catch (error: any) {
    console.error("Refill error:", error?.message || error);
    res.status(500).json({ error: "Internal server error", details: error?.message });
  }
}
