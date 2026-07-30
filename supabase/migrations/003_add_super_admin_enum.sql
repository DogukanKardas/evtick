-- Step 1: Add super_admin enum value
-- IMPORTANT: Run this file ALONE first, then run 004_system_admin.sql
-- PostgreSQL requires enum values to be committed before use.

ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'super_admin';
