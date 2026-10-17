import React, { useState } from "react";
import { X, Printer, Copy, Check, FileText } from "lucide-react";
import { calculateTrackScore, getTrackMaxScore, isTrackFinished, calculateAlbumProgress } from "../constants";

export function StudioSheetModal({
  isOpen,
  onClose,
  album,
  t
}) {
  if (!isOpen || !album) return null;

  const [copied, setCopied] = useState(false);
  const tracks = album.tracks || [];
  const progressPercent = calculateAlbumProgress(tracks);

  const generateMarkdown = () => {
    let md = `# ${album.title} — trackER Production Sheet (B&W Compact)\\n`;
    md += `Artist: ${album.artist || "N/A"} | Target: ${album.targetDate || "2026"} | Genre: ${album.genre || "N/A"}\\n`;
    md += `Overall Progress: ${progressPercent}% | Total Tracks: ${tracks.length}\\n\\n`;
    md += `| # | Title | Type | BPM | Key | Beat | Vocals | Visual | Score | Status |\\n`;
    md += `|---|-------|------|-----|-----|------|--------|--------|-------|--------|\\n`;

    tracks.forEach((tr, idx) => {
      const isSkit = tr.type === "skit";
      const isInst = tr.type === "instrumental";
      const score = calculateTrackScore(tr);
      const max = getTrackMaxScore(tr);
      const s = tr.steps || {};

      const beatStr = isSkit
        ? `${s.step_beat_demo ? "✓" : "-"}${s.step_beat_arr ? "✓" : "-"}`
        : `${s.step_beat_demo ? "✓" : "-"}${s.step_beat_arr ? "✓" : "-"}${s.step_beat_mix || s.step_beat_master ? "✓" : "-"}`;

      const vocStr = isInst
        ? "N/A"
        : isSkit
        ? `${s.step_voc_lyrics ? "✓" : "-"}${s.step_voc_rec ? "✓" : "-"}${s.step_voc_mix ? "✓" : "-"}`
        : `${s.step_voc_lyrics ? "✓" : "-"}${s.step_voc_demo ? "✓" : "-"}${s.step_voc_rec ? "✓" : "-"}${s.step_voc_mix ? "✓" : "-"}`;

      const visStr = isSkit
        ? "N/A"
        : `${s.step_vis_concept ? "✓" : "-"}${s.step_vis_final ? "✓" : "-"}`;

      const status = score >= max ? "READY" : "WIP";

      md += `| ${idx + 1} | ${tr.title} | ${tr.type || "song"} | ${tr.bpm || "-"} | ${tr.key || "-"} | ${beatStr} | ${vocStr} | ${visStr} | ${score}/${max} | ${status} |\\n`;
    });

    if (album.concept) {
      md += `\\n### Album Concept\\n${album.concept}\\n`;
    }

    return md;
  };

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(generateMarkdown());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-card" 
        style={{ maxWidth: 1060, width: "96vw", padding: "14px 18px" }} 
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header toolbar */}
        <div className="no-print" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <FileText size={17} color="var(--accent)" />
            <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)" }}>
              {t.studioSheetTitle} (Ч/Б Друк • Компактний 1 Лист)
            </h2>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={handleCopyMarkdown} className="btn btn-secondary btn-sm" style={{ padding: "4px 10px", fontSize: "0.78rem" }}>
              {copied ? <Check size={12} color="var(--color-success)" /> : <Copy size={12} />}
              <span>{copied ? t.summaryCopied : t.copySummary}</span>
            </button>
            <button onClick={handlePrint} className="btn btn-primary btn-sm" style={{ padding: "4px 12px", fontSize: "0.78rem" }}>
              <Printer size={12} />
              <span>Друк / PDF (1 Лист)</span>
            </button>
            <button onClick={onClose} className="btn-ghost btn-icon" style={{ width: 28, height: 28 }}>
              <X size={15} />
            </button>
          </div>
        </div>

        {/* 1-Page Printable B&W Ultra-Compact Studio Sheet */}
        <div 
          id="printable-studio-sheet"
          className="bw-studio-sheet"
          style={{
            background: "#ffffff",
            color: "#000000",
            border: "1.5px solid #000000",
            borderRadius: "4px",
            padding: "10px 14px",
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
            maxHeight: "80vh",
            overflowY: "auto"
          }}
        >
          {/* Compact Sheet Header */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1.5px solid #000000",
            paddingBottom: "6px",
            marginBottom: "8px"
          }}>
            <div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <h1 style={{ fontSize: "1.25rem", fontWeight: 900, margin: 0, letterSpacing: "-0.02em", color: "#000000" }}>
                  {album.title}
                </h1>
                <span style={{ fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "#444" }}>
                  trackER STUDIO SHEET
                </span>
              </div>
              <div style={{ fontSize: "0.74rem", fontWeight: 600, color: "#222222", marginTop: 2 }}>
                Виконавець: <strong>{album.artist || "N/A"}</strong> | Жанр: {album.genre || "N/A"} | Реліз: {album.targetDate || "2026"}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase" }}>
                  {tracks.filter(t => isTrackFinished(t)).length}/{tracks.length} ГОТОВО
                </div>
                <div style={{ fontSize: "0.65rem", color: "#666" }}>
                  {new Date().toLocaleDateString()}
                </div>
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: 900, lineHeight: 1, color: "#000000", borderLeft: "1.5px solid #000", paddingLeft: 10 }}>
                {progressPercent}%
              </div>
            </div>
          </div>

          {/* Ultra-Compact High-Density Table */}
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "0.72rem",
            marginBottom: "8px",
            color: "#000000",
            lineHeight: 1.2
          }}>
            <thead>
              <tr style={{ background: "#eaeaea", borderBottom: "1.5px solid #000000" }}>
                <th style={{ padding: "4px 5px", textAlign: "center", width: 24, border: "1px solid #000" }}>#</th>
                <th style={{ padding: "4px 6px", textAlign: "left", border: "1px solid #000" }}>Назва композиції</th>
                <th style={{ padding: "4px 5px", textAlign: "center", width: 80, border: "1px solid #000" }}>Тип</th>
                <th style={{ padding: "4px 5px", textAlign: "center", width: 45, border: "1px solid #000" }}>BPM</th>
                <th style={{ padding: "4px 5px", textAlign: "center", width: 55, border: "1px solid #000" }}>Тон</th>
                <th style={{ padding: "4px 5px", textAlign: "center", width: 75, border: "1px solid #000" }}>Біт</th>
                <th style={{ padding: "4px 5px", textAlign: "center", width: 85, border: "1px solid #000" }}>Вокал</th>
                <th style={{ padding: "4px 5px", textAlign: "center", width: 65, border: "1px solid #000" }}>Візуал</th>
                <th style={{ padding: "4px 5px", textAlign: "center", width: 50, border: "1px solid #000" }}>Бал</th>
                <th style={{ padding: "4px 5px", textAlign: "center", width: 75, border: "1px solid #000" }}>Статус</th>
              </tr>
            </thead>
            <tbody>
              {tracks.map((tr, idx) => {
                const isSkit = tr.type === "skit";
                const isInst = tr.type === "instrumental";
                const score = calculateTrackScore(tr);
                const max = getTrackMaxScore(tr);
                const isFin = score >= max;
                const s = tr.steps || {};

                return (
                  <tr key={tr.id} style={{ borderBottom: "1px solid #444", background: idx % 2 === 0 ? "#ffffff" : "#f8f8f8" }}>
                    <td style={{ padding: "3px 4px", fontWeight: 800, border: "1px solid #000", textAlign: "center", fontSize: "0.68rem" }}>
                      {String(idx + 1).padStart(2, "0")}
                    </td>
                    <td style={{ padding: "3px 6px", fontWeight: 700, border: "1px solid #000" }}>
                      <span>{tr.title}</span>
                      {tr.notes && (
                        <span style={{ fontSize: "0.64rem", fontWeight: 400, color: "#555", marginLeft: 6 }}>
                          • {tr.notes.slice(0, 60)}{tr.notes.length > 60 ? "…" : ""}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "3px 4px", textAlign: "center", border: "1px solid #000", fontWeight: 600, fontSize: "0.68rem" }}>
                      {isInst ? "Інструм." : isSkit ? "Скіт" : "Пісня"}
                    </td>
                    <td style={{ padding: "3px 4px", textAlign: "center", border: "1px solid #000", fontFamily: "monospace", fontSize: "0.68rem" }}>
                      {tr.bpm || "—"}
                    </td>
                    <td style={{ padding: "3px 4px", textAlign: "center", border: "1px solid #000", fontSize: "0.68rem" }}>
                      {tr.key || "—"}
                    </td>
                    {/* Beat steps */}
                    <td style={{ padding: "3px 4px", textAlign: "center", border: "1px solid #000", fontFamily: "monospace", fontSize: "0.68rem" }}>
                      {isSkit 
                        ? `${s.step_beat_demo ? "✓" : "·"}${s.step_beat_arr ? "✓" : "·"}`
                        : `${s.step_beat_demo ? "✓" : "·"}${s.step_beat_arr ? "✓" : "·"}${s.step_beat_mix || s.step_beat_master ? "✓" : "·"}`}
                    </td>
                    {/* Vocal steps */}
                    <td style={{ padding: "3px 4px", textAlign: "center", border: "1px solid #000", fontFamily: "monospace", fontSize: "0.68rem" }}>
                      {isInst ? "—" : isSkit 
                        ? `${s.step_voc_lyrics ? "✓" : "·"}${s.step_voc_rec ? "✓" : "·"}${s.step_voc_mix ? "✓" : "·"}`
                        : `${s.step_voc_lyrics ? "✓" : "·"}${s.step_voc_demo ? "✓" : "·"}${s.step_voc_rec ? "✓" : "·"}${s.step_voc_mix ? "✓" : "·"}`}
                    </td>
                    {/* Visual steps */}
                    <td style={{ padding: "3px 4px", textAlign: "center", border: "1px solid #000", fontFamily: "monospace", fontSize: "0.68rem" }}>
                      {isSkit ? "—" : `${s.step_vis_concept ? "✓" : "·"}${s.step_vis_final ? "✓" : "·"}`}
                    </td>
                    {/* Score */}
                    <td style={{ padding: "3px 4px", textAlign: "center", fontWeight: 800, border: "1px solid #000", fontSize: "0.72rem" }}>
                      {score}/{max}
                    </td>
                    {/* Status */}
                    <td style={{ padding: "3px 4px", textAlign: "center", fontWeight: 800, border: "1px solid #000", fontSize: "0.66rem", background: isFin ? "#e6ffe6" : "transparent" }}>
                      {isFin ? "✓ ГОТОВО" : "В РОБОТІ"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Compact Bottom Sign-off & Concept */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1.5px solid #000000",
            paddingTop: "6px",
            fontSize: "0.68rem",
            color: "#111111",
            gap: 16
          }}>
            <div style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              <strong>Концепція:</strong> {album.concept ? album.concept.replace(/[#*\r\n\-]+/g, ' ').slice(0, 160) : "Студійний продакшн"}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
              <div>Підпис звукорежисера: __________________</div>
              <div style={{ fontSize: "0.64rem", color: "#666" }}>trackER • 1-Page B&W</div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
