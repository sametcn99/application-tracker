"use client";

import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { AlertDialog, Button, Flex, Text } from "@radix-ui/themes";
import { useTranslations } from "next-intl";
import { useState } from "react";

type ButtonColor = "gray" | "red" | "green" | "amber";

type ConfirmationDialogProps = {
	trigger?: React.ReactNode;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	tone?: "danger" | "warning";
	title: React.ReactNode;
	description?: React.ReactNode;
	children?: React.ReactNode;
	confirmLabel?: React.ReactNode;
	confirmLoadingLabel?: React.ReactNode;
	cancelLabel?: React.ReactNode;
	confirmColor?: ButtonColor;
	confirmDisabled?: boolean;
	onConfirm?: () => Promise<unknown> | unknown;
	footer?: React.ReactNode;
	maxWidth?: string;
};

export function ConfirmationDialog({
	trigger,
	open,
	onOpenChange,
	tone = "danger",
	title,
	description,
	children,
	confirmLabel,
	confirmLoadingLabel,
	cancelLabel,
	confirmColor = "red",
	confirmDisabled = false,
	onConfirm,
	footer,
	maxWidth = "460px",
}: ConfirmationDialogProps) {
	const tCommon = useTranslations("common");
	const [internalOpen, setInternalOpen] = useState(false);
	const [pending, setPending] = useState(false);
	const actualOpen = open ?? internalOpen;
	const toneColor = tone === "warning" ? "var(--amber-11)" : "var(--red-11)";
	const toneBackground =
		tone === "warning" ? "var(--amber-a3)" : "var(--red-a3)";

	const setOpen = (nextOpen: boolean) => {
		if (pending && !nextOpen) return;
		if (open === undefined) setInternalOpen(nextOpen);
		onOpenChange?.(nextOpen);
	};

	const handleConfirm = async () => {
		if (!onConfirm) return;

		setPending(true);
		try {
			await onConfirm();
			setOpen(false);
		} finally {
			setPending(false);
		}
	};

	return (
		<AlertDialog.Root open={actualOpen} onOpenChange={setOpen}>
			{trigger ? <AlertDialog.Trigger>{trigger}</AlertDialog.Trigger> : null}
			<AlertDialog.Content maxWidth={maxWidth}>
				<Flex align="start" gap="3" mb="3">
					<Flex
						align="center"
						justify="center"
						style={{
							width: 36,
							height: 36,
							borderRadius: 12,
							background: toneBackground,
							color: toneColor,
							flexShrink: 0,
						}}
					>
						<ExclamationTriangleIcon width={18} height={18} />
					</Flex>
					<Flex direction="column" gap="1" style={{ minWidth: 0 }}>
						<AlertDialog.Title>{title}</AlertDialog.Title>
						{description ? (
							<AlertDialog.Description size="2" color="gray">
								<Text as="span">{description}</Text>
							</AlertDialog.Description>
						) : null}
					</Flex>
				</Flex>

				{children}

				{footer ?? (
					<Flex gap="3" mt="4" justify="end" wrap="wrap">
						<Button
							variant="soft"
							color="gray"
							onClick={() => setOpen(false)}
							disabled={pending}
						>
							{cancelLabel ?? tCommon("cancel")}
						</Button>
						<Button
							color={confirmColor}
							onClick={handleConfirm}
							disabled={pending || confirmDisabled}
						>
							{pending
								? (confirmLoadingLabel ?? tCommon("loading"))
								: (confirmLabel ?? tCommon("delete"))}
						</Button>
					</Flex>
				)}
			</AlertDialog.Content>
		</AlertDialog.Root>
	);
}
