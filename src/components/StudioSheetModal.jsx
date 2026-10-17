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
    let md = `# ${album.title} — trackER Production Sheet (Ч/Б)\n`;
    md += `Artist: ${album.artist || "N/A"} | Year: ${album.releaseYear || "2026"} | Genre: ${album.genre || "N/A"}\n`;
    md += `Overall Progress: ${progressPercent}% | Tracks: ${tracks.length}\n\n`;
    md += `| # | Title | Type | BPM | Key | Beat | Vocals | Visual | Score | Status | Notes |\n`;
    md += `|---|-------|------|-----|-----|------|--------|--------|-------|--------|-------|\n`;

    tracks.forEach((tr, idx) => {
      const isInst = tr.type === 'instrumental' || tr.type === 'skit';
      const score = calculateTrackScore(tr);
      const max = getTrackMaxScore(tr);
      const s = tr.steps || {};

      const beatStr = `${s.step_beat_demo ? '✓' : '-'}${s.step_beat_arr ? '✓' : '-'}${s.step_beat_mix || s.step_beat_master ? '✓' : '-'}`;
      const vocStr = isInst ? 'N/A' : `${s.step_voc_lyrics ? '✓' : '-'}${s.step_voc_demo ? '✓' : '-'}${s.step_voc_rec ? '✓' : '-'}${s.step_voc_mix ? '✓' : '-'}`;
      const visStr = `${s.step_vis_concept ? '✓' : '-'}${s.step_vis_final ? '✓' : '-'}`;
      const status = score >= max ? 'READY' : 'WORK';

      md += `| ${idx + 1} | ${tr.title} | ${tr.type || 'song'} | ${tr.bpm || '-'} | ${tr.key || '-'} | ${beatStr} | ${vocStr} | ${visStr} | ${score}/${max} | ${status} | ${tr.notes || ''} |\n`;
    });

    if (album.concept) {
      md += `\n### Album Concept & Notes\n${album.concept}\n`;
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
        style={{ maxWidth: 1040, width: "95vw", padding: "16px 20px" }} 
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header toolbar */}
        <div className="no-print" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <FileText size={18} color="var(--accent)" />
            <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--text-primary)" }}>
              {t.studioSheetTitle} (Ч/Б Друк • 1 Лист)
            </h2>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={handleCopyMarkdown} className="btn btn-secondary btn-sm">
              {copied ? <Check size={13} color="var(--color-success)" /> : <Copy size={13} />}
              <span>{copied ? t.summaryCopied : t.copySummary}</span>
            </button>
            <button onClick={handlePrint} className="btn btn-primary btn-sm">
              <Printer size={13} />
              <span>Друк / Зберегти як PDF (Ч/Б)</span>
            </button>
            <button onClick={onClose} className="btn-ghost btn-icon">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* 1-Page Printable B&W Studio Sheet */}
        <div 
          id="printable-studio-sheet"
          className="bw-studio-sheet"
          style={{
            background: "#ffffff",
            color: "#000000",
            border: "2px solid #000000",
            borderRadius: "6px",
            padding: "16px 20px",
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
            maxHeight: "78vh",
            overflowY: "auto"
          }}
        >
          {/* Sheet Header */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            borderBottom: "2px solid #000000",
            paddingBottom: "10px",
            marginBottom: "12px"
          }}>
            <div>
              <div style={{ fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                trackER STUDIO • ВИРОБНИЧИЙ ЗВІТ ПРОДАКШНУ АЛЬБОМУ
              </div>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 900, margin: "2px 0 4px", letterSpacing: "-0.02em", color: "#000000" }}>
                {album.title}
              </h1>
              <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#222222" }}>
                Виконавець: <strong>{album.artist || "N/A"}</strong> | Жанр: {album.genre || "N/A"} | Реліз: {album.targetDate || album.releaseYear || "2026"}
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "1.8rem", fontWeight: 900, lineHeight: 1, color: "#000000" }}>
                {progressPercent}%
              </div>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", marginTop: 2 }}>
                {tracks.filter(t => isTrackFinished(t)).length} / {tracks.length} ГОТОВО
              </div>
              <div style={{ fontSize: "0.68rem", color: "#555555", marginTop: 2 }}>
                Дата: {new Date().toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* High-Density Tracklist Table */}
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "0.78rem",
            marginBottom: "12px",
            color: "#000000"
          }}>
            <thead>
              <tr style={{ background: "#f0f0f0", borderBottom: "1.5px solid #000000" }}>
                <th style={{ padding: "6px 8px", textAlign: "left", width: 28, border: "1px solid #000" }}>#</th>
                <th style={{ padding: "6px 8px", textAlign: "left", border: "1px solid #000" }}>Назва композиції</th>
                <th style={{ padding: "6px 8px", textAlign: "center", width: 95, border: "1px solid #000" }}>Тип</th>
                <th style={{ padding: "6px 8px", textAlign: "center", width: 60, border: "1px solid #000" }}>BPM</th>
                <th style={{ padding: "6px 8px", textAlign: "center", width: 60, border: "1px solid #000" }}>Тон</th>
                <th style={{ padding: "6px 8px", textAlign: "center", width: 90, border: "1px solid #000" }}>Біт (3)</th>
                <th style={{ padding: "6px 8px", textAlign: "center", width: 110, border: "1px solid #000" }}>Вокал (4/5)</th>
                <th style={{ padding: "6px 8px", textAlign: "center", width: 75, border: "1px solid #000" }}>Візуал (2)</th>
                <th style={{ padding: "6px 8px", textAlign: "center", width: 60, border: "1px solid #000" }}>Бал</th>
                <th style={{ padding: "6px 8px", textAlign: "center", width: 85, border: "1px solid #000" }}>Статус</th>
              </tr>
            </thead>
            <tbody>
              {tracks.map((tr, idx) => {
                const isInst = tr.type === 'instrumental' || tr.type === 'skit';
                const score = calculateTrackScore(tr);
                const max = getTrackMaxScore(tr);
                const isFin = score >= max;
                const s = tr.steps || {};

                return (
                  <tr key={tr.id} style={{ borderBottom: "1px solid #333333", background: idx % 2 === 0 ? "#ffffff" : "#fbfbfa" }}>
                    <td style={{ padding: "5px 6px", fontWeight: 700, border: "1px solid #000", textAlign: "center" }}>
                      {String(idx + 1).padStart(2, "0")}
                    </td>
                    <td style={{ padding: "5px 8px", fontWeight: 700, border: "1px solid #000" }}>
                      {tr.title}
                      {tr.notes && (
                        <div style={{ fontSize: "0.68rem", fontWeight: 400, color: "#444444", marginTop: 2 }}>
                          {tr.notes}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "5px 6px", textAlign: "center", border: "1px solid #000", fontWeight: 600 }}>
                      {tr.type === 'instrumental' ? 'Інструментал' : tr.type === 'skit' ? 'Скіт' : 'Пісня'}
                    </td>
                    <td style={{ padding: "5px 6px", textAlign: "center", border: "1px solid #000", fontFamily: "monospace" }}>
                      {tr.bpm || "—"}
                    </td>
                    <td style={{ padding: "5px 6px", textAlign: "center", border: "1px solid #000" }}>
                      {tr.key || "—"}
                    </td>
                    {/* Beat steps */}
                    <td style={{ padding: "5px 6px", textAlign: "center", border: "1px solid #000", fontFamily: "monospace", fontSize: "0.72rem" }}>
                      {s.step_beat_demo ? '✓' : '·'}{s.step_beat_arr ? '✓' : '·'}{s.step_beat_mix || s.step_beat_master ? '✓' : '·'}
                    </td>
                    {/* Vocal steps */}
                    <td style={{ padding: "5px 6px", textAlign: "center", border: "1px solid #000", fontFamily: "monospace", fontSize: "0.72rem" }}>
                      {isInst ? '— N/A —' : `${s.step_voc_lyrics ? '✓' : '·'}${s.step_voc_demo ? '✓' : '·'}${s.step_voc_rec ? '✓' : '·'}${s.step_voc_mix ? '✓' : '·'}`}
                    </td>
                    {/* Visual steps */}
                    <td style={{ padding: "5px 6px", textAlign: "center", border: "1px solid #000", fontFamily: "monospace", fontSize: "0.72rem" }}>
                      {s.step_vis_concept ? '✓' : '·'}{s.step_vis_final ? '✓' : '·'}
                    </td>
                    {/* Score */}
                    <td style={{ padding: "5px 6px", textAlign: "center", fontWeight: 800, border: "1px solid #000" }}>
                      {score}/{max}
                    </td>
                    {/* Status */}
                    <td style={{ padding: "5px 6px", textAlign: "center", fontWeight: 800, border: "1px solid #000", fontSize: "0.7rem" }}>
                      {isFin ? 'ГОТОВО' : 'В РОБОТІ'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Bottom Compact Notes & Production Sign-off */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            borderTop: "1.5px solid #000000",
            paddingTop: "8px",
            fontSize: "0.72rem",
            color: "#111111",
            gap: 20
          }}>
            <div style={{ flex: 1 }}>
              <strong>Концепція / Нотатки студії:</strong>
              <div style={{ marginTop: 2, color: "#333333", maxHeight: 45, overflow: "hidden", lineHeight: 1.35 }}>
                {album.concept ? album.concept.replace(/^[#\s\-*]+/gm, '').slice(0, 240) : "Не вказано."}
              </div>
            </div>

            <div style={{ width: 220, textAlign: "right" }}>
              <div>Підпис звукорежисера: __________________</div>
              <div style={{ marginTop: 4, fontSize: "0.68rem", color: "#555555" }}>trackER Production Standard • 1-Page B&W</div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
