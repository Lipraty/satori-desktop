import { Elementer } from "..";

Elementer.addHandle('chronocat:poke', (element) => {
  const { attrs } = element
  return <span className="elementer-chronocat-poke">@{attrs.userId} poked by @{attrs.operatorId}</span>
})
Elementer.addHandle(['chronocat:marketface', 'chronocat:face'], (element) => {
  return <div style={{
    width: '150px',
    height: '150px',
  }}>
    {element.children.map(Elementer.renderer)}
  </div>
})
