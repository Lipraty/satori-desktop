import { useState } from 'react'
import { Button, Card, CardFooter, CardHeader, CardPreview, Subtitle2, Body1, PresenceBadgeStatus, Avatar, Tooltip } from '@fluentui/react-components'

import { ViewBox } from '@renderer/components/ViewBox'
import { Icon } from '@renderer/components/Icon'

import './style.scss'

const fakeData = [
  {
    title: 'My Network1',
    adapter: 'satori',
    connect: true,
    status: 1,
    up: 0,
    down: 10
  },
  {
    title: 'My Network2',
    adapter: 'onebot',
    connect: false,
    status: 0,
    up: 0,
    down: 0
  },
  {
    title: 'My Network3',
    adapter: 'onebot',
    connect: true,
    status: 4,
    up: 0,
    down: 10
  },
  {
    title: 'My Network4',
    adapter: 'discrod',
    connect: true,
    status: 1,
    up: 0,
    down: 4
  },
  {
    title: 'My Network5',
    adapter: 'discord',
    connect: false,
    status: 0,
    up: 0,
    down: 0
  },
  {
    title: 'My Network6',
    adapter: 'satori',
    connect: false,
    status: 0,
    up: 0,
    down: 0
  },
  {
    title: 'My Network7',
    adapter: 'telegrame',
    connect: false,
    status: 0,
    up: 0,
    down: 0
  },
]

interface NetworkData {
  title: string
  adapter: string
  connect: boolean
  status: number
  up: number
  down: number
}

const StatusMap: Array<PresenceBadgeStatus> = [
  'offline', // 0 offline
  'available', // 1 online
  'away', // 2 connect
  'out-of-office', // 3 disconnect
  'away', // 4 reconnect
]

const StatusTextMap: Array<string> = [
  'offline', // 0 offline
  'online', // 1 online
  'connecting', // 2 connect
  'disconnect', // 3 disconnect
  'reconnecting', // 4 reconnect
]

export const NetworksView = () => {
  const [networks, setNetworks] = useState<NetworkData[]>([])

  const handleAddNetwork = () => {
    setNetworks(fakeData)
  }

  return (<>
    <ViewBox title='Networks' titleAppend={
      <Button shape='circular' appearance='transparent' icon={<Icon name='PlugConnectedAdd' bundle/>} />
    }>
      {
        networks.length > 0
          ? <div className='networks'>
            {
              networks.map((data) =>
                <Card className='networks-container'>
                  <CardHeader header={
                    <div className='networks-header'>
                      <Tooltip content={StatusTextMap[data.status]} relationship='label'>
                        <Avatar
                          name={data.title}
                          color="colorful"
                          badge={{
                            status: StatusMap[data.status],
                          }}
                        />
                      </Tooltip>
                      <Subtitle2 className='networks-header__title'>{data.title}</Subtitle2>
                      <Button appearance='transparent' icon={<Icon bundle name={data.connect ? 'Stop' : 'Play'} />} />
                    </div>
                  } />
                  <CardPreview>
                    <div className='networks-content'>
                      <div data-center>
                        <Icon name='PlugConnected' sized='20' /><Body1>{data.adapter}</Body1>
                      </div>
                    </div>
                  </CardPreview>
                  <CardFooter>
                    <div className='networks-footer'>
                      {data.status === 1 ? <div data-center><Icon name='CaretUp' sized='20' />{data.up} <Icon name='CaretDown' sized='20' /> {data.down}</div> : <div />}
                      <Button appearance='transparent' icon={<Icon bundle name='Settings' />} />
                    </div>
                  </CardFooter>
                </Card>)
            }
          </div>
          : <div className='networks-empty' onClick={handleAddNetwork}>
            <Icon name='PlugDisconnected' sized='unsized' style={{
              width: '96px',
              height: '96px',
            }}/>
            <Subtitle2 style={{opacity: '0.5', marginBottom: '3rem'}}>Add your first network</Subtitle2>
          </div>
      }
    </ViewBox>
  </>)
}
