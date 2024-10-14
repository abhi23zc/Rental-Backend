import { z } from 'zod';

export const productSchema = z.object({
  title: z.string().max(100, "Title must be at most 100 characters long").nonempty("Title is required"),
  description: z.string().max(1000, "Description must be at most 1000 characters long").nonempty("Description is required"),
  price: z.string().nonempty("Price is required"),
  images: z.array(z.object()).optional(),

  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),

  category: z.string().nonempty("Category is required"),
  owner: z.string().optional(),
  rentedBy: z.string().nullable().optional(),
  available: z.boolean().optional(),
  createdAt: z.date().optional(),
});
