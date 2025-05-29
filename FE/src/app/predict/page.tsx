"use client";
import { useState } from "react";

export default function Home() {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [generation, setGeneration] = useState<string>("");
  const [regeneration, setRegeneration] = useState<string>("");
  const [history, setHistory] = useState<string[][]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [highlightedIdx, setHighlightedIdx] = useState<number>(-1);

  // Handler for Enter key: call API for regeneration
  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIdx((prev) => (prev + 1) % suggestions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIdx(
          (prev) => (prev - 1 + suggestions.length) % suggestions.length
        );
        return;
      }
      if (e.key === "Tab") {
        e.preventDefault();
        if (highlightedIdx >= 0 && highlightedIdx < suggestions.length) {
          setInput(input + suggestions[highlightedIdx]);
          setSuggestions([]);
          setHighlightedIdx(-1);
        }
        return;
      }
      if (e.key === "Enter") {
        setSuggestions([]);
        setHighlightedIdx(-1);
        if (input.trim()) {
          setError("");
          setGeneration("");
          setRegeneration("");
          try {
            const res = await fetch("http://localhost:3000/api/predict", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text: input }),
            });
            if (!res.ok) throw new Error("API error");
            const data = await res.json();
            if (
              Array.isArray(data.predictions) &&
              data.predictions.length > 0
            ) {
              setGeneration(data.predictions[0]);
              setRegeneration(data.predictions[1] || "Không có gợi ý.");
            } else if (
              typeof data.prediction === "string" &&
              data.prediction.trim() !== ""
            ) {
              setGeneration(data.prediction);
              setRegeneration("");
            } else {
              setGeneration("Không có gợi ý.");
              setRegeneration("");
            }
          } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
          }
        }
      }
    } else if (e.key === "Enter" && input.trim()) {
      setError("");
      setGeneration("");
      setRegeneration("");
      try {
        const res = await fetch("http://localhost:3000/api/predict", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: input }),
        });
        if (!res.ok) throw new Error("API error");
        const data = await res.json();
        if (Array.isArray(data.predictions) && data.predictions.length > 0) {
          setGeneration(data.predictions[0]);
          setRegeneration(data.predictions[1] || "Không có gợi ý.");
        } else if (
          typeof data.prediction === "string" &&
          data.prediction.trim() !== ""
        ) {
          setGeneration(data.prediction);
          setRegeneration("");
        } else {
          setGeneration("Không có gợi ý.");
          setRegeneration("");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    }
  };

  const fetchHistory = async () => {
    setError("");
    try {
      const res = await fetch("http://localhost:3000/api/history");
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`API error (${res.status}): ${text}`);
      }
      const data = await res.json();
      // data.history is an array of objects with .prediction (array of string)
      if (Array.isArray(data.history)) {
        setHistory(
          data.history.map((item: any) =>
            Array.isArray(item.prediction) ? item.prediction : []
          )
        );
      } else {
        setHistory([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  // Gọi API predict_next_word 3 lần khi gõ dấu cách
  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);
    setSuggestions([]);
    setHighlightedIdx(-1);
    // Kiểm tra ký tự cuối là dấu cách
    if (value.endsWith(" ")) {
      try {
        const results: string[] = [];
        for (let i = 0; i < 3; i++) {
          const res = await fetch(
            "http://localhost:3000/api/predict_next_word",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text: value }),
            }
          );
          const data = await res.json();
          if (
            typeof data.prediction === "string" &&
            data.prediction.trim() !== ""
          ) {
            results.push(data.prediction);
          } else if (
            Array.isArray(data.predictions) &&
            data.predictions.length > 0
          ) {
            results.push(data.predictions[0]);
          }
        }
        setSuggestions(results);
      } catch {}
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-white dark:bg-black">
      <main className="w-full max-w-xl flex flex-col items-center gap-8">
        <h1 className="text-3xl font-bold mb-2 text-center">
          Next Word Predictor
        </h1>
        {/* Hiển thị suggestions */}
        {suggestions.length > 0 && (
          <div className="w-full flex flex-col gap-1 mb-2">
            {suggestions.map((s, idx) => (
              <div
                key={idx}
                className={`p-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-black dark:text-white text-sm cursor-pointer ${
                  highlightedIdx === idx ? "bg-blue-100 dark:bg-blue-900" : ""
                }`}
                onMouseDown={() => {
                  setInput(input + s);
                  setSuggestions([]);
                  setHighlightedIdx(-1);
                }}
              >
                {s}
              </div>
            ))}
          </div>
        )}
        <form
          className="flex flex-col gap-2 w-full relative"
          onSubmit={(e) => e.preventDefault()}
        >
          <label htmlFor="predict-input" className="font-semibold">
            Enter text to predict next word:
          </label>
          <div className="flex gap-4 items-start w-full">
            <input
              id="predict-input"
              className="border rounded px-3 py-2 text-black dark:text-white bg-white dark:bg-black border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
              type="text"
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type your sentence..."
              autoComplete="off"
              required
            />
          </div>
        </form>
        {generation && (
          <div className="w-full mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 text-black dark:text-white">
            <h3 className="font-semibold mb-2 text-base">Generation 1</h3>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm break-words">{generation}</span>
              <button
                type="button"
                className="ml-2 px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 hover:dark:bg-gray-600 text-xs border border-gray-300 dark:border-gray-600 cursor-pointer"
                onClick={() => navigator.clipboard.writeText(generation)}
                title="Copy"
              >
                Copy
              </button>
            </div>
          </div>
        )}
        {regeneration && (
          <div className="w-full mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 text-black dark:text-white">
            <h3 className="font-semibold mb-2 text-base">Generation 2</h3>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm break-words">{regeneration}</span>
              <button
                type="button"
                className="ml-2 px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 hover:dark:bg-gray-600 text-xs border border-gray-300 dark:border-gray-600 cursor-pointer"
                onClick={() => navigator.clipboard.writeText(regeneration)}
                title="Copy"
              >
                Copy
              </button>
            </div>
          </div>
        )}
        {/* Button to show history */}
        <button
          type="button"
          className="mt-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 hover:dark:bg-gray-600 text-sm border border-gray-300 dark:border-gray-600"
          onClick={async () => {
            setShowHistory((prev) => !prev);
            if (!showHistory) await fetchHistory();
          }}
        >
          {showHistory ? "Ẩn lịch sử" : "Xem lịch sử"}
        </button>

        {/* Show history list */}
        {showHistory && history.length > 0 && (
          <div className="w-full mt-4 flex flex-col gap-2">
            {history.map((preds, idx) => (
              <div
                key={idx}
                className="p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 text-xs text-black dark:text-white"
              >
                {preds.map((pred, i) => (
                  <div key={i} className="mb-1 last:mb-0 break-words">
                    {pred}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
        {error && (
          <div className="mt-2 text-red-600 dark:text-red-400 font-semibold">
            Error: {error}
          </div>
        )}
      </main>
    </div>
  );
}
