// Generated from 02-PRACTICAL/M1-M16-Provisional-Assessor-Manual-v1.md. Do not edit by hand.
export const ASSESSOR_GUIDANCE_META = Object.freeze({
  "manualVersion": "1.0.0-provisional",
  "frameworkVersion": "4.1.1",
  "metricDefinitionSet": "se-tailoring-m1-m16-v3",
  "evidenceStatus": "provisional-content-review-instrument",
  "validationStatus": "not-validated-or-frozen",
  "normativeEffect": "none"
});

export const ASSESSOR_GUIDANCE = Object.freeze({
  "M1": {
    "id": "M1",
    "name": "Architectural Complexity",
    "definition": "structural and behavioral complexity within the declared system boundary, including element heterogeneity, coupling, dynamics, and emergence.",
    "exclusions": "interface-specific difficulty (M2), execution of integration work (M4), delivery topology (M12), and stakeholder count (M13).",
    "anchors": {
      "1": "Few homogeneous elements with simple, stable, well-understood interactions and no material emergent behavior.",
      "2": "A small architecture with limited coupling and localized behavior that can be understood through established patterns.",
      "3": "Several interacting subsystems with known patterns, bounded coupling, and manageable system-level behavior.",
      "4": "Many heterogeneous or tightly coupled elements with material cross-domain dynamics, adaptation, or difficult-to-predict interactions.",
      "5": "A system-of-systems or similarly complex architecture with substantial emergence, dynamic coupling, or distributed authority that materially limits decomposition and prediction."
    },
    "evidenceExamples": "architecture description, element/context model, dependency model, behavior model, system-boundary decision.",
    "counterexample": "a large inventory of independent, repeated elements does not by count alone establish score 4 or 5.",
    "reassessWhen": "architecture boundary, decomposition, coupling, operating modes, or constituent-system authority changes."
  },
  "M2": {
    "id": "M2",
    "name": "Interface Complexity",
    "definition": "difficulty of defining, governing, changing, and verifying technical or operational interfaces.",
    "exclusions": "architecture size alone (M1), integration execution burden (M4), geography or contracts without interface consequence (M12), and stakeholder conflict (M13).",
    "anchors": {
      "1": "Few stable interfaces using well-understood semantics and mechanisms with clear ownership.",
      "2": "Several well-defined interfaces with limited heterogeneity, change, or cross-boundary coordination.",
      "3": "Multiple interfaces requiring planned coordination, interface records, and managed verification.",
      "4": "Numerous, heterogeneous, critical, evolving, or cross-organization interfaces with material ownership or semantic challenges.",
      "5": "A dense or unstable interface environment with unresolved ownership, emergent interactions, or cascading cross-boundary consequences."
    },
    "evidenceExamples": "interface register, ICDs, ownership matrix, change history, interface criticality and verification records.",
    "counterexample": "many standardized, repeated interfaces with one owner may remain moderate.",
    "reassessWhen": "an interface, protocol, owner, dependency, baseline, or exchange authority changes materially."
  },
  "M3": {
    "id": "M3",
    "name": "Technology Novelty / Uncertainty",
    "definition": "readiness uncertainty arising from technologies and their intended application, configuration, operating environment, scale, realization method, and supporting evidence.",
    "exclusions": "structural/interface complexity (M1/M2), integration execution burden (M4), schedule uncertainty (M9), and requirements change (M14).",
    "anchors": {
      "1": "Technologies and their intended use, configuration, environment, scale, and realization basis are proven by representative evidence.",
      "2": "The basis is mature and familiar, with only minor bounded uncertainty that is unlikely to alter major design or assurance decisions.",
      "3": "Readiness is mixed or one or more application/configuration aspects have bounded uncertainty requiring planned confirmation.",
      "4": "Material uncertainty remains in technology, intended use, configuration, environment, scale-up, realization, or evidence representativeness.",
      "5": "Critical aspects are novel or materially unproven, with only early or non-representative evidence and substantial decision uncertainty."
    },
    "evidenceExamples": "technology/readiness assessment, representative demonstration results, application history, environment comparison, manufacturing or scale-up evidence.",
    "counterexample": "TRL 9 components in a novel configuration or environment do not automatically support score 1 or 2.",
    "reassessWhen": "intended use, configuration, environment, scale, supplier, realization method, or readiness evidence changes."
  },
  "M4": {
    "id": "M4",
    "name": "Integration Complexity",
    "definition": "difficulty of planning, sequencing, executing, observing, and stabilizing integration across elements, disciplines, environments, legacy assets, and supplier boundaries.",
    "exclusions": "architecture size alone (M1), interface definition alone (M2), technology readiness uncertainty (M3), and delivery distribution without integration consequence (M12).",
    "anchors": {
      "1": "Integration is routine, localized, and supported by established interfaces and environments.",
      "2": "Limited integration work is needed using familiar sequences, tools, and environments.",
      "3": "Integration requires a systematic plan, controlled environments, and coordinated anomaly resolution.",
      "4": "Significant cross-domain, legacy, supplier, environment, or sequencing challenges require custom controls or staged learning.",
      "5": "Integration is highly coupled across multiple domains or authorities, with substantial emergent behavior, constrained observability, or unstable dependencies."
    },
    "evidenceExamples": "integration strategy, sequence/network, environment readiness, anomaly history, legacy/supplier constraints.",
    "counterexample": "custom components do not imply high integration complexity when integration remains isolated and well rehearsed.",
    "reassessWhen": "sequence, environment, supplier responsibility, interface maturity, or legacy dependency changes."
  },
  "M5": {
    "id": "M5",
    "name": "Safety Impact",
    "definition": "credible consequence to human health or life from system failure, misuse, interaction, or loss of control within the declared boundary.",
    "exclusions": "likelihood or risk acceptability, regulatory investigation, mission loss without human harm (M6), environmental consequence (M7), security origin by itself (M8), and assurance obligations (M15).",
    "anchors": {
      "1": "No credible human injury consequence identified for the assessed boundary.",
      "2": "Credible effects are indirect or minor and are not expected to require medical treatment.",
      "3": "Credible failure can cause minor injury or temporary health effects requiring treatment.",
      "4": "Credible failure can cause severe injury, hospitalization, permanent impairment, or multiple serious injuries.",
      "5": "Credible failure can cause one or more fatalities or catastrophic human harm."
    },
    "evidenceExamples": "hazard analysis, accident/incident evidence, exposure model, operating envelope, safety allocation.",
    "counterexample": "a mandated independent review is M15 evidence and does not by itself establish a safety consequence score.",
    "reassessWhen": "hazard, exposure, operating mode, user population, allocation, or safety evidence changes. Scores 4-5 require appropriate safety-authority review before consequential use."
  },
  "M6": {
    "id": "M6",
    "name": "Mission / Operational Criticality",
    "definition": "credible consequence of loss or degradation to the declared mission, essential service, or operational purpose, considering duration, scale, workaround, recovery, and cascading effects.",
    "exclusions": "human harm (M5), environmental damage (M7), security origin by itself (M8), and binding essential-service obligations (M15).",
    "anchors": {
      "1": "Negligible effect on the primary mission or operational service.",
      "2": "Localized, short, readily reversible inconvenience with effective routine workarounds.",
      "3": "Moderate degradation or disruption manageable through established backups, redundancy, or recovery procedures.",
      "4": "Severe or sustained degradation requiring emergency workarounds, degraded-mode operation, or substantial recovery coordination.",
      "5": "Complete or cascading loss of a primary mission or essential service with no timely effective workaround."
    },
    "evidenceExamples": "operational concept, service-impact analysis, continuity plan, recovery objectives, dependency map.",
    "counterexample": "high availability concern originating in a cyber threat still requires distinct M8 consequence reasoning and does not become independent evidence merely because both scores are high.",
    "reassessWhen": "mission boundary, dependency, workaround, recovery objective, operating mode, or allocated responsibility changes."
  },
  "M7": {
    "id": "M7",
    "name": "Environmental Impact",
    "definition": "credible adverse environmental consequence, considering affected receptors, pathway, spatial and temporal scale, duration, reversibility, and cumulative effect.",
    "exclusions": "permits, reporting, or authorization burden by itself (M15); direct human injury (M5); ordinary footprint without credible consequence; and probability or control maturity.",
    "anchors": {
      "1": "No material environmental consequence beyond routine, readily controlled effects.",
      "2": "Localized, minor, reversible effects manageable through established ordinary controls.",
      "3": "Moderate consequence requiring planned mitigation and monitoring, with bounded scale and recovery.",
      "4": "Significant, prolonged, widespread, cumulative, or difficult-to-reverse environmental consequence requiring substantial mitigation.",
      "5": "Catastrophic, extensive, or effectively irreversible environmental damage to critical receptors or ecosystems."
    },
    "evidenceExamples": "environmental aspect/impact assessment, pathway and receptor analysis, lifecycle/material inventory, monitoring or incident evidence.",
    "counterexample": "a complex permitting regime without material environmental consequence belongs under M15 and does not automatically raise M7.",
    "reassessWhen": "site, materials, operating mode, emissions/discharges, affected receptor, lifecycle phase, or disposal path changes."
  },
  "M8": {
    "id": "M8",
    "name": "Security Criticality / Consequence",
    "definition": "maximum credible security-origin consequence from loss of confidentiality, integrity, availability, privacy, or control authority within the declared boundary.",
    "exclusions": "threat likelihood, vulnerability count, exposure, control maturity, compliance burden (M15), and human/mission/environment consequence unless separately scored under M5/M6/M7.",
    "anchors": {
      "1": "Negligible security-origin consequence with no material protected information, service, integrity, privacy, or control effect.",
      "2": "Localized, limited, and reversible consequence with routine recovery and no significant propagation.",
      "3": "Moderate service, information, integrity, privacy, or control consequence requiring coordinated recovery.",
      "4": "Major or sustained consequence, significant protected-data or control compromise, or material propagation across critical interfaces.",
      "5": "Catastrophic or systemic mission, infrastructure, control, physical, privacy, or irreversible highly sensitive information consequence."
    },
    "evidenceExamples": "protection-needs assessment, impact analysis, system/security boundary, data classification, mission/business impact, control-authority model.",
    "counterexample": "many vulnerabilities with negligible consequence do not establish a high M8 score; vulnerability and controls remain non-metric context.",
    "reassessWhen": "boundary, data, control authority, interconnection, threat-informed consequence pathway, operational dependency, or privacy use changes."
  },
  "M9": {
    "id": "M9",
    "name": "Schedule Pressure",
    "definition": "severity of time constraint relative to scope, critical path, available margin, external commitments, and recovery flexibility. M9 feeds feasibility governance and never directly raises or lowers rigor.",
    "exclusions": "project size, poor performance alone, monetary exposure as a universal threshold, planned overtime as a scoring proxy, and requirements volatility (M14).",
    "anchors": {
      "1": "Flexible timeline with substantial usable margin and change flexibility.",
      "2": "Mild acceleration or limited commitments with adequate recovery margin.",
      "3": "Meaningful constraints requiring active critical-path and margin management but retaining workable recovery options.",
      "4": "Highly constrained schedule with substantial compression, concurrency, or limited recovery margin requiring feasibility intervention.",
      "5": "Immovable external deadline with negligible usable margin and consequences that materially threaten the approved mission, service, authorization, or project case."
    },
    "evidenceExamples": "integrated schedule, milestone authority, critical-path analysis, margin and recovery plan, dependency commitments.",
    "counterexample": "a large weekly cost figure or overtime plan is context, not a portable anchor.",
    "reassessWhen": "scope, external milestone, critical path, margin, dependency, or recovery option changes."
  },
  "M10": {
    "id": "M10",
    "name": "Budget Constraints",
    "definition": "funding pressure relative to approved scope, estimate maturity and uncertainty, usable contingency, funding flexibility, and change authority. M10 feeds feasibility governance and never directly raises or lowers rigor.",
    "exclusions": "project cost alone, universal reserve percentages, value or benefit, and schedule pressure (M9).",
    "anchors": {
      "1": "Funding is adequate relative to current estimate uncertainty, with substantial usable flexibility.",
      "2": "Minor pressure exists but contingency and change authority are proportionate to credible uncertainty.",
      "3": "Active management and trade-offs are needed, while documented contingency and workable change authority remain.",
      "4": "Funding is highly constrained, with limited contingency or flexibility and frequent consequential trade-offs.",
      "5": "Negligible usable contingency or funding flexibility makes credible variance threaten essential scope, authorization, or viability."
    },
    "evidenceExamples": "estimate basis/class, uncertainty range, contingency policy, funding profile, change authority, committed scope.",
    "counterexample": "a fixed reserve percentage is not comparable across sectors or lifecycle phases and is not a universal anchor.",
    "reassessWhen": "estimate maturity, scope, funding, contingency, escalation authority, or material risk changes."
  },
  "M11": {
    "id": "M11",
    "name": "Team Capability Gap",
    "definition": "gap between capability required for critical roles/tasks and capability available to the project and receiving organization, including relevant recency, coverage, supervision, supplier support, tooling, and knowledge transfer.",
    "exclusions": "delivery topology (M12), organizational support/incentives (M16), headcount alone, and process nonconformance by itself.",
    "anchors": {
      "1": "Required critical roles have current, relevant capability, coverage, and access to needed support.",
      "2": "Minor localized gaps exist and can be handled through routine mentoring or support without threatening critical work.",
      "3": "Mixed capability requires planned supervision, mentoring, training, or knowledge transfer for material tasks.",
      "4": "Significant critical-role, project, supplier, or receiving-organization gaps require external expertise or substantial mitigation.",
      "5": "Essential capabilities are absent or inaccessible across multiple critical tasks, with no credible near-term mitigation in place."
    },
    "evidenceExamples": "role/task capability matrix, competence evidence, staffing/turnover plan, training and knowledge-transfer plan, supplier/receiver readiness.",
    "counterexample": "a globally distributed experienced team is primarily M12 context, not automatically an M11 gap.",
    "reassessWhen": "critical role, staffing, turnover, supplier, receiver, tooling, training, or task allocation changes."
  },
  "M12": {
    "id": "M12",
    "name": "Distributed Delivery Complexity",
    "definition": "coordination and authority burden created by delivery topology across organizations, contracts, sites, working-hour overlap, tools/data, responsibilities, handoffs, supplier dependencies, and integration authority.",
    "exclusions": "national or cultural identity, geography by itself, capability gap (M11), technical interface difficulty (M2), and stakeholder conflict (M13).",
    "anchors": {
      "1": "Delivery has clear responsibilities, compatible information/tool access, effective authority, and routine handoffs.",
      "2": "Limited distribution exists but coordination windows, responsibilities, and handoffs remain straightforward.",
      "3": "Multiple delivery boundaries require planned coordination and formal handoffs but have workable authority and information access.",
      "4": "Material organizational, contractual, tool/data, site, or time-overlap boundaries create difficult coordination or fragmented authority.",
      "5": "Delivery is severely fragmented across multiple boundaries, with unclear or contested authority, incompatible information/tool environments, or critical handoff exposure."
    },
    "evidenceExamples": "organization/contract topology, RACI/decision-rights model, tool/data boundary map, handoff records, coordination and integration authority.",
    "counterexample": "physical co-location does not imply low M12 when contracts, tools, incentives, and authority remain fragmented.",
    "reassessWhen": "supplier, contract, site, tool/data boundary, handoff, responsibility, or decision authority changes."
  },
  "M13": {
    "id": "M13",
    "name": "Stakeholder Complexity",
    "definition": "complexity arising from stakeholder classes, representation, accessibility, interests, conflict, decision rights, veto/acceptance authority, and change dynamics.",
    "exclusions": "stakeholder count as a universal threshold, binding assurance obligation (M15), and delivery-organization topology (M12).",
    "anchors": {
      "1": "Few clearly represented stakeholders with aligned needs and unambiguous decision rights.",
      "2": "Several stakeholders with minor differences and straightforward representation and authority.",
      "3": "Multiple groups with manageable differences requiring structured engagement and decision coordination.",
      "4": "Diverse groups with competing interests, representation gaps, or material negotiation and acceptance complexity.",
      "5": "Numerous or highly divergent communities with contested representation, veto/acceptance authority, or persistent high-consequence conflict."
    },
    "evidenceExamples": "stakeholder map, decision/acceptance rights, engagement record, conflict and representation analysis, accessibility needs.",
    "counterexample": "many aligned users represented by one effective authority do not automatically establish score 5.",
    "reassessWhen": "stakeholder class, representative, authority, conflict, need, or acceptance arrangement changes."
  },
  "M14": {
    "id": "M14",
    "name": "Requirements Volatility",
    "definition": "expected rate, magnitude, uncertainty, source, and lateness of change in needs or requirements over the declared decision horizon.",
    "exclusions": "the existence or maturity of change control, pejorative labels for a change source, technology readiness uncertainty (M3), and stakeholder conflict alone (M13).",
    "anchors": {
      "1": "Needs and requirements are stable, well understood, and unlikely to change materially in the decision horizon.",
      "2": "Minor refinements are expected with limited downstream effect and known sources.",
      "3": "Moderate bounded change is expected in identifiable areas with manageable timing and effect.",
      "4": "Major, frequent, late, or difficult-to-predict changes are likely in material requirement areas.",
      "5": "Change is continual or directionally uncertain across critical needs, constraints, or external conditions, with substantial downstream consequence."
    },
    "evidenceExamples": "change history, uncertainty log, baseline maturity, decision horizon, expected policy/market/technology changes, trace impact.",
    "counterexample": "a formal change-control board is a response/control and does not itself establish moderate volatility.",
    "reassessWhen": "baseline, stakeholder need, policy/market condition, discovery, change rate, or lifecycle decision horizon changes."
  },
  "M15": {
    "id": "M15",
    "name": "External Governance & Assurance Demand",
    "definition": "binding external or delegated demand for evidence, review, approval, certification, authorization, or independent assurance, including authority, basis, scope, recurrence, and consequence of non-acceptance.",
    "exclusions": "political, public, media, or reputational visibility without a binding instrument; safety/environment/security consequence (M5/M7/M8); and stakeholder conflict (M13).",
    "anchors": {
      "1": "Routine internal governance with no material external or delegated acceptance dependency.",
      "2": "Limited contractual/client reporting or self-attestation with no independent approval dependency.",
      "3": "A defined binding obligation requires auditable evidence, formal review gates, and a named external or delegated acceptance authority.",
      "4": "A consequential binding obligation requires independent review, audit, certification, regulator/owner approval, or equivalent acceptance before release or use.",
      "5": "Release, entry to service, or continued operation depends on a compound or highest-consequence assurance/authorization regime with continuing evidence obligations."
    },
    "evidenceExamples": "obligation register, authority/instrument, assurance plan, approval gates, evidence scope, recurrence and non-acceptance consequence.",
    "counterexample": "media scrutiny without a binding authority remains a non-floor qualifier and does not raise M15.",
    "reassessWhen": "authority, instrument, scope, evidence demand, independence, gate, recurrence, or legal/contractual status changes."
  },
  "M16": {
    "id": "M16",
    "name": "Organizational Culture",
    "definition": "organizational conditions for proportionate SE adoption and constructive challenge, including leadership support, decision authority, resources, learning/reporting climate, incentives, and change readiness. Higher means stronger enabling conditions.",
    "exclusions": "technical capability (M11), delivery topology (M12), general organizational worth, national culture, and technically required rigor. M16 remains non-driving.",
    "anchors": {
      "1": "Conditions materially obstruct proportionate SE practice or constructive challenge, with weak authority, support, learning, or safe reporting.",
      "2": "Limited enabling conditions exist, but adoption depends on isolated individuals and significant barriers remain.",
      "3": "Conditions are mixed or locally dependent; some sponsors and learning mechanisms exist but support and authority are uneven.",
      "4": "Formal support, authority, resources, and learning mechanisms are broadly present, with some inconsistent application.",
      "5": "Sustained leadership support, aligned incentives, adequate authority/resources, learning, and safe constructive challenge are embedded in relevant decisions."
    },
    "evidenceExamples": "decision-rights and sponsorship evidence, resource commitments, learning/feedback mechanisms, reporting/challenge climate, adoption history.",
    "counterexample": "an executive mandate or high spending alone does not prove effective learning, challenge, or proportionate practice.",
    "reassessWhen": "leadership, authority, incentives, reporting climate, resources, adoption strategy, or organizational boundary changes."
  }
});
