import { useMemo, useState } from "react";
import "./App.css";
import {
  adminSearchUserByName,
  adminSignIn,
  getAdminStats,
  logVisit,
  recoverAdminCredentialsByName,
  recoverUser,
  registerAdmin,
  registerUser,
  revokeAdmin,
} from "./api";

const logoUrl =
  "https://drive.google.com/thumbnail?id=1Kh_--f9wSeXyBB-hrf6y6nPQUzYsREgY&sz=w300";

const blankRegister = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  household: "",
  religion: "",
  foodPref: "",
  gender: "",
  race: "",
};

const blankAdminForm = {
  fullName: "",
  email: "",
  phone: "",
  role: "Admin",
  createdBy: "",
};

const screens = [
  "home",
  "register",
  "checkin",
  "recover",
  "success",
  "adminLogin",
  "adminPanel",
];

function formatError(error) {
  if (!error) return "Something went wrong. Please try again.";
  if (typeof error === "string") return error;
  return error.message || "Something went wrong. Please try again.";
}

function formatPhone(value) {
  let digits = String(value || "").replace(/\D/g, "");
  if (digits.length > 10) digits = digits.substring(0, 10);

  if (!digits) return "";
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.substring(0, 3)}) ${digits.substring(3)}`;
  return `(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}`;
}

function Message({ message }) {
  if (!message?.text) return null;
  return <div className={`result show ${message.type || "error"}`}>{message.text}</div>;
}

function BackHeader({ title, onBack }) {
  return (
    <header className="app-header">
      <button className="back-btn" type="button" onClick={onBack}>
        &larr; Back
      </button>
      <h2>{title}</h2>
    </header>
  );
}

function Field({ id, label, children }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
    </div>
  );
}

function DataBox({ children }) {
  if (!children) return null;
  return <div className="admin-data-box">{children}</div>;
}

function formatUsers(users = []) {
  return users
    .map((user, index) =>
      [
        `Result ${index + 1}`,
        `User ID: ${user.userId || ""}`,
        `Full Name: ${user.fullName || ""}`,
        `Email: ${user.email || ""}`,
        `Phone: ${user.phone || ""}`,
        `Status: ${user.status || ""}`,
        `Household: ${user.household || ""}`,
        `Religion: ${user.religion || ""}`,
        `Food Preference: ${user.foodPreference || ""}`,
        `Gender: ${user.gender || ""}`,
        `Race/Ethnicity: ${user.raceEthnicity || ""}`,
      ].join("\n"),
    )
    .join("\n\n--------------------\n\n");
}

function formatAdmins(admins = []) {
  return admins
    .map((admin, index) =>
      [
        `Result ${index + 1}`,
        `Staff ID: ${admin.staffId || ""}`,
        `Full Name: ${admin.fullName || ""}`,
        `Email: ${admin.email || ""}`,
        `Phone: ${admin.phone || ""}`,
        `Role: ${admin.role || ""}`,
        `Status: ${admin.status || ""}`,
      ].join("\n"),
    )
    .join("\n\n--------------------\n\n");
}

function ChartCard({ title, data = {}, type = "bar" }) {
  const entries = Object.entries(data).filter(([, value]) => Number(value) > 0);
  const total = entries.reduce((sum, [, value]) => sum + Number(value || 0), 0);
  const chartStyle = useMemo(() => {
    if (type === "bar" || !entries.length) return {};
    let cursor = 0;
    const colors = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#7c3aed", "#0891b2"];
    const slices = entries.map(([, value], index) => {
      const start = cursor;
      cursor += (Number(value) / total) * 100;
      return `${colors[index % colors.length]} ${start}% ${cursor}%`;
    });
    return { background: `conic-gradient(${slices.join(", ")})` };
  }, [entries, total, type]);

  return (
    <div className="chart-card">
      <strong>{title}</strong>
      {entries.length ? (
        type === "bar" ? (
          <div className="bar-chart">
            {entries.map(([label, value]) => (
              <div className="bar-row" key={label}>
                <span>{label}</span>
                <div className="bar-track">
                  <div style={{ width: `${Math.max((Number(value) / total) * 100, 4)}%` }} />
                </div>
                <b>{value}</b>
              </div>
            ))}
          </div>
        ) : (
          <div className="donut-wrap">
            <div className={`donut ${type}`} style={chartStyle}>
              <span>{total}</span>
            </div>
            <div className="legend-list">
              {entries.map(([label, value]) => (
                <div key={label}>
                  <span>{label}</span>
                  <b>{value}</b>
                </div>
              ))}
            </div>
          </div>
        )
      ) : (
        <div className="empty-chart">No data yet</div>
      )}
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState("home");
  const [busy, setBusy] = useState("");
  const [messages, setMessages] = useState({});
  const [registerForm, setRegisterForm] = useState(blankRegister);
  const [checkinId, setCheckinId] = useState("");
  const [recoverInput, setRecoverInput] = useState("");
  const [success, setSuccess] = useState(null);
  const [adminLoginForm, setAdminLoginForm] = useState({ email: "", passcode: "" });
  const [stats, setStats] = useState(null);
  const [searchName, setSearchName] = useState("");
  const [searchData, setSearchData] = useState("");
  const [adminForm, setAdminForm] = useState(blankAdminForm);
  const [recoverAdminName, setRecoverAdminName] = useState("");
  const [recoverAdminData, setRecoverAdminData] = useState("");
  const [revokeForm, setRevokeForm] = useState({ staffId: "", revokedBy: "" });
  const [otherModal, setOtherModal] = useState(null);
  const [otherValue, setOtherValue] = useState("");

  const showScreen = (id) => {
    setMessages({});
    setScreen(id);
  };

  const setMessage = (id, text, type = "error") => {
    setMessages((current) => ({ ...current, [id]: { text, type } }));
  };

  const goHome = () => showScreen("home");

  const resetApp = () => {
    setMessages({});
    setRegisterForm(blankRegister);
    setCheckinId("");
    setRecoverInput("");
    setAdminLoginForm({ email: "", passcode: "" });
    setSearchName("");
    setSearchData("");
    setAdminForm(blankAdminForm);
    setRecoverAdminName("");
    setRecoverAdminData("");
    setRevokeForm({ staffId: "", revokedBy: "" });
    setScreen("home");
  };

  const updateRegister = (field, value) => {
    setRegisterForm((current) => ({
      ...current,
      [field]: field === "phone" ? formatPhone(value) : value,
    }));
  };

  const chooseOther = (field, value) => {
    if (value === "Other") {
      setOtherModal(field);
      setOtherValue("");
      updateRegister(field, value);
      return;
    }
    updateRegister(field, value);
  };

  const saveOther = () => {
    const value = otherValue.trim();
    if (!value) return;
    updateRegister(otherModal, value);
    setOtherModal(null);
  };

  const loadStats = async () => {
    setMessage("statsResult", "");
    try {
      const res = await getAdminStats();
      if (res?.success && res.stats) {
        setStats(res.stats);
        setMessage("statsResult", "Statistics loaded.", "success");
      } else {
        setMessage("statsResult", res?.message || "Could not load statistics.");
      }
    } catch (error) {
      setMessage("statsResult", formatError(error));
    }
  };

  const submitRegister = async () => {
    setMessages({});
    if (!registerForm.gender || !registerForm.race) {
      setMessage("registerResult", "Gender and race/ethnicity are required.");
      return;
    }

    setBusy("register");
    try {
      const res = await registerUser(
        registerForm.firstName.trim(),
        registerForm.lastName.trim(),
        registerForm.email.trim(),
        registerForm.phone.trim(),
        registerForm.gender.trim(),
        registerForm.race.trim(),
        registerForm.household.trim(),
        registerForm.religion.trim(),
        registerForm.foodPref.trim(),
      );

      if (res?.success) {
        setSuccess(res);
        showScreen("success");
      } else {
        setMessage("registerResult", res?.message || "Registration failed.");
      }
    } catch (error) {
      setMessage("registerResult", formatError(error));
    } finally {
      setBusy("");
    }
  };

  const submitCheckin = async () => {
    setMessages({});
    setBusy("checkin");
    try {
      const res = await logVisit(checkinId.trim().toUpperCase(), "Manual ID", "Self");
      if (res?.success) {
        setMessage("checkinResult", `Welcome ${res.firstName} ${res.lastName}!`, "success");
        window.setTimeout(resetApp, 2500);
      } else {
        setMessage("checkinResult", res?.message || "Check-in failed.");
      }
    } catch (error) {
      setMessage("checkinResult", formatError(error));
    } finally {
      setBusy("");
    }
  };

  const submitRecover = async () => {
    setMessages({});
    setBusy("recover");
    try {
      const res = await recoverUser(recoverInput.trim());
      if (res?.success) {
        const name = [res.firstName, res.lastName].filter(Boolean).join(" ");
        setMessage(
          "recoverResult",
          name ? `${name} - Your ID is ${res.userId}` : `Your ID is ${res.userId}`,
          "success",
        );
      } else {
        setMessage("recoverResult", res?.message || "No account found.");
      }
    } catch (error) {
      setMessage("recoverResult", formatError(error));
    } finally {
      setBusy("");
    }
  };

  const submitAdminLogin = async () => {
    setMessages({});
    if (!adminLoginForm.email.trim() || !adminLoginForm.passcode.trim()) {
      setMessage("adminLoginResult", "Email and access code are required.");
      return;
    }

    setBusy("adminLogin");
    try {
      const res = await adminSignIn(adminLoginForm.email.trim(), adminLoginForm.passcode.trim());
      if (res?.success) {
        setMessage("adminLoginResult", "Access granted.", "success");
        setScreen("adminPanel");
        await loadStats();
      } else {
        setMessage("adminLoginResult", res?.message || "Sign in failed.");
      }
    } catch (error) {
      setMessage("adminLoginResult", formatError(error));
    } finally {
      setBusy("");
    }
  };

  const submitSearchUser = async () => {
    setMessage("searchUserResult", "");
    setSearchData("");
    if (!searchName.trim()) {
      setMessage("searchUserResult", "Enter a name.");
      return;
    }

    setBusy("searchUser");
    try {
      const res = await adminSearchUserByName(searchName.trim());
      if (res?.success) {
        setMessage("searchUserResult", `Found ${res.users.length} user(s).`, "success");
        setSearchData(formatUsers(res.users));
      } else {
        setMessage("searchUserResult", res?.message || "No user found.");
      }
    } catch (error) {
      setMessage("searchUserResult", formatError(error));
    } finally {
      setBusy("");
    }
  };

  const submitRegisterAdmin = async () => {
    setMessage("registerAdminResult", "");
    if (!adminForm.fullName.trim() || !adminForm.email.trim()) {
      setMessage("registerAdminResult", "Full name and email are required.");
      return;
    }

    setBusy("registerAdmin");
    try {
      const res = await registerAdmin(
        adminForm.fullName.trim(),
        adminForm.email.trim(),
        adminForm.phone.trim(),
        adminForm.role.trim(),
        adminForm.createdBy.trim(),
      );
      if (res?.success) {
        setMessage("registerAdminResult", `${res.message} Staff ID: ${res.staffId}`, "success");
        setAdminForm(blankAdminForm);
        await loadStats();
      } else {
        setMessage("registerAdminResult", res?.message || "Admin registration failed.");
      }
    } catch (error) {
      setMessage("registerAdminResult", formatError(error));
    } finally {
      setBusy("");
    }
  };

  const submitRecoverAdmin = async () => {
    setMessage("recoverAdminResult", "");
    setRecoverAdminData("");
    if (!recoverAdminName.trim()) {
      setMessage("recoverAdminResult", "Enter an admin name.");
      return;
    }

    setBusy("recoverAdmin");
    try {
      const res = await recoverAdminCredentialsByName(recoverAdminName.trim());
      if (res?.success) {
        setMessage("recoverAdminResult", `Found ${res.admins.length} admin record(s).`, "success");
        setRecoverAdminData(formatAdmins(res.admins));
      } else {
        setMessage("recoverAdminResult", res?.message || "No admin found.");
      }
    } catch (error) {
      setMessage("recoverAdminResult", formatError(error));
    } finally {
      setBusy("");
    }
  };

  const submitRevoke = async () => {
    setMessage("revokeAdminResult", "");
    if (!revokeForm.staffId.trim()) {
      setMessage("revokeAdminResult", "Staff ID is required.");
      return;
    }

    setBusy("revokeAdmin");
    try {
      const res = await revokeAdmin(revokeForm.staffId.trim(), revokeForm.revokedBy.trim());
      if (res?.success) {
        setMessage("revokeAdminResult", res.message, "success");
        setRevokeForm((current) => ({ ...current, staffId: "" }));
        await loadStats();
      } else {
        setMessage("revokeAdminResult", res?.message || "Could not revoke admin.");
      }
    } catch (error) {
      setMessage("revokeAdminResult", formatError(error));
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="app">
      {screens.map((id) => (
        <div
          aria-hidden={screen !== id}
          className={`screen ${screen === id ? "active" : ""} ${id === "home" ? "home-screen" : ""}`}
          id={id}
          key={id}
        >
          {id === "home" && (
            <div className="screen-content">
              <div className="badge">Community Support</div>
              <img src={logoUrl} alt="COP Food Rescue Logo" className="home-logo" />
              <h1>COP Food Rescue</h1>
              <p className="subtitle">Register, check in, or recover your ID to get started.</p>
              <div className="home-actions">
                <button type="button" className="btn-primary" onClick={() => showScreen("register")}>
                  Register New Account
                </button>
                <button type="button" className="btn-secondary" onClick={() => showScreen("checkin")}>
                  Check In with ID
                </button>
                <button type="button" className="btn-secondary" onClick={() => showScreen("adminLogin")}>
                  Admin Login
                </button>
                <button type="button" className="link-btn" onClick={() => showScreen("recover")}>
                  Forgot ID?
                </button>
              </div>
            </div>
          )}

          {id === "register" && (
            <>
              <BackHeader title="Register" onBack={goHome} />
              <div className="screen-content">
                <p className="subtitle">Enter your details to create your account.</p>
                <div className="form-group">
                  <div className="row-two">
                    <Field id="firstName" label="First Name">
                      <input
                        id="firstName"
                        value={registerForm.firstName}
                        onChange={(event) => updateRegister("firstName", event.target.value)}
                        autoComplete="given-name"
                        placeholder="e.g. Jane"
                      />
                    </Field>
                    <Field id="lastName" label="Last Name">
                      <input
                        id="lastName"
                        value={registerForm.lastName}
                        onChange={(event) => updateRegister("lastName", event.target.value)}
                        autoComplete="family-name"
                        placeholder="e.g. Doe"
                      />
                    </Field>
                  </div>
                  <Field id="email" label="Email">
                    <input
                      id="email"
                      type="email"
                      value={registerForm.email}
                      onChange={(event) => updateRegister("email", event.target.value)}
                      autoComplete="email"
                      placeholder="name@example.com"
                    />
                  </Field>
                  <Field id="phone" label="Phone Number">
                    <div className="phone-wrap">
                      <div className="phone-prefix">+1</div>
                      <input
                        id="phone"
                        className="phone-input"
                        type="tel"
                        inputMode="numeric"
                        value={registerForm.phone}
                        onChange={(event) => updateRegister("phone", event.target.value)}
                        autoComplete="tel-national"
                        placeholder="(780) 123-4567"
                        maxLength="14"
                      />
                    </div>
                  </Field>
                  <div className="row-two">
                    <Field id="household" label="Household Size">
                      <input
                        id="household"
                        type="number"
                        min="1"
                        value={registerForm.household}
                        onChange={(event) => updateRegister("household", event.target.value)}
                        placeholder="e.g. 4"
                      />
                    </Field>
                    <Field id="religion" label="Religion (Optional)">
                      <select
                        id="religion"
                        value={registerForm.religion}
                        onChange={(event) => chooseOther("religion", event.target.value)}
                      >
                        <option value="">Select religion</option>
                        <option value="Orthodox">Orthodox</option>
                        <option value="Catholic">Catholic</option>
                        <option value="Muslim">Muslim</option>
                        <option value="Pentecostal">Pentecostal</option>
                        <option value="Evangelical">Evangelical</option>
                        <option value="Hindu">Hindu</option>
                        <option value="Buddist">Buddist</option>
                        <option value="Other">Other</option>
                        {registerForm.religion &&
                          ![
                            "Orthodox",
                            "Catholic",
                            "Muslim",
                            "Pentecostal",
                            "Evangelical",
                            "Hindu",
                            "Buddist",
                            "Other",
                          ].includes(registerForm.religion) && (
                            <option value={registerForm.religion}>{registerForm.religion}</option>
                          )}
                      </select>
                    </Field>
                  </div>
                  <Field id="foodPref" label="Food Preference">
                    <select
                      id="foodPref"
                      value={registerForm.foodPref}
                      onChange={(event) => updateRegister("foodPref", event.target.value)}
                    >
                      <option value="">Select preference</option>
                      <option value="None">No Preference</option>
                      <option value="Halal">Halal</option>
                      <option value="Vegetarian">Vegetarian</option>
                      <option value="Vegan">Vegan</option>
                      <option value="Gluten-Free">Gluten-Free</option>
                    </select>
                  </Field>
                  <div className="row-two">
                    <Field id="gender" label="Gender">
                      <select
                        id="gender"
                        value={registerForm.gender}
                        onChange={(event) => chooseOther("gender", event.target.value)}
                      >
                        <option value="">Select gender</option>
                        <option value="Female">Female</option>
                        <option value="Male">Male</option>
                        <option value="Other">Other</option>
                        {registerForm.gender &&
                          !["Female", "Male", "Other"].includes(registerForm.gender) && (
                            <option value={registerForm.gender}>{registerForm.gender}</option>
                          )}
                      </select>
                    </Field>
                    <Field id="race" label="Race / Ethnicity">
                      <select
                        id="race"
                        value={registerForm.race}
                        onChange={(event) => chooseOther("race", event.target.value)}
                      >
                        <option value="">Select race / ethnicity</option>
                        <option value="Black">Black</option>
                        <option value="White">White</option>
                        <option value="Asian">Asian</option>
                        <option value="Indigenous">Indigenous</option>
                        <option value="Hispanic / Latino">Hispanic / Latino</option>
                        <option value="Middle Eastern">Middle Eastern</option>
                        <option value="Mixed">Mixed</option>
                        <option value="Other">Other</option>
                        {registerForm.race &&
                          ![
                            "Black",
                            "White",
                            "Asian",
                            "Indigenous",
                            "Hispanic / Latino",
                            "Middle Eastern",
                            "Mixed",
                            "Other",
                          ].includes(registerForm.race) && (
                            <option value={registerForm.race}>{registerForm.race}</option>
                          )}
                      </select>
                    </Field>
                  </div>
                </div>
                <Message message={messages.registerResult} />
              </div>
              <div className="action-bar">
                <button
                  type="button"
                  className="btn-primary"
                  disabled={busy === "register"}
                  onClick={submitRegister}
                >
                  {busy === "register" ? "Submitting..." : "Create Account"}
                </button>
              </div>
            </>
          )}

          {id === "checkin" && (
            <>
              <BackHeader title="Check In" onBack={goHome} />
              <div className="screen-content">
                <p className="subtitle">Log your visit quickly using your unique ID.</p>
                <div className="form-group">
                  <Field id="userId" label="User ID">
                    <input
                      id="userId"
                      value={checkinId}
                      onChange={(event) => setCheckinId(event.target.value)}
                      autoCapitalize="characters"
                      placeholder="e.g. COP-1234"
                    />
                  </Field>
                </div>
                <Message message={messages.checkinResult} />
              </div>
              <div className="action-bar">
                <button
                  type="button"
                  className="btn-primary"
                  disabled={busy === "checkin"}
                  onClick={submitCheckin}
                >
                  {busy === "checkin" ? "Checking In..." : "Check In"}
                </button>
              </div>
            </>
          )}

          {id === "recover" && (
            <>
              <BackHeader title="Recover ID" onBack={goHome} />
              <div className="screen-content">
                <p className="subtitle">We'll find your ID using your contact info.</p>
                <div className="form-group">
                  <Field id="recoverInput" label="Email or Phone Number">
                    <input
                      id="recoverInput"
                      value={recoverInput}
                      onChange={(event) => setRecoverInput(event.target.value)}
                      placeholder="name@example.com or phone"
                    />
                  </Field>
                </div>
                <Message message={messages.recoverResult} />
              </div>
              <div className="action-bar">
                <button
                  type="button"
                  className="btn-primary"
                  disabled={busy === "recover"}
                  onClick={submitRecover}
                >
                  {busy === "recover" ? "Recovering..." : "Find My ID"}
                </button>
              </div>
            </>
          )}

          {id === "success" && (
            <>
              <div className="screen-content success-content">
                <div className="center-copy">
                  <h2>Registration Complete!</h2>
                  <p className="subtitle">Your account is ready to use.</p>
                </div>
                <div className="success-box">
                  <div className="success-name">
                    {[success?.firstName, success?.lastName].filter(Boolean).join(" ")}
                  </div>
                  <div className="success-id">{success?.userId}</div>
                </div>
                <p className="save-note">
                  Screenshot this screen or save your ID so you can easily check in next time.
                </p>
              </div>
              <div className="action-bar">
                <button type="button" className="btn-primary" onClick={resetApp}>
                  Done
                </button>
              </div>
            </>
          )}

          {id === "adminLogin" && (
            <>
              <BackHeader title="Admin Sign In" onBack={goHome} />
              <div className="screen-content">
                <p className="subtitle">Enter your admin email and access code.</p>
                <div className="form-group">
                  <Field id="adminLoginEmail" label="Admin Email">
                    <input
                      id="adminLoginEmail"
                      type="email"
                      value={adminLoginForm.email}
                      onChange={(event) =>
                        setAdminLoginForm((current) => ({ ...current, email: event.target.value }))
                      }
                      placeholder="admin@example.com"
                    />
                  </Field>
                  <Field id="adminLoginPasscode" label="Access Code">
                    <input
                      id="adminLoginPasscode"
                      type="password"
                      value={adminLoginForm.passcode}
                      onChange={(event) =>
                        setAdminLoginForm((current) => ({ ...current, passcode: event.target.value }))
                      }
                      placeholder="Enter access code"
                    />
                  </Field>
                </div>
                <Message message={messages.adminLoginResult} />
              </div>
              <div className="action-bar">
                <button
                  type="button"
                  className="btn-primary"
                  disabled={busy === "adminLogin"}
                  onClick={submitAdminLogin}
                >
                  {busy === "adminLogin" ? "Signing In..." : "Sign In"}
                </button>
              </div>
            </>
          )}

          {id === "adminPanel" && (
            <>
              <BackHeader title="Admin Panel" onBack={goHome} />
              <div className="screen-content">
                <div className="admin-shell">
                  <section className="admin-section">
                    <div className="admin-section-header">
                      <h3>Overview</h3>
                      <p>Quick summary of users, activity, and visits.</p>
                    </div>
                    <div className="admin-stats-grid">
                      <div className="admin-stat-box">
                        <div className="admin-stat-label">Total Users</div>
                        <div className="admin-stat-value">{stats?.totalUsers ?? "-"}</div>
                      </div>
                      <div className="admin-stat-box">
                        <div className="admin-stat-label">Active Users</div>
                        <div className="admin-stat-value">{stats?.activeUsers ?? "-"}</div>
                      </div>
                      <div className="admin-stat-box">
                        <div className="admin-stat-label">Total Visits</div>
                        <div className="admin-stat-value">{stats?.totalVisits ?? "-"}</div>
                      </div>
                    </div>
                  </section>

                  <section className="admin-section">
                    <div className="admin-section-header">
                      <h3>Admin Actions</h3>
                      <p>Search users, manage admins, recover details, and revoke access.</p>
                    </div>
                    <div className="admin-grid">
                      <div className="admin-card">
                        <h3>Search User by Name</h3>
                        <p className="admin-card-text">
                          Find a registered user and view contact and demographic details.
                        </p>
                        <div className="form-group">
                          <Field id="searchUserName" label="Full Name or Part of Name">
                            <input
                              id="searchUserName"
                              value={searchName}
                              onChange={(event) => setSearchName(event.target.value)}
                              placeholder="e.g. Jane Doe"
                            />
                          </Field>
                          <button
                            type="button"
                            className="btn-primary"
                            disabled={busy === "searchUser"}
                            onClick={submitSearchUser}
                          >
                            {busy === "searchUser" ? "Searching..." : "Search User"}
                          </button>
                        </div>
                        <Message message={messages.searchUserResult} />
                        <DataBox>{searchData}</DataBox>
                      </div>

                      <div className="admin-card">
                        <h3>Register Admin</h3>
                        <p className="admin-card-text">Create a new admin or staff account.</p>
                        <div className="form-group">
                          <div className="row-two">
                            <Field id="adminFullName" label="Full Name">
                              <input
                                id="adminFullName"
                                value={adminForm.fullName}
                                onChange={(event) =>
                                  setAdminForm((current) => ({
                                    ...current,
                                    fullName: event.target.value,
                                  }))
                                }
                                placeholder="e.g. Mary Johnson"
                              />
                            </Field>
                            <Field id="adminRole" label="Role">
                              <select
                                id="adminRole"
                                value={adminForm.role}
                                onChange={(event) =>
                                  setAdminForm((current) => ({
                                    ...current,
                                    role: event.target.value,
                                  }))
                                }
                              >
                                <option value="Admin">Admin</option>
                                <option value="Super Admin">Super Admin</option>
                                <option value="Staff">Staff</option>
                              </select>
                            </Field>
                          </div>
                          <div className="row-two">
                            <Field id="adminEmail" label="Email">
                              <input
                                id="adminEmail"
                                type="email"
                                value={adminForm.email}
                                onChange={(event) =>
                                  setAdminForm((current) => ({
                                    ...current,
                                    email: event.target.value,
                                  }))
                                }
                                placeholder="name@example.com"
                              />
                            </Field>
                            <Field id="adminPhone" label="Phone">
                              <input
                                id="adminPhone"
                                value={adminForm.phone}
                                onChange={(event) =>
                                  setAdminForm((current) => ({
                                    ...current,
                                    phone: event.target.value,
                                  }))
                                }
                                placeholder="7801234567"
                              />
                            </Field>
                          </div>
                          <Field id="createdBy" label="Created By">
                            <input
                              id="createdBy"
                              value={adminForm.createdBy}
                              onChange={(event) =>
                                setAdminForm((current) => ({
                                  ...current,
                                  createdBy: event.target.value,
                                }))
                              }
                              placeholder="e.g. Super Admin"
                            />
                          </Field>
                          <button
                            type="button"
                            className="btn-primary"
                            disabled={busy === "registerAdmin"}
                            onClick={submitRegisterAdmin}
                          >
                            {busy === "registerAdmin" ? "Registering..." : "Register Admin"}
                          </button>
                        </div>
                        <Message message={messages.registerAdminResult} />
                      </div>

                      <div className="admin-card">
                        <h3>Recover Admin Credentials</h3>
                        <p className="admin-card-text">
                          Search for admin records by name and retrieve details.
                        </p>
                        <div className="form-group">
                          <Field id="recoverAdminName" label="Admin Name">
                            <input
                              id="recoverAdminName"
                              value={recoverAdminName}
                              onChange={(event) => setRecoverAdminName(event.target.value)}
                              placeholder="e.g. Mary"
                            />
                          </Field>
                          <button
                            type="button"
                            className="btn-primary"
                            disabled={busy === "recoverAdmin"}
                            onClick={submitRecoverAdmin}
                          >
                            {busy === "recoverAdmin" ? "Searching..." : "Recover Admin Info"}
                          </button>
                        </div>
                        <Message message={messages.recoverAdminResult} />
                        <DataBox>{recoverAdminData}</DataBox>
                      </div>

                      <div className="admin-card">
                        <h3>Revoke Admin Access</h3>
                        <p className="admin-card-text">Change an admin account status to revoked.</p>
                        <div className="form-group">
                          <div className="row-two">
                            <Field id="revokeStaffId" label="Staff ID">
                              <input
                                id="revokeStaffId"
                                value={revokeForm.staffId}
                                onChange={(event) =>
                                  setRevokeForm((current) => ({
                                    ...current,
                                    staffId: event.target.value,
                                  }))
                                }
                                placeholder="e.g. ADM-MJ260408-1234"
                              />
                            </Field>
                            <Field id="revokedBy" label="Revoked By">
                              <input
                                id="revokedBy"
                                value={revokeForm.revokedBy}
                                onChange={(event) =>
                                  setRevokeForm((current) => ({
                                    ...current,
                                    revokedBy: event.target.value,
                                  }))
                                }
                                placeholder="e.g. Super Admin"
                              />
                            </Field>
                          </div>
                          <button
                            type="button"
                            className="btn-danger"
                            disabled={busy === "revokeAdmin"}
                            onClick={submitRevoke}
                          >
                            {busy === "revokeAdmin" ? "Revoking..." : "Revoke Access"}
                          </button>
                        </div>
                        <Message message={messages.revokeAdminResult} />
                      </div>
                    </div>
                  </section>

                  <section className="admin-section">
                    <div className="admin-section-header">
                      <h3>Analytics</h3>
                      <p>Breakdowns across demographics, preferences, and account status.</p>
                    </div>
                    <Message message={messages.statsResult} />
                    <div className="chart-grid">
                      <ChartCard title="Gender Breakdown" data={stats?.genderBreakdown} type="pie" />
                      <ChartCard title="Food Preference Breakdown" data={stats?.foodPreferenceBreakdown} />
                      <ChartCard title="Religion Breakdown" data={stats?.religionBreakdown} />
                      <ChartCard title="Household Size Breakdown" data={stats?.householdBreakdown} />
                      <ChartCard title="Race / Ethnicity Breakdown" data={stats?.raceBreakdown} />
                      <ChartCard title="User Status Breakdown" data={stats?.statusBreakdown} type="doughnut" />
                    </div>
                  </section>
                </div>
              </div>
            </>
          )}
        </div>
      ))}

      {otherModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <h3>Please specify</h3>
            <input
              value={otherValue}
              onChange={(event) => setOtherValue(event.target.value)}
              placeholder="Enter your answer"
              autoFocus
            />
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setOtherModal(null)}>
                Cancel
              </button>
              <button type="button" className="btn-primary" onClick={saveOther}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
