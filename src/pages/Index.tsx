import { useState, useCallback, useEffect, useMemo, lazy, Suspense } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import ProjectDashboard from "@/components/ProjectDashboard";
const ChronosTimeline = lazy(() => import("@/components/ChronosTimeline"));
const SimpleProjectDetails = lazy(() => import("@/components/SimpleProjectDetails"));
import ProgressBentoCard from "@/components/ProgressBentoCard";
import DailyFocusedView from "@/components/DailyFocusedView";
import ProjectNotes from "@/components/ProjectNotes";
import ProjectSettingsOverlay, { type ProjectSettings } from "@/components/ProjectSettings";
import { useSettingsContext } from "@/components/SettingsContext";
import { useProjectData } from "@/components/ProjectDataContext";
import { useCommandPalette } from "@/components/CommandPalette";
import { useAuth } from "@/components/AuthContext";
import { toast } from "sonner";

// ── Default per-project settings ───────────────────────
// HSL values for each accent color — used to override --primary at runtime
const ACCENT_HSL: Record<string, string> = {
  indigo: "239 84% 67%",
  violet: "263 70% 58%",
  rose: "350 89% 60%",
  emerald: "160 84% 39%",
  amber: "38 92% 50%",
  sky: "199 89% 48%",
  fuchsia: "292 84% 61%",
  orange: "25 95% 53%",
};

function buildDefaultSettings(proj: { id: string; name: string; iconName: string; color?: string; tags?: { id: string; label: string; color: string }[]; members?: { id: string; initials: string; name: string; color: string; role: string; email?: string }[] }): ProjectSettings {
  return {
    projectId: proj.id,
    name: proj.name,
    iconName: proj.iconName,
    accentColor: proj.color || "indigo",
    tags: proj.tags?.map(t => ({ id: t.id, label: t.label, color: t.color })) ?? [{ id: "td1", label: "General", color: "indigo" }],
    members: proj.members?.map(m => ({ id: m.id, initials: m.initials, name: m.name, color: m.color, role: m.role as any, email: m.email || "" })) ?? [],
  };
}

const Index = () => {
  const { projectId: urlProjectId } = useParams<{ projectId?: string }>();
  const navigate = useNavigate();
  const [selectedProject, setSelectedProject] = useState<string | null>(urlProjectId || null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { settingsRequested, clearSettingsRequest } = useSettingsContext();
  const { getProject, updateProject, deleteProject, getMyRole, logProjectAction, projectsLoaded } = useProjectData();
  const { pendingNav, clearPendingNav, pendingAction, clearPendingAction } = useCommandPalette();
  const { user } = useAuth();

  // Sync URL param with internal state
  useEffect(() => {
    if (urlProjectId && urlProjectId !== selectedProject) {
      setSelectedProject(urlProjectId);
    }
  }, [urlProjectId]);

  // Derive current project for mode-aware rendering
  const currentProject = selectedProject ? getProject(selectedProject) : undefined;

  // If the selected project no longer exists (e.g. deleted), drop back to dashboard.
  // IMPORTANT: Only redirect once projects have actually loaded from the API —
  // otherwise this fires during the initial fetch gap and kills navigation.
  useEffect(() => {
    if (selectedProject && projectsLoaded && !currentProject) {
      setSelectedProject(null);
      navigate('/dashboard');
      setSettingsOpen(false);
    }
  }, [selectedProject, currentProject, navigate, projectsLoaded]);

  // Determine current user's role in the project
  const myRole = useMemo(() => {
    if (!selectedProject || !user?.email) return "owner" as const;
    return getMyRole(selectedProject, user.email) ?? ("owner" as const);
  }, [selectedProject, user?.email, getMyRole]);

  // React to command palette navigation
  useEffect(() => {
    if (pendingNav) {
      setSelectedProject(pendingNav.projectId);
      navigate(`/projects/${pendingNav.projectId}`);
      if (!pendingNav.taskId) clearPendingNav();
    }
  }, [pendingNav, clearPendingNav, navigate]);

  // React to command palette actions (e.g. "create-project")
  useEffect(() => {
    if (pendingAction === "create-project") {
      setSelectedProject(null);
      navigate('/dashboard');
      // Don't clear — ProjectDashboard will consume it
    }
  }, [pendingAction, navigate]);

  // Open settings when sidebar gear is clicked
  useEffect(() => {
    if (settingsRequested && selectedProject) {
      setSettingsOpen(true);
      clearSettingsRequest();
    } else if (settingsRequested) {
      clearSettingsRequest();
    }
  }, [settingsRequested, selectedProject, clearSettingsRequest]);

  // Derive settings from project context (single source of truth)
  const getSettings = useCallback(
    (projectId: string): ProjectSettings => {
      const proj = getProject(projectId);
      if (proj) return buildDefaultSettings(proj);
      return {
        projectId,
        name: "Project",
        iconName: "Layers",
        accentColor: "indigo",
        tags: [{ id: "td1", label: "General", color: "indigo" }],
        members: [],
      };
    },
    [getProject]
  );

  // Sync settings changes back to the project context
  const updateSettings = useCallback(
    (s: ProjectSettings) => {
      const current = getProject(s.projectId);
      if (!current) return; // project was deleted or doesn't exist
      try {
        updateProject(s.projectId, {
          name: s.name,
          iconName: s.iconName,
          color: s.accentColor,
          tags: s.tags,
          members: s.members.map((m) => {
            const existing = current.members.find((em) => em.id === m.id);
            return {
              ...m,
              email: existing?.email || m.email || "",
              role: m.role as any,
            };
          }),
        });
        if (user?.email) {
          logProjectAction(s.projectId, "Updated project settings", user.email);
        }
      } catch {
        toast.error("Failed to save settings");
      }
    },
    [getProject, updateProject]
  );

  // Open settings for a specific project from the dashboard cards
  const handleOpenProjectSettings = useCallback((projectId: string) => {
    setSelectedProject(projectId);
    navigate(`/projects/${projectId}`);
    setSettingsOpen(true);
  }, [navigate]);

  // Delete project and navigate back to dashboard
  const handleDeleteProject = useCallback((projectId: string) => {
    try {
      if (user?.email) {
        logProjectAction(projectId, "Deleted project", user.email);
      }
      deleteProject(projectId);
      setSettingsOpen(false);
      setSelectedProject(null);
    } catch {
      toast.error("Failed to delete project");
    }
  }, [deleteProject]);

  return (
    <LayoutGroup>
      <AnimatePresence mode="wait">
        {!selectedProject ? (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.3 }}
          >
            <ProjectDashboard onSelectProject={(id) => { setSelectedProject(id); navigate(`/projects/${id}`); }} onOpenSettings={handleOpenProjectSettings} />
          </motion.div>
        ) : currentProject ? (
          <motion.div
            key="workspace"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring" as const, stiffness: 300, damping: 30 }}
            style={{
              "--primary": ACCENT_HSL[currentProject?.color || "indigo"] || ACCENT_HSL.indigo,
              "--ring": ACCENT_HSL[currentProject?.color || "indigo"] || ACCENT_HSL.indigo,
              "--sidebar-primary": ACCENT_HSL[currentProject?.color || "indigo"] || ACCENT_HSL.indigo,
            } as React.CSSProperties}
          >
            {/* ── Simple Mode: minimalist project view ── */}
            {currentProject.viewMode === "simple" ? (
              <Suspense fallback={<div className="h-32 rounded-[2rem] glass animate-pulse" />}>
                <SimpleProjectDetails
                  project={currentProject}
                  onBack={() => { setSelectedProject(null); navigate('/dashboard'); }}
                  onOpenSettings={() => setSettingsOpen(true)}
                />
              </Suspense>
            ) : (
              /* ── Advanced Mode: full sprints/weeks view ── */
              <div className="flex flex-col gap-6 md:gap-8">
                {/* Back button + Settings */}
                <div className="flex items-center gap-2">
                  <motion.button
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => { setSelectedProject(null); navigate('/dashboard'); }}
                    className="
                      flex items-center gap-2 px-4 py-2 rounded-full
                      text-xs font-semibold text-muted-foreground
                      bg-foreground/[0.03] dark:bg-white/[0.04]
                      backdrop-blur-xl ring-1 ring-white/10
                      hover:text-foreground
                      transition-colors duration-200
                    "
                  >
                    ← All Projects
                  </motion.button>

                  <motion.button
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 }}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setSettingsOpen(true)}
                    className="
                      flex items-center gap-2 px-4 py-2 rounded-full
                      text-xs font-semibold text-muted-foreground
                      bg-foreground/[0.03] dark:bg-white/[0.04]
                      backdrop-blur-xl ring-1 ring-white/10
                      hover:text-foreground
                      transition-colors duration-200
                      ml-auto
                    "
                  >
                    ⚙ Settings
                  </motion.button>
                </div>

                {/* Bento Grid Top Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                  <div className="lg:col-span-2">
                    <Suspense fallback={<div className="h-32 rounded-[2rem] glass animate-pulse" />}>
                      <ChronosTimeline />
                    </Suspense>
                  </div>
                  <div>
                    <ProgressBentoCard />
                  </div>
                </div>

                {/* Daily Focused View */}
                <DailyFocusedView projectId={selectedProject} projectMode={currentProject.mode ?? "solo"} projectMembers={currentProject.members ?? []} projectTags={currentProject.tags ?? []} />

                {/* Project Notes */}
                <ProjectNotes projectId={selectedProject} />
              </div>
            )}
          </motion.div>
        ) : (
          /* Project selected but not loaded yet — loading fallback */
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center py-24"
          >
            <p className="text-sm text-muted-foreground animate-pulse">Loading project…</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Project Settings Overlay */}
      {selectedProject && currentProject && (
        <ProjectSettingsOverlay
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          settings={getSettings(selectedProject)}
          onUpdateSettings={updateSettings}
          projectMode={currentProject.mode ?? "solo"}
          onDeleteProject={handleDeleteProject}
          userRole={myRole}
          auditLogs={currentProject.auditLogs ?? []}
        />
      )}
    </LayoutGroup>
  );
};

export default Index;
