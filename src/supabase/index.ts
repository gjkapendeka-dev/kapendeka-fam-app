export * from './provider';
export * from './client';
export * from './auth/use-user';
export * from './database/use-collection';
export * from './database/use-doc';

// Alias: some pages imported useAuth — re-export useUser under that name
export { useUser as useAuth } from './auth/use-user';
