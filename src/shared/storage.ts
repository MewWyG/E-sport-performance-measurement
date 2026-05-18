/**
 * Best score storage — saved in localStorage for the lobby Game Card.
 */

const KEY = "esport-skill-tester:bestScores";

export interface BestScore {
  score: number;
  grade: string;
  recordedAt: string;
}

type Bag = Record<string, BestScore>;

function readBag(): Bag {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Bag) : {};
  } catch {
    return {};
  }
}

function writeBag(bag: Bag) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(bag));
  } catch {
    /* ignore quota / privacy mode */
  }
}

export function getBestScore(gameId: string): BestScore | null {
  return readBag()[gameId] ?? null;
}

export function getAllBestScores(): Bag {
  return readBag();
}

export function maybeRecordBest(gameId: string, score: number, grade: string): boolean {
  const bag = readBag();
  const current = bag[gameId];
  if (!current || score > current.score) {
    bag[gameId] = { score, grade, recordedAt: new Date().toISOString() };
    writeBag(bag);
    return true;
  }
  return false;
}
