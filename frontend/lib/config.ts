// temp change to trigger rebuild
console.log("Vercel rebuild test"+process.env.NEXT_PUBLIC_API_BASE_URL);
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
