export type QueueItem<T> = { item: T, priority: number }

export function enqueue<T>(queue: QueueItem<T>[], item: any, priority: number) {
  queue.push({ item, priority });
}

export function dequeue<T>(queue: QueueItem<T>[]): T | undefined {
  // get the highest priority item from the queue (lowest priority value)
  let idx = -1;
  let lowest = null;
  for (let i = 0; i < queue.length; i++) {
    const { priority } = queue[i];
    if (lowest === null || priority < lowest) {
      lowest = priority;
      idx = i;
    }
  }
  if (idx >= 0) {
    const item = queue.splice(idx, 1)[0];
    return item.item;
  }
  return undefined;
}

function constructPath(cameFrom: Map<string, any>, goal: any, hash: Function): Array<any> {
  const path: Array<any> = [goal];
  let next: any = goal;

  while (cameFrom.get(hash(next)) !== next) {
    next = cameFrom.get(hash(next));
    path.unshift(next);
  }

  return path;
}

// A* search algorithm
export default async function search<T>(start: T, goal: T, hueristic: (a: T, b: T) => number, cost: (a: T, b: T) => number, neighbors: (a: T) => Promise<T[]>, hash: (a: T) => string): Promise<Array<any> | null> {
  if (start === undefined || goal === undefined || hash(start) === hash(goal)) {
    // Special case bail out if the start and goal are the same or we don't have a start or goal
    return null;
  }
  const frontier: QueueItem<T>[] = [];
  frontier.push({ item: start, priority: 0 });
  const cameFrom: Map<string, any> = new Map();
  cameFrom.set(hash(start), start);
  const costSoFar: Map<string, number> = new Map();
  costSoFar.set(hash(start), 0);
  while (frontier.length > 0) {
    const current = dequeue(frontier);
    if (!current) {
      break;
    }
    if (hash(current) === hash(goal)) {
      return constructPath(cameFrom, goal, hash);
    }
    const adjacent = await neighbors(current);
    for (const next of adjacent) {
      const newCost = (costSoFar.get(hash(current)) ?? 0) + cost(current, next);
      const nextCost = costSoFar.get(hash(next));
      if (nextCost === undefined || newCost < nextCost) {
        costSoFar.set(hash(next), newCost);
        const priority = newCost + hueristic(next, goal);
        enqueue(frontier, next, priority);
        cameFrom.set(hash(next), current);
      }
    }
  }

  return null;
}