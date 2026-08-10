"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { AnimatePresence, motion } from "framer-motion";
import { apiFetch } from "@/lib/api";
import { GRADES } from "@/lib/constants";
import { Grade } from "@/types";
import { Upload, Loader2, Check, X, Copy, FileText, Image as ImageIcon } from "lucide-react";

interface ReviewRow {
  name: string;
  grade: Grade | "";
  gender?: "male" | "female" | "other";
  age?: number;
  include: boolean;
}

interface CreatedAccount {
  name: string;
  email: string;
  temporaryPassword: string;
}

type Stage = "choose" | "processing" | "review" | "confirming" | "done" | "error";

export default function UploadStudents() {
  const [stage, setStage] = useState<Stage>("choose");
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [created, setCreated] = useState<CreatedAccount[]>([]);
  const [failed, setFailed] = useState<{ name: string; error: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    setStage("processing");
    setError(null);

    const name = file.name.toLowerCase();
    const isCsv = file.type === "text/csv" || name.endsWith(".csv");
    const isExcel =
      name.endsWith(".xlsx") || name.endsWith(".xls") ||
      file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.type === "application/vnd.ms-excel";
    const endpoint = isCsv ? "/api/upload/csv" : isExcel ? "/api/upload/excel" : "/api/upload/register-photo";
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await apiFetch(endpoint, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to process file");

      setRows(
        (data.detected || []).map((d: any) => ({
          name: d.name || "",
          grade: (GRADES.find((g) => g.value === d.grade)?.value || "") as Grade | "",
          gender: d.gender || undefined,
          age: d.age || undefined,
          include: true,
        }))
      );
      setWarnings(data.warnings || []);
      setStage("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStage("error");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      "image/jpeg": [], "image/png": [], "image/webp": [],
      "application/pdf": [], "text/csv": [".csv"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
    },
  });

  const updateRow = (i: number, patch: Partial<ReviewRow>) => {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  };

  const included = rows.filter((r) => r.include);
  const canConfirm = included.length > 0 && included.every((r) => r.name && r.grade);

  const confirm = async () => {
    setStage("confirming");
    setError(null);
    try {
      const res = await apiFetch("/api/upload/confirm", {
        method: "POST",
        body: JSON.stringify({
          students: included.map((r) => ({
            name: r.name, grade: r.grade, gender: r.gender, age: r.age,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");
      setCreated(data.created || []);
      setFailed(data.failed || []);
      setStage("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStage("error");
    }
  };

  const reset = () => {
    setRows([]);
    setWarnings([]);
    setCreated([]);
    setFailed([]);
    setError(null);
    setStage("choose");
  };

  const copyAll = () => {
    const text = created.map((c) => `${c.name}: ${c.email} / ${c.temporaryPassword}`).join("\n");
    navigator.clipboard.writeText(text);
  };

  let content: React.ReactNode = null;

  if (stage === "choose") {
    content = (
      <div
        {...getRootProps()}
        className={`card p-12 border-2 border-dashed text-center cursor-pointer transition-all
          ${isDragActive ? "border-teal-400 bg-teal-50 scale-[1.005]" : "border-stone-300 hover:border-teal-300"}`}
      >
        <input {...getInputProps()} />
        <div className="flex justify-center gap-3 mb-4">
          <ImageIcon className="w-8 h-8 text-stone-400" />
          <FileText className="w-8 h-8 text-stone-400" />
        </div>
        <p className="font-medium text-stone-700">Drag & drop your file here, or click to browse</p>
        <p className="text-stone-400 text-sm mt-1">Supports: Excel (.xlsx/.xls), CSV, or a photo/PDF of your register</p>
      </div>
    );
  } else if (stage === "processing") {
    content = (
      <div className="card p-12 flex flex-col items-center justify-center text-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500 mb-4" />
        <p className="text-stone-600 font-medium">Reading your register...</p>
      </div>
    );
  } else if (stage === "error") {
    content = (
      <div className="card p-6">
        <p className="text-red-600 mb-4">{error}</p>
        <button className="btn-teal" onClick={reset}>Try Again</button>
      </div>
    );
  } else if (stage === "review") {
    content = (
      <div>
        {warnings.length > 0 && (
          <div className="card p-4 mb-4 bg-amber-50 border-amber-200 text-sm text-amber-700">
            {warnings.join(" ")}
          </div>
        )}
        <div className="card divide-y divide-stone-100 mb-4">
          {rows.map((row, i) => (
            <div key={i} className="flex items-center gap-3 p-4">
              <input
                type="checkbox"
                checked={row.include}
                onChange={(e) => updateRow(i, { include: e.target.checked })}
                className="w-4 h-4 shrink-0"
              />
              <input
                className="input flex-1"
                value={row.name}
                onChange={(e) => updateRow(i, { name: e.target.value })}
                placeholder="Student name"
              />
              <select
                className="input w-36 shrink-0"
                value={row.grade}
                onChange={(e) => updateRow(i, { grade: e.target.value as Grade })}
              >
                <option value="" disabled>Grade</option>
                {GRADES.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <button className="btn-teal flex-1" disabled={!canConfirm} onClick={confirm}>
            Confirm & Import ({included.length})
          </button>
          <button className="btn-outline" onClick={reset}>Cancel</button>
        </div>
      </div>
    );
  } else if (stage === "confirming") {
    content = (
      <div className="card p-12 flex flex-col items-center justify-center text-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500 mb-4" />
        <p className="text-stone-600 font-medium">Creating student accounts...</p>
      </div>
    );
  } else {
    content = (
      <div>
        {created.length > 0 && (
          <div className="card p-5 mb-4 bg-teal-50 border-teal-200">
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold text-stone-900">
                {created.length} student account{created.length !== 1 ? "s" : ""} created
              </p>
              <button onClick={copyAll} className="btn-ghost flex items-center gap-1.5 text-sm">
                <Copy className="w-3.5 h-3.5" /> Copy All
              </button>
            </div>
            <p className="text-sm text-stone-600 mb-3">
              These passwords are shown only once — save them now.
            </p>
            <div className="space-y-1.5">
              {created.map((c, i) => (
                <p key={i} className="text-sm font-mono bg-white rounded-lg px-3 py-2 border border-teal-200 flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  {c.name}: {c.email} / {c.temporaryPassword}
                </p>
              ))}
            </div>
          </div>
        )}
        {failed.length > 0 && (
          <div className="card p-5 mb-4 bg-red-50 border-red-200">
            <p className="font-semibold text-stone-900 mb-2">{failed.length} failed</p>
            {failed.map((f, i) => (
              <p key={i} className="text-sm text-red-600 flex items-center gap-2">
                <X className="w-3.5 h-3.5 shrink-0" /> {f.name}: {f.error}
              </p>
            ))}
          </div>
        )}
        <button className="btn-teal w-full flex items-center justify-center gap-2" onClick={reset}>
          <Upload className="w-4 h-4" /> Import More Students
        </button>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={stage}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
      >
        {content}
      </motion.div>
    </AnimatePresence>
  );
}
