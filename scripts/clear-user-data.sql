-- SQL script to clear all user enrollments and progress
-- Run with: npx prisma db execute --file scripts/clear-user-data.sql --schema prisma/schema.prisma

-- Delete all progress records
DELETE FROM "Progress";

-- Delete all enrollment records  
DELETE FROM "Enrollment";
