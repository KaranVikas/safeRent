// Static informational pages. Content is plain React — no backend.
// Hamilton/Ontario specifics verified against City of Hamilton and
// Ontario LTB sources (June 2026).

function Page({ title, children }) {
  return (
    <div className="mx-auto max-w-2xl px-5 py-8">
      <h1 className="font-display text-2xl font-extrabold">{title}</h1>
      <div className="mt-4 space-y-4 text-sm leading-relaxed text-ink/80">{children}</div>
    </div>
  );
}

function H2({ children }) {
  return <h2 className="mt-6 font-display text-lg font-bold text-ink">{children}</h2>;
}

export function FAQ() {
  return (
    <Page title="Help & tenant resources">
      <p className="rounded-lg bg-brick/10 px-4 py-3 text-brick">
        <strong>Emergencies first.</strong> If anyone is in danger — fire, gas leak, no heat
        in freezing weather, a break-in — call <strong>911</strong>. SafeRent is not an
        emergency service and does not contact anyone on your behalf.
      </p>

      <H2>What is SafeRent?</H2>
      <p>
        A map of housing-quality complaints across Hamilton, reported anonymously by tenants.
        It exists because many tenants fear retaliation for complaining. SafeRent shows only an
        address, the type of issue, and how many people reported it — never names, never your identity.
      </p>

      <H2>Is this a substitute for filing a real complaint?</H2>
      <p>
        No. SafeRent has no legal power. It can help you see patterns and feel less alone, but to
        get an issue <em>fixed</em> you generally need to use the official channels below.
      </p>

      <H2>Reporting a problem in Hamilton</H2>
      <p>
        <strong>1. Tell your landlord in writing first.</strong> Describe the problem, ask for a
        repair, and keep a dated copy. The City expects you to have done this before they investigate.
      </p>
      <p>
        <strong>2. Urgent health &amp; safety (e.g. inadequate heat):</strong> call the City of
        Hamilton Municipal Law Enforcement line at <strong>905-546-2782</strong> (Mon–Fri,
        8:30am–4:30pm) or <strong>905-546-2489</strong> after hours.
      </p>
      <p>
        <strong>3. Property-standards / by-law issues</strong> (plumbing, pests, structural):
        register a by-law complaint with the City — by phone, email, or the online complaint form.
        Your contact information is kept confidential by the City. Provide the address, dates,
        and a copy of the letter you sent your landlord.
      </p>

      <H2>Going to the Landlord and Tenant Board (LTB)</H2>
      <p>
        The LTB is Ontario's tribunal for landlord–tenant disputes under the{" "}
        <em>Residential Tenancies Act, 2006</em>. If your landlord won't fix serious maintenance
        problems after a written request, you can apply:
      </p>
      <ul className="ml-5 list-disc space-y-1">
        <li><strong>Form T6</strong> — for maintenance and repair problems.</li>
        <li><strong>Form T2</strong> — for tenant-rights violations like illegal entry or harassment.</li>
      </ul>
      <p>
        Forms and filing instructions are on the LTB's official website. For urgent health or
        safety issues, you can request an expedited hearing. Keep your lease, written requests,
        photos, and all correspondence as evidence.
      </p>

      <H2>Free help in Hamilton</H2>
      <ul className="ml-5 list-disc space-y-1">
        <li>
          <strong>Hamilton Community Legal Clinic</strong> — free legal help for tenants who qualify.
        </li>
        <li>
          <strong>ACORN Hamilton</strong> — a tenant-rights organization that supports renters.
        </li>
        <li>
          <strong>211 Ontario</strong> — call <strong>211</strong> for referrals to local housing
          and social services.
        </li>
      </ul>
      <p className="text-ink/50">
        SafeRent is independent and not affiliated with the City of Hamilton, the LTB, or any
        organization listed here.
      </p>
    </Page>
  );
}

export function Disclaimer() {
  return (
    <Page title="Disclaimer">
      <p><strong>Not legal advice.</strong> Nothing on SafeRent is legal advice. For advice about
        your situation, consult a lawyer, paralegal, or a legal clinic.</p>
      <p><strong>Not verified.</strong> Complaints are submitted anonymously and are not checked for
        accuracy by SafeRent. They reflect the opinions of individual submitters, not statements of
        fact by SafeRent. Treat them as unconfirmed reports.</p>
      <p><strong>Not an emergency service.</strong> SafeRent does not monitor submissions in real
        time and does not contact landlords, the City, or emergency services. In an emergency, call 911.</p>
      <p><strong>Addresses, not people.</strong> SafeRent describes buildings by address and issue
        type only. It does not publish, and does not permit, the names of landlords, property
        managers, or any individuals.</p>
    </Page>
  );
}

export function Privacy() {
  return (
    <Page title="Privacy policy">
      <p>SafeRent is built to protect the anonymity of tenants. Here is exactly what we do and don't do.</p>
      <H2>No accounts, no identities</H2>
      <p>You don't create an account or give a name, email, or phone number. To prevent duplicate
        confirmations and abuse, your browser holds an anonymous session cookie. On our servers we
        store only a one-way cryptographic hash of that session — never the raw value — so reports
        cannot be traced back to your browser even by us.</p>
      <H2>No IP logging</H2>
      <p>We do not log IP addresses alongside complaints. Temporary rate-limiting (to stop spam)
        operates in memory and is not stored with your submission.</p>
      <H2>Photos</H2>
      <p>If photo uploads are enabled in future, location and device metadata (EXIF) will be stripped
        before storage. (Photos are not part of the current version.)</p>
      <H2>Data retention</H2>
      <p>Anonymous session identifiers expire after about 30 days of inactivity. We don't sell or
        share data with third parties.</p>
      <H2>What's public</H2>
      <p>The address, issue type, optional description, timestamp, and confirmation counts of a
        complaint are public. Don't put anything in a description that could identify you.</p>
    </Page>
  );
}

export function Terms() {
  return (
    <Page title="Terms of use">
      <p>By using SafeRent you agree to the following. If you don't agree, please don't use it.</p>
      <H2>You must be 18 or older</H2>
      <p>SafeRent is intended for adults.</p>
      <H2>Submit honestly</H2>
      <p>You agree not to submit false or misleading complaints. You agree not to submit hate
        speech, threats, or the personal information of any individual — including landlord or
        property-manager names. Complaints describe buildings, not people.</p>
      <H2>Moderation</H2>
      <p>Anyone can flag a complaint they believe is false or misleading; flagged complaints are
        hidden pending review. We may remove any content at our discretion.</p>
      <H2>No warranty</H2>
      <p>SafeRent is provided "as is," without warranty. Complaints are unverified and SafeRent is
        not liable for how the information is used.</p>
      <H2>Copyright concerns</H2>
      <p>To report a copyright issue, contact the address on our contact page.</p>
    </Page>
  );
}
