'use client';

/**
 * Barrel file for Firebase functionality.
 * Exports initialization logic, providers, and hooks for easy access.
 */

export { FirebaseClientProvider } from './client-provider';
export * from './provider';
export * from './auth/use-user';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './errors';
export * from './error-emitter';
