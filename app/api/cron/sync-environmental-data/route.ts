import { NextResponse } from "next/server"
import { DataSyncService } from "@/app/lib/data-sync-service"
import { EnvironmentalCalculator } from "@/app/lib/environmental-calculator"

// This API route is designed to be triggered by Vercel Cron Jobs.
// It performs server-side data synchronization with OpenSign API.

export async function GET(request: Request) {
  const startTime = Date.now()
  
  // Validate the cron secret to ensure the request is from Vercel Cron Jobs
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (authHeader !== `Bearer ${cronSecret}`) {
    console.error("❌ Unauthorized cron job request")
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    console.log("🚀 Starting scheduled environmental data sync...")

    // Get the DataSyncService instance
    const syncService = DataSyncService.getInstance()

    // Fetch real usage statistics from OpenSign API
    console.log("📊 Fetching latest usage statistics from OpenSign...")
    const statsResponse = await syncService.getUsageStatistics(false) // Skip cache for cron jobs

    // Process the responses and extract counts
    const documentsCount = statsResponse.documents?.results?.length || 0
    const templatesCount = statsResponse.templates?.results?.length || 0
    const usersCount = statsResponse.users?.results?.length || 0
    const contactsCount = statsResponse.contacts?.results?.length || 0

    console.log("📈 Raw OpenSign statistics:", {
      documents: documentsCount,
      templates: templatesCount,
      users: usersCount,
      contacts: contactsCount
    })

    // Calculate derived metrics
    const documentsData = statsResponse.documents?.results || []

    // Count signed documents (documents with completion indicators)
    const signedDocuments = documentsData.filter((doc) => {
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

    // Calculate environmental impact using real OpenSign data
    const { paperSaved, treesSaved, co2Reduced } = EnvironmentalCalculator.calculateEnvironmentalImpact(
      signedDocuments,
      activeUsers,
      1, // Daily calculation for cron job
    )

    // Build usage data for potential storage/logging
    const usageData = {
      documentsSigned: signedDocuments,
      usersActive: activeUsers,
      totalDocuments: documentsCount,
      totalTemplates: templatesCount,
      totalUsers: usersCount,
      totalContacts: contactsCount,
      timestamp: new Date().toISOString(),
      source: "cron-job"
    }

    // Log the calculated environmental impact
    console.log("🌍 Cron job calculated environmental impact:", {
      paperSaved: `${paperSaved.toFixed(2)} kg`,
      treesSaved: `${treesSaved.toFixed(2)} trees`,
      co2Reduced: `${co2Reduced.toFixed(2)} kg CO2`,
      basedOnDocuments: signedDocuments,
      basedOnUsers: activeUsers
    })

    // In a real application, you might want to:
    // 1. Store these totals in your database
    // 2. Send notifications/reports
    // 3. Update analytics dashboard
    // 4. Trigger other downstream processes
    
    // Example database update (uncomment when you have a database):
    // await db.updateEnvironmentalTotals({ 
    //   paperSaved, 
    //   treesSaved, 
    //   co2Reduced, 
    //   usageData,
    //   calculatedAt: new Date()
    // })

    const processingTime = Date.now() - startTime

    console.log(`✅ Cron job completed successfully in ${processingTime}ms`)

    return NextResponse.json({ 
      success: true, 
      message: "Environmental data sync completed successfully.",
      data: {
        environmentalImpact: { paperSaved, treesSaved, co2Reduced },
        usageData,
        processingTimeMs: processingTime,
        timestamp: new Date().toISOString()
      }
    }, { status: 200 })

  } catch (error: unknown) {
    const processingTime = Date.now() - startTime
    console.error("💥 Cron job failed:", error)
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    
    // Enhanced error logging for debugging
    console.error("🔍 Cron job error details:", {
      error: errorMessage,
      processingTimeMs: processingTime,
      timestamp: new Date().toISOString(),
      stack: error instanceof Error ? error.stack : undefined
    })

    return NextResponse.json({ 
      success: false, 
      message: "Environmental data sync failed.",
      error: errorMessage,
      processingTimeMs: processingTime,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
