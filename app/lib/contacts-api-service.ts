import { openSignApiService } from "./api-service";

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  isDisabled?: boolean;
}

export interface OpenSignUser {
  objectId: string;
  Name: string;
  Email: string;
  Phone?: string;
  UserRole?: string;
  Company?: string;
  JobTitle?: string;
  IsDisabled?: boolean;
  TeamIds?: Array<{
    objectId: string;
    Name: string;
    IsActive: boolean;
  }>;
  TenantId?: {
    objectId: string;
    Name: string;
    UserId: Array<{
      objectId: string;
      Name: string;
      Email: string;
    }>;
  };
}

class ContactsApiService {
  /**
   * Get all contacts/users from the organization
   */
  async getContacts(): Promise<Contact[]> {
    try {
      console.log("📋 Fetching contacts from OpenSign...");

      const getSessionToken = (): string => {
        if (typeof window === "undefined") return "";
        return (
          localStorage.getItem("accesstoken") ||
          localStorage.getItem("opensign_session_token") ||
          ""
        );
      };

      const sessionToken = getSessionToken();

      // Get current user's organization ID from localStorage
      const userInfo = localStorage.getItem("opensign_user");
      if (!userInfo) {
        console.log("👤 No user info found in localStorage");
        return [];
      }

      const user = JSON.parse(userInfo);
      const organizationId = user?.TenantId?.objectId;

      if (!organizationId) {
        console.log(
          "🏢 No organization ID found, user is not part of an organization"
        );
        return [];
      }

      // Get team members by organization using existing OpenSign function
      const response = (await fetch(
        `http://94.249.71.89:9000/api/app/functions/getuserlistbyorg`,
        {
          method: "POST",
          headers: {
            "Content-Type": "text/plain",
          },
          body: JSON.stringify({
            organizationId: organizationId,
            _ApplicationId: "opensign",
            _ClientVersion: "js6.1.1",
            _InstallationId: "ef44e42e-e0a3-44a0-a359-90c26af8ffac",
            _SessionToken: sessionToken,
          }),
        }
      )).json() as {
        result?: OpenSignUser[] | null  // API returns null if no users
        error?: string
      };

      if (response.error) {
        console.warn(`⚠️ Contacts API returned error: ${response.error}`);
        return [];
      }

      const users = response.result || [];
      console.log(`📋 Successfully fetched ${users.length} contacts`);

      // Transform OpenSign users to Contact format
      const contacts: Contact[] = users
        .filter((user) => !user.IsDisabled && user.Email) // Filter out disabled users and users without email
        .map((user) => ({
          id: user.objectId,
          name: user.Name || "Unknown User",
          email: user.Email,
          phone: user.Phone,
          company: user.Company,
          jobTitle: user.JobTitle,
          isDisabled: user.IsDisabled || false,
        }));

      return contacts;
    } catch (error) {
      console.error("❌ Error fetching contacts:", error);
      return [];
    }
  }

  /**
   * Create a new contact/user in OpenSign
   */
  async createContact(contactData: {
    name: string;
    email: string;
    phone?: string;
    company?: string;
    jobTitle?: string;
  }): Promise<Contact | null> {
    try {
      console.log("➕ Creating new contact in OpenSign...", contactData);

      // Get current user and organization info for creating the contact
      const userInfo = localStorage.getItem("opensign_user");
      if (!userInfo) {
        throw new Error("User not authenticated");
      }

      const user = JSON.parse(userInfo);
      const organizationId = user?.TenantId?.objectId;
      const organizationCompany = user?.TenantId?.Name;

      if (!organizationId) {
        throw new Error("No organization found for current user");
      }

      // Use OpenSign's adduser function with required parameters
      const response = (await openSignApiService.post("functions/adduser", {
        name: contactData.name,
        email: contactData.email.toLowerCase(),
        phone: contactData.phone || "",
        password: "TempPass123!", // Temporary password - user will need to set their own
        organization: {
          objectId: organizationId,
          company:
            contactData.company || organizationCompany || "Unknown Company",
        },
        team: null, // No specific team for now
        tenantId: organizationId,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        role: "User", // Default role
      })) as {
        result?: {
          objectId: string;
          Name: string;
          Email: string;
          Phone?: string;
          Company?: string;
          JobTitle?: string;
        };
        error?: string;
      };

      if (response.error) {
        console.warn(`⚠️ Create contact API returned error: ${response.error}`);
        throw new Error(response.error);
      }

      if (!response.result) {
        throw new Error("No result returned from create contact API");
      }

      const newUser = response.result;
      console.log("✅ Successfully created contact:", newUser.objectId);

      // Transform to Contact format
      const contact: Contact = {
        id: newUser.objectId,
        name: newUser.Name || contactData.name,
        email: newUser.Email || contactData.email,
        phone: newUser.Phone || contactData.phone,
        company: newUser.Company || contactData.company,
        jobTitle: newUser.JobTitle || contactData.jobTitle,
        isDisabled: false,
      };

      return contact;
    } catch (error) {
      console.error("❌ Error creating contact:", error);
      throw error;
    }
  }

  /**
   * Search contacts by name, email, or company
   */
  async searchContacts(query: string): Promise<Contact[]> {
    try {
      // Get all contacts first, then filter locally
      // In a real implementation, you might want to add server-side search
      const allContacts = await this.getContacts();

      if (!query.trim()) {
        return allContacts;
      }

      const searchTerm = query.toLowerCase();
      return allContacts.filter(
        (contact) =>
          contact.name.toLowerCase().includes(searchTerm) ||
          contact.email.toLowerCase().includes(searchTerm) ||
          (contact.company &&
            contact.company.toLowerCase().includes(searchTerm)) ||
          (contact.jobTitle &&
            contact.jobTitle.toLowerCase().includes(searchTerm))
      );
    } catch (error) {
      console.error("❌ Error searching contacts:", error);
      return [];
    }
  }
}

export const contactsApiService = new ContactsApiService();
