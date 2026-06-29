import {
  createContext,
  useContext,
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { upload as uploadBlob } from "@vercel/blob/client";
import {
  Navigate,
  NavLink,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  Archive,
  Bell,
  BrainCircuit,
  Building2,
  ChevronDown,
  Clock3,
  Copy,
  Crown,
  FileClock,
  FileText,
  FolderOpen,
  Download,
  List,
  Gauge,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  MoreVertical,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Upload,
  User,
  Users,
  X,
} from "lucide-react";
import { DataProvider, useData } from "./data";
import { isSupabaseConfigured, supabase } from "./lib/supabase";
import type { Company, JD, Status, Version } from "./types";

type Auth = {
  ready: boolean;
  loggedIn: boolean;
  login: (e: string, p: string) => Promise<void>;
  logout: () => Promise<void>;
};
const AuthCtx = createContext<Auth | null>(null);
const useAuth = () => useContext(AuthCtx)!;
type ResumeRecord = {
  key: string;
  name: string;
  size: number;
  uploadedAt: string;
  url?: string;
  pathname?: string;
  error?: string;
  status: "uploaded" | "skipped" | "failed";
};
function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(!supabase),
    [loggedIn, setLogged] = useState(
      () => !supabase && localStorage.getItem("jdm_demo_auth") === "1",
    );
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setLogged(!!data.session);
      setReady(true);
    });
    return supabase.auth.onAuthStateChange((_e, s) => setLogged(!!s)).data
      .subscription.unsubscribe;
  }, []);
  const login = async (e: string, p: string) => {
    if (supabase) {
      const { error } = await supabase.auth.signInWithPassword({
        email: e,
        password: p,
      });
      if (error) throw error;
    } else {
      if (!e || !p) throw Error("Enter your email and password.");
      localStorage.setItem("jdm_demo_auth", "1");
      setLogged(true);
    }
  };
  const logout = async () => {
    if (supabase) await supabase.auth.signOut();
    else {
      localStorage.removeItem("jdm_demo_auth");
      setLogged(false);
    }
  };
  return (
    <AuthCtx.Provider value={{ ready, loggedIn, login, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}
function Protected() {
  const a = useAuth(),
    l = useLocation();
  if (!a.ready) return <Loader full />;
  return a.loggedIn ? (
    <Outlet />
  ) : (
    <Navigate to="/login" state={{ from: l }} replace />
  );
}
const fmt = (d: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(d));
const companyName = (jd: JD, companies: Company[]) =>
  jd.companies?.name ||
  companies.find((c) => c.id === jd.company_id)?.name ||
  "Unknown company";
const readResumeStore = (): Record<string, ResumeRecord[]> => {
  try {
    return JSON.parse(localStorage.getItem("jdm_candidate_resumes") || "{}");
  } catch {
    return {};
  }
};
const uploadedResumes = (store: Record<string, ResumeRecord[]>, jdId: string) =>
  (store[jdId] || []).filter((r) => r.status === "uploaded");
const titleCase = (v: string) =>
  v
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (m) => m.toUpperCase());
const fallbackNames = [
  "Priya Nair",
  "Aman Verma",
  "Sarah Chen",
  "Rahul Mehta",
  "Kavya Rao",
];
function candidateInsights(jd: JD, resumes: ResumeRecord[] = []) {
  const rows = resumes.length
    ? resumes.slice(0, 5)
    : fallbackNames.map((name, i) => ({
        key: `sample-${i}`,
        name,
        size: 0,
        uploadedAt: new Date().toISOString(),
        status: "uploaded" as const,
      }));
  return rows.map((r, i) => {
    const score = Math.max(
      54,
      Math.min(97, jd.shortlist_score + [9, 5, 1, -5, -11][i]),
    );
    const matched = jd.required_skills.slice(
      0,
      Math.max(1, Math.min(jd.required_skills.length, 3 - (i % 2))),
    );
    const gaps = jd.required_skills
      .filter((s) => !matched.includes(s))
      .slice(0, 2);
    return {
      id: r.key || r.name,
      name: titleCase(r.name) || fallbackNames[i] || "Candidate",
      score,
      matched,
      gaps,
      explanation: `Strong ${jd.job_title} fit based on ${matched.join(", ") || "role-aligned experience"}${gaps.length ? `; verify ${gaps.join(", ")}` : ""}.`,
      tier:
        score >= 85
          ? "High fit"
          : score >= 72
            ? "Review"
            : score >= 60
              ? "Maybe"
              : "Low fit",
    };
  });
}
function UpgradeCard() {
  return (
    <div className="upgrade-card" data-tour="premium-dashboard">
      <div>
        <span>
          <Crown size={15} /> Pro
        </span>
        <h3>Premium hiring dashboard</h3>
        <p>
          AI explanation, risk factors, communication, scheduling, and hiring
          flow.
        </p>
      </div>
      <Button to="/settings" variant="upgrade">
        Upgrade
      </Button>
    </div>
  );
}
function Logo() {
  return (
    <div className="logo">
      <span className="logo-mark">
        <BrainCircuit size={24} />
      </span>
      <span>HireScore AI</span>
    </div>
  );
}
function OnboardingTour({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [step, setStep] = useState(0);
  const [spotlight, setSpotlight] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);
  const steps = [
    {
      title: "Click here to add a client",
      body: "Start here. Add the company first so every role, resume folder, and candidate note stays under the right client.",
      label: "Client setup",
      target: "add-client",
      action: "Click Add Client",
    },
    {
      title: "Click here to create a role",
      body: "After the client is ready, create the hiring role with JD, skills, experience, status, and shortlist settings.",
      label: "Role details",
      target: "create-role",
      action: "Click Create Role",
    },
    {
      title: "Open roles and resumes here",
      body: "Use this section to see each role, candidate totals, uploaded resumes, and the next review action.",
      label: "Resume intake",
      target: "roles-nav",
      action: "Open Roles & Resumes",
    },
    {
      title: "Upgrade opens the full premium flow",
      body: "Premium is not only ranking. It unlocks AI explanations, risk factors, automated communication, recruiter-ready summaries, interview scheduling, and the complete HireScore AI hiring dashboard.",
      label: "Premium flow",
      target: "premium-dashboard",
      action: "Open premium dashboard",
    },
    {
      title: "Reopen this guide anytime",
      body: "If a recruiter gets confused, they can click Guide again and repeat this click-by-click walkthrough.",
      label: "Help",
      target: "guide",
      action: "Click Guide",
    },
  ];
  const current = steps[step];
  useEffect(() => {
    if (open) setStep(0);
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const updateSpotlight = () => {
      const el = document.querySelector(`[data-tour="${current.target}"]`);
      if (!el) {
        setSpotlight(null);
        return;
      }
      const r = el.getBoundingClientRect();
      setSpotlight({
        top: r.top,
        left: r.left,
        width: r.width,
        height: r.height,
      });
    };
    updateSpotlight();
    window.addEventListener("resize", updateSpotlight);
    window.addEventListener("scroll", updateSpotlight, true);
    return () => {
      window.removeEventListener("resize", updateSpotlight);
      window.removeEventListener("scroll", updateSpotlight, true);
    };
  }, [open, current.target]);
  if (!open) return null;
  const last = step === steps.length - 1;
  const isSidebarTarget = spotlight ? spotlight.left < 300 : false;
  const tooltipStyle = spotlight
    ? {
        top: `${Math.max(
          20,
          Math.min(
            window.innerHeight - 330,
            Math.max(
              20,
              isSidebarTarget
                ? spotlight.top - 20
                : spotlight.top + spotlight.height + 18,
            ),
          ),
        )}px`,
        left: `${Math.max(
          20,
          Math.min(
            window.innerWidth - 470,
            Math.max(
              20,
              isSidebarTarget
                ? spotlight.left + spotlight.width + 24
                : spotlight.left + spotlight.width / 2 - 215,
            ),
          ),
        )}px`,
      }
    : undefined;
  return (
    <div className="tour-back guided" role="dialog" aria-modal="true">
      {spotlight && (
        <div
          className="tour-spotlight"
          style={{
            top: spotlight.top - 8,
            left: spotlight.left - 8,
            width: spotlight.width + 16,
            height: spotlight.height + 16,
          }}
        />
      )}
      <div className={spotlight ? "tour-card anchored" : "tour-card"} style={tooltipStyle}>
        <div className="tour-top">
          <span>
            <Sparkles size={15} /> Click-by-click guide
          </span>
          <button onClick={onClose} aria-label="Close tour">
            <X />
          </button>
        </div>
        <div className="tour-progress">
          {steps.map((s, i) => (
            <button
              key={s.label}
              className={i === step ? "active" : ""}
              onClick={() => setStep(i)}
              aria-label={`Open step ${i + 1}: ${s.label}`}
            />
          ))}
        </div>
        <small>
          Step {step + 1} of {steps.length} - {current.label}
        </small>
        <h2>{current.title}</h2>
        <p>{current.body}</p>
        <div className="tour-action-label">{current.action}</div>
        <div className="tour-actions">
          <Button variant="secondary" onClick={onClose}>
            Skip
          </Button>
          <button
            className="tour-next"
            onClick={() => (last ? onClose() : setStep((x) => x + 1))}
          >
            {last ? "Finish tour" : "Next step"}
          </button>
        </div>
      </div>
    </div>
  );
}
function AppLayout() {
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  useEffect(() => {
    if (localStorage.getItem("hirescore_tour_seen") === "1") return;
    const id = window.setTimeout(() => setTourOpen(true), 450);
    return () => window.clearTimeout(id);
  }, []);
  const closeTour = () => {
    localStorage.setItem("hirescore_tour_seen", "1");
    setTourOpen(false);
  };
  return (
    <div className="app-shell">
      <aside className={open ? "sidebar open" : "sidebar"}>
        <Logo />
        <button className="close-mobile" onClick={() => setOpen(false)}>
          <X />
        </button>
        <div className="profile">
          <img
            className="profile-logo"
            src="/kishvi-consulting-logo.png"
            alt="Kishvi Consulting logo"
          />
          <div>
            <b>HireScore Workspace</b>
            <small>Free recruiter plan</small>
          </div>
        </div>
        <nav>
          <NavLink to="/dashboard" data-tour="dashboard-nav">
            <LayoutDashboard />
            Dashboard
          </NavLink>
          <NavLink to="/companies" data-tour="clients-nav">
            <Building2 />
            Clients
          </NavLink>
          <NavLink to="/jd-library" data-tour="roles-nav">
            <Users />
            Roles & Resumes
          </NavLink>
          <NavLink to="/jd-library/new">
            <Plus />
            New Role
          </NavLink>
          <NavLink to="/jd-library/versions">
            <History />
            History
          </NavLink>
        </nav>
        <div className="sidebar-bottom">
          <UpgradeCard />
          <NavLink to="/settings">
            <Settings />
            Settings
          </NavLink>
          <button className="logout" onClick={logout}>
            <LogOut />
            Logout
          </button>
          <small>v0.1.0 - HireScore AI</small>
        </div>
      </aside>
      <div className="app-main">
        <header className="topbar">
          <button className="menu" onClick={() => setOpen(true)}>
            <Menu />
          </button>
          <div className="top-search">
            <Search />
            <input placeholder="Search roles, candidates, or companies..." />
          </div>
          <button
            className="tour-launch"
            data-tour="guide"
            onClick={() => setTourOpen(true)}
          >
            <Sparkles />
            Guide
          </button>
          <Bell />
          <div className="mini-avatar">
            <User />
          </div>
        </header>
        <main>
          <Outlet />
        </main>
      </div>
      <OnboardingTour open={tourOpen} onClose={closeTour} />
    </div>
  );
}
function PageHead({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
function Button({
  children,
  to,
  variant = "primary",
  type = "button",
  onClick,
  disabled,
  tourId,
}: {
  children: ReactNode;
  to?: string;
  variant?: string;
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
  tourId?: string;
}) {
  const n = useNavigate();
  return (
    <button
      className={`btn ${variant}`}
      type={type}
      onClick={() => (to ? n(to) : onClick?.())}
      disabled={disabled}
      data-tour={tourId}
    >
      {children}
    </button>
  );
}
function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`badge ${status}`}>
      {status === "active" && <i />}
      {status}
    </span>
  );
}
function Loader({ full = false }: { full?: boolean }) {
  return (
    <div className={full ? "loader full" : "loader"}>
      <span />
    </div>
  );
}
function Empty({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <FileText />
      </div>
      <h3>{title}</h3>
      <p>{body}</p>
      {action}
    </div>
  );
}
function Confirm({
  open,
  title,
  body,
  confirm = "Confirm",
  danger = false,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  body: string;
  confirm?: string;
  danger?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;
  return (
    <div className="modal-back">
      <div className="modal">
        <div className={danger ? "modal-icon danger" : "modal-icon"}>
          {danger ? <Archive /> : <RotateCcw />}
        </div>
        <h3>{title}</h3>
        <p>{body}</p>
        <div className="modal-actions">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={danger ? "danger" : "primary"}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirm}
          </Button>
        </div>
      </div>
    </div>
  );
}
function Login() {
  const a = useAuth(),
    n = useNavigate();
  const [email, setEmail] = useState("demo@company.com"),
    [password, setPassword] = useState("password"),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  if (a.loggedIn) return <Navigate to="/dashboard" replace />;
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await a.login(email, password);
      n("/dashboard");
    } catch (x) {
      setError(x instanceof Error ? x.message : "Unable to login");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="login-page">
      <div className="login-wrap">
        <span className="login-logo">
          <BrainCircuit />
        </span>
        <h1>HireScore AI</h1>
        <p>
          Free recruiter workspace for JDs, resume collection, and candidate
          tracking. Upgrade into the premium HireScore AI dashboard for the
          complete hiring flow.
        </p>
        <div className="login-proof">
          <span>
            <ShieldCheck size={16} /> Free to start
          </span>
          <span>
            <Sparkles size={16} /> AI upgrade ready
          </span>
          <span>
            <Users size={16} /> Complete hiring flow
          </span>
        </div>
        <form className="login-card" onSubmit={submit}>
          <label>
            Email Address
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. recruiter@company.com"
            />
          </label>
          <label>
            <span>
              Password <a>Forgot password?</a>
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error && <div className="form-error">{error}</div>}
          <button className="login-button" disabled={busy}>
            {busy ? "Signing in..." : "Open Hiring Dashboard"}
          </button>
          {!isSupabaseConfigured && (
            <div className="demo-note">
              <Sparkles size={15} /> Demo mode - use any email and password
            </div>
          )}
          <div className="request">
            Need the full AI hiring flow? <b>Upgrade inside HireScore AI</b>
          </div>
        </form>
        <footer>
          Privacy Policy | Terms of Service | Support
          <br />
          <span>2026 HireScore AI. Built for modern recruiting teams.</span>
        </footer>
      </div>
    </div>
  );
}

function Dashboard() {
  const { companies, jds, loading } = useData();
  if (loading) return <Loader />;
  const store = readResumeStore();
  const candidateTotal = jds.reduce(
    (n, j) => n + uploadedResumes(store, j.id).length,
    0,
  );
  const activeRoles = jds.filter((x) => x.status === "active").length;
  const topRole = jds[0];
  const preview = topRole
    ? candidateInsights(topRole, uploadedResumes(store, topRole.id)).slice(0, 3)
    : [];
  const cards = [
    ["Clients", companies.length, ""],
    ["Open roles", activeRoles, "green"],
    ["Candidates", candidateTotal, "blue"],
    ["Premium flow", "Pro", "purple"],
    ["Draft roles", jds.filter((x) => x.status === "draft").length, "amber"],
  ];
  return (
    <>
      <PageHead
        title="Hiring Dashboard"
        subtitle="A simple workspace for client setup, role creation, resume intake, and shortlist review."
        action={
          <div className="actions">
            <Button to="/companies/new" variant="secondary" tourId="add-client">
              <Building2 />
              Add Client
            </Button>
            <Button to="/jd-library/new" tourId="create-role">
              <Plus />
              Create Role
            </Button>
          </div>
        }
      />
      <section className="workflow-strip" aria-label="Recruiter workflow">
        <div className="workflow-step active">
          <span>1</span>
          <div>
            <b>Add client</b>
            <small>Create the company workspace.</small>
          </div>
        </div>
        <div className="workflow-step">
          <span>2</span>
          <div>
            <b>Create role</b>
            <small>Save JD, skills, and status.</small>
          </div>
        </div>
        <div className="workflow-step">
          <span>3</span>
          <div>
            <b>Upload resumes</b>
            <small>Attach files to the right role.</small>
          </div>
        </div>
        <div className="workflow-step">
          <span>4</span>
          <div>
            <b>Review shortlist</b>
            <small>Open candidates and decide next steps.</small>
          </div>
        </div>
      </section>
      <section className="ai-banner">
        <div>
          <span>
            <Sparkles size={16} /> HireScore AI Premium
          </span>
          <h2>Upgrade to the complete hiring flow in one dashboard.</h2>
          <p>
            Premium connects AI explanation, risk factors, recruiter-ready
            summaries, automated communication, interview scheduling, and
            shortlist decisions inside the main HireScore AI tool.
          </p>
        </div>
        <Button to="/settings" variant="upgrade">
          <Crown /> View Upgrade
        </Button>
      </section>
      <div className="stats">
        {cards.map((c) => (
          <div className={`stat ${c[2]}`} key={c[0]}>
            <small>{c[0]}</small>
            <b>{c[1]}</b>
          </div>
        ))}
      </div>
      <div className="dash-grid">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Premium Hiring Flow Preview</h2>
              <p>
                {topRole
                  ? `${topRole.job_title} automation`
                  : "Create a role to preview the premium flow"}
              </p>
            </div>
            <span className="locked-pill">
              <Crown size={13} /> Premium
            </span>
          </div>
          <div className="rank-list">
            {preview.map((c, i) => (
              <div className="rank-row" key={c.id}>
                <span>#{i + 1}</span>
                <div>
                  <b>{c.name}</b>
                  <small>{c.explanation}</small>
                </div>
                <strong>{c.score}</strong>
              </div>
            ))}
          </div>
        </section>
        <section className="panel">
          <div className="panel-head">
            <h2>Recent Hiring Roles</h2>
            <NavLink to="/jd-library">View All</NavLink>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Client</th>
                  <th>Candidates</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {jds.slice(0, 5).map((j) => (
                  <tr key={j.id}>
                    <td>
                      <NavLink to={`/jd-library/${j.id}`}>
                        <b>{j.job_title}</b>
                      </NavLink>
                    </td>
                    <td>{companyName(j, companies)}</td>
                    <td>{uploadedResumes(store, j.id).length}</td>
                    <td>
                      <StatusBadge status={j.status} />
                    </td>
                    <td>
                      <MoreVertical />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}

function Companies() {
  const { companies, jds } = useData();
  const [q, setQ] = useState("");
  const rows = companies.filter((c) =>
    `${c.name} ${c.industry} ${c.location}`
      .toLowerCase()
      .includes(q.toLowerCase()),
  );
  return (
    <>
      <PageHead
        title="Clients"
        subtitle="Manage clients, roles, and candidate intake."
        action={
          <Button to="/companies/new">
            <Plus />
            Add Client
          </Button>
        }
      />
      <div className="toolbar">
        <div className="search-field">
          <Search />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search companies..."
          />
        </div>
        <button className="select-look">
          All Industries <ChevronDown />
        </button>
        <button className="select-look">
          Status <ChevronDown />
        </button>
      </div>
      {!rows.length ? (
        <Empty
          title="No companies added yet"
          body="Add your first client to start managing hiring roles."
          action={<Button to="/companies/new">Add Company</Button>}
        />
      ) : (
        <div className="company-grid">
          {rows.map((c, i) => (
            <article className="company-card" key={c.id}>
              <div className="company-card-top">
                <div className={`company-logo large color-${i % 3}`}>
                  <Building2 />
                </div>
                <StatusBadge status={c.status} />
              </div>
              <h2>{c.name}</h2>
              <p>{c.industry}</p>
              <dl>
                <div>
                  <dt>Location</dt>
                  <dd>{c.location || "-"}</dd>
                </div>
                <div>
                  <dt>Website</dt>
                  <dd>{c.website || "-"}</dd>
                </div>
                <div>
                  <dt>Hiring Roles</dt>
                  <dd>
                    <b>{jds.filter((j) => j.company_id === c.id).length}</b>
                  </dd>
                </div>
              </dl>
              <Button to={`/companies/${c.id}`} variant="dark">
                View Details
              </Button>
            </article>
          ))}
        </div>
      )}
    </>
  );
}

function CompanyForm() {
  const { id } = useParams(),
    { companies, saveCompany } = useData(),
    n = useNavigate();
  const existing = companies.find((c) => c.id === id);
  const [form, setForm] = useState<Partial<Company>>(
      existing || { status: "active" },
    ),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const set = (k: keyof Company, v: string) =>
    setForm((x) => ({ ...x, [k]: v }));
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!form.name?.trim()) {
      setError("Company name is required.");
      return;
    }
    setBusy(true);
    const c = await saveCompany(form);
    n(`/companies/${c.id}`);
  }
  return (
    <>
      <PageHead
        title={existing ? "Edit Company" : "Add New Company"}
        subtitle={
          existing
            ? "Update company details and status."
            : "Create a client profile before adding hiring roles."
        }
      />
      <form className="form-card narrow" onSubmit={submit}>
        <div className="form-section">
          <h2>Company Information</h2>
          <p>Enter the basic information for this company.</p>
          <div className="form-grid">
            <Field label="Company Name *">
              <input
                value={form.name || ""}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Acme Corporation"
              />
            </Field>
            <Field label="Website">
              <input
                value={form.website || ""}
                onChange={(e) => set("website", e.target.value)}
                placeholder="https://company.com"
              />
            </Field>
            <Field label="Industry">
              <input
                value={form.industry || ""}
                onChange={(e) => set("industry", e.target.value)}
                placeholder="e.g. Technology"
              />
            </Field>
            <Field label="Location">
              <input
                value={form.location || ""}
                onChange={(e) => set("location", e.target.value)}
                placeholder="City, Country"
              />
            </Field>
            <Field label="Status">
              <select
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </Field>
          </div>
          {error && <div className="form-error">{error}</div>}
        </div>
        <div className="form-actions">
          <Button variant="secondary" onClick={() => n(-1)}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? "Saving..." : "Save Company"}
          </Button>
        </div>
      </form>
    </>
  );
}
function Field({
  label,
  children,
  wide = false,
  hint,
}: {
  label: string;
  children: ReactNode;
  wide?: boolean;
  hint?: string;
}) {
  return (
    <label className={wide ? "field wide" : "field"}>
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}

function CompanyDetail() {
  const { id } = useParams(),
    { companies, jds, cloneJD, archiveJD } = useData(),
    n = useNavigate();
  const [resumes, setResumes] = useState<
    Record<string, { name: string; size: number; uploadedAt: string }[]>
  >(() => {
    try {
      return JSON.parse(localStorage.getItem("jdm_candidate_resumes") || "{}");
    } catch {
      return {};
    }
  });
  useEffect(() => {
    localStorage.setItem("jdm_candidate_resumes", JSON.stringify(resumes));
  }, [resumes]);
  const uploadResume = (jd: JD, file?: File) => {
    if (!file) return;
    setResumes((x) => ({
      ...x,
      [jd.id]: [
        ...(x[jd.id] || []),
        {
          name: file.name,
          size: file.size,
          uploadedAt: new Date().toISOString(),
        },
      ],
    }));
  };
  const c = companies.find((x) => x.id === id);
  if (!c)
    return (
      <Empty
        title="Company not found"
        body="This company may have been removed."
      />
    );
  const linked = jds.filter((j) => j.company_id === id);
  return (
    <>
      <div className="detail-hero">
        <div className="company-logo xlarge">
          <Building2 />
        </div>
        <div>
          <StatusBadge status={c.status} />
          <h1>{c.name}</h1>
          <p>
            {c.industry} - {c.location}
          </p>
          <a href={c.website} target="_blank">
            {c.website}
          </a>
        </div>
        <div className="actions push">
          <Button to={`/companies/${c.id}/edit`} variant="secondary">
            <Pencil />
            Edit Company
          </Button>
          <Button to={`/jd-library/new?company=${c.id}`}>
            <Plus />
            Create Role
          </Button>
        </div>
      </div>
      <section className="panel details-panel">
        <div className="panel-head">
          <div>
            <h2>Hiring Roles</h2>
            <p>{linked.length} roles linked to this client</p>
          </div>
        </div>
        {linked.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Job title</th>
                  <th>Department</th>
                  <th>Work mode</th>
                  <th>Experience</th>
                  <th>Status</th>
                  <th>Version</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {linked.map((j) => (
                  <tr key={j.id}>
                    <td>
                      <b>{j.job_title}</b>
                    </td>
                    <td>{j.department}</td>
                    <td>{j.work_mode}</td>
                    <td>
                      {j.min_experience_years}-{j.max_experience_years} yrs
                    </td>
                    <td>
                      <StatusBadge status={j.status} />
                    </td>
                    <td>v{j.current_version}.0</td>
                    <td>
                      <div className="row-actions">
                        <button onClick={() => n(`/jd-library/${j.id}`)}>
                          View
                        </button>
                        <button onClick={() => n(`/jd-library/${j.id}/edit`)}>
                          Edit
                        </button>
                        <button
                          onClick={async () =>
                            n(`/jd-library/${(await cloneJD(j)).id}/edit`)
                          }
                        >
                          Clone
                        </button>
                        <label className="resume-upload">
                          <Upload size={14} /> Upload Resume
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={(e) => {
                              uploadResume(j, e.currentTarget.files?.[0]);
                              e.currentTarget.value = "";
                            }}
                          />
                        </label>
                        {!!resumes[j.id]?.length && (
                          <span className="resume-count">
                            {resumes[j.id].length}
                          </span>
                        )}
                        <button onClick={() => archiveJD(j)}>
                          {j.status === "archived" ? "Restore" : "Archive"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="No hiring roles yet"
            body="Create the first job description for this company."
            action={
              <Button to={`/jd-library/new?company=${c.id}`}>Create Role</Button>
            }
          />
        )}
      </section>
    </>
  );
}

function JDLibrary() {
  const { companies, jds, cloneJD, archiveJD } = useData(),
    n = useNavigate();
  const store = readResumeStore();
  const [q, setQ] = useState(""),
    [status, setStatus] = useState("");
  const rows = jds.filter(
    (j) =>
      (!status || j.status === status) &&
      `${j.job_title} ${j.required_skills.join(" ")}`
        .toLowerCase()
        .includes(q.toLowerCase()),
  );
  return (
    <>
      <PageHead
        title="Roles & Resumes"
        subtitle="Find each hiring role, check candidate totals, and open the right resume workflow."
        action={
          <Button to="/jd-library/new">
            <Plus />
            Create Role
          </Button>
        }
      />
      <div className="library-filters">
        <div className="search-field">
          <Search />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by job title or required skills..."
          />
        </div>
        <select onChange={(e) => setStatus(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
        <button className="select-look">
          More Filters <ChevronDown />
        </button>
        <div className="quick">
          <b>Quick access:</b>
          <span>Remote Roles</span>
          <span>Engineering</span>
          <span>Product Management</span>
          <span>Senior Level</span>
        </div>
      </div>
      {!rows.length ? (
        <Empty
          title="No hiring roles found"
          body="Try adjusting your search or create a new hiring role."
          action={<Button to="/jd-library/new">Create Role</Button>}
        />
      ) : (
        <div className="jd-grid">
          {rows.map((j) => (
            <article className="jd-card" key={j.id}>
              <div className="jd-title">
                <div>
                  <h2>
                    {j.job_title} <StatusBadge status={j.status} />
                  </h2>
                  <a>{companyName(j, companies)}</a>
                </div>
                <div>
                  <button
                    title="Clone"
                    onClick={async () =>
                      n(`/jd-library/${(await cloneJD(j)).id}/edit`)
                    }
                  >
                    <Copy />
                  </button>
                  <button title="More">
                    <MoreVertical />
                  </button>
                </div>
              </div>
              <div className="chips">
                {j.required_skills.slice(0, 4).map((s) => (
                  <span key={s}>{s}</span>
                ))}
              </div>
              <div className="jd-meta">
                <div>
                  <small>Experience</small>
                  <b>
                    {j.min_experience_years}-{j.max_experience_years} Years
                  </b>
                </div>
                <div>
                  <small>Candidates</small>
                  <b>{uploadedResumes(store, j.id).length}</b>
                </div>
                <div>
                  <small>Premium fit</small>
                  <b>{j.shortlist_score}%</b>
                </div>
              </div>
              <div className="jd-footer">
                <small>Last updated: {fmt(j.updated_at)}</small>
                <div>
                  <button onClick={() => n(`/jd-library/${j.id}/edit`)}>
                    Edit
                  </button>
                  <Button to={`/jd-library/${j.id}`} variant="dark">
                    View Details
                  </Button>
                </div>
              </div>
              {j.status === "archived" && (
                <button className="restore-link" onClick={() => archiveJD(j)}>
                  <RotateCcw /> Restore JD
                </button>
              )}
            </article>
          ))}
        </div>
      )}
    </>
  );
}

const emptyJD: Partial<JD> = {
  job_title: "",
  company_id: "",
  department: "",
  location: "",
  work_mode: "Remote",
  job_type: "Full-time",
  min_experience_years: 0,
  max_experience_years: 3,
  required_skills: [],
  nice_to_have_skills: [],
  responsibilities: "",
  qualifications: "",
  jd_text: "",
  shortlist_score: 70,
  status: "draft",
};
function TagInput({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
}) {
  const [text, setText] = useState("");
  return (
    <div className="tag-input">
      <div>
        {value.map((x) => (
          <span key={x}>
            {x}
            <button
              type="button"
              onClick={() => onChange(value.filter((v) => v !== x))}
            >
              x
            </button>
          </span>
        ))}
      </div>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === ",") && text.trim()) {
            e.preventDefault();
            onChange([...value, text.trim().replace(/,$/, "")]);
            setText("");
          }
        }}
        placeholder={placeholder}
      />
    </div>
  );
}
function JDForm() {
  const { id } = useParams(),
    { companies, jds, saveJD } = useData(),
    n = useNavigate();
  const query = new URLSearchParams(useLocation().search);
  const old = jds.find((j) => j.id === id);
  const [form, setForm] = useState<Partial<JD>>(
      () =>
        old || {
          ...emptyJD,
          company_id: query.get("company") || companies[0]?.id || "",
        },
    ),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const set = (k: keyof JD, v: unknown) => setForm((x) => ({ ...x, [k]: v }));
  if (!companies.length)
    return (
      <>
        <PageHead title="Create Job Description" />
        <Empty
          title="Please add a company before creating a JD."
          body="Every job description must belong to a company."
          action={<Button to="/companies/new">Add Company</Button>}
        />
      </>
    );
  async function save(status?: Status) {
    if (!form.company_id || !form.job_title?.trim()) {
      setError("Company and job title are required.");
      return;
    }
    setBusy(true);
    try {
      const item = await saveJD(
        { ...form, status: status || form.status },
        old ? "Edited job description" : "Initial version",
      );
      n(`/jd-library/${item.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save JD");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHead
        title={old ? "Edit Job Description" : "Create Job Description"}
        subtitle={
          old
            ? "Update the content below and save a new version."
            : "Build a reusable, structured job description."
        }
      />
      {old && (
        <div className="notice">
          <FileClock />
          Editing this JD will create a new version. Previous versions will
          remain saved.
        </div>
      )}
      <form
        className="form-card jd-form"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <div className="form-section">
          <h2>Basic Details</h2>
          <div className="form-grid">
            <Field label="Company *">
              <select
                value={form.company_id}
                onChange={(e) => set("company_id", e.target.value)}
              >
                <option value="">Select company</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Job Title *">
              <input
                value={form.job_title}
                onChange={(e) => set("job_title", e.target.value)}
                placeholder="e.g. Senior Product Designer"
              />
            </Field>
            <Field label="Department">
              <input
                value={form.department}
                onChange={(e) => set("department", e.target.value)}
                placeholder="e.g. Product Design"
              />
            </Field>
            <Field label="Location">
              <input
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
                placeholder="e.g. New York or Remote"
              />
            </Field>
            <Field label="Work Mode">
              <select
                value={form.work_mode}
                onChange={(e) => set("work_mode", e.target.value)}
              >
                <option>Remote</option>
                <option>Hybrid</option>
                <option>Onsite</option>
              </select>
            </Field>
            <Field label="Job Type">
              <select
                value={form.job_type}
                onChange={(e) => set("job_type", e.target.value)}
              >
                <option>Full-time</option>
                <option>Contract</option>
                <option>Internship</option>
              </select>
            </Field>
            <Field label="Minimum Experience">
              <input
                type="number"
                value={form.min_experience_years}
                onChange={(e) => set("min_experience_years", +e.target.value)}
              />
            </Field>
            <Field label="Maximum Experience">
              <input
                type="number"
                value={form.max_experience_years}
                onChange={(e) => set("max_experience_years", +e.target.value)}
              />
            </Field>
          </div>
        </div>
        <div className="form-section">
          <h2>Skills & Requirements</h2>
          <div className="form-grid">
            <Field
              label="Required Skills"
              wide
              hint="Press Enter to add a skill"
            >
              <TagInput
                value={form.required_skills || []}
                onChange={(v) => set("required_skills", v)}
                placeholder="Type a skill and press Enter"
              />
            </Field>
            <Field label="Nice-to-have Skills" wide>
              <TagInput
                value={form.nice_to_have_skills || []}
                onChange={(v) => set("nice_to_have_skills", v)}
                placeholder="Type a skill and press Enter"
              />
            </Field>
            <Field label="Key Responsibilities" wide>
              <textarea
                value={form.responsibilities}
                onChange={(e) => set("responsibilities", e.target.value)}
                rows={6}
              />
            </Field>
            <Field label="Qualifications" wide>
              <textarea
                value={form.qualifications}
                onChange={(e) => set("qualifications", e.target.value)}
                rows={6}
              />
            </Field>
            <Field label="Full JD Text" wide>
              <textarea
                value={form.jd_text}
                onChange={(e) => set("jd_text", e.target.value)}
                rows={9}
              />
            </Field>
            <Field label="Shortlist Score">
              <div className="score-input">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={form.shortlist_score}
                  onChange={(e) => set("shortlist_score", +e.target.value)}
                />
                <b>{form.shortlist_score}%</b>
              </div>
            </Field>
            <Field label="Status">
              <select
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </Field>
          </div>
          {error && <div className="form-error">{error}</div>}
        </div>
        <div className="form-actions">
          <Button variant="secondary" onClick={() => n(-1)}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={() => save("draft")}
            disabled={busy}
          >
            Save as Draft
          </Button>
          <Button onClick={() => save("active")} disabled={busy}>
            {busy ? "Saving..." : "Publish Role"}
          </Button>
        </div>
      </form>
    </>
  );
}

function JDDetail() {
  const { id } = useParams(),
    { companies, jds, cloneJD, archiveJD } = useData(),
    n = useNavigate();
  const [confirm, setConfirm] = useState(false),
    [listOpen, setListOpen] = useState(false),
    [downloadMsg, setDownloadMsg] = useState("");
  const [resumeStore] = useState<Record<string, ResumeRecord[]>>(() => {
    try {
      return JSON.parse(localStorage.getItem("jdm_candidate_resumes") || "{}");
    } catch {
      return {};
    }
  });
  const j = jds.find((x) => x.id === id);
  if (!j)
    return (
      <Empty
        title="Job description not found"
        body="The requested JD does not exist."
      />
    );
  const resumeRows = (resumeStore[j.id] || []).filter(
    (r) => r.status === "uploaded",
  );
  const uniqueResumeRows = resumeRows.filter(
    (r, i, a) =>
      i === a.findIndex((x) => (x.pathname || x.key) === (r.pathname || r.key)),
  );
  const candidateCount = uniqueResumeRows.length;
  const aiRows = candidateInsights(j, uniqueResumeRows);
  const downloadUrl = (r: ResumeRecord) =>
    `/api/resumes/download?pathname=${encodeURIComponent(r.pathname || "")}&filename=${encodeURIComponent(r.name)}`;
  async function downloadAllResumes() {
    setDownloadMsg("");
    const picker = (
      window as unknown as {
        showDirectoryPicker?: () => Promise<{
          getFileHandle: (
            name: string,
            options: { create: boolean },
          ) => Promise<{
            createWritable: () => Promise<{
              write: (data: Blob) => Promise<void>;
              close: () => Promise<void>;
            }>;
          }>;
        }>;
      }
    ).showDirectoryPicker;
    if (!picker) {
      setDownloadMsg(
        "Folder download is supported in Chrome or Edge. Use individual download buttons here.",
      );
      return;
    }
    const rows = uniqueResumeRows.filter((r) => r.pathname);
    if (!rows.length) {
      setDownloadMsg("No downloadable resumes found.");
      return;
    }
    try {
      const dir = await picker();
      let saved = 0;
      const used = new Set<string>();
      for (const r of rows) {
        const clean =
          r.name.replace(/[\\/:*?"<>|]+/g, "-").slice(0, 120) || "resume";
        if (used.has(clean.toLowerCase())) continue;
        used.add(clean.toLowerCase());
        const response = await fetch(downloadUrl(r));
        if (!response.ok) continue;
        const file = await response.blob();
        const handle = await dir.getFileHandle(clean, { create: true });
        const writable = await handle.createWritable();
        await writable.write(file);
        await writable.close();
        saved++;
      }
      setDownloadMsg(`${saved} resumes saved. Duplicates skipped.`);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setDownloadMsg(
        error instanceof Error ? error.message : "Could not save resumes.",
      );
    }
  }
  return (
    <>
      <div className="breadcrumb">
        <NavLink to="/jd-library">Roles & Resumes</NavLink>
        <span>{">"}</span>
        {j.job_title}
      </div>
      <div className="jd-hero">
        <div>
          <div className="eyebrow">
            <StatusBadge status={j.status} />
            <span className="version">Version {j.current_version}.0</span>
          </div>
          <h1>{j.job_title}</h1>
          <h2>
            <Building2 /> {companyName(j, companies)}
          </h2>
        </div>
        <div className="actions">
          <Button to={`/jd-library/${j.id}/edit`} variant="dark">
            <Pencil />
            Edit
          </Button>
          <Button
            variant="secondary"
            onClick={async () => n(`/jd-library/${(await cloneJD(j)).id}/edit`)}
          >
            <Copy />
            Clone
          </Button>
          <Button to={`/jd-library/${j.id}/versions`} variant="secondary">
            <Clock3 />
            History
          </Button>
          <Button variant="danger-icon" onClick={() => setConfirm(true)}>
            <Archive />
          </Button>
        </div>
      </div>
      <div className="detail-layout">
        <article className="document">
          <div className="overview-row">
            <div>
              <small>Experience</small>
              <b>
                {j.min_experience_years}-{j.max_experience_years} Years
              </b>
            </div>
            <div>
              <small>Work type</small>
              <b>{j.work_mode}</b>
            </div>
            <div>
              <small>Job type</small>
              <b>{j.job_type}</b>
            </div>
            <div>
              <small>Department</small>
              <b>{j.department || "-"}</b>
            </div>
          </div>
          <Section title="Job Overview">
            <p className="body-copy">
              {j.jd_text || "No overview has been added."}
            </p>
          </Section>
          <Section title="Required Skills">
            <div className="skill-pills">
              {j.required_skills.map((s) => (
                <span key={s}>{s}</span>
              ))}
            </div>
            {j.nice_to_have_skills.length > 0 && (
              <>
                <h3 className="subheading">Nice-to-have</h3>
                <div className="skill-pills muted">
                  {j.nice_to_have_skills.map((s) => (
                    <span key={s}>{s}</span>
                  ))}
                </div>
              </>
            )}
          </Section>
          <div className="two-col">
            <Section title="Key Responsibilities">
              <Lines text={j.responsibilities} />
            </Section>
            <Section title="Qualifications">
              <Lines text={j.qualifications} />
            </Section>
          </div>
        </article>
        <aside className="side-info">
          <div className="stats-card">
            <h2>Document Stats</h2>
            <dl>
              <div>
                <dt>Created Date</dt>
                <dd>{fmt(j.created_at)}</dd>
              </div>
              <div>
                <dt>Last Updated</dt>
                <dd>{fmt(j.updated_at)}</dd>
              </div>
              <div>
                <dt>Current Version</dt>
                <dd>v{j.current_version}.0</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>
                  <StatusBadge status={j.status} />
                </dd>
              </div>
            </dl>
            <hr />
            <div className="fit">
              <span>Shortlist fit score</span>
              <b>{j.shortlist_score}%</b>
            </div>
            <progress value={j.shortlist_score} max="100" />
          </div>
          <div className="resume-panel">
            <div className="resume-panel-head">
              <div>
                <h2>Candidate Resumes</h2>
                <p>
                  <b>{candidateCount}</b> total candidates
                </p>
              </div>
              <span className="resume-total">{candidateCount}</span>
            </div>
            <div className="resume-panel-actions">
              <button className="resume-tool" onClick={() => setListOpen(true)}>
                <List /> List Candidates
              </button>
              <button
                className="resume-tool"
                onClick={downloadAllResumes}
                disabled={!candidateCount}
              >
                <Download /> Select Folder
              </button>
            </div>
            {downloadMsg && (
              <small className="download-msg">{downloadMsg}</small>
            )}
            {!candidateCount && <small>No resumes uploaded yet.</small>}
          </div>
          <div className="ai-side-card">
            <div className="ai-side-head">
              <div>
                <span>
                  <Crown size={13} /> Premium AI
                </span>
                <h2>Hiring Flow Preview</h2>
              </div>
              <b>{aiRows[0]?.score || j.shortlist_score}</b>
            </div>
            <div className="ai-candidate-list">
              {aiRows.slice(0, 3).map((row, index) => (
                <div className="ai-candidate" key={row.id}>
                  <div className="score-ring">{row.score}</div>
                  <div>
                    <strong>
                      #{index + 1} {row.name}
                    </strong>
                    <small>{row.explanation}</small>
                    <div className="mini-chips">
                      {row.matched.map((skill) => (
                        <span key={skill}>{skill}</span>
                      ))}
                    </div>
                    {!!row.gaps.length && <em>Check: {row.gaps.join(", ")}</em>}
                  </div>
                </div>
              ))}
            </div>
            <Button to="/settings" variant="upgrade">
              <Sparkles /> Create AI Profiles
            </Button>
          </div>
          <div className="publish-card">
            <Gauge />
            <h2>
              {j.status === "active"
                ? "Published & Active"
                : "Ready to Publish?"}
            </h2>
            <p>
              Keep this description clear, compliant, and aligned with your
              hiring criteria.
            </p>
          </div>
        </aside>
      </div>
      {listOpen && (
        <div className="modal-back">
          <div className="modal resume-modal">
            <div className="resume-modal-head">
              <div>
                <h3>Candidate Resumes</h3>
                <p>{candidateCount} total candidates</p>
              </div>
              <button onClick={() => setListOpen(false)}>
                <X />
              </button>
            </div>
            {candidateCount ? (
              <div className="resume-list modal-list">
                {uniqueResumeRows.map((r) => (
                  <div
                    className="resume-item uploaded"
                    key={r.pathname || r.key}
                  >
                    <span>{r.name}</span>
                    {r.pathname ? (
                      <a className="download-link" href={downloadUrl(r)}>
                        <Download size={14} /> Download
                      </a>
                    ) : (
                      <em>Unavailable</em>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <small>No resumes uploaded yet.</small>
            )}
          </div>
        </div>
      )}
      <Confirm
        open={confirm}
        title={
          j.status === "archived" ? "Restore this JD?" : "Archive this JD?"
        }
        body="This does not delete the JD or its version history. You can restore it at any time."
        confirm={j.status === "archived" ? "Restore" : "Archive"}
        danger={j.status !== "archived"}
        onClose={() => setConfirm(false)}
        onConfirm={() => archiveJD(j)}
      />
    </>
  );
}
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="doc-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}
function Lines({ text }: { text: string }) {
  return (
    <ul className="line-list">
      {(text || "No details added.")
        .split("\n")
        .filter(Boolean)
        .map((x, i) => (
          <li key={i}>{x.replace(/^[-*]\s*/, "")}</li>
        ))}
    </ul>
  );
}

function Versions({ all = false }: { all?: boolean }) {
  const { id } = useParams(),
    { versions, jds, restoreVersion } = useData(),
    n = useNavigate();
  const [selected, setSelected] = useState<Version | null>(null);
  const rows =
    all || !id ? versions : versions.filter((v) => v.jd_template_id === id);
  return (
    <>
      <PageHead
        title={all ? "Version History" : "JD Version History"}
        subtitle="Review immutable snapshots and restore any version without losing history."
      />
      <section className="panel details-panel">
        {rows.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Version</th>
                  <th>Job title</th>
                  <th>Created date</th>
                  <th>Change note</th>
                  <th>JD hash</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((v) => (
                  <tr key={v.id}>
                    <td>
                      <span className="version">v{v.version_number}.0</span>
                    </td>
                    <td>
                      <b>
                        {v.jd_snapshot_json.job_title ||
                          jds.find((j) => j.id === v.jd_template_id)?.job_title}
                      </b>
                    </td>
                    <td>{fmt(v.created_at)}</td>
                    <td>{v.change_note}</td>
                    <td>
                      <code>{v.jd_hash.slice(0, 10)}...</code>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button
                          onClick={() => n(`/jd-library/${v.jd_template_id}`)}
                        >
                          View Version
                        </button>
                        <button onClick={() => setSelected(v)}>Restore</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="No version history yet"
            body="Versions are created automatically whenever a JD is created or edited."
          />
        )}
      </section>
      <Confirm
        open={!!selected}
        title="Restore this version?"
        body="Restoring this version will create a new active version. Previous versions will remain saved."
        confirm="Restore Version"
        onClose={() => setSelected(null)}
        onConfirm={async () => {
          if (selected) n(`/jd-library/${(await restoreVersion(selected)).id}`);
        }}
      />
    </>
  );
}
const safePart = (v: string) =>
  v
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90) || "item";
const resumeKey = (f: File) =>
  `${safePart(f.name)}-${f.size}-${f.lastModified}`;
async function runLimited<T>(
  items: T[],
  limit: number,
  work: (item: T) => Promise<void>,
) {
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (i < items.length) {
        const item = items[i++];
        await work(item);
      }
    }),
  );
}
async function blobStatus() {
  try {
    const r = await fetch("/api/resumes/status");
    const data = await r.json().catch(() => ({}));
    return {
      ok: r.ok && data.ok,
      error: data.error || `Blob status check failed (${r.status})`,
    };
  } catch (error) {
    return { ok: false, error: `Blob status check failed: ${String(error)}` };
  }
}
function CompanyDetailBlob() {
  const { id } = useParams(),
    { companies, jds, cloneJD, archiveJD } = useData(),
    n = useNavigate();
  const [resumes, setResumes] = useState<Record<string, ResumeRecord[]>>(() => {
    try {
      return JSON.parse(localStorage.getItem("jdm_candidate_resumes") || "{}");
    } catch {
      return {};
    }
  });
  const [uploading, setUploading] = useState<Record<string, string>>({});
  useEffect(() => {
    localStorage.setItem("jdm_candidate_resumes", JSON.stringify(resumes));
  }, [resumes]);
  const c = companies.find((x) => x.id === id);
  if (!c)
    return (
      <Empty
        title="Company not found"
        body="This company may have been removed."
      />
    );
  const linked = jds.filter((j) => j.company_id === id);
  const saveRecord = (jdId: string, record: ResumeRecord) =>
    setResumes((x) => ({
      ...x,
      [jdId]: [record, ...(x[jdId] || []).filter((r) => r.key !== record.key)],
    }));
  const uploadResumes = async (jd: JD, files: FileList | null) => {
    const picked = Array.from(files || []).filter((f) =>
      /\.(pdf|doc|docx)$/i.test(f.name),
    );
    if (!picked.length) return;
    let done = 0,
      skipped = 0,
      failed = 0;
    const existing = new Set((resumes[jd.id] || []).map((r) => r.key));
    const unique = picked.filter((file) => {
      const key = resumeKey(file);
      if (existing.has(key)) {
        skipped++;
        return false;
      }
      existing.add(key);
      return true;
    });
    const status = await blobStatus();
    if (!status.ok) {
      unique.forEach((file) =>
        saveRecord(jd.id, {
          key: resumeKey(file),
          name: file.name,
          size: file.size,
          uploadedAt: new Date().toISOString(),
          error: status.error,
          status: "failed",
        }),
      );
      setUploading((x) => ({
        ...x,
        [jd.id]: `0 uploaded • ${skipped} duplicate • ${unique.length} failed`,
      }));
      return;
    }
    setUploading((x) => ({
      ...x,
      [jd.id]: `Uploading ${unique.length} resume(s)…`,
    }));
    await runLimited(unique, 5, async (file) => {
      const key = resumeKey(file),
        pathname = `clients/${safePart(c.id)}-${safePart(c.name)}/jds/${safePart(jd.id)}-${safePart(jd.job_title)}/resumes/${key}`;
      try {
        const blob = await uploadBlob(pathname, file, {
          access: "private",
          handleUploadUrl: "/api/resumes/upload",
          multipart: file.size > 4_500_000,
          contentType: file.type || "application/octet-stream",
          clientPayload: JSON.stringify({
            companyId: c.id,
            companyName: c.name,
            jdId: jd.id,
            jdTitle: jd.job_title,
            fileKey: key,
            originalName: file.name,
            size: file.size,
            lastModified: file.lastModified,
          }),
        });
        done++;
        saveRecord(jd.id, {
          key,
          name: file.name,
          size: file.size,
          uploadedAt: new Date().toISOString(),
          url: blob.url,
          pathname: blob.pathname,
          status: "uploaded",
        });
      } catch (error) {
        const duplicate =
          String(error).toLowerCase().includes("already") ||
          String(error).toLowerCase().includes("exists") ||
          String(error).toLowerCase().includes("conflict") ||
          String(error).includes("409");
        if (duplicate) {
          skipped++;
          saveRecord(jd.id, {
            key,
            name: file.name,
            size: file.size,
            uploadedAt: new Date().toISOString(),
            status: "skipped",
          });
        } else {
          failed++;
          saveRecord(jd.id, {
            key,
            name: file.name,
            size: file.size,
            uploadedAt: new Date().toISOString(),
            error: String(error),
            status: "failed",
          });
        }
      }
      setUploading((x) => ({
        ...x,
        [jd.id]: `${done} uploaded - ${skipped} duplicate - ${failed} failed`,
      }));
    });
    setUploading((x) => ({
      ...x,
      [jd.id]: `${done} uploaded - ${skipped} duplicate - ${failed} failed`,
    }));
  };
  return (
    <>
      <div className="detail-hero">
        <div className="company-logo xlarge">
          <Building2 />
        </div>
        <div>
          <StatusBadge status={c.status} />
          <h1>{c.name}</h1>
          <p>
            {c.industry} - {c.location}
          </p>
          <a href={c.website} target="_blank">
            {c.website}
          </a>
        </div>
        <div className="actions push">
          <Button to={`/companies/${c.id}/edit`} variant="secondary">
            <Pencil />
            Edit Company
          </Button>
          <Button to={`/jd-library/new?company=${c.id}`}>
            <Plus />
            Create Role
          </Button>
        </div>
      </div>
      <section className="panel details-panel">
        <div className="panel-head">
          <div>
            <h2>Hiring Roles</h2>
            <p>{linked.length} roles linked to this client</p>
          </div>
        </div>
        {linked.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Job title</th>
                  <th>Department</th>
                  <th>Work mode</th>
                  <th>Experience</th>
                  <th>Status</th>
                  <th>Version</th>
                  <th>Candidates</th>
                  <th>Folder select</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {linked.map((j) => (
                  <tr key={j.id}>
                    <td>
                      <b>{j.job_title}</b>
                    </td>
                    <td>{j.department}</td>
                    <td>{j.work_mode}</td>
                    <td>
                      {j.min_experience_years}-{j.max_experience_years} yrs
                    </td>
                    <td>
                      <StatusBadge status={j.status} />
                    </td>
                    <td>v{j.current_version}.0</td>
                    <td>
                      <span className="applicant-total">
                        {
                          (resumes[j.id] || []).filter(
                            (r) => r.status === "uploaded",
                          ).length
                        }
                      </span>
                      {uploading[j.id] && (
                        <small className="upload-note">{uploading[j.id]}</small>
                      )}
                    </td>
                    <td>
                      <label className="folder-upload">
                        <FolderOpen size={14} /> Select Folder
                        <input
                          multiple
                          type="file"
                          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          {...({ webkitdirectory: "", directory: "" } as Record<
                            string,
                            string
                          >)}
                          onChange={(e) => {
                            uploadResumes(j, e.currentTarget.files);
                            e.currentTarget.value = "";
                          }}
                        />
                      </label>
                    </td>
                    <td>
                      <div className="row-actions jd-row-actions">
                        <button onClick={() => n(`/jd-library/${j.id}`)}>
                          View
                        </button>
                        <button onClick={() => n(`/jd-library/${j.id}/edit`)}>
                          Edit
                        </button>
                        <button
                          onClick={async () =>
                            n(`/jd-library/${(await cloneJD(j)).id}/edit`)
                          }
                        >
                          Clone
                        </button>
                        <button onClick={() => archiveJD(j)}>
                          {j.status === "archived" ? "Restore" : "Archive"}
                        </button>
                        <label className="resume-upload">
                          <Upload size={14} /> Upload Resume
                          <input
                            multiple
                            type="file"
                            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                            onChange={(e) => {
                              uploadResumes(j, e.currentTarget.files);
                              e.currentTarget.value = "";
                            }}
                          />
                        </label>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="No hiring roles yet"
            body="Create the first job description for this company."
            action={
              <Button to={`/jd-library/new?company=${c.id}`}>Create Role</Button>
            }
          />
        )}
      </section>
    </>
  );
}
function SettingsPage() {
  return (
    <>
      <PageHead
        title="Settings"
        subtitle="Manage workspace, billing readiness, and data connection."
      />
      <div className="form-card narrow">
        <div className="form-section">
          <h2>Workspace</h2>
          <p>HireScore AI - Free recruiter plan</p>
          <Field label="Data connection">
            <div className="connection">
              <i className={isSupabaseConfigured ? "on" : ""} />
              {isSupabaseConfigured
                ? "Connected to Supabase"
                : "Local demo mode"}
            </div>
          </Field>
          <Field label="Account">
            <input value="Recruiter Admin" readOnly />
          </Field>
          <div className="plan-panel">
            <div>
              <span>
                <Crown size={15} /> Upgrade path
              </span>
              <h3>HireScore AI Pro</h3>
              <p>
                Unlock AI explanations, risk factors, automated communication,
                recruiter-ready summaries, interview scheduling, shortlist
                decisions, and the premium hiring dashboard.
              </p>
            </div>
            <Button variant="upgrade">
              <Sparkles /> Enable Pro
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Protected />}>
            <Route element={<AppLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/companies" element={<Companies />} />
              <Route path="/companies/new" element={<CompanyForm />} />
              <Route path="/companies/:id" element={<CompanyDetailBlob />} />
              <Route path="/companies/:id/edit" element={<CompanyForm />} />
              <Route path="/jd-library" element={<JDLibrary />} />
              <Route path="/jd-library/new" element={<JDForm />} />
              <Route path="/jd-library/versions" element={<Versions all />} />
              <Route path="/jd-library/:id" element={<JDDetail />} />
              <Route path="/jd-library/:id/edit" element={<JDForm />} />
              <Route path="/jd-library/:id/versions" element={<Versions />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </DataProvider>
    </AuthProvider>
  );
}
