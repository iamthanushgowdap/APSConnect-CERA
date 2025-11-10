"use client";

import { useEffect } from 'react';
import { SupabaseStorage } from '@/lib/supabase-storage';

export function StorageInitializer() {
  useEffect(() => {
    console.log('🚀 Initializing Supabase storage bucket...');
    SupabaseStorage.initializeBucket().catch(error => {
      console.warn('⚠️ Storage initialization failed, but app will continue:', error instanceof Error ? error.message : String(error));
    });
  }, []);

  return null; // This component doesn't render anything
}
