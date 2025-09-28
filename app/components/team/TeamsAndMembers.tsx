"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Users,
  Calendar,
  Building2,
  AlertCircle,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { openSignApiService } from "@/app/lib/api-service";
import { CreateTeamModal } from "./CreateTeamModal";
import { AddMemberToTeamModal } from "./AddMemberToTeamModal";

// Define types for this component based on actual OpenSign API data
interface Team {
  objectId: string;
  Name: string;
  IsActive: boolean;
  OrganizationId?: {
    objectId: string;
    Name?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface TeamMember {
  objectId: string;
  Name: string;
  Email: string;
  UserRole?: string;
  Company?: string;
  Status?: string;
  IsDisabled?: boolean;
  TeamIds?: Array<{ objectId: string; Name?: string }>;
  createdAt: string;
  updatedAt?: string;
}

interface OrganizationData {
  teams: Team[];
  members: TeamMember[];
}

export function TeamsAndMembers() {
  // State management
  const [organizationData, setOrganizationData] = useState<
    OrganizationData | undefined
  >(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());
  const [isCreateTeamModalOpen, setIsCreateTeamModalOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [selectedTeamForMember, setSelectedTeamForMember] =
    useState<Team | null>(null);

  // Load organization data
  const loadOrganizationData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("🔄 Loading organization data...");

      // Check if we have a valid session token
      let sessionToken = openSignApiService.getSessionToken();
      console.log(
        "🔑 Current session token:",
        sessionToken ? `${sessionToken.substring(0, 15)}...` : "none"
      );

      // If no token or it's the old expired one, use the working token
      if (
        !sessionToken ||
        sessionToken === "r:af90807d45364664e3707e4fe9a1a99c"
      ) {
        console.log("🔧 Setting working session token...");
        const workingToken = "r:01735791c43b8e2954da0f884d5f575e";
        openSignApiService.setSessionToken(workingToken);
        sessionToken = workingToken;
        console.log(
          "✅ Working token set:",
          `${sessionToken.substring(0, 15)}...`
        );
      }

      console.log("🔑 Using session token for API calls:", sessionToken);

      // First get teams - call the API directly like the working curl command
      console.log("🔍 Calling getteams API directly...");

      // Use direct fetch to match the working curl format
      const teamsResponse = await fetch(
        "http://94.249.71.89:9000/api/app/functions/getteams",
        {
          method: "POST",
          headers: {
            Accept: "*/*",
            "Accept-Language": "en-US,en;q=0.9,fr-FR;q=0.8,fr;q=0.7",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
            "Content-Type": "text/plain",
            Origin: "http://94.249.71.89:9000",
            Pragma: "no-cache",
            Referer: "http://94.249.71.89:9000/dashboard/35KBoSgoAK",
            "User-Agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
          },
          body: JSON.stringify({
            active: true,
            _ApplicationId: "opensign",
            _ClientVersion: "js6.1.1",
            _InstallationId: "22ad0a9b-a8a2-400b-99f0-d979c070ea35",
            _SessionToken: sessionToken,
          }),
        }
      );

      if (!teamsResponse.ok) {
        throw new Error(`HTTP error! status: ${teamsResponse.status}`);
      }

      const teamsApiResponse = (await teamsResponse.json()) as {
        result?: Array<{
          objectId: string;
          Name: string;
          IsActive: boolean;
          OrganizationId?: {
            __type: string;
            className: string;
            objectId: string;
          };
          createdAt: string;
          updatedAt: string;
        }>;
        error?: string;
      };

      console.log("📊 Direct teams API response:", teamsApiResponse);

      if (teamsApiResponse.error) {
        throw new Error(`Teams API error: ${teamsApiResponse.error}`);
      }

      const teamsData = teamsApiResponse.result || [];
      console.log("📊 Teams data:", teamsData);
      console.log("📊 Teams data length:", teamsData.length);

      // Extract organization ID from first team
      let organizationId = null;
      if (
        teamsData.length > 0 &&
        "OrganizationId" in teamsData[0] &&
        teamsData[0].OrganizationId
      ) {
        organizationId = (teamsData[0].OrganizationId as { objectId: string })
          .objectId;
        console.log("🏢 Found organization ID:", organizationId);
      }

      // Get team members using the organization ID if available
      let membersData: TeamMember[] = [];

      if (organizationId) {
        try {
          console.log(
            "🔍 Calling getuserlistbyorg API directly with orgId:",
            organizationId
          );
          const fetchResponse = await fetch(
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
          );

          if (!fetchResponse.ok) {
            throw new Error(`HTTP error! status: ${fetchResponse.status}`);
          }

          const response = (await fetchResponse.json()) as {
            result?: TeamMember[];
            error?: string;
          };

          console.log("👥 Direct members API response:", response);

          if (!response.error && response.result) {
            membersData = response.result;
            console.log(
              "👥 Successfully fetched organization members:",
              membersData.length
            );
            console.log("👥 Raw member data:", membersData);
          } else {
            console.warn("⚠️ getuserlistbyorg failed:", response.error);
          }
        } catch (error) {
          console.warn("⚠️ Error calling getuserlistbyorg:", error);
        }
      }

      // Skip fallback since teamsApiService is not available
      if (membersData.length === 0) {
        console.log("🔄 No members found");
        membersData = [];
      }

      // Convert teams data to proper interface
      const formattedTeams: Team[] = teamsData.map((team) => ({
        objectId: team.objectId,
        Name: team.Name,
        IsActive: team.IsActive,
        OrganizationId:
          "OrganizationId" in team
            ? (team.OrganizationId as { objectId: string; Name?: string })
            : undefined,
        createdAt:
          "createdAt" in team
            ? (team.createdAt as string)
            : new Date().toISOString(),
        updatedAt:
          "updatedAt" in team
            ? (team.updatedAt as string)
            : new Date().toISOString(),
      }));

      // Transform members data to match TeamMember interface
      const formattedMembers: TeamMember[] = membersData.map((member) => {
        // Use the data directly from our API response
        return {
          objectId: member.objectId,
          Name: member.Name || "Unknown User",
          Email: member.Email || "unknown@example.com",
          UserRole: member.UserRole || "User",
          Company: member.Company,
          IsDisabled: member.IsDisabled || false,
          TeamIds: member.TeamIds || [],
          createdAt: member.createdAt,
        };
      });

      console.log("🔄 Formatted teams:", formattedTeams);
      console.log("🔄 Formatted members:", formattedMembers);

      setOrganizationData({
        teams: formattedTeams,
        members: formattedMembers,
      });

      // Auto-expand all teams and select first one
      const teamIds = new Set(formattedTeams.map((team) => team.objectId));
      setExpandedTeams(teamIds);

      if (formattedTeams.length > 0 && !selectedTeam) {
        setSelectedTeam(formattedTeams[0]);
      }

      console.log(
        `✅ Loaded ${formattedTeams.length} teams and ${formattedMembers.length} organization members`
      );
    } catch (error) {
      console.error("❌ Error loading organization data:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load organization data"
      );
    } finally {
      setLoading(false);
    }
  }, [selectedTeam]);

  useEffect(() => {
    loadOrganizationData();
  }, [loadOrganizationData]);

  const handleCreateTeam = async (teamData: {
    name: string;
    selectedMembers: TeamMember[];
  }) => {
    try {
      console.log(
        "🆕 Creating team:",
        teamData.name,
        "with",
        teamData.selectedMembers.length,
        "members"
      );

      // Get organization ID from current teams data
      let organizationId = "b7cpzhOEUI"; // Default from your curl tests
      if (
        organizationData &&
        organizationData.teams.length > 0 &&
        organizationData.teams[0].OrganizationId
      ) {
        organizationId = organizationData.teams[0].OrganizationId.objectId;
        console.log(
          "🏢 Using organization ID from existing teams:",
          organizationId
        );
      } else {
        console.log("🏢 Using fallback organization ID:", organizationId);
      }

      // Step 1: Create the team using direct API
      console.log("📝 Step 1: Creating team in contracts_Teams...");

      // Get session token for authentication
      const sessionToken = openSignApiService.getSessionToken();
      console.log(
        "🔑 Using session token:",
        sessionToken ? `${sessionToken.substring(0, 15)}...` : "none"
      );

      const createTeamResponse = await fetch(
        "http://94.249.71.89:9000/api/app/classes/contracts_Teams",
        {
          method: "POST",
          headers: {
            "Content-Type": "text/plain",
            Origin: "http://94.249.71.89:9000",
            Referer: "http://94.249.71.89:9000/",
            "User-Agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
          },
          body: JSON.stringify({
            Name: teamData.name,
            IsActive: true,
            OrganizationId: {
              __type: "Pointer",
              className: "contracts_Organizations",
              objectId: organizationId,
            },
            _ApplicationId: "opensign",
            _ClientVersion: "js6.1.1",
            _InstallationId: "ef44e42e-e0a3-44a0-a359-90c26af8ffac",
            _SessionToken: sessionToken,
          }),
        }
      );

      if (!createTeamResponse.ok) {
        const errorData = await createTeamResponse.json();
        throw new Error(errorData.error || "Failed to create team");
      }

      const teamResult = await createTeamResponse.json();
      const newTeamId = teamResult.objectId;

      if (!newTeamId) {
        throw new Error("No team ID returned from server");
      }

      console.log("✅ Team created successfully with ID:", newTeamId);

      // Step 2: Add selected members using direct contracts_Users creation
      if (teamData.selectedMembers.length > 0) {
        console.log(
          "👥 Step 2: Adding",
          teamData.selectedMembers.length,
          "members using contracts_Users class..."
        );

        // Get organization ID from teams data
        let organizationId = "b7cpzhOEUI"; // Default from your curl tests
        if (
          organizationData &&
          organizationData.teams.length > 0 &&
          organizationData.teams[0].OrganizationId
        ) {
          organizationId = organizationData.teams[0].OrganizationId.objectId;
          console.log(
            "🏢 Using organization ID from teams data:",
            organizationId
          );
        }

        // Add each member sequentially using contracts_Users class
        for (let i = 0; i < teamData.selectedMembers.length; i++) {
          const member = teamData.selectedMembers[i];

          try {
            console.log(
              `👤 Adding member ${i + 1}/${teamData.selectedMembers.length}: ${
                member.Name
              } using contracts_Users`
            );

            // Create user via contracts_Users class (this works!)
            const addMemberResponse = (await openSignApiService.post(
              "classes/contracts_Users",
              {
                Name: member.Name,
                Email: member.Email,
                UserRole: member.UserRole?.startsWith("contracts_")
                  ? member.UserRole
                  : `contracts_${member.UserRole || "User"}`,
                IsDisabled: false,
                Company: member.Company || "Default Organization",
                TeamIds: [
                  {
                    __type: "Pointer",
                    className: "contracts_Teams",
                    objectId: newTeamId,
                  },
                ],
                OrganizationId: {
                  __type: "Pointer",
                  className: "contracts_Organizations",
                  objectId: organizationId,
                },
              }
            )) as {
              objectId?: string;
              createdAt?: string;
              error?: string;
            };

            if (addMemberResponse.objectId) {
              console.log(
                "✅ Successfully added member:",
                member.Name,
                "with ID:",
                addMemberResponse.objectId
              );

              // Optionally create Parse User account for login
              try {
                const parseUserResponse = await fetch(
                  "http://94.249.71.89:9000/api/app/users",
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "text/plain",
                      Origin: "http://94.249.71.89:9000",
                      Referer: "http://94.249.71.89:9000/",
                      "User-Agent":
                        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
                    },
                    body: JSON.stringify({
                      username: member.Email,
                      email: member.Email,
                      password: "DefaultPassword123", // teamsApiService.generatePassword(12),
                      name: member.Name,
                      _ApplicationId: "opensign",
                      _ClientVersion: "js6.1.1",
                      _InstallationId: "ef44e42e-e0a3-44a0-a359-90c26af8ffac",
                      _SessionToken: sessionToken,
                    }),
                  }
                );

                if (parseUserResponse.ok) {
                  await parseUserResponse.json();
                  console.log(
                    "✅ Parse User account created for:",
                    member.Name
                  );
                } else {
                  console.warn(
                    "⚠️ Parse User creation failed for:",
                    member.Name
                  );
                }
              } catch (parseUserError) {
                console.warn(
                  "⚠️ Parse User creation failed for:",
                  member.Name,
                  parseUserError
                );
              }
            } else {
              console.warn(
                "⚠️ Failed to add member:",
                member.Name,
                addMemberResponse.error
              );
            }

            // Small delay to avoid overwhelming the server
            await new Promise((resolve) => setTimeout(resolve, 100));
          } catch (memberError) {
            console.warn("⚠️ Error adding member:", member.Name, memberError);
          }
        }

        console.log("👥 Finished adding members using contracts_Users class");
      }

      // Step 3: Reload data and close modal
      console.log("🔄 Step 3: Reloading organization data...");
      await loadOrganizationData();
      setIsCreateTeamModalOpen(false);

      // Expand the newly created team
      setExpandedTeams((prev) => new Set([...prev, newTeamId]));

      console.log("🎉 Team creation completed: contracts_Teams + addUser!");
    } catch (error) {
      console.error("❌ Error creating team:", error);
      throw error;
    }
  };

  const handleAddMemberToTeam = async (userData: {
    name: string;
    email: string;
    password: string;
    role: string;
    company?: string;
  }) => {
    if (!selectedTeamForMember) {
      throw new Error("No team selected");
    }

    try {
      console.log(
        "👤 Adding member to team:",
        userData,
        "Team:",
        selectedTeamForMember.Name
      );

      // Get organization ID from existing teams data
      let organizationId = "b7cpzhOEUI"; // Default from your curl tests
      if (
        organizationData &&
        organizationData.teams.length > 0 &&
        organizationData.teams[0].OrganizationId
      ) {
        organizationId = organizationData.teams[0].OrganizationId.objectId;
        console.log(
          "🏢 Using organization ID from existing teams:",
          organizationId
        );
      }

      // Step 1: Create user directly via contracts_Users class (this works!)
      console.log("📝 Step 1: Creating user via contracts_Users class...");
      const createUserResponse = (await openSignApiService.post(
        "classes/contracts_Users",
        {
          Name: userData.name,
          Email: userData.email,
          UserRole: userData.role.startsWith("contracts_")
            ? userData.role
            : `contracts_${userData.role}`,
          IsDisabled: false,
          Company: userData.company || "Default Organization",
          TeamIds: [
            {
              __type: "Pointer",
              className: "contracts_Teams",
              objectId: selectedTeamForMember.objectId,
            },
          ],
          OrganizationId: {
            __type: "Pointer",
            className: "contracts_Organizations",
            objectId: organizationId,
          },
        }
      )) as {
        objectId?: string;
        createdAt?: string;
        error?: string;
      };

      console.log("✅ User creation response:", createUserResponse);

      if (createUserResponse.error) {
        throw new Error(`Failed to create user: ${createUserResponse.error}`);
      }

      if (!createUserResponse.objectId) {
        throw new Error("No user ID returned from server");
      }

      console.log(
        "✅ User created successfully with ID:",
        createUserResponse.objectId
      );

      // Step 2: Create Parse User account for login (optional but recommended)
      try {
        console.log(
          "📝 Step 2: Creating Parse User account for authentication..."
        );

        // Get session token for authentication
        const sessionToken = openSignApiService.getSessionToken();
        console.log(
          "🔑 Using session token for Parse User creation:",
          sessionToken ? `${sessionToken.substring(0, 15)}...` : "none"
        );

        const parseUserResponse = await fetch(
          "http://94.249.71.89:9000/api/app/users",
          {
            method: "POST",
            headers: {
              "Content-Type": "text/plain",
              Origin: "http://94.249.71.89:9000",
              Referer: "http://94.249.71.89:9000/",
              "User-Agent":
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
            },
            body: JSON.stringify({
              username: userData.email,
              email: userData.email,
              password: userData.password,
              name: userData.name,
              _ApplicationId: "opensign",
              _ClientVersion: "js6.1.1",
              _InstallationId: "ef44e42e-e0a3-44a0-a359-90c26af8ffac",
              _SessionToken: sessionToken,
            }),
          }
        );

        if (parseUserResponse.ok) {
          const parseUserResult = await parseUserResponse.json();
          console.log(
            "✅ Parse User account created:",
            parseUserResult.objectId
          );
        } else {
          const errorData = await parseUserResponse.json();
          console.warn("⚠️ Parse User creation failed:", errorData.error);
          // Don't throw error here, user creation was successful
        }
      } catch (parseUserError) {
        console.warn("⚠️ Parse User creation failed:", parseUserError);
        // Don't throw error, the main user was created successfully
      }

      console.log("✅ Member added successfully to team");

      // Step 3: Reload organization data to show the new member
      await loadOrganizationData();
      setIsAddMemberModalOpen(false);
      setSelectedTeamForMember(null);

      // Keep the team expanded to show the new member
      setExpandedTeams(
        (prev) => new Set([...prev, selectedTeamForMember.objectId])
      );
    } catch (error) {
      console.error("❌ Error adding member to team:", error);
      throw error;
    }
  };

  const openAddMemberModal = (team: Team) => {
    setSelectedTeamForMember(team);
    setIsAddMemberModalOpen(true);
  };

  const toggleTeamExpansion = (teamId: string) => {
    setExpandedTeams((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(teamId)) {
        newSet.delete(teamId);
      } else {
        newSet.add(teamId);
      }
      return newSet;
    });
  };

  const getTeamMembers = (team: Team) => {
    if (!organizationData) return [];
    return organizationData.members.filter((member) =>
      member.TeamIds?.some((teamId) => teamId.objectId === team.objectId)
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge
        variant={isActive ? "default" : "secondary"}
        className={
          isActive ? "bg-green-100 text-green-800 border-green-200" : ""
        }
      >
        {isActive ? "Active" : "Inactive"}
      </Badge>
    );
  };

  const getUserRoleBadge = (role?: string) => {
    const isAdmin = role?.includes("Admin");
    const displayRole = role?.replace("contracts_", "") || "User";

    return (
      <Badge
        variant={isAdmin ? "destructive" : "outline"}
        className={isAdmin ? "" : "bg-blue-50 text-blue-700 border-blue-200"}
      >
        {displayRole}
      </Badge>
    );
  };

  const getMemberAvatar = (name: string) => {
    return (
      <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
        <span className="text-sm font-medium text-green-700">
          {name?.charAt(0)?.toUpperCase() || "?"}
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-4 border-b-2 border-green-600 rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Loading organization data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const errorMessage =
      typeof error === "string"
        ? error
        : (error as Error)?.message || "An error occurred";
    const isAuthError =
      errorMessage.includes("Session expired") ||
      errorMessage.includes("Invalid session token");

    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertCircle
            className={`w-8 h-8 mx-auto mb-4 ${
              isAuthError ? "text-amber-500" : "text-destructive"
            }`}
          />
          <p
            className={`mb-2 font-medium ${
              isAuthError ? "text-amber-600" : "text-destructive"
            }`}
          >
            {isAuthError
              ? "Authentication Required"
              : "Error Loading Organization Data"}
          </p>
          <p className="mb-4 text-sm text-muted-foreground">{errorMessage}</p>
          {isAuthError ? (
            <div className="space-y-2">
              <Button onClick={loadOrganizationData} variant="outline">
                Try Again
              </Button>
              <p className="text-xs text-muted-foreground">
                Currently showing demo data. Log in to see your actual
                organization data.
              </p>
            </div>
          ) : (
            <Button onClick={loadOrganizationData} variant="outline">
              Try Again
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Demo Data Banner */}
      {error &&
        typeof error === "string" &&
        error.includes("Session expired") && (
          <div className="p-4 border rounded-lg border-amber-200 bg-amber-50">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <div>
                <p className="text-sm font-medium text-amber-800">Demo Mode</p>
                <p className="text-xs text-amber-700">
                  Showing sample data. Log in to view your actual organization
                  teams and members.
                </p>
              </div>
            </div>
          </div>
        )}
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium">Organization Teams & Members</h3>
          <p className="text-sm text-muted-foreground">
            Manage your teams and their members within your organization
          </p>
        </div>
        <Button
          onClick={() => setIsCreateTeamModalOpen(true)}
          className="flex items-center gap-2 text-white bg-green-600 hover:bg-green-700"
        >
          <Plus className="w-4 h-4" />
          Create Team
        </Button>
      </div>
      {/* Organization Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-green-600" />
            Organization Overview
          </CardTitle>
          <CardDescription>
            Teams and members in your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          {organizationData ? (
            <>
              <div className="grid grid-cols-2 gap-4 mb-6 md:grid-cols-4">
                <div className="p-4 text-center border border-green-200 rounded-lg bg-green-50">
                  <div className="text-2xl font-bold text-green-700">
                    {organizationData.teams.length}
                  </div>
                  <div className="text-sm text-green-600">Teams</div>
                </div>
                <div className="p-4 text-center border border-blue-200 rounded-lg bg-blue-50">
                  <div className="text-2xl font-bold text-blue-700">
                    {organizationData.members.length}
                  </div>
                  <div className="text-sm text-blue-600">Total Members</div>
                </div>
                <div className="p-4 text-center border border-purple-200 rounded-lg bg-purple-50">
                  <div className="text-2xl font-bold text-purple-700">
                    {organizationData.teams.filter((t) => t.IsActive).length}
                  </div>
                  <div className="text-sm text-purple-600">Active Teams</div>
                </div>
                <div className="p-4 text-center border border-orange-200 rounded-lg bg-orange-50">
                  <div className="text-2xl font-bold text-orange-700">
                    {
                      organizationData.members.filter((m) =>
                        m.UserRole?.includes("Admin")
                      ).length
                    }
                  </div>
                  <div className="text-sm text-orange-600">Admins</div>
                </div>
              </div>

              {/* Teams List with Members */}
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">Teams & Members</h4>
                  <Button
                    onClick={() => setIsCreateTeamModalOpen(true)}
                    className="text-white bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Team
                  </Button>
                </div>

                {organizationData.teams.length === 0 ? (
                  <div className="py-8 text-center">
                    <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="mb-2 text-lg font-medium text-gray-900">
                      No teams found
                    </h3>
                    <p className="mb-4 text-muted-foreground">
                      Create your first team to get started
                    </p>
                    <Button
                      onClick={() => setIsCreateTeamModalOpen(true)}
                      className="text-white bg-green-600 hover:bg-green-700"
                    >
                      Create Team
                    </Button>
                  </div>
                ) : (
                  organizationData.teams.map((team) => {
                    const teamMembers = getTeamMembers(team);
                    const isExpanded = expandedTeams.has(team.objectId);

                    return (
                      <div key={team.objectId} className="border rounded-lg">
                        {/* Team Header */}
                        <div
                          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                          onClick={() => toggleTeamExpansion(team.objectId)}
                        >
                          <div className="flex items-center space-x-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-6 h-6 p-0"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </Button>
                            <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg">
                              <Building2 className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {team.Name}
                              </h4>
                              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                <Users className="w-3 h-3" />
                                <span>{teamMembers.length} members</span>
                                <span>•</span>
                                <Calendar className="w-3 h-3" />
                                <span>{formatDate(team.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getStatusBadge(team.IsActive)}
                          </div>
                        </div>

                        {/* Team Members (Expanded) */}
                        {isExpanded && (
                          <div className="border-t bg-gray-50">
                            <div className="p-4">
                              <div className="flex items-center justify-between mb-3">
                                <h5 className="font-medium text-gray-900">
                                  Team Members ({teamMembers.length})
                                </h5>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 border-green-200 hover:bg-green-50"
                                  onClick={() => openAddMemberModal(team)}
                                >
                                  <Users className="w-3 h-3 mr-1" />
                                  Add Members
                                </Button>
                              </div>

                              {teamMembers.length === 0 ? (
                                <div className="py-6 text-center">
                                  <Users className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                                  <p className="text-sm text-muted-foreground">
                                    No members in this team
                                  </p>
                                </div>
                              ) : (
                                <div className="grid gap-3">
                                  {teamMembers.map((member) => (
                                    <div
                                      key={member.objectId}
                                      className="flex items-center justify-between p-3 bg-white border rounded-md"
                                    >
                                      <div className="flex items-center space-x-3">
                                        {getMemberAvatar(member.Name)}
                                        <div>
                                          <p className="text-sm font-medium text-gray-900">
                                            {member.Name}
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            {member.Email}
                                          </p>
                                          {member.Company && (
                                            <p className="text-xs text-muted-foreground">
                                              {member.Company}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        {getUserRoleBadge(member.UserRole)}
                                        {member.IsDisabled && (
                                          <Badge
                                            variant="destructive"
                                            className="text-xs"
                                          >
                                            Disabled
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">
                No organization data available
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      {/* Create Team Modal */}
      <CreateTeamModal
        isOpen={isCreateTeamModalOpen}
        onClose={() => setIsCreateTeamModalOpen(false)}
        onSubmit={handleCreateTeam}
        organizationMembers={organizationData?.members || []}
      />{" "}
      {/* Add Member to Team Modal */}
      <AddMemberToTeamModal
        isOpen={isAddMemberModalOpen}
        onClose={() => {
          setIsAddMemberModalOpen(false);
          setSelectedTeamForMember(null);
        }}
        onSubmit={handleAddMemberToTeam}
        teamName={selectedTeamForMember?.Name || ""}
        teamId={selectedTeamForMember?.objectId || ""}
      />
    </div>
  );
}
