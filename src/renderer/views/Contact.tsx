import { List } from '@renderer/components/List'
import { ViewBox } from '@renderer/components/ViewBox'

export const ContactView = () => <>
  <ViewBox fixed width="260px">
    <List line="two" style={{
      margin: '0 -12px',
    }}>
      <List.Item key={'key1'} title="Shigma" avatar subtitle="世革马" />
    </List>
  </ViewBox>
  <ViewBox>
    Contact
  </ViewBox>
</>
