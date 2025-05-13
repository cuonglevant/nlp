"use client";
import { useState, useEffect } from "react";

interface Prediction {
  confidence: number;
  next_word: string;
  text?: string;
  timestamp?: number;
}

export default function Home() {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [highlightedIdx, setHighlightedIdx] = useState(-1);
  const [historyIdx, setHistoryIdx] = useState(-1);

  useEffect(() => {
    if (!input.trim()) {
      setPredictions([]);
      setShowSuggestions(false);
      return;
    }
    const timeout = setTimeout(async () => {
      setError("");
      setPredictions([]);
      try {
        const res = await fetch("http://localhost:3000/api/predict", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: input }),
        });
        if (!res.ok) throw new Error("API error");
        const data = await res.json();
        if (Array.isArray(data.predictions) && data.predictions.length > 0) {
          setPredictions(data.predictions);
          setShowSuggestions(true);
        } else {
          setPredictions([]);
          setShowSuggestions(false);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setShowSuggestions(false);
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [input]);

  useEffect(() => {
    if (!showSuggestions && predictions.length > 0) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setHistoryIdx((prev) => (prev + 1) % predictions.length);
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setHistoryIdx(
            (prev) => (prev - 1 + predictions.length) % predictions.length
          );
        } else if (e.key === "Enter" && historyIdx >= 0) {
          e.preventDefault();
          handleSuggestionClick(predictions[historyIdx].next_word);
          setHistoryIdx(-1);
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [showSuggestions, predictions, historyIdx]);

  function handleSuggestionClick(word: string) {
    let updatedInput = input.replace(/\s+$/, "");
    updatedInput += (updatedInput.length > 0 ? " " : "") + word + " ";
    setInput(updatedInput);
    setShowSuggestions(false);
    setPredictions([]);
  }

  async function handleHistory() {
    try {
      const res = await fetch("http://localhost:3000/api/history");
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      if (Array.isArray(data.history)) {
        const uniqueInputs = Array.from(
          new Set(
            data.history
              .map((h: { inputText: string[] }) =>
                h.inputText && h.inputText.length > 0 ? h.inputText[0] : ""
              )
              .filter((txt: string) => txt && txt.trim() !== "")
          )
        );
        setPredictions(
          uniqueInputs.map((txt, idx) => ({
            next_word: "",
            confidence: 0,
            text: String(txt),
            timestamp: idx,
          }))
        );
        setShowSuggestions(false);
      }
    } catch {}
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-white dark:bg-black">
      <main className="w-full max-w-xl flex flex-col items-center gap-8">
        <h1 className="text-3xl font-bold mb-2 text-center">
          Next Word Predictor
        </h1>
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
              onChange={(e) => {
                setInput(e.target.value);
                setShowSuggestions(false);
                setHighlightedIdx(-1);
              }}
              placeholder="Type your sentence..."
              autoComplete="off"
              required
              onKeyDown={(e) => {
                if (showSuggestions && predictions.length > 0) {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setHighlightedIdx(
                      (prev) => (prev + 1) % predictions.length
                    );
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setHighlightedIdx(
                      (prev) =>
                        (prev - 1 + predictions.length) % predictions.length
                    );
                  } else if (e.key === "Enter" && highlightedIdx >= 0) {
                    e.preventDefault();
                    handleSuggestionClick(
                      predictions[highlightedIdx].next_word
                    );
                  }
                }
              }}
            />
            <button
              type="button"
              className="bg-gray-700 text-white rounded px-4 py-2 font-medium hover:bg-gray-900 disabled:opacity-50"
              onClick={handleHistory}
            >
              Xem lịch sử
            </button>
          </div>
          {!showSuggestions &&
            predictions.length > 0 &&
            (input.trim() === "" || predictions[0].text) && (
              <div className="w-full mt-4">
                <h2 className="text-lg font-semibold mb-2">
                  Lịch sử input đã dự đoán
                </h2>
                <ul className="bg-[#3b2c28] text-white rounded shadow-lg max-h-60 overflow-y-auto border border-gray-300 dark:border-gray-700 divide-y divide-[#5a4037]">
                  {predictions.map((p, idx) => (
                    <li
                      key={p.timestamp ? `${p.timestamp}-${idx}` : idx}
                      className="px-4 py-2 text-sm font-medium cursor-pointer hover:bg-[#5a4037]"
                      onClick={() => {
                        setInput(p.text?.trim() || "");
                        setShowSuggestions(false);
                        setHighlightedIdx(-1);
                      }}
                    >
                      {p.text?.trim()}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          {showSuggestions && predictions.length > 0 && (
            <ul className="absolute top-full left-0 w-full bg-[#3b2c28] text-white rounded-b shadow-lg z-10 max-h-72 overflow-y-auto border border-t-0 border-gray-300 dark:border-gray-700">
              {predictions.map((p, idx) => (
                <li
                  key={p.next_word + idx}
                  className={`px-4 py-2 cursor-pointer hover:bg-[#5a4037] flex items-center ${
                    highlightedIdx === idx ? "bg-[#5a4037]" : ""
                  }`}
                  onClick={() => handleSuggestionClick(p.next_word)}
                  onMouseEnter={() => setHighlightedIdx(idx)}
                >
                  <span className="font-semibold text-base">
                    {input.trim()}
                    {input.trim() ? " " : ""}
                    <span className="text-yellow-300">{p.next_word}</span>
                  </span>
                  <span className="ml-auto text-xs text-gray-300">
                    {(p.confidence * 100).toFixed(1)}%
                  </span>
                </li>
              ))}
            </ul>
          )}
        </form>
        {error && (
          <div className="mt-2 text-red-600 dark:text-red-400 font-semibold">
            Error: {error}
          </div>
        )}
      </main>
    </div>
  );
}
