import { Title3 } from '@fluentui/react-components'

import { ViewBox } from '@renderer/components/ViewBox'

import { SettingsAbout } from './About'

export const SettingsView = () => <>
  <ViewBox style={{
    flexDirection: 'column',
  }} transparent>
    <Title3 as='span' style={{
      marginBottom: '10px',
    }}>Settings</Title3>
    <SettingsAbout />
  </ViewBox>
</>
