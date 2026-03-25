import type {
  Accordion,
  AccordionItem,
  Badge,
  Button,
  Checkbox,
  Dialog,
  DialogBody,
  Divider,
  Dropdown,
  DropdownOption,
  Label,
  Listbox,
  Radio,
  RadioGroup,
  Slider,
  Switch,
  TextArea,
  TextInput,
  Tooltip,
} from '@fluentui/web-components'

interface WC<T> { new(): T }

declare module 'vue' {
  interface GlobalComponents {
    FluentAccordion: WC<Accordion>
    FluentAccordionItem: WC<AccordionItem>
    FluentBadge: WC<Badge>
    FluentButton: WC<Button>
    FluentCheckbox: WC<Checkbox>
    FluentDialog: WC<Dialog>
    FluentDialogBody: WC<DialogBody>
    FluentDivider: WC<Divider>
    FluentDropdown: WC<Dropdown>
    FluentOption: WC<DropdownOption>
    FluentLabel: WC<Label>
    FluentListbox: WC<Listbox>
    FluentRadio: WC<Radio>
    FluentRadioGroup: WC<RadioGroup>
    FluentSlider: WC<Slider>
    FluentSwitch: WC<Switch>
    FluentTextArea: WC<TextArea>
    FluentTextInput: WC<TextInput>
    FluentTooltip: WC<Tooltip>
    // fluent-text is not a registered component; treated as generic inline element
    FluentText: WC<HTMLElement>
  }
}
