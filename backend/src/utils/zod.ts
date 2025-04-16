import { z } from "zod";

export const superAdminSignUpSchema = z.object({
  username: z.string().min(5),
  email: z.string().email(),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" })
    .max(32, { message: "Password must be at most 32 characters long" })
    .regex(/[A-Z]/, {
      message: "Password must contain at least one uppercase letter",
    })
    .regex(/[a-z]/, {
      message: "Password must contain at least one lowercase letter",
    })
    .regex(/[0-9]/, { message: "Password must contain at least one number" })
    .regex(/[^A-Za-z0-9]/, {
      message: "Password must contain at least one special character",
    }),
    picture: z.string().optional()
});

export const adminSigninSchema = z.object({
  username: z.string(),
  password: z.string()
})


export const branchCreateSchema = z.object({
  name: z.string(),
  address: z.string(),
  pincode: z.number(),
  city: z.string(),
  state: z.string(),
  country: z.string(),
  picture: z.string().optional()
})