/**
 * Generic indexed min-heap.
 *
 * Supports O(log n) insert, extract-min, and update-priority — unlike
 * standard priority queues which don't expose a decrease-key operation.
 *
 * How it works: maintains a `indexMap` (key → heap index) alongside the heap
 * array. Every swap keeps both in sync, so any item can be located and
 * re-heapified in O(log n) instead of O(n) scan + O(log n) fix.
 */
export class IndexedMinHeap<T> {
  private heap: T[] = [];
  private indexMap = new Map<string, number>(); // key → position in heap[]

  constructor(
    private getKey: (item: T) => string,
    private getPriority: (item: T) => number,
  ) {}

  // ── Core operations ────────────────────────────────────────────────────────

  /** Insert a new item, or update priority if key already exists. */
  upsert(item: T): void {
    const key = this.getKey(item);
    const existing = this.indexMap.get(key);

    if (existing !== undefined) {
      const oldPriority = this.getPriority(this.heap[existing]);
      const newPriority = this.getPriority(item);
      this.heap[existing] = item;
      if (newPriority < oldPriority) this.bubbleUp(existing);
      else if (newPriority > oldPriority) this.bubbleDown(existing);
    } else {
      const i = this.heap.length;
      this.heap.push(item);
      this.indexMap.set(key, i);
      this.bubbleUp(i);
    }
  }

  /** Remove and return the item with the lowest priority. */
  dequeue(): T | null {
    if (this.heap.length === 0) return null;

    const min = this.heap[0];
    this.indexMap.delete(this.getKey(min));

    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.indexMap.set(this.getKey(last), 0);
      this.bubbleDown(0);
    }
    return min;
  }

  peek(): T | null {
    return this.heap[0] ?? null;
  }

  has(key: string): boolean {
    return this.indexMap.has(key);
  }

  size(): number {
    return this.heap.length;
  }

  isEmpty(): boolean {
    return this.heap.length === 0;
  }

  // ── Internal heap maintenance ──────────────────────────────────────────────

  private swap(i: number, j: number): void {
    [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
    this.indexMap.set(this.getKey(this.heap[i]), i);
    this.indexMap.set(this.getKey(this.heap[j]), j);
  }

  private bubbleUp(i: number): void {
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.getPriority(this.heap[parent]) <= this.getPriority(this.heap[i]))
        break;
      this.swap(i, parent);
      i = parent;
    }
  }

  private bubbleDown(i: number): void {
    const n = this.heap.length;
    while (true) {
      let smallest = i;
      const l = 2 * i + 1;
      const r = 2 * i + 2;
      if (
        l < n &&
        this.getPriority(this.heap[l]) < this.getPriority(this.heap[smallest])
      )
        smallest = l;
      if (
        r < n &&
        this.getPriority(this.heap[r]) < this.getPriority(this.heap[smallest])
      )
        smallest = r;
      if (smallest === i) break;
      this.swap(i, smallest);
      i = smallest;
    }
  }
}
