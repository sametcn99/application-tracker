import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../../helpers/intl";

const loginAction = vi.hoisted(() => vi.fn());

vi.mock("../../../../src/app/login/actions/login", () => ({
	loginAction,
}));

import { LoginForm } from "@/app/login/components/LoginForm";

describe("<LoginForm />", () => {
	it("renders email and password inputs and a submit button", () => {
		renderWithProviders(<LoginForm callbackUrl="/" />);
		expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
		expect(screen.getByRole("button")).toBeEnabled();
	});

	it("includes the callback URL as a hidden input", () => {
		const { container } = renderWithProviders(
			<LoginForm callbackUrl="/dashboard" />,
		);
		const hidden = container.querySelector(
			'input[type="hidden"][name="callbackUrl"]',
		) as HTMLInputElement | null;
		expect(hidden).not.toBeNull();
		expect(hidden?.value).toBe("/dashboard");
	});

	it("submits credentials via the form action", async () => {
		const user = userEvent.setup();
		loginAction.mockResolvedValueOnce(null);
		renderWithProviders(<LoginForm callbackUrl="/" />);

		await user.type(screen.getByLabelText(/email/i), "admin@example.com");
		await user.type(screen.getByLabelText(/password/i), "secret123");
		await user.click(screen.getByRole("button"));

		expect(loginAction).toHaveBeenCalledTimes(1);
		const [, formData] = loginAction.mock.calls[0] as [unknown, FormData];
		expect(formData.get("email")).toBe("admin@example.com");
		expect(formData.get("password")).toBe("secret123");
		expect(formData.get("callbackUrl")).toBe("/");
	});
});
