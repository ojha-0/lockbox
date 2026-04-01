import Link from 'next/link'
import { ArrowRight, Code2, KeyRound, ShieldCheck, Workflow, Building2, FileCode2 } from 'lucide-react'

const integrationSteps = [
  {
    icon: KeyRound,
    title: '1. Organization Authentication',
    description: 'Authenticate your backend with verifier credentials to receive a JWT access token.',
    endpoint: 'POST /api/v1/auth/verifier/login',
  },
  {
    icon: Workflow,
    title: '2. Execute Verification',
    description: 'Call verification execute endpoint from your server and include the JWT token.',
    endpoint: 'POST /api/v1/verifications/execute',
  },
  {
    icon: ShieldCheck,
    title: '3. Enforce Decision',
    description: 'Use APPROVED/BLOCKED status and filtered data fields in your product workflow.',
    endpoint: 'GET /api/v1/verifications/history',
  },
]

const exampleLogin = `curl -X POST http://localhost:5000/api/v1/auth/verifier/login \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "hospital@demo.com",
    "password": "Verifier@123"
  }'`

const exampleVerify = `curl -X POST http://localhost:5000/api/v1/verifications/execute \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <verifier_access_token>" \\
  -d '{
    "national_id": "123456789012",
    "purpose": "Emergency admission"
  }'`

export default function DevelopersPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/20 bg-background/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-semibold text-foreground inline-flex items-center gap-2">
            <Building2 className="h-4 w-4 text-accent" />
            Lockbox Verify API
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/verifier/login" className="px-4 py-2 text-sm border rounded-lg border-border hover:border-accent/40">
              Organization Console
            </Link>
            <Link href="/citizen/login" className="px-4 py-2 text-sm border rounded-lg border-border hover:border-accent/40">
              Citizen Portal
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-14 space-y-12">
        <section className="space-y-5">
          <div className="inline-flex items-center gap-2 text-accent bg-accent/10 border border-accent/20 rounded-full px-4 py-2 text-sm font-medium">
            <Code2 className="h-4 w-4" />
            Persona-Style KYC as a Service
          </div>
          <h1 className="text-4xl md:text-5xl font-light leading-tight text-foreground">
            Let any software verify identity through your API
          </h1>
          <p className="text-muted-foreground max-w-3xl text-lg leading-relaxed">
            Lockbox acts as a central verification layer. External products call your API instead of building their own KYC stack. 
            Consent rules, document approval, and access auditing are enforced by the platform.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <span className="text-sm px-3 py-1.5 rounded-full border border-border bg-card">Role-based access control</span>
            <span className="text-sm px-3 py-1.5 rounded-full border border-border bg-card">Admin document approval</span>
            <span className="text-sm px-3 py-1.5 rounded-full border border-border bg-card">Consent grant/block/revoke</span>
            <span className="text-sm px-3 py-1.5 rounded-full border border-border bg-card">Policy-filtered response fields</span>
          </div>
        </section>

        <section className="grid md:grid-cols-3 gap-4">
          {integrationSteps.map((step) => (
            <article key={step.title} className="border border-border/40 rounded-2xl p-6 bg-card/40">
              <step.icon className="h-5 w-5 text-accent mb-4" />
              <h2 className="font-semibold text-foreground mb-2">{step.title}</h2>
              <p className="text-sm text-muted-foreground mb-3">{step.description}</p>
              <p className="text-xs font-mono text-accent">{step.endpoint}</p>
            </article>
          ))}
        </section>

        <section className="grid lg:grid-cols-2 gap-6">
          <article className="border border-border/40 rounded-2xl p-6 bg-card/40 space-y-4">
            <div className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
              <FileCode2 className="h-4 w-4 text-accent" />
              Example: Verifier Login
            </div>
            <pre className="overflow-x-auto rounded-xl bg-muted/40 p-4 text-xs text-foreground leading-relaxed">
{exampleLogin}
            </pre>
          </article>

          <article className="border border-border/40 rounded-2xl p-6 bg-card/40 space-y-4">
            <div className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
              <FileCode2 className="h-4 w-4 text-accent" />
              Example: Verification Execute
            </div>
            <pre className="overflow-x-auto rounded-xl bg-muted/40 p-4 text-xs text-foreground leading-relaxed">
{exampleVerify}
            </pre>
          </article>
        </section>

        <section className="border border-border/40 rounded-2xl p-6 bg-card/40">
          <h3 className="text-xl font-semibold text-foreground mb-2">Response behavior</h3>
          <ul className="text-muted-foreground text-sm space-y-2">
            <li>Verification is APPROVED only when biometric checks pass, consent is granted, and required fields are available in approved documents.</li>
            <li>If a business requests unsupported fields, the API returns BLOCKED with a document configuration message.</li>
            <li>Every verification call is audit logged for citizen visibility and compliance review.</li>
          </ul>
        </section>

        <section className="pt-2">
          <Link
            href="/verifier/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-accent-foreground font-medium hover:opacity-90 transition-opacity"
          >
            Start Integration in Organization Console
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </main>
    </div>
  )
}

