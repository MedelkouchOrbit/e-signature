import { openSignApiService } from "../api-service"
import type { EnhancedUserProfile, GetUserProfileResponse, UpdateUserProfileRequest } from "./user-types"

/**
 * ✅ User API Service using OpenSign function names
 * Modular service for user profile operations
 */
export const userApiService = {
  
  /**
   * Get enhanced user profile with statistics
   */
  async getEnhancedUserProfile(): Promise<EnhancedUserProfile | null> {
    try {
      console.log('👤 Getting enhanced user profile');

      // Get current user info from auth storage
      let currentUserId = null;
      if (typeof window !== 'undefined') {
        try {
          const authData = localStorage.getItem('auth-storage');
          if (authData) {
            const auth = JSON.parse(authData);
            currentUserId = auth.state?.user?.extendedId || auth.state?.user?.id;
          }
        } catch {
          console.warn('Could not get user ID from auth storage');
          return null;
        }
      }

      if (!currentUserId) {
        console.warn('No user ID found in auth storage');
        return null;
      }

      // Get user profile using OpenSign getUserProfile function
      const response = await openSignApiService.post<GetUserProfileResponse>("getUserProfile", {
        userId: currentUserId
      });

      if (response.error) {
        throw new Error(response.error);
      }

      if (!response.result) {
        return null;
      }

      const user = response.result;

      // Enhance profile with statistics by fetching user documents
      const documentsResponse = await openSignApiService.post("getReport", {
        reportId: currentUserId,
        limit: 1000 // Get all documents for stats
      });

      let documentsCreated = 0;
      let documentsWaitingForSignature = 0;
      let documentsSigned = 0;

      if (documentsResponse.result && Array.isArray(documentsResponse.result)) {
        documentsCreated = documentsResponse.result.length;
        
        documentsResponse.result.forEach((doc: any) => {
          if (doc.IsCompleted) {
            documentsSigned++;
          } else if (doc.Status === 'waiting') {
            documentsWaitingForSignature++;
          }
        });
      }

      const profile: EnhancedUserProfile = {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profilePicture: user.profilePicture,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        isEmailVerified: user.isEmailVerified || false,
        extendedId: user.extendedId,
        documentsCreated,
        documentsWaitingForSignature,
        documentsSigned,
        templatesCreated: 0, // TODO: Add templates count when templates API is available
        organizationRole: user.organizationRole,
        subscription: user.subscription
      };

      console.log('✅ Enhanced user profile loaded successfully');
      return profile;

    } catch (error) {
      console.error('❌ Error fetching enhanced user profile:', error);
      throw error;
    }
  },

  /**
   * Update user profile
   */
  async updateUserProfile(updates: UpdateUserProfileRequest): Promise<EnhancedUserProfile> {
    try {
      console.log('👤 Updating user profile');

      const response = await openSignApiService.post<GetUserProfileResponse>("updateUserProfile", updates);

      if (response.error) {
        throw new Error(response.error);
      }

      if (!response.result) {
        throw new Error('No result returned from profile update');
      }

      console.log('✅ User profile updated successfully');
      return response.result;

    } catch (error) {
      console.error('❌ Error updating user profile:', error);
      throw error;
    }
  },

  /**
   * Get basic user profile (lightweight version)
   */
  async getUserProfile(): Promise<EnhancedUserProfile | null> {
    // For now, just return the enhanced profile
    // Can be optimized later if needed
    return this.getEnhancedUserProfile();
  }
};
