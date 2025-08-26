// Test script for templates API endpoints
import { templatesApiService } from './templates-api-service.js'

async function testTemplatesAPI() {
  console.log('🧪 Testing Templates API Endpoints...\n')

  try {
    // Test 1: Get all templates
    console.log('📋 Test 1: Getting all templates...')
    const templatesResponse = await templatesApiService.getTemplates()
    console.log(`✅ Success: Found ${templatesResponse.results.length} templates`)
    console.log(`📊 Total count: ${templatesResponse.count}`)
    
    if (templatesResponse.results.length > 0) {
      const firstTemplate = templatesResponse.results[0]
      console.log(`📄 First template: ${firstTemplate.name}`)
      
      // Test 2: Get single template
      console.log('\n🔍 Test 2: Getting single template...')
      const singleTemplate = await templatesApiService.getTemplate(firstTemplate.id)
      console.log(`✅ Success: Retrieved template "${singleTemplate.name}"`)
      console.log(`👥 Signers: ${singleTemplate.signers.length}`)
      console.log(`📝 Fields: ${singleTemplate.fields.length}`)
      
      // Test 3: Duplicate template
      console.log('\n📋 Test 3: Duplicating template...')
      const duplicatedTemplate = await templatesApiService.duplicateTemplate(
        firstTemplate.id,
        `${firstTemplate.name} (Test Copy)`
      )
      console.log(`✅ Success: Created duplicate "${duplicatedTemplate.name}"`)
      
      // Test 4: Delete the duplicated template
      console.log('\n🗑️ Test 4: Deleting test template...')
      await templatesApiService.deleteTemplate(duplicatedTemplate.id)
      console.log('✅ Success: Template deleted')
    }
    
    console.log('\n🎉 All tests passed!')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error('Full error:', error)
  }
}

// Export for use in browser console or other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testTemplatesAPI }
} else if (typeof window !== 'undefined') {
  window.testTemplatesAPI = testTemplatesAPI
}

// Auto-run if this is a direct execution
testTemplatesAPI()
