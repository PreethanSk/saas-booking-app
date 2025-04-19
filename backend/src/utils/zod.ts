import { z } from "zod";

//SUPER ADMIN
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

export const superAdminUpdateSchema = z.object({
  username: z.string().min(5).optional(),
  email: z.string().email().optional(),
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
    }).optional(),
    picture: z.string().optional()
});

export const  forgotPasswordSchema = z.object({
 username: z.string(),
 passwordKey: z.string(),
  newPassword:  z
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

export const branchUpdateSchema = z.object({
  name: z.string().optional(),
  address: z.string().optional(),
  pincode: z.number().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  picture: z.string().optional(),
  branchId: z.number()
})


export const franchiseMangerCreateSchema = z.object({
  email: z.string().email(),
  username: z.string(),
  branchId: z.number()
})

export const adminForgotUsernameSchema = z.object({
  email: z.string().email(),
  passworD: z.string()
})

// Zod schema for /updateUser endpoint (franchise manager)
export const franchiseManagerUpdateSchema = z.object({
  username: z.string().min(3).optional(),
  email: z.string().email().optional(),
  name: z.string().min(1).optional(),
  phoneNumber: z.string().min(5).optional(),
  picture: z.string().optional(),
});

//MANAGER
export const createPasswordSchema = z.object({
  username: z.string(),
  passwordKey: z.string(),
  newPassword:  z
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
})