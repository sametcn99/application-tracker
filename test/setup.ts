import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach } from "vitest";

// Vitest 4 + Node 22 ships a partial built-in `localStorage` that lacks
// most of the Web Storage API. Replace it with an in-memory implementation
// so jsdom tests behave like a browser.
class MemoryStorage implements Storage {
	private store = new Map<string, string>();
	get length() {
		return this.store.size;
	}
	clear(): void {
		this.store.clear();
	}
	getItem(key: string): string | null {
		return this.store.has(key) ? (this.store.get(key) as string) : null;
	}
	key(index: number): string | null {
		return Array.from(this.store.keys())[index] ?? null;
	}
	removeItem(key: string): void {
		this.store.delete(key);
	}
	setItem(key: string, value: string): void {
		this.store.set(key, String(value));
	}
}

function installStorage() {
	Object.defineProperty(globalThis, "localStorage", {
		value: new MemoryStorage(),
		configurable: true,
		writable: true,
	});
	Object.defineProperty(globalThis, "sessionStorage", {
		value: new MemoryStorage(),
		configurable: true,
		writable: true,
	});
}

installStorage();

beforeEach(() => {
	installStorage();
});

afterEach(() => {
	cleanup();
});
