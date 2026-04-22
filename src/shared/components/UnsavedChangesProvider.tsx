"use client";

import { useRouter } from "next/navigation";
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";

type GuardHandlers = {
	/** Called when user accepts navigation. Should return true if it's safe to proceed. */
	onConfirm: () => boolean | Promise<boolean>;
};

type PendingNavigation =
	| { kind: "push" | "replace"; href: string }
	| { kind: "back" }
	| { kind: "forward" }
	| { kind: "external"; href: string }
	| null;

type GuardState = {
	dirty: boolean;
	open: boolean;
	pending: PendingNavigation;
};

type GuardApi = {
	registerGuard(handlers: GuardHandlers): () => void;
	setDirty(dirty: boolean): void;
	requestNavigation(target: PendingNavigation): void;
	cancel(): void;
	/** Bypass guard for the next navigation (used after explicit save/discard). */
	allowNext(): void;
	state: GuardState;
};

const Ctx = createContext<GuardApi | null>(null);

export function useUnsavedChanges() {
	const ctx = useContext(Ctx);
	if (!ctx) {
		throw new Error(
			"useUnsavedChanges must be used inside <UnsavedChangesProvider>",
		);
	}
	return ctx;
}

type DialogTexts = {
	title: string;
	description: string;
	stay: string;
	discard: string;
	saveDraft: string;
};

type Props = {
	children: ReactNode;
	renderDialog: (props: {
		open: boolean;
		onStay: () => void;
		onDiscard: () => Promise<void> | void;
		onSaveDraft: () => Promise<void> | void;
	}) => ReactNode;
	beforeUnloadMessage?: string;
};

export function UnsavedChangesProvider({
	children,
	renderDialog,
	beforeUnloadMessage,
}: Props) {
	const router = useRouter();
	const handlersRef = useRef<GuardHandlers | null>(null);
	const allowNextRef = useRef(false);
	const [dirty, setDirtyState] = useState(false);
	const [open, setOpen] = useState(false);
	const [pending, setPending] = useState<PendingNavigation>(null);

	const registerGuard = useCallback((handlers: GuardHandlers) => {
		handlersRef.current = handlers;
		return () => {
			if (handlersRef.current === handlers) handlersRef.current = null;
		};
	}, []);

	const setDirty = useCallback((next: boolean) => {
		setDirtyState((prev) => (prev === next ? prev : next));
	}, []);

	const allowNext = useCallback(() => {
		allowNextRef.current = true;
	}, []);

	const requestNavigation = useCallback(
		(target: PendingNavigation) => {
			if (!target) return;
			if (allowNextRef.current || !dirty || !handlersRef.current) {
				allowNextRef.current = false;
				executeNavigation(target, router);
				return;
			}
			setPending(target);
			setOpen(true);
		},
		[dirty, router],
	);

	const cancel = useCallback(() => {
		setOpen(false);
		setPending(null);
	}, []);

	// Click interception for in-app links
	useEffect(() => {
		function onClick(e: MouseEvent) {
			if (!dirty) return;
			if (
				e.defaultPrevented ||
				e.button !== 0 ||
				e.metaKey ||
				e.ctrlKey ||
				e.shiftKey ||
				e.altKey
			) {
				return;
			}
			const target = e.target as HTMLElement | null;
			const anchor = target?.closest?.("a");
			if (!anchor) return;
			const href = anchor.getAttribute("href");
			if (!href || href.startsWith("#")) return;
			const downloaded = anchor.hasAttribute("download");
			if (downloaded) return;
			const targetAttr = anchor.getAttribute("target");
			if (targetAttr && targetAttr !== "_self") return;

			let url: URL;
			try {
				url = new URL(href, window.location.href);
			} catch {
				return;
			}
			if (url.origin !== window.location.origin) return;
			if (
				url.pathname === window.location.pathname &&
				url.search === window.location.search
			) {
				return;
			}
			e.preventDefault();
			requestNavigation({
				kind: "push",
				href: url.pathname + url.search + url.hash,
			});
		}
		document.addEventListener("click", onClick, true);
		return () => document.removeEventListener("click", onClick, true);
	}, [dirty, requestNavigation]);

	// beforeunload native warning
	useEffect(() => {
		if (!dirty) return;
		function handler(e: BeforeUnloadEvent) {
			e.preventDefault();
			e.returnValue = beforeUnloadMessage ?? "";
			return beforeUnloadMessage ?? "";
		}
		window.addEventListener("beforeunload", handler);
		return () => window.removeEventListener("beforeunload", handler);
	}, [dirty, beforeUnloadMessage]);

	const proceedAfterAction = useCallback(async () => {
		const target = pending;
		setOpen(false);
		setPending(null);
		setDirtyState(false);
		if (target) {
			allowNextRef.current = true;
			executeNavigation(target, router);
		}
	}, [pending, router]);

	const onStay = useCallback(() => {
		cancel();
	}, [cancel]);

	const onDiscard = useCallback(async () => {
		await proceedAfterAction();
	}, [proceedAfterAction]);

	const onSaveDraft = useCallback(async () => {
		const handlers = handlersRef.current;
		if (handlers) {
			try {
				const ok = await handlers.onConfirm();
				if (!ok) {
					return;
				}
			} catch (err) {
				console.error(err);
				return;
			}
		}
		await proceedAfterAction();
	}, [proceedAfterAction]);

	const value = useMemo<GuardApi>(
		() => ({
			registerGuard,
			setDirty,
			requestNavigation,
			cancel,
			allowNext,
			state: { dirty, open, pending },
		}),
		[
			registerGuard,
			setDirty,
			requestNavigation,
			cancel,
			allowNext,
			dirty,
			open,
			pending,
		],
	);

	return (
		<Ctx.Provider value={value}>
			{children}
			{renderDialog({ open, onStay, onDiscard, onSaveDraft })}
		</Ctx.Provider>
	);
}

function executeNavigation(
	target: PendingNavigation,
	router: ReturnType<typeof useRouter>,
) {
	if (!target) return;
	switch (target.kind) {
		case "push":
			router.push(target.href);
			return;
		case "replace":
			router.replace(target.href);
			return;
		case "back":
			router.back();
			return;
		case "forward":
			router.forward();
			return;
		case "external":
			window.location.href = target.href;
	}
}

export type { DialogTexts };
