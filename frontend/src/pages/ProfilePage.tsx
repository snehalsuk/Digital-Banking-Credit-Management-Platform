import { useEffect, useState, type FormEvent } from "react";
import * as customerApi from "../api/customerApi";
import type { CustomerProfileRequest, CustomerProfileResponse } from "../types/customer";
import { PageHeader } from "../components/common/PageHeader";
import { Card } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { Checkbox, Input } from "../components/common/FormField";
import { StatusPill } from "../components/common/StatusPill";
import { AlertIcon, LockIcon } from "../components/common/Icon";
import { useToast } from "../components/common/ToastContext";

const emptyForm: CustomerProfileRequest = {
  fullName: "",
  dob: "",
  pan: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  pincode: "",
  phone: "",
  consentGiven: false,
};

export function ProfilePage() {
  const toast = useToast();
  const [form, setForm] = useState<CustomerProfileRequest>(emptyForm);
  const [existing, setExisting] = useState<CustomerProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    customerApi
      .getMyProfile()
      .then((profile) => {
        if (cancelled) return;
        setExisting(profile);
        setForm({
          fullName: profile.fullName,
          dob: profile.dob,
          pan: profile.pan,
          addressLine1: profile.addressLine1 ?? "",
          addressLine2: profile.addressLine2 ?? "",
          city: profile.city ?? "",
          state: profile.state ?? "",
          pincode: profile.pincode ?? "",
          phone: profile.phone ?? "",
          consentGiven: profile.consentGiven,
        });
      })
      .catch(() => {
        // No profile yet — that's fine, the form starts blank for a first-time KYC submission.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function updateField<K extends keyof CustomerProfileRequest>(key: K, value: CustomerProfileRequest[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const updated = await customerApi.updateMyProfile(form);
      setExisting(updated);
      toast.success("Profile saved.");
    } catch {
      setError("Could not save profile. Check that all fields are valid (PAN must be in the format AAAAA9999A).");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="KYC Profile" />
        <Card>
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 rounded-lg bg-neutral-100" />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="KYC Profile"
        description="Keep your identity details up to date — this is what powers account opening, loans, and credit checks."
        action={existing && <StatusPill status={existing.kycStatus} />}
      />

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Card>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-500">Identity</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Full name"
              value={form.fullName}
              onChange={(e) => updateField("fullName", e.target.value)}
              required
              wrapperClassName="sm:col-span-2"
            />
            <Input
              label="Date of birth"
              type="date"
              value={form.dob}
              onChange={(e) => updateField("dob", e.target.value)}
              required
            />
            <Input
              label="PAN"
              value={form.pan}
              onChange={(e) => updateField("pan", e.target.value.toUpperCase())}
              pattern="^[A-Z]{5}[0-9]{4}[A-Z]$"
              maxLength={10}
              placeholder="AAAAA9999A"
              required
              startAdornment={<LockIcon size={15} />}
              helperText="Encrypted at rest (AES-256-GCM). Used only to identify you for banking and credit lookups."
            />
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-500">Address</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Address line 1"
              value={form.addressLine1}
              onChange={(e) => updateField("addressLine1", e.target.value)}
              wrapperClassName="sm:col-span-2"
            />
            <Input
              label="Address line 2"
              value={form.addressLine2}
              onChange={(e) => updateField("addressLine2", e.target.value)}
              wrapperClassName="sm:col-span-2"
            />
            <Input label="City" value={form.city} onChange={(e) => updateField("city", e.target.value)} />
            <Input label="State" value={form.state} onChange={(e) => updateField("state", e.target.value)} />
            <Input label="Pincode" value={form.pincode} onChange={(e) => updateField("pincode", e.target.value)} />
            <Input label="Phone" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} />
          </div>
        </Card>

        <Card>
          <Checkbox
            label="I consent to my KYC and PAN details being stored and used for banking and credit-score purposes."
            checked={form.consentGiven}
            onChange={(e) => updateField("consentGiven", e.target.checked)}
          />
        </Card>

        {error && (
          <div className="flex items-start gap-2 rounded-lg bg-danger-50 px-3.5 py-2.5 text-sm text-danger-700">
            <AlertIcon size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <Button type="submit" loading={saving} size="lg">
            Save profile
          </Button>
        </div>
      </form>
    </div>
  );
}
