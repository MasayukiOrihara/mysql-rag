import { embeddings } from "@/lib/embedding";
import { UNKNOWN_ERROR } from "@/lib/error";
import { conn, pool } from "@/lib/mysql";
import { RowDataPacket } from "mysql2";

interface Row extends RowDataPacket {
  id: number;
  doc_id: string;
  dim: number;
  vec_f32: Buffer; // LONGBLOB
  meta: any | null; // JSON
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

function cosine2(a: Float32Array, b: Float32Array) {
  // 長さが異なる場合は短い方に合わせる（安全策）
  const n = Math.min(a.length, b.length);
  let dot = 0,
    na = 0,
    nb = 0;
  for (let i = 0; i < n; i++) {
    const ai = a[i],
      bi = b[i];
    dot += ai * bi;
    na += ai * ai;
    nb += bi * bi;
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom ? dot / denom : 0;
}

// Buffer(LONGBLOB) -> Float32Array
function bufToF32(buf: Buffer, dim?: number): Float32Array {
  // Node Buffer → ArrayBuffer の safe コピー
  const arrBuf = buf.buffer.slice(
    buf.byteOffset,
    buf.byteOffset + buf.byteLength
  );
  const f32 = new Float32Array(arrBuf);
  return dim ? f32.subarray(0, dim) : f32;
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
    const sql = `
      SELECT id, doc_id, dim, vec_f32
      FROM embeddings
      ORDER BY id DESC
      LIMIT ${kCandidates}
    `;
    const [rows] = await pool.execute<Row[]>(sql);
    console.log(rows);

    // 3) アプリ側でコサイン類似度→降順ソート→上位k
    const ranked = rows
      .map((r) => {
        const v = bufToF32(r.vec_f32, r.dim);
        const score = cosine2(q, v);
        return {
          id: r.id,
          docId: r.doc_id,
          dim: r.dim,
          score,
        };
      })
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
