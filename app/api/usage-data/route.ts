import { NextResponse } from "next/server"
import type { UsageData } from "@/app/lib/environmental-calculator"
import { DataSyncService } from "@/app/lib/data-sync-service"

// This API route fetches real-time usage data from OpenSign API
export async function GET() {
  const startTime = Date.now()
  
  try {
    console.log("🚀 Starting usage data fetch from OpenSign API...")
    
    let usageData: UsageData

    try {
      // Fetch real data from OpenSign API using the data sync service
      console.log("📊 Fetching statistics from OpenSign...")
      const dataSyncService = DataSyncService.getInstance();
      const statsResponse = await dataSyncService.getUsageStatistics();

      // Process the responses and extract counts
      const documentsCount = statsResponse.documents?.results?.length || 0;
      const templatesCount = statsResponse.templates?.results?.length || 0;
      const usersCount = statsResponse.users?.results?.length || 0;
      const contactsCount = statsResponse.contacts?.results?.length || 0;

      console.log("📈 Raw OpenSign statistics:", {
        documents: documentsCount,
        templates: templatesCount,
        users: usersCount,
        contacts: contactsCount
      });

      // Calculate derived metrics
      const documentsData = statsResponse.documents?.results || [];

      // Count signed documents (documents with completion indicators)
      const signedDocuments = documentsData.filter((doc: { [key: string]: unknown }) => {
        const IsCompleted = doc.IsCompleted as boolean | undefined
        const Status = doc.Status as string | undefined
        const Signers = doc.Signers as Array<{ isSigned?: boolean }> | undefined
        
        return IsCompleted === true || 
               Status === 'completed' || 
               Status === 'signed' ||
               Signers?.some((signer) => signer.isSigned)
      }).length

      // Calculate active users (users with recent activity)
      const activeUsers = Math.min(usersCount, Math.max(1, Math.floor(usersCount * 0.7))) // Assume 70% are active

      // Estimate energy consumption based on document activity (0.05 kWh per document processed)
      const currentEnergyConsumption = Number.parseFloat((documentsCount * 0.05).toFixed(2))

      // Calculate average sheets per document (realistic estimate)
      const avgSheetsPerDoc = documentsCount > 0 ? Math.max(1, Math.floor(2.5)) : 1 // Average 2.5 sheets per document

      // Build comprehensive usage data from real OpenSign metrics
      usageData = {
        documentsSigned: signedDocuments,
        usersActive: activeUsers,
        currentEnergyConsumption,
        signRequests: documentsCount,
        sheetsPerDocument: avgSheetsPerDoc,
        contactsToSign: contactsCount,
        contactsInCopy: Math.floor(contactsCount * 0.2), // Estimate 20% are in copy
        timestamp: new Date().toISOString(),
        period: "real-time",
        // Additional OpenSign specific metrics
        totalTemplates: templatesCount,
        totalUsers: usersCount,
        totalContacts: contactsCount,
      }

      const processingTime = Date.now() - startTime;
      
      console.log("✅ Successfully fetched real usage data from OpenSign API", {
        processingTimeMs: processingTime,
        metrics: {
          totalDocuments: documentsCount,
          signedDocuments: signedDocuments,
          activeUsers: activeUsers,
          templates: templatesCount,
          contacts: contactsCount,
          energyConsumption: currentEnergyConsumption
        }
      });

    } catch (openSignError) {
      console.error("❌ Error fetching data from OpenSign API:", openSignError)
      
      // Enhanced error handling with specific error types
      if (openSignError instanceof Error) {
        const errorMsg = openSignError.message.toLowerCase();
        
        if (errorMsg.includes('401') || errorMsg.includes('unauthorized')) {
          console.warn("🔐 Authentication failed - session may have expired");
          return NextResponse.json({ 
            message: "Authentication failed. Please log in again to access OpenSign data.",
            error: "AUTHENTICATION_ERROR",
            action: "REDIRECT_TO_LOGIN"
          }, { status: 401 })
        }
        
        if (errorMsg.includes('403') || errorMsg.includes('forbidden')) {
          console.warn("🚫 Access denied - insufficient permissions");
          return NextResponse.json({ 
            message: "Access denied. Your account doesn't have permission to access OpenSign data.",
            error: "PERMISSION_ERROR",
            action: "CONTACT_ADMIN"
          }, { status: 403 })
        }

        if (errorMsg.includes('404')) {
          console.warn("🔍 API endpoints not found");
          return NextResponse.json({ 
            message: "OpenSign API endpoints not found. The service may be temporarily unavailable.",
            error: "API_NOT_FOUND",
            action: "RETRY_LATER"
          }, { status: 404 })
        }

        if (errorMsg.includes('500') || errorMsg.includes('internal server error')) {
          console.warn("🔥 OpenSign server error");
          return NextResponse.json({ 
            message: "OpenSign server is experiencing issues. Please try again in a few minutes.",
            error: "SERVER_ERROR",
            action: "RETRY_LATER"
          }, { status: 502 })
        }

        if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
          console.warn("🌐 Network connectivity issue");
          return NextResponse.json({ 
            message: "Network error connecting to OpenSign. Please check your connection.",
            error: "NETWORK_ERROR",
            action: "CHECK_CONNECTION"
          }, { status: 503 })
        }
      }

      // Fallback to mock data for development/demo purposes
      console.log("🔄 Falling back to demo data due to OpenSign API error");
      
      const mockSignedDocs = Math.floor(Math.random() * 500) + 100;
      const mockActiveUsers = Math.floor(Math.random() * 50) + 10;
      
      usageData = {
        documentsSigned: mockSignedDocs,
        usersActive: mockActiveUsers,
        currentEnergyConsumption: Number.parseFloat((mockSignedDocs * 0.05).toFixed(2)),
        signRequests: Math.floor(mockSignedDocs * 1.5),
        sheetsPerDocument: 3,
        contactsToSign: Math.floor(mockActiveUsers * 2),
        contactsInCopy: Math.floor(mockActiveUsers * 0.5),
        timestamp: new Date().toISOString(),
        period: "demo-fallback",
        error: "OPENSIGN_API_ERROR",
        errorMessage: "Unable to connect to OpenSign API. Showing demo data for development.",
        totalTemplates: Math.floor(Math.random() * 20) + 5,
        totalUsers: mockActiveUsers + Math.floor(Math.random() * 10),
        totalContacts: Math.floor(mockActiveUsers * 3),
      }
    }

    const totalProcessingTime = Date.now() - startTime;
    
    return NextResponse.json({
      ...usageData,
      meta: {
        processingTimeMs: totalProcessingTime,
        source: usageData.error ? "fallback" : "opensign",
        timestamp: new Date().toISOString()
      }
    }, { status: 200 })
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error("💥 Critical error in usage-data API:", error)
    
    return NextResponse.json({ 
      message: "Critical system error occurred while fetching usage data.",
      error: "CRITICAL_ERROR",
      details: error instanceof Error ? error.message : "Unknown error",
      meta: {
        processingTimeMs: processingTime,
        timestamp: new Date().toISOString()
      }
    }, { status: 500 })
  }
}

// This API route simulates updating usage data in the backend.
// This might be used if you have a system that pushes usage data to your Next.js backend.
export async function POST(request: Request) {
  try {
    const { paper, trees, co2 } = await request.json()

    // In a real application, you would save this data to your database
    console.log("Received environmental data for backend update:", { paper, trees, co2 })

    // Simulate saving to DB
    await new Promise((resolve) => setTimeout(resolve, 300))

    return NextResponse.json({ message: "Environmental data updated successfully." }, { status: 200 })
  } catch (error) {
    console.error("Error updating environmental data in backend:", error)
    return NextResponse.json({ message: "Failed to update environmental data." }, { status: 500 })
  }
}
