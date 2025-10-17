import { UNKNOWN_ERROR } from "@/lib/error";

export async function POST(req: Request) {
  try {
  } catch (error) {
    const message = error instanceof Error ? error.message : UNKNOWN_ERROR;

    console.error(message);
    return Response.json({ error: message }, { status: 500 });
  }
}
