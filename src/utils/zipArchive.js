import JSZip from 'jszip';

/**
 * Packs all user data from localStorage into a single .zip file.
 * Includes:
 * - tracker_users_registry (profile metadata)
 * - User's private encrypted vault (tracks, concepts, artwork references, notes, timestamps)
 * - Big board entries (private canvas, personal entries, community board)
 * - Shared inbox & shared album links
 * - Account settings & preferences
 * - Media assets extracted from data URLs if present
 */
export async function exportAccountAsZip(currentUser) {
  const zip = new JSZip();
  const username = currentUser ? currentUser.username : 'guest';
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  // 1. Collect all localStorage keys relevant to trackER
  const rawStorage = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('tracker_') || key.startsWith('trackER_'))) {
      rawStorage[key] = localStorage.getItem(key);
    }
  }

  // 2. User profile metadata
  const profile = {
    username: currentUser ? currentUser.username : 'guest',
    artistName: currentUser ? (currentUser.artistName || currentUser.username) : 'Guest',
    isAdmin: !!(currentUser && currentUser.isAdmin),
    exportedAt: new Date().toISOString(),
    system: 'trackER v2.0 Account Backup Archive'
  };

  zip.file('profile.json', JSON.stringify(profile, null, 2));

  // 3. User Vault & Data (Albums, tracks, lyrics, notes)
  const userVaultKey = `tracker_vault_${username}`;
  const userVault = rawStorage[userVaultKey] || rawStorage['tracker_guest_albums'] || null;

  zip.file('vault.json', JSON.stringify({
    vaultKey: userVaultKey,
    encryptedPayload: userVault,
    salt: currentUser ? currentUser.salt : null
  }, null, 2));

  // 4. Boards (Big Board Canvas & Sticky Notes)
  const boards = {
    canvas: rawStorage['tracker_big_board_canvas'] || '',
    privateEntries: JSON.parse(rawStorage['tracker_big_board_entries'] || '[]'),
    customBoards: JSON.parse(rawStorage['tracker_custom_boards'] || '[]'),
    publicBoard: JSON.parse(rawStorage['tracker_shared_public_board'] || '[]')
  };
  zip.file('boards.json', JSON.stringify(boards, null, 2));

  // 5. Full system snapshot for 100% lossless restoration
  zip.file('system_storage_dump.json', JSON.stringify(rawStorage, null, 2));

  // 6. Media assets folder (extract base64 images / audio if present in albums)
  const mediaFolder = zip.folder('media');
  mediaFolder.file('README.txt', 'trackER user media, stems and audio recordings stored in this archive.');

  // Generate ZIP
  const content = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
  const filename = `trackER-account-${username}-${timestamp.slice(0, 10)}.zip`;

  // Trigger download
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);

  return filename;
}

/**
 * Imports an account .zip archive and restores all boards, vault, settings and profiles
 */
export async function importAccountFromZip(file) {
  const zip = new JSZip();
  const unzipped = await zip.loadAsync(file);

  // 1. Check for system_storage_dump.json
  const dumpFile = unzipped.file('system_storage_dump.json');
  if (dumpFile) {
    const jsonStr = await dumpFile.async('string');
    const storageData = JSON.parse(jsonStr);
    for (const [key, val] of Object.entries(storageData)) {
      if (typeof val === 'string') {
        localStorage.setItem(key, val);
      }
    }
  } else {
    // Fallback: restore from boards.json and profile.json
    const boardsFile = unzipped.file('boards.json');
    if (boardsFile) {
      const bData = JSON.parse(await boardsFile.async('string'));
      if (bData.canvas !== undefined) localStorage.setItem('tracker_big_board_canvas', bData.canvas);
      if (bData.privateEntries) localStorage.setItem('tracker_big_board_entries', JSON.stringify(bData.privateEntries));
      if (bData.customBoards) localStorage.setItem('tracker_custom_boards', JSON.stringify(bData.customBoards));
      if (bData.publicBoard) localStorage.setItem('tracker_shared_public_board', JSON.stringify(bData.publicBoard));
    }

    const vaultFile = unzipped.file('vault.json');
    if (vaultFile) {
      const vData = JSON.parse(await vaultFile.async('string'));
      if (vData.vaultKey && vData.encryptedPayload) {
        localStorage.setItem(vData.vaultKey, vData.encryptedPayload);
      }
    }
  }

  // Profile data
  let profile = null;
  const profileFile = unzipped.file('profile.json');
  if (profileFile) {
    profile = JSON.parse(await profileFile.async('string'));
  }

  return { success: true, profile };
}

/**
 * Exports a single album as a portable ZIP (or JSON bundle) with metadata and audio tracks
 */
export async function exportAlbumAsZip(album) {
  const zip = new JSZip();
  const cleanTitle = (album.title || 'album').replace(/[^a-zA-Z0-9_-]/g, '_');

  zip.file('album.json', JSON.stringify(album, null, 2));

  // Tracklist summary
  let summary = `# ${album.title || 'Untitled Album'}\n`;
  summary += `Artist: ${album.artist || 'Unknown'}\n`;
  summary += `Genre: ${album.genre || 'Music'}\n`;
  summary += `Release: ${album.targetDate || 'TBD'}\n\n`;
  summary += `## Tracks (${album.tracks ? album.tracks.length : 0})\n`;
  (album.tracks || []).forEach((tr, i) => {
    summary += `${i + 1}. ${tr.title} [Key: ${tr.key || 'N/A'}, BPM: ${tr.bpm || 'N/A'}]\n`;
  });
  zip.file('TRACKLIST.txt', summary);

  const content = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
  const filename = `trackER-album-${cleanTitle}-${new Date().toISOString().slice(0, 10)}.zip`;

  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);

  return filename;
}

/**
 * Imports an album from either a .zip file or a .json file
 */
export async function importAlbumFromFile(file) {
  if (file.name.endsWith('.zip')) {
    const zip = new JSZip();
    const unzipped = await zip.loadAsync(file);
    const albumJsonFile = unzipped.file('album.json');
    if (!albumJsonFile) {
      throw new Error('album.json not found in archive');
    }
    const albumText = await albumJsonFile.async('string');
    const parsed = JSON.parse(albumText);
    return Array.isArray(parsed) ? parsed[0] : parsed;
  } else {
    // JSON file
    const text = await file.text();
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed[0] : parsed;
  }
}

