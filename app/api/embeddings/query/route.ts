import { embeddings } from "@/lib/embedding";
import { UNKNOWN_ERROR } from "@/lib/error";
import { conn } from "@/lib/mysql";
import { bufToF32, f32 } from "@/lib/utils";
import { RowDataPacket } from "mysql2";

interface Row extends RowDataPacket {
  id: number;
  content: string | null;
  embedding: Buffer; // VECTOR は Buffer で返る
}

// 類似度比較
function cosine(a: Float32Array, b: Float32Array) {
  let dot = 0,
    na = 0,
    nb = 0;
  for (let i = 0; i < a.length; i++) {
    const ai = a[i],
      bi = b[i];
    dot += ai * bi;
    na += ai * ai;
    nb += bi * bi;
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const query = body.query;

    console.log("📃 query: " + query);

    const k = 2;
    const kCandidates = 500;

    // 1) クエリ埋め込み
    const q = new Float32Array(await embeddings.embedQuery(query));

    // 2) 候補取得（FULLTEXTがあるなら使う／無ければ LIMIT 全件など）
    const sql = `SELECT id, content, embedding FROM docs LIMIT ${kCandidates}`;
    const [rows] = await conn.execute<Row[]>(sql);
    console.log(rows);

    // 3) アプリ側でコサイン類似度→降順ソート→上位k
    const ranked = rows
      .filter((r) => r.content) // nullは除外
      .map((r) => ({
        id: r.id,
        content: r.content!,
        score: cosine(q, bufToF32(r.embedding)),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, k);

    console.log("コサイン類似度");
    console.log(ranked);

    return new Response(null, { status: 204 });
  } catch (error) {
    const message = error instanceof Error ? error.message : UNKNOWN_ERROR;

    console.error(message);
    return Response.json({ error: message }, { status: 500 });
  }
}
