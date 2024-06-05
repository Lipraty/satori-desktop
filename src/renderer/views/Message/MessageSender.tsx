import { useMemo, useState } from "react"
import { Button } from "@fluentui/react-components"
import { Editor } from "@shikitor/react"
import provideCompletions from '@shikitor/core/plugins/provide-completions'
import providePopup from '@shikitor/core/plugins/provide-popup'
import provideSelectionToolbox from '@shikitor/core/plugins/provide-selection-toolbox'
import selectionToolboxForMd from '@shikitor/core/plugins/selection-toolbox-for-md'
import codeStyler from '@shikitor/core/plugins/code-styler'

import { Icon } from "@renderer/components/Icon"
import { useThemeListener } from "@renderer/hooks/use-theme-listener"
import './style.scss'
import '@shikitor/react/index.css'
import '@shikitor/core/plugins/provide-completions.css'
import '@shikitor/core/plugins/provide-popup.css'
import '@shikitor/core/plugins/provide-selection-toolbox.css'

export interface MessageSenderProps {
  messageText: string
  setMessageText: (value: string) => void
}

const getTheme = () => useThemeListener() ? 'dark' : 'light'

export const MessageSender = () => {
  const bundledEditorPlugins = [
    providePopup,
    provideCompletions({
      popupPlacement: 'bottom',
      footer: false
    }),
    provideSelectionToolbox,
    selectionToolboxForMd,
    codeStyler
  ]

  const [theme, setTheme] = useState(getTheme())

  return (<div className='message-sender'>
    <div className='message-sender__actions'>
      <Button appearance='transparent' icon={<Icon name='TextEditStyle' bundle />} />
      <Button appearance='transparent' icon={<Icon name='Image' bundle />} />
      <Button appearance='transparent' icon={<Icon name='Attach' bundle />} />
      <Button appearance='transparent' icon={<Icon name='Emoji' bundle />} />
      <div style={{
        flex: '1',
        maxWidth: '100%'
      }} />
      <Button appearance='transparent' icon={<Icon name='ChevronUpDown' bundle />} />
    </div>
    <span className="message-sender-input">
      <div className="message-sender-input__content">
        <Editor plugins={bundledEditorPlugins} options={useMemo(() => ({
          theme: `github-${theme}` as 'github-light' | 'github-dark',
          language: 'markdown',
          lineNumbers: 'off',
          placeholder: 'Type a message...',
          autoSize: { maxRows: 115, minRows: 1 }
        }), [])} />
      </div>
      <span className='message-sender-input__contentAfter'>
        <Button appearance='transparent' icon={<Icon name='Send' bundle />} />
      </span>
    </span>
  </div>)
}
