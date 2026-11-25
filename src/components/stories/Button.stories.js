import { fn, expect, userEvent, within } from "storybook/test";
import Button from "../ui/Button.vue";

export default {
  title: "UI/Button",
  component: Button,
  tags: ["autodocs"],
  args: { onClick: fn() },
  argTypes: {
    symbol: { control: "text" },
    content: { control: "text" },
    to: { control: "text" },
    isDelete: { control: "boolean" },
    isReset: { control: "boolean" },
  },
};

export const Default = {
  args: { content: "Click me" },
};

export const WithSymbol = {
  args:{ content: "Next", symbol: "f" },
};

// A `to` prop renders a <RouterLink>, which is an <a>
export const RouterLinkButton = {
  args: { content: "Go to lesson 2", to: "/lesson2" },
  play: async ({ canvasElement }) => {
    const link = within(canvasElement).getByRole("link");
    await expect(link).toHaveAttribute("href", "/lesson2");
  },
};

// An href attribute renders a plain <a>
export const PlainLink = {
  args: { content: "Return to top", href: "#" },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole("link")).toHaveAttribute(
      "href",
      "#",
    );
  },
};

export const Delete = {
  args: { isDelete: true },
};

export const Reset = {
  args: { isReset: true },
};

export const Disabled = {
  args: { content: "Can't click", disabled: true },
  play: async ({ canvasElement, args }) => {
    const button = within(canvasElement).getByRole("button");
    await expect(button).toBeDisabled();
    await userEvent.click(button, { pointerEventsCheck: 0 });
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};

export const Clicks = {
  args: { content: "Click me" },
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByRole("button"));
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};
