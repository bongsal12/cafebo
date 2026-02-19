"use client";

export function Toast({
  message,
  type = "info",
  onClose,
}: {
  message: string;
  type?: "info" | "success" | "error";
  onClose: () => void;
}) {
  const color =
    type === "success"
      ? "bg-green-50 text-green-800 border-green-200"
      : type === "error"
      ? "bg-red-50 text-red-800 border-red-200"
      : "bg-gray-50 text-gray-800 border-gray-200";

  return (
    <div className={`mb-4 rounded-xl border px-4 py-3 text-sm ${color}`}>
      <div className="flex items-start justify-between gap-4">
        <div>{message}</div>
        <button className="font-bold" onClick={onClose}>
          ✕
        </button>
      </div>
    </div>
  );
}
