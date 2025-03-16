import { Subtitle2, Text } from '@fluentui/react-components'

import { ExpansionPanels, ExpansionPanel } from '@renderer/components/ExpansionPanels'

import { version } from '../../../../package.json'

export const SettingsAbout = () => <>
  <ExpansionPanels>
    <ExpansionPanel title="Pannel 1" subtitle='subtitle' icon='Info'>
      <Text>some context</Text>
    </ExpansionPanel>
  </ExpansionPanels>
  <ExpansionPanels>
    <Subtitle2>About</Subtitle2>
    <ExpansionPanel title="Satori" subtitle='subtitle' icon='Info'>
      <Text>Satori is a modern desktop application for Koishi Chat</Text>
      <Text>Version: {version}</Text>
    </ExpansionPanel>
    <ExpansionPanel title="License">
      <Text>This project is under in AGPL3.0 License.</Text>
    </ExpansionPanel>
  </ExpansionPanels>
</>
