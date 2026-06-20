import { AppShell } from "@/components/AppShell";

const sections = [
  {
    title: "Company Branding",
    fields: [["Company Name", "Everhart Advisors"], ["Primary Color", "#005596"], ["Accent Color", "#F08A5C"]]
  },
  {
    title: "Default Booking Link",
    fields: [["Scheduling URL", "https://everhartadvisors.com/contact"], ["CTA Label", "Schedule a Plan Review"]]
  },
  {
    title: "Report Defaults",
    fields: [["Default Template", "Everhart 401(k) Report Template"], ["Output Format", "PDF and DOCX"], ["Disclosure Label", "Data sourced from Form 5500 filing"]]
  },
  {
    title: "Export Settings",
    fields: [["File Naming", "company_401k_plan_review"], ["History Save", "Enabled"]]
  },
  {
    title: "User Profile",
    fields: [["Name", "Jane Doe"], ["Firm", "Everhart Advisors"], ["Role", "Plan Advisor"]]
  }
];

export default function SettingsPage() {
  return (
    <AppShell>
      <h1 className="text-3xl font-bold text-slate-950">Settings</h1>
      <p className="mt-2 text-slate-500">Configure static MVP defaults for branding, reports, exports, and profile details.</p>
      <div className="mt-8 grid grid-cols-2 gap-5">
        {sections.map((section) => (
          <section key={section.title} className="card p-6">
            <h2 className="text-xl font-bold text-slate-900">{section.title}</h2>
            <div className="mt-5 space-y-4">
              {section.fields.map(([label, value]) => (
                <label key={label} className="block">
                  <span className="text-sm font-semibold text-slate-600">{label}</span>
                  <input className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-everhart-blue" defaultValue={value} />
                </label>
              ))}
            </div>
          </section>
        ))}
      </div>
    </AppShell>
  );
}
