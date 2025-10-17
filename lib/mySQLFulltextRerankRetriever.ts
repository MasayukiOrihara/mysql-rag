import mysql, { RowDataPacket, FieldPacket } from "mysql2/promise";
import { BaseRetriever } from "@langchain/core/retrievers";
import { Document } from "@langchain/core/documents";
import { OpenAIEmbeddings } from "@langchain/openai";

// --- 型 ---
interface DbRow extends RowDataPacket {
  id: number;
  title: string | null;
  content: string | null;
  embedding: Buffer; // MySQL VECTOR は Buffer で返る
}

// --- ユーティリティ ---
function bufToF32(buf: Buffer): Float32Array {
  return new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
}
function cosine(a: Float32Array, b: Float32Array) {
  let dot = 0,
    na = 0,
    nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}

// --- Retriever 本体 ---
export class MySQLFulltextRerankRetriever extends BaseRetriever {
  // LangChainの抽象メンバー（必須）
  get lc_namespace(): string[] {
    return ["custom", "retrievers", "mysql_fulltext_rerank"];
  }

  private conn: mysql.Connection;
  private embeddings: OpenAIEmbeddings;
  private kFulltext: number;
  private kFinal: number;
  private minContentLen: number;

  constructor(args: {
    conn: mysql.Connection;
    embeddings: OpenAIEmbeddings;
    kFulltext?: number;
    kFinal?: number;
    minContentLen?: number;
  }) {
    super();
    this.conn = args.conn;
    this.embeddings = args.embeddings;
    this.kFulltext = args.kFulltext ?? 500;
    this.kFinal = args.kFinal ?? 8;
    this.minContentLen = args.minContentLen ?? 20;
  }

  // ★ 修正点1: public にする（シグネチャも BaseRetriever に合わせる）
  public async _getRelevantDocuments(query: string): Promise<Document[]> {
    // 1) MySQLから候補を取得（小規模なら WHERE 省いて全件でも可）
    const [rows]: [DbRow[], FieldPacket[]] = await this.conn.execute<DbRow[]>(
      `
      SELECT id, title, content, embedding
      FROM docs
      WHERE MATCH(title, content)
        AGAINST (? IN NATURAL LANGUAGE MODE)
      LIMIT ?
      `,
      [query, this.kFulltext]
    );

    if (!rows || rows.length === 0) return [];

    // 2) クエリ埋め込み
    const qVec = new Float32Array(await this.embeddings.embedQuery(query));

    // 3) コサインで再ランク
    const ranked = rows
      .filter((r) => (r.content ?? "").length >= this.minContentLen)
      .map((r) => {
        const f32 = bufToF32(r.embedding);
        return { row: r, score: cosine(qVec, f32) };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, this.kFinal);

    // 4) LangChainのDocumentに変換
    return ranked.map(({ row, score }) => {
      return new Document({
        pageContent: row.content ?? "",
        metadata: {
          id: row.id,
          title: row.title,
          score,
          source: "mysql:docs",
        },
      });
    });
  }
}
