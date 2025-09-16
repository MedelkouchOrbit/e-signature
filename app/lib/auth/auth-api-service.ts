import { openSignApiService } from "@/app/lib/api-service"
import type { UserCredentials, UserRegistration, OpenSignLoginResponse } from "./auth-types"
import type { EnhancedSignupResponse, ParseServerResponse } from "../../../global.d"

export const authApiService = {
  login: async (credentials: UserCredentials) => {
    // Use standard Parse login endpoint instead of custom loginuser function
    const loginData = {
      username: credentials.email, // Parse uses username field
      password: credentials.password
    };
    
    const response = await openSignApiService.post<OpenSignLoginResponse>("login", loginData);
    
    // Store session token if login is successful
    if (response && response.sessionToken) {
      openSignApiService.setSessionToken(response.sessionToken);
      console.log('✅ Login successful, session token stored');
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
      }, { excludeSessionToken: true }); // Don't send session token for signup

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
    // Using getUserDetails function to verify current session
    return openSignApiService.post("functions/getUserDetails", {});
  },

  // Additional OpenSign auth functions based on the collection
  sendOTPEmail: async (email: string, tenantId?: string, docId?: string) => {
    return openSignApiService.post("functions/SendOTPMailV1", {
      email,
      TenantId: tenantId,
      docId: docId
    });
  },

  loginWithOTP: async (email: string, otp: number) => {
    const response = await openSignApiService.post<ParseServerResponse<OpenSignLoginResponse>>("functions/AuthLoginAsMail", {
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
    return openSignApiService.post("functions/verifyemail", {
      email,
      otp
    });
  },

  // Admin functions
  addAdmin: async (userDetails: UserRegistration) => {
    return openSignApiService.post("functions/addadmin", {
      ...userDetails,
      role: 'contracts_Admin'
    });
  },

  checkAdminExists: async () => {
    return openSignApiService.post("functions/checkadminexist", {});
  },

  updateUserAsAdmin: async (email: string, masterkey: string) => {
    return openSignApiService.post("functions/updateuserasadmin", {
      email,
      masterkey
    });
  },

  // Get specific document reports
  getDocumentReport: async (reportId: string, limit = 50, skip = 0, searchTerm = "") => {
    return openSignApiService.post("functions/getReport", {
      reportId,
      limit,
      skip,
      searchTerm
    });
  },
};
