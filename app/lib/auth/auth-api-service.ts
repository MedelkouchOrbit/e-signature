import { openSignApiService } from "@/app/lib/api-service"
import type { UserCredentials, UserRegistration, OpenSignLoginResponse, EnhancedSignupResponse, ParseServerResponse } from "./auth-types"

export const authApiService = {
  login: async (credentials: UserCredentials) => {
    // Enhanced login with activation checking
    const loginData = {
      email: credentials.email,
      password: credentials.password
    };
    
    // ✅ FIX: Use callFunction for OpenSign cloud functions
    const response = await openSignApiService.callFunction<OpenSignLoginResponse>("loginuser", loginData);
    
    // Check if user is activated before allowing login
    if (response && response.objectId) {
      // Check activation status
      if (response.activationStatus === 'pending_approval') {
        throw new Error('Your account is pending administrator approval. Please wait for activation.');
      }
      
      if (response.activationStatus === 'rejected') {
        throw new Error('Your account has been rejected. Please contact the administrator.');
      }
      
      if (response.isActive === false) {
        throw new Error('Your account is not active. Please contact the administrator.');
      }
      
      // Store session token if login is successful and user is activated
      if (response.sessionToken) {
        openSignApiService.setSessionToken(response.sessionToken);
        console.log('✅ Login successful, session token stored');
      }
    }
    
    return response;
  },

  signup: async (registrationData: UserRegistration): Promise<EnhancedSignupResponse> => {
    // Enhanced signup with tenant/organization creation and approval workflow
    try {
      // Step 1: Create user with pending status
      const signupResponse = await openSignApiService.callFunction<ParseServerResponse<OpenSignLoginResponse>>("usersignup", {
        userDetails: {
          ...registrationData,
          // Set user as pending approval initially
          isActive: false,
          activationStatus: 'pending_approval',
          activatedBy: null,
          activatedAt: null
        }
      });

      if (signupResponse.error) {
        throw new Error(signupResponse.error);
      }

      const newUser = signupResponse.result!;

      // Step 2: Create organization for the user (if company provided)
      if (registrationData.company) {
        try {
          await openSignApiService.callFunction("createOrganization", {
            organizationName: registrationData.company,
            ownerId: newUser.objectId,
            isActive: false // Organization also pending until user approved
          });
        } catch (orgError) {
          console.warn('Organization creation failed, but user created:', orgError);
        }
      }

      return {
        success: true,
        message: 'Account created successfully. Please wait for administrator approval.',
        user: newUser,
        requiresApproval: true
      };

    } catch (error) {
      console.error('Enhanced signup failed:', error);
      throw error;
    }
  },

  logout: async () => {
    // OpenSign doesn't seem to have a logout function in the collection
    // Clear the session token locally
    openSignApiService.clearSessionToken();
    return { success: true };
  },

  verifySession: async () => {
    // ✅ CORRECTED: Use callFunction for OpenSign cloud functions
    return openSignApiService.callFunction("getUserDetails", {});
  },

  // Additional OpenSign auth functions based on the collection
  sendOTPEmail: async (email: string, tenantId?: string, docId?: string) => {
    // ✅ CORRECTED: Use callFunction for OpenSign cloud functions
    return openSignApiService.callFunction("SendOTPMailV1", {
      email,
      TenantId: tenantId,
      docId: docId
    });
  },

  loginWithOTP: async (email: string, otp: number) => {
    // ✅ CORRECTED: Use callFunction for OpenSign cloud functions
    const response = await openSignApiService.callFunction<ParseServerResponse<OpenSignLoginResponse>>("AuthLoginAsMail", {
      email,
      otp
    });
    
    // Store session token if OTP login is successful
    if (response && response.result && response.result.sessionToken) {
      openSignApiService.setSessionToken(response.result.sessionToken);
    }
    
    return response;
  },

  verifyEmail: async (email: string, otp: number) => {
    // ✅ CORRECTED: Use callFunction for OpenSign cloud functions
    return openSignApiService.callFunction("verifyemail", {
      email,
      otp
    });
  },

  // Admin functions
  addAdmin: async (userDetails: UserRegistration) => {
    // ✅ CORRECTED: Use callFunction for OpenSign cloud functions
    return openSignApiService.callFunction("addadmin", {
      ...userDetails,
      role: 'contracts_Admin'
    });
  },

  checkAdminExists: async () => {
    // ✅ CORRECTED: Use callFunction for OpenSign cloud functions
    return openSignApiService.callFunction("checkadminexist", {});
  },

  updateUserAsAdmin: async (email: string, masterkey: string) => {
    // ✅ CORRECTED: Use callFunction for OpenSign cloud functions
    return openSignApiService.callFunction("updateuserasadmin", {
      email,
      masterkey
    });
  },

  // Enhanced superadmin functions for user approval workflow
  getPendingUsers: async () => {
    // Get all users with pending approval status
    return openSignApiService.callFunction("getPendingUsers", {
      activationStatus: 'pending_approval'
    });
  },

  approveUser: async (userId: string, adminId: string) => {
    // Approve a pending user
    return openSignApiService.callFunction("approveUser", {
      userId,
      adminId,
      activationStatus: 'approved',
      isActive: true,
      activatedAt: new Date().toISOString()
    });
  },

  rejectUser: async (userId: string, adminId: string, reason?: string) => {
    // Reject a pending user
    return openSignApiService.callFunction("rejectUser", {
      userId,
      adminId,
      activationStatus: 'rejected',
      isActive: false,
      rejectionReason: reason,
      rejectedAt: new Date().toISOString()
    });
  },

  getAllUsers: async (limit = 50, skip = 0) => {
    // Get all users for admin management
    return openSignApiService.callFunction("getAllUsers", {
      limit,
      skip
    });
  },

  // Get specific document reports
  getDocumentReport: async (reportId: string, limit = 50, skip = 0, searchTerm = "") => {
    // ✅ CORRECTED: Use callFunction for OpenSign cloud functions
    return openSignApiService.callFunction("getReport", {
      reportId,
      limit,
      skip,
      searchTerm
    });
  },
};
