import { z } from 'zod';

const userSchema = z.object({
    username: z.string().min(3).max(30),
    email: z.string().email(),
    password: z.string().min(6),
    c_password: z.string().min(6),
    role: z.enum(['user', 'admin']).optional().default('user'),
    phone: z.string(),
    address: z.object({
        street: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        country: z.string().optional(),
    }).optional(),
    createdAt: z.date().default(new Date()),
    favorites: z.array(z.string()).optional(),
    products: z.array(z.string()).optional(),
}).refine((data) => data.password === data.c_password, {
    message: "Passwords don't match",
});

export default userSchema;
