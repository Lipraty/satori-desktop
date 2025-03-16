import { Title3 } from '@fluentui/react-components'

import { ViewBox } from '@renderer/components/ViewBox'

import { SettingsAbout } from './About'

export const SettingsView = () => <>
  <ViewBox title='Settings' transparent>
    <SettingsAbout />
  </ViewBox>
</>
