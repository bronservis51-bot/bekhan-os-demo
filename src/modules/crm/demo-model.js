import { TODAY } from "../../shared/demo-clock.js";
const LEAD_STATUSES = {
  new: "Новая",
  in_work: "В работе",
  call_back: "Перезвонить",
  meeting: "Встреча",
  won: "Договор",
  lost: "Отказ",
};

const LEAD_FIXTURES = {
  d1: {
    funding: "partial",
    place: "help",
    timing: "research",
    created_at: "2026-11-10T09:00:00+03:00",
  },
  d2: {
    funding: "partial",
    place: "help",
    timing: "month",
    created_at: "2026-11-11T11:00:00+03:00",
  },
  d3: {
    funding: "full",
    place: "options",
    timing: "quarter",
    created_at: "2026-11-09T10:00:00+03:00",
  },
  d4: {
    funding: "full",
    place: "has",
    timing: "quarter",
    created_at: "2026-11-10T14:00:00+03:00",
  },
  d5: {
    funding: "full",
    place: "help",
    timing: "month",
    created_at: "2026-11-08T13:00:00+03:00",
  },
  d6: {
    funding: "full",
    place: "has",
    timing: "month",
    created_at: "2026-11-06T12:00:00+03:00",
  },
  d7: {
    funding: "full",
    place: "has",
    timing: "month",
    created_at: "2026-11-10T15:00:00+03:00",
  },
  d8: {
    funding: "none",
    place: "help",
    timing: "research",
    created_at: "2026-11-04T12:00:00+03:00",
  },
  d9: {
    funding: "partial",
    place: "options",
    timing: "quarter",
    created_at: "2026-11-05T12:00:00+03:00",
  },
};

const leadNow = () => `${TODAY}T12:00:00+03:00`;

function normalizeLead(lead) {
  const fixture = LEAD_FIXTURES[lead.id] || {};
  const previousStage = Number(lead.stage) || 0;
  return {
    ...fixture,
    ...lead,
    status: LEAD_STATUSES[lead.status]
      ? lead.status
      : previousStage === 5
        ? "lost"
        : previousStage >= 3
          ? "won"
          : previousStage === 2
            ? "in_work"
            : "new",
    funding: lead.funding ?? fixture.funding ?? "",
    place: lead.place ?? fixture.place ?? "",
    timing: lead.timing ?? fixture.timing ?? "",
    instagram:
      typeof lead.instagram === "string" &&
      /^[A-Za-z0-9_.]{1,30}$/.test(lead.instagram)
        ? lead.instagram
        : "",
    phone: typeof lead.phone === "string" ? lead.phone : "",
    note:
      typeof lead.note === "string" ? lead.note : lead.next || lead.doubt || "",
    paid: typeof lead.paid === "boolean" ? lead.paid : previousStage === 4,
    created_at: lead.created_at || fixture.created_at || leadNow(),
    updated_at:
      lead.updated_at || lead.created_at || fixture.created_at || leadNow(),
    deleted_at: lead.deleted_at || null,
    history: Array.isArray(lead.history) ? lead.history : [],
    crm_schema: 2,
  };
}
export { normalizeLead };
