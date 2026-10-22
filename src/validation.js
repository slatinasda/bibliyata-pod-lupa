const { z } = require('zod');

const HELP_OPTIONS = ['greet', 'food', 'tech', 'video', 'social', 'setup'];

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const hasPhone = (v) => v.replace(/\D/g, '').length >= 8;

// Формата има едно поле „Телефон или имейл“ (по желание): сървърът решава кое е кое.
// Празно е позволено; каквото е въведено, трябва да е валиден имейл или телефон.
const registerSchema = z.object({
  episodeId: z.coerce.number().int().min(1).max(99),
  name: z.string().trim().min(1, 'Напиши как да те наричаме.').max(100),
  contact: z
    .string()
    .trim()
    .max(120)
    .optional()
    .default('')
    .refine((v) => v === '' || isEmail(v) || hasPhone(v), 'Въведи телефон (поне 8 цифри) или имейл с @.'),
  invitedBy: z.string().trim().max(100).optional().default(''),
  firstTime: z.coerce.boolean().optional().default(false),
  help: z.array(z.enum(HELP_OPTIONS)).max(HELP_OPTIONS.length).optional().default([]),
});

const contactSchema = z.object({
  name: z.string().trim().min(1, 'Напиши името си.').max(100),
  email: z.string().trim().max(120).refine(isEmail, 'Провери имейла, липсва @.'),
  message: z.string().trim().min(1, 'Напиши съобщение.').max(5000),
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

const REGISTRATION_STATUSES = ['new', 'contacted', 'attended', 'cancelled'];
const CONTACT_STATUSES = ['new', 'contacted', 'closed'];

module.exports = {
  registerSchema,
  contactSchema,
  loginSchema,
  isEmail,
  HELP_OPTIONS,
  REGISTRATION_STATUSES,
  CONTACT_STATUSES,
};
