import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Adresse e-mail invalide."),
  password: z.string().min(1, "Le mot de passe est requis."),
});

export const registerSchema = z
  .object({
    displayName: z.string().trim().min(2, "Le nom affiché est requis."),
    email: z.string().email("Adresse e-mail invalide."),
    password: z
      .string()
      .min(12, "Le mot de passe doit contenir au moins 12 caractères.")
      .regex(/[A-Z]/, "Ajoutez au moins une majuscule.")
      .regex(/[a-z]/, "Ajoutez au moins une minuscule.")
      .regex(/[0-9]/, "Ajoutez au moins un chiffre."),
    confirmPassword: z.string().min(1, "La confirmation est requise."),
    workspaceName: z.string().trim().max(80, "Nom de workspace trop long.").optional().or(z.literal("")),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email("Adresse e-mail invalide."),
});
