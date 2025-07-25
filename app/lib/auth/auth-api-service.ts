import { openSignApiService } from "@/app/lib/api-service"
import type { UserCredentials, UserRegistration, OpenSignLoginResponse } from "./auth-types"

export const authApiService = {
  login: async (credentials: UserCredentials) => {
    const response = await openSignApiService.post<OpenSignLoginResponse>("functions/loginuser", credentials);
    
    // Store session token if login is successful
    if (response && response.result && response.result.sessionToken) {
      openSignApiService.setSessionToken(response.result.sessionToken);
    }
    
    return response;
  },

  signup: async (registrationData: UserRegistration) => {
    return openSignApiService.post("functions/usersignup", {
      userDetails: registrationData
    });
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
    const response = await openSignApiService.post<OpenSignLoginResponse>("functions/AuthLoginAsMail", {
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
      userDetails
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
