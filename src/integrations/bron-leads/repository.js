// Existing RPC contracts. The landing and its lead_submit are never changed here.
export function createLeadRepository(backend) {
  const one = (value) => (Array.isArray(value) ? value[0] : value);
  return {
    async list({ trash = false } = {}) {
      const result = await backend.rpc(trash ? "lead_trash_list" : "lead_list");
      if (!Array.isArray(result)) throw new Error("Invalid lead list");
      return result;
    },
    async move(lead, column) {
      return one(
        await backend.rpc("lead_move", {
          p_id: lead.id,
          p_column: column,
          p_expected_updated_at: lead.updated_at,
        }),
      );
    },
    async save(input, { expected = null, operation = null } = {}) {
      return one(
        await backend.rpc("lead_save", {
          p_lead: input,
          p_expected_updated_at: expected,
          p_operation: operation,
        }),
      );
    },
    async setDeleted(lead, deleted) {
      return one(
        await backend.rpc("lead_set_deleted", {
          p_id: lead.id,
          p_deleted: deleted,
          p_expected_updated_at: lead.updated_at,
        }),
      );
    },
  };
}
