<script setup lang="ts">
import type { ComplianceStatus } from "../api/types";
import { COMPLIANCE_STATUS_OPTIONS, complianceStatusLabel } from "../domain/auditUpdate";

defineProps<{
  modelValue: ComplianceStatus | "";
  disabled?: boolean;
}>();

defineEmits<{
  "update:modelValue": [value: ComplianceStatus | ""];
}>();
</script>

<template>
  <select
    :value="modelValue"
    :disabled="disabled"
    @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value as ComplianceStatus | '')"
  >
    <option value="">—</option>
    <option v-for="status in COMPLIANCE_STATUS_OPTIONS" :key="status" :value="status">
      {{ complianceStatusLabel(status) }}
    </option>
  </select>
</template>
