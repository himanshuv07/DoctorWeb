import { NextRequest } from "next/server";

export function getUser(req: NextRequest) {
  const id = req.headers.get("x-user-id");
  const email = req.headers.get("x-user-email");
  const role = req.headers.get("x-user-role");

  if (!id || !email || !role) return null;

  return {
    id: Number(id),
    email,
    role,
  };
}