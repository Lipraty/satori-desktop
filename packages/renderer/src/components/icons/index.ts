import { defineComponent, h, PropType } from 'vue'
import { icons } from './map'

export type IconName = Exclude<keyof typeof icons, `Filled${string}`>

export default defineComponent({
  name: 'SatoriIcon',
  props: {
    name: String as PropType<IconName>,
    filled: {
      type: Boolean,
      default: false
    },
    size: {
      type: [String, Number],
      default: 24
    },
  },
  setup(props) {
    const icon = props.filled ? `Filled${props.name}` : props.name
    const Icon = icons[icon]
    return () => {
      if (!Icon) {
        return null
      }
      return h('div', {
        class: 'satori-icon',
        style: {
          width: props.size,
          height: props.size,
          display: 'inline-flex',
          justifyContent: 'center',
          alignItems: 'center'
        },
        innerHTML: Icon.replace(/(<svg[^>]*)/, (match) => {
          return `${match} width="${props.size}" height="${props.size}"`;
        }),
      })
    }
  },
})
