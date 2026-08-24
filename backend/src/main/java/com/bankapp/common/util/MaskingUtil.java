package com.bankapp.common.util;

/**
 * Masks sensitive identifiers (PAN, account numbers) for any response or log
 * line that isn't going to the data's verified owner (or an authorized,
 * audited officer/admin lookup). See docs/SECURITY.md.
 */
public final class MaskingUtil {

    private MaskingUtil() {
    }

    /**
     * Masks a PAN, leaving only the last 4 characters visible, e.g.
     * {@code "ABCPD1234F"} -> {@code "XXXXXX234F"}.
     */
    public static String maskPan(String pan) {
        if (pan == null) {
            return null;
        }
        int visibleChars = 4;
        if (pan.length() <= visibleChars) {
            return "X".repeat(pan.length());
        }
        String masked = "X".repeat(pan.length() - visibleChars);
        String visible = pan.substring(pan.length() - visibleChars);
        return masked + visible;
    }

    /**
     * Masks a bank account number, leaving only the last 4 digits visible,
     * e.g. {@code "1234567890123456"} -> {@code "XXXXXXXXXXXX3456"}.
     */
    public static String maskAccountNumber(String accountNumber) {
        if (accountNumber == null) {
            return null;
        }
        int visibleChars = 4;
        if (accountNumber.length() <= visibleChars) {
            return "X".repeat(accountNumber.length());
        }
        String masked = "X".repeat(accountNumber.length() - visibleChars);
        String visible = accountNumber.substring(accountNumber.length() - visibleChars);
        return masked + visible;
    }
}
