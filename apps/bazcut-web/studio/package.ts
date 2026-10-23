import { uid, validateProject, type Project } from "./model";
import { fingerprint } from "./media";
import { getMedia, putMedia } from "./storage";

const magic = new TextEncoder().encode("BAZCUT2\0");
const headerSize = magic.length + 4;
const metadataLimit = 20 * 1024 * 1024;
type Manifest = {
  format: 2;
  project: Project;
  media: { id: string; size: number; hash: string }[];
};

export async function isPortableProject(blob: Blob): Promise<boolean> {
  const prefix = new Uint8Array(
    await blob.slice(0, magic.length).arrayBuffer(),
  );
  return magic.every((byte, i) => prefix[i] === byte);
}

/** A versioned header plus original bytes; no transcoding, execution or external URLs. */
export async function packageProject(
  project: Project,
  progress?: (name: string) => void,
): Promise<Blob> {
  validateProject(project);
  const p = structuredClone(project);
  const files: Blob[] = [];
  for (const asset of p.assets) {
    progress?.(asset.name);
    const file = await getMedia(asset.id);
    if (!file)
      throw Error(
        `Missing media: ${asset.name}. Relink it before creating a portable project.`,
      );
    if (file.size !== asset.size || (await fingerprint(file)) !== asset.hash)
      throw Error(
        `Original checksum mismatch: ${asset.name}. Relink the exact original.`,
      );
    files.push(file);
  }
  const manifest: Manifest = {
    format: 2,
    project: p,
    media: p.assets.map((a) => ({ id: a.id, size: a.size, hash: a.hash })),
  };
  const metadata = new TextEncoder().encode(JSON.stringify(manifest));
  if (metadata.length > metadataLimit)
    throw Error("Project metadata exceeds the 20 MB limit.");
  const header = new Uint8Array(headerSize);
  header.set(magic);
  new DataView(header.buffer).setUint32(magic.length, metadata.length, true);
  return new Blob([header, metadata, ...files], {
    type: "application/x-bazcut-project",
  });
}

export async function unpackProject(
  file: Blob,
  progress?: (name: string) => void,
): Promise<Project> {
  if (!(await isPortableProject(file)))
    throw Error("This is not a supported BazCut portable project.");
  const header = await file.slice(0, headerSize).arrayBuffer();
  if (header.byteLength !== headerSize)
    throw Error("The project file is truncated.");
  const length = new DataView(header).getUint32(magic.length, true);
  if (!length || length > metadataLimit || length + headerSize > file.size)
    throw Error("Invalid or truncated project metadata.");
  const manifest = JSON.parse(
    await file.slice(headerSize, headerSize + length).text(),
  ) as Manifest;
  if (manifest.format !== 2 || !Array.isArray(manifest.media))
    throw Error("Unsupported portable project format.");
  const p = structuredClone(validateProject(manifest.project));
  if (manifest.media.length !== p.assets.length)
    throw Error("Incomplete original media manifest.");
  let offset = headerSize + length;
  const files: Blob[] = [];
  // Verify the complete package before writing any imported originals.
  for (let i = 0; i < p.assets.length; i++) {
    const asset = p.assets[i]!,
      entry = manifest.media[i]!;
    if (
      entry.id !== asset.id ||
      entry.size !== asset.size ||
      entry.hash !== asset.hash ||
      !Number.isSafeInteger(offset + asset.size) ||
      offset + asset.size > file.size
    )
      throw Error("Invalid or truncated original media manifest.");
    progress?.(asset.name);
    const blob = file.slice(offset, offset + asset.size, asset.mime);
    if ((await fingerprint(blob)) !== asset.hash)
      throw Error(
        `Original checksum mismatch: ${asset.name}. The project was not imported.`,
      );
    files.push(blob);
    offset += asset.size;
  }
  if (offset !== file.size)
    throw Error("Unexpected data after the project package.");
  // New IDs prevent an imported package from replacing another project's originals.
  const ids = new Map(p.assets.map((asset) => [asset.id, uid()]));
  p.assets = p.assets.map((asset) => ({
    ...asset,
    id: ids.get(asset.id)!,
    ...(asset.proxyOf
      ? { proxyOf: ids.get(asset.proxyOf) ?? asset.proxyOf }
      : {}),
  }));
  p.clips = p.clips.map((clip) => ({
    ...clip,
    ...(clip.assetId ? { assetId: ids.get(clip.assetId)! } : {}),
  }));
  p.id = uid();
  p.revision = 0;
  p.parentRevision = null;
  p.created = p.updated = new Date().toISOString();
  p.sync = {
    ...p.sync,
    enabled: false,
    originals: false,
    remoteRevision: null,
  };
  p.permissions = { cloudInference: false, training: false, publishing: false };
  validateProject(p);
  for (let i = 0; i < p.assets.length; i++)
    await putMedia(p.assets[i]!, files[i]!);
  return p;
}
