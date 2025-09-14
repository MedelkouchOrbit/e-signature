import { openSignApiService } from "../api-service"
import type {
  Signer,
  Contact,
  CreateContactRequest,
  EditContactRequest,
  BatchContactRequest,
  GetSignersResponse,
  GetContactResponse,
  SaveContactResponse,
  BatchContactResponse,
  ContactBookResponse
} from "./contacts-types"

/**
 * ✅ CORRECTED: Contacts API Service using OpenSign function names
 * Based on OpenSign backend analysis: getsigners, savecontact, getcontact, editcontact
 */
export const contactsApiService = {
  
  /**
   * Get contacts/signers using OpenSign's getsigners function
   * ✅ CORRECTED: Remove /functions/ prefix, use direct function name
   */
  async getSigners(searchTerm: string = '') {
    try {
      console.log('👥 Getting signers via OpenSign getsigners function');

      // ✅ CORRECTED: Use direct function name without /functions/ prefix
      const response = await openSignApiService.post<GetSignersResponse>("getsigners", { 
        search: searchTerm 
      });

      if (response.error) {
        throw new Error(response.error);
      }

      return response.result || [];

    } catch (error) {
      console.error('❌ Error fetching signers:', error);
      throw error;
    }
  },

  /**
   * Get single contact using OpenSign's getcontact function
   * ✅ CORRECTED: Remove /functions/ prefix, use direct function name
   */
  async getContact(contactId: string) {
    try {
      console.log('👥 Getting contact via OpenSign getcontact function');

      // ✅ CORRECTED: Use direct function name without /functions/ prefix
      const response = await openSignApiService.post<GetContactResponse>("getcontact", { contactId });

      if (response.error) {
        throw new Error(response.error);
      }

      return response.result;

    } catch (error) {
      console.error('❌ Error fetching contact:', error);
      throw error;
    }
  },

  /**
   * Save contact using OpenSign's savecontact function
   * ✅ CORRECTED: Remove /functions/ prefix, use direct function name
   */
  async saveContact(contactData: CreateContactRequest) {
    try {
      console.log('👥 Saving contact via OpenSign savecontact function');

      // ✅ CORRECTED: Use direct function name without /functions/ prefix
      const response = await openSignApiService.post<SaveContactResponse>("savecontact", {
        Name: contactData.name,
        Email: contactData.email,
        Phone: contactData.phone,
        Company: contactData.company
      });

      return response;

    } catch (error) {
      console.error('❌ Error saving contact:', error);
      throw error;
    }
  },

  /**
   * Edit contact using OpenSign's editcontact function
   * ✅ CORRECTED: Remove /functions/ prefix, use direct function name
   */
  async editContact(contactId: string, contactData: EditContactRequest) {
    try {
      console.log('👥 Editing contact via OpenSign editcontact function');

      // ✅ CORRECTED: Use direct function name without /functions/ prefix
      const response = await openSignApiService.post("editcontact", {
        contactId,
        ...(contactData.name && { Name: contactData.name }),
        ...(contactData.email && { Email: contactData.email }),
        ...(contactData.phone && { Phone: contactData.phone }),
        ...(contactData.company && { Company: contactData.company })
      });

      return response;

    } catch (error) {
      console.error('❌ Error editing contact:', error);
      throw error;
    }
  },

  /**
   * Delete contact using Parse classes
   */
  async deleteContact(contactId: string): Promise<void> {
    try {
      console.log('👥 Deleting contact via Parse classes');

      await openSignApiService.delete(`classes/contracts_Contactbook/${contactId}`);

    } catch (error) {
      console.error('❌ Error deleting contact:', error);
      throw error;
    }
  },

  /**
   * Check if user is in contact book using OpenSign's isuserincontactbook function
   * ✅ CORRECTED: Remove /functions/ prefix, use direct function name
   */
  async isUserInContactBook(email: string): Promise<ContactBookResponse> {
    try {
      console.log('👥 Checking if user in contact book via OpenSign isuserincontactbook function');

      // ✅ CORRECTED: Use direct function name without /functions/ prefix
      const response = await openSignApiService.post<ContactBookResponse>("isuserincontactbook", { 
        email 
      });

      return response;

    } catch (error) {
      console.error('❌ Error checking user in contact book:', error);
      throw error;
    }
  },

  /**
   * Create batch contacts using OpenSign's createbatchcontact function
   * ✅ CORRECTED: Remove /functions/ prefix, use direct function name
   */
  async createBatchContacts(contacts: CreateContactRequest[]): Promise<BatchContactResponse> {
    try {
      console.log('👥 Creating batch contacts via OpenSign createbatchcontact function');

      // ✅ CORRECTED: Use direct function name without /functions/ prefix
      const response = await openSignApiService.post<BatchContactResponse>("createbatchcontact", {
        contacts: contacts.map(contact => ({
          Name: contact.name,
          Email: contact.email,
          Phone: contact.phone,
          Company: contact.company
        }))
      });

      return response;

    } catch (error) {
      console.error('❌ Error creating batch contacts:', error);
      throw error;
    }
  }
};
