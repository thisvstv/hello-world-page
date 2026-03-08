import { useMemo, memo } from "react";
import { motion } from "framer-motion";
import {
    Users,
    User,
    Crown,
    ShieldCheck,
    Pencil,
    Layers,
    Rocket,
    Sparkles,
    Palette,
    Shield,
    Zap,
    Globe,
    Code,
    Database,
    Terminal,
    Star,
    Heart,
} from "lucide-react";
import {
    useProjectData,
    type ProjectRole,
    type Project,
    type ProjectMember,
} from "@/components/ProjectDataContext";

// ── Icon map ───────────────────────────────────────────
const ICON_MAP: Record<string, React.ElementType> = {
    Palette, Layers, Rocket, Sparkles, Shield, Zap, Globe,
    Code, Database, Terminal, Star, Heart,
};

const ROLE_META: Record<ProjectRole, { label: string; icon: React.ElementType; bg: string; text: string }> = {
    owner: { label: "Owner", icon: Crown, bg: "bg-amber-500/15", text: "text-amber-600 dark:text-amber-400" },
    admin: { label: "Admin", icon: ShieldCheck, bg: "bg-indigo-500/15", text: "text-indigo-600 dark:text-indigo-400" },
    editor: { label: "Editor", icon: Pencil, bg: "bg-emerald-500/15", text: "text-emerald-600 dark:text-emerald-400" },
};

// ── Role badge ─────────────────────────────────────────
const RoleBadge = memo(function RoleBadge({ role }: { role: ProjectRole }) {
    const m = ROLE_META[role];
    const Icon = m.icon;
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold ${m.bg} ${m.text}`}>
            <Icon className="w-3 h-3" />
            {m.label}
        </span>
    );
});

// ── Member row ─────────────────────────────────────────
const MemberRow = memo(function MemberRow({ member, projects }: { member: ProjectMember; projects: { project: Project; role: ProjectRole }[] }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="
        flex items-start gap-4 px-5 py-4 rounded-2xl
        bg-foreground/[0.02] dark:bg-white/[0.03]
        ring-1 ring-white/10 backdrop-blur-xl
      "
        >
            {/* Avatar */}
            <div className={`w-10 h-10 rounded-full ${member.color} flex items-center justify-center text-xs font-bold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)] flex-shrink-0`}>
                {member.initials}
            </div>

            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground">{member.name}</p>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {projects.map(({ project, role }) => {
                        const Icon = ICON_MAP[project.iconName] || Layers;
                        return (
                            <span
                                key={project.id}
                                className="
                  inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px]
                  bg-foreground/[0.04] dark:bg-white/[0.05] text-muted-foreground
                "
                            >
                                <Icon className="w-3 h-3" />
                                {project.name}
                                <span className="mx-0.5 text-muted-foreground/30">·</span>
                                <RoleBadge role={role} />
                            </span>
                        );
                    })}
                </div>
            </div>
        </motion.div>
    );
});

// ── Project Team Card ──────────────────────────────────
function ProjectTeamCard({ project, delay }: { project: Project; delay: number }) {
    const Icon = ICON_MAP[project.iconName] || Layers;

    const roleOrder: ProjectRole[] = ["owner", "admin", "editor"];
    const sorted = [...project.members].sort(
        (a, b) => roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role)
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay }}
            className="
        rounded-[2.5rem] p-6
        bg-white/60 dark:bg-white/[0.04]
        backdrop-blur-[40px] border-[0.5px] border-black/5 dark:border-white/20
        shadow-[0_20px_60px_-15px_rgba(0,0,0,0.07),inset_0_1px_1px_rgba(255,255,255,0.4)]
        dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.06)]
      "
        >
            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 dark:bg-primary/15 flex items-center justify-center shadow-[0_0_16px_rgba(99,102,241,0.15)]">
                    <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-black tracking-tight text-foreground truncate">{project.name}</h3>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground">{project.members.length} members</span>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-medium ${project.mode === "solo" ? "text-amber-500" : "text-indigo-500"}`}>
                            {project.mode === "solo" ? <User className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                            {project.mode}
                        </span>
                    </div>
                </div>
            </div>

            {/* Members */}
            <div className="space-y-2">
                {sorted.map((member) => {
                    const RIcon = ROLE_META[member.role].icon;
                    return (
                        <div
                            key={member.id}
                            className="
                flex items-center gap-3 px-3 py-2.5 rounded-xl
                bg-foreground/[0.02] dark:bg-white/[0.03]
                ring-1 ring-white/10
              "
                        >
                            <div className={`w-8 h-8 rounded-full ${member.color} flex items-center justify-center text-[10px] font-bold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]`}>
                                {member.initials}
                            </div>
                            <span className="flex-1 text-xs font-medium text-foreground">{member.name}</span>
                            <RoleBadge role={member.role} />
                        </div>
                    );
                })}
            </div>
        </motion.div>
    );
}

// ── Main ───────────────────────────────────────────────
export default function TeamPage() {
    const { projects } = useProjectData();

    // Memoize member aggregation
    const { allMembers, teamProjects } = useMemo(() => {
        const memberMap = new Map<string, { member: ProjectMember; projects: { project: Project; role: ProjectRole }[] }>();
        projects.forEach((proj) => {
            proj.members.forEach((m) => {
                const key = m.name;
                if (!memberMap.has(key)) {
                    memberMap.set(key, { member: m, projects: [] });
                }
                memberMap.get(key)!.projects.push({ project: proj, role: m.role });
            });
        });
        return {
            allMembers: Array.from(memberMap.values()),
            teamProjects: projects.filter((p) => p.mode === "team"),
        };
    }, [projects]);

    // Empty state
    if (projects.length === 0) {
        return (
            <div className="max-w-6xl mx-auto flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="w-7 h-7 text-primary/50" />
                </div>
                <h2 className="text-lg font-bold text-foreground">No Team Members Yet</h2>
                <p className="text-sm text-muted-foreground text-center max-w-sm">Create a team project and invite members to see your team here.</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-center gap-3 mb-1">
                    <Users className="w-6 h-6 text-primary" />
                    <h1 className="text-3xl font-black tracking-tighter text-foreground">Team</h1>
                </div>
                <p className="text-sm text-muted-foreground">
                    Your team across {projects.length} projects · {allMembers.length} unique members
                </p>
            </motion.div>

            {/* All Members Section */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-3">All Members</h2>
                <div className="space-y-2">
                    {allMembers.map(({ member, projects: memberProjects }, i) => (
                        <motion.div
                            key={member.name}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 + i * 0.04 }}
                        >
                            <MemberRow member={member} projects={memberProjects} />
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* Per-Project Teams */}
            <div>
                <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-3">Project Teams</h2>
                {teamProjects.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-foreground/10 dark:border-white/10 py-10 flex flex-col items-center gap-2">
                        <Users className="w-5 h-5 text-muted-foreground/30" />
                        <p className="text-xs text-muted-foreground/50">No team projects yet. All projects are solo.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {teamProjects.map((proj, i) => (
                            <ProjectTeamCard key={proj.id} project={proj} delay={0.2 + i * 0.06} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
