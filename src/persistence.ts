import type { MatchResult } from "./complementary";

type SavedFile = {
  name: string;
  type: string;
  lastModified: number;
  contents: Blob;
};

type Draft = {
  officialFile?: SavedFile;
  complementaryFile?: SavedFile;
  result?: MatchResult;
};

const DATABASE_NAME = "suap-assistencia-estudantil";
const STORE_NAME = "drafts";
const DRAFT_KEY = "current";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Não foi possível abrir o armazenamento local."));
  });
}

async function readDraft(): Promise<Draft> {
  const database = await openDatabase();
  return new Promise<Draft>((resolve, reject) => {
    const request = database.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(DRAFT_KEY);
    request.onsuccess = () => resolve((request.result as Draft | undefined) ?? {});
    request.onerror = () => reject(request.error ?? new Error("Não foi possível recuperar os arquivos salvos."));
  }).finally(() => database.close());
}

async function writeDraft(draft: Draft): Promise<void> {
  const database = await openDatabase();
  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(draft, DRAFT_KEY);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Não foi possível guardar os arquivos localmente."));
    transaction.onabort = () => reject(transaction.error ?? new Error("O armazenamento local foi interrompido."));
  }).finally(() => database.close());
}

function asSavedFile(file: File): SavedFile {
  return { name: file.name, type: file.type, lastModified: file.lastModified, contents: file };
}

function asFile(saved?: SavedFile): File | null {
  if (!saved) return null;
  return new File([saved.contents], saved.name, { type: saved.type, lastModified: saved.lastModified });
}

export async function loadDraft(): Promise<{
  officialFile: File | null;
  complementaryFile: File | null;
  result: MatchResult | null;
}> {
  const draft = await readDraft();
  return {
    officialFile: asFile(draft.officialFile),
    complementaryFile: asFile(draft.complementaryFile),
    result: draft.result ?? null,
  };
}

export async function saveOfficialFile(file: File): Promise<void> {
  const draft = await readDraft();
  await writeDraft({ ...draft, officialFile: asSavedFile(file), result: undefined });
}

export async function saveComplementaryFile(file: File): Promise<void> {
  const draft = await readDraft();
  await writeDraft({ ...draft, complementaryFile: asSavedFile(file), result: undefined });
}

export async function saveMatchResult(result: MatchResult): Promise<void> {
  const draft = await readDraft();
  await writeDraft({ ...draft, result });
}

export async function clearDraft(): Promise<void> {
  const database = await openDatabase();
  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).delete(DRAFT_KEY);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Não foi possível limpar os dados locais."));
  }).finally(() => database.close());
}
