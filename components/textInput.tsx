"use client";

import { FormEvent, useState } from "react";

export default function TextInput() {
  const [text, setText] = useState("");

  const submitHandle = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const tempText = text.trim();

    fetch("/api/embeddings/upsert", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: tempText,
      }),
    }).catch((err) => {
      console.error("エラー:", err);
    });

    setText("");
  };

  return (
    <div>
      <h1>入力</h1>
      <form onSubmit={(e) => submitHandle(e)}>
        {/* テキストエリア */}
        <input
          className="p-1 border"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        {/* ボタン */}
        <button
          type="submit"
          className="ml-1 py-1 px-2 bg-blue-400 text-white rounded hover:bg-blue-700 hover:cursor-pointer hover:text-white/40"
        >
          送信
        </button>
      </form>
    </div>
  );
}
