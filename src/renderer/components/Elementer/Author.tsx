import { Avatar } from "@fluentui/react-components"

export const EAuthor = ({ id, avatar, name }) => {
  return (
    <div className="elementer-author">
      <Avatar image={{
        src: avatar,
      }}
        name={name}
        size={28}
      /> <span>{name}</span>
    </div>
  )
}