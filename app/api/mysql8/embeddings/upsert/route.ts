import { embeddings } from "@/lib/embedding";
import { UNKNOWN_ERROR } from "@/lib/error";
import { conn, pool } from "@/lib/mysql";
import { f32 } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const text = body.text;

    console.log("✏ text mysql8: " + text);

    // 入力テキスト
    const content = text;
    const metadata = { inu: "🐶" };
    const vec = await embeddings.embedQuery(content);
    const f32 = new Float32Array(vec);
    const buf = Buffer.from(f32.buffer);

    // upsart
    await pool.execute(
      "INSERT INTO embeddings (doc_id, dim, vec_f32, meta) VALUES (?,?, ?, ?)",
      [content, f32.length, buf, metadata]
    );
    console.log("inserted");
    // await pool.end();

    return new Response(null, { status: 204 });
  } catch (error) {
    const message = error instanceof Error ? error.message : UNKNOWN_ERROR;

    console.error(message);
    return Response.json({ error: message }, { status: 500 });
  }
}
