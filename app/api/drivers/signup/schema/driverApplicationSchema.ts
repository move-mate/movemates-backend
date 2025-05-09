import { z } from 'zod';


// Schema for driver application validation
export const driverApplicationSchema = z.object({
  // Driver qualification info
  licenseNumber: z.string().min(5, "License number must be valid"),
  licenseExpiryDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "License expiry date must be valid"
  }),
  licenseIssuingCountry: z.string().min(2, "Country name must be valid"),
  licenseClass: z.string(),
  yearsOfExperience: z.number().int().min(0),
  
  // Vehicle information
  vehicle: z.object({
    make: z.string().min(2, "Make must be valid"),
    model: z.string().min(1, "Model must be valid"),
    year: z.number().int().min(1990).max(new Date().getFullYear() + 1),
    type: z.enum(['small', 'medium', 'large']),
    color: z.string().min(2, "Color must be valid"),
    plateNumber: z.string().min(2, "Plate number must be valid"),
    
    // Insurance information
    insuranceProvider: z.string().min(2, "Insurance provider must be valid"),
    insurancePolicyNumber: z.string().min(4, "Policy number must be valid"),
    insuranceExpiryDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Insurance expiry date must be valid"
    }),
  }),
  
  // Bank account information
  bankAccount: z.object({
    accountHolderName: z.string().min(2, "Account holder name must be valid"),
    accountNumber: z.string().min(5, "Account number must be valid"),
    bankName: z.string().min(2, "Bank name must be valid"),
    branchCode: z.string().optional(),
    routingNumber: z.string().optional(),
    accountType: z.string(),
  }),
  
  // Service areas
  serviceAreas: z.array(
    z.object({
      city: z.string().min(2, "City must be valid"),
      region: z.string().optional(),
      country: z.string().min(2, "Country must be valid"),
    })
  ).min(1, "At least one service area is required"),
  
  // Operational parameters
  availabilitySchedule: z.record(z.array(z.string())).optional(),
  languages: z.array(z.string()).min(1, "At least one language is required"),
  additionalServices: z.array(z.string()).optional(),
});