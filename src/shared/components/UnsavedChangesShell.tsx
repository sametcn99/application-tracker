"use client";

import type { ReactNode } from "react";
import { UnsavedChangesDialog } from "./UnsavedChangesDialog";
import { UnsavedChangesProvider } from "./UnsavedChangesProvider";

export function UnsavedChangesShell({ children }: { children: ReactNode }) {
	return (
		<UnsavedChangesProvider
			renderDialog={(props) => <UnsavedChangesDialog {...props} />}
			beforeUnloadMessage="You have unsaved changes."
		>
			{children}
		</UnsavedChangesProvider>
	);
}
