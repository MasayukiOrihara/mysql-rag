import { embeddings } from "@/lib/embedding";
import { UNKNOWN_ERROR } from "@/lib/error";
import { f32 } from "@/lib/utils";
import mysql from "mysql2/promise";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const text = body.text;

    console.log("✏ text: " + text);

    // mysql 接続
    const conn = await mysql.createConnection({
      host: "localhost",
      port: 3306,
      user: "root",
      password: "rootpass",
      database: "ragdb",
    });

    // 入力テキスト
    const content = text;
    const metadata = { inu: "🐶" };
    const vec = await embeddings.embedQuery(content);
    const buf = f32(vec);

    // upsart
    await conn.execute(
      "INSERT INTO docs (content, embedding, metadata) VALUES (?, ?, ?)",
      [content, buf, metadata]
    );
    console.log("inserted");
    await conn.end();

    return new Response(null, { status: 204 });
  } catch (error) {
    const message = error instanceof Error ? error.message : UNKNOWN_ERROR;

    console.error(message);
    return Response.json({ error: message }, { status: 500 });
  }
}
