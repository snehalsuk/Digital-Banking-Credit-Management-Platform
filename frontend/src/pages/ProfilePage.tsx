import { useEffect, useState, type FormEvent } from "react";
import * as customerApi from "../api/customerApi";
import type { CustomerProfileRequest, CustomerProfileResponse } from "../types/customer";

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
  const [form, setForm] = useState<CustomerProfileRequest>(emptyForm);
  const [existing, setExisting] = useState<CustomerProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

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
    setSaved(false);
    setSaving(true);
    try {
      const updated = await customerApi.updateMyProfile(form);
      setExisting(updated);
      setSaved(true);
    } catch {
      setError("Could not save profile. Check that all fields are valid (PAN must be in the format AAAAA9999A).");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p>Loading profile...</p>;
  }

  return (
    <div className="profile-page">
      <h1>KYC Profile</h1>
      {existing && <p>Current KYC status: <strong>{existing.kycStatus}</strong></p>}
      <form onSubmit={handleSubmit}>
        <label>
          Full name
          <input value={form.fullName} onChange={(e) => updateField("fullName", e.target.value)} required />
        </label>
        <label>
          Date of birth
          <input type="date" value={form.dob} onChange={(e) => updateField("dob", e.target.value)} required />
        </label>
        <label>
          PAN
          <input
            value={form.pan}
            onChange={(e) => updateField("pan", e.target.value.toUpperCase())}
            pattern="^[A-Z]{5}[0-9]{4}[A-Z]$"
            maxLength={10}
            placeholder="AAAAA9999A"
            required
          />
          <small>
            Your PAN is encrypted at rest (AES-256-GCM) and is only ever shown unmasked to you. It is used only to
            uniquely identify you for banking and credit lookups.
          </small>
        </label>
        <label>
          Address line 1
          <input value={form.addressLine1} onChange={(e) => updateField("addressLine1", e.target.value)} />
        </label>
        <label>
          Address line 2
          <input value={form.addressLine2} onChange={(e) => updateField("addressLine2", e.target.value)} />
        </label>
        <label>
          City
          <input value={form.city} onChange={(e) => updateField("city", e.target.value)} />
        </label>
        <label>
          State
          <input value={form.state} onChange={(e) => updateField("state", e.target.value)} />
        </label>
        <label>
          Pincode
          <input value={form.pincode} onChange={(e) => updateField("pincode", e.target.value)} />
        </label>
        <label>
          Phone
          <input value={form.phone} onChange={(e) => updateField("phone", e.target.value)} />
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={form.consentGiven}
            onChange={(e) => updateField("consentGiven", e.target.checked)}
          />
          I consent to my KYC and PAN details being stored and used for banking and credit-score purposes.
        </label>
        {error && <p className="form-error">{error}</p>}
        {saved && <p className="form-success">Profile saved.</p>}
        <button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save profile"}
        </button>
      </form>
    </div>
  );
}
