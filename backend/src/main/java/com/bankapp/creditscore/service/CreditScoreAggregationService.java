package com.bankapp.creditscore.service;

import com.bankapp.audit.service.AuditService;
import com.bankapp.auth.entity.Role;
import com.bankapp.auth.entity.User;
import com.bankapp.common.exception.ConsentRequiredException;
import com.bankapp.common.exception.ResourceNotFoundException;
import com.bankapp.common.security.crypto.PanHasher;
import com.bankapp.creditscore.ScoreBandUtil;
import com.bankapp.creditscore.bureau.CreditBureauClient;
import com.bankapp.creditscore.bureau.dto.CreditBureauRequest;
import com.bankapp.creditscore.bureau.dto.CreditBureauResponse;
import com.bankapp.creditscore.dto.CreditScoreLookupRequest;
import com.bankapp.creditscore.dto.CreditScoreLookupResponse;
import com.bankapp.creditscore.dto.PendingEmiDto;
import com.bankapp.creditscore.entity.CreditScoreSnapshot;
import com.bankapp.creditscore.entity.ScoreSource;
import com.bankapp.creditscore.repository.CreditScoreSnapshotRepository;
import com.bankapp.customer.entity.CustomerProfile;
import com.bankapp.customer.repository.CustomerProfileRepository;
import com.bankapp.loan.repository.EmiScheduleRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.regex.Pattern;

/**
 * Orchestrates the full "look up credit score + pending EMIs by PAN" flow — the centerpiece
 * feature of the application. See docs/ARCHITECTURE.md and the plan's "Credit score module
 * design" section for the exact step-by-step flow this implements.
 *
 * <p>CRITICAL invariant: {@code AuditService.logBureauLookup} is called on <em>every</em> exit
 * path (PAN not found, forbidden, consent denied, success) — never only on success. Each audit
 * write runs in its own {@code REQUIRES_NEW} transaction (see {@link AuditService}) specifically
 * so it survives even when this method's own transaction subsequently rolls back due to the
 * exception thrown right after logging.
 */
@Service
@RequiredArgsConstructor
public class CreditScoreAggregationService {

    private static final Pattern PAN_PATTERN = Pattern.compile("^[A-Z]{5}[0-9]{4}[A-Z]$");
    private static final String MOCK_PROVIDER_NAME = "MOCK-BUREAU";
    private static final ScoreWeights WEIGHTS = new ScoreWeights(0.7, 0.3);
    private static final int SCORE_MIN = 300;
    private static final int SCORE_MAX = 900;

    private final PanHasher panHasher;
    private final CustomerProfileRepository customerProfileRepository;
    private final CreditBureauClient creditBureauClient;
    private final InternalScoringService internalScoringService;
    private final CreditScoreSnapshotRepository creditScoreSnapshotRepository;
    private final EmiScheduleRepository emiScheduleRepository;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;

    @Transactional
    public CreditScoreLookupResponse lookupByPan(CreditScoreLookupRequest request, User requestingUser) {
        String pan = request.pan();

        // Step 1: format validation. No customer/PAN was resolved yet, so no audit row here
        // (this also runs redundantly with the @Pattern on the DTO — kept so the service is
        // safe to call directly, e.g. from tests, without bypassing validation).
        if (pan == null || !PAN_PATTERN.matcher(pan).matches()) {
            throw new IllegalArgumentException("PAN must match the format AAAAA9999A");
        }

        // Step 2: deterministic PAN hash for lookup (the encrypted PAN column is not searchable).
        String panHash = panHasher.hash(pan);

        // Step 3: resolve the customer. Not-found is still audited.
        Optional<CustomerProfile> profileOpt = customerProfileRepository.findByPanHash(panHash);
        if (profileOpt.isEmpty()) {
            auditService.logBureauLookup(
                    requestingUser.getId(), null, panHash, request.purpose(),
                    request.consentConfirmed(), null, "NOT_FOUND");
            throw new ResourceNotFoundException("No customer found for the given PAN");
        }
        CustomerProfile profile = profileOpt.get();

        // Step 4: authorize. LOAN_OFFICER/ADMIN may look up anyone; a CUSTOMER may only look up themselves.
        boolean isOfficerOrAdmin = requestingUser.getRole() == Role.LOAN_OFFICER || requestingUser.getRole() == Role.ADMIN;
        boolean isOwnPan = profile.getUserId().equals(requestingUser.getId());
        if (!isOfficerOrAdmin && !isOwnPan) {
            auditService.logBureauLookup(
                    requestingUser.getId(), profile.getId(), panHash, request.purpose(),
                    request.consentConfirmed(), null, "FORBIDDEN");
            throw new AccessDeniedException("You are not authorized to look up this PAN");
        }

        // Step 5: consent is mandatory before any bureau call is made.
        if (!request.consentConfirmed()) {
            auditService.logBureauLookup(
                    requestingUser.getId(), profile.getId(), panHash, request.purpose(),
                    false, null, "CONSENT_DENIED");
            throw new ConsentRequiredException(
                    "Consent must be confirmed before a credit bureau lookup can proceed");
        }

        // Step 6: bureau call (mock by default; see CreditBureauClient).
        String consentReference = "user:" + requestingUser.getUsername() + ":ts:" + Instant.now().toEpochMilli();
        CreditBureauRequest bureauRequest = new CreditBureauRequest(pan, consentReference, request.purpose(), requestingUser.getUsername());
        CreditBureauResponse bureauResponse = creditBureauClient.fetchCreditReport(bureauRequest);

        // Step 7: internal score from the bank's own EMI repayment history.
        int internalScore = internalScoringService.computeInternalScore(profile.getId());

        // Step 8: combine 70% bureau / 30% internal.
        int combinedScore = ScoreBandUtil.clamp(
                WEIGHTS.combine(bureauResponse.score(), internalScore), SCORE_MIN, SCORE_MAX);
        String scoreBand = ScoreBandUtil.bandFor(combinedScore);

        // Step 9: persist the snapshot.
        String rawResponseJson = serialize(bureauResponse);
        CreditScoreSnapshot snapshot = CreditScoreSnapshot.builder()
                .customerId(profile.getId())
                .panHash(panHash)
                .source(ScoreSource.COMBINED)
                .score(combinedScore)
                .scoreBand(scoreBand)
                .rawResponseJson(rawResponseJson)
                .build();
        CreditScoreSnapshot savedSnapshot = creditScoreSnapshotRepository.save(snapshot);

        // Step 10: audit the success path too.
        auditService.logBureauLookup(
                requestingUser.getId(), profile.getId(), panHash, request.purpose(),
                true, creditBureauClient.getProviderName(), "SUCCESS");

        // Step 11: pending/overdue EMIs from the bank's own book.
        List<PendingEmiDto> pendingEmis = emiScheduleRepository.findOverdueByCustomerId(profile.getId()).stream()
                .map(PendingEmiDto::from)
                .toList();

        // Step 12: assemble the response.
        String dataSource = MOCK_PROVIDER_NAME.equals(creditBureauClient.getProviderName()) ? "MOCK" : "REAL";

        return new CreditScoreLookupResponse(
                bureauResponse.score(),
                internalScore,
                combinedScore,
                scoreBand,
                bureauResponse.tradeLines(),
                bureauResponse.delinquencySummary(),
                pendingEmis,
                dataSource,
                savedSnapshot.getFetchedAt()
        );
    }

    private String serialize(CreditBureauResponse bureauResponse) {
        try {
            return objectMapper.writeValueAsString(bureauResponse);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize bureau response for storage", e);
        }
    }

    /** Small helper so the 0.7/0.3 weighting isn't a pair of unexplained magic numbers inline. */
    private record ScoreWeights(double bureauWeight, double internalWeight) {
        int combine(int bureauScore, int internalScore) {
            return (int) Math.round(bureauScore * bureauWeight + internalScore * internalWeight);
        }
    }
}
