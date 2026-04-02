
'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

/**
 * Global component that listens for Firestore Permission Errors and displays them.
 * In a development environment, these are thrown to the Next.js overlay.
 */
export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = errorEmitter.on('permission-error', (error: FirestorePermissionError) => {
      // In development, we want to see the rich contextual error overlay
      if (process.env.NODE_ENV === 'development') {
        throw error;
      }

      // In production, we show a friendly toast
      toast({
        variant: 'destructive',
        title: 'Access Denied',
        description: `You don't have permission to perform this action (${error.context.operation} on ${error.context.path}).`,
      });
    });

    return () => unsubscribe();
  }, [toast]);

  return null;
}
