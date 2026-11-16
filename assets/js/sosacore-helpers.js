/**
 * Pure helper utilities for Sosa-Core Bento Archive.
 * Works both in browser globals (window.SosaCoreHelpers) and Node (CommonJS).
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.SosaCoreHelpers = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function sanitizeNote(note) {
    if (note === null || note === undefined) return "";
    return String(note).trim();
  }

  function normalizeAlbumKey(artist, title) {
    const a = String(artist || "").trim().toLowerCase();
    const t = String(title || "").trim().toLowerCase();
    return `${a}|${t}`;
  }

  function toStringArray(val) {
    if (Array.isArray(val)) {
      return val.map((v) => String(v).trim()).filter(Boolean);
    }
    if (typeof val === "string" && val.trim()) {
      return val
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
    }
    return [];
  }

  function parseFavTracks(val) {
    if (Array.isArray(val)) {
      return val.map((v) => String(v).trim()).filter(Boolean);
    }
    if (typeof val === "string" && val.trim()) {
      return val
        .split(/\r?\n/)
        .map((v) => v.trim())
        .filter(Boolean);
    }
    return [];
  }

  /**
   * Resolves a sosa_core row against live spins data when spin_id is linked.
   */
  function resolveCoreItemData(item, spinsById) {
    const spin =
      item && item.spin_id !== null && item.spin_id !== undefined && spinsById
        ? spinsById.get(Number(item.spin_id)) || spinsById.get(item.spin_id)
        : null;

    const genres = spin
      ? toStringArray(spin.genres)
      : toStringArray(item && item.genres);
    const secondaryGenres = spin
      ? toStringArray(spin.secondary_genres)
      : toStringArray(item && item.secondary_genres);

    const rawRating = spin && spin.rating !== null && spin.rating !== undefined
      ? spin.rating
      : item && item.rating;
    const rating =
      rawRating !== null && rawRating !== undefined && rawRating !== ""
        ? Number(rawRating)
        : null;

    const releaseYear =
      spin && (spin.year !== null && spin.year !== undefined)
        ? spin.year
        : item && item.release_year;

    const coverUrl =
      (spin && spin.cover_url) ||
      (item && item.cover_url) ||
      "assets/images/spins/placeholder.png";

    return {
      ...item,
      artist: (spin && spin.artist) || (item && item.artist) || "Unknown Artist",
      title: (spin && spin.title) || (item && item.title) || "Untitled",
      release_year: releaseYear || null,
      cover_url: coverUrl,
      rating: Number.isFinite(rating) ? rating : null,
      genres,
      secondary_genres: secondaryGenres,
      tags: toStringArray(item && item.tags),
      liner_note: sanitizeNote(item && item.liner_note),
      fav_tracks: spin ? parseFavTracks(spin.fav_tracks) : [],
      isSynced: Boolean(spin)
    };
  }

  function filterCoreItems(items, activeTag) {
    const sorted = [...(items || [])].sort(
      (a, b) => (Number(a.position) || 0) - (Number(b.position) || 0)
    );
    if (!activeTag || String(activeTag).toLowerCase() === "all") {
      return sorted;
    }
    const target = String(activeTag).trim().toLowerCase();
    return sorted.filter((item) =>
      toStringArray(item.tags).some((t) => t.toLowerCase() === target)
    );
  }

  function buildVisibleTags(allTags, items, isAdmin) {
    const counts = new Map();
    for (const item of items || []) {
      const seen = new Set();
      for (const tag of toStringArray(item.tags)) {
        const key = tag.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        counts.set(key, (counts.get(key) || 0) + 1);
      }
    }

    const sortedTags = [...(allTags || [])].sort(
      (a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0)
    );

    return sortedTags
      .map((tag) => ({
        ...tag,
        count: counts.get(String(tag.name || "").trim().toLowerCase()) || 0
      }))
      .filter((tag) => isAdmin || tag.count > 0);
  }

  function cascadeTagRenameInItems(items, oldName, newName) {
    const oldLow = String(oldName || "").trim().toLowerCase();
    const trimmedNew = String(newName || "").trim();
    if (!oldLow || !trimmedNew) return [];

    const updates = [];
    for (const item of items || []) {
      const currentTags = toStringArray(item.tags);
      if (!currentTags.some((t) => t.toLowerCase() === oldLow)) continue;

      const nextTags = [];
      const seen = new Set();
      for (const tag of currentTags) {
        const mapped = tag.toLowerCase() === oldLow ? trimmedNew : tag;
        const key = mapped.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          nextTags.push(mapped);
        }
      }
      updates.push({ id: item.id, tags: nextTags });
    }
    return updates;
  }

  function cascadeTagDeleteInItems(items, deletedName) {
    const delLow = String(deletedName || "").trim().toLowerCase();
    if (!delLow) return [];

    const updates = [];
    for (const item of items || []) {
      const currentTags = toStringArray(item.tags);
      if (!currentTags.some((t) => t.toLowerCase() === delLow)) continue;
      updates.push({
        id: item.id,
        tags: currentTags.filter((t) => t.toLowerCase() !== delLow)
      });
    }
    return updates;
  }

  function isAlbumPlaced(items, candidate) {
    if (!candidate) return false;
    const candSpinId =
      candidate.spin_id !== null && candidate.spin_id !== undefined
        ? Number(candidate.spin_id)
        : null;
    const candKey = normalizeAlbumKey(candidate.artist, candidate.title);

    return (items || []).some((item) => {
      if (candSpinId !== null && item.spin_id !== null && item.spin_id !== undefined) {
        if (Number(item.spin_id) === candSpinId) return true;
      }
      return normalizeAlbumKey(item.artist, item.title) === candKey;
    });
  }

  function reorderPositions(items, draggedId, targetId) {
    const sorted = [...(items || [])].sort(
      (a, b) => (Number(a.position) || 0) - (Number(b.position) || 0)
    );
    const fromIdx = sorted.findIndex((x) => Number(x.id) === Number(draggedId));
    const toIdx = sorted.findIndex((x) => Number(x.id) === Number(targetId));
    if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) {
      return sorted.map((x, idx) => ({ id: x.id, position: idx }));
    }

    const [moved] = sorted.splice(fromIdx, 1);
    sorted.splice(toIdx, 0, moved);
    return sorted.map((x, idx) => ({ id: x.id, position: idx }));
  }

  function renderStarIconsHtml(rating) {
    if (rating === null || rating === undefined || rating === "") return "";
    const num = Number(rating);
    if (!Number.isFinite(num)) return "";

    const clamped = Math.max(0, Math.min(5, num));
    const full = Math.floor(clamped);
    const hasHalf = clamped - full >= 0.25 && clamped - full < 0.75;
    const roundedUpFull = clamped - full >= 0.75 ? full + 1 : full;
    const empty = 5 - roundedUpFull - (hasHalf ? 1 : 0);

    let html = "";
    for (let i = 0; i < roundedUpFull; i++) {
      html += `<i class='bx bxs-star' aria-hidden="true"></i>`;
    }
    if (hasHalf) {
      html += `<i class='bx bxs-star-half' aria-hidden="true"></i>`;
    }
    for (let i = 0; i < empty; i++) {
      html += `<i class='bx bx-star empty' aria-hidden="true"></i>`;
    }
    return html;
  }

  return {
    escapeHtml,
    sanitizeNote,
    normalizeAlbumKey,
    toStringArray,
    parseFavTracks,
    resolveCoreItemData,
    filterCoreItems,
    buildVisibleTags,
    cascadeTagRenameInItems,
    cascadeTagDeleteInItems,
    isAlbumPlaced,
    reorderPositions,
    renderStarIconsHtml
  };
});
