import { VercelRequest, VercelResponse } from "@vercel/node";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { MockDynamoDB } from "../lib/firebase";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const user = await MockDynamoDB.getUser(username);
    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    res.json({
      user: {
        username: user.username,
        pollars: user.pollars,
        rebirths: user.rebirths,
        id: user.id,
      },
    });
  } catch (error: any) {
    console.error("Login error:", error?.message || error);
    res
      .status(500)
      .json({ error: "Internal server error", details: error?.message });
  }
}
