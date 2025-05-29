"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const apiBase =
    process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000/api/user";
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`${apiBase}/${isLogin ? "login" : "register"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Lỗi hệ thống");
      setSuccess(isLogin ? "Đăng nhập thành công!" : "Đăng ký thành công!");
      if (isLogin) {
        router.push("/predict");
      }
    } catch (err: any) {
      setError(err.message || "Lỗi hệ thống");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-white dark:bg-black">
      <div className="w-full max-w-sm bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-2xl font-bold mb-4 text-center">
          {isLogin ? "Đăng nhập" : "Đăng ký"}
        </h2>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <input
            type="text"
            className="border rounded px-3 py-2 text-black dark:text-white bg-white dark:bg-black border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Tên đăng nhập"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            className="border rounded px-3 py-2 text-black dark:text-white bg-white dark:bg-black border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            className="w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600 font-semibold"
          >
            {isLogin ? "Đăng nhập" : "Đăng ký"}
          </button>
        </form>
        <div className="flex justify-between mt-4 text-sm">
          <button
            className="text-blue-500 hover:underline"
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
              setSuccess("");
            }}
          >
            {isLogin
              ? "Chưa có tài khoản? Đăng ký"
              : "Đã có tài khoản? Đăng nhập"}
          </button>
        </div>
        {error && (
          <div className="mt-3 text-red-600 dark:text-red-400 font-semibold text-center">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-3 text-green-600 dark:text-green-400 font-semibold text-center">
            {success}
          </div>
        )}
      </div>
    </div>
  );
}
