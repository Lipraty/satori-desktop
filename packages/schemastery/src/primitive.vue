<script lang="ts" setup>
import { computed, PropType, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { IconExternal, IconEye, IconEyeSlash, IconInvalid } from './icons'
import { isNullable } from 'cosmokit'
import { explain, useI18nText, useModel, useMultiSelect } from './utils'
import Schema from 'schemastery'
import zhCN from './locales/zh-CN.yml'
import enUS from './locales/en-US.yml'

const props = defineProps({
  schema: { type: Object as PropType<Schema> },
  modelValue: {},
  disabled: Boolean,
  minimal: Boolean,
})

const emit = defineEmits(['update:modelValue', 'focus', 'blur'])

const showPass = ref(false)
const invalidAnchorId = `invalid-${Math.random().toString(36).slice(2)}`

const config = useModel()
const { values, items } = useMultiSelect()

const tt = useI18nText()

const nullable = computed(() => isNullable(config.value))
const invalid = computed(() => explain(props.schema, config.value))
const isLink = computed(() => ['url', 'link'].includes(props.schema.meta.role))

const type = computed(() => {
  const { type, meta } = props.schema
  return type === 'number' ? 'number' : meta.role === 'secret' && !showPass.value ? 'password' : 'text'
})

const selectModel = computed(() => {
  const item = props.schema.list.find(item => item.value === config.value)
  if (!item)
    return
  const index = props.schema.list.indexOf(item)
  return String(index)
})

function onSelectChange(event: Event) {
  const index = Number.parseInt((event.target as HTMLSelectElement).value)
  if (!isNaN(index)) {
    config.value = props.schema.list[index].value
  }
}

function toggleValue(key: string, checked: boolean) {
  if (checked) {
    values.value = [...values.value, key]
  }
  else {
    values.value = values.value.filter(v => v !== key)
  }
}

function onClickExternal(value: string) {
  if (!value)
    return
  open(value, '_blank')
}

const { t, setLocaleMessage } = useI18n({
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS,
  },
})

if (import.meta.hot) {
  import.meta.hot.accept('./locales/zh-CN.yml', (module) => {
    setLocaleMessage('zh-CN', module.default)
  })
  import.meta.hot.accept('./locales/en-US.yml', (module) => {
    setLocaleMessage('en-US', module.default)
  })
}
</script>

<template>
  <template v-if="schema.type === 'boolean'">
    <fluent-checkbox
      v-if="minimal"
      :checked="config || undefined"
      :class="{ nullable }"
      :disabled="disabled || undefined"
      @change="config = ($event.target as HTMLInputElement).checked"
    />
    <fluent-switch
      v-else
      :checked="config || undefined"
      :class="{ nullable }"
      :disabled="disabled || undefined"
      @change="config = ($event.target as HTMLInputElement).checked"
    />
  </template>

  <template v-else-if="schema.type === 'number'">
    <fluent-slider
      v-if="schema.meta.role === 'slider'" style="width: 200px"
      :value="String(config ?? '')"
      :disabled="disabled || undefined"
      :max="schema.meta.max != null ? String(schema.meta.max) : undefined"
      :min="schema.meta.min != null ? String(schema.meta.min) : undefined"
      :step="schema.meta.step != null ? String(schema.meta.step) : undefined"
      @change="config = +($event.target as HTMLInputElement).value"
    />
    <fluent-text-input
      v-else
      type="number"
      :value="config != null ? String(config) : ''"
      :disabled="disabled || undefined"
      @change="config = +($event.target as HTMLInputElement).value"
      @focus="$emit('focus', $event)" @blur="$emit('blur', $event)"
    />
  </template>

  <template v-else-if="schema.type === 'string'">
    <input
      v-if="schema.meta.role === 'color'"
      type="color"
      :disabled="disabled"
      :value="config"
      @change="config = ($event.target as HTMLInputElement).value"
    >
    <input
      v-else-if="schema.meta.role === 'time'"
      type="time"
      :disabled="disabled"
      :value="config"
      @change="config = ($event.target as HTMLInputElement).value"
      @focus="$emit('focus', $event)" @blur="$emit('blur', $event)"
    >
    <input
      v-else-if="schema.meta.role === 'date'"
      type="date"
      :disabled="disabled"
      :value="config"
      @change="config = ($event.target as HTMLInputElement).value"
      @focus="$emit('focus', $event)" @blur="$emit('blur', $event)"
    >
    <input
      v-else-if="schema.meta.role === 'datetime'"
      type="datetime-local"
      :disabled="disabled"
      :value="config"
      @change="config = ($event.target as HTMLInputElement).value"
      @focus="$emit('focus', $event)" @blur="$emit('blur', $event)"
    >
    <fluent-text-input
      v-else
      :value="config ?? ''"
      :disabled="disabled || undefined"
      :class="{ minimal, nullable, invalid }"
      :style="{ width: minimal ? '100%' : isLink ? '16rem' : '12rem' }"
      :type="type"
      @change="config = ($event.target as HTMLInputElement).value"
      @focus="$emit('focus', $event)" @blur="$emit('blur', $event)"
    >
      <template v-if="isLink">
        <span :slot="'end'" class="suffix-icon" @click="onClickExternal(config)">
          <IconExternal />
        </span>
      </template>
      <template v-else-if="schema.meta.role === 'secret'">
        <span :slot="'end'" class="suffix-icon" @click="showPass = !showPass">
          <IconEye v-if="showPass" />
          <IconEyeSlash v-else />
        </span>
      </template>
      <template v-if="invalid">
        <span :id="invalidAnchorId" :slot="'end'" class="suffix-icon">
          <IconInvalid class="invalid" />
        </span>
        <fluent-tooltip :anchor="invalidAnchorId" positioning="above">
          {{ t(...invalid) }}
        </fluent-tooltip>
      </template>
    </fluent-text-input>
  </template>

  <template v-else-if="schema.type === 'union'">
    <fluent-dropdown
      :disabled="disabled || undefined"
      @change="onSelectChange($event)"
      @focus="$emit('focus', $event)"
      @blur="$emit('blur', $event)"
    >
      <fluent-listbox>
        <fluent-option
          v-for="(item, index) in schema.list"
          :key="index"
          :value="String(index)"
          :selected="selectModel === String(index) || undefined"
          :disabled="item.meta.disabled || undefined"
        >
          {{ tt(item.meta.description) || item.value }}
          <k-badge v-for="{ text, type: btype } in item.meta.badges || []" :type="btype">
            {{ t(`badge.${text}`) }}
          </k-badge>
        </fluent-option>
      </fluent-listbox>
    </fluent-dropdown>
  </template>

  <template v-else-if="schema.type === 'array' || schema.type === 'bitset'">
    <div class="k-multiselect-checkboxes">
      <fluent-checkbox
        v-for="item in items"
        :key="item.value"
        :checked="values.includes(item.value) || undefined"
        :disabled="item.meta.disabled || undefined"
        @change="toggleValue(item.value, ($event.target as HTMLInputElement).checked)"
      >
        {{ tt(item.meta.description) || item.value }}
        <k-badge v-for="{ text, type: btype } in item.meta.badges || []" :type="btype">
          {{ t(`badge.${text}`) }}
        </k-badge>
      </fluent-checkbox>
    </div>
  </template>
</template>

<style lang="scss">
.k-schema-item {
  fluent-text-input {
    .suffix-icon {
      display: flex;
      width: 1rem;
      justify-content: center;
      align-items: center;
      margin-left: 6px;
    }

    .k-icon {
      color: var(--k-text-light);
      transition: var(--color-transition);
      cursor: pointer;
      height: 0.75rem;

      &:hover {
        color: var(--k-text-dark);
      }

      &.invalid {
        cursor: auto;
        color: var(--k-color-danger);
      }
    }

    &.nullable:not(:focus-within)::part(root)::before {
      content: '';
      display: block;
      position: absolute;
      top: 50%;
      width: 40%;
      border-top: 1px solid var(--colorNeutralStroke1);
    }
  }

  fluent-switch.nullable {
    --switch-track-background: transparent;
    border: 1px solid var(--colorNeutralStroke1);
  }
}

.k-multiselect-checkboxes {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
</style>
