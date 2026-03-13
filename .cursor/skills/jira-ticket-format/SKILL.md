---
name: jira-ticket-format
description: Format Jira ticket descriptions with standardized sections including Context, Scope, Acceptance Criteria, Notes, Security Considerations, and Risks. Use when creating Jira tickets, issues, or tasks via MCP or when the user asks to create a Jira ticket.
---

# Jira Ticket Format

When creating Jira tickets, format the description using this structure:

## Required Sections

```
## Context
[Why this work is needed. Include background, user problem, or business driver.]

## Scope
[What is included and excluded. Define boundaries clearly.]

## Acceptance Criteria
- [ ] [Specific, testable criteria]
- [ ] [Another criterion]
- [ ] [Continue as needed]

## Notes
[Implementation hints, dependencies, links to designs, related tickets, or other relevant information.]

## Security Considerations
[Security implications, data handling, authentication/authorization impacts. Write "None identified" if no security concerns.]

## Risks and Mitigation
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| [Risk description] | Low/Medium/High | Low/Medium/High | [Mitigation strategy] |

[Write "No significant risks identified" if none apply.]
```

## Section Guidelines

**Context**: Answer "why now?" and "why this matters?" Keep to 2-3 sentences.

**Scope**: Use bullet points for clarity. Explicitly state what's out of scope if relevant.

**Acceptance Criteria**: Write as checkboxes. Each criterion should be independently verifiable. Avoid vague terms like "works correctly."

**Notes**: Include links to Figma designs, Confluence docs, related tickets, or technical constraints.

**Security Considerations**: Consider authentication, authorization, data exposure, input validation, and compliance requirements.

**Risks and Mitigation**: Focus on delivery risks. Skip trivial risks.

## Example

```markdown
## Context
Users cannot export reports in PDF format, requiring manual copy-paste into documents. This blocks the Q3 compliance audit workflow.

## Scope
- Add PDF export button to report viewer
- Support all existing report types
- Out of scope: Custom PDF templates (follow-up ticket)

## Acceptance Criteria
- [ ] PDF export button visible on report viewer toolbar
- [ ] Exported PDF includes all visible report data
- [ ] PDF filename follows pattern: `{report-name}-{date}.pdf`
- [ ] Export works for reports up to 1000 rows

## Notes
- Design: [Figma link]
- Related: PROJ-123 (CSV export implementation)
- Use existing print stylesheet as base

## Security Considerations
- PDFs may contain sensitive data; ensure exports respect user permissions
- Audit log PDF exports for compliance

## Risks and Mitigation
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Large reports timeout | Medium | Medium | Add progress indicator, async generation for >500 rows |
```
