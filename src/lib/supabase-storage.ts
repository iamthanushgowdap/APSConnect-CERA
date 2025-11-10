// src/lib/supabase-storage.ts
import { supabase } from './supabase';

export interface UploadedFile {
  name: string;
  size: number;
  type: string;
  url: string;
  uploaded: boolean;
}

export class SupabaseStorage {
  private static readonly BUCKET_NAME = 'chat-attachments';

  /**
   * Upload a file to Supabase storage
   */
  static async uploadFile(file: File, userId: string): Promise<UploadedFile> {
    try {
      console.log(`📤 Uploading file: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);

      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      console.log(`📁 Target filename: ${fileName}`);

      // Upload the file
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('❌ Upload failed:', error);
        console.error('🔍 Full error details:', JSON.stringify(error, null, 2));
        console.error('💡 Common issues:');
        console.error('   - User not authenticated');
        console.error('   - Bucket policies not configured correctly');
        console.error('   - File size too large');
        console.error('   - Network connectivity issues');

        // Check if user is authenticated
        const { data: { user } } = await supabase.auth.getUser();
        console.log('👤 Current user:', user ? `ID: ${user.id}` : 'Not authenticated');

        throw new Error(`File upload failed: ${error.message}`);
      }

      console.log('✅ Upload successful');

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(fileName);

      const result = {
        name: file.name,
        size: file.size,
        type: file.type,
        url: urlData.publicUrl,
        uploaded: true
      };

      console.log('🔗 Public URL generated:', result.url.substring(0, 50) + '...');
      return result;

    } catch (error) {
      console.error('❌ File upload failed completely:', error instanceof Error ? error.message : String(error));
      console.error('🔍 No fallback available - file storage is required');
      throw error;
    }
  }

  /**
   * Upload multiple files
   */
  static async uploadFiles(files: File[], userId: string): Promise<UploadedFile[]> {
    const uploadPromises = files.map(file => this.uploadFile(file, userId));
    return Promise.all(uploadPromises);
  }

  /**
   * Delete a file from storage
   */
  static async deleteFile(fileUrl: string): Promise<void> {
    try {
      // Extract filename from URL
      const urlParts = fileUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];

      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([fileName]);

      if (error) {
        console.error('Delete error:', error);
        throw error;
      }
    } catch (error) {
      console.error('File delete failed:', error);
      throw error;
    }
  }

  /**
   * Initialize storage bucket (check if exists, don't try to create)
   */
  static async initializeBucket(): Promise<void> {
    try {
      console.log('🔍 Checking chat-attachments bucket status...');

      // Check if bucket exists
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();

      if (listError) {
        console.error('❌ Error listing buckets:', listError);
        console.warn('⚠️ Cannot verify bucket status. File uploads may not work.');
        return;
      }

      const bucketExists = buckets.some(bucket => bucket.name === this.BUCKET_NAME);

      if (bucketExists) {
        console.log('✅ Chat attachments bucket exists and is ready');

        // Test bucket access by trying to list objects (this tests read access)
        try {
          const { error: accessError } = await supabase.storage
            .from(this.BUCKET_NAME)
            .list('', { limit: 1 });

          if (accessError) {
            console.error('❌ Bucket read access error:', accessError.message);
            console.warn('⚠️ Bucket exists but read policies may be incorrect');
            console.warn('💡 Check that SELECT policy allows access');
          } else {
            console.log('✅ Bucket read access verified');
          }
        } catch (testError) {
          console.warn('⚠️ Could not test bucket read access:', testError instanceof Error ? testError.message : String(testError));
        }

        // Test bucket write access by trying to upload a tiny test file
        try {
          const testFile = new File(['test'], 'test.txt', { type: 'text/plain' });
          const testFileName = `test-access-${Date.now()}.txt`;

          const { error: writeError } = await supabase.storage
            .from(this.BUCKET_NAME)
            .upload(testFileName, testFile);

          if (writeError) {
            console.error('❌ Bucket write access error:', writeError.message);
            console.warn('⚠️ Bucket exists but write policies may be incorrect');
            console.warn('💡 Check that INSERT policy allows authenticated users');
          } else {
            console.log('✅ Bucket write access verified');

            // Clean up the test file
            await supabase.storage.from(this.BUCKET_NAME).remove([testFileName]);
          }
        } catch (writeTestError) {
          console.warn('⚠️ Could not test bucket write access:', writeTestError instanceof Error ? writeTestError.message : String(writeTestError));
        }

        console.log('🎯 File uploads should work if both read and write access are verified');

      } else {
        console.log('❌ Chat attachments bucket does not exist');
        console.warn('📝 Please create a bucket named "chat-attachments" in your Supabase Storage dashboard');
        console.warn('🔧 Make sure it is set as a PUBLIC bucket');
        console.warn('🔐 Add the required RLS policies for file uploads');
      }
    } catch (error) {
      console.error('❌ Bucket initialization error:', error);
      console.warn('⚠️ Storage may not work properly. Please check Supabase Storage setup.');
    }
  }

  /**
   * Download a file by URL (works for both Supabase and blob URLs)
   */
  static async downloadFile(url: string, filename: string = 'download'): Promise<void> {
    try {
      console.log('⬇️ Starting download for:', url);

      if (url.includes('supabase')) {
        console.log('☁️ Downloading from Supabase storage');

        // Test URL accessibility first
        try {
          const testResponse = await fetch(url, { method: 'HEAD' });
          if (!testResponse.ok) {
            throw new Error(`URL not accessible: ${testResponse.status}`);
          }
        } catch (testError) {
          console.error('❌ URL test failed:', testError);
          throw testError;
        }

        // Fetch and create blob for download
        console.log('📥 Fetching file for download...');
        const response = await fetch(url);
        const blob = await response.blob();

        // Create download link with blob
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        link.style.display = 'none';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up blob URL
        URL.revokeObjectURL(blobUrl);

        console.log('✅ File downloaded successfully');
        console.log(`📥 Download completed: ${filename}`);

      } else if (url.startsWith('blob:')) {
        console.log('💾 Downloading existing blob URL');

        // For existing blob URLs, create download link directly
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        console.log('✅ Blob file download initiated');
        console.log(`📥 Download started: ${filename}`);

      } else {
        console.log('🔗 Opening external URL');
        // For other URLs, open in new tab
        window.open(url, '_blank');
        console.log('✅ External URL opened');
      }
    } catch (error) {
      console.error('❌ Download failed:', error);

      // Fallback: try direct link approach
      console.log('⚠️ Using fallback download method');
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      throw error;
    }
  }
}
