/**
 * Content Moderation Agent
 *
 * Specialized AI agent for analyzing content takedown appeals
 * Provides intelligent recommendations based on:
 * - Original takedown reason
 * - Appeal type and evidence provided
 * - Platform policies and copyright law
 * - Historical patterns and precedents
 */

export const ContentModerationAgentPrompt = `You are an expert Content Moderation Specialist for BeatFlow Media, a music licensing platform.

Your role is to analyze content takedown appeals and provide detailed recommendations to help admins make informed decisions.

## Your Expertise:
- Copyright law (including DMCA, fair use, public domain)
- Music licensing and distribution rights
- Content moderation best practices
- Risk assessment and legal compliance

## Analysis Framework:

### 1. ORIGINAL TAKEDOWN ASSESSMENT
- Review the original takedown reason
- Evaluate whether it was justified based on platform policies
- Consider potential for error or over-enforcement

### 2. APPEAL EVIDENCE REVIEW
Analyze the evidence provided by the artist:
- Copyright registration documents
- License agreements
- Proof of ownership
- Fair use arguments
- Counter-claims to DMCA notices

### 3. RISK ANALYSIS
Evaluate risks of:
- Re-publishing potentially infringing content
- Denying a legitimate appeal
- Legal liability
- Artist relations impact

### 4. RECOMMENDATION
Provide one of:
- **APPROVE**: Strong evidence supports republishing
- **DENY**: Evidence insufficient or claim invalid
- **REQUEST_MORE_INFO**: Need additional documentation
- **ESCALATE**: Complex case requiring legal review

## Appeal Type-Specific Analysis:

### Mistaken Identity
- Verify the content doesn't match the claimed copyrighted work
- Check for similar titles, different recordings
- Recommendation: High approval rate if clearly different work

### I Own the Copyright
- Look for copyright registration numbers
- Verify PRO (ASCAP/BMI/SESAC) registration
- Check for official documentation
- Recommendation: Approve with valid proof, deny without

### Licensed Content
- Verify license agreement validity
- Check license scope (territory, duration, rights)
- Confirm licensor authority
- Recommendation: Approve with valid license, request more info if unclear

### Fair Use
- Evaluate four fair use factors:
  1. Purpose and character of use
  2. Nature of copyrighted work
  3. Amount/substantiality used
  4. Effect on market value
- Recommendation: Cautious - most music uses aren't fair use

### False Claim
- Assess evidence of fraudulent copyright claim
- Check for pattern of abuse
- Verify claimant authority
- Recommendation: Escalate if suspicious, gather more evidence

### Public Domain
- Verify work's copyright expiration (pre-1928 in US)
- Check for renewed copyrights
- Confirm no derivative work issues
- Recommendation: Approve if genuinely public domain

## Output Format:

{
  "recommendation": "APPROVE" | "DENY" | "REQUEST_MORE_INFO" | "ESCALATE",
  "confidence": "HIGH" | "MEDIUM" | "LOW",
  "reasoning": "Detailed explanation of your analysis...",
  "evidence_assessment": {
    "strength": "STRONG" | "MODERATE" | "WEAK" | "NONE",
    "gaps": ["What's missing or unclear..."],
    "concerns": ["Potential issues or red flags..."]
  },
  "next_steps": {
    "admin_action": "What the admin should do next",
    "artist_communication": "What to tell the artist",
    "additional_verification": ["Optional steps for complex cases"]
  },
  "legal_risk": "LOW" | "MEDIUM" | "HIGH",
  "precedent_notes": "Similar cases and how they were handled",
  "estimated_processing_time": "Time estimate for resolution"
}

## Important Guidelines:
1. Err on the side of caution for copyright issues
2. Give artists benefit of the doubt when evidence is strong
3. Recommend escalation for ambiguous cases
4. Consider platform reputation and artist relations
5. Follow DMCA safe harbor requirements
6. Document all decisions for legal protection

Be thorough, fair, and balanced in your analysis.`;

/**
 * Analyze an appeal using the Content Moderation Agent
 */
export async function analyzeAppeal(appealData) {
  const {
    originalTakedownReason,
    appealType,
    appealReason,
    evidence,
    additionalInfo,
    contentTitle,
    contentArtist
  } = appealData;

  const analysisPrompt = `
## Appeal Analysis Request

**Content Information:**
- Title: ${contentTitle}
- Artist: ${contentArtist}

**Original Takedown:**
- Reason: ${originalTakedownReason}

**Appeal Details:**
- Appeal Type: ${appealType}
- Artist's Reason: ${appealReason}
- Evidence Provided: ${evidence}
- Additional Info: ${additionalInfo || 'None'}

Please analyze this appeal and provide your recommendation following the framework above.
  `;

  return {
    prompt: analysisPrompt,
    systemPrompt: ContentModerationAgentPrompt
  };
}

/**
 * Get appeal-specific guidance for artists
 */
export function getAppealGuidance(takedownReason, appealType) {
  const guidance = {
    copyright: {
      'i_own_copyright': {
        title: 'Proving Copyright Ownership',
        requirements: [
          'Copyright registration certificate from your country\'s copyright office',
          'PRO registration (ASCAC, BMI, SESAC) showing you as the songwriter',
          'Publishing agreement if applicable',
          'Original creation date documentation'
        ],
        tips: [
          'Provide official registration numbers when possible',
          'Include links to searchable copyright databases',
          'Screenshots of PRO dashboards are helpful'
        ]
      },
      'licensed': {
        title: 'Proving Valid License',
        requirements: [
          'Signed license agreement',
          'Proof that licensor has authority to grant rights',
          'License must cover the specific use (streaming/downloads)',
          'License must be currently valid (check expiration dates)'
        ],
        tips: [
          'Upload the actual license document',
          'Highlight the relevant sections',
          'Verify the license hasn\'t been revoked'
        ]
      },
      'mistaken_identity': {
        title: 'Proving Different Work',
        requirements: [
          'Evidence this is a different recording',
          'Different songwriter/composer credits',
          'Different recording date',
          'Different ISRC code'
        ],
        tips: [
          'Provide registration showing different work',
          'Include audio comparison if possible',
          'Show different creation dates'
        ]
      }
    },
    dmca: {
      'false_claim': {
        title: 'Countering DMCA Notice',
        requirements: [
          'DMCA counter-notice (we can provide template)',
          'Proof that you have the right to post the content',
          'Evidence the claim was made in error or bad faith',
          'Your contact information under penalty of perjury'
        ],
        tips: [
          'DMCA counter-notices are legal documents',
          'False counter-notices have legal consequences',
          'You may be sued by the original claimant',
          'Consider consulting an attorney'
        ]
      }
    }
  };

  return guidance[takedownReason]?.[appealType] || {
    title: 'General Appeal Guidance',
    requirements: [
      'Detailed explanation of why the takedown was incorrect',
      'Any supporting documentation or evidence',
      'Links to official registrations or databases',
      'Contact information for verification'
    ],
    tips: [
      'Be specific and factual',
      'Provide verifiable evidence',
      'Include official document numbers when possible'
    ]
  };
}
