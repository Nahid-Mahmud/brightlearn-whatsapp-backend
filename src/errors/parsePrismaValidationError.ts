// This function parses Prisma validation errors - keeping for compatibility
// with your friend's pattern, though it might not be needed for our current setup
const parsePrismaValidationError = (error: Error) => {
  // This would contain logic to parse specific Prisma validation errors
  // For now, returning the error as-is
  return error;
};

export default parsePrismaValidationError;
