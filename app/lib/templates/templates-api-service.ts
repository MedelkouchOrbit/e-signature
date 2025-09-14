import { openSignApiService } from "../api-service"

/**
 * ✅ CORRECTED: Templates API Service using OpenSign function names
 * Based on OpenSign backend analysis: getTemplate, GetTemplate, saveastemplate
 */
export const templatesApiService = {
  
  /**
   * Get templates using OpenSign's GetTemplate function
   * ✅ CORRECTED: Remove /functions/ prefix, use direct function name
   */
  async getTemplates(params: { limit?: number; skip?: number; searchTerm?: string } = {}) {
    try {
      const { limit = 10, skip = 0, searchTerm = '' } = params;

      console.log('📄 Getting templates via OpenSign GetTemplate function');

      // ✅ CORRECTED: Use direct function name without /functions/ prefix
      const response = await openSignApiService.post<{
        result?: any[]
        error?: string
      }>("GetTemplate", { 
        limit,
        skip,
        searchTerm 
      });

      if (response.error) {
        throw new Error(response.error);
      }

      return response.result || [];

    } catch (error) {
      console.error('❌ Error fetching templates:', error);
      throw error;
    }
  },

  /**
   * Get single template using OpenSign's getTemplate function (lowercase)
   * ✅ CORRECTED: Remove /functions/ prefix, use direct function name
   */
  async getTemplate(templateId: string) {
    try {
      console.log('📄 Getting single template via OpenSign getTemplate function');

      // ✅ CORRECTED: Use direct function name without /functions/ prefix
      const response = await openSignApiService.post<{
        result?: any
        error?: string
      }>("getTemplate", { templateId });

      if (response.error) {
        throw new Error(response.error);
      }

      return response.result;

    } catch (error) {
      console.error('❌ Error fetching template:', error);
      throw error;
    }
  },

  /**
   * Save template using OpenSign's saveastemplate function
   * ✅ CORRECTED: Remove /functions/ prefix, use direct function name
   */
  async saveAsTemplate(documentId: string, templateData: { name: string; description?: string }) {
    try {
      console.log('📄 Saving document as template via OpenSign saveastemplate function');

      // ✅ CORRECTED: Use direct function name without /functions/ prefix
      const response = await openSignApiService.post("saveastemplate", {
        docId: documentId,
        templateName: templateData.name,
        description: templateData.description
      });

      return response;

    } catch (error) {
      console.error('❌ Error saving as template:', error);
      throw error;
    }
  },

  /**
   * Create template using Parse classes directly
   * Since OpenSign doesn't expose a createTemplate function
   */
  async createTemplate(templateData: {
    name: string;
    description?: string;
    url?: string;
    fields?: any[];
  }) {
    try {
      console.log('📄 Creating template via Parse classes');

      const response = await openSignApiService.post("classes/contracts_Template", {
        Name: templateData.name,
        Description: templateData.description,
        URL: templateData.url,
        Placeholders: templateData.fields || []
      });

      return response;

    } catch (error) {
      console.error('❌ Error creating template:', error);
      throw error;
    }
  },

  /**
   * Delete template using Parse classes
   */
  async deleteTemplate(templateId: string): Promise<void> {
    try {
      console.log('📄 Deleting template via Parse classes');

      await openSignApiService.delete(`classes/contracts_Template/${templateId}`);

    } catch (error) {
      console.error('❌ Error deleting template:', error);
      throw error;
    }
  },

  /**
   * Update template using Parse classes
   */
  async updateTemplate(templateId: string, updateData: {
    name?: string;
    description?: string;
    fields?: any[];
  }) {
    try {
      console.log('📄 Updating template via Parse classes');

      const response = await openSignApiService.put(`classes/contracts_Template/${templateId}`, {
        ...(updateData.name && { Name: updateData.name }),
        ...(updateData.description && { Description: updateData.description }),
        ...(updateData.fields && { Placeholders: updateData.fields })
      });

      return response;

    } catch (error) {
      console.error('❌ Error updating template:', error);
      throw error;
    }
  }
};
