import { Avatar } from "@fluentui/react-components"

export const EAuthor = ({ id, avatar, name }: { id: string, avatar: string, name: string }) => {
  return (
    <div className="elementer-author">
      {/* <Avatar image={{
        src: avatar,
      }}
        name={name}
        style={{
          width: '1.5rem',
          height: '1.5rem',
        }}
      /> */}
      <span>{name}</span>
    </div>
  )
}