import { MessagingList } from '@renderer/components/MessageList'
import { ViewBox } from '@renderer/components/ViewBox'

export const MessagingView = () => <>
  <MessagingList />
  <ViewBox style={{
    flexDirection: 'column',
  }}>
    <div>
      <h2>Shigma</h2>
    </div>
    <div style={{
      maxHeight: '100%',
      flex: '1 1 100%',
    }}>
      messages
    </div>
    <div>
      send message
    </div>
  </ViewBox>
</>
