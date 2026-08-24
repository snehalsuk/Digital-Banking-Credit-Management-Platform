package com.bankapp.common.util;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class MaskingUtilTest {

    @Test
    void maskPan_standardTenCharacterPan_leavesLast4Visible() {
        assertThat(MaskingUtil.maskPan("ABCPD1234F")).isEqualTo("XXXXXX234F");
    }

    @Test
    void maskPan_nullInput_returnsNull() {
        assertThat(MaskingUtil.maskPan(null)).isNull();
    }

    @Test
    void maskPan_shorterThanOrEqualToVisibleWindow_isFullyMasked() {
        assertThat(MaskingUtil.maskPan("ABCD")).isEqualTo("XXXX");
        assertThat(MaskingUtil.maskPan("AB")).isEqualTo("XX");
        assertThat(MaskingUtil.maskPan("")).isEqualTo("");
    }

    @Test
    void maskPan_fiveCharacters_masksAllButLast4() {
        assertThat(MaskingUtil.maskPan("ABCDE")).isEqualTo("XBCDE");
    }

    @Test
    void maskAccountNumber_typicalSixteenDigitNumber_leavesLast4Visible() {
        assertThat(MaskingUtil.maskAccountNumber("1234567890123456")).isEqualTo("XXXXXXXXXXXX3456");
    }

    @Test
    void maskAccountNumber_nullInput_returnsNull() {
        assertThat(MaskingUtil.maskAccountNumber(null)).isNull();
    }

    @Test
    void maskAccountNumber_shortInput_isFullyMasked() {
        assertThat(MaskingUtil.maskAccountNumber("123")).isEqualTo("XXX");
        assertThat(MaskingUtil.maskAccountNumber("1234")).isEqualTo("XXXX");
    }
}
