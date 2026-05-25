import { VercelRequest, VercelResponse } from "@vercel/node";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { MockDynamoDB } from "@/lib/firebase";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const existingUser = await MockDynamoDB.getUser(username);
    if (existingUser) {
      return res
        .status(400)
        .json({ error: "Username or email already exists" });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const newUser = {
      id: uuidv4(),
      username,
      email,
      passwordHash: hashedPassword,
      pollars: 10000,
      rebirths: 0,
    };

    await MockDynamoDB.createUser(newUser);
    res.json({
      user: { username, pollars: 10000, rebirths: 0, id: newUser.id },
    });
  } catch (error: any) {
    console.error("Register error:", error?.message || error);
    res.status(500).json({ error: "Internal server error", details: error?.message });
  }
}
