import { Persona } from '@fluentui/react-components'

import { List } from '@renderer/components/List'
import { ViewBox } from '@renderer/components/ViewBox'

export const ContactView = () => <>
  <ViewBox fixed width="220px" rightRadius>
    <List line="one" style={{
      margin: '0 -12px',
    }}>
      <List.Item key={'key1'}>
        <Persona 
          name='Shigma'
          secondaryText="这是世革马"
          presence={{
            status: 'available',
          }}
        />
      </List.Item>
    </List>
  </ViewBox>
  <ViewBox>
    Contact
  </ViewBox>
</>
