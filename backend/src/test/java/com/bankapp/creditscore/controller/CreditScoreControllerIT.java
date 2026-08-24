package com.bankapp.creditscore.controller;

import com.bankapp.AbstractIntegrationTest;
import com.bankapp.account.entity.Account;
import com.bankapp.account.entity.AccountStatus;
import com.bankapp.account.entity.AccountType;
import com.bankapp.account.repository.AccountRepository;
import com.bankapp.audit.entity.BureauLookupAudit;
import com.bankapp.audit.repository.BureauLookupAuditRepository;
import com.bankapp.auth.entity.Role;
import com.bankapp.auth.entity.User;
import com.bankapp.auth.repository.UserRepository;
import com.bankapp.common.security.JwtTokenProvider;
import com.bankapp.common.security.crypto.PanHasher;
import com.bankapp.creditscore.dto.CreditScoreLookupRequest;
import com.bankapp.customer.entity.CustomerProfile;
import com.bankapp.customer.entity.KycStatus;
import com.bankapp.customer.repository.CustomerProfileRepository;
import com.bankapp.loan.entity.EmiSchedule;
import com.bankapp.loan.entity.EmiStatus;
import com.bankapp.loan.entity.Loan;
import com.bankapp.loan.entity.LoanStatus;
import com.bankapp.loan.repository.EmiScheduleRepository;
import com.bankapp.loan.repository.LoanRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Exercises {@code POST /api/credit-score/lookup} end-to-end against the real
 * {@code MockCreditBureauClient} (the default active bureau bean — no provider override is
 * configured for this test) and a real MySQL Testcontainers database. Confirms:
 * <ul>
 *     <li>a successful lookup returns the seeded overdue EMI correctly;</li>
 *     <li>a consent-denied request gets the correct HTTP status AND still writes an audit row;</li>
 *     <li>a PAN-not-found request gets the correct HTTP status AND still writes an audit row.</li>
 * </ul>
 * Run via {@code mvn verify} (maven-failsafe-plugin); requires Docker.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
class CreditScoreControllerIT extends AbstractIntegrationTest {

    private static final AtomicLong SEQ = new AtomicLong();

    @Autowired
    private org.springframework.test.web.servlet.MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CustomerProfileRepository customerProfileRepository;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private LoanRepository loanRepository;

    @Autowired
    private EmiScheduleRepository emiScheduleRepository;

    @Autowired
    private BureauLookupAuditRepository bureauLookupAuditRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private PanHasher panHasher;

    @Test
    void successfulLookup_returnsSeededOverdueEmi_andWritesSuccessAuditRow() throws Exception {
        long seq = SEQ.incrementAndGet();
        String pan = panFor(seq);
        User user = seedUser(seq, Role.CUSTOMER);
        CustomerProfile profile = seedCustomerProfile(seq, user, pan);
        Account account = seedAccount(seq, profile.getId());
        Loan loan = seedLoan(profile.getId(), account.getId());
        seedOverdueInstallment(loan.getId(), 1);

        String accessToken = jwtTokenProvider.generateAccessToken(user.getUsername(), user.getRole().name());
        CreditScoreLookupRequest request = new CreditScoreLookupRequest(pan, true, "loan underwriting");

        mockMvc.perform(post("/api/credit-score/lookup")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dataSource").value("MOCK"))
                .andExpect(jsonPath("$.pendingEmis.length()").value(1))
                .andExpect(jsonPath("$.pendingEmis[0].loanId").value(loan.getId()))
                .andExpect(jsonPath("$.pendingEmis[0].installmentNumber").value(1))
                .andExpect(jsonPath("$.pendingEmis[0].status").value("OVERDUE"))
                .andExpect(jsonPath("$.combinedScore").isNumber());

        String panHash = panHasher.hash(pan);
        List<BureauLookupAudit> matching = bureauLookupAuditRepository.findAll().stream()
                .filter(a -> a.getPanHash().equals(panHash))
                .toList();
        assertThat(matching).hasSize(1);
        BureauLookupAudit audit = matching.get(0);
        assertThat(audit.getResponseStatus()).isEqualTo("SUCCESS");
        assertThat(audit.isConsentConfirmed()).isTrue();
        assertThat(audit.getCustomerId()).isEqualTo(profile.getId());
        assertThat(audit.getBureauProvider()).isEqualTo("MOCK-BUREAU");
    }

    @Test
    void consentDenied_returnsBadRequest_andWritesConsentDeniedAuditRow() throws Exception {
        long seq = SEQ.incrementAndGet();
        String pan = panFor(seq);
        User user = seedUser(seq, Role.CUSTOMER);
        seedCustomerProfile(seq, user, pan);

        String accessToken = jwtTokenProvider.generateAccessToken(user.getUsername(), user.getRole().name());
        CreditScoreLookupRequest request = new CreditScoreLookupRequest(pan, false, "loan underwriting");

        mockMvc.perform(post("/api/credit-score/lookup")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        String panHash = panHasher.hash(pan);
        List<BureauLookupAudit> matching = bureauLookupAuditRepository.findAll().stream()
                .filter(a -> a.getPanHash().equals(panHash))
                .toList();
        assertThat(matching).hasSize(1);
        assertThat(matching.get(0).getResponseStatus()).isEqualTo("CONSENT_DENIED");
        assertThat(matching.get(0).isConsentConfirmed()).isFalse();
    }

    @Test
    void panNotFound_returnsNotFound_andWritesNotFoundAuditRow() throws Exception {
        long seq = SEQ.incrementAndGet();
        User user = seedUser(seq, Role.CUSTOMER);
        // Deliberately never persist a CustomerProfile for this PAN.
        String unknownPan = panFor(seq);

        String accessToken = jwtTokenProvider.generateAccessToken(user.getUsername(), user.getRole().name());
        CreditScoreLookupRequest request = new CreditScoreLookupRequest(unknownPan, true, "loan underwriting");

        mockMvc.perform(post("/api/credit-score/lookup")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());

        String panHash = panHasher.hash(unknownPan);
        List<BureauLookupAudit> matching = bureauLookupAuditRepository.findAll().stream()
                .filter(a -> a.getPanHash().equals(panHash))
                .toList();
        assertThat(matching).hasSize(1);
        assertThat(matching.get(0).getResponseStatus()).isEqualTo("NOT_FOUND");
        assertThat(matching.get(0).getCustomerId()).isNull();
    }

    private String panFor(long seq) {
        // 5 letters + 4 digits + 1 letter, unique per seq, matching ^[A-Z]{5}[0-9]{4}[A-Z]$.
        return "CRSC" + (char) ('A' + (seq % 26)) + String.format("%04d", seq % 10000) + "E";
    }

    private User seedUser(long seq, Role role) {
        return userRepository.save(User.builder()
                .username("cs_it_user_" + seq)
                .email("cs_it_user_" + seq + "@example.com")
                .passwordHash("{noop}not-used-in-this-test")
                .role(role)
                .enabled(true)
                .build());
    }

    private CustomerProfile seedCustomerProfile(long seq, User user, String pan) {
        return customerProfileRepository.save(CustomerProfile.builder()
                .userId(user.getId())
                .fullName("Credit Score Test User " + seq)
                .dob(LocalDate.of(1988, 5, 20))
                .panEncrypted(pan)
                .panHash(panHasher.hash(pan))
                .kycStatus(KycStatus.VERIFIED)
                .consentGiven(true)
                .build());
    }

    private Account seedAccount(long seq, Long customerId) {
        return accountRepository.save(Account.builder()
                .customerId(customerId)
                .accountNumber(String.format("CS%010d", seq))
                .accountType(AccountType.SAVINGS)
                .balance(new BigDecimal("50000.00"))
                .status(AccountStatus.ACTIVE)
                .openedDate(LocalDate.now().minusMonths(3))
                .build());
    }

    private Loan seedLoan(Long customerId, Long accountId) {
        return loanRepository.save(Loan.builder()
                .customerId(customerId)
                .accountId(accountId)
                .loanType("PERSONAL")
                .principal(new BigDecimal("100000.00"))
                .interestRateAnnual(new BigDecimal("12.00"))
                .tenureMonths(12)
                .emiAmount(new BigDecimal("8884.88"))
                .status(LoanStatus.ACTIVE)
                .disbursedDate(LocalDate.now().minusMonths(2))
                .build());
    }

    private void seedOverdueInstallment(Long loanId, int installmentNumber) {
        emiScheduleRepository.save(EmiSchedule.builder()
                .loanId(loanId)
                .installmentNumber(installmentNumber)
                .dueDate(LocalDate.now().minusMonths(1))
                .principalComponent(new BigDecimal("7884.88"))
                .interestComponent(new BigDecimal("1000.00"))
                .emiAmount(new BigDecimal("8884.88"))
                .paidAmount(BigDecimal.ZERO)
                .status(EmiStatus.OVERDUE)
                .daysOverdue(30)
                .build());
    }
}
