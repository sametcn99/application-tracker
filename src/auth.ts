import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { prisma } from "@/shared/lib/prisma";

const credentialsSchema = z.object({
	email: z.string().email(),
	password: z.string().min(1),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
	session: { strategy: "jwt" },
	pages: { signIn: "/login" },
	providers: [
		Credentials({
			name: "Credentials",
			credentials: {
				email: { label: "Email", type: "email" },
				password: { label: "Password", type: "password" },
			},
			async authorize(raw) {
				const parsed = credentialsSchema.safeParse(raw);
				if (!parsed.success) return null;

				const user = await prisma.user.findUnique({
					where: { email: parsed.data.email },
				});
				if (!user) return null;

				const valid = await bcrypt.compare(
					parsed.data.password,
					user.passwordHash,
				);
				if (!valid) return null;

				return { id: user.id, email: user.email, name: user.name ?? undefined };
			},
		}),
	],
	callbacks: {
		async jwt({ token, user }) {
			if (user) {
				token.id = user.id;
			}
			return token;
		},
		async session({ session, token }) {
			if (token?.id && session.user) {
				session.user.id = token.id as string;
			}
			return session;
		},
	},
});
